import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, BarChart2, Check, X, RotateCcw } from 'lucide-react';

interface Timestamp {
  id: string;
  time: number;  // in seconds
  label: string;
  completed: boolean;
}

interface TimestampParserProps {
  description: string;
  onSeek: (time: number) => void;
  currentTime?: number;
  videoId: string; // Added to track completion status per video
}

const TimestampParser: React.FC<TimestampParserProps> = ({ 
  description, 
  onSeek,
  currentTime = 0,
  videoId
}) => {
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [completedChapters, setCompletedChapters] = useState<Record<string, boolean>>({});
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  
  // Parse timestamps from video description
  useEffect(() => {
    // Common formats: 00:00, 0:00, 00:00:00, hh:mm:ss, [00:00]
    const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?(?:\s?[-–—]\s?|\s)([^\r\n]+)/gm;
    
    const parsedTimestamps: Timestamp[] = [];
    let match;
    
    // Create a copy of the description to work with
    const descText = description || '';
    
    // Find all timestamps in the description
    while ((match = timestampRegex.exec(descText)) !== null) {
      const hours = match[3] ? parseInt(match[1]) : 0;
      const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
      const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);
      const label = match[4].trim();
      
      // Calculate total seconds
      const time = hours * 3600 + minutes * 60 + seconds;
      const id = `${videoId}-${time}`;
      
      parsedTimestamps.push({ 
        id,
        time, 
        label,
        completed: false
      });
    }
    
    // Sort timestamps chronologically
    parsedTimestamps.sort((a, b) => a.time - b.time);
    
    setTimestamps(parsedTimestamps);
  }, [description, videoId]);
  
  // Load completion status
  useEffect(() => {
    try {
      const savedCompletions = localStorage.getItem(`chapter_completions_${videoId}`);
      if (savedCompletions) {
        setCompletedChapters(JSON.parse(savedCompletions));
        
        // Update timestamps with completion status
        setTimestamps(prev => prev.map(timestamp => ({
          ...timestamp,
          completed: JSON.parse(savedCompletions)[timestamp.id] || false
        })));
      }
    } catch (e) {
      console.error('Error loading chapter completion data:', e);
    }
  }, [videoId]);
  
  // Track current timestamp based on video progress
  useEffect(() => {
    if (currentTime > 0 && timestamps.length > 0) {
      let currentIndex = 0;
      
      // Find which segment we're currently in
      for (let i = 0; i < timestamps.length; i++) {
        const nextTime = timestamps[i + 1]?.time || Number.MAX_SAFE_INTEGER;
        if (currentTime >= timestamps[i].time && currentTime < nextTime) {
          currentIndex = i;
          break;
        }
      }
      
      setActiveSegment(currentIndex);
      
      // Auto-mark chapters as watched when 90% complete
      const currentTimestamp = timestamps[currentIndex];
      const nextTimestamp = timestamps[currentIndex + 1];
      
      if (currentTimestamp && !currentTimestamp.completed) {
        const chapterDuration = nextTimestamp 
          ? nextTimestamp.time - currentTimestamp.time 
          : 300; // Default 5 minutes if last chapter
        
        const progress = currentTime - currentTimestamp.time;
        const percentComplete = progress / chapterDuration * 100;
        
        // Mark as complete if we've watched 90% of the chapter
        if (percentComplete >= 90) {
          markChapterComplete(currentTimestamp.id);
        }
      }
    }
  }, [currentTime, timestamps]);
  
  // Handle clicks outside the actions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);
  
  const markChapterComplete = (chapterId: string, completed = true) => {
    setCompletedChapters(prev => {
      const updated = { ...prev, [chapterId]: completed };
      
      // Save to localStorage
      localStorage.setItem(`chapter_completions_${videoId}`, JSON.stringify(updated));
      
      // Update timestamps state
      setTimestamps(timestamps.map(timestamp => 
        timestamp.id === chapterId 
          ? { ...timestamp, completed } 
          : timestamp
      ));
      
      return updated;
    });
  };
  
  // Mark all chapters as complete
  const markAllComplete = () => {
    const updatedCompletions: Record<string, boolean> = {};
    
    timestamps.forEach(timestamp => {
      updatedCompletions[timestamp.id] = true;
    });
    
    // Save to localStorage
    localStorage.setItem(`chapter_completions_${videoId}`, JSON.stringify(updatedCompletions));
    
    // Update state
    setCompletedChapters(updatedCompletions);
    setTimestamps(timestamps.map(timestamp => ({
      ...timestamp,
      completed: true
    })));
    
    // Hide actions dropdown
    setShowActions(false);
  };
  
  // Reset all progress
  const resetAllProgress = () => {
    // Clear localStorage
    localStorage.removeItem(`chapter_completions_${videoId}`);
    
    // Update state
    setCompletedChapters({});
    setTimestamps(timestamps.map(timestamp => ({
      ...timestamp,
      completed: false
    })));
    
    // Hide actions dropdown
    setShowActions(false);
  };
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  // Calculate overall completion percentage
  const completionPercentage = timestamps.length > 0
    ? Math.round((timestamps.filter(t => t.completed).length / timestamps.length) * 100)
    : 0;
  
  // Function to toggle completion status
  const toggleChapterCompletion = (e: React.MouseEvent, chapterId: string, currentStatus: boolean) => {
    e.stopPropagation(); // Prevent triggering the chapter navigation
    markChapterComplete(chapterId, !currentStatus);
  };
  
  if (timestamps.length === 0) {
    return (
      <div className="text-center p-4 border border-gray-200 rounded-lg">
        <p className="text-gray-500">No chapters found in this video.</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
        <div className="font-medium flex items-center">
          <Clock size={16} className="mr-2 text-blue-600" />
          Video Chapters
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center text-sm text-gray-600 mr-3">
            <BarChart2 size={14} className="mr-1" />
            <span>{completionPercentage}% complete</span>
          </div>
          
          {/* Actions dropdown */}
          <div className="relative" ref={actionsRef}>
            <button 
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              onClick={() => setShowActions(!showActions)}
              aria-label="Chapter actions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 w-48">
                <ul className="py-1">
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={markAllComplete}
                    >
                      <CheckCircle size={14} className="mr-2 text-green-600" />
                      Mark all chapters complete
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={resetAllProgress}
                    >
                      <RotateCcw size={14} className="mr-2 text-red-600" />
                      Reset all progress
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {timestamps.map((timestamp, index) => {
          const nextTimestamp = timestamps[index + 1];
          const isActive = activeSegment === index;
          const duration = nextTimestamp 
            ? nextTimestamp.time - timestamp.time
            : 300; // Default 5 mins for last chapter
          
          // Calculate chapter progress
          let progressPercent = 0;
          if (isActive && currentTime >= timestamp.time) {
            progressPercent = Math.min(
              ((currentTime - timestamp.time) / duration) * 100,
              100
            );
          } else if (timestamp.completed) {
            progressPercent = 100;
          }
          
          return (
            <div key={timestamp.id}>
              <div
                className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start ${
                  isActive ? 'bg-blue-50' : timestamp.completed ? 'bg-green-50' : ''
                }`}
              >
                <button
                  onClick={() => onSeek(timestamp.time)}
                  className="flex-grow flex items-start"
                >
                  <div className={`flex-shrink-0 px-2 py-1 rounded mr-3 text-xs font-mono ${
                    isActive 
                      ? 'bg-blue-100 text-blue-800' 
                      : timestamp.completed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {formatTime(timestamp.time)}
                  </div>
                  
                  <div className="flex-grow">
                    <div className={`text-sm ${
                      isActive 
                        ? 'font-medium text-blue-800' 
                        : timestamp.completed
                          ? 'text-green-800'
                          : 'text-gray-700'
                    }`}>
                      {timestamp.label}
                    </div>
                    
                    {/* Duration */}
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(duration)}
                    </div>
                  </div>
                </button>
                
                {/* Toggle completion button */}
                <button
                  onClick={(e) => toggleChapterCompletion(e, timestamp.id, timestamp.completed)}
                  className={`flex-shrink-0 p-1 rounded-full ml-2 ${
                    timestamp.completed 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={timestamp.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {timestamp.completed ? (
                    <Check size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                </button>
              </div>
              
              {/* Progress bar */}
              {progressPercent > 0 && (
                <div className="h-1 bg-gray-100">
                  <div 
                    className={`h-1 ${timestamp.completed ? 'bg-green-500' : 'bg-blue-500'}`} 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Chapter completion summary */}
      <div className="bg-gray-50 p-3 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>{timestamps.filter(t => t.completed).length} of {timestamps.length} chapters completed</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimestampParser; 