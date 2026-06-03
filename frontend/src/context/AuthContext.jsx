import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ejp_token'));
  const [loading, setLoading] = useState(true);

  // Load user profile on mount or token change
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.me();
        setUser(data.user);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        // Clear invalid token
        localStorage.removeItem('ejp_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('ejp_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ejp_token');
    setToken(null);
    setUser(null);
  };

  /**
   * Helper to check if the current user has access to a menu
   * @param {string} menuName - The menu key (e.g. 'projects', 'bankStatement')
   * @param {'read'|'write'} action - Required action type
   * @returns {boolean}
   */
  const hasPermission = (menuName, action = 'read') => {
    if (!user) return false;
    if (!menuName) return true;
    
    let key = menuName;
    if (menuName === 'payroll' || menuName === 'assets') {
      key = 'payrollAssets';
    }
    
    const permission = user.permissions?.[key];
    if (!permission || permission === 'none') return false;
    
    if (action === 'write') {
      return permission === 'write';
    }
    
    // read action permits both 'read' and 'write'
    return permission === 'read' || permission === 'write';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
