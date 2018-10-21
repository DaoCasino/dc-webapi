import { LastBalances, Eth } from 'dc-ethereum-utils'

export interface AccountInstance {
  init: (
    walletPassword: string,
    privateKeytoCreate?: string
  ) => void
  getAddress: () => string
  getEthInstance: () => Eth
  getBalances: (address: string) => Promise<LastBalances>
  exportPrivateKey: (walletPassword: string) => string 
}