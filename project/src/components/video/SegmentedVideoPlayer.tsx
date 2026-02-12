import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Play,
  ChevronRight,
  CheckCircle,
  List,
  ArrowLeft,
  Bookmark,
  Share2,
  ExternalLink,
  Sparkles,
  Send,
  Loader2,
  Zap,
  Info
} from 'lucide-react';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';
import Button from '../ui/Button';
import Switch from '../ui/Switch';
import { useLearning } from '../../context/LearningContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

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
  const { user } = useAuth();
  const { getVideoById, saveProgress, addVideo } = useLearning();
  const { messages, sendMessage, isLoading: isChatLoading, connectionStatus } = useChat();

  const userVideo = useMemo(() => getVideoById(videoId), [getVideoById, videoId]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [playAll, setPlayAll] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chapters' | 'ai'>('chapters');
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoPlayerHandle>(null);

  const [segments, setSegments] = useState<Array<{
    id: string;
    startTime: number;
    endTime: number;
    title: string;
  }>>([]);

  const [completedSegments, setCompletedSegments] = useState<Record<string, boolean>>({});

  // Filter messages for this video
  const videoMessages = messages.filter(m => m.context === videoId || (!m.context && m.id === '1'));

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput;
    setChatInput('');
    await sendMessage(msg, videoId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  };

  // Initial load from UserVideo state if available
  useEffect(() => {
    if (userVideo?.completedSegmentIds) {
      const completions: Record<string, boolean> = {};
      userVideo.completedSegmentIds.forEach(id => {
        completions[id] = true;
      });
      setCompletedSegments(completions);
    }
  }, [userVideo]);

  // Load last watched time on mount
  const hasResumed = useRef(false);
  useEffect(() => {
    if (userVideo?.currentTimestamp && !hasResumed.current && playerRef.current) {
      playerRef.current.seekTo(userVideo.currentTimestamp);
      hasResumed.current = true;
    }
  }, [userVideo, isSidebarOpen]);

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

      while ((match = timestampRegex.exec(description)) !== null) {
        const hours = match[3] ? parseInt(match[1]) : 0;
        const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1]);
        const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2]);
        const title = match[4].trim();

        const startTime = hours * 3600 + minutes * 60 + seconds;
        const id = `${videoId}-segment-${startTime}`;

        parsedSegments.push({
          id,
          startTime,
          endTime: 0,
          title
        });
      }

      parsedSegments.sort((a, b) => a.startTime - b.startTime);

      for (let i = 0; i < parsedSegments.length; i++) {
        if (i < parsedSegments.length - 1) {
          parsedSegments[i].endTime = parsedSegments[i + 1].startTime;
        } else {
          parsedSegments[i].endTime = duration || parsedSegments[i].startTime + 600;
        }
      }

      setSegments(parsedSegments);
    }
  }, [videoId, description, duration]);

  // Throttle saving to database
  const lastSavedTime = useRef(0);
  const saveToDb = async (time: number, completions: Record<string, boolean>) => {
    if (!user) return;
    const now = Date.now();
    if (now - lastSavedTime.current < 5000) return; // Save every 5s max

    lastSavedTime.current = now;
    const completedIds = Object.keys(completions).filter(id => completions[id]);
    const progress = segments.length > 0 ? (completedIds.length / segments.length) * 100 : 0;

    await saveProgress(videoId, progress, time, completedIds);
  };

  const handleTimeUpdate = (time: number, dur: number) => {
    setCurrentTime(time);
    if (dur !== duration) setDuration(dur);

    if (segments.length > 0) {
      const currentSegment = segments.find(
        segment => time >= segment.startTime && time < segment.endTime
      );

      if (currentSegment && activeSegmentId !== currentSegment.id) {
        setActiveSegmentId(currentSegment.id);
      }

      // Auto-mark segment as completed when reaching 95% through it
      if (currentSegment && !completedSegments[currentSegment.id]) {
        const segDuration = currentSegment.endTime - currentSegment.startTime;
        const progress = time - currentSegment.startTime;
        if (progress / segDuration >= 0.95) {
          markSegmentComplete(currentSegment.id);
        }
      }
    }

    saveToDb(time, completedSegments);
  };

  const markSegmentComplete = (segmentId: string) => {
    setCompletedSegments(prev => {
      if (prev[segmentId]) return prev;
      const next = { ...prev, [segmentId]: true };
      const completedIds = Object.keys(next).filter(id => next[id]);
      const progress = segments.length > 0 ? (completedIds.length / segments.length) * 100 : 0;
      saveProgress(videoId, progress, currentTime, completedIds);
      return next;
    });
  };

  const handleSegmentClick = (startTime: number) => {
    playerRef.current?.seekTo(startTime);
  };

  const goToNextSegment = () => {
    if (!activeSegmentId || segments.length === 0) return;
    const currentIndex = segments.findIndex(s => s.id === activeSegmentId);
    if (currentIndex < segments.length - 1) {
      handleSegmentClick(segments[currentIndex + 1].startTime);
    }
  };

  const onVideoEnded = () => {
    if (playAll) {
      goToNextSegment();
    }
  };

  const getProgressCount = () => Object.values(completedSegments).filter(Boolean).length;
  const getProgressPercentage = () => {
    if (segments.length === 0) return 0;
    return Math.round((getProgressCount() / segments.length) * 100);
  };

  const handleSaveVideo = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addVideo({
      id: videoId,
      title,
      description,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: 'YouTube',
      publishedAt: new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden">
      {/* Top Navigation Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/my-learning" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium group text-nowrap">
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back / Classroom
          </Link>

          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
              <Play size={20} className="text-indigo-600 fill-indigo-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{title}</h1>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="font-medium text-gray-700">Course Provider</span>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 group cursor-pointer hover:text-indigo-600"
                >
                  <ExternalLink size={12} /> Direct link
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSaveVideo}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${userVideo ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Bookmark size={16} className={userVideo ? 'fill-indigo-700' : ''} />
            {userVideo ? 'Saved to list' : 'Add to list'}
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0 border-r-0'}`}>
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'chapters' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <List size={14} /> Chapters
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative ${activeTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <Sparkles size={14} /> AI Assistant
              {connectionStatus !== 'connected' && (
                <span className="absolute top-3 right-4 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {activeTab === 'chapters' ? (
              <div className="flex flex-col">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                  <Switch
                    checked={playAll}
                    onChange={setPlayAll}
                    label="Play All"
                    className="font-semibold text-gray-900"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
                    Auto-advance to next chapter
                  </p>
                </div>

                {segments.map((segment, index) => {
                  const isActive = segment.id === activeSegmentId;
                  const isCompleted = completedSegments[segment.id];

                  return (
                    <button
                      key={segment.id}
                      onClick={() => handleSegmentClick(segment.startTime)}
                      className={`w-full group flex items-start gap-4 p-4 text-left border-b border-gray-50 transition-all ${isActive ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${isCompleted
                        ? 'bg-blue-600 text-white'
                        : isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-900 text-white'
                        }`}>
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium leading-tight mb-1 truncate ${isActive ? 'text-indigo-900 font-bold' : 'text-gray-700 font-semibold'
                          }`}>
                          {segment.title}
                        </h4>
                      </div>

                      <div className="shrink-0">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <CheckCircle size={14} className="text-blue-600 fill-blue-600 bg-white rounded-full" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat Messages Area */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  {videoMessages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[90%] p-3 rounded-xl text-sm ${m.sender === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none shadow-sm'
                        }`}>
                        {m.content}
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 px-1">
                        {m.sender === 'ai' ? 'Assistant' : 'You'}
                      </span>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-2 p-3 bg-white border border-gray-100 rounded-xl rounded-tl-none shadow-sm w-fit animate-pulse">
                      <Loader2 size={14} className="animate-spin text-indigo-400" />
                      <span className="text-xs text-gray-400 font-bold">Thinking...</span>
                    </div>
                  )}
                </div>

                {/* Chat Input Area */}
                <div className="p-4 border-t border-gray-100">
                  <form onSubmit={handleSendChatMessage} className="relative">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all resize-none"
                      placeholder="Ask about this video..."
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 transition-all active:scale-90"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                  {connectionStatus !== 'connected' && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                      <Info size={12} /> Key needed in .env
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Workspace... */}
        <main className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
          {/* Top Progress Bar */}
          <div className="px-10 py-6 flex items-center justify-center relative bg-white/50 backdrop-blur-sm border-b border-gray-200 shrink-0">
            <div className="max-w-3xl w-full flex items-center gap-8 px-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2 shadow-inner overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-1000 ease-in-out relative"
                    style={{ width: `${getProgressPercentage()}%` }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse" />
                  </div>
                </div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">
                  {getProgressCount()} / {segments.length} segments completed
                </div>
              </div>

              <Button
                onClick={goToNextSegment}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 px-8 py-2.5 shadow-sm group hover:border-gray-400 font-bold text-sm"
                disabled={!activeSegmentId || segments.findIndex(s => s.id === activeSegmentId) >= segments.length - 1}
              >
                Next <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute right-6 p-2 text-gray-400 hover:text-gray-700 hidden lg:block"
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <List size={20} />
            </button>
          </div>

          {/* Video Section */}
          <div className="flex-1 px-8 py-8 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex-none max-w-5xl mx-auto w-full">
              <div className="bg-black rounded-2xl shadow-2xl overflow-hidden border-[6px] border-white relative group aspect-video">
                <VideoPlayer
                  ref={playerRef}
                  videoId={videoId}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={onVideoEnded}
                  segments={segments.map(s => ({ startTime: s.startTime, title: s.title }))}
                  showSegmentMarkers={true}
                  autoplay={true}
                  className="w-full h-full"
                />

                <div className="absolute top-6 left-6 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-lg px-4 py-2 rounded-xl border border-white/20 text-white text-sm font-semibold shadow-2xl">
                    {segments.find(s => s.id === activeSegmentId)?.title || title}
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto w-full mt-10 mb-12 shrink-0">
              <div className="bg-white rounded-3xl p-10 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500" />

                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Zap size={18} className="text-indigo-600" />
                  </div>
                  Chapter Overview
                </h3>

                <div className="prose max-w-none text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                  {description}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SegmentedVideoPlayer;