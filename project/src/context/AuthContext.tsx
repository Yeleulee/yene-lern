import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { 
  signIn, 
  signUp, 
  signOut, 
  signInWithGoogle, 
  getCurrentUser
} from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication state on mount and when auth changes
  useEffect(() => {
    // First, try to get the current Firebase authenticated user
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setLoading(false);
      return;
    }
    
    // Fallback to localStorage if Firebase auth state is not available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Invalid JSON in localStorage, clear it
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await signIn(email, password);
      if (user) {
        setUser(user);
        // Store in localStorage as a backup
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        throw new Error('Failed to login');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      if (user) {
        setUser(user);
        // Store in localStorage as a backup
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        throw new Error('Failed to login with Google');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during Google login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await signUp(email, password);
      if (user) {
        setUser(user);
        // Store in localStorage as a backup
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        throw new Error('Failed to register');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during logout';
      setError(errorMessage);
      console.error('Logout error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}