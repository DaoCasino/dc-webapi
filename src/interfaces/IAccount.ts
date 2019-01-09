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
  init: (walletPassword: string, privateKeytoCreate?: string) => void
  initAccountInIframe: (data: ActionData) => void
  getAddress: () => Promise<string>
  getWalletInstance: () => WalletAccountsInstance
  getBalances: (address?: string) => Promise<LastBalances>
}
