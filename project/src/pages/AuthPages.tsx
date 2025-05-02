import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      // If user came from a specific page, redirect back to it
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthInProgress(true);
    
    try {
      await login(email, password);
      // Navigation happens in the useEffect when user state changes
    } catch (err: any) {
      // More descriptive error messages
      if (err.message?.includes('auth/wrong-password') || 
          err.message?.includes('auth/user-not-found')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message?.includes('auth/too-many-requests')) {
        setError('Too many failed attempts. Please try again later or reset your password.');
      } else if (err.message?.includes('auth/network-request-failed')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      console.error('Login error details:', err);
    } finally {
      setAuthInProgress(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setAuthInProgress(true);
    
    try {
      await loginWithGoogle();
      // Navigation happens in the useEffect when user state changes
    } catch (err: any) {
      if (err.message?.includes('popup-blocked')) {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err.message?.includes('popup-closed-by-user')) {
        setError('Login was canceled. Please try again.');
      } else if (err.message?.includes('auth/network-request-failed')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('This domain isn\'t authorized')) {
        setError('Authentication domain not authorized. Please use email sign-in instead.');
      } else {
        setError(err.message || 'Google login failed. Please try again.');
      }
      console.error('Google login error details:', err);
    } finally {
      setAuthInProgress(false);
    }
  };

  // If login is in progress, show loading
  const isLoading = loading || authInProgress;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Log in to continue your learning journey</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          
          <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
            Log In
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            isLoading={isLoading}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign in with Google
          </Button>
          
          <div className="text-center mt-4">
            <div className="text-sm text-gray-600 mb-2">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setAuthInProgress(true);
    try {
      await register(email, password);
      // Navigation happens in the useEffect when user state changes
    } catch (err: any) {
      if (err.message?.includes('auth/email-already-in-use')) {
        setError('This email is already registered. Please log in or use a different email.');
      } else if (err.message?.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (err.message?.includes('auth/network-request-failed')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
      console.error('Registration error details:', err);
    } finally {
      setAuthInProgress(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setAuthInProgress(true);
    
    try {
      await loginWithGoogle();
      // Navigation happens in the useEffect when user state changes
    } catch (err: any) {
      if (err.message?.includes('popup-blocked')) {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err.message?.includes('popup-closed-by-user')) {
        setError('Sign-up was canceled. Please try again.');
      } else if (err.message?.includes('auth/network-request-failed')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('This domain isn\'t authorized')) {
        setError('Authentication domain not authorized. Please use email sign-up instead.');
      } else {
        setError(err.message || 'Google sign-up failed. Please try again.');
      }
      console.error('Google signup error details:', err);
    } finally {
      setAuthInProgress(false);
    }
  };

  // If signup is in progress, show loading
  const isLoading = loading || authInProgress;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-gray-600">Start your learning journey today</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
          
          <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
            Create Account
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignup}
            isLoading={isLoading}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign up with Google
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};