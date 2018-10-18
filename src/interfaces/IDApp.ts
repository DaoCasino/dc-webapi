/** Interface for return Game function */
export interface GameReturns {
  profit: number
  userBet: number
  gameData: number[]
  randomNums: number[]
  randomHash: string
  playerChannelBalance: number
  dealerChannelBalance: number
}

/**
 * Type for game logic function
 * this func return game fuction
 * and history array
 */
export type GameLogicFunc = () => { Play: PlayFunction, history: GameReturns[] }
export type PlayFunction = (bets: number[], gameData: any, randoms: number[]) => GameReturns

/**
 * Interface for game contract
 * his have address contracts in string type
 * and abi contract in JSON string
 */
export interface GameContract {
  address: string
  abi: string
}

/** Interface for DApp init params  */
export interface DAppParams {
  name: string
  gameContract: GameContract
  gameLogic: GameLogicFunc
  rules: any
}

/** Interface for return params channel in blockchain */
interface ChannelResult {
  channelID: string
  channelState: number
}

/** Interface for return connect game func */
export interface ConnectResult extends ChannelResult {
  dealerAddress: string
  channelBalances: any
}

/** Interface for return disconnect game fucn */
export interface DisconnectResult extends ChannelResult {
  playerResultBalance: number
  dealerResultBalance: number
  historyGame: GameReturns[]
}

/** Interface for user call */
export interface DAppInstance {
  connect: (
    peerAddress: string,
    deposit: number
  ) => Promise<ConnectResult>
  play: (
    bets: number[],
    gameData: any,
    randoms: number[][]
  ) => Promise<GameReturns>
  disconnect: () => Promise<DisconnectResult>
}