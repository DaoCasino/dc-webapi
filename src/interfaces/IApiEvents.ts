import {
  ActionData,
} from "./IDCWebapi"
import { EventEmitter } from 'events'

export interface ApiEventsParams {
  isBrowser: boolean
  isIframe: boolean
}

export interface ApiEventsInstance extends EventEmitter {
  listenAll: (eventData: ActionData) => Promise<void>
}