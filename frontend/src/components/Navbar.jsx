/*Uygulamanın navigasyon çubuğu — her sayfada görünen tek bileşen.
useAuth hook'undan user ve logout çekiliyor. user varsa — yani giriş yapılmışsa — profil linki ve çıkış butonu gösterilir, 
yoksa giriş yap ve kayıt ol linkleri. Bu koşullu render tamamen user state'ine bağlı, auth durumu değişince navbar otomatik güncellenir.
handleLogout önce logout() çağırır — token silinir, user state temizlenir — sonra navigate('/') ile ana sayfaya yönlendirir. 
Sırası önemli, önce temizle sonra yönlendir.
Bilinmesi gereken şu: navbar login/logout mantığını kendisi yönetmiyor, sadece useAuth'u dinliyor. Gerçek iş mantığı o hook'ta.*/

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
      <img src="/f1logo.png" alt="F1" style={{ height: '56px', marginRight: '16px', verticalAlign: 'middle' }} />
       PitWall
     </Link>

      <div className="navbar-links">
        <Link to="/races">Yarışlar</Link>
        <Link to="/drivers">Sürücüler</Link>
        <Link to="/leaderboard">Liderboard</Link>

        {user ? (
          <>
            <Link to="/profile" className="navbar-user">
              👤 {user.username}
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              Çıkış
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-login">Giriş Yap</Link>
            <Link to="/register" className="btn-register">Kayıt Ol</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;