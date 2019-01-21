import { Logger } from '@daocasino/dc-logging'
import { checkEnviroment } from '@daocasino/dc-events'
import { LastBalances, SolidityTypeValue } from "@daocasino/dc-blockchain-types"
import { AccountInstance, InitAccountParams } from "./interfaces/IAccount"

const log = new Logger('Account:')

export default class Account implements AccountInstance {
  private _params: InitAccountParams
  private _address: string

  constructor(params: InitAccountParams) {
    this._params = params
  }

  async init(privateKeytoCreate?: string): Promise<string> {
    const { isIframe } = checkEnviroment()
    if (isIframe) {
      this._address = await this._params.eventEmitter.request({ eventName: 'getAddress' })
    } else {
      this._params.wallet.accounts.createAccountWithPrivateKey(privateKeytoCreate)
      this._address = this._params.wallet.accounts.getDefaultAccount().address
    }

    log.info(`Account ${this._address} created`)
    return this._address
  }

  async playerSign(data: SolidityTypeValue[]): Promise<string> {
    try {
      let signature: string
      const { isIframe } = checkEnviroment()
      if (isIframe) {
        signature = await this._params.eventEmitter.request({
          eventName: 'signData',
          eventData: data
        })
      } else {
        signature = this._params.wallet.sign.signData(data)
      }
      return signature
    } catch (error) {
      throw error
    }
  }

  getAddress(): string {
    if (typeof this._address === "undefined") {
      throw new Error('Account address is not define')
    }

    return this._address
  }

  async getBalances(address?: string): Promise<LastBalances> {
    /** Get and return ethereum and bet token balance on account */
    const { eth, bet } = await this._params.eventEmitter.request({
      eventName: 'getBalance',
      eventData: address
    })
    
    return { eth, bet }
  }
}
