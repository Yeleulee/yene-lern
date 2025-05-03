import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { 
  signIn, 
  signUp, 
  signOut, 
  signInWithGoogle, 
  getCurrentUser,
  updateUserProfile,
  initAuthStateListener
} from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userProfile: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'yene_learn_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to persist user in localStorage
  const persistUser = (userData: User | null) => {
    if (userData) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  };

  // Check authentication state on mount and when auth changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // First try to get user from localStorage for immediate UI response
        const storedUser = localStorage.getItem(AUTH_USER_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        // Then verify with Firebase
        const firebaseUser = getCurrentUser();
        
        if (firebaseUser) {
          // Update user with latest from Firebase if needed
          setUser(firebaseUser);
          persistUser(firebaseUser);
        } else if (storedUser) {
          // If Firebase doesn't have the user but localStorage does,
          // this means the session expired - clear localStorage
          localStorage.removeItem(AUTH_USER_KEY);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Perform initial auth check
    checkAuth();
    
    // Set up a periodic check every 5 minutes to verify authentication
    const intervalId = setInterval(() => {
      const currentUser = getCurrentUser();
      if (!currentUser && user) {
        // If session expired, log the user out
        setUser(null);
        persistUser(null);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await signIn(email, password);
      if (userData) {
        setUser(userData);
        persistUser(userData);
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
      const userData = await signInWithGoogle();
      if (userData) {
        setUser(userData);
        persistUser(userData);
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
      const userData = await signUp(email, password);
      if (userData) {
        setUser(userData);
        persistUser(userData);
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
      persistUser(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during logout';
      setError(errorMessage);
      console.error('Logout error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userProfile: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await updateUserProfile(userProfile);
      if (updatedUser) {
        setUser(updatedUser);
        persistUser(updatedUser);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred updating profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      loginWithGoogle, 
      logout,
      updateProfile 
    }}>
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