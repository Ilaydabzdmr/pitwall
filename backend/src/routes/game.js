/*game.js route dosyası oyun sisteminin 3 endpoint'ini yönetir. Pist listesi herkese açık, 
skor gönderme JWT zorunlu çünkü kimin skoru olduğunu bilmen lazım, pist liderboard'u ise herkese açık. 
:trackId dinamik parametre — URL'deki sayıyı alıp o pistin verisini getirir.Pistleri göster, skoru kaydet, sıralamayı sun.*/
const express = require('express');
const router = express.Router();
const { getTracks, submitScore, getTrackLeaderboard } = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/tracks', getTracks);
// GET /api/game/tracks → pist listesini döner

router.post('/score', authMiddleware, submitScore);
// POST /api/game/score → oyun skoru gönder (JWT zorunlu)

router.get('/leaderboard/:trackId', getTrackLeaderboard);
// GET /api/game/leaderboard/1 → o pistin skor tablosu

module.exports = router;