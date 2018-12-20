import { ActionData } from './IDCWebapi'
import { IConfig } from "@daocasino/dc-configs"
import { Eth } from "@daocasino/dc-ethereum-utils"
import { ApiEventsInstance } from './IApiEvents'
import { LastBalances } from "@daocasino/dc-blockchain-types"

export interface InitAccountParams {
  ETH: Eth
  config: IConfig,
  eventEmitter: ApiEventsInstance
}

export interface AccountInstance {
  init: (walletPassword: string, privateKeytoCreate?: string) => void
  initAccountInIframe: (data: ActionData) => void
  getAddress: () => string
  getEthInstance: () => Eth
  getBalances: (address?: string) => Promise<LastBalances>
  exportPrivateKey: (walletPassword: string) => string
}
