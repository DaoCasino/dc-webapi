import { BlockchainNetwork, TransportType } from "dc-configs"
import os from "os"
import { GlobalGameLogicStore } from "dc-core"

import { Logger } from "dc-logging"

// tslint:disable-next-line:no-implicit-dependencies
import { describe, it, Test } from "mocha"
// tslint:disable-next-line:no-implicit-dependencies
import { expect } from "chai"
import DCWebapi from "../index"

const logger = new Logger("Start Game test")

const playerPrivateKeys = {
  ropsten: "0x6A5AE922FDE5C8EE877E9470F45B8030F60C19038E9116DB8B343782D9593602",
  rinkeby: "0x6A5AE922FDE5C8EE877E9470F45B8030F60C19038E9116DB8B343782D9593602",
  local: "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
}
import gameManifest from "./FTE1/dapp.manifest"
import Game from "../Game"
const globalGameStore = new GlobalGameLogicStore()
;(global as any).DCLib = globalGameStore

// tslint:disable-next-line:no-var-requires
const gameLogicFunction = require("./FTE1/dapp.logic")

const WALLET_PWD = "1234"

const startGame = async (
  blockchainNetwork: BlockchainNetwork,
  platformId: string,
  transport: TransportType = TransportType.IPFS
) => {
  const webapi = await new DCWebapi({
    blockchainNetwork,
    platformId,
    transport
  }).start()
  webapi.account.init(WALLET_PWD, playerPrivateKeys[blockchainNetwork])
  const balances = await webapi.account.getBalances()

  const game = webapi.createGame({
    name: "DCGame_FTE_v1",
    gameContractAddress: gameManifest.getContract(blockchainNetwork).address,
    gameLogicFunction,
    rules: gameManifest.rules
  })

  await game.start()
  await game.connect({ playerDeposit: 10 })

  // const game = new DAppFactory(transportProvider).startClient({ name: "game1" , })

  return { game, account: webapi.account, balances }
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
  expect(betsBalance).to.be.equal(finalBalances.bet.balance)
  game.stop()
}
describe("Bankroller Tests", () => {
  // it("game with remote bankroller in ropsten", async () => {
  //   const { game, account, balances } = await startGame(
  //     "ropsten",
  //     os.hostname()
  //   ) // TODO: hardcode!!!
  //   await runPlay({ game, account, balances })
  // })
  it("game with remote bankroller in local", async () => {
    const { game, account, balances } = await startGame("local", os.hostname())
    await runPlay({ game, account, balances })
  })
})
