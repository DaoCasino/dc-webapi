import { IpfsTransportProvider, DirectTransportProvider } from "dc-messaging"
import { BlockchainNetwork, setDefaultConfig } from "dc-configs"
import { Eth as Ethereum } from "dc-ethereum-utils"
import os from "os"
import { GlobalGameLogicStore, DApp, DAppFactory } from "dc-core"

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
  local: "0x0021f710f2e56bc29b60d2235024376cc69e0f6bf3a1969d378eb8218882367d"
}
import gameManifest from "./FTE1/dapp.manifest"
import Game from "../Game"
const globalGameStore = new GlobalGameLogicStore()
;(global as any).DCLib = globalGameStore

// tslint:disable-next-line:no-var-requires
require("./FTE1/dapp.logic")

const WALLET_PWD = "1234"

const startGame = async (blockchainNetwork: BlockchainNetwork) => {
  const webapi = await new DCWebapi({
    blockchainNetwork,
    platformId: os.hostname()
  }).start()
  webapi.account.init(WALLET_PWD, playerPrivateKeys[blockchainNetwork])
  const balances = await webapi.account.getBalances()

  const game = webapi.createGame({
    name: "DCGame_FTE_v1",
    contract: gameManifest.getContract(blockchainNetwork),
    gameLogicFunction: globalGameStore.getGameLogic("DCGame_FTE_v1"),
    rules: gameManifest.rules
  })

  await game.start()
  await game.connect({ playerDeposit: 10, gameData: [0, 0] })

  // const game = new DAppFactory(transportProvider).startClient({ name: "game1" , })

  return { game, account: webapi.account, balances }
}
const runPlay = async ({ game, account, balances }) => {
  let betsBalance = balances.bet.balance
  for (let i = 0; i < 10; i++) {
    const res = await game.play({
      userBet: 1,
      gameData: [2],
      rndOpts: [[1, 3]]
    })
    betsBalance += res.profit
  }
  await game.disconnect()
  const finalBalances = await account.getBalances()
  expect(betsBalance).to.be.equal(finalBalances.bet.balance)
  game.stop()
}
describe("Bankroller Tests", () => {
  it("game with remote bankroller in ropsten", async () => {
    const { game, account, balances } = await startGame("ropsten")
    await runPlay({ game, account, balances })
  })
})
