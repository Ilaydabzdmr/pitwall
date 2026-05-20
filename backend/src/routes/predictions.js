/*Tahmin sisteminin 3 endpoint'i. Tahmin oluşturmak ve kendi tahminlerini görmek JWT zorunlu — kimliğini bilmeden tahmin kaydedemezsin.
Ama bir yarışın tüm tahminlerini görmek herkese açık. 
:raceId ile hangi yarışın tahminleri isteniyorsa o gelir. Tahmin yap, geçmişine bak, yarışın tüm tahminlerini izle.*/
const express = require('express');
const router = express.Router();
const { createPrediction, getMyPredictions, getRacePredictions } = require('../controllers/predictionsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createPrediction);
// POST /api/predictions → tahmin oluştur (JWT zorunlu)

router.get('/me', authMiddleware, getMyPredictions);
// GET /api/predictions/me → kişisel tahmin geçmişi (JWT zorunlu)

router.get('/:raceId', getRacePredictions);
// GET /api/predictions/5 → o yarışın tüm tahminleri

module.exports = router;