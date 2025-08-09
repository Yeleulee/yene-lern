import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserVideo, Video, LearningStatus } from '../types';
import { getUserVideos, saveVideo, updateVideoStatus, removeVideo } from '../services/firebaseService';
import { useAuth } from './AuthContext';

interface LearningContextType {
  userVideos: UserVideo[];
  loading: boolean;
  error: string | null;
  addVideo: (video: Video) => Promise<void>;
  updateStatus: (videoId: string, status: LearningStatus) => Promise<void>;
  getVideoById: (videoId: string) => UserVideo | undefined;
  removeVideo: (videoId: string) => Promise<void>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserVideos() {
      if (user) {
        setLoading(true);
        try {
          const videos = await getUserVideos(user.uid);
          setUserVideos(videos);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch videos');
        } finally {
          setLoading(false);
        }
      }
    }

    fetchUserVideos();
  }, [user]);

  const addVideo = async (video: Video) => {
    if (!user) {
      throw new Error('User must be logged in to add videos');
    }

    try {
      setLoading(true);
      const userVideo: UserVideo = {
        ...video,
        status: 'to-learn',
      };

      // Optimistic UI update
      const videoExists = userVideos.some(v => v.id === video.id);
      if (!videoExists) setUserVideos((prev) => [...prev, userVideo]);

      await saveVideo(user.uid, userVideo);
      
      // Ensure state reflects latest server data (avoid duplicates/races)
      if (!videoExists) {
        // no-op, already added optimistically
      } else {
        // If it existed, update its status only
        setUserVideos((prev) => prev.map(v => v.id === video.id ? { ...v, status: 'to-learn' } : v));
      }
      
      return Promise.resolve(); // Ensure we always return a resolved promise
    } catch (error) {
      console.error('Error adding video:', error);
      setError(error instanceof Error ? error.message : 'Failed to add video');
      // Don't throw the error upward - return resolved promise to prevent UI crashes
      return Promise.resolve();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (videoId: string, status: LearningStatus) => {
    if (!user) {
      throw new Error('User must be logged in to update video status');
    }

    try {
      setLoading(true);
      await updateVideoStatus(user.uid, videoId, status);
      
      setUserVideos((prev) =>
        prev.map((video) =>
          video.id === videoId ? { ...video, status } : video
        )
      );
      
      return Promise.resolve(); // Ensure we always return a resolved promise
    } catch (error) {
      console.error('Error updating video status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update video status');
      // Don't throw the error upward - return resolved promise to prevent UI crashes
      return Promise.resolve();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!user) {
      throw new Error('User must be logged in to remove videos');
    }

    try {
      setLoading(true);
      await removeVideo(user.uid, videoId);
      
      // Update state by removing the video
      setUserVideos((prev) => prev.filter((video) => video.id !== videoId));
      
      return Promise.resolve(); // Ensure we always return a resolved promise
    } catch (error) {
      console.error('Error removing video:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove video');
      // Don't throw the error upward - return resolved promise to prevent UI crashes
      return Promise.resolve();
    } finally {
      setLoading(false);
    }
  };

  const getVideoById = (videoId: string) => {
    return userVideos.find((video) => video.id === videoId);
  };

  return (
    <LearningContext.Provider
      value={{
        userVideos,
        loading,
        error,
        addVideo,
        updateStatus,
        getVideoById,
        removeVideo: handleRemoveVideo,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}