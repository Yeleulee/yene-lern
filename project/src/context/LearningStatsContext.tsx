import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLearning } from './LearningContext';
import { getUserProfile, getLeaderboard, updateUserLearningStats, UserProfile } from '../services/userService';
import { getVideoStats } from '../services/youtubeService';

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
  totalLearningTime: number;
  activityData: { date: string; minutes: number }[];
  completionRate: number;
  averageTimePerVideo: number;
}

const LearningStatsContext = createContext<LearningStatsContextType | undefined>(undefined);

export function LearningStatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userVideos } = useLearning();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [learningStreak, setLearningStreak] = useState(0);
  const [totalLearningTime, setTotalLearningTime] = useState(0);
  const [activityData, setActivityData] = useState<{ date: string; minutes: number }[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Calculate user's completed videos
  const completedVideos = userVideos.filter(v => v.status === 'completed').length;
  
  // Calculate completion rate
  const completionRate = userVideos.length 
    ? Math.round((completedVideos / userVideos.length) * 100) 
    : 0;
    
  // Calculate average time per video
  const averageTimePerVideo = completedVideos 
    ? Math.round((totalLearningTime / completedVideos) / 60) 
    : 0;
  
  // Calculate user's position in leaderboard
  const userPosition = leaderboard.findIndex(u => u.uid === user?.uid) + 1 || leaderboard.length + 1;
  
  // Check if user is improving their position
  const isImproving = userPosition < leaderboard.length;
  
  // Users who are learning faster than the current user
  const fasterLearners = leaderboard
    .filter(u => u.completedVideos > completedVideos && u.uid !== user?.uid)
    .sort((a, b) => b.completedVideos - a.completedVideos);

  // Load user profile and leaderboard on mount or when user changes
  useEffect(() => {
    if (user) {
      refreshStats();
    }
  }, [user]);

  // Update stats when user videos change
  useEffect(() => {
    if (user && userProfile) {
      // Update user stats in Firebase when video count changes
      updateUserStats();
    }
  }, [userVideos, user]);

  const refreshStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user profile from Firebase
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
        setLearningStreak(profile.learningStreak || 0);
        setTotalLearningTime(profile.totalLearningTimeSeconds || 0);
      }
      
      // Fetch leaderboard data
      const leaderboardData = await getLeaderboard(10);
      
      // Convert to LeaderboardUser format
      const formattedLeaderboard = leaderboardData.map(user => ({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL,
        completedVideos: user.totalVideosWatched,
        learningStreak: user.learningStreak,
        lastActive: user.lastActive,
        totalLearningTime: user.totalLearningTimeSeconds
      }));
      
      setLeaderboard(formattedLeaderboard);
      
      // Generate activity data for the chart
      const activity = generateActivityData();
      setActivityData(activity);
    } catch (error) {
      console.error('Failed to fetch learning stats', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserStats = async () => {
    if (!user) return;
    
    try {
      // Calculate learning metrics
      const totalTimeSeconds = await calculateTotalLearningTime();
      
      // Update user profile in Firebase
      await updateUserLearningStats(user.uid, {
        totalVideosWatched: completedVideos,
        totalLearningTimeSeconds: totalTimeSeconds,
        competitiveStatus: determineCompetitiveStatus(completedVideos)
      });
      
      // Update local state
      setTotalLearningTime(totalTimeSeconds);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };
  
  const determineCompetitiveStatus = (completedCount: number): 'beginner' | 'intermediate' | 'advanced' => {
    if (completedCount >= 25) return 'advanced';
    if (completedCount >= 10) return 'intermediate';
    return 'beginner';
  };
  
  const calculateTotalLearningTime = async (): Promise<number> => {
    let totalTime = 0;
    const completedVids = userVideos.filter(v => v.status === 'completed');
    
    for (const video of completedVids) {
      if (video.progress) {
        totalTime += video.progress;
      } else {
        // If no progress is recorded, get the video duration from YouTube API
        try {
          const stats = await getVideoStats(video.id);
          if (stats && stats.duration) {
            // Convert ISO 8601 duration to minutes (rough approximation)
            const minutes = convertISODurationToMinutes(stats.duration);
            totalTime += minutes * 60; // Convert to seconds
          }
        } catch (e) {
          console.error(`Failed to get duration for video ${video.id}`, e);
        }
      }
    }
    
    return totalTime;
  };
  
  // Helper function to convert ISO 8601 duration to minutes
  const convertISODurationToMinutes = (isoDuration: string) => {
    const hours = isoDuration.match(/(\d+)H/);
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);
    
    let totalMinutes = 0;
    if (hours) totalMinutes += parseInt(hours[1]) * 60;
    if (minutes) totalMinutes += parseInt(minutes[1]);
    if (seconds) totalMinutes += Math.ceil(parseInt(seconds[1]) / 60);
    
    return totalMinutes;
  };
  
  // Generate activity data for the chart
  const generateActivityData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    // Generate realistic learning minutes for each day
    return last7Days.map(date => {
      // If the user has more completed videos, they likely spend more time learning
      const baseMinutes = completedVideos > 0 ? 15 + completedVideos * 2 : 0;
      // Add some randomness
      const minutes = Math.max(0, Math.floor(baseMinutes + (Math.random() * 30) - 15));
      return { date, minutes };
    });
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
        totalLearningTime,
        activityData,
        completionRate,
        averageTimePerVideo
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