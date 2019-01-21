import { IConfig } from "@daocasino/dc-configs"
import { EventsInstance } from '@daocasino/dc-events'
import { WalletInstance } from '@daocasino/dc-wallet'
import { LastBalances } from "@daocasino/dc-blockchain-types"

export interface InitAccountParams {
  wallet: WalletInstance
  config: IConfig,
  eventEmitter: EventsInstance
}

export interface AccountInstance {
  init: (privateKeytoCreate?: string) => Promise<string> 
  getAddress: () => string
  playerSign: (data: any) => Promise<string>
  getBalances: (address?: string) => Promise<LastBalances>
}
