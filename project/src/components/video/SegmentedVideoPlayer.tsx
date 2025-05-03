import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  List, 
  X
} from 'lucide-react';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';
import VideoSegments from './VideoSegments';
import Button from '../ui/Button';

interface SegmentedVideoPlayerProps {
  videoId: string;
  title: string;
  description: string;
}

const SegmentedVideoPlayer: React.FC<SegmentedVideoPlayerProps> = ({
  videoId,
  title,
  description
}) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [segments, setSegments] = useState<Array<{
    id: string;
    startTime: number;
    endTime: number;
    title: string;
  }>>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completedSegments, setCompletedSegments] = useState<Record<string, boolean>>({});
  const playerRef = useRef<VideoPlayerHandle>(null);
  
  // Parse video description for timestamps to create segments
  useEffect(() => {
    if (description) {
      const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?(?:\s?[-–—]\s?|\s)([^\r\n]+)/gm;
      const parsedSegments: Array<{
        id: string;
        startTime: number;
        endTime: number;
        title: string;
      }> = [];
      let match;
      
      // Find all timestamps in the description
      while ((match = timestampRegex.exec(description)) !== null) {
        const hours = match[3] ? parseInt(match[1]) : 0;
        const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
        const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);
        const title = match[4].trim();
        
        // Calculate start time in seconds
        const startTime = hours * 3600 + minutes * 60 + seconds;
        const id = `${videoId}-segment-${startTime}`;
        
        parsedSegments.push({ 
          id,
          startTime,
          endTime: 0, // Will set this after parsing all segments
          title
        });
      }
      
      // Sort segments chronologically
      parsedSegments.sort((a, b) => a.startTime - b.startTime);
      
      // Set end times for each segment based on the next segment's start time
      for (let i = 0; i < parsedSegments.length; i++) {
        if (i < parsedSegments.length - 1) {
          parsedSegments[i].endTime = parsedSegments[i + 1].startTime - 1;
        } else {
          // For the last segment, use a default end time if we don't know the video duration
          parsedSegments[i].endTime = duration || parsedSegments[i].startTime + 600; // Default 10 min
        }
      }
      
      setSegments(parsedSegments);
      
      // Load completion status from localStorage
      try {
        const savedCompletions = localStorage.getItem(`segment_completions_${videoId}`);
        if (savedCompletions) {
          setCompletedSegments(JSON.parse(savedCompletions));
        }
      } catch (error) {
        console.error('Error loading segment completions:', error);
      }
    }
  }, [videoId, description, duration]);
  
  // Handle time updates from the video player
  const handleTimeUpdate = (time: number, dur: number) => {
    setCurrentTime(time);
    if (dur !== duration) {
      setDuration(dur);
      
      // Update the end time of the last segment if we now know the duration
      if (segments.length > 0) {
        const updatedSegments = [...segments];
        updatedSegments[updatedSegments.length - 1].endTime = dur;
        setSegments(updatedSegments);
      }
    }
    
    // Determine current segment
    if (segments.length > 0) {
      const currentSegment = segments.find(
        segment => time >= segment.startTime && time < segment.endTime
      );
      
      if (currentSegment) {
        if (activeSegmentId !== currentSegment.id) {
          setActiveSegmentId(currentSegment.id);
        }
        
        // Auto-mark segment as completed when reaching 90% through it
        const segmentDuration = currentSegment.endTime - currentSegment.startTime;
        const progress = time - currentSegment.startTime;
        const percentComplete = (progress / segmentDuration) * 100;
        
        if (percentComplete >= 90 && !completedSegments[currentSegment.id]) {
          markSegmentComplete(currentSegment.id);
        }
      }
    }
  };
  
  // Mark a segment as complete
  const markSegmentComplete = (segmentId: string) => {
    const updatedCompletions = {
      ...completedSegments,
      [segmentId]: true
    };
    
    setCompletedSegments(updatedCompletions);
    localStorage.setItem(`segment_completions_${videoId}`, JSON.stringify(updatedCompletions));
  };
  
  // Handle segment clicks
  const handleSegmentClick = (startTime: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(startTime);
    }
  };
  
  // Go to the next segment
  const goToNextSegment = () => {
    if (!activeSegmentId || segments.length === 0) return;
    
    const currentIndex = segments.findIndex(segment => segment.id === activeSegmentId);
    if (currentIndex < segments.length - 1) {
      const nextSegment = segments[currentIndex + 1];
      handleSegmentClick(nextSegment.startTime);
    }
  };
  
  // Go to the previous segment
  const goToPrevSegment = () => {
    if (!activeSegmentId || segments.length === 0) return;
    
    const currentIndex = segments.findIndex(segment => segment.id === activeSegmentId);
    if (currentIndex > 0) {
      const prevSegment = segments[currentIndex - 1];
      handleSegmentClick(prevSegment.startTime);
    }
  };
  
  // Check if all segments are completed
  const areAllSegmentsCompleted = () => {
    if (segments.length === 0) return false;
    
    return segments.every(segment => completedSegments[segment.id]);
  };
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get progress percentage for the current course
  const getProgressPercentage = () => {
    if (segments.length === 0) return 0;
    
    const completedCount = Object.values(completedSegments).filter(Boolean).length;
    return Math.round((completedCount / segments.length) * 100);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden">
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed right-4 bottom-4 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <List size={24} />}
      </button>
      
      {/* Sidebar with segments */}
      <div 
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 fixed md:relative md:translate-x-0 z-40 w-full md:w-80 bg-white h-full border-r border-gray-200 flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-lg font-bold truncate">{title}</h1>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Course progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
        
        {/* Segments list */}
        <div className="flex-1 overflow-auto p-2">
          {segments.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No segments found for this video
            </div>
          ) : (
            <div className="space-y-1">
              {segments.map((segment, index) => (
                <button
                  key={segment.id}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start ${
                    segment.id === activeSegmentId
                      ? 'bg-blue-50 border-blue-200'
                      : completedSegments[segment.id]
                        ? 'bg-green-50 border-green-100'
                        : 'bg-white border-transparent hover:bg-gray-50'
                  }`}
                  onClick={() => handleSegmentClick(segment.startTime)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                    completedSegments[segment.id]
                      ? 'bg-green-100 text-green-600'
                      : segment.id === activeSegmentId
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {completedSegments[segment.id] ? (
                      <CheckCircle size={14} />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium line-clamp-1">{segment.title}</h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTime(segment.startTime)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock size={12} className="mr-1" />
                      <span>
                        {formatTime(segment.endTime - segment.startTime)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Bottom controls */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <Button
              variant="outline"
              className="px-3 py-2"
              onClick={goToPrevSegment}
              disabled={!activeSegmentId || segments.findIndex(s => s.id === activeSegmentId) <= 0}
            >
              <ChevronLeft size={18} className="mr-1" /> Previous
            </Button>
            <Button
              className="px-3 py-2"
              onClick={goToNextSegment}
              disabled={!activeSegmentId || segments.findIndex(s => s.id === activeSegmentId) >= segments.length - 1}
            >
              Next <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
          
          {areAllSegmentsCompleted() && (
            <div className="mt-4 text-center">
              <div className="text-green-600 font-medium flex items-center justify-center mb-2">
                <CheckCircle size={16} className="mr-1" />
                Course Completed!
              </div>
              <Button
                className="w-full"
                onClick={() => navigate('/my-learning')}
              >
                Back to My Learning
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Video player */}
        <div className="w-full bg-black">
          <VideoPlayer
            ref={playerRef}
            videoId={videoId}
            onTimeUpdate={handleTimeUpdate}
            segments={segments.map(s => ({ startTime: s.startTime, title: s.title }))}
            showSegmentMarkers={true}
            className="w-full aspect-video"
          />
        </div>
        
        {/* Current segment info */}
        {activeSegmentId && (
          <div className="p-4 bg-white border-t border-b-0 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {segments.find(s => s.id === activeSegmentId)?.title}
                </h2>
                <div className="text-sm text-gray-500 mt-1">
                  Part {segments.findIndex(s => s.id === activeSegmentId) + 1} of {segments.length}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={completedSegments[activeSegmentId] ? "outline" : "default"}
                  onClick={() => markSegmentComplete(activeSegmentId)}
                  className="flex items-center"
                >
                  {completedSegments[activeSegmentId] ? (
                    <>
                      <CheckCircle size={16} className="mr-2" /> Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" /> Mark as complete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Video description */}
        <div className="flex-1 overflow-auto p-4 bg-white">
          <h3 className="text-lg font-medium mb-2">About this video</h3>
          <div className="prose max-w-none">
            <p className="whitespace-pre-line">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegmentedVideoPlayer; 