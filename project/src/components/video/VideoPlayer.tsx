import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

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
  onEnded?: () => void;
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
  showSegmentMarkers = false,
  onEnded
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const playerIdRef = useRef(`youtube-player-${videoId || Math.random().toString(36).substr(2, 9)}`);

  // Wire up postMessage API with the rendered iframe
  useEffect(() => {
    if (!videoId) return;

    let timeUpdateInterval: NodeJS.Timeout | null = null;

    const handleMessage = (event: MessageEvent) => {
      // Only handle events coming from our iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // State changes
        if (data.event === 'onStateChange' || (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined)) {
          const playerState = data.event === 'onStateChange' ? data.info : data.info.playerState;
          const playing = playerState === 1; // PLAYING
          setIsVideoPlaying(playing);

          if (playerState === 0 && onEnded) { // ENDED
            onEnded();
          }

          if (playing && !timeUpdateInterval) {
            timeUpdateInterval = setInterval(() => {
              try {
                iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'getCurrentTime', args: [] }), '*');
                iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'getDuration', args: [] }), '*');
              } catch { }
            }, 1000);
          } else if (!playing && timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
            timeUpdateInterval = null;
          }
        }

        // Time/duration updates
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
            if (onTimeUpdate) onTimeUpdate(data.info.currentTime, typeof data.info.duration === 'number' ? data.info.duration : duration);

            // Persist resume position frequently
            try {
              const positions = JSON.parse(localStorage.getItem('video_positions') || '{}');
              positions[videoId] = data.info.currentTime;
              localStorage.setItem('video_positions', JSON.stringify(positions));
            } catch { }
          }
          if (typeof data.info.duration === 'number') {
            setDuration(data.info.duration);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    };
  }, [videoId, onTimeUpdate, duration, onEnded]);

  // Initialize the iframe API and try autoplay/resume when iframe loads
  const initializePlayer = () => {
    if (!iframeRef.current) return;
    try {
      const cw = iframeRef.current.contentWindow;
      if (!cw) return;
      // Handshake and listeners
      cw.postMessage(JSON.stringify({ event: 'listening', id: playerIdRef.current }), '*');
      cw.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
      cw.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onReady'] }), '*');

      // Try to resume from last saved position
      const positions = JSON.parse(localStorage.getItem('video_positions') || '{}');
      const last = positions[videoId];
      if (typeof last === 'number' && last > 0) {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [last, true] }), '*');
      }

      // Attempt autoplay
      if (autoplay) {
        cw.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      }
    } catch { }
  };

  // Expose methods to parent components through ref
  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      try {
        const iframe = document.getElementById(playerIdRef.current) as HTMLIFrameElement | null;
        const cw = iframe?.contentWindow || iframeRef.current?.contentWindow;
        if (!cw) return;
        cw.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [time, true] }), '*');
      } catch (e) {
        console.error('Error in seekTo:', e);
      }
    },
    play: () => {
      const cw = iframeRef.current?.contentWindow;
      cw?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
    },
    pause: () => {
      const cw = iframeRef.current?.contentWindow;
      cw?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
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

  // Persist position on unload as a fallback
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const positions = JSON.parse(localStorage.getItem('video_positions') || '{}');
        positions[videoId] = currentTime;
        localStorage.setItem('video_positions', JSON.stringify(positions));
      } catch { }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [videoId, currentTime]);

  return (
    <div className={`video-player-container w-full ${className}`} style={{ aspectRatio: '16/9' }}>
      <div className="relative w-full h-full flex justify-center items-center overflow-hidden">
        <div className="w-full h-full">
          <iframe
            ref={iframeRef}
            id={playerIdRef.current}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
            style={{ border: 'none' }}
            onLoad={initializePlayer}
          />
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center hover:bg-red-700 transition-colors"
          title="Open in YouTube"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
          YouTube
        </a>
      </div>

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