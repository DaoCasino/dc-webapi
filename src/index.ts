
import Game from "./Game"
import Account from "./Account"
import {
  IGame,
  ReadyInstnce,
  WebapiInstance,
  AccountInstance
} from "./interfaces"
import { devTools } from './DevTools'
import { BlockchainUtilsInstance } from '@daocasino/dc-blockchain-types'
import Events, { EventsInstance, checkEnviroment } from '@daocasino/dc-events'
import walletFactory, { WalletInstance } from '@daocasino/dc-wallet'
import { Logger } from '@daocasino/dc-logging'
import { config, setDefaultConfig, IConfigOptions } from '@daocasino/dc-configs'

const log = new Logger('WebAPI:')

export default class DCWebapi implements WebapiInstance {
  private ETH: BlockchainUtilsInstance
  private wallet: WalletInstance
  private gameEnv: string
  private ApiEvents: EventsInstance
  private initParams: IConfigOptions

  public account: AccountInstance
  public game: IGame

  constructor(
    initParams?: IConfigOptions,
    callback?: (instance: DCWebapi) => void
  ) {
    this.gameEnv = process.env.DC_GAME_ENV
    this.initParams = initParams
    this.ApiEvents = new Events

    if (callback) {
      this.on('ready', callback)
    }
  }

  on(
    eventName: string,
    eventHandler: (data: any) => void
  ) {
    if (this.ApiEvents.listenerCount(eventName) >= 1) {
      log.warn(`Dublicate listener with name: ${eventName}`)
      return
    }

    this.ApiEvents.on(eventName, eventHandler)
    if (eventName === 'ready') {
      this.configurateParams()
    }
  }

  private async configurateParams(): Promise<void> {
    const { isIframe } = checkEnviroment()
    switch (true) {
      case isIframe:
        const params = await this.ApiEvents.request({ eventName: 'getParams' })
        setDefaultConfig(params)
        break        
      case (typeof this.initParams === 'undefined'):
        throw new Error('initParams is not define')
      default:
        setDefaultConfig(this.initParams)
    }

    const {
      blockchainType,
      blockchainNetwork,
      platformId,
      customWeb3HttpProviderUrl
    } = this.initParams
    
    this.wallet = await walletFactory({
      blockchainType,
      blockchainNetwork,
      platformId,
      customWeb3HttpProviderUrl
    })
    
    if (this.gameEnv === 'development') {
      devTools(this.wallet, this.ApiEvents)
    }
    
    await this.webapiStart()
  }

  init(): Promise<ReadyInstnce> {
    return new Promise((resolve, reject) => {
      this.on('ready', instance => {
        resolve({
          game: instance.game,
          account: instance.account
        })
      })

      setTimeout(() => {
        reject(new Error('timeout ready event'))
      }, 10000)
    })
  }

  private async webapiStart(): Promise<void> {
    const { privateKey } = this.initParams
    this.ETH = this.wallet.configuration.blockchainUtils
    this.account = new Account({
      wallet: this.wallet,
      config: config.default,
      eventEmitter: this.ApiEvents
    })

    const playerAddress = await this.account.init(privateKey)

    this.game = new Game({
      Eth: this.ETH,
      playerAddress,
      playerSign: this.account.playerSign.bind(this.account),
      config: config.default,
      wallet: this.wallet,
      eventEmitter: this.ApiEvents
    })

    this.ApiEvents.emit('ready', this)
  }
}

export { ConnectResult, DisconnectResult, IGame } from './interfaces/IGame'
