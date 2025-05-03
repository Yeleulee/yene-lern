import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLearning } from './LearningContext';
import { 
  getLeaderboard as fetchLeaderboard, 
  getUserLeaderboardPosition, 
  updateLearningStats 
} from '../services/firebaseService';
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
  const [userPosition, setUserPosition] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(0);
  
  // Calculate user's completed videos
  const completedVideos = userVideos.filter(v => v.status === 'completed').length;
  
  // Calculate completion rate
  const completionRate = userVideos.length 
    ? Math.round((completedVideos / userVideos.length) * 100) 
    : 0;
    
  // Calculate average time per video
  const averageTimePerVideo = completedVideos && totalLearningTime
    ? Math.round((totalLearningTime / 3600 / completedVideos) * 60) // Convert to minutes per video
    : 0;
  
  // Check if user is improving their position
  const [isImproving, setIsImproving] = useState(false);
  
  // Users who are learning faster than the current user
  const fasterLearners = leaderboard
    .filter(u => u.completedVideos > completedVideos && u.uid !== user?.uid)
    .sort((a, b) => a.completedVideos - b.completedVideos); // Sort ascending so closest competitor is first

  // Load user profile and leaderboard on mount or when user changes
  useEffect(() => {
    if (user) {
      refreshStats();
    }
  }, [user]);

  // Update stats when user videos change
  useEffect(() => {
    if (user && userVideos.length > 0) {
      // Don't update too frequently - limit to once per minute
      const now = Date.now();
      if (now - lastRefresh > 60000) {
        updateUserStats();
        setLastRefresh(now);
      }
    }
  }, [userVideos, user]);

  const refreshStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch leaderboard data
      const leaderboardData = await fetchLeaderboard(15); // Get top 15 users
      setLeaderboard(leaderboardData);
      
      // Get user's position
      const position = await getUserLeaderboardPosition(user.uid);
      
      // If position improved since last check, set isImproving to true
      if (userPosition > 0 && position < userPosition) {
        setIsImproving(true);
      } else {
        setIsImproving(false);
      }
      
      setUserPosition(position);
      
      // Get learning streak and total time from the leaderboard data
      const userData = leaderboardData.find(u => u.uid === user.uid);
      if (userData) {
        setLearningStreak(userData.learningStreak || 0);
        setTotalLearningTime(userData.totalLearningTime || 0);
      }
      
      // Generate activity data for the chart
      const activity = await generateActivityData();
      setActivityData(activity);
      
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Failed to fetch learning stats', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUserStats = async () => {
    if (!user) return;
    
    try {
      // Calculate total time spent learning
      const totalTimeSeconds = await calculateTotalLearningTime();
      
      // Update user profile in Firebase
      await updateLearningStats(user.uid, {
        completedVideos: completedVideos,
        totalLearningTime: totalTimeSeconds,
        videosInProgress: userVideos.filter(v => v.status === 'in-progress').length,
        totalVideos: userVideos.length
      });
      
      // Update local state
      setTotalLearningTime(totalTimeSeconds);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };
  
  const calculateTotalLearningTime = async (): Promise<number> => {
    let totalTime = 0;
    
    for (const video of userVideos) {
      if (video.progress !== undefined) {
        // If we have progress data in seconds, use that
        totalTime += (typeof video.progress === 'number' && video.progress > 100) 
          ? video.progress 
          : 0;
      } else {
        // If no progress is recorded, get the video duration from YouTube API
        try {
          const stats = await getVideoStats(video.id);
          if (stats && stats.duration) {
            // Convert ISO 8601 duration to seconds
            const seconds = convertISODurationToSeconds(stats.duration);
            
            // For completed videos, count full duration
            // For in-progress, count half the duration
            // For to-learn, don't count any time
            if (video.status === 'completed') {
              totalTime += seconds;
            } else if (video.status === 'in-progress') {
              totalTime += seconds * 0.5;
            }
          }
        } catch (e) {
          console.error(`Failed to get duration for video ${video.id}`, e);
        }
      }
    }
    
    return totalTime;
  };
  
  // Helper function to convert ISO 8601 duration to seconds
  const convertISODurationToSeconds = (isoDuration: string) => {
    const hours = isoDuration.match(/(\d+)H/);
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);
    
    let totalSeconds = 0;
    if (hours) totalSeconds += parseInt(hours[1]) * 3600;
    if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
    if (seconds) totalSeconds += parseInt(seconds[1]);
    
    return totalSeconds;
  };
  
  // Generate activity data for the chart based on actual user activity
  const generateActivityData = async () => {
    // Generate dates for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    // For each day, calculate minutes spent learning
    const activityMap = new Map<string, number>();
    
    // Initialize all days with 0 minutes
    last7Days.forEach(date => {
      activityMap.set(date, 0);
    });
    
    // Go through user videos and add learning time for each day
    for (const video of userVideos) {
      if (video.lastWatched) {
        const watchDate = new Date(video.lastWatched).toISOString().split('T')[0];
        
        // If this video was watched in the last 7 days
        if (last7Days.includes(watchDate)) {
          // Calculate watch time in minutes
          let watchTimeMinutes = 0;
          
          if (typeof video.progress === 'number' && video.progress > 100) {
            // If we have progress data in seconds, convert to minutes
            watchTimeMinutes = Math.round(video.progress / 60);
          } else {
            // Otherwise estimate based on video duration
            try {
              const stats = await getVideoStats(video.id);
              if (stats && stats.duration) {
                const seconds = convertISODurationToSeconds(stats.duration);
                watchTimeMinutes = Math.round(seconds / 60);
              }
            } catch (e) {
              // Fallback to a reasonable default (10 minutes)
              watchTimeMinutes = 10;
            }
          }
          
          // Add to the day's total
          activityMap.set(watchDate, (activityMap.get(watchDate) || 0) + watchTimeMinutes);
        }
      }
    }
    
    // Convert map to array format needed for the chart
    return last7Days.map(date => ({
      date,
      minutes: activityMap.get(date) || 0
    }));
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