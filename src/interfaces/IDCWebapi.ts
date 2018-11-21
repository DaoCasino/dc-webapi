import { IGame, CreateGameParams } from "./IGame"

export interface ActionData {
  action: string
  data: any
}

export interface WebapiInstance {
  createGame: (params: CreateGameParams) => IGame
  on(
    eventName: string,
    func: (data: any) => void
  ): void
}
