import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserVideo, Video, LearningStatus } from '../types';
import { getUserVideos, saveVideo, updateVideoStatus } from '../services/firebaseService';
import { useAuth } from './AuthContext';

interface LearningContextType {
  userVideos: UserVideo[];
  loading: boolean;
  error: string | null;
  addVideo: (video: Video) => Promise<void>;
  updateStatus: (videoId: string, status: LearningStatus) => Promise<void>;
  getVideoById: (videoId: string) => UserVideo | undefined;
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

      await saveVideo(user.uid, userVideo);
      setUserVideos((prev) => [...prev, userVideo]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add video');
      throw error;
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update video status');
      throw error;
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