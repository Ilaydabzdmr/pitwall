/*Korumalı route'ların kapı bekçisi. Her istekte önce çalışır, geçemezsen arkasındaki fonksiyona ulaşamazsın.
Mantık doğrusal: Header'da Authorization var mı — yoksa 401. Varsa Bearer TOKEN formatını split edip token'ı ayırır. 
jwt.verify() ile token'ın gerçekten bu sunucu tarafından imzalanıp imzalanmadığını ve süresinin dolup dolmadığını kontrol eder — ikisi de JWT_SECRET ile bağlı. 
Geçerliyse decoded içindeki kullanıcı bilgisini req.user'a yazar ve next() ile zincirin devamına geçer. Geçersizse yine 401.
Bilinmesi gereken şu: req.user buradan sonraki her controller'da kullanılabilir — kim istek atıyor, hangi kullanıcı, 
kimlik bilgisi tekrar DB'ye sorulmadan buradan okunur. Bir kez doğrula, her yerde kullan.*/
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Her korumalı route'a gelen istekte bu fonksiyon önce çalışır

  const authHeader = req.headers['authorization'];
  // Frontend her istekte header'a "Bearer TOKEN" ekler
  // Örnek: "Bearer eyJhbGciOiJIUzI1NiJ9..."

  if (!authHeader) {
    return res.status(401).json({ error: 'Token bulunamadı, giriş yapman gerekiyor' });
    // 401: Unauthorized - kimlik doğrulaması başarısız
  }

  const token = authHeader.split(' ')[1];
  // "Bearer abc123" → split ile ["Bearer", "abc123"] → [1] = "abc123"
  // Sadece token kısmını alıyoruz

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // JWT_SECRET ile imzalandığını doğrular
    // Yanlış secret veya süresi dolmuş token → catch'e düşer

    req.user = decoded;
    // decoded içinde { id, username, email } var
    // Sonraki fonksiyon req.user.id ile kullanıcıyı tanır

    next();
    // Middleware'den çık, asıl route handler'a geç
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
};

module.exports = authMiddleware;