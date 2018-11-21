import Game from "./Game"
import Account from "./Account"
import { Eth } from "dc-ethereum-utils"
import { config, setDefaultConfig, IConfigOptions } from "dc-configs"
import { CreateGameParams, IGame } from "./interfaces/IGame"
import { AccountInstance } from "./interfaces/IAccount"
import { WebapiInstance, ActionData } from "./interfaces/IDCWebapi"
import { EventEmitter } from "events"
import { Logger } from 'dc-logging'

const log = new Logger('webapi:')

export default class DCWebapi implements WebapiInstance {
  private _Eth: Eth
  private _Events: EventEmitter

  account: AccountInstance

  // Global Events
  ACTION_GAME_READY: string = 'GAME_READY_TO_START'
  ACTION_WEBAPI_READY: string = 'WEBAPI_READY'
  ACTION_PLATFORM_PARAMS: string = 'CONFIGURE_PLATFORM_PARAMS'

  constructor(params: IConfigOptions) {
    setDefaultConfig(params)
    this._Events = new EventEmitter()
  }

  on(
    eventName: string,
    func: (data: any) => void
  ): void {
    this._Events.on(eventName, func)
  }

  emit(
    eventName: string,
    eventData: any = null
  ): void {
    this._Events.emit(eventName, eventData)
    window.top.postMessage({ action: eventName, data: eventData }, '*')
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
      events: this._Events
    })
    
    if (typeof window !== 'undefined' && window.self !== window.top) {
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
        setDefaultConfig(eventData.data)
        this.account.initAccountInIframe(eventData)
        this.emit(this.ACTION_GAME_READY, eventData)
    }
  }
  
  createGame(params: CreateGameParams): IGame {
    return new Game({
      ...params,
      Eth: this._Eth,
      config: config.default,
      events: this._Events
    })
  }
}
