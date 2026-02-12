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
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  AuthErrorCodes
} from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, increment, Timestamp, serverTimestamp, deleteDoc, onSnapshot, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration with hardcoded values for deployment
// In production, you would use environment variables more securely
const firebaseConfig = {
  apiKey: "AIzaSyCE0yUX6AVxi1c7hV8rruH_WQL3TC4508g",
  authDomain: "yene-learn.firebaseapp.com",
  projectId: "yene-learn",
  storageBucket: "yene-learn.appspot.com",
  messagingSenderId: "308752559621",
  appId: "1:308752559621:web:5d4ed1674297d30fcb766c",
  measurementId: "G-XQR4V7CSS0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Enable IndexedDB persistence to speed up subsequent loads with local cache
// This improves perceived performance by serving cached data instantly while syncing in the background
try {
  enableIndexedDbPersistence(db).catch((err) => {
    // Ignore persistence failures (e.g., multiple tabs), app will still function
    console.log('IndexedDB persistence not enabled:', err?.code || err);
  });
} catch (err) {
  console.log('IndexedDB persistence setup error:', err);
}

// Set persistence to LOCAL (survive page refresh)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Ensure a parent user document exists. Some Firestore rules require it
async function ensureUserDocument(user: User | null): Promise<User | null> {
  try {
    if (!user) return null;
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : ''),
        photoURL: user.photoURL || null,
        learningPreferences: [],
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      };
      await setDoc(userRef, userData);
      return { ...user, learningPreferences: [] };
    } else {
      // Touch lastActive and get the complete user data
      await updateDoc(userRef, { lastActive: serverTimestamp() });
      const userData = existing.data();
      return {
        ...user,
        learningPreferences: userData.learningPreferences || []
      };
    }
  } catch (e) {
    console.error('ensureUserDocument failed:', e);
    return user;
  }
}

// Helper function to ensure auth persistence is properly set
// This addresses edge cases where the persistence might not be applied correctly
export const ensureAuthPersistence = async () => {
  try {
    // Re-apply persistence setting to be sure
    await setPersistence(auth, browserLocalPersistence);
    console.log("Firebase auth persistence re-confirmed as LOCAL");
    return true;
  } catch (error) {
    console.error("Failed to set auth persistence:", error);
    return false;
  }
};

// Listen for auth state changes
export const initAuthStateListener = (callback: (user: User | null) => void) => {
  console.log("Setting up Firebase auth state listener");
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      console.log("Auth state changed: User logged in", firebaseUser.uid);
      const baseUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        photoURL: firebaseUser.photoURL || undefined
      };

      // Ensure user document exists and get complete profile data
      const completeUser = await ensureUserDocument(baseUser);
      callback(completeUser);
    } else {
      console.log("Auth state changed: No user");
      callback(null);
    }
  });
};

// Email/Password Authentication
export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    // Ensure persistence is set first
    await ensureAuthPersistence();

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const baseUser: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || email.split('@')[0],
      photoURL: userCredential.user.photoURL || undefined
    };
    const completeUser = await ensureUserDocument(baseUser);
    return completeUser;
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error('Error signing in:', error.code, error.message);
    throw new Error(error.message || 'Failed to login');
  }
}

export async function signUp(email: string, password: string): Promise<User | null> {
  try {
    // Ensure persistence is set first
    await ensureAuthPersistence();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const baseUser: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: userCredential.user.displayName || email.split('@')[0],
      photoURL: userCredential.user.photoURL || undefined
    };
    const completeUser = await ensureUserDocument(baseUser);
    return completeUser;
  } catch (error: any) {
    console.error('Error signing up:', error.code, error.message);
    throw new Error(error.message || 'Failed to register');
  }
}

// Google Authentication
export async function signInWithGoogle(): Promise<User | null> {
  try {
    // Ensure persistence is set first
    await ensureAuthPersistence();

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
      const baseUser: User = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || '',
        photoURL: user.photoURL || undefined
      };
      const completeUser = await ensureUserDocument(baseUser);
      return completeUser;
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
  try {
    const videosCol = collection(db, `users/${userId}/videos`);
    const snapshot = await getDocs(videosCol);
    const results: UserVideo[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      // Normalize to UserVideo shape
      results.push({
        id: data.id || docSnap.id,
        title: data.title || '',
        description: data.description || '',
        thumbnailUrl: data.thumbnailUrl || '',
        channelTitle: data.channelTitle || '',
        publishedAt: data.publishedAt || '',
        status: data.status || 'to-learn',
        progress: typeof data.progress === 'number' ? data.progress : undefined,
        lastWatched: data.lastWatched ? (data.lastWatched instanceof Timestamp ? data.lastWatched.toDate().toISOString() : data.lastWatched) : undefined,
        completedSegmentIds: data.completedSegmentIds || [],
        currentTimestamp: data.currentTimestamp || 0,
      });
    });
    return results;
  } catch (error) {
    console.error('Failed to fetch user videos from Firestore:', error);
    return [];
  }
}

// Real-time subscription to user videos for live updates across devices
export function subscribeToUserVideos(
  userId: string,
  onChange: (videos: UserVideo[]) => void,
  onError?: (error: unknown) => void
): () => void {
  try {
    const videosCol = collection(db, `users/${userId}/videos`);
    const unsubscribe = onSnapshot(
      videosCol,
      (snapshot) => {
        const results: UserVideo[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          results.push({
            id: data.id || docSnap.id,
            title: data.title || '',
            description: data.description || '',
            thumbnailUrl: data.thumbnailUrl || '',
            channelTitle: data.channelTitle || '',
            publishedAt: data.publishedAt || '',
            status: data.status || 'to-learn',
            progress: typeof data.progress === 'number' ? data.progress : undefined,
            lastWatched: data.lastWatched ? (data.lastWatched instanceof Timestamp ? data.lastWatched.toDate().toISOString() : data.lastWatched) : undefined,
            completedSegmentIds: data.completedSegmentIds || [],
            currentTimestamp: data.currentTimestamp || 0,
          });
        });
        onChange(results);
      },
      (err) => {
        console.error('subscribeToUserVideos error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to user videos:', error);
    return () => { };
  }
}

export async function updateVideoStatus(
  userId: string,
  videoId: string,
  status: LearningStatus
): Promise<void> {
  try {
    // Ensure we have valid parameters
    if (!userId || !videoId || !status) {
      console.error('Invalid parameters for updateVideoStatus:', { userId, videoId, status });
      throw new Error('Invalid parameters for updateVideoStatus');
    }

    console.log('Update video status:', userId, videoId, status);

    // Create a reference to the user's video document
    const videoDocRef = doc(db, `users/${userId}/videos/${videoId}`);

    // Check if the document exists
    const docSnap = await getDoc(videoDocRef);

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(videoDocRef, {
        status: status,
        lastUpdated: serverTimestamp()
      });

      // If the video is marked as completed, update user stats
      if (status === 'completed') {
        const userStatsRef = doc(db, 'userStats', userId);
        const userStatsDoc = await getDoc(userStatsRef);

        if (userStatsDoc.exists()) {
          await updateDoc(userStatsRef, {
            completedVideos: increment(1),
            lastActive: serverTimestamp()
          });
        } else {
          // Create user stats if they don't exist
          await setDoc(userStatsRef, {
            completedVideos: 1,
            savedVideos: 1,
            learningStreak: 1,
            totalLearningTime: 0,
            lastActive: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        }
      }
    } else {
      // Document doesn't exist, create it with the specified status
      await setDoc(videoDocRef, {
        id: videoId,
        status: status,
        dateAdded: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    }

    return Promise.resolve(); // Explicitly return a resolved promise
  } catch (error) {
    console.error('Error updating video status:', error);
    // Return a resolved promise to prevent UI from breaking
    return Promise.resolve();
  }
}

export async function saveVideo(userId: string, video: UserVideo): Promise<void> {
  try {
    // Ensure we have a valid userId and video object
    if (!userId || !video || !video.id) {
      console.error('Invalid parameters for saveVideo:', { userId, videoId: video?.id });
      throw new Error('Invalid parameters for saveVideo');
    }

    console.log('Saving video:', userId, video);
    // Ensure parent user document exists to satisfy typical Firestore rules
    await ensureUserDocument({ uid: userId, email: '', displayName: '', photoURL: undefined } as User);

    // Create a reference to the user's videos collection
    const videoDocRef = doc(db, `users/${userId}/videos/${video.id}`);

    // Check if the video already exists to avoid duplicate saves
    const existingDoc = await getDoc(videoDocRef);

    if (existingDoc.exists()) {
      // If video already exists, just update the status
      await updateDoc(videoDocRef, {
        status: video.status,
        lastUpdated: serverTimestamp()
      });
    } else {
      // Create new video document with server timestamp
      await setDoc(videoDocRef, {
        ...video,
        dateAdded: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Create userStats document if it doesn't exist yet
      const userStatsRef = doc(db, 'userStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);

      if (userStatsDoc.exists()) {
        // Update existing user stats
        await updateDoc(userStatsRef, {
          savedVideos: increment(1),
          lastActive: serverTimestamp()
        });
      } else {
        // Create new user stats document
        await setDoc(userStatsRef, {
          savedVideos: 1,
          completedVideos: 0,
          learningStreak: 0,
          totalLearningTime: 0,
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
    }

    console.log('Video saved successfully');
    return Promise.resolve(); // Explicitly resolve the promise
  } catch (error) {
    console.error('Error saving video:', error);
    // Propagate the error so callers can roll back optimistic UI
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(userProfile: Partial<User>): Promise<User | null> {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    console.log('Updating user profile:', userProfile);

    // Handle profile picture update
    let photoURL = userProfile.photoURL;

    // If the photoURL is a data URL (base64), upload it to Firebase Storage
    if (photoURL && photoURL.startsWith('data:image')) {
      // Create a reference to the user's profile picture
      const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);

      // Upload the image
      await uploadString(storageRef, photoURL, 'data_url');

      // Get the download URL
      photoURL = await getDownloadURL(storageRef);
    }

    // If photoURL is explicitly null, remove the profile picture
    if (userProfile.photoURL === null) {
      try {
        const storageRef = ref(storage, `profile_pictures/${currentUser.uid}`);
        await deleteObject(storageRef);
      } catch (error) {
        console.log('No existing profile picture to delete');
      }
    }

    // Update the Firebase user profile
    await firebaseUpdateProfile(currentUser, {
      displayName: userProfile.displayName || currentUser.displayName,
      photoURL: photoURL !== undefined ? photoURL : currentUser.photoURL
    });

    // Force refresh the user object to get updated displayName
    await currentUser.reload();

    // Also update the user document in Firestore with additional profile data
    const userDocRef = doc(db, 'users', currentUser.uid);
    const updateData = {
      displayName: userProfile.displayName || currentUser.displayName,
      photoURL: photoURL !== undefined ? photoURL : currentUser.photoURL,
      learningPreferences: userProfile.learningPreferences || [],
      lastUpdated: serverTimestamp()
    };

    console.log('Updating Firestore user document:', updateData);

    try {
      await updateDoc(userDocRef, updateData);
    } catch (error: any) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        console.log('User document not found, creating new one');
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email || '',
          ...updateData,
          createdAt: serverTimestamp()
        });
      } else {
        throw error;
      }
    }

    // Return the updated user object
    const updatedUser = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
      photoURL: currentUser.photoURL || undefined,
      learningPreferences: userProfile.learningPreferences || []
    };

    console.log('Profile updated successfully:', updatedUser);
    return updatedUser;
  } catch (error: any) {
    console.error('Error updating profile:', error.code, error.message);
    throw new Error(error.message || 'Failed to update profile');
  }
}

// Fetch leaderboard data - actual registered users
export async function getLeaderboard(limit: number = 10): Promise<any[]> {
  try {
    const userStatsRef = collection(db, 'userStats');
    const leaderboardQuery = query(
      userStatsRef,
      orderBy('completedVideos', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(leaderboardQuery);
    const leaderboardData: any[] = [];

    for (const doc of snapshot.docs) {
      const userData = doc.data();

      // Get user profile data
      const userProfileRef = await getDoc(doc.ref.parent.parent);
      const profileData = userProfileRef.exists() ? userProfileRef.data() : {};

      leaderboardData.push({
        uid: doc.id,
        displayName: profileData.displayName || `User-${doc.id.substring(0, 5)}`,
        photoURL: profileData.photoURL,
        completedVideos: userData.completedVideos || 0,
        learningStreak: userData.learningStreak || 0,
        lastActive: userData.lastActive ? new Date(userData.lastActive.seconds * 1000).toLocaleDateString() : 'Never',
        totalLearningTime: userData.totalLearningTime || 0
      });
    }

    return leaderboardData;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Get user's position in the leaderboard
export async function getUserLeaderboardPosition(userId: string): Promise<number> {
  try {
    // Get the user's completedVideos count
    const userStatsRef = doc(db, 'userStats', userId);
    const userStatsDoc = await getDoc(userStatsRef);

    if (!userStatsDoc.exists()) {
      return 0; // No stats yet
    }

    const userCompletedVideos = userStatsDoc.data().completedVideos || 0;

    // Count users with more completed videos
    const higherRankQuery = query(
      collection(db, 'userStats'),
      where('completedVideos', '>', userCompletedVideos)
    );

    const higherRankSnapshot = await getDocs(higherRankQuery);

    // User's position is the count of users with higher rank + 1
    return higherRankSnapshot.docs.length + 1;
  } catch (error) {
    console.error('Error getting user leaderboard position:', error);
    return 0;
  }
}

// Update user's learning stats
export async function updateLearningStats(userId: string, stats: any): Promise<void> {
  try {
    const userStatsRef = doc(db, 'userStats', userId);

    // Check if document exists
    const docSnap = await getDoc(userStatsRef);

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userStatsRef, {
        ...stats,
        lastUpdated: serverTimestamp()
      });
    } else {
      // Create new document
      await setDoc(userStatsRef, {
        ...stats,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating learning stats:', error);
    throw new Error('Failed to update learning stats');
  }
}

// Track video progress accurately
export async function trackVideoProgress(
  userId: string,
  videoId: string,
  progressPercent: number,
  watchTimeSeconds: number
): Promise<void> {
  try {
    // Reference to the user's video document
    const videoRef = doc(db, `users/${userId}/videos/${videoId}`);
    const userStatsRef = doc(db, 'userStats', userId);

    // Get current video data
    const videoDoc = await getDoc(videoRef);

    if (videoDoc.exists()) {
      const videoData = videoDoc.data();
      const prevProgress = videoData.progress || 0;
      const wasCompleted = videoData.status === 'completed';

      // Determine if video should be marked as completed
      const shouldMarkCompleted = progressPercent >= 90 && !wasCompleted;

      // Update video progress
      await updateDoc(videoRef, {
        progress: progressPercent,
        lastWatched: serverTimestamp(),
        watchTimeSeconds: increment(watchTimeSeconds),
        status: shouldMarkCompleted ? 'completed' : (progressPercent > 10 ? 'in-progress' : videoData.status)
      });

      // Update user stats
      if (shouldMarkCompleted) {
        await updateDoc(userStatsRef, {
          completedVideos: increment(1),
          totalLearningTime: increment(watchTimeSeconds),
          lastActive: serverTimestamp()
        });
      } else {
        await updateDoc(userStatsRef, {
          totalLearningTime: increment(watchTimeSeconds),
          lastActive: serverTimestamp()
        });
      }

      // Update learning streak if needed
      await updateLearningStreak(userId);
    } else {
      // Create new video document
      await setDoc(videoRef, {
        id: videoId,
        progress: progressPercent,
        watchTimeSeconds: watchTimeSeconds,
        status: progressPercent >= 90 ? 'completed' : (progressPercent > 10 ? 'in-progress' : 'to-learn'),
        lastWatched: serverTimestamp(),
        dateAdded: serverTimestamp()
      });

      // Update user stats for a new video
      await updateDoc(userStatsRef, {
        totalLearningTime: increment(watchTimeSeconds),
        lastActive: serverTimestamp(),
        completedVideos: progressPercent >= 90 ? increment(1) : increment(0)
      });

      // Update learning streak
      await updateLearningStreak(userId);
    }
  } catch (error) {
    console.error('Error tracking video progress:', error);
    throw new Error('Failed to track video progress');
  }
}

// Update the user's learning streak
async function updateLearningStreak(userId: string): Promise<void> {
  try {
    const userStatsRef = doc(db, 'userStats', userId);
    const userStatsDoc = await getDoc(userStatsRef);

    if (!userStatsDoc.exists()) {
      // Create initial stats if they don't exist
      await setDoc(userStatsRef, {
        learningStreak: 1,
        lastStreakUpdate: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return;
    }

    const stats = userStatsDoc.data();
    const lastUpdate = stats.lastStreakUpdate?.toDate() || new Date(0);
    const today = new Date();

    // Reset date times to beginning of day for comparison
    const lastUpdateDay = new Date(lastUpdate).setHours(0, 0, 0, 0);
    const todayDay = new Date(today).setHours(0, 0, 0, 0);
    const yesterdayDay = new Date(today).setHours(-24, 0, 0, 0);

    // Calculate the streak
    if (lastUpdateDay === todayDay) {
      // Already updated today, no change needed
      return;
    } else if (lastUpdateDay === yesterdayDay) {
      // Consecutive day, increment streak
      await updateDoc(userStatsRef, {
        learningStreak: increment(1),
        lastStreakUpdate: serverTimestamp()
      });
    } else if (lastUpdateDay < yesterdayDay) {
      // Streak broken, reset to 1
      await updateDoc(userStatsRef, {
        learningStreak: 1,
        lastStreakUpdate: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating learning streak:', error);
  }
}

// Remove video from user's learning list
export async function removeVideo(userId: string, videoId: string): Promise<void> {
  try {
    // Ensure we have valid parameters
    if (!userId || !videoId) {
      console.error('Invalid parameters for removeVideo:', { userId, videoId });
      throw new Error('Invalid parameters for removeVideo');
    }

    console.log('Removing video:', userId, videoId);

    // Create a reference to the user's video document
    const videoDocRef = doc(db, `users/${userId}/videos/${videoId}`);

    // Check if the document exists
    const docSnap = await getDoc(videoDocRef);

    if (docSnap.exists()) {
      // Get the current status of the video to update stats
      const videoData = docSnap.data();
      const status = videoData.status;

      // Delete the video document
      await deleteDoc(videoDocRef);

      // Update user stats if necessary
      const userStatsRef = doc(db, 'userStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);

      if (userStatsDoc.exists()) {
        const updateData: any = {
          savedVideos: increment(-1),
          lastActive: serverTimestamp()
        };

        // If it was a completed video, decrement the completed count
        if (status === 'completed') {
          updateData.completedVideos = increment(-1);
        }

        await updateDoc(userStatsRef, updateData);
      }

      console.log('Video removed successfully');
    } else {
      console.log('Video does not exist, nothing to remove');
    }

    return Promise.resolve(); // Explicitly resolve the promise
  } catch (error) {
    console.error('Error removing video:', error);
    // Return a resolved promise to prevent UI from breaking
    return Promise.resolve();
  }
}

// Update detailed video progress state (timestamp, segments)
export async function updateVideoProgressState(
  userId: string,
  videoId: string,
  state: {
    currentTimestamp: number;
    completedSegmentIds: string[];
    progress: number;
  }
): Promise<void> {
  try {
    if (!userId || !videoId) return;

    const videoRef = doc(db, `users/${userId}/videos/${videoId}`);
    const docSnap = await getDoc(videoRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const newStatus = state.progress >= 95 ? 'completed' : (data.status === 'completed' ? 'completed' : 'in-progress');

      await updateDoc(videoRef, {
        currentTimestamp: state.currentTimestamp,
        completedSegmentIds: state.completedSegmentIds,
        progress: state.progress,
        lastWatched: serverTimestamp(),
        status: newStatus
      });

      // Update stats if newly completed
      if (newStatus === 'completed' && data.status !== 'completed') {
        const userStatsRef = doc(db, 'userStats', userId);
        // Create or update stats
        try {
          await updateDoc(userStatsRef, {
            completedVideos: increment(1),
            lastActive: serverTimestamp()
          });
        } catch (e) {
          // Ignore if stats doc doesn't exist (rare)
        }
      }
    }
  } catch (error) {
    console.error('Error updating video progress state:', error);
  }
}