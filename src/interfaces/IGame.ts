import { IConfig } from "dc-configs"
import { ETHInstance } from "dc-ethereum-utils"
import { PlayParams, IGameLogic, ConnectParams } from "dc-core"
import { EventEmitter } from "events"
export interface CreateGameParams {
  name: string
  gameLogicFunction: () => IGameLogic
  gameContractAddress: string
  rules: any
}

export interface InitGameParams extends CreateGameParams {
  Eth: ETHInstance
  config: IConfig,
  eventEmitter: EventEmitter
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
  onGameEvent: (
    event: string,
    func: (data: any) => void
  ) => void
  start: () => Promise<void>
  connect: (params: ConnectParams) => Promise<ConnectResult>
  play: (params: PlayParams) => Promise<PlayResult>
  disconnect: () => Promise<DisconnectResult>
}
