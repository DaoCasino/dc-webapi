import Web3Account from 'web3-eth-accounts'
import { Logger } from 'dc-logging'
import { config } from 'dc-configs'
import { Eth, LastBalances } from 'dc-ethereum-utils'
import { AccountInstance } from './interfaces/IAccount'

const log = new Logger('AccountInstance: ')

export default class Account implements AccountInstance {
  private _Web3Account: Web3Account
  protected _address: string
  protected _Eth: Eth

  constructor() {
    /** Create web3-eth-accounts instance */
    this._Web3Account = new Web3Account()

    /** init config params */
    const {
      gasPrice: price,
      gasLimit: limit,
      web3HttpProviderUrl: httpProviderUrl,
      contracts,
      privateKey,
    } = config

    /** Init new Eth instance */
    this._Eth = new Eth({
      privateKey,
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
     * Check local storage wallet exist
     * if wallet exist then load wallet
     */
    const wallet = this._Web3Account.wallet
    if (!localStorage.getItem(config.walletName)) {
      wallet.load(
        walletPassword, // password for decrypt private keys in wallet
        config.walletName // wallet name in localStorage
      )
    }

    /**
     * Check exist wallet accounts
     * if account exist then set variable
     * on account private key in wallet first account
     * then set on private key in params
     */
    const privateKey = (typeof wallet[0] !== 'undefined')
      ? wallet[0].privateKey : privateKeytoCreate
   
    /** Init account in Eth instance */
    this._Eth.initAccount(privateKey)
    
    /**
     * Encrypt wallet with password in params
     * and save in localStorage with walletName
     * in config
     */
    wallet.save(
      walletPassword,
      config.walletName
    )
    
    /** Save address and private key in account struct */
    this._address = this._Eth.getAccount().address
    log.info(`Account ${this._address} created`) 
  }

  getAddress() {
    /**
     * Check local storage on exist wallet
     * with wallet name in config if exist = true
     * then parse wallet and return address
     */
    if (localStorage.getItem(config.walletName)) {
      const account = JSON.parse(localStorage.getItem(config.walletName))[0]
      return account.address
    }
    
    /** 
     * If localstorage wallet not exist
     * then return local address
     */
    return this._address
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

    /** Get wallet in localStorage with name in config */
    const encryptedPrivateKey = JSON.parse(localStorage.getItem(config.walletName))
    
    /**
     * Decrypt and return private key
     * with encrypted wallet and wallet password
     * in method params
     */
    return this._Web3Account.dencryt(
      ...encryptedPrivateKey,
      walletPassword
    ).privateKey
  }

  async getBalances(): Promise<LastBalances> {
    /** Get account address */
    const accountAddress = this.getAddress()
    
    /** Get and return ethereum and bet token balance on account */
    const { eth, bet } = await this._Eth.getBalances(accountAddress)
    return { eth, bet }
  }
}