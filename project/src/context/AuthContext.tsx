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
    let authInitialized = false;
    setLoading(true);
    
    // First try to get user from localStorage for immediate UI response
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // Set up Firebase auth state listener for persistence
    const unsubscribe = initAuthStateListener((firebaseUser) => {
      // Mark that we've received at least one auth state update
      authInitialized = true;
      
      if (firebaseUser) {
        // User is signed in
        console.log('Auth state changed: User is signed in', firebaseUser.uid);
        setUser(firebaseUser);
        persistUser(firebaseUser);
      } else {
        // User is signed out
        console.log('Auth state changed: User is signed out');
        setUser(null);
        persistUser(null);
      }
      setLoading(false);
    });
    
    // Set a timeout to ensure loading state is updated even if Firebase is slow
    const timeoutId = setTimeout(() => {
      if (!authInitialized) {
        console.warn('Firebase auth initialization taking longer than expected');
        // Don't change the user state, but stop showing loading indicator
        // This allows the app to be usable with localStorage auth if Firebase is slow
    setLoading(false);
      }
    }, 5000); // 5 second timeout
    
    // Cleanup the listener and timeout on unmount
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Add a reconnection handler for when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored, checking auth state');
      // Get the current Firebase user when we come back online
      const currentUser = getCurrentUser();
      
      // If we have a user in localStorage but not in Firebase, logout
      const storedUser = localStorage.getItem(AUTH_USER_KEY);
      if (storedUser && !currentUser) {
        console.warn('Network restored but auth session expired, logging out');
        setUser(null);
        persistUser(null);
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Handle token refresh failures and session expiry
  useEffect(() => {
    if (!user) return; // Only run when user is logged in
    
    // Set up checking for token expiry
    const checkSession = () => {
      const currentUser = getCurrentUser();
      if (!currentUser && user) {
        // If we have a user in context but Firebase reports no user,
        // it likely means the token refresh failed
        console.warn('Session appears to have expired, logging out');
        setUser(null);
        persistUser(null);
        setError('Your session has expired. Please log in again.');
      }
    };
    
    // Check periodically (every 5 minutes)
    const intervalId = setInterval(checkSession, 5 * 60 * 1000);
    
    // Also check when the app regains focus
    const handleFocus = () => {
      console.log('Window gained focus, checking auth session');
      checkSession();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

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
      console.error('Login error:', error);
      
      // Handle specific error types
      let errorMessage = 'An error occurred during login';
      if (error instanceof Error) {
        // Provide more specific error messages for common issues
        if (error.message.includes('wrong-password') || error.message.includes('user-not-found')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many failed login attempts. Please try again later.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
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
      console.error('Google login error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'An error occurred during Google login';
      if (error instanceof Error) {
        if (error.message === 'popup-blocked') {
          errorMessage = 'The login popup was blocked. Please allow popups for this site.';
        } else if (error.message === 'popup-closed-by-user') {
          errorMessage = 'The login was cancelled.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
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