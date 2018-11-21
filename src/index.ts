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
  private _Events: EventEmitter

  account: AccountInstance

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
    eventData?: any
  ): void {
    this._Events.emit(eventName, eventData)
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

    if (typeof window !== 'undefined') {
      window.addEventListener('message', event => {
        self.listeners(event.data)
      }, false)
    }

    self.on('*', self.listeners)
    if (typeof window !== 'undefined' && window.self !== window.top) {
      window.addEventListener('message', event => {
        self.listeners(event.data)
      }, false)

      window.top.postMessage({
        action: 'DC_WEBAPI_LOADED',
        data: null
      }, '*')
    }

    return this
  }

  listeners(eventData: ActionData) {
    console.log(eventData)
    switch (eventData.action) {
      case 'DC_INIT_ACCOUNT':
        this.account.initAccountInIframe(eventData)
      case 'DC_CHANGE_GAME_PARAMS':
        setDefaultConfig(eventData.data)
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
