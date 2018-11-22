import Game from "./Game"
import Account from "./Account"
import { Eth } from "dc-ethereum-utils"
import { config, setDefaultConfig, IConfigOptions } from "dc-configs"
import { CreateGameParams, IGame } from "./interfaces/IGame"
import { AccountInstance } from "./interfaces/IAccount"
import { WebapiInstance, ActionData } from "./interfaces/IDCWebapi"
import { EventEmitter } from "events"

export default class DCWebapi implements WebapiInstance {
  private _Eth: Eth
  private _eventEmitter: EventEmitter
  private _params: IConfigOptions

  account: AccountInstance
  isIframe: boolean
  isBrowser: boolean

  // Global Events
  ACTION_GAME_READY: string = 'GAME_READY_TO_START'
  ACTION_WEBAPI_READY: string = 'WEBAPI_READY'
  ACTION_PLATFORM_PARAMS: string = 'CONFIGURE_PLATFORM_PARAMS'

  constructor(params: IConfigOptions) {
    this._params = params
    this._eventEmitter = new EventEmitter()
    this.isBrowser = (typeof window !== 'undefined')
    this.isIframe = (this.isBrowser && window.self !== window.top)
    setDefaultConfig(this._params)
  }

  on(
    eventName: string,
    func: (data: any) => void
  ): void {
    this._eventEmitter.on(eventName, func)
  }

  emit(
    eventName: string,
    eventData: any = null
  ): void {
    this._eventEmitter.emit(eventName, eventData)
    if (this.isBrowser) {
      window.top.postMessage({
        action: eventName,
        data: eventData
      }, '*')
    }
  }

  async start() {
    const self = this
    const {
      walletName,
      gasPrice: price,
      gasLimit: limit,
      web3HttpProviderUrl: httpProviderUrl,
      contracts
    } = config.default

    self._Eth = new Eth({
      walletName,
      httpProviderUrl,
      gasParams: { price, limit },
      ERC20ContractInfo: contracts.ERC20
    })
    
    self.account = new Account({
      ETH: this._Eth,
      config: config.default,
      eventEmitter: this._eventEmitter
    })
    
    if (this.isBrowser && this.isIframe) {
      window.addEventListener('message', event => {
        self.listeners(event.data)
      }, false)
    }

    this.emit(this.ACTION_WEBAPI_READY)
    return this
  }

  listeners(eventData: ActionData) {
    switch (eventData.action) {
      case this.ACTION_PLATFORM_PARAMS:
        setDefaultConfig({ ...this._params, ...eventData.data })
        this.account.initAccountInIframe(eventData)
        this.emit(this.ACTION_GAME_READY, eventData)
        // TODO: implement stop listen event
    }
  }
  
  createGame(params: CreateGameParams): IGame {
    return new Game({
      ...params,
      Eth: this._Eth,
      config: config.default,
      eventEmitter: this._eventEmitter
    })
  }
}
