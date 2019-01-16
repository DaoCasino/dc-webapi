import { IConfig } from "@daocasino/dc-configs"
import { EventsInstance } from '@daocasino/dc-events'
import { BlockchainUtilsInstance } from "@daocasino/dc-blockchain-types"
import { PlayParams, IGameLogic, ConnectParams } from "@daocasino/dc-core"

export interface CreateGameParams {
  name: string
  gameLogicFunction: () => IGameLogic
  gameContractAddress: string
  rules: any
}

export interface InitGameInstanceParams {
  Eth: BlockchainUtilsInstance
  playerAddress: string
  config: IConfig
  eventEmitter: EventsInstance
}

interface GameBalances {
  bankroller: number
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

export interface PlayResult {
  profit: number
  randomNums: number[]
  params: PlayParams
  balances: GameBalances
  data?: any
}

/** Interface for return disconnect game fucn */
export interface DisconnectResult extends ChannelResult {
  resultBalances: GameBalances
}

/** Interface for user call */
export interface IGame {
  onGameEvent: (event: string, func: (data: any) => void) => void
  createGame: (params: CreateGameParams) => Promise<void>
  connect: (params: ConnectParams) => Promise<ConnectResult>
  play: (params: PlayParams) => Promise<PlayResult>
  disconnect: () => Promise<DisconnectResult>
}
