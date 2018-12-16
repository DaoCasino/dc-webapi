import { Logger } from "@daocasino/dc-logging"
import { IConfig, config } from '@daocasino/dc-configs'
import { Eth, LastBalances, add0x } from "@daocasino/dc-ethereum-utils"
import { AccountInstance, InitAccountParams } from "./interfaces/IAccount"
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
  getEthInstance(): Eth {
    return this._params.ETH
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
    this._params.ETH.initAccount(privateKeytoCreate)

    /**
     * Add and Encrypt wallet with password in params
     * and save in localStorage with walletName
     * in config
     */
    this._params.ETH.saveWallet(privateKeytoCreate, walletPassword)

    /** Save address */
    this._address = add0x(this._params.ETH.getAccount().address)
    /** Emit created account event */
    // this._params.eventEmitter.emit(this.GET_ACCOUNT_INFO, this._address)
    log.info(`Account ${this._address} created`)
  }

  getAddress(): string {
    /**
     * If localstorage wallet not exist
     * then return local address
     */
    if (typeof this._address !== "undefined") {
      return this._address
    }

    /**
     * Check local storage on exist wallet
     * with wallet name in config.default if exist = true
     * then parse wallet and return address
     */
    if (localStorage.getItem(this._configuration.walletName)) {
      return add0x(this._params.ETH.getWalletAccount().address)
    }

    log.warn(`
      Account addres is not define please
      create new account with use Account.init(password, privateKey)
    `)
  }

  exportPrivateKey(walletPassword: string): string {
    /**
     * Check localStorage if
     * not exist wallet with name
     * throw new Error
     */
    if (typeof localStorage === "undefined") {
      return this._params.ETH.getWalletAccount().privateKey
    }
    if (!localStorage.getItem(this._configuration.walletName)) {
      throw new Error(`
        Not wallet with name: ${this._configuration.walletName}
        in localStorage please init account with Account.init() method
      `)
    }

    /** Get wallet and decrypt in localStorage */
    this._params.ETH.loadWallet(walletPassword)

    /** Return private key */
    return this._params.ETH.getWalletAccount().privateKey
  }

  async getBalances(): Promise<LastBalances> {
    /** Get account address */
    const accountAddress: string = this.getAddress()

    /** Get and return ethereum and bet token balance on account */
    const { eth, bet } = await this._params.ETH.getBalances(accountAddress)
    return { eth, bet }
  }
}
