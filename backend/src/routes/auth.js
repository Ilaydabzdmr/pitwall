/*Bu dosya ne yapılacağını bilir, nasıl yapılacağını bilmez. İşin mantığı controller'da, 
bu dosya sadece "bu URL'e şu istek gelirse, şu fonksiyonu çağır" der.*/

/*Tek cümleyle: "Kim olduğunu kanıtla, sisteme gir."
Üç soruyu çözer:
SoruRouteNe yaparHesabım yok, açayımPOST 
/registerYeni kullanıcı oluşturHesabım var, gireyimPOST 
/loginŞifreyi doğrula, token verBen kimim sisteme göre?GET 
/meToken'ı okuyup profili döndür*/

const express = require('express');
const router = express.Router();
// Router: app.js'deki gibi tam bir sunucu değil, sadece bir grup route tanımlar
// app.js'de /api/auth'a bağladık, buradan sonrası bu dosyada tanımlanır

const { register, login, getMe } = require('../controllers/authController');
// authController'dan 3 fonksiyon çekiyoruz
// Her fonksiyon bir endpoint'in iş mantığını içeriyor

const authMiddleware = require('../middleware/authMiddleware');
// JWT doğrulayan middleware - korumalı route'larda kullanılır

router.post('/register', register);
// POST /api/auth/register → register fonksiyonu çalışır

router.post('/login', login);
// POST /api/auth/login → login fonksiyonu çalışır

router.get('/me', authMiddleware, getMe);
// GET /api/auth/me → önce authMiddleware (token var mı?), sonra getMe
// authMiddleware geçilmezse getMe hiç çalışmaz, 401 döner

module.exports = router;