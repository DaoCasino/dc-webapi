import {
  ConnectParams,
  GameLogicFunction
} from 'dc-core'
import { ContractInfo } from 'dc-configs'

export interface InitGameParams {
  name: string
  gameLogicFunction: GameLogicFunction
  contract: ContractInfo
  rules: any
}

interface GameBalances {
  dealer: number
  player: number
}

/** Interface for return params channel in blockchain */
interface ChannelResult {
  channelID: string
  channelState: string
}

/** Interface for return connect game func */
export interface ConnectResult extends ChannelResult {
  dealerAddress: string
  playerAddress: string
  channelBalances: GameBalances
}

/** Interface for return disconnect game fucn */
export interface DisconnectResult extends ChannelResult {
  playerResultBalance: number
  dealerResultBalance: number
  historyGame: any[]
}

/** Interface for user call */
export interface DAppInstance {
  connect: (params: ConnectParams) => Promise<ConnectResult>
  play: (
    bets: number[],
    gameData: any,
    randoms: number[][]
  ) => Promise<any>
  disconnect: () => Promise<DisconnectResult>
}