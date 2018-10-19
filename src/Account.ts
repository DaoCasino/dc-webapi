import { Logger } from 'dc-logging'
import { config } from 'dc-configs'
import { Eth, LastBalances, add0x } from 'dc-ethereum-utils'
import { AccountInstance } from './interfaces/IAccount'

const log = new Logger('Account:')

export class Account implements AccountInstance {
  private _Eth: Eth
  private _address: string

  constructor() {
    /** init config params */
    const {
      gasPrice: price,
      gasLimit: limit,
      web3HttpProviderUrl: httpProviderUrl,
      contracts
    } = config

    /** Init new Eth instance */
    this._Eth = new Eth({
      httpProviderUrl,
      ERC20ContractInfo: contracts.ERC20,
      gasParams: { price, limit }
    })
  }

  init(
    walletPassword: string,
    privateKeytoCreate?: string
  ): void {
    /**
     * Check wallet password exist in params
     * if exist not then throw error
     */
    if (!walletPassword) {
      throw new Error('walletPassword in not define')
    }

    /**
     * Check local storage wallet exist
     * if wallet exist then load wallet
     */
    if (localStorage.getItem(config.walletName)) {
      this._Eth.loadWallet(walletPassword)
    }

    /**
     * Check exist wallet accounts
     * if account exist then set variable
     * on account private key in wallet first account
     * then set on private key in params
     */
    const wallet = this._Eth.getWalletAccount()
    const privateKey = (typeof wallet !== 'undefined')
      ? wallet.privateKey
      : privateKeytoCreate

    /** 
     * Check exist private key
     * if private key not exist then
     * throw error
     */
    if (typeof privateKey === 'undefined') {
      throw new Error('privateKey is not define')
    }

    /** Init account in Eth instance */
    this._Eth.initAccount(privateKey)

    /**
     * Add and Encrypt wallet with password in params
     * and save in localStorage with walletName
     * in config
     */
    this._Eth.saveWallet(walletPassword, privateKey)
    
    /** Save address */
    this._address = add0x(this._Eth.getAccount().address)
    log.info(`Account ${this._address} created`) 
  }

  getAddress(): string {
    /** 
     * If localstorage wallet not exist
     * then return local address
     */
    if (typeof this._address !== 'undefined') {
      return this._address
    }
    
    /**
     * Check local storage on exist wallet
     * with wallet name in config if exist = true
     * then parse wallet and return address
     */
    if (localStorage.getItem(config.walletName)) {
      return add0x(this._Eth.getWalletAccount().address)
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
    if (!localStorage.getItem(config.walletName)) {
      throw new Error(`
        Not wallet with name: ${config.walletName}
        in localStorage please init account with Account.init() method
      `)
    }

    /** Get wallet and decrypt in localStorage */
    this._Eth.loadWallet(walletPassword)
    
    /** Return private key */
    return this._Eth.getWalletAccount().privateKey
  }

  async getBalances(): Promise<LastBalances> {
    /** Get account address */
    const accountAddress: string = this.getAddress()
    
    /** Get and return ethereum and bet token balance on account */
    const { eth, bet } = await this._Eth.getBalances(accountAddress)
    return { eth, bet }
  }
}