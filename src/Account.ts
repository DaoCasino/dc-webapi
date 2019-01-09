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
  
  /** Actions events */
  public LOADED_ACTION: string = 'DC_ACCOUNT_INSTANCE_LOADED'
  public GET_ACCOUNT_INFO: string = 'DC_ACCOUNT_INFO'
  public IFRAME_ACCOUNT_ACTION: string = 'DC_ACCOUNT_PRIVATE_KEY'

  constructor(params: InitAccountParams) {
    this._params = params
    this._configuration = config.default
  }

  initAccountInIframe(event: ActionData): void {
    /** Parse message */
    const messageData = event.data
    /**
     * If message type string and in message
     * exist iframeAccountAction then create
     * account with message
     */
    if (typeof messageData === 'object') {
      /** Parse private key with message */
      const privateKey = messageData.privateKey
      /** Get standart wallet password of env or config */
      const { standartWalletPass, walletName } = this._configuration
      /**
       * If private key exist and private key
       * correct format then create account
       * else output error with incorrect key
       */
      if (
        privateKey &&
        privateKey.length === 66 &&
        privateKey.substr(0, 2) === "0x"
      ) {
        /** Create account */
        localStorage.removeItem(walletName)
        this.init(standartWalletPass, privateKey)
      } else {
        const error = new Error(`
          private key is not define or incorrect, privateKey: ${privateKey},
          please input to the postMessage correct private key,
          example: window.postMessage({
            action: 'DC_INIT_ACCOUNT',
            data: {
              privateKey: '0x45qwe0a0ca46a6bd3df07923fgebe631b51257q12e0v47cx140BndmFl50ppc89'
            }
          })
        `)

        throw error
      }
    } else {
      throw new Error('Incorrect message data, messageData undefined or not object')
    }
  }

  /** Get @daocasino/dc-ethereum-utils instance */
  getWalletInstance(): WalletAccountsInstance {
    return this._params.wallet
  }

  init(walletPassword: string, privateKeytoCreate: string): void {
    /**
     * Check wallet password exist in params
     * if exist not then throw error
     */
    if (!walletPassword) {
      throw new Error("walletPassword in not defined")
    }

    /**
     * Check exist private key
     * if private key not exist then
     * throw error
     */
    if (typeof privateKeytoCreate === "undefined") {
      throw new Error("privateKey is not define")
    }

    /** Init account in Eth instance */
    this._params.wallet.createAccountWithPrivateKey(privateKeytoCreate)

    /**
     * Add and Encrypt wallet with password in params
     * and save in localStorage with walletName
     * in config
     */
    // this._params.ETH.saveWallet(privateKeytoCreate, walletPassword)

    /** Save address */
    this._address = add0x(this._params.wallet.getDefaultAccount().address)
    /** Emit created account event */
    // this._params.eventEmitter.emit(this.GET_ACCOUNT_INFO, this._address)
    log.info(`Account ${this._address} created`)
  }

  async getAddress(): Promise<string> {
    /**
     * If localstorage wallet not exist
     * then return local address
     */
    if (typeof this._address !== "undefined") {
      return this._address
    }


    const address = await this._params.eventEmitter.request('getAddress')
    return address
  }

  async getBalances(): Promise<LastBalances> {
    /** Get account address */
    const accountAddress: string = await this.getAddress()
    /** Get and return ethereum and bet token balance on account */
    const { eth, bet } = await this._params.eventEmitter.request('getBalances', accountAddress)
    return { eth, bet }
  }
}
