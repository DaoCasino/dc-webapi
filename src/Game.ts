import {
  DApp,
  IDApp,
  DAppParams,
  PlayParams,
  ConnectParams,
  IDAppPlayerInstance
} from "@daocasino/dc-core"
import {
  IGame,
  PlayResult,
  ConnectResult,
  DisconnectResult,
  CreateGameParams,
  InitGameInstanceParams,
} from "./interfaces/IGame"
import { Logger } from "@daocasino/dc-logging"
import { IConfig, config } from "@daocasino/dc-configs"
import { dec2bet } from "@daocasino/dc-ethereum-utils"
import { BlockchainUtilsInstance } from "@daocasino/dc-blockchain-types"
import { TransportProviderFactory, IMessagingProvider } from "@daocasino/dc-messaging"
import fetch from "cross-fetch"

const log = new Logger("Game:")

export default class Game implements IGame {
  private ETH: BlockchainUtilsInstance
  private params: InitGameInstanceParams
  private GameInstance: IDAppPlayerInstance
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
    return (new TransportProviderFactory).create()
  }

  private stopMessaging(): Promise<void> {
    return this.transportProvider.destroy()
  }

  /**
   * Matching channel state and
   * return channel status in readable
   * the form
   */
  private getChannelStatus(channelState: string): string {
    switch (channelState) {
      case "0":
        return "unused"
      case "1":
        return "opened"
      case "2":
        return "closed"
      case "3":
        return "dispute"
      default:
        throw new Error(`unknown channel state: ${channelState}`)
    }
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

    let { gameContractAddress } = createGameParams

    if (
      blockchainNetwork === "local" &&
      gameContractAddress.indexOf("->") > -1
    ) {
      const { web3HttpProviderUrl } = config.default
      gameContractAddress = await fetch(
        `${web3HttpProviderUrl}/${gameContractAddress.split("->")[0]}`
      )
        .then(result => result.json())
        .then(result => result[gameContractAddress.split("->")[1]])
    }

    const dappParams: DAppParams = {
      slug: name,
      rules,
      platformId,
      blockchainNetwork,
      gameLogicFunction,
      gameContractAddress,
      roomProvider: this.transportProvider,
      Eth: this.ETH
    }

    this.DApp = new DApp(dappParams)
    this.DApp.on("dapp::status", data => {
      self.params.eventEmitter.emit("webapi::status", data)
    })
    log.info(`DApp ${createGameParams.name} created!`)
  }
  
  async connect(params: ConnectParams): Promise<ConnectResult> {
    if (typeof this.ETH.getAccount().address === "undefined") {
      throw new Error(
        "Account is not defined please create new account and start game again"
      )
    }

    const userBalance = await this.ETH.getBalances()
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

    /** Start connect to the game */
    const gameConnect = await this.GameInstance.connect({ playerDeposit })

    /** Check channel state */
    if (this.getChannelStatus(gameConnect.state) === "opened") {
      this.params.eventEmitter.emit("connectionResult", {
        message: "connect to bankroller succefull"
      })
      log.info(`Channel  ${gameConnect.channelId} opened! Go to game!`)
      /** Generate and return data for connected results */
      return {
        channelID: gameConnect.channelId,
        channelState: this.getChannelStatus(gameConnect.state),
        dealerAddress: gameConnect.bankrollerAddress,
        playerAddress: gameConnect.playerAddress,
        channelBalances: {
          bankroller: dec2bet(gameConnect.bankrollerDepositWei),
          player: dec2bet(gameConnect.playerDepositWei)
        }
      }
    }
  }

  async play(params: PlayParams): Promise<PlayResult> {
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
  }

  async disconnect(): Promise<DisconnectResult> {
    /** Start game disconnect */
    const gameDisconnect = await this.GameInstance.disconnect()

    /** Check channel state */
    if (this.getChannelStatus(gameDisconnect.state) === "closed") {
      log.info(`Channel ${gameDisconnect._id} closed and Game Over`)
      /** Generate and return data for connected results */
      return {
        channelID: gameDisconnect._id,
        channelState: this.getChannelStatus(gameDisconnect.state),
        resultBalances: {
          bankroller: dec2bet(gameDisconnect._bankrollerBalance),
          player: dec2bet(gameDisconnect._playerBalance)
        }
      }
    }
  }
}
