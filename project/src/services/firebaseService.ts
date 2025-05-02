import { User, UserVideo, LearningStatus } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration with fallback for direct API key usage
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBsopD1S8DgU3QZPAi6ONpfy4Pwu66VmkQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'course-645c1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'course-645c1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'course-645c1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '590916776837',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:590916776837:web:1ec8fa67ebc889f72d4aec',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-T46294GVQE',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Email/Password Authentication
export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || email.split('@')[0],
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
}

export async function signUp(email: string, password: string): Promise<User | null> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || email.split('@')[0],
    };
  } catch (error) {
    console.error('Error signing up:', error);
    return null;
  }
}

// Google Authentication
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
  return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || '',
      photoURL: user.photoURL || undefined
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return null;
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

// Mock user video functions - would be replaced with Firestore in production
export async function getUserVideos(userId: string): Promise<UserVideo[]> {
  // This would be replaced with actual Firestore calls
  console.log('Get videos for user:', userId);
  
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
}

export async function saveVideo(userId: string, video: UserVideo): Promise<void> {
  // This would be replaced with actual Firestore calls
  console.log('Save video:', userId, video);
}