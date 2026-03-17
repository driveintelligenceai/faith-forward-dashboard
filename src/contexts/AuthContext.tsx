import React, { createContext, useContext, useState } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasMinRole: (role: UserRole) => boolean;
}

const ROLE_HIERARCHY: UserRole[] = ['guest', 'member', 'facilitator', 'hq_admin'];

const MOCK_USER: User = {
  id: '1',
  name: 'David Mitchell',
  email: 'david@ironforums.org',
  role: 'hq_admin',
  chapter: 'Nashville Chapter',
  joinedDate: '2023-06-15',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);

  const login = (_email: string, _password: string) => {
    setUser(MOCK_USER);
  };

  const logout = () => {
    setUser(null);
  };

  const hasRole = (role: UserRole) => user?.role === role;

  const hasMinRole = (role: UserRole) => {
    if (!user) return false;
    return ROLE_HIERARCHY.indexOf(user.role) >= ROLE_HIERARCHY.indexOf(role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole, hasMinRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
