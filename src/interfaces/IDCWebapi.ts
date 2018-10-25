import { BlockchainNetwork } from "dc-configs"
import { IGame, CreateGameParams } from "./IGame"

export interface InitWebapiInstance {
  createGame: (params: CreateGameParams) => IGame
}
