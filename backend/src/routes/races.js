/*Yarış sisteminin 4 endpoint'i. Takvim ve sonuçlar herkese açık, puanlama JWT zorunlu çünkü kimin tahmininin puanlandığını bilmek lazım. 
/:id/results ve /:id/score iç içe yapısı aynı yarışın farklı aksiyonları — biri sonucu gösterir, biri puanı hesaplar. 
Takvimi gör, detaya in, sonuçları izle, tahminleri puanla.*/
const express = require('express');
const router = express.Router();
const { getRaces, getRaceById, getRaceResults, scoreRace } = require('../controllers/racesController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', getRaces);
// GET /api/races → tüm yarış takvimini döner

router.get('/:id', getRaceById);
// GET /api/races/5 → id=5 olan yarışın detayını döner
// :id dinamik parametre, req.params.id ile okunur

router.get('/:id/results', getRaceResults);
// GET /api/races/5/results → o yarışın sonuçlarını döner

router.post('/:id/score', authMiddleware, scoreRace);
// POST /api/races/5/score → yarışı puanla (JWT korumalı)

module.exports = router;