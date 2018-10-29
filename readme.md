This package stores files for DAO.Casino protocol implementation. 
The webapit functionality is integrated with a specific game in the SDK via an asynchronous initiatilizaton pattern:
```javascript
await new DCWebapi(params).start()
```
The ``start()`` function is specified in the **index.ts**. Parameters (params) come from the **Game** value specified in **Game.ts**.
