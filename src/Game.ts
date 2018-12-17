import {
  DApp,
  DAppParams,
  PlayParams,
  ConnectParams,
  IDAppPlayerInstance
} from "@daocasino/dc-core"
import {
  IGame,
  PlayResult,
  ConnectResult,
  InitGameParams,
  DisconnectResult
} from "./interfaces/IGame"
import { Logger } from "@daocasino/dc-logging"
import { IConfig, config } from "@daocasino/dc-configs"
import { dec2bet, ETHInstance } from "@daocasino/dc-ethereum-utils"
import { TransportProviderFactory, IMessagingProvider } from "@daocasino/dc-messaging"
import fetch from "cross-fetch"
const log = new Logger("Game:")

export default class Game implements IGame {
  private _Eth: ETHInstance
  private _params: InitGameParams
  private _GameInstance: IDAppPlayerInstance
  public configuration: IConfig

  constructor(params: InitGameParams) {
    this._params = params
    this._Eth = this._params.Eth
    this.configuration = params.config
    log.info(`Game ${this._params.name} created!`)
  }

  /** Create and return messaging provider */
  async _initMessaging(): Promise<IMessagingProvider> {
    const factory = new TransportProviderFactory()
    const transportProvider = await factory.create()
    return transportProvider
  }

  async _stopMessaging(): Promise<void> {
    // await IpfsTransportProvider.destroy()  // TODO: !!!!!!
  }

  /**
   * Matching channel state and
   * return channel status in readable
   * the form
   */
  _getChannelStatus(channelState: string): string {
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
    this._GameInstance.on(event, func)
  }

  getGameContractAddress(): string {
    return this._params.gameContractAddress
  }

  async stop(): Promise<void> {
    return this._stopMessaging()
  }

  async start(params: ConnectParams): Promise<void> {
    const userBalance = await this._params.Eth.getBalances()
    if (typeof this._Eth.getAccount().address === "undefined") {
      throw new Error(
        "Account is not defined please create new account and start game again"
      )
    }
    const { playerDeposit } = params

    if (userBalance.bet.balance < playerDeposit) {
      throw new Error(
        "Insufficient BET funds on your account. Try to set up a lower deposit."
      )
    }
    const self = this
    const transportProvider = await this._initMessaging()
    const { platformId, blockchainNetwork } = this.configuration
    const { gameLogicFunction, name, rules } = this._params

    let { gameContractAddress } = this._params

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
      roomProvider: transportProvider,
      Eth: this._Eth
    }

    const dapp = new DApp(dappParams)
    dapp.on("dapp::status", data => {
      self._params.eventEmitter.emit("webapi::status", data)
    })
    this._GameInstance = await dapp.startClient()
    this._GameInstance.on("instance::status", data => {
      self._params.eventEmitter.emit("webapi::status", {
        message: "event from instance",
        data
      })
    })
    self._params.eventEmitter.emit("webapi::status", {
      message: "Game ready to connect",
      data: {}
    })
    log.info(`Game ready to connect`)
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    this._params.eventEmitter.emit("webapi::status", {
      message: "client try to connect",
      data: {}
    })
    /** parse deposit and game data of method params */
    const { playerDeposit } = params

    /** Start connect to the game */
    const gameConnect = await this._GameInstance.connect({ playerDeposit })

    /** Check channel state */
    if (this._getChannelStatus(gameConnect.state) === "opened") {
      this._params.eventEmitter.emit("connectionResult", {
        message: "connect to bankroller succefull"
      })
      log.info(`Channel  ${gameConnect.channelId} opened! Go to game!`)
      /** Generate and return data for connected results */
      return {
        channelID: gameConnect.channelId,
        channelState: this._getChannelStatus(gameConnect.state),
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
    const callPlayResults = await this._GameInstance.play({
      userBets,
      gameData
    })

    /** Get state channel balances */
    const {
      player,
      bankroller
    } = this._GameInstance.getChannelStateData().balance

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
    const gameDisconnect = await this._GameInstance.disconnect()

    /** Check channel state */
    if (this._getChannelStatus(gameDisconnect.state) === "closed") {
      log.info(`Channel ${gameDisconnect._id} closed and Game Over`)
      /** Generate and return data for connected results */
      return {
        channelID: gameDisconnect._id,
        channelState: this._getChannelStatus(gameDisconnect.state),
        resultBalances: {
          bankroller: dec2bet(gameDisconnect._bankrollerBalance),
          player: dec2bet(gameDisconnect._playerBalance)
        }
      }
    }
  }
}
