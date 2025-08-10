import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserVideo, Video, LearningStatus } from '../types';
import { getUserVideos, saveVideo, updateVideoStatus, removeVideo, subscribeToUserVideos } from '../services/firebaseService';
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
    if (!user) {
      setUserVideos([]);
      setError(null);
      return;
    }
    
    console.log('Setting up video subscription for user:', user.uid);
    setLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToUserVideos(
      user.uid,
      (videos) => {
        console.log('Received videos from subscription:', videos.length);
        setUserVideos(videos);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Video subscription error:', err);
        setError('Failed to load your saved courses. Please try refreshing the page.');
        setLoading(false);
      }
    );
    return () => {
      console.log('Cleaning up video subscription for user:', user.uid);
      unsubscribe();
    };
  }, [user]);

  const addVideo = async (video: Video) => {
    if (!user) {
      throw new Error('User must be logged in to add videos');
    }

    try {
      setLoading(true);
      setError(null);
      
      const userVideo: UserVideo = {
        ...video,
        status: 'to-learn',
      };

      console.log('Adding video for user:', user.uid, 'video:', video.id);

      // Optimistic UI: add immediately but subscription will reconcile
      const videoExists = userVideos.some(v => v.id === video.id);
      if (!videoExists) {
        setUserVideos((prev) => [...prev, userVideo]);
      }

      await saveVideo(user.uid, userVideo);
      console.log('Video saved successfully:', video.id);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding video:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save video';
      setError(errorMessage);
      
      // Remove from optimistic UI if save failed
      setUserVideos((prev) => prev.filter(v => v.id !== video.id));
      throw new Error(errorMessage);
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