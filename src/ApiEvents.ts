import { Logger } from '@daocasino/dc-logging'
import { EventEmitter } from 'events'
import { setDefaultConfig } from "@daocasino/dc-configs"

import {
  ActionData,
  ApiEventsParams,
  ApiEventsInstance
} from "./interfaces"

const log = new Logger('BrowserEvents:')

export default class ApiEvents extends EventEmitter implements ApiEventsInstance {  
  private params: ApiEventsParams

  constructor(params: ApiEventsParams) {
    super()
    this.params = params

    if (this.params.isIframe) {
      window.addEventListener(
        'message',
        event => this.listenAll(event.data), false
      )

      log.info('Webapi start in iFrame')
    }
  }

  eventNames () {
    return [
      'ready',
      'COMPLEATE_HANDLER',
      'CHANGE_DEFAULT_CONFIG',
      'PARAMS_READY',
      'LISTEN_ALL'
    ]
  }

  async listenAll(eventData: ActionData) {
    switch (eventData.action) {
      case 'CHANGE_DEFAULT_CONFIG':
        setDefaultConfig(eventData.data)
        this.emit('PARAMS_READY', null)
    }
  }
}