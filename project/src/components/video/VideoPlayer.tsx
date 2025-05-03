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
  const playerIdRef = useRef(`youtube-player-${Math.random().toString(36).substr(2, 9)}`);
  
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
  
  // Create player instance - optimized to eliminate stuttering  
  useEffect(() => {
    if (!videoId) return;
    
    let playerInitAttempts = 0;
    const maxPlayerInitAttempts = 3;
    let isDestroyed = false;
    
    // Create player container if it doesn't exist
    if (!document.getElementById(playerIdRef.current) && playerContainerRef.current) {
      const playerElement = document.createElement('div');
      playerElement.id = playerIdRef.current;
      playerElement.style.width = '100%';
      playerElement.style.height = '100%';
      playerElement.style.position = 'absolute';
      playerElement.style.top = '0';
      playerElement.style.left = '0';
      playerContainerRef.current.innerHTML = '';
      playerContainerRef.current.appendChild(playerElement);
    }
    
    // Function to initialize player when API is ready
    const initPlayer = () => {
      if (isDestroyed || !document.getElementById(playerIdRef.current)) return;
      
      try {
        // Clean up existing player instance
        if (playerInstanceRef.current) {
          if (playerInstanceRef.current.timeUpdateInterval) {
            clearInterval(playerInstanceRef.current.timeUpdateInterval);
            playerInstanceRef.current.timeUpdateInterval = null;
          }
          
          try {
            playerInstanceRef.current.destroy();
          } catch (e) {
            console.error('Error destroying previous player:', e);
          }
          
          playerInstanceRef.current = null;
        }
        
        // Only attempt to initialize if YT is available
        if (!window.YT || !window.YT.Player) {
          if (playerInitAttempts < maxPlayerInitAttempts) {
            playerInitAttempts++;
            setTimeout(initPlayer, 1000);
          } else {
            setError('Failed to load YouTube player. Please try again.');
          }
          return;
        }
        
        playerInstanceRef.current = new window.YT.Player(playerIdRef.current, {
          videoId,
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
            origin: window.location.origin,
            fs: 1, // Enable fullscreen
            iv_load_policy: 3, // Hide annotations
            enablejsapi: 1, // Enable JS API
            mute: 0 // Ensure not muted
          },
          events: {
            onReady: (event) => {
              console.log('YouTube player ready');
              setIsLoaded(true);
              
              // Check if there's a saved position for this video
              try {
                const savedPositions = JSON.parse(localStorage.getItem('video_positions') || '{}');
                const lastPosition = savedPositions[videoId];
                if (lastPosition) {
                  // Only seek if we have a saved position
                  event.target.seekTo(lastPosition, true);
                }
                // Don't call playVideo here - let autoplay handle it
              } catch (e) {
                console.error('Error seeking to saved position:', e);
              }
            },
            onStateChange: (event) => {
              // YouTube player states:
              // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
              console.log('Player state changed to:', event.data);
              
              const isPlaying = event.data === window.YT.PlayerState.PLAYING;
              
              // Only update state if it actually changed to avoid re-renders
              if (isVideoPlaying !== isPlaying) {
                setIsVideoPlaying(isPlaying);
              }
              
              // Update time in intervals when playing
              if (isPlaying && !playerInstanceRef.current.timeUpdateInterval) {
                console.log('Starting time update interval');
                playerInstanceRef.current.timeUpdateInterval = setInterval(() => {
                  try {
                    if (!playerInstanceRef.current || !playerInstanceRef.current.getCurrentTime) return;
                    
                    const currentTime = playerInstanceRef.current.getCurrentTime();
                    const duration = playerInstanceRef.current.getDuration();
                    
                    // Always update current time - this is needed for the UI
                    setCurrentTime(currentTime);
                    
                    if (duration !== videoDuration && duration > 0) {
                      setDuration(duration);
                    }
                     
                    if (onTimeUpdate) {
                      onTimeUpdate(currentTime, duration);
                    }
                     
                    // Save position every 5 seconds
                    if (currentTime > 0 && Math.floor(currentTime) % 5 === 0) {
                      try {
                        const positions = JSON.parse(localStorage.getItem('video_positions') || '{}');
                        positions[videoId] = currentTime;
                        localStorage.setItem('video_positions', JSON.stringify(positions));
                      } catch (e) {
                        // Silent error
                      }
                    }
                  } catch (e) {
                    // Silent fail
                  }
                }, 1000);
              } else if (!isPlaying && playerInstanceRef.current.timeUpdateInterval) {
                console.log('Clearing time update interval');
                clearInterval(playerInstanceRef.current.timeUpdateInterval);
                playerInstanceRef.current.timeUpdateInterval = null;
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              setError('Failed to play video');
            }
          }
        });
      } catch (e) {
        console.error('Error initializing YouTube player:', e);
        setError('Failed to initialize video player');
      }
    };
    
    // Create function to load YouTube API and initialize player
    const loadAndInitPlayer = async () => {
      // Wait for API to load if needed
      if (!window.YT || !window.YT.Player) {
        // Wait for next tick to ensure API registration is complete
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Store original callback and add initialization
        const originalCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (originalCallback) originalCallback();
          console.log('YouTube API loaded, initializing player...');
          initPlayer();
        };
        
        // Don't wait longer than 5 seconds
        setTimeout(() => {
          if (!window.YT || !window.YT.Player) {
            console.error('YouTube API failed to load within timeout');
            setError('Failed to load video player. Please try again.');
          }
        }, 5000);
      } else {
        // API already loaded, initialize immediately
        initPlayer();
      }
    };
    
    // Start the process
    loadAndInitPlayer();
    
    // Clean up on unmount
    return () => {
      isDestroyed = true;
      if (playerInstanceRef.current) {
        if (playerInstanceRef.current.timeUpdateInterval) {
          clearInterval(playerInstanceRef.current.timeUpdateInterval);
        }
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
      }
    };
  }, [videoId, onTimeUpdate]);
  
  // Expose methods to parent components through ref
  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.seekTo(time, true);
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
  
  return (
    <div 
      className={`flex flex-col bg-black rounded-lg overflow-hidden relative video-player-container ${className}`}
    >
      <div className="relative aspect-video bg-black flex items-center justify-center">
        {/* Loading indicator */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
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
        
        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="text-center p-4">
              <p className="text-white mb-4">{error}</p>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Watch on YouTube
              </a>
            </div>
          </div>
        )}
        
        {/* Player container */}
        <div 
          ref={playerContainerRef} 
          className="absolute inset-0 w-full h-full bg-black flex items-center justify-center"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
        ></div>
      </div>
      
      {/* Timeline with segment markers */}
      {isLoaded && showSegmentMarkers && segments.length > 0 && (
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
                onClick={() => {
                  if (playerInstanceRef.current) {
                    playerInstanceRef.current.seekTo(segment.startTime, true);
                  }
                }}
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