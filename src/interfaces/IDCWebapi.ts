import { IGame, CreateGameParams } from "./IGame"

export interface ActionData {
  action: string
  data: any
}

export interface WebapiInstance {
  on: (
    eventName: string,
    eventHandler: (data: any) => void
  ) => void
  // createGame: (params: CreateGameParams) => IGame
}
