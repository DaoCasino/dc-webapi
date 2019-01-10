import { Logger } from "@daocasino/dc-logging"
import { IConfig, config } from '@daocasino/dc-configs'
import { Eth, add0x } from "@daocasino/dc-ethereum-utils"
import { LastBalances } from "@daocasino/dc-blockchain-types"
import { AccountInstance, InitAccountParams } from "./interfaces/IAccount"
import { WalletAccountsInstance } from '@daocasino/dc-wallet'
import { ActionData } from './interfaces/IDCWebapi'

const log = new Logger("Account:")

export default class Account implements AccountInstance {
  private _params: InitAccountParams
  private _configuration: IConfig
  private _address: string
  
  constructor(params: InitAccountParams) {
    this._params = params
    this._configuration = config.default
  }

  async init(privateKeytoCreate?: string): Promise<string> {
    const { isIframe } = this._params.eventEmitter.getEnviroment()
    if (isIframe) {
      this._address = await this._params.eventEmitter.request('getAddress')
    } else {
      this._params.wallet.createAccountWithPrivateKey(privateKeytoCreate)
      this._address = add0x(this._params.wallet.getDefaultAccount().address)
    }

    log.info(`Account ${this._address} created`)
    return this._address
  }

  getAddress(): string {
    if (typeof this._address === "undefined") {
      throw new Error('Account address is not define')
    }
    
    return this._address
  }

  async getBalances(address?: string): Promise<LastBalances> {
    /** Get and return ethereum and bet token balance on account */
    const { eth, bet } = await this._params.eventEmitter.request('getBalance', address)
    return { eth, bet }
  }
}
