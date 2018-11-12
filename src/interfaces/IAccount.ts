import { IConfig } from "dc-configs"
import { LastBalances, Eth } from "dc-ethereum-utils"
import { EventEmitter } from "events"

export interface InitAccountParams {
  ETH: Eth
  config: IConfig
}

export interface AccountInstance extends EventEmitter {
  init: (walletPassword: string, privateKeytoCreate?: string) => void
  getAddress: () => string
  getEthInstance: () => Eth
  getBalances: (address?: string) => Promise<LastBalances>
  exportPrivateKey: (walletPassword: string) => string
}
