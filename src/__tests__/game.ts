import { BlockchainNetwork, TransportType } from '@daocasino/dc-configs'
import os from 'os'
import { GlobalGameLogicStore } from '@daocasino/dc-core'

import { Logger } from '@daocasino/dc-logging'

// tslint:disable-next-line:no-implicit-dependencies
import { describe, it, Test } from 'mocha'
// tslint:disable-next-line:no-implicit-dependencies
import DCWebapi from '../index'

const logger = new Logger('Start Game test')

const playerPrivateKeys = {
  ropsten: '0x6A5AE922FDE5C8EE877E9470F45B8030F60C19038E9116DB8B343782D9593602',
  rinkeby: '0x6A5AE922FDE5C8EE877E9470F45B8030F60C19038E9116DB8B343782D9593602',
  local: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'
}
import gameManifest from './FTE1/dapp.manifest'

const globalGameStore = new GlobalGameLogicStore()
;(global as any).DCLib = globalGameStore

// tslint:disable-next-line:no-var-requires
const gameLogicFunction = require('./FTE1/dapp.logic')
const WALLET_PWD = '1234'

const startGame = (
  blockchainNetwork: BlockchainNetwork = 'local',
  platformId: string,
  transport: TransportType = TransportType.DIRECT
): Promise<any> => {
  return new Promise((resolve, reject) => {
    new DCWebapi({
      blockchainNetwork,
      platformId,
      privateKey: playerPrivateKeys.local,
      transport
    }).on('ready', async instance => {
      const balances = await instance.account.getBalances()
      await instance.game.createGame({
        name: 'DCGame_FTE_v1',
        gameContractAddress: gameManifest.getContract(blockchainNetwork).address,
        gameLogicFunction,
        rules: gameManifest.rules
      })

      await instance.game.connect({ playerDeposit: 10 })
      resolve({ game: instance.game, account: instance.account, balances })
    })
  })
}

const runPlay = async ({ game, account, balances }) => {
    let betsBalance = balances.bet.balance
    for (let i = 0; i < 10; i++) {
      const res = await game.play({
        userBets: [1],
        gameData: {
          randomRanges: [[1, 3]],
          custom: { playerNumbers: 2 }
        }
      })
      betsBalance += res.profit
    }
    await game.disconnect()
    const finalBalances = await account.getBalances()
    // expect(betsBalance).to.be.equal(finalBalances.bet.balance)
    game.stop()
  }

;(async () => {
  const network: BlockchainNetwork =
    (process.env.DC_NETWORK as BlockchainNetwork) || 'local'
  let transport = TransportType.IPFS
  if (process.env.DC_TRANSPORT && process.env.DC_TRANSPORT in TransportType) {
    transport = TransportType[process.env.DC_TRANSPORT]
  }
  try {
    const { game, account, balances } = await startGame(
      network,
      os.hostname(),
      transport
    )
    await runPlay({ game, account, balances })
  } catch (error) {
    logger.error(error)
  }
})()
