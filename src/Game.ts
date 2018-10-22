import {
  // PlayParams,
  DApp,
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
import { config } from 'dc-configs'
import { dec2bet, Eth } from 'dc-ethereum-utils'
import { IpfsTransportProvider, IMessagingProvider } from "dc-messaging"

const log = new Logger('Game:')

export class Game implements IGame {
  private _Eth: Eth
  private _params: InitGameParams
  private _GameInstance: IDAppPlayerInstance

  constructor(params: InitGameParams) {
    this._params = params
    this._Eth = this._params.Account.getEthInstance()
    log.info(`Game ${this._params.name} created!`)
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

  async start(): Promise<void> {
    const transportProvider = await this._initMessaging()
    const { platformId, blockchainNetwork } = config
    const { contract, gameLogicFunction, name, rules } = this._params
    const dappParams = {
      slug: name,
      platformId,
      blockchainNetwork,
      contract,
      rules,
      roomProvider: transportProvider,
      gameLogicFunction,
      Eth: this._Eth
    }

    const dapp = new DApp(dappParams)
    this._GameInstance = await dapp.startClient()

    log.info(`Game ready to connect`)
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    /** parse deposit and game data of method params */
    const { playerDeposit, gameData } = params
    
    /** Start connect to the game */
    const gameConnect = await this._GameInstance
      .connect({ playerDeposit, gameData })
    
    /** Check channel state */
    if (this._getChannelStatus(gameConnect.state) === 'opened') {
      log.info(`Channel  ${gameConnect.channelId} opened! Go to game!`)
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
  //     balances: this._GameInstance.channelState.getData().balance,
  //     randomNums: callPlayResults.randoms
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