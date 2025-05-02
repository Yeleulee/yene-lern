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
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration with hardcoded values for deployment
// In production, you would use environment variables more securely
const firebaseConfig = {
  apiKey: "AIzaSyBsopD1S8DgU3QZPAi6ONpfy4Pwu66VmkQ",
  authDomain: "course-645c1.firebaseapp.com",
  projectId: "course-645c1",
  storageBucket: "course-645c1.appspot.com",
  messagingSenderId: "590916776837",
  appId: "1:590916776837:web:1ec8fa67ebc889f72d4aec",
  measurementId: "G-T46294GVQE",
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
    // Add additional scopes if needed for your application
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || '',
      photoURL: user.photoURL || undefined
    };
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