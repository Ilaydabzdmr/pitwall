/*Uygulamanın kimlik doğrulama beyni — auth state'i tek yerden yönetip her bileşene dağıtan context sistemi.
token başlangıçta localStorage'dan okunur, sayfa yenilenince sıfırlanmaz. useEffect token varsa /auth/me'ye istek atar, 
kullanıcı bilgisini çeker — bu sayede yenileme sonrası oturum kaybolmaz. Token geçersizse logout() otomatik tetiklenir, kirli state kalmaz.
login hem localStorage'a hem state'e yazar, ikisi senkron olmalı. logout ikisini de temizler.
 loading flag'i kritik — /auth/me yanıt vermeden uygulama render edilirse kullanıcı anlık olarak çıkmış görünür, 
 loading true olduğu sürece ekran bekleme modunda tutulur.
AuthContext.Provider tüm uygulamayı sarar, içindeki her bileşen useAuth() ile user, token, login, logout, loading'e ulaşır — prop drilling olmadan, tek satırla.
Bilinmesi gereken şu: tüm auth mantığı burada, navbar da login sayfası da profil de sadece bu hook'u dinliyor. State burada değişince her yer otomatik güncellenir.*/

import { useState, useEffect, createContext, useContext } from 'react';
import api from '../api/axios';

// Context: token ve kullanıcı bilgisini uygulamanın her yerinden erişilebilir yapar
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sayfa yenilenince token hala localStorage'da varsa kullanıcıyı getir
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => logout()) // Token geçersizse çıkış yap
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    // Token'ı tarayıcıya kaydet, sayfa yenilense de kalır
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Her bileşenden const { user, login, logout } = useAuth() ile kullanılır
export const useAuth = () => useContext(AuthContext);