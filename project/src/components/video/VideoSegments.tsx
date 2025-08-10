import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, ArrowRight, Timer } from 'lucide-react';

interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  title: string;
  completed: boolean;
}

interface VideoSegmentsProps {
  videoId: string;
  description: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onSegmentComplete: (segmentId: string) => void;
}

const VideoSegments: React.FC<VideoSegmentsProps> = ({
  videoId,
  description,
  currentTime,
  duration,
  onSeek,
  onSegmentComplete
}) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(-1);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [animatingSegments, setAnimatingSegments] = useState<Set<string>>(new Set());

  // Parse timestamps from video description to create segments
  useEffect(() => {
    // Common formats: 00:00, 0:00, 00:00:00, hh:mm:ss, [00:00]
    const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?(?:\s?[-–—]\s?|\s)([^\r\n]+)/gm;
    
    const parsedSegments: Segment[] = [];
    let match;
    
    const descText = description || '';
    
    // Find all timestamps in the description
    while ((match = timestampRegex.exec(descText)) !== null) {
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
        title,
        completed: false
      });
    }
    
    // Sort segments chronologically
    parsedSegments.sort((a, b) => a.startTime - b.startTime);
    
    // Set end times for each segment based on the next segment's start time
    for (let i = 0; i < parsedSegments.length; i++) {
      if (i < parsedSegments.length - 1) {
        parsedSegments[i].endTime = parsedSegments[i + 1].startTime - 1;
      } else {
        // For the last segment, use video duration or default to 10 minutes from start
        parsedSegments[i].endTime = duration || parsedSegments[i].startTime + 600;
      }
    }
    
    // Load completion status from localStorage
    try {
      const savedCompletions = localStorage.getItem(`segment_completions_${videoId}`);
      if (savedCompletions) {
        const completions = JSON.parse(savedCompletions);
        parsedSegments.forEach(segment => {
          segment.completed = completions[segment.id] || false;
        });
      }
    } catch (error) {
      console.error('Error loading segment completions:', error);
    }
    
    setSegments(parsedSegments);
  }, [videoId, description, duration]);
  
  // Track current segment based on video progress
  useEffect(() => {
    if (currentTime > 0 && segments.length > 0) {
      // Find which segment we're currently in
      const index = segments.findIndex(
        segment => currentTime >= segment.startTime && currentTime < segment.endTime
      );
      
      if (index !== -1) {
        setCurrentSegmentIndex(index);
        
        // Auto-mark segment as completed when we reach 90% through it
        const segment = segments[index];
        const segmentDuration = segment.endTime - segment.startTime;
        const segmentProgress = currentTime - segment.startTime;
        const percentComplete = (segmentProgress / segmentDuration) * 100;
        
        if (percentComplete >= 90 && !segment.completed) {
          markSegmentComplete(segment.id);
        }
      }
    }
  }, [currentTime, segments]);
  
  // Mark a segment as complete
  const markSegmentComplete = (segmentId: string) => {
    const updatedSegments = segments.map(segment => 
      segment.id === segmentId ? { ...segment, completed: true } : segment
    );
    
    setSegments(updatedSegments);
    
    // Save completion status to localStorage
    const completions: Record<string, boolean> = {};
    updatedSegments.forEach(segment => {
      completions[segment.id] = segment.completed;
    });
    
    localStorage.setItem(`segment_completions_${videoId}`, JSON.stringify(completions));
    
    // Notify parent component
    onSegmentComplete(segmentId);
  };
  
  // Format time for display (e.g., "1:23" or "1:23:45")
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate segment progress percentage
  const calculateProgress = (segment: Segment): number => {
    if (currentTime < segment.startTime) return 0;
    if (currentTime > segment.endTime) return 100;
    
    const segmentDuration = segment.endTime - segment.startTime;
    const progress = currentTime - segment.startTime;
    return Math.min(100, Math.max(0, (progress / segmentDuration) * 100));
  };
  
  // Handle segment click to jump to that part of the video
  const handleSegmentClick = (startTime: number, segmentId?: string) => {
    // Add animation effect if segmentId provided
    if (segmentId) {
      setAnimatingSegments(prev => new Set(prev).add(segmentId));
      setTimeout(() => {
        setAnimatingSegments(prev => {
          const newSet = new Set(prev);
          newSet.delete(segmentId);
          return newSet;
        });
      }, 600);
    }
    
    onSeek(startTime);
  };
  
  // Get completion percentage across all segments
  const getOverallProgress = (): number => {
    if (segments.length === 0) return 0;
    const completedCount = segments.filter(segment => segment.completed).length;
    return Math.round((completedCount / segments.length) * 100);
  };
  
  if (segments.length === 0) {
    return <div className="py-2 text-gray-500 text-sm">No segments available for this video</div>;
  }
  
  return (
    <div className="space-y-2">
      {/* Overall progress */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Course Progress</h3>
        <span className="text-sm font-medium">{getOverallProgress()}% complete</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${getOverallProgress()}%` }}
        ></div>
      </div>
      
      {/* List of segments */}
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div 
            key={segment.id}
            className={`flex items-start p-4 rounded-xl border transition-all duration-500 hover:shadow-lg hover:scale-[1.02] ${
              segment.completed 
                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-150' 
                : index === currentSegmentIndex
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-150 shadow-md'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            } ${animatingSegments.has(segment.id) ? 'animate-pulse ring-2 ring-blue-300' : ''}`}
            onMouseEnter={() => setHoveredSegment(segment.id)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            {/* Left side: timestamp and completion status */}
            <div className="flex-shrink-0 flex flex-col items-center mr-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                segment.completed 
                  ? 'bg-green-500 border-green-600 text-white shadow-lg shadow-green-200' 
                  : index === currentSegmentIndex
                    ? 'bg-blue-500 border-blue-600 text-white shadow-lg shadow-blue-200 animate-pulse'
                    : hoveredSegment === segment.id
                      ? 'bg-gray-200 border-gray-300 text-gray-700 scale-110'
                      : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}>
                {segment.completed ? (
                  <CheckCircle size={18} className="animate-bounce" />
                ) : index === currentSegmentIndex ? (
                  <Timer size={18} className="animate-spin" />
                ) : (
                  <Clock size={18} />
                )}
              </div>
              {index < segments.length - 1 && (
                <div className={`w-1 h-6 mt-1 transition-all duration-300 ${
                  segment.completed ? 'bg-green-300' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
            
            {/* Content section */}
            <div 
              className="flex-1 cursor-pointer group"
              onClick={() => handleSegmentClick(segment.startTime, segment.id)}
            >
              {/* Title and timestamp */}
              <div className="flex justify-between items-start mb-2">
                <h4 className={`text-sm font-semibold transition-colors duration-200 ${
                  segment.completed 
                    ? 'text-green-700' 
                    : index === currentSegmentIndex
                      ? 'text-blue-700'
                      : 'text-gray-700 group-hover:text-gray-900'
                }`}>
                  {segment.title}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors duration-200 ${
                    segment.completed 
                      ? 'bg-green-100 text-green-700' 
                      : index === currentSegmentIndex
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {formatTime(segment.startTime)}
                  </span>
                  {hoveredSegment === segment.id && (
                    <ArrowRight size={14} className="text-blue-500 animate-pulse" />
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-700 ease-out ${
                    segment.completed 
                      ? 'bg-gradient-to-r from-green-400 to-green-600' 
                      : 'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`} 
                  style={{ 
                    width: `${calculateProgress(segment)}%`,
                    transform: hoveredSegment === segment.id ? 'scaleY(1.2)' : 'scaleY(1)'
                  }}
                ></div>
              </div>
              
              {/* Duration and status */}
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatTime(segment.endTime - segment.startTime)}</span>
                </div>
                {segment.completed && (
                  <div className="text-xs text-green-600 font-medium animate-fade-in">
                    ✓ Completed
                  </div>
                )}
              </div>
            </div>
            
            {/* Play button */}
            <button 
              className={`flex-shrink-0 ml-3 p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                segment.completed
                  ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200'
                  : index === currentSegmentIndex
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                    : 'bg-gray-500 hover:bg-blue-500 shadow-md'
              } text-white group-hover:shadow-xl`}
              onClick={(e) => {
                e.stopPropagation();
                handleSegmentClick(segment.startTime, segment.id);
              }}
              aria-label={`Play ${segment.title}`}
            >
              <Play size={16} className={index === currentSegmentIndex ? 'animate-pulse' : ''} />
            </button>
          </div>
        ))}
      </div>
      
      {segments.length > 0 && currentSegmentIndex < segments.length - 1 && (
        <div className="mt-6 flex justify-end">
          <button
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            onClick={() => handleSegmentClick(segments[currentSegmentIndex + 1].startTime)}
          >
            Next segment <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoSegments; 