import {
  DApp,
  DAppParams,
  PlayParams,
  ConnectParams,
  IDAppPlayerInstance
} from "dc-core"
import {
  IGame,
  PlayResult,
  ConnectResult,
  InitGameParams,
  DisconnectResult
} from "./interfaces/IGame"
import { Logger } from "dc-logging"
import { IConfig, config } from "dc-configs"
import { dec2bet, ETHInstance } from "dc-ethereum-utils"
import { TransportProviderFactory, IMessagingProvider } from "dc-messaging"
import { EventEmitter } from "events"
import fetch from "cross-fetch"
const log = new Logger("Game:")

export default class Game extends EventEmitter implements IGame {
  private _Eth: ETHInstance
  private _params: InitGameParams
  private _GameInstance: IDAppPlayerInstance
  public configuration: IConfig

  constructor(params: InitGameParams) {
    super()
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

  async start(): Promise<void> {
    if (typeof this._Eth.getAccount().address === "undefined") {
      throw new Error(
        "Account is not defined please create new account and start game again"
      )
    }
    const self = this
    const transportProvider = await this._initMessaging()
    const { platformId, blockchainNetwork } = this.configuration
    const { gameLogicFunction, name, rules } = this._params

    let { gameContractAddress } = this._params
    if (gameContractAddress.indexOf("->") > -1 && blockchainNetwork === 'local') {
      gameContractAddress = await fetch(gameContractAddress.split("->")[0])
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
      self.emit("webapi::status", data)
    })
    this._GameInstance = await dapp.startClient()
    this._GameInstance.on("instance::status", data => {
      self.emit("webapi::status", { message: "event from instance", data })
    })
    this.emit("webapi::status", { message: "Game ready to connect", data: {} })
    log.info(`Game ready to connect`)
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    this.emit("webapi::status", { message: "client try to connect", data: {} })
    /** parse deposit and game data of method params */
    const { playerDeposit, gameData } = params

    /** Start connect to the game */
    const gameConnect = await this._GameInstance.connect({
      playerDeposit,
      gameData
    })

    /** Check channel state */
    if (this._getChannelStatus(gameConnect.state) === "opened") {
      this.emit("connectionResult", {
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
    const { userBet, gameData, rndOpts } = params
    /** Call play method */
    const callPlayResults = await this._GameInstance.play({
      userBet,
      gameData,
      rndOpts
    })

    /** Get state channel balances */
    const {
      player,
      bankroller
    } = this._GameInstance.getChannelStateData().balance

    /** Generate results and return */
    const playResult: PlayResult = {
      params,
      profit: callPlayResults.profit,
      balances: {
        player: dec2bet(player),
        bankroller: dec2bet(bankroller)
      },
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
