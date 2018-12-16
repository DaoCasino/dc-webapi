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
The ``start()`` function is specified in the **index.ts**. Parameters (params) come from the **Game** value specified in **Game.ts**.
