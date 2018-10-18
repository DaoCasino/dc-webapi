import { LastBalances } from 'dc-ethereum-utils'

export interface AccountData {
  address: string
  privateKey: string
}

export interface AccountInstance {
  init: (
    walletPassword: string,
    privateKeytoCreate?: string
  ) => void
  getBalances: (address: string) => Promise<LastBalances>
  exportPrivateKey: (walletPassword: string) => string 
}