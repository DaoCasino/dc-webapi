import { BlockchainNetwork, TransportType } from "@daocasino/dc-configs"
import os from "os"
import { GlobalGameLogicStore } from "@daocasino/dc-core"

import { Logger } from "@daocasino/dc-logging"

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

const startGame = (
  blockchainNetwork: BlockchainNetwork,
  platformId: string,
  transport: TransportType = TransportType.IPFS
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
        name: "DCGame_FTE_v1",
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
        custom: { playerNumbers: { t: "uint256", v: [2] } }
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
  //     'DC_CloudPlatform'
  //     // os.hostname()
  //   ) // TODO: hardcode!!!

  //   await runPlay({ game, account, balances })
  // })
  it("game with remote bankroller in local", async () => {
    const { game, account, balances } = await startGame(
      "local",
      os.hostname(),
      TransportType.IPFS
    )
    await runPlay({ game, account, balances })
  })
})
