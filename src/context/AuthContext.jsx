import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * AUTH CONTEXT PROVIDER
 * ---------------------
 * Manages user authentication state globally.
 * Stores JWT token and user info in localStorage for persistence.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore user from localStorage if available
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const avatarUrl = localStorage.getItem('avatarUrl');
    let fullName = localStorage.getItem('fullName');

    // Handle string "null" from previous buggy saves
    if (fullName === 'null' || fullName === 'undefined') fullName = null;

    if (token && username && userId) {
      setUser({ token, username, fullName, userId, email, avatarUrl });
    }
    setLoading(false);
  }, []);

  /**
   * Save user data on successful login.
   */
  const login = useCallback((userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
    localStorage.setItem('fullName', userData.fullName || '');
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('email', userData.email);
    if (userData.avatarUrl) localStorage.setItem('avatarUrl', userData.avatarUrl);
    setUser(userData);
  }, []);

  /**
   * Clear all user data on logout.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('avatarUrl');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
