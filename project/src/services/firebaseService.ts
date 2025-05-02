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

// Firebase configuration with hardcoded values for deployment
// In production, you would use environment variables more securely
const firebaseConfig = {
  apiKey: "AIzaSyCE0yUX6AVxi1c7hV8rruH_WQL3TC4508g",
  authDomain: "yene-learn.firebaseapp.com",
  projectId: "yene-learn",
  storageBucket: "yene-learn.firebasestorage.app",
  messagingSenderId: "308752559621",
  appId: "1:308752559621:web:5d4ed1674297d30fcb766c",
  measurementId: "G-XQR4V7CSS0"
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
    throw new Error(error.message || 'Failed to login'); 
  }
}

export async function signUp(email: string, password: string): Promise<User | null> {
  try {
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
    // Configure Google provider with proper settings
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
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Retrieve current authenticated user (for checking auth state)
export function getCurrentUser(): User | null {
  const currentUser = auth.currentUser;
  
  if (!currentUser) return null;
  
  return {
    uid: currentUser.uid,
    email: currentUser.email || '',
    displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
    photoURL: currentUser.photoURL || undefined
  };
}

// Replace demo user videos with real Firestore integration
export async function getUserVideos(userId: string): Promise<UserVideo[]> {
  // This would be replaced with actual Firestore calls
  console.log('Get videos for user:', userId);
  
  return [
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
}

export async function updateVideoStatus(
  userId: string,
  videoId: string,
  status: LearningStatus
): Promise<void> {
  // This would be replaced with actual Firestore calls
  console.log('Update video status:', userId, videoId, status);
}

export async function saveVideo(userId: string, video: UserVideo): Promise<void> {
  // This would be replaced with actual Firestore calls
  console.log('Save video:', userId, video);
}