import { ContractInfo, IConfig } from "dc-configs"
import { ETHInstance } from 'dc-ethereum-utils'
import { PlayParams, IGameLogic, ConnectParams } from "dc-core"

export interface CreateGameParams {
  name: string
  gameLogicFunction: () => IGameLogic
  contract: ContractInfo
  rules: any
}

export interface InitGameParams extends CreateGameParams {
  Eth: ETHInstance
  config: IConfig
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
}

/** Interface for return disconnect game fucn */
export interface DisconnectResult extends ChannelResult {
  resultBalances: GameBalances
}

/** Interface for user call */
export interface IGame {
  start: (peerAddress: string) => Promise<void>
  connect: (params: ConnectParams) => Promise<ConnectResult>
  play: (params: PlayParams) => Promise<PlayResult>
  disconnect: () => Promise<DisconnectResult>
}
