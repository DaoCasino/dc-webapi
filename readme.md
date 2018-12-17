This package stores files for DAO.Casino protocol implementation. 
The webapit functionality is integrated with a specific game in the SDK via an asynchronous initiatilizaton pattern:
```javascript
const webapi = new DCWebapi(params)
webapi.on('ready', async instance => {
  await instance.game.createGame(gameParams)
  await instance.game.connect(connectParams)
  await instance.game.play(playParams)
  await instance.game.disconnect()
})
```

## Example

```javascript
new DCWebapi({
  platformId 'example_id',
  blockchainNetwork: 'local',
  privateKey: 'your_private_key'
}).on('ready', async instance => {
  await instance.game.createGame({
    name: manifest.slug,
    gameContractAddress: manifest.getContract(blockchainNetwork).address,
    gameLogicFunction: dapp_logic,
    rules: manifest.rules
  })

  await instance.game.connect({ playerDeposit: deposit })
  await instance.game.play({
    userBets: [ betAmount ],
    gameData: {
      randomRanges: [ randomRange ],
      custom: { playerNumbers: { t: 'uint256', v: [ userNum ] } }
    }
  })

  await instance.game.disconnect()
})
```