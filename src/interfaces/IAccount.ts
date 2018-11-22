import { ActionData } from './IDCWebapi'
import { IConfig } from "dc-configs"
import { LastBalances, Eth } from "dc-ethereum-utils"
import { EventEmitter } from 'events'

export interface InitAccountParams {
  ETH: Eth
  config: IConfig,
  events: EventEmitter
}

export interface AccountInstance {
  init: (walletPassword: string, privateKeytoCreate?: string) => void
  initAccountInIframe: (data: ActionData) => void
  getAddress: () => string
  getEthInstance: () => Eth
  getBalances: (address?: string) => Promise<LastBalances>
  exportPrivateKey: (walletPassword: string) => string
}
