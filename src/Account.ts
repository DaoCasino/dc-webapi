import { Logger } from "dc-logging"
import { IConfig, config } from 'dc-configs'
import { Eth, LastBalances, add0x } from "dc-ethereum-utils"
import { AccountInstance, InitAccountParams } from "./interfaces/IAccount"

const log = new Logger("Account:")

export default class Account implements AccountInstance {
  private _params: InitAccountParams
  private _configuration: IConfig

  address: string
  iframeAccountAction: string

  constructor(params: InitAccountParams) {
    this._params = params
    this._configuration = config.default
    /** action for the iframe account create */
    this.iframeAccountAction = "DC::Iframe::Account::PrivateKey::"
    /** Listen messages in iframe */
    if (typeof window !== "undefined") {
      window.onmessage = event => this._initIframeAccount(event)
    }
  }

  _initIframeAccount(event): void {
    /** Parse message */
    const message = event.data
    /**
     * If message type string and in message
     * exist iframeAccountAction then create
     * account with message
     */
    if (
      typeof message === "string" &&
      message.indexOf(this.iframeAccountAction) !== -1
    ) {
      /** Parse private key with message */
      const privateKey = message.split("::")[4]
      /** Get standart wallet password of env or config */
      const { standartWalletPass } = this._configuration
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
        /** clear wallet from localStorage and create account */
        localStorage.removeItem(this._configuration.walletName)
        this.init(standartWalletPass, privateKey)
      } else {
        log.error(`
          private key is not define or incorrect, privateKey: ${privateKey},
          please input to the postMessage correct private key,
          example: window.postMessage('
            DC::Iframe::Account::PrivateKey::0x45qwe0a0ca46a6bd3df07923fgebe631b51257q12e0v47cx140BndmFl50ppc89')
        `)
      }
    }
  }

  /** Get dc-ethereum-utils instance */
  getEthInstance(): Eth {
    return this._params.ETH
  }

  init(walletPassword: string, privateKeytoCreate?: string): void {
    /**
     * Check wallet password exist in params
     * if exist not then throw error
     */
    if (!walletPassword) {
      throw new Error("walletPassword in not defined")
    }

    /**
     * Check local storage wallet exist
     * if wallet exist then load wallet
     */
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem(this._configuration.walletName)
    ) {
      this._params.ETH.loadWallet(walletPassword)
    }

    /**
     * Check exist wallet accounts
     * if account exist then set variable
     * on account private key in wallet first account
     * then set on private key in params
     */
    const wallet = this._params.ETH.getWalletAccount()
    const privateKey =
      typeof wallet !== "undefined" ? wallet.privateKey : privateKeytoCreate

    /**
     * Check exist private key
     * if private key not exist then
     * throw error
     */
    if (typeof privateKey === "undefined") {
      throw new Error("privateKey is not define")
    }

    /** Init account in Eth instance */
    this._params.ETH.initAccount(privateKey)

    /**
     * Add and Encrypt wallet with password in params
     * and save in localStorage with walletName
     * in config
     */
    this._params.ETH.saveWallet(privateKey, walletPassword)

    /** Save address */
    this.address = add0x(this._params.ETH.getAccount().address)
    /** Remove event listener */
    if (typeof window !== "undefined") {
      window.onmessage = null
    }
    log.info(`Account ${this.address} created`)
  }

  getAddress(): string {
    /**
     * If localstorage wallet not exist
     * then return local address
     */
    if (typeof this.address !== "undefined") {
      return this.address
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
