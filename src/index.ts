import Game from "./Game"
import Account from "./Account"
import ApiEvents from './ApiEvents'
import {
  ApiEventsInstance,
  CreateGameParams,
  AccountInstance,
  WebapiInstance,
  IGame
} from "./interfaces"
import { Eth } from "@daocasino/dc-ethereum-utils"
import { Logger } from '@daocasino/dc-logging'
import { config, setDefaultConfig, IConfigOptions } from "@daocasino/dc-configs"

const log = new Logger('WebAPI:')

export default class DCWebapi implements WebapiInstance {
  private ETH: Eth
  private initParams: IConfigOptions
  private ApiEvents: ApiEventsInstance
  
  public isIframe: boolean
  public isBrowser: boolean
  public account: AccountInstance
  public game: IGame

  constructor(initParams?: IConfigOptions) {
    if (typeof initParams !== 'undefined') {
      this.initParams = initParams
    }

    this.isBrowser = (typeof window !== 'undefined')
    this.isIframe = (this.isBrowser && window.self !== window.top)

    this.ApiEvents = new ApiEvents({
      isBrowser: this.isBrowser,
      isIframe: this.isIframe
    })
  }

  on(
    eventName: string,
    eventHandler: (data: any) => void
  ) {
    this.ApiEvents.on(eventName, eventHandler)
    if (eventName === 'ready') {
      this.configurateParams()
    }
  }

  private configurateParams() {
    this.on('PARAMS_READY', async () => {
      await this.webapiStart()
    })
    
    if (!this.isIframe && typeof this.initParams !== 'undefined') {
      setDefaultConfig(this.initParams)
      this.ApiEvents.emit('PARAMS_READY', null)
    }
  }

  private async webapiStart(): Promise<void> {
    const {
      walletName,
      gasPrice: price,
      gasLimit: limit,
      web3HttpProviderUrl: httpProviderUrl,
      contracts
    } = config.default

    this.ETH = new Eth({
      walletName,
      httpProviderUrl,
      gasParams: { price, limit },
      ERC20ContractInfo: contracts.ERC20
    })
    
    this.account = new Account({
      ETH: this.ETH,
      config: config.default,
      eventEmitter: this.ApiEvents
    })
    
    this.game = new Game({
      Eth: this.ETH,
      config: config.default,
      eventEmitter: this.ApiEvents
    })

    this.account.init(
      config.default.standartWalletPass,
      config.default.privateKey
    )

    this.ApiEvents.emit('ready', this)
  }  
}
