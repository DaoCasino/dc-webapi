import {
  DAppFactory,
  ConnectParams
} from 'dc-core'
import {
  ConnectResult,
  InitGameParams
} from './interfaces/IGame'
import { Logger } from 'dc-logging'
import { dec2bet } from 'dc-ethereum-utils'
import { IpfsTransportProvider, IMessagingProvider } from "dc-messaging"

const log = new Logger('Game:')

export class Game {
  private _params: InitGameParams
  private _DAppFactory: DAppFactory
  private _GameInstance: any

  constructor(params: InitGameParams) {
    this._params = params
    this.initMessaging()
      .then(messagingProvider => {
        this._DAppFactory = new DAppFactory(messagingProvider)
        this._GameInstance = this._DAppFactory.startClient(this._params)
        log.info(`Game ${this._params.name} inited!`)
      })
  }

  /** Create and return messaging provider */
  async initMessaging(): Promise<IMessagingProvider> {
    const transportProvider = await IpfsTransportProvider.create()
    return transportProvider
  }

  /**
   * Matching channel state and
   * return channel status in readable
   * the form
   */
  getChannelStatus(channelState: string): string {
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
        return channelState
    }
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    /** parse deposit and game data of method params */
    const { playerDeposit, gameData } = params
    
    /** Start connect to the game */
    const gameConnect = await this._GameInstance
      .connect({ playerDeposit, gameData })
    
    /** Generate and return data for connected results */
    return {
      channelID: gameConnect.channelId,
      channelState: this.getChannelStatus(gameConnect.state),
      dealerAddress: gameConnect.bankrollerAddress,
      playerAddress: gameConnect.playerAddress,
      channelBalances: {
        dealer: dec2bet(gameConnect.bankrollerDepositWei),
        player: dec2bet(gameConnect.playerDepositWei)
      }
    }
  }
}