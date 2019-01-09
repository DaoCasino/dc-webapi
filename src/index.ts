import Game from "./Game"
import Account from "./Account"
import {
  IGame,
  ReadyInstnce,
  WebapiInstance,
  AccountInstance
} from "./interfaces"
import { Eth } from "@daocasino/dc-ethereum-utils"
import { walletFactory, Events, EventsInstance, WalletAccountsInstance } from '@daocasino/dc-wallet'
import { Logger } from '@daocasino/dc-logging'
import { config, setDefaultConfig, IConfigOptions } from "@daocasino/dc-configs"

const log = new Logger('WebAPI:')

export default class DCWebapi implements WebapiInstance {
  private ETH: Eth
  private wallet: WalletAccountsInstance
  private initParams: IConfigOptions
  private ApiEvents: EventsInstance
  
  public account: AccountInstance
  public game: IGame

  constructor(
    initParams?: IConfigOptions,
    callback?: (instance: DCWebapi) => void
  ) {
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
    if (
      !this.ApiEvents.getEnviroment().isIframe ||
      typeof this.initParams !== 'undefined'
    ) {
      setDefaultConfig(this.initParams)
    } else {
      const params = await this.ApiEvents.request('getParams')
      setDefaultConfig(params)
    }
    
    this.wallet = await walletFactory(this.initParams)
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
    const {
      walletName,
      gasPrice: price,
      gasLimit: limit,
      web3HttpProviderUrl: httpProviderUrl,
      contracts,
      privateKey
    } = config.default

    this.ETH = new Eth({
      walletName,
      httpProviderUrl,
      gasParams: { price, limit },
      ERC20ContractInfo: contracts.ERC20
    })
    
    this.account = new Account({
      wallet: this.wallet,
      config: config.default,
      eventEmitter: this.ApiEvents
    })
    
    this.game = new Game({
      Eth: this.ETH,
      config: config.default,
      eventEmitter: this.ApiEvents
    })

    if (!this.ApiEvents.getEnviroment().isIframe) {
      this.account.init(
        config.default.standartWalletPass,
        config.default.privateKey
      )
    }
    
    this.ApiEvents.emit('ready', this)
  }  
}
