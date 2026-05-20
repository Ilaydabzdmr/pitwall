/*Show more22:36Claude responded: İki endpoint, iki farklı zaman dilimi.İki endpoint, iki farklı zaman dilimi. 
/ tüm sezonun genel sıralamasını, /weekly sadece bu haftanın sıralamasını döner. 
Auth yok — liderboard herkese açık, izlemeye token gerekmez. Sezonluk ve haftalık rekabeti göster.*/
const express = require('express');
const router = express.Router();
const { getSeasonLeaderboard, getWeeklyLeaderboard } = require('../controllers/leaderboardController');

router.get('/', getSeasonLeaderboard);
// GET /api/leaderboard → sezon genel sıralaması

router.get('/weekly', getWeeklyLeaderboard);
// GET /api/leaderboard/weekly → haftalık sıralama

module.exports = router;