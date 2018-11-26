module.exports = function () {
  return {
    play: function (userBets, gameData, randoms) {
      const USER_BET = userBets[0]
      const USER_NUM = gameData.custom.playerNumbers[0]
      const RANDOM_NUM = randoms[0]

      let profit = -USER_BET
      if (USER_NUM == RANDOM_NUM) {
        profit = USER_BET * 2
      }

      return {
        profit,
        data: null
      }
    },

    customDataFormat: function (gameDataCustom) {
      return [
        { t: 'uint256', v: gameDataCustom.playerNumbers }
      ]
    }
  }
}

