import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, adminLogin as apiAdminLogin, fetchProfile } from './auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tickets_token'));
  const [loading, setLoading] = useState(true);

  const [ownerUnlocked, setOwnerUnlocked] = useState(
    () => sessionStorage.getItem('tickets_owner_unlocked') === 'true'
  );

  // On mount, validate any existing token stored from a previous session
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchProfile(token)
      .then((data) =>
        setUser({
          id: data.userId,
          name: data.name,
          mobileNumber: data.mobileNumber,
          role: data.role || (data.mobileNumber === '8602891120' ? 'ADMIN' : 'USER'),
        })
      )
      .catch(() => {
        localStorage.removeItem('tickets_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (mobileNumber, password) => {
    const res = await apiLogin({ mobileNumber, password });
    localStorage.setItem('tickets_token', res.token);
    setToken(res.token);
    setUser({
      id: res.userId,
      name: res.name,
      mobileNumber: res.mobileNumber,
      role: res.role || (res.mobileNumber === '8602891120' ? 'ADMIN' : 'USER'),
    });
    return res;
  }, []);

  const adminLogin = useCallback(async (mobileNumber, pin) => {
    const res = await apiAdminLogin({ mobileNumber, pin });
    localStorage.setItem('tickets_token', res.token);
    setToken(res.token);
    setUser({
      id: res.userId,
      name: res.name,
      mobileNumber: res.mobileNumber,
      role: res.role || 'ADMIN',
    });
    sessionStorage.setItem('tickets_owner_unlocked', 'true');
    setOwnerUnlocked(true);
    return res;
  }, []);

  const signup = useCallback(async (name, mobileNumber, password) => {
    const res = await apiRegister({ name, mobileNumber, password });
    localStorage.setItem('tickets_token', res.token);
    setToken(res.token);
    setUser({
      id: res.userId,
      name: res.name,
      mobileNumber: res.mobileNumber,
      role: res.role || (res.mobileNumber === '8602891120' ? 'ADMIN' : 'USER'),
    });
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tickets_token');
    setToken(null);
    setUser(null);
  }, []);

  const unlockOwner = useCallback((pin) => {
    if (pin === '2005') {
      sessionStorage.setItem('tickets_owner_unlocked', 'true');
      setOwnerUnlocked(true);
      return true;
    }
    return false;
  }, []);

  const lockOwner = useCallback(() => {
    sessionStorage.removeItem('tickets_owner_unlocked');
    setOwnerUnlocked(false);
  }, []);

  const isOwner =
    user?.role === 'ADMIN' ||
    user?.mobileNumber === '8602891120' ||
    ownerUnlocked;

  const value = {
    user,
    token,
    isLoggedIn: !!user,
    isOwner,
    unlockOwner,
    lockOwner,
    loading,
    login,
    adminLogin,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
