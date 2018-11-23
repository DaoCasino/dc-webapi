const addressFunctions = {
  rinkeby: () => "0x868944cd75d4b70b6fb59254e998d5f757d7de0c",
  ropsten: () => "0x76acfE4A87381E6Ff1B5c68d404CD49837f53184",
  mainnet: () => "",
  local: () => "http://localhost:8545/contracts/->Game"
}

module.exports = {
  slug: "DCGame_FTE_v1",

  logic: "./dapp.logic.js",

  getContract: blockchainNetwork => ({
    address: addressFunctions[blockchainNetwork]()
  }),

  rules: {
    depositX: 2
  }
}
