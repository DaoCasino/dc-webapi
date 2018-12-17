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
        'message', event => {
          this.listenAll(event.data)
        }, false
      )

      log.info('Webapi start in iFrame')
    }
  }

  eventNames () {
    return [
      'ready',
      'listenAll',
      'getParams',
      'paramsReady',
      'compleateHandler',
      'changeDefaultConfig'
    ]
  }

  crossEmit(
    eventName: string,
    eventData: any
  ): void {
    if (this.params.isIframe) {
      window.top.postMessage({
        action: eventName,
        data: eventData
      }, '*')
    }

    this.emit(eventName, eventData)
  }

  async listenAll(eventData: ActionData) {
    switch (eventData.action) {
      case 'changeDefaultConfig':
        setDefaultConfig(eventData.data)
        this.emit('paramsReady', null)
    }
  }
}