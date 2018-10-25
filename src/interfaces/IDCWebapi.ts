import { BlockchainNetwork } from 'dc-configs'
import { IGame, CreateGameParams } from './IGame'

export interface InitWebapiParams {
  blockchainNetwork: BlockchainNetwork
}

export interface InitWebapiInstance {
  createGame: (params: CreateGameParams) => IGame
}