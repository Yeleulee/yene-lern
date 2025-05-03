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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // Fix for potential CORS or YouTube API issues
  useEffect(() => {
    // Create YouTube iframe only after component is mounted
    if (!videoId) return;
    
    // Add YouTube iframe API script if not already loaded
    if (!window.YT && !document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    // No need to set src directly anymore since we're using it in the JSX
    // We'll just do some additional initialization here
    
    // Clean up function
    return () => {
      try {
        // Try to stop video playback to prevent memory leaks
        if (playerRef.current && playerRef.current.contentWindow) {
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'stopVideo',
              args: []
            }), 
            '*'
          );
        }
      } catch (e) {
        console.error('Error stopping video:', e);
      }
    };
  }, [videoId]);
  
  // Set up YouTube API connection
  useEffect(() => {
    if (!videoId) return;
    
    let interval: NodeJS.Timeout;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        // Only process messages from YouTube
        if (event.origin !== 'https://www.youtube.com' && 
            !event.origin.includes('youtube-nocookie.com')) {
          return;
        }
        
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          // Not JSON, ignore
          return;
        }
        
        // Handle different YouTube iframe API events
        if (data.event === 'onReady') {
          console.log('YouTube player ready event received');
          setIsLoaded(true);
          
          // Check if there's a saved position for this video
          const savedPositions = JSON.parse(localStorage.getItem('video_positions') || '{}');
          const lastPosition = savedPositions[videoId];
          
          if (lastPosition && playerRef.current && playerRef.current.contentWindow) {
            // Seek to the last position
            setTimeout(() => {
              console.log('Seeking to saved position:', lastPosition);
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
          console.error('YouTube player error:', data);
          setError('Error loading video. Please try again later.');
        }
      } catch (e) {
        // Not a JSON message or not from our player
        console.error('Error handling postMessage:', e);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Set up interval to request playback data - this is crucial for tracking video progress
    interval = setInterval(() => {
      if (playerRef.current && playerRef.current.contentWindow) {
        // Try both direct postMessage and YT.Player interface
        try {
          // Directly accessing the YT.Player APIs
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'listening'
            }),
            '*'
          );
          
          // Alternative command that some players might respond to
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'getVideoData',
              args: []
            }),
            '*'
          );
        } catch (e) {
          console.error('Error requesting video data:', e);
        }
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
  
  // Handle iframe load errors
  const handleIframeError = () => {
    setError('Failed to load the video player. Please check your internet connection and try again.');
  };
  
  // Handle successful iframe load
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIsLoaded(true);
  };
  
  if (error) {
    return (
      <div 
        ref={containerRef}
        className={`flex flex-col bg-black rounded-lg overflow-hidden relative ${className}`}
      >
        <div className="relative aspect-video bg-black">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white text-sm">Loading video player...</p>
            </div>
          )}
          
          {/* Fallback content for non-working iframes */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 p-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Video Player Error</h3>
              <p className="text-gray-300 text-center mb-4">{error}</p>
              <p className="text-gray-400 text-sm text-center mb-4">
                This could be due to content restrictions, an unstable connection, or an ad blocker.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh Page
                </button>
                <a 
                  href={`https://www.youtube.com/watch?v=${videoId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          )}
          
          {/* Fallback content in case iframe fails */}
          <noscript>
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 text-center">
              <p>JavaScript is required to view this video.</p>
            </div>
          </noscript>
          
          {/* Try a direct iframe with specific attributes to avoid issues */}
          <iframe
            ref={playerRef}
            src={videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin || 'https://yene-learn.vercel.app')}&rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}` : 'about:blank'}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className={`w-full h-full absolute top-0 left-0 ${iframeLoaded ? 'z-5' : 'z-0'}`}
            onLoad={() => {
              console.log('iframe loaded');
              setIframeLoaded(true);
            }}
            onError={(e) => {
              console.error('iframe error', e);
              setError('Failed to load video player. Please try again or watch directly on YouTube.');
            }}
          ></iframe>
        </div>
        
        {/* Custom video controls and timeline */}
        {iframeLoaded && showSegmentMarkers && segments.length > 0 && (
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
  }
  
  return (
    <div 
      ref={containerRef}
      className={`flex flex-col bg-black rounded-lg overflow-hidden relative ${className}`}
    >
      <div className="relative aspect-video bg-black">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white text-sm">Loading video player...</p>
          </div>
        )}
        
        {/* Fallback content for non-working iframes */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 p-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Video Player Error</h3>
            <p className="text-gray-300 text-center mb-4">{error}</p>
            <p className="text-gray-400 text-sm text-center mb-4">
              This could be due to content restrictions, an unstable connection, or an ad blocker.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Page
              </button>
              <a 
                href={`https://www.youtube.com/watch?v=${videoId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Watch on YouTube
              </a>
            </div>
          </div>
        )}
        
        {/* Fallback content in case iframe fails */}
        <noscript>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 text-center">
            <p>JavaScript is required to view this video.</p>
          </div>
        </noscript>
        
        {/* Try a direct iframe with specific attributes to avoid issues */}
        <iframe
          ref={playerRef}
          src={videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin || 'https://yene-learn.vercel.app')}&rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}` : 'about:blank'}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={`w-full h-full absolute top-0 left-0 ${iframeLoaded ? 'z-5' : 'z-0'}`}
          onLoad={() => {
            console.log('iframe loaded');
            setIframeLoaded(true);
          }}
          onError={(e) => {
            console.error('iframe error', e);
            setError('Failed to load video player. Please try again or watch directly on YouTube.');
          }}
        ></iframe>
      </div>
      
      {/* Custom video controls and timeline */}
      {iframeLoaded && showSegmentMarkers && segments.length > 0 && (
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