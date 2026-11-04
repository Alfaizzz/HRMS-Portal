import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api';
import { DEMO_ADMIN_CREDENTIALS, DEMO_EMPLOYEE_CREDENTIALS } from '../config/demoConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (credentials: { username: string; password?: string }) => Promise<User>;
  loginAsDemoAdmin: () => Promise<User>;
  loginAsDemoEmployee: () => Promise<User>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    if (authApi.isAuthenticated()) {
      const current = authApi.getCurrentUser();
      setUser(current);
    } else {
      setUser(null);
    }
    setLoading(false);

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('hrms-unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('hrms-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: { username: string; password?: string }): Promise<User> => {
    setLoading(true);
    try {
      const loggedUser = await authApi.login(credentials);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoAdmin = async (): Promise<User> => {
    return login({
      username: DEMO_ADMIN_CREDENTIALS.username,
      password: DEMO_ADMIN_CREDENTIALS.password,
    });
  };

  const loginAsDemoEmployee = async (): Promise<User> => {
    return login({
      username: DEMO_EMPLOYEE_CREDENTIALS.username,
      password: DEMO_EMPLOYEE_CREDENTIALS.password,
    });
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        login,
        loginAsDemoAdmin,
        loginAsDemoEmployee,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
