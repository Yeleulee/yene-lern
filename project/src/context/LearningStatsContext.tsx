import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLearning } from './LearningContext';

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  completedVideos: number;
  learningStreak: number;
  lastActive: string;
  totalLearningTime: number;
}

interface LearningStatsContextType {
  leaderboard: LeaderboardUser[];
  userPosition: number;
  learningStreak: number;
  isImproving: boolean;
  fasterLearners: LeaderboardUser[];
  loading: boolean;
  refreshStats: () => Promise<void>;
}

const LearningStatsContext = createContext<LearningStatsContextType | undefined>(undefined);

// Mock data - in a real app, this would come from Firebase
const mockLeaderboard: LeaderboardUser[] = [
  {
    uid: '1',
    displayName: 'Sarah Johnson',
    completedVideos: 42,
    learningStreak: 7,
    lastActive: '2023-07-15',
    totalLearningTime: 3600,
  },
  {
    uid: '2',
    displayName: 'Michael Chen',
    completedVideos: 38,
    learningStreak: 5,
    lastActive: '2023-07-14',
    totalLearningTime: 3200,
  },
  {
    uid: '3',
    displayName: 'Emma Wilson',
    completedVideos: 35,
    learningStreak: 4,
    lastActive: '2023-07-16',
    totalLearningTime: 2900,
  },
  {
    uid: '4',
    displayName: 'David Kim',
    completedVideos: 29,
    learningStreak: 3,
    lastActive: '2023-07-12',
    totalLearningTime: 2400,
  },
];

export function LearningStatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userVideos } = useLearning();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(mockLeaderboard);
  const [loading, setLoading] = useState(false);
  const [learningStreak, setLearningStreak] = useState(3); // Mock data

  // Calculate user's completed videos
  const completedVideos = userVideos.filter(v => v.status === 'completed').length;
  
  // Calculate user's position in leaderboard
  const userPosition = leaderboard.findIndex(u => u.completedVideos < completedVideos) + 1;
  
  // Check if user is improving their position
  const isImproving = userPosition < leaderboard.length;
  
  // Users who are learning faster than the current user
  const fasterLearners = leaderboard
    .filter(u => u.completedVideos > completedVideos)
    .sort((a, b) => b.completedVideos - a.completedVideos);

  useEffect(() => {
    // Initial fetch of leaderboard data
    refreshStats();
  }, [user]);

  const refreshStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // In a real app, you would fetch this data from a database
      // For now, we'll just simulate a delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Insert current user into leaderboard if they're not already in it
      const currentUserInLeaderboard = leaderboard.find(u => u.uid === user.uid);
      
      if (!currentUserInLeaderboard && user) {
        const totalLearningTime = userVideos.reduce((total, video) => total + (video.progress || 0), 0);
        
        const updatedLeaderboard = [
          ...leaderboard,
          {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL,
            completedVideos,
            learningStreak,
            lastActive: new Date().toISOString().split('T')[0],
            totalLearningTime,
          }
        ].sort((a, b) => b.completedVideos - a.completedVideos);
        
        setLeaderboard(updatedLeaderboard);
      }
      
      // Calculate learning streak (mock implementation)
      // In a real app, you would analyze user activity timestamps
      const mockStreak = Math.max(1, Math.floor(Math.random() * 7) + 1);
      setLearningStreak(mockStreak);
    } catch (error) {
      console.error('Failed to fetch learning stats', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LearningStatsContext.Provider
      value={{
        leaderboard,
        userPosition,
        learningStreak,
        isImproving,
        fasterLearners,
        loading,
        refreshStats,
      }}
    >
      {children}
    </LearningStatsContext.Provider>
  );
}

export function useLearningStats() {
  const context = useContext(LearningStatsContext);
  if (context === undefined) {
    throw new Error('useLearningStats must be used within a LearningStatsProvider');
  }
  return context;
} 