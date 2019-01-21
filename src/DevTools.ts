import { WalletInstance } from '@daocasino/dc-wallet'
import { EventsInstance } from '@daocasino/dc-events'
import { SolidityTypeValue } from '@daocasino/dc-blockchain-types'

export function devTools(
  wallet: WalletInstance,
  events: EventsInstance
): void {
  const getBalance = async (address: string) => {
    try {
      const balance = await wallet.accounts.getBalances(address)
      events.response({ eventName: 'getBalance', eventData: balance })
    } catch (error) {
      events.errorResponse({ eventName: 'signData', errorData: error })
    }
  }

  const signData = (data: SolidityTypeValue[]) => {
    try {
      const signature = wallet.sign.signData(data)
      events.response({ eventName: 'signData', eventData: signature })
    } catch (error) {
      events.errorResponse({ eventName: 'signData', errorData: error })
    }
  }

  const openChannel = async (openChannelData: any) => {
    try {
      const openChannelTX = await wallet.channels.openChannel(openChannelData)
      events.response({ eventName: 'openChannel', eventData: openChannelTX })
    } catch (error) {
      events.errorResponse({ eventName: 'openChannel', errorData: error })
    }
  }

  const closeChannel = async (closeChannelData: any) => {
    try {
      const closeChannelTX = await wallet.channels.closeChannel(closeChannelData)
      events.response({ eventName: 'closeChannel', eventData: closeChannelTX })
    } catch (error) {
      events.errorResponse({ eventName: 'closeChannel', errorData: error })
    }
  }

  events.listenRequest('getAddress', () => events.response({
    eventName: 'getAddress',
    eventData: wallet.accounts.getDefaultAccount().address
  }))

  events.listenRequest('getBalance', getBalance)
  events.listenRequest('signData', signData)
  events.listenRequest('openChannel', openChannel)
  events.listenRequest('closeChannel', closeChannel)
}
