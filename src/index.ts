import Game from "./Game"
import Account from "./Account"
import { Eth } from "dc-ethereum-utils"
import { config, setDefaultConfig, IConfigOptions } from "dc-configs"
import { CreateGameParams, IGame } from "./interfaces/IGame"
import { AccountInstance } from "./interfaces/IAccount"
import { InitWebapiInstance } from "./interfaces/IDCWebapi"

export default class DCWebapi implements InitWebapiInstance {
  private _Eth: Eth

  account: AccountInstance

  constructor(params: IConfigOptions) {
    setDefaultConfig(params)

    const {
      contracts,
      walletName,
      gasPrice: price,
      gasLimit: limit,
      web3HttpProviderUrl: httpProviderUrl
    } = config.default

    this._Eth = new Eth({
      walletName,
      httpProviderUrl,
      gasParams: { price, limit },
      ERC20ContractInfo: contracts.ERC20
    })

    this.account = new Account({ ETH: this._Eth, config: config.default })
  }

  createGame(params: CreateGameParams): IGame {
    return new Game({ Eth: this._Eth, config: config.default, ...params })
  }
}
