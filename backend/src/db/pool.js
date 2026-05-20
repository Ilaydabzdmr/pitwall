//.env → dotenv okur → pool oluşur → uygulama kullanır
const mysql = require('mysql2/promise');
require('dotenv').config();
/*mysql2/promise → MySQL'e bağlanmayı sağlayan kütüphane. 
Sonu /promise olması önemli — bu sayede async/await kullanabiliyorsun, 
uygulama veri beklerken bloklanmıyor.*/ 
/*dotenv → .env dosyasını okuyup değişkenleri process.env'e yükler. .config() çağrılmazsa .env okunmaz.*/ 

// MySQL bağlantı havuzu oluştur
// pool: aynı anda birden fazla sorgu çalışabilir
const pool = mysql.createPool({
  host: process.env.DB_HOST, //localhost
  port: process.env.DB_PORT, //3306
  database: process.env.DB_NAME, //pitwall
  user: process.env.DB_USER, //root
  password: process.env.DB_PASSWORD, //030905Bsql
  waitForConnections: true, // Bağlantı havuzunda bekleyen bağlantılar için
  connectionLimit: 10  // Aynı anda en fazla 10 bağlantı açılabilir
});
/*Pool = Bağlantı Havuzu.
Normalde her sorgu için MySQL'e yeni bir bağlantı açıp kapatsak ciddi performans kaybı yaşanır. 
Pool bunun yerine önceden açılmış bağlantıları hazır tutar, sorgu gelince birini verir, iş bitince geri alır.*/ 

module.exports = pool; // Diğer dosyaların bu havuzu kullanabilmesi için dışa aktar.