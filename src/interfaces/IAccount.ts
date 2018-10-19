import { LastBalances } from 'dc-ethereum-utils'

export interface AccountInstance {
  init: (
    walletPassword: string,
    privateKeytoCreate?: string
  ) => void
  getAddress: () => string
  getBalances: (address: string) => Promise<LastBalances>
  exportPrivateKey: (walletPassword: string) => string 
}