import Game from './Game'
import Account from './Account'
import { Eth } from 'dc-ethereum-utils'
import { IConfig, getConfig } from "dc-configs"
import { CreateGameParams, IGame } from './interfaces/IGame'
import { AccountInstance } from './interfaces/IAccount'
import { InitWebapiInstance, InitWebapiParams } from './interfaces/IDCWebapi'

export default class DCWebapi implements InitWebapiInstance {
  private _Eth: Eth
  private _config: IConfig
  private _params: InitWebapiParams

  account: AccountInstance
  
  constructor(params: InitWebapiParams) {
    this._params = params
    this._config = getConfig(this._params)

    const {
      contracts,
      walletName,
      gasPrice: price,
      gasLimit: limit,
      web3HttpProviderUrl: httpProviderUrl
    } = this._config

    this._Eth = new Eth({
      walletName,
      httpProviderUrl,
      gasParams: { price, limit },
      ERC20ContractInfo: contracts.ERC20
    })

    this.account = new Account({ ETH: this._Eth, config: this._config })
  }

  createGame(params: CreateGameParams): IGame {
    return new Game({ Eth: this._Eth, config: this._config, ...params })
  }
}