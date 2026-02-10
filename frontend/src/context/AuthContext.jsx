import { createContext, useMemo, useState } from 'react';

// Authentication context placeholder for future integration.
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(mockUser) {
    setUser(mockUser);
  }

  function logout() {
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
