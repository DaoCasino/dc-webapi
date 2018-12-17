import { BlockchainNetwork, TransportType } from "@daocasino/dc-configs"
import os from "os"
import { GlobalGameLogicStore } from "@daocasino/dc-core"

import { Logger } from "@daocasino/dc-logging"

// tslint:disable-next-line:no-implicit-dependencies
import { describe, it, Test } from "mocha"
// tslint:disable-next-line:no-implicit-dependencies
import DCWebapi from "../index"

const logger = new Logger("Start Game test")

const playerPrivateKeys = {
  ropsten: "0x6A5AE922FDE5C8EE877E9470F45B8030F60C19038E9116DB8B343782D9593602",
  rinkeby: "0x6A5AE922FDE5C8EE877E9470F45B8030F60C19038E9116DB8B343782D9593602",
  local: "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"
}
import gameManifest from "./FTE1/dapp.manifest"
const globalGameStore = new GlobalGameLogicStore()
;(global as any).DCLib = globalGameStore

// tslint:disable-next-line:no-var-requires
const gameLogicFunction = require("./FTE1/dapp.logic")

const WALLET_PWD = "1234"

const startGame = async (
  blockchainNetwork: BlockchainNetwork = "local",
  platformId: string,
  transport: TransportType = TransportType.DIRECT
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

  await game.start({ playerDeposit: 10 })
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
  // expect(betsBalance).to.be.equal(finalBalances.bet.balance)
  game.stop()
}

;(async () => {
  const network: BlockchainNetwork =
    (process.env.DC_NETWORK as BlockchainNetwork) || "local"
  let transport = TransportType.DIRECT
  if (process.env.DC_TRANSPORT && process.env.DC_TRANSPORT in TransportType) {
    transport = TransportType[process.env.DC_TRANSPORT]
  }
  const { game, account, balances } = await startGame(
    network,
    os.hostname(),
    transport
  )
  await runPlay({ game, account, balances })
})()
