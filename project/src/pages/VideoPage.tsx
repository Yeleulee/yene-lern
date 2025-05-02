import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquareText, ChevronRight } from 'lucide-react';
import VideoPlayer from '../components/video/VideoPlayer';
import CourseVideoPlayer from '../components/video/CourseVideoPlayer';
import VideoSummaryCard from '../components/video/VideoSummaryCard';
import ProgressTracker from '../components/video/ProgressTracker';
import VideoAssistant from '../components/video/VideoAssistant';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import { getVideoDetails } from '../services/youtubeService';
import { generateVideoSummary } from '../services/geminiService';
import { Video, VideoSummary } from '../types';
import { getCourseSectionByVideoId } from '../data/mockCourseData';

const VideoPage: React.FC = () => {
  const { videoId = '' } = useParams<{ videoId: string }>();
  const { user } = useAuth();
  const { getVideoById, addVideo, updateStatus } = useLearning();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoSummary, setVideoSummary] = useState<VideoSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isPartOfCourse, setIsPartOfCourse] = useState(false);
  
  const userVideo = user ? getVideoById(videoId) : undefined;
  const isVideoSaved = !!userVideo;

  useEffect(() => {
    async function loadVideoAndSummary() {
      setIsLoading(true);
      try {
        // Check if this video is part of a course
        const courseData = getCourseSectionByVideoId(videoId);
        setIsPartOfCourse(!!courseData);
        
        const videoDetails = await getVideoDetails(videoId);
        if (videoDetails) {
          setVideo(videoDetails);
          
          // Generate summary automatically
          setIsSummaryLoading(true);
          const summary = await generateVideoSummary(
            videoDetails.title,
            videoDetails.description
          );
          setVideoSummary(summary);
        }
      } catch (error) {
        console.error('Error loading video details:', error);
      } finally {
        setIsLoading(false);
        setIsSummaryLoading(false);
      }
    }

    loadVideoAndSummary();
  }, [videoId]);

  const handleSaveVideo = async () => {
    if (user && video) {
      await addVideo(video);
    }
  };

  const handleUpdateStatus = async (videoId: string, status: 'to-learn' | 'in-progress' | 'completed') => {
    if (user) {
      await updateStatus(videoId, status);
    }
  };

  const handleAskQuestion = async () => {
    if (!video || !userQuestion.trim()) return;
    
    setIsAskingQuestion(true);
    try {
      const updatedSummary = await generateVideoSummary(
        video.title,
        video.description,
        userQuestion
      );
      setVideoSummary(updatedSummary);
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="aspect-video bg-gray-300 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Video not found</h2>
        <p className="text-gray-600 mb-4">The video you're looking for doesn't exist or is unavailable.</p>
        <Button as="a" href="/">Back to Home</Button>
      </div>
    );
  }

  // For course videos, display the course video player in fullscreen mode
  if (isPartOfCourse) {
    return <CourseVideoPlayer videoId={videoId} />;
  }

  // For regular videos, use the original player
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <VideoPlayer videoId={videoId} />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2">{video.title}</h1>
      <p className="text-gray-600 mb-2">{video.channelTitle}</p>
      
      {!isVideoSaved && user && (
        <div className="mb-6">
          <Button onClick={handleSaveVideo}>Save to My Learning</Button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-2 space-y-6">
          <VideoSummaryCard
            videoSummary={videoSummary || { summary: '', nextTopics: [] }}
            isLoading={isSummaryLoading}
            userQuestion={userQuestion}
          />

          {/* AI Video Assistant */}
          <VideoAssistant videoId={videoId} videoTitle={video.title} />

          <div className="card">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <MessageSquareText size={20} className="mr-2 text-secondary-600" />
              Ask a Question
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Have a specific question about this video? Our AI assistant will answer based on the video content.
            </p>
            
            <div className="flex items-start gap-2">
              <Input
                type="text"
                placeholder="E.g., What are the key points covered in this video?"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="flex-grow"
              />
              <Button
                onClick={handleAskQuestion}
                isLoading={isAskingQuestion}
                disabled={!userQuestion.trim()}
              >
                Ask <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium mb-3">About this Video</h3>
            <p className="text-gray-700 whitespace-pre-line">{video.description}</p>
          </div>
        </div>

        <div>
          {isVideoSaved && userVideo ? (
            <ProgressTracker video={userVideo} onUpdateStatus={handleUpdateStatus} />
          ) : (
            <div className="card">
              <h3 className="text-lg font-medium mb-3">Track Your Progress</h3>
              <p className="text-gray-600 mb-4">
                Save this video to your learning library to track your progress.
              </p>
              {user ? (
                <Button onClick={handleSaveVideo} className="w-full">
                  Save to My Learning
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Sign in to track your progress</p>
                  <Button as="a" href="/login" variant="outline" className="w-full">
                    Login
                  </Button>
                  <Button as="a" href="/signup" className="w-full">
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;