import fetch from "cross-fetch"
import { Logger } from "@daocasino/dc-logging"
import { dec2bet } from "@daocasino/dc-ethereum-utils"
import { IConfig, config } from "@daocasino/dc-configs"
import { getChannelStatus } from '@daocasino/dc-wallet'
import { checkEnviroment } from '@daocasino/dc-events'
import { BlockchainUtilsInstance } from "@daocasino/dc-blockchain-types"
import { TransportProviderFactory, IMessagingProvider } from "@daocasino/dc-messaging"
import {
  DApp,
  IDApp,
  DAppParams,
  PlayParams,
  ConnectParams,
  IDAppPlayerInstance
} from '@daocasino/dc-core'
import {
  IGame,
  PlayResult,
  ConnectResult,
  DisconnectResult,
  CreateGameParams,
  InitGameInstanceParams,
} from "./interfaces/IGame"

const log = new Logger("Game:")

export default class Game implements IGame {
  private ETH: BlockchainUtilsInstance
  private params: InitGameInstanceParams
  private GameInstance: IDAppPlayerInstance
  private gameContractAddress: string
  private DApp: IDApp
  public configuration: IConfig
  private transportProvider: IMessagingProvider

  constructor(params: InitGameInstanceParams) {
    this.params = params
    this.ETH = this.params.Eth
    this.configuration = params.config
  }

  /** Create and return messaging provider */
  private initMessaging(): Promise<IMessagingProvider> {
    return (new TransportProviderFactory(this.configuration.transport)).create()
  }

  private stopMessaging(): Promise<void> {
    return this.transportProvider.destroy()
  }

  onGameEvent(event: string, func: (data: any) => void) {
    this.GameInstance.on(event, func)
  }

  async stop(): Promise<void> {
    return this.stopMessaging()
  }

  async createGame(createGameParams: CreateGameParams): Promise<void> {
    const self = this
    this.transportProvider = await this.initMessaging()

    const { platformId, blockchainNetwork } = this.configuration
    const { gameLogicFunction, name, rules } = createGameParams

    this.gameContractAddress = createGameParams.gameContractAddress

    if (
      blockchainNetwork === "local" &&
      this.gameContractAddress.indexOf("->") > -1
    ) {
      const { web3HttpProviderUrl } = config.default
      this.gameContractAddress = await fetch(
        `${web3HttpProviderUrl}/${this.gameContractAddress.split("->")[0]}`
      )
        .then(result => result.json())
        .then(result => result[this.gameContractAddress.split("->")[1]])
    }

    const dappParams: DAppParams = {
      slug: name,
      rules,
      platformId,
      blockchainNetwork,
      gameLogicFunction,
      playerSign: this.params.playerSign,
      gameContractAddress: this.gameContractAddress,
      userAddress: this.params.playerAddress,
      roomProvider: this.transportProvider,
      Eth: this.ETH
    }

    this.DApp = new DApp(dappParams)
    this.DApp.on('dapp::status', data => {
      self.params.eventEmitter.emit('webapi::status', data)
    })
    log.info(`DApp ${createGameParams.name} created!`)
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    try {
      const address = await this.params.eventEmitter.request({ eventName: 'getAddress' })
      if (typeof address === "undefined") {
        throw new Error(
          "Account is not defined please create new account and start game again"
        )
      }
  
      const userBalance = await this.params.eventEmitter.request({
        eventName: 'getBalance',
        eventData: address
      })
    
      const { playerDeposit } = params
      if (userBalance.bet.balance < playerDeposit) {
        throw new Error(
          "Insufficient BET funds on your account. Try to set up a lower deposit."
        )
      }
  
      const self = this
      this.GameInstance = await this.DApp.startClient()
      this.GameInstance.on("instance::status", data => {
        self.params.eventEmitter.emit("webapi::status", {
          message: "event from instance",
          data
        })
      })
      
      this.params.eventEmitter.emit("webapi::status", {
        message: "client try to connect",
        data: {}
      })
  
      const launchConnect = this.GameInstance.launchConnect({ playerDeposit })
      const { value: connectParams } = await launchConnect.next()
  
      await this.params.eventEmitter.request({
        eventName: 'openChannel',
        eventData: { ...connectParams, contractAddress: this.gameContractAddress }
      })
  
      const { value: connectResult } = await launchConnect.next()
  
      /** Check channel state */
      if (getChannelStatus(connectResult.state) === "opened") {
        this.params.eventEmitter.emit("connectionResult", {
          message: "connect to bankroller succefull"
        })
        log.info(`Channel  ${connectResult.channelId} opened! Go to game!`)
        /** Generate and return data for connected results */
        return {
          channelID: connectResult.channelId,
          channelState: getChannelStatus(connectResult.state),
          dealerAddress: connectResult.bankrollerAddress,
          playerAddress: connectResult.playerAddress,
          channelBalances: {
            bankroller: dec2bet(connectResult.bankrollerDepositWei),
            player: dec2bet(connectResult.playerDepositWei)
          }
        }
      }
    } catch(error) {
      throw error
    }
  }

  async play(params: PlayParams): Promise<PlayResult> {
    try {
      /** Parse params */
      const { userBets, gameData } = params
      /** Call play method */
      const callPlayResults = await this.GameInstance.play({
        userBets,
        gameData
      })
  
      /** Get state channel balances */
      const {
        player,
        bankroller
      } = this.GameInstance.getChannelStateData().balance
  
      /** Generate results and return */
      // TODO return all from callPlayResults
      const playResult: PlayResult = {
        params,
        profit: callPlayResults.profit,
        balances: {
          player: dec2bet(player),
          bankroller: dec2bet(bankroller)
        },
        data: callPlayResults.data,
        randomNums: callPlayResults.randoms
      }
  
      return playResult
    } catch(error) {
      throw error
    }
  }

  async disconnect(): Promise<DisconnectResult> {
    try {      
      /** Start game disconnect */
      const launchDisconnect = this.GameInstance.launchDisconnect()
      const { value: disconnectParams } = await launchDisconnect.next()
      const { lastState, consentSignature } = disconnectParams
  
      await this.params.eventEmitter.request({
        eventName: 'closeChannel',
        eventData: { ...lastState, consentSignature }
      })
  
      const { value: disconnectResult } = await launchDisconnect.next()
      log.info(disconnectResult)
      /** Check channel state */
      if (getChannelStatus(disconnectResult.state) === "closed") {
        log.info(`Channel ${disconnectResult._id} closed and Game Over`)
        /** Generate and return data for connected results */
        return {
          channelID: disconnectResult._id,
          channelState: getChannelStatus(disconnectResult.state),
          resultBalances: {
            bankroller: dec2bet(disconnectResult._bankrollerBalance),
            player: dec2bet(disconnectResult._playerBalance)
          }
        }
      }
    } catch(error) {
      throw error
    }
  }
}
