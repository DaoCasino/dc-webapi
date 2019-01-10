import { ActionData } from './IDCWebapi'
import { IConfig } from "@daocasino/dc-configs"
import { Eth } from "@daocasino/dc-ethereum-utils"
import { EventsInstance, WalletAccountsInstance } from '@daocasino/dc-wallet'
import { LastBalances } from "@daocasino/dc-blockchain-types"

export interface InitAccountParams {
  wallet: WalletAccountsInstance
  config: IConfig,
  eventEmitter: EventsInstance
}

export interface AccountInstance {
  init: (privateKeytoCreate?: string) => Promise<string> 
  getAddress: () => string
  getBalances: (address?: string) => Promise<LastBalances>
}
