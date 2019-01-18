import { IGame, CreateGameParams } from './IGame'
import { AccountInstance } from './IAccount'

export interface ActionData {
  action: string
  data: any
}

export interface ReadyInstnce {
  game: IGame,
  account: AccountInstance
}

export interface WebapiInstance {
  on: (
    eventName: string,
    eventHandler: (data: any) => void
  ) => void
  init: () => Promise<ReadyInstnce>
}
