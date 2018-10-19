import {
  // PlayParams,
  DAppFactory,
  ConnectParams,
  IDAppPlayerInstance
} from 'dc-core'
import {
  IGame,
  // PlayResult,
  ConnectResult,
  InitGameParams,
  DisconnectResult
} from './interfaces/IGame'
import { Logger } from 'dc-logging'
import { dec2bet } from 'dc-ethereum-utils'
import { IpfsTransportProvider, IMessagingProvider } from "dc-messaging"

const log = new Logger('Game:')

export class Game implements IGame {
  private _params: InitGameParams
  private _DAppFactory: DAppFactory
  private _GameInstance: IDAppPlayerInstance

  constructor(params: InitGameParams) {
    this._params = params
    this._initMessaging()
      .then(async messagingProvider => {
        this._DAppFactory = new DAppFactory(messagingProvider)
        this._GameInstance = await this._DAppFactory.startClient(this._params)
        log.info(`Game ${this._params.name} inited!`)
      })
  }

  /** Create and return messaging provider */
  async _initMessaging(): Promise<IMessagingProvider> {
    const transportProvider = await IpfsTransportProvider.create()
    return transportProvider
  }

  /**
   * Matching channel state and
   * return channel status in readable
   * the form
   */
  _getChannelStatus(channelState: string): string {
    switch(channelState) {
      case '0':
        return 'unused'
      case '1':
        return 'opened'
      case '2':
        return 'closed'
      case '3':
        return 'dispute'
      default:
        throw new Error(`unknown channel state: ${channelState}`)
    }
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    /** parse deposit and game data of method params */
    const { playerDeposit, gameData } = params
    
    /** Start connect to the game */
    const gameConnect = await this._GameInstance
      .connect({ playerDeposit, gameData })
    
    /** Check channel state */
    if (this._getChannelStatus(gameConnect.state) === 'opened') {
      /** Generate and return data for connected results */
      return {
        channelID: gameConnect.channelId,
        channelState: this._getChannelStatus(gameConnect.state),
        dealerAddress: gameConnect.bankrollerAddress,
        playerAddress: gameConnect.playerAddress,
        channelBalances: {
          dealer: dec2bet(gameConnect.bankrollerDepositWei),
          player: dec2bet(gameConnect.playerDepositWei)
        }
      }
    }
  }

  // async play(params: PlayParams): Promise<PlayResult> {
  //   /** Parse params */
  //   const { userBet, gameData, rndOpts } = params
  //   /** Call play method */
  //   const callPlayResults = await this._GameInstance.play({ userBet, gameData, rndOpts })

  //   /** Generate results and return */
  //   return {
  //     params,
  //     profit: callPlayResults.profit,
  //     balances: callPlayResults.balances,
  //     randomNums: callPlayResults.random
  //   }
  // }

  async disconnect(): Promise<DisconnectResult> {
    /** Start game disconnect */
    const gameDisconnect = await this._GameInstance.disconnect()
    
    /** Check channel state */
    if (this._getChannelStatus(gameDisconnect.state) === 'closed') {
      log.info(`Channel ${gameDisconnect._id} closed and Game Over`)
      /** Generate and return data for connected results */
      return {
        channelID: gameDisconnect._id,
        channelState: this._getChannelStatus(gameDisconnect.state),
        resultBalances: {
          dealer: dec2bet(gameDisconnect._bankrollerBalance),
          player: dec2bet(gameDisconnect._playerBalance)
        }
      }
    }
  }
}