import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { MessageSquareText, ChevronRight, AlertCircle } from 'lucide-react';
import VideoPlayer from '../components/video/VideoPlayer';
import CourseSection from '../components/video/CourseSection';
import VideoSummaryCard from '../components/video/VideoSummaryCard';
import ProgressTracker from '../components/video/ProgressTracker';
import VideoAssistant from '../components/video/VideoAssistant';
import VideoSegments from '../components/video/VideoSegments';
import SegmentedVideoPlayer from '../components/video/SegmentedVideoPlayer';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import { getVideoDetails } from '../services/youtubeService';
import { generateVideoSummary } from '../services/geminiService';
import { Video, VideoSummary } from '../types';
import { getCourseSectionByVideoId, getCourseById } from '../data/mockCourseData';
import { trackVideoProgress } from '../services/firebaseService';

const VideoPage: React.FC = () => {
  const { videoId = '' } = useParams<{ videoId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getVideoById, addVideo, updateStatus } = useLearning();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoSummary, setVideoSummary] = useState<VideoSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isPartOfCourse, setIsPartOfCourse] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const [videoSegments, setVideoSegments] = useState<{ startTime: number; title: string }[]>([]);
  const lastReportTimeRef = useRef<number>(0);
  const lastReportedAtRef = useRef<number>(0);
  
  const userVideo = user ? getVideoById(videoId) : undefined;
  const isVideoSaved = !!userVideo;

  // Parse URL query parameters to check for course context
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const courseParam = queryParams.get('course');
    
    if (courseParam) {
      const courseExists = getCourseById(courseParam);
      
      if (courseExists) {
        setCourseId(courseParam);
      }
    } else {
      // Check if we have a stored course context
      const storedContext = localStorage.getItem('current_course_context');
      if (storedContext) {
        try {
          const context = JSON.parse(storedContext);
          const courseExists = getCourseById(context.courseId);
          
          if (courseExists) {
            // If the video is part of the stored course, keep the context
            const courseData = getCourseSectionByVideoId(videoId);
            if (courseData && courseData.course.id === context.courseId) {
              setCourseId(context.courseId);
            }
          }
        } catch (e) {
          console.error('Error parsing stored course context:', e);
        }
      }
    }
  }, [location.search, videoId]);

  useEffect(() => {
    async function loadVideoAndSummary() {
      setIsLoading(true);
      setCourseError(null);
      try {
        // Check if this video is part of a course
        const courseData = getCourseSectionByVideoId(videoId);
        
        if (courseData) {
          const { course, section } = courseData;
          
          // Verify the video ID matches what's expected in the course
          if (section.videoId !== videoId) {
            setCourseError('The requested video does not match the expected course content.');
            setIsPartOfCourse(false);
          } else {
            setIsPartOfCourse(true);
            
            // If we have a courseId from the URL but it doesn't match this video's course,
            // update to the correct course
            if (courseId && courseId !== course.id) {
              setCourseId(course.id);
            } else if (!courseId) {
              setCourseId(course.id);
            }
          }
        } else {
          setIsPartOfCourse(false);
          setCourseId(null);
        }
        
        // For both course and non-course videos, load the video details
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

    if (videoId) {
      loadVideoAndSummary();
    }
  }, [videoId, courseId]);

  // Add a function to parse segments
  useEffect(() => {
    if (video?.description) {
      const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?(?:\s?[-–—]\s?|\s)([^\r\n]+)/gm;
      const parsedSegments: { startTime: number; title: string }[] = [];
      let match;
      
      // Find all timestamps in the description
      while ((match = timestampRegex.exec(video.description)) !== null) {
        const hours = match[3] ? parseInt(match[1]) : 0;
        const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
        const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);
        const title = match[4].trim();
        
        // Calculate start time in seconds
        const startTime = hours * 3600 + minutes * 60 + seconds;
        
        parsedSegments.push({ startTime, title });
      }
      
      // Sort segments chronologically
      parsedSegments.sort((a, b) => a.startTime - b.startTime);
      setVideoSegments(parsedSegments);
    }
  }, [video?.description]);

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

  // Add a function to handle time updates
  const handleTimeUpdate = async (time: number, duration: number) => {
    setCurrentTime(time);
    setVideoDuration(duration);

    if (!user || !videoId || !duration) return;

    // Compute progress percent safely
    const progressPercent = Math.min(100, Math.max(0, (time / duration) * 100));

    // Throttle writes to at most once every 15s, or always when nearing completion
    const now = Date.now();
    const timeSinceLast = now - (lastReportedAtRef.current || 0);
    const isCompletion = progressPercent >= 90;

    // Estimate watched delta in seconds (guard against seeks backwards)
    const prevTime = lastReportTimeRef.current || 0;
    const deltaSeconds = Math.max(0, Math.round(time - prevTime));

    if (deltaSeconds > 0 && (timeSinceLast > 15000 || isCompletion)) {
      try {
        await trackVideoProgress(
          user.uid,
          videoId,
          Math.round(progressPercent),
          deltaSeconds
        );
        lastReportTimeRef.current = time;
        lastReportedAtRef.current = now;
      } catch (e) {
        // Non-fatal; ignore to keep playback smooth
      }
    }
  };
  
  // Add a function to handle seeking - improved with better targeting
  const handleSeek = (time: number) => {
    console.log(`Seeking to ${time} seconds`);
    
    // First try using the ref
    if (playerRef.current && playerRef.current.seekTo) {
      console.log('Using player ref to seek');
      playerRef.current.seekTo(time);
      return; // Exit if successful
    }
    
    // If ref method fails, try more specific iframe selection
    try {
      // Load YouTube API if not already loaded
      if (!window.YT) {
        console.log('YouTube API not loaded yet, loading script...');
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        // Try seeking after a short delay to allow API to load
        setTimeout(() => handleSeek(time), 1000);
        return;
      }
      
      // Find the iframe by its ID or class
      const playerIframe = document.getElementById(`youtube-player-${videoId}`) || 
                          document.querySelector('.video-player-container iframe');
      
      if (playerIframe) {
        console.log('Found iframe for seeking:', playerIframe);
        
        // Try using direct iframe postMessage first
        try {
          playerIframe.contentWindow?.postMessage(JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [time, true]
          }), '*');
          console.log('Sent seek command via postMessage');
        } catch (e) {
          console.error('Error using postMessage seeking:', e);
        }
        
        // Also try the YouTube API approach as backup
        try {
          // Get iframe ID
          const iframeId = playerIframe.id;
          if (iframeId && window.YT && window.YT.get) {
            const ytPlayer = window.YT.get(iframeId);
            if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
              ytPlayer.seekTo(time, true);
              console.log('Sought using YT.get API');
            }
          }
        } catch (e) {
          console.error('Error using YT.get seeking:', e);
        }
    } else {
        // Last resort - try to find ALL iframes and use the first YouTube one
        console.log('No specific iframe found, trying all iframes...');
        const allIframes = document.querySelectorAll('iframe');
        for (let i = 0; i < allIframes.length; i++) {
          const iframe = allIframes[i];
          if (iframe.src && iframe.src.includes('youtube.com/embed/')) {
            try {
              iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [time, true]
        }), '*');
              console.log('Sent seek command to iframe:', iframe);
              break;
            } catch (e) {
              console.error('Error seeking iframe:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during seek operation:', error);
    }
  };

  // Only seek to beginning if needed, don't force playback which causes stuttering
  useEffect(() => {
    if (videoId && playerRef.current) {
      // Just ensure reference is properly set, but don't force playback
      console.log('VideoPage: Player reference established');
    }
  }, [videoId]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  // Display course error if there's an issue with the course video
  if (courseError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Course Video Error</h2>
          <p className="text-gray-600 mb-6">{courseError}</p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-center">
            <Button onClick={() => navigate('/my-learning')}>
              My Learning
            </Button>
            <Button variant="outline" onClick={() => navigate('/explore')}>
              Explore Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // For course videos OR any video with detected segments, display the segmented player
  if (isPartOfCourse || (videoSegments && videoSegments.length > 0)) {
    return <SegmentedVideoPlayer 
      videoId={videoId}
      title={video.title}
      description={video.description || ''}
    />;
  }

  // For regular videos, use the original player
  return (
    <div className="container mx-auto px-4 py-8">
      {video && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video player and content section */}
          <div className="lg:w-2/3 flex flex-col">
            {/* Video player - centered with explicit styling */}
            <div className="w-full mb-4 bg-black rounded-lg overflow-hidden flex justify-center items-center">
              <div className="w-full max-w-3xl mx-auto">
        <VideoPlayer 
          videoId={videoId} 
          onTimeUpdate={handleTimeUpdate}
          ref={playerRef}
          segments={videoSegments}
                  showSegmentMarkers={videoSegments.length > 0}
                  autoplay={true}
        />
              </div>
      </div>

            <div className="max-w-3xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{video.title}</h1>
      <p className="text-gray-600 mb-2">{video.channelTitle}</p>
      
      {!isVideoSaved && user && (
        <div className="mb-6">
          <Button onClick={handleSaveVideo}>Save to My Learning</Button>
        </div>
      )}
            </div>
        </div>

          <div className="space-y-6 lg:w-1/3">
          {isVideoSaved && userVideo && (
            <ProgressTracker 
              video={userVideo}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold mb-4">Ask a Question</h2>
            <div className="space-y-4">
              <Input
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="Ask about this video..."
              />
              <Button 
                onClick={handleAskQuestion} 
                disabled={isAskingQuestion || !userQuestion.trim()}
                isLoading={isAskingQuestion}
                className="w-full"
              >
                <MessageSquareText className="mr-2 h-4 w-4" />
                Ask Question
              </Button>
              </div>
            </div>
            
            {/* Video segments list */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-4">Video Segments</h2>
              <div className="space-y-2">
                {videoSegments.length > 0 ? (
                  videoSegments.map((segment, index) => (
                    <button
                      key={index}
                      onClick={() => handleSeek(segment.startTime)}
                      className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <span className="min-w-[40px] text-sm text-gray-500 mr-2">
                        {formatTime(segment.startTime)}
                      </span>
                      <span className="flex-1 text-sm">{segment.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No segments found for this video
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPage;