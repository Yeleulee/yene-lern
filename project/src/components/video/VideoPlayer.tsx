import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
  autoplay?: boolean;
  segments?: { startTime: number; title: string }[];
  showSegmentMarkers?: boolean;
}

export interface VideoPlayerHandle {
  seekTo: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({ 
  videoId, 
  onTimeUpdate,
  className = '', 
  autoplay = false,
  segments = [],
  showSegmentMarkers = false
}, ref) => {
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Set up YouTube API connection
  useEffect(() => {
    if (!videoId) return;
    
    let interval: NodeJS.Timeout;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different YouTube iframe API events
        if (data.event === 'onReady') {
          setIsLoaded(true);
          
          // Check if there's a saved position for this video
          const savedPositions = JSON.parse(localStorage.getItem('video_positions') || '{}');
          const lastPosition = savedPositions[videoId];
          
          if (lastPosition && playerRef.current && playerRef.current.contentWindow) {
            // Seek to the last position
            setTimeout(() => {
              playerRef.current?.contentWindow?.postMessage(
                JSON.stringify({
                  event: 'command',
                  func: 'seekTo',
                  args: [lastPosition, true]
                }), 
                '*'
              );
            }, 1000);
          }
        } else if (data.event === 'infoDelivery' && data.info && data.info.currentTime) {
          // Update current time
          setCurrentTime(data.info.currentTime);
          setDuration(data.info.duration || 0);
          
          if (onTimeUpdate) {
            onTimeUpdate(data.info.currentTime, data.info.duration || 0);
          }
          
          // Save position periodically (every 5 seconds)
          if (data.info.currentTime % 5 < 0.5) {
            const savedPositions = JSON.parse(localStorage.getItem('video_positions') || '{}');
            savedPositions[videoId] = data.info.currentTime;
            localStorage.setItem('video_positions', JSON.stringify(savedPositions));
          }
        } else if (data.event === 'onError') {
          setError('Error loading video. Please try again later.');
        }
      } catch (e) {
        // Not a JSON message or not from our player
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Set up interval to request playback data
    interval = setInterval(() => {
      if (playerRef.current && playerRef.current.contentWindow) {
        playerRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'listening'
          }),
          '*'
        );
      }
    }, 500);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (interval) clearInterval(interval);
    };
  }, [videoId, onTimeUpdate]);
  
  // Function to seek to a specific time
  const seekTo = (time: number) => {
    if (playerRef.current && playerRef.current.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [time, true]
        }), 
        '*'
      );
    }
  };

  // Expose seekTo method to parent components
  useImperativeHandle(ref, () => ({
    seekTo
  }));
  
  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (error) {
    return (
      <div className={`aspect-video bg-gray-900 text-white flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-center p-4">
          <p className="mb-2">⚠️ {error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col bg-black rounded-lg overflow-hidden relative ${className}`}>
      <div className="relative aspect-video bg-black">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        <iframe
          ref={playerRef}
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full absolute top-0 left-0"
          onLoad={() => setIsLoaded(true)}
        ></iframe>
      </div>
      
      {/* Custom video controls and timeline */}
      {showSegmentMarkers && segments.length > 0 && (
        <div className="bg-gray-900 text-white p-2 -mt-[2px] border-t-0">
          {/* Timeline with segment markers */}
          <div className="relative h-6 mb-1">
            {/* Progress bar background */}
            <div className="absolute w-full h-2 bg-gray-700 rounded top-2"></div>
            
            {/* Current progress */}
            <div 
              className="absolute h-2 bg-blue-500 rounded top-2" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
            
            {/* Segment markers */}
            {segments.map((segment, index) => (
              <div 
                key={index}
                className="absolute w-1 h-4 bg-white rounded cursor-pointer top-1 transform transition-transform hover:scale-y-125"
                style={{ 
                  left: `${duration ? (segment.startTime / duration) * 100 : 0}%`,
                  backgroundColor: segment.startTime <= currentTime ? '#10B981' : 'white'
                }}
                onClick={() => seekTo(segment.startTime)}
                title={segment.title}
              ></div>
            ))}
          </div>
          
          {/* Time display */}
          <div className="flex justify-between text-xs">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;