import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

// Define a global YouTube Player API interface
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: {
            autoplay?: number;
            controls?: number;
            rel?: number;
            modestbranding?: number;
            mute?: number;
            [key: string]: any;
          };
          events?: {
            onReady?: (event: any) => void;
            onStateChange?: (event: any) => void;
            onError?: (event: any) => void;
            [key: string]: any;
          };
        }
      ) => any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

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
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({ 
  videoId, 
  onTimeUpdate,
  className = '', 
  autoplay = false,
  segments = [],
  showSegmentMarkers = false
}, ref) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const playerIdRef = useRef(`youtube-player-${videoId || Math.random().toString(36).substr(2, 9)}`);
  
  // Add YouTube API script with improved initialization
  useEffect(() => {
    // Single consistent approach to loading the YouTube API
    const loadYouTubeAPI = () => {
      return new Promise<void>((resolve) => {
        // If API already exists, resolve immediately
        if (window.YT && window.YT.Player) {
          resolve();
          return;
        }
        
        // If script is already added but not loaded yet
        if (document.getElementById('youtube-api')) {
          // Save original callback and add our resolution
          const originalCallback = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = () => {
            if (originalCallback) originalCallback();
            resolve();
          };
          return;
        }
        
        // Add the script if it doesn't exist
        const tag = document.createElement('script');
        tag.id = 'youtube-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        
        // Use high priority loading
        tag.async = false;
        tag.defer = false;
        
        // Set up the callback
        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube API initialized');
          resolve();
        };
        
        // Add to DOM
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      });
    };
    
    // Load the API when component mounts
    loadYouTubeAPI();
  }, []);
  
  // Create player instance using direct iframe approach for more reliable playback
  useEffect(() => {
    if (!videoId) return;
    
    // Reference for cleanup
    let timeUpdateInterval: NodeJS.Timeout | null = null;
    
    // Use direct iframe approach for more reliable playback
    if (playerContainerRef.current) {
      // Clear existing content
      playerContainerRef.current.innerHTML = '';
      
      // Create iframe directly instead of using YouTube API
      const iframe = document.createElement('iframe');
      iframe.id = playerIdRef.current;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      
      // Set explicit styling for proper centering and sizing
      Object.assign(iframe.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        border: 'none'
      });
      
      // Set the source with all required parameters
      const params = new URLSearchParams({
        autoplay: '1',
        controls: '1',
        rel: '0',
        playsinline: '1',
        modestbranding: '1',
        enablejsapi: '1',
        origin: window.location.origin,
        iv_load_policy: '3',
        showinfo: '0'
      });
      
      iframe.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      
      // Add to container
      playerContainerRef.current.appendChild(iframe);
      
      // Track iframe as our player instance
      playerInstanceRef.current = {
        iframe,
        getCurrentTime: () => currentTime,
        getDuration: () => duration,
        seekTo: (time: number) => {
          try {
            // Send message to iframe to seek to specific time
            iframe.contentWindow?.postMessage(JSON.stringify({
                  event: 'command',
                  func: 'seekTo',
              args: [time, true]
            }), '*');
          } catch (e) {
            console.error('Error seeking video:', e);
          }
        },
        playVideo: () => {
          try {
            iframe.contentWindow?.postMessage(JSON.stringify({
              event: 'command',
              func: 'playVideo',
              args: []
            }), '*');
          } catch (e) {
            console.error('Error playing video:', e);
          }
        },
        pauseVideo: () => {
          try {
            iframe.contentWindow?.postMessage(JSON.stringify({
              event: 'command',
              func: 'pauseVideo',
              args: []
            }), '*');
          } catch (e) {
            console.error('Error pausing video:', e);
          }
        }
      };
      
      // Indicate that the player is loaded
      setIsLoaded(true);
      
      // Set up message handler
      const handleMessage = (event: MessageEvent) => {
        if (!event.origin.includes('youtube.com')) return;
        
        try {
          const data = typeof event.data === 'string' 
            ? JSON.parse(event.data) 
            : event.data;
          
          // Handle state changes
          if (data.event === 'onStateChange' || 
              (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined)) {
            // Extract state
            const playerState = data.event === 'onStateChange' ? data.info : data.info.playerState;
            const isPlaying = playerState === 1; // 1 is playing state
            
            setIsVideoPlaying(isPlaying);
            
            // Start or stop time update interval
            if (isPlaying && !timeUpdateInterval) {
              timeUpdateInterval = setInterval(() => {
                try {
                  iframe.contentWindow?.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'getCurrentTime',
                    args: []
                  }), '*');
                } catch (e) {
                  console.error('Error requesting current time:', e);
                }
              }, 1000);
            } else if (!isPlaying && timeUpdateInterval) {
              clearInterval(timeUpdateInterval);
              timeUpdateInterval = null;
            }
          }
          
          // Update current time and duration
          if (data.event === 'infoDelivery' && data.info) {
            if (data.info.currentTime !== undefined) {
              setCurrentTime(data.info.currentTime);
              
              if (data.info.duration !== undefined) {
                setDuration(data.info.duration);
              }
              
              if (onTimeUpdate) {
                onTimeUpdate(data.info.currentTime, data.info.duration || duration);
              }
            }
          }
        } catch (e) {
          console.error('Error handling YouTube message:', e);
      }
    };

    window.addEventListener('message', handleMessage);
    
      // Send initial command to start playing
      setTimeout(() => {
        try {
          iframe.contentWindow?.postMessage(JSON.stringify({
            event: 'command',
            func: 'playVideo',
            args: []
          }), '*');
        } catch (e) {
          console.error('Error sending initial play command:', e);
        }
      }, 1000);
      
      // Return cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
        if (timeUpdateInterval) {
          clearInterval(timeUpdateInterval);
        }
      };
    }
  }, [videoId, onTimeUpdate, duration]);
  
  // Expose methods to parent components through ref
  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      try {
        // Find the iframe directly using its ID
        const iframe = document.getElementById(playerIdRef.current);
        
        if (iframe && iframe.contentWindow) {
          // First use the standard YouTube API approach
          iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [time, true]
          }), '*');
          console.log('Sent seek command to YouTube iframe via ref');
          return true;
        } else {
          console.warn('Cannot find YouTube iframe for seeking');
          
          // Try a different approach - find the first YouTube iframe
          const iframes = document.querySelectorAll('iframe');
          for (const iframe of iframes) {
            if (iframe.src && iframe.src.includes('youtube.com/embed/')) {
              iframe.contentWindow?.postMessage(JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [time, true]
              }), '*');
              console.log('Sent seek command to found YouTube iframe');
              return true;
            }
          }
        }
        return false;
      } catch (e) {
        console.error('Error in seekTo:', e);
        return false;
      }
    },
    play: () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.playVideo();
      }
    },
    pause: () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.pauseVideo();
      }
    },
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    isPlaying: () => isVideoPlaying
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
  
  // Add event listener for page unload to save video position
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerInstanceRef.current && videoId) {
        try {
          const currentTime = playerInstanceRef.current.getCurrentTime();
          if (currentTime > 0) {
            const positions = JSON.parse(localStorage.getItem('video_positions') || '{}');
            positions[videoId] = currentTime;
            localStorage.setItem('video_positions', JSON.stringify(positions));
          }
        } catch (e) {
          console.error('Error saving video position:', e);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoId]);
  
  // Use a much simpler, direct approach that's guaranteed to work
  return (
    <div className={`video-player-container w-full ${className}`} style={{ aspectRatio: '16/9' }}>
      <div className="relative w-full h-full flex justify-center items-center overflow-hidden">
        {/* Static iframe approach for maximum compatibility */}
        <div className="w-full h-full">
        <iframe
            id={playerIdRef.current}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
            className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
            title="YouTube video player"
            style={{ border: 'none' }}
        ></iframe>
      </div>
      
        {/* YouTube direct link */}
        <a 
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center hover:bg-red-700 transition-colors"
          title="Open in YouTube"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          YouTube
        </a>
          </div>
          
      {/* Simple time display */}
      {showSegmentMarkers && segments && segments.length > 0 && (
        <div className="bg-gray-900 text-white p-2 text-xs flex justify-between">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;