import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '../types';

// Get Firestore instance from imported Firebase initialization
const db = getFirestore();

// Define user profile with learning statistics
export interface UserProfile extends User {
  learningPreferences?: string[];
  joinDate: string;
  learningStreak: number;
  totalVideosWatched: number;
  totalLearningTimeSeconds: number;
  lastActive: string;
  competitiveStatus: 'beginner' | 'intermediate' | 'advanced';
  badges: string[];
}

// Get user profile with learning metrics
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      // If user exists in Auth but not in Firestore, create basic profile
      const basicUser = await createBasicUserProfile(userId);
      return basicUser;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Create basic user profile if it doesn't exist yet
async function createBasicUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Get user data from auth (in a real app)
    // Here we'll mock it since we're not directly accessing Auth
    const basicProfile: UserProfile = {
      uid: userId,
      email: 'user@example.com', // This would come from Auth
      displayName: 'New User', // This would come from Auth
      joinDate: new Date().toISOString(),
      learningStreak: 0,
      totalVideosWatched: 0,
      totalLearningTimeSeconds: 0,
      lastActive: new Date().toISOString(),
      competitiveStatus: 'beginner',
      badges: ['newcomer']
    };
    
    // Save to Firestore
    await setDoc(doc(db, 'users', userId), basicProfile);
    return basicProfile;
  } catch (error) {
    console.error('Error creating basic user profile:', error);
    return null;
  }
}

// Update user learning statistics
export async function updateUserLearningStats(
  userId: string, 
  stats: Partial<UserProfile>
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...stats,
      lastActive: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user learning stats:', error);
    return false;
  }
}

// Get top learners for the leaderboard
export async function getLeaderboard(limit: number = 10): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, 'users'),
      // Order by completed videos, learning streak, etc.
      // In a real implementation, this would have proper Firebase queries
    );
    
    const querySnapshot = await getDocs(q);
    const leaders: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      leaders.push(doc.data() as UserProfile);
    });
    
    // Sort by total videos watched
    return leaders.sort((a, b) => b.totalVideosWatched - a.totalVideosWatched).slice(0, limit);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    
    // Return mock data for now - in production this would be fetched from Firestore
    return [
      {
        uid: '1',
        email: 'sarah@example.com',
        displayName: 'Sarah Johnson',
        joinDate: '2023-01-15T00:00:00.000Z',
        learningStreak: 7,
        totalVideosWatched: 42,
        totalLearningTimeSeconds: 3600 * 20,
        lastActive: new Date().toISOString(),
        competitiveStatus: 'advanced',
        badges: ['fast-learner', '10-videos', '25-videos']
      },
      {
        uid: '2',
        email: 'michael@example.com',
        displayName: 'Michael Chen',
        joinDate: '2023-02-20T00:00:00.000Z',
        learningStreak: 5,
        totalVideosWatched: 38,
        totalLearningTimeSeconds: 3200 * 20,
        lastActive: new Date().toISOString(),
        competitiveStatus: 'intermediate',
        badges: ['consistent', '25-videos']
      },
      {
        uid: '3',
        email: 'emma@example.com',
        displayName: 'Emma Wilson',
        joinDate: '2023-03-10T00:00:00.000Z',
        learningStreak: 4,
        totalVideosWatched: 35,
        totalLearningTimeSeconds: 2900 * 20,
        lastActive: new Date().toISOString(),
        competitiveStatus: 'intermediate',
        badges: ['night-owl', '25-videos']
      },
      {
        uid: '4',
        email: 'david@example.com',
        displayName: 'David Kim',
        joinDate: '2023-04-05T00:00:00.000Z',
        learningStreak: 3,
        totalVideosWatched: 29,
        totalLearningTimeSeconds: 2400 * 20,
        lastActive: new Date().toISOString(),
        competitiveStatus: 'beginner',
        badges: ['weekend-warrior', '10-videos']
      }
    ];
  }
}

// Update user learning streak
export async function updateUserStreak(userId: string): Promise<number> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return 0;
    
    const userData = userDoc.data() as UserProfile;
    const lastActive = new Date(userData.lastActive);
    const now = new Date();
    
    // Check if the user was active yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = userData.learningStreak || 0;
    
    // If active yesterday, increment streak
    if (lastActive.toDateString() === yesterday.toDateString()) {
      newStreak += 1;
    } 
    // If active today already, keep streak
    else if (lastActive.toDateString() === now.toDateString()) {
      // Already updated today, do nothing
    } 
    // If more than a day gap, reset streak to 1
    else {
      newStreak = 1;
    }
    
    // Update streak in database
    await updateDoc(userRef, {
      learningStreak: newStreak,
      lastActive: now.toISOString()
    });
    
    return newStreak;
  } catch (error) {
    console.error('Error updating user streak:', error);
    return 0;
  }
} 