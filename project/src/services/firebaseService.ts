import { User, UserVideo, LearningStatus } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  AuthErrorCodes
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables with fallback to hardcoded values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCE0yUX6AVxi1c7hV8rruH_WQL3TC4508g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yene-learn.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yene-learn",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yene-learn.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "308752559621",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:308752559621:web:5d4ed1674297d30fcb766c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XQR4V7CSS0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence to LOCAL (survive page refresh)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Email/Password Authentication
export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    // Check for demo account in production deployments
    if (window.location.hostname !== 'localhost' && 
        email === 'demo@example.com' && 
        password === 'password123') {
      // Return a demo user without actually authenticating with Firebase
      return {
        uid: 'demo-user-123',
        email: 'demo@example.com',
        displayName: 'Demo User',
        photoURL: undefined
      };
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || email.split('@')[0],
      photoURL: userCredential.user.photoURL || undefined
    };
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error('Error signing in:', error.code, error.message);
    
    // If we're in a deployment environment, give friendly error
    if (window.location.hostname !== 'localhost') {
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Authentication domain not authorized. This is a demo environment - please use the demo credentials shown above.');
      }
    }
    
    throw new Error(error.message || 'Failed to login'); 
  }
}

export async function signUp(email: string, password: string): Promise<User | null> {
  try {
    // Check for demo mode in production deployments
    if (window.location.hostname !== 'localhost' && 
        email === 'demo@example.com') {
      throw new Error('This is a demo account. Please use a different email or log in with the demo credentials.');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || email.split('@')[0],
      photoURL: userCredential.user.photoURL || undefined
    };
  } catch (error: any) {
    console.error('Error signing up:', error.code, error.message);
    throw new Error(error.message || 'Failed to register');
  }
}

// Google Authentication
export async function signInWithGoogle(): Promise<User | null> {
  try {
    // If we're in the demo deployment, don't allow Google auth to avoid auth errors
    if (window.location.hostname !== 'localhost') {
      throw new Error('Google authentication is disabled in this demo environment. Please use the demo account credentials.');
    }
    
    // Configure Google provider with proper settings for deployment
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      login_hint: ''
    });
    
    // Add additional scopes if needed for your application
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // Try to use signInWithPopup - this works on most browsers
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || '',
        photoURL: user.photoURL || undefined
      };
    } catch (popupError: any) {
      // If popup is blocked or fails, log detailed error for debugging
      console.error('Popup sign-in failed:', popupError.code, popupError.message);
      
      // Throw with more specific error messages for proper handling
      if (popupError.code === 'auth/popup-blocked') {
        throw new Error('popup-blocked');
      } else if (popupError.code === 'auth/popup-closed-by-user') {
        throw new Error('popup-closed-by-user');
      } else if (popupError.code === 'auth/unauthorized-domain') {
        throw new Error(`This domain isn't authorized for Google authentication. Please contact support.`);
      } else {
        throw popupError;
      }
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error.code, error.message);
    throw new Error(error.message || 'Failed to login with Google');
  }
}

export async function signOut(): Promise<void> {
  try {
    // Check if this is a demo user
    const currentUser = getCurrentUser();
    if (currentUser?.uid === 'demo-user-123') {
      // No need to sign out from Firebase for demo users
      return;
    }
    
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Retrieve current authenticated user (for checking auth state)
export function getCurrentUser(): User | null {
  // Check if this is a demo user in localStorage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.uid === 'demo-user-123') {
        return user;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  
  const currentUser = auth.currentUser;
  
  if (!currentUser) return null;
  
  return {
    uid: currentUser.uid,
    email: currentUser.email || '',
    displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
    photoURL: currentUser.photoURL || undefined
  };
}

// Demo user videos
const demoUserVideos: UserVideo[] = [
  {
    id: 'W6NZfCO5SIk',
    title: 'JavaScript Tutorial for Beginners',
    description: 'Learn JavaScript in 1 Hour',
    thumbnailUrl: 'https://i.ytimg.com/vi/W6NZfCO5SIk/mqdefault.jpg',
    channelTitle: 'Programming with Mosh',
    publishedAt: '2021-05-15',
    status: 'completed',
    progress: 3600,
  },
  {
    id: 'DHvZLI7Db8E',
    title: 'React Hooks Explained',
    description: 'Learn all about React Hooks and how to use them in your applications',
    thumbnailUrl: 'https://i.ytimg.com/vi/dpw9EHDh2bM/mqdefault.jpg',
    channelTitle: 'Web Dev Simplified',
    publishedAt: '2021-03-10',
    status: 'in-progress',
    progress: 1250,
  },
  {
    id: 'FazgJVnrVuI',
    title: 'HTML & CSS Full Course',
    description: 'Learn HTML and CSS from scratch',
    thumbnailUrl: 'https://i.ytimg.com/vi/G3e-cpL7ofc/mqdefault.jpg',
    channelTitle: 'SuperSimpleDev',
    publishedAt: '2022-01-12',
    status: 'to-learn',
  }
];

// Mock user video functions - would be replaced with Firestore in production
export async function getUserVideos(userId: string): Promise<UserVideo[]> {
  // This would be replaced with actual Firestore calls
  console.log('Get videos for user:', userId);
  
  // Return demo videos for the demo user
  if (userId === 'demo-user-123') {
    return demoUserVideos;
  }
  
  return [
    {
      id: 'dQw4w9WgXcQ',
      title: 'JavaScript ES6 Tutorial',
      description: 'Learn the most important features of ES6 JavaScript',
      thumbnailUrl: 'https://i.ytimg.com/vi/W6NZfCO5SIk/mqdefault.jpg',
      channelTitle: 'Programming with Mosh',
      publishedAt: '2021-05-15',
      status: 'in-progress',
      progress: 45,
    },
    {
      id: 'DHvZLI7Db8E',
      title: 'React Hooks Explained',
      description: 'Learn all about React Hooks and how to use them in your applications',
      thumbnailUrl: 'https://i.ytimg.com/vi/dpw9EHDh2bM/mqdefault.jpg',
      channelTitle: 'Web Dev Simplified',
      publishedAt: '2021-03-10',
      status: 'to-learn',
    }
  ];
}

export async function updateVideoStatus(
  userId: string,
  videoId: string,
  status: LearningStatus
): Promise<void> {
  // This would be replaced with actual Firestore calls
  console.log('Update video status:', userId, videoId, status);
  
  // Update status for demo user
  if (userId === 'demo-user-123') {
    const videoIndex = demoUserVideos.findIndex(v => v.id === videoId);
    if (videoIndex >= 0) {
      demoUserVideos[videoIndex].status = status;
    }
  }
}

export async function saveVideo(userId: string, video: UserVideo): Promise<void> {
  // This would be replaced with actual Firestore calls
  console.log('Save video:', userId, video);
  
  // Save for demo user
  if (userId === 'demo-user-123') {
    const existingIndex = demoUserVideos.findIndex(v => v.id === video.id);
    if (existingIndex >= 0) {
      demoUserVideos[existingIndex] = video;
    } else {
      demoUserVideos.push(video);
    }
  }
}