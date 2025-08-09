import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Play,
  BookOpen,
  Menu,
  X,
  FileText,
  Maximize2,
  Save,
  BookmarkIcon,
  Share2,
  Clock,
  CheckCircle
} from 'lucide-react';
import { getCourseSectionByVideoId, getCourseById } from '../../data/mockCourseData';
import { useAuth } from '../../context/AuthContext';
import { useLearning } from '../../context/LearningContext';
import Button from '../ui/Button';
import CourseBookmark from './CourseBookmark';
import TimestampParser from './TimestampParser';
import { Video } from '../../types';
import VideoSegments from './VideoSegments';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';

interface CourseSectionProps {
  courseId?: string;
  videoId?: string;
  video?: Video;
}

interface NoteData {
  content: string;
  timestamp: number;
}

// Add a courseContext to track the current course
interface CourseContext {
  courseId: string;
  currentSectionId: string;
  progress: number;
}

const CourseSection: React.FC<CourseSectionProps> = ({ courseId, videoId, video }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { updateStatus } = useLearning();
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Use params if props not provided
  const activeVideoId = videoId || params.videoId;
  
  // Get course ID from URL search params first, then props or route params
  const activeCourseId = searchParams.get('course') || courseId || params.courseId;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(localStorage.getItem('course_autoplay') !== 'false');
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState<Record<string, NoteData[]>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [activeTab, setActiveTab] = useState<'chapters' | 'notes' | 'bookmarks' | 'segments'>('chapters');
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [segments, setSegments] = useState<{ startTime: number; title: string }[]>([]);
  
  // Get course data based on course ID first
  const course = activeCourseId ? getCourseById(activeCourseId) : undefined;
  
  // Then find the section in that course using the video ID
  const currentSection = course && activeVideoId ? 
    course.sections.find(section => section.videoId === activeVideoId) : undefined;
  
  // If video ID doesn't match any section in the selected course, redirect to the first section
  useEffect(() => {
    if (activeCourseId && course && activeVideoId) {
      const sectionExists = course.sections.some(section => section.videoId === activeVideoId);
      
      if (!sectionExists) {
        // Video doesn't belong to this course, redirect to the first section
        const firstSection = course.sections[0];
        navigate(`/video/${firstSection.videoId}?course=${activeCourseId}`);
      }
    }
  }, [activeCourseId, course, activeVideoId, navigate]);
  
  // Setup course continuity tracking
  useEffect(() => {
    if (course && currentSection) {
      // Store the current course context in localStorage for persistence
      const courseContext: CourseContext = {
        courseId: course.id,
        currentSectionId: currentSection.id,
        progress: 0 // Will be updated later
      };
      
      localStorage.setItem('current_course_context', JSON.stringify(courseContext));
      
      // Get the index in this course
      const index = course.sections.findIndex(section => section.id === currentSection.id);
      setCurrentIndex(index);
      
      // Calculate progress
      const completedSections = course.sections.filter(section => section.completed).length;
      const progressPercent = Math.round((completedSections / course.sections.length) * 100);
      setProgress(progressPercent);
      
      // Update the progress in the course context
      courseContext.progress = progressPercent;
      localStorage.setItem('current_course_context', JSON.stringify(courseContext));
      
      // Update document title for better navigation history
      document.title = `${currentSection.title} | ${course.title}`;
    }
  }, [course, currentSection]);
  
  // Load notes from local storage
  useEffect(() => {
    const storedNotes = localStorage.getItem('course_notes');
    if (storedNotes) {
      setSavedNotes(JSON.parse(storedNotes));
    }
  }, []);
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate when not typing in the notes field
      if (document.activeElement !== noteInputRef.current) {
        if (e.key === 'ArrowRight' && currentIndex < (course?.sections.length || 0) - 1) {
          handleNext();
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          handlePrevious();
        } else if (e.key === 'm') {
          handleMarkComplete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [course, currentSection, currentIndex]);

  // Save autoplay preference
  useEffect(() => {
    localStorage.setItem('course_autoplay', autoPlay.toString());
  }, [autoPlay]);

  // Check if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Set up player message listener
  useEffect(() => {
    let playerCheckInterval: NodeJS.Timeout;
    
    // Set up message listener for YouTube API messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onStateChange' && data.info === 1) {
          // Video is playing
        } else if (data.event === 'onStateChange' && data.info === 0) {
          // Video ended
          if (autoPlay) {
            handleMarkComplete();
          }
        } else if (data.event === 'infoDelivery' && data.info && data.info.currentTime) {
          // Update current time
          setCurrentTime(data.info.currentTime);
          setTotalTime(data.info.duration || 0);
        }
      } catch (e) {
        // Not a JSON message or not from our player
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Try to establish connection with player
    playerCheckInterval = setInterval(() => {
      if (playerRef.current && playerRef.current.contentWindow) {
        playerRef.current.contentWindow.postMessage('{"event":"listening"}', '*');
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(playerCheckInterval);
    };
  }, [autoPlay]);
  
  // Save last watched position
  useEffect(() => {
    if (currentTime > 0 && currentSection) {
      const savedPositions = JSON.parse(localStorage.getItem('video_positions') || '{}');
      savedPositions[currentSection.videoId] = currentTime;
      localStorage.setItem('video_positions', JSON.stringify(savedPositions));
    }
  }, [currentTime, currentSection]);
  
  // Load last watched position using VideoPlayer handle
  useEffect(() => {
    if (!currentSection) return;
    const savedPositions = JSON.parse(localStorage.getItem('video_positions') || '{}');
    const lastPosition = savedPositions[currentSection.videoId];
    if (typeof lastPosition !== 'number' || lastPosition <= 0) return;

    // Try seeking a few times until player is ready
    let attempts = 0;
    const maxAttempts = 5;
    const interval = setInterval(() => {
      attempts += 1;
      const ok = playerRef.current?.seekTo(lastPosition);
      if (ok || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [currentSection]);
  
  // Parse timestamps to create segments
  useEffect(() => {
    if (currentSection?.description) {
      const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?(?:\s?[-–—]\s?|\s)([^\r\n]+)/gm;
      const parsedSegments: { startTime: number; title: string }[] = [];
      let match;
      
      // Find all timestamps in the description
      while ((match = timestampRegex.exec(currentSection.description)) !== null) {
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
      setSegments(parsedSegments);
    }
  }, [currentSection?.description]);
  
  // Log course context for debugging
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('Course Context:', {
        courseId: activeCourseId, 
        videoId: activeVideoId,
        course: course?.title,
        section: currentSection?.title,
        index: currentIndex
      });
    }
  }, [activeCourseId, activeVideoId, course, currentSection, currentIndex]);
  
  if (!course || !currentSection) {
    return <div className="p-4 text-center">Course content not found</div>;
  }
  
  const handlePrevious = () => {
    if (currentIndex > 0 && course) {
      const prevSection = course.sections[currentIndex - 1];
      
      // Navigate while preserving course context
      navigate(`/video/${prevSection.videoId}?course=${course.id}`);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < (course?.sections.length || 0) - 1 && course) {
      const nextSection = course.sections[currentIndex + 1];
      
      // Navigate while preserving course context
      navigate(`/video/${nextSection.videoId}?course=${course.id}`);
    }
  };
  
  const handleMarkComplete = async () => {
    if (user && currentSection) {
      await updateStatus(currentSection.videoId, 'completed');
      
      // Show confetti effect
      showCompletionConfetti();
      
      // Auto navigate to next section if autoplay is on
      if (autoPlay && currentIndex < course.sections.length - 1) {
        // Small delay to allow the user to see the completion animation
        setTimeout(() => {
          handleNext();
        }, 800);
      } else if (currentIndex === course.sections.length - 1) {
        // This was the last lesson - show course completion message
        showCourseCompletionMessage();
      }
    }
  };

  const showCourseCompletionMessage = () => {
    // Create a temporary completion message
    const completionElement = document.createElement('div');
    completionElement.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80';
    completionElement.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md text-center">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold mb-2">Course Completed!</h2>
        <p class="text-gray-600 mb-6">Congratulations on completing "${course.title}"</p>
        <button class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Continue Learning
        </button>
      </div>
    `;
    
    document.body.appendChild(completionElement);
    
    // Add click event to remove the message
    completionElement.addEventListener('click', () => {
      document.body.removeChild(completionElement);
    });
    
    // Automatically remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(completionElement)) {
        document.body.removeChild(completionElement);
      }
    }, 5000);
  };

  const saveNote = () => {
    if (!note.trim() || !currentSection) return;
    
    const timestamp = Math.floor(Date.now() / 1000);
    const videoNotes = savedNotes[currentSection.videoId] || [];
    const updatedNotes = {
      ...savedNotes,
      [currentSection.videoId]: [
        ...videoNotes, 
        { content: note, timestamp }
      ]
    };
    
    setSavedNotes(updatedNotes);
    localStorage.setItem('course_notes', JSON.stringify(updatedNotes));
    setNote('');
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  const showCompletionConfetti = () => {
    // This would be implemented with a confetti library
    // For now we'll just add the placeholder
    console.log('Showing completion confetti');
    // We would add confetti.js to the project and call it here
  };

  const handleSeekTo = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
  };
  
  const handleShareVideo = () => {
    const timestampParam = currentTime > 0 ? `&t=${Math.floor(currentTime)}` : '';
    const url = `${window.location.origin}/video/${currentSection?.videoId}?course=${course.id}${timestampParam}`;
    setShareLink(url);
    setIsShareModalOpen(true);
  };
  
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      // You could set a success state here
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };
  
  const currentVideoNotes = savedNotes[currentSection.videoId] || [];
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      {/* Sidebar toggle for mobile */}
      <button
        className="md:hidden fixed z-50 bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:translate-x-0 w-full md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-auto fixed md:relative z-30 top-0 bottom-0 left-0`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold">{course.title}</h2>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex border-b border-gray-200">
          <button 
            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'chapters' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('chapters')}
          >
            Chapters
          </button>
          <button 
            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'segments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('segments')}
          >
            Segments
          </button>
          <button 
            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
          <button 
            className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === 'bookmarks' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            Bookmarks
          </button>
        </div>
        
        {/* Tab content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'chapters' && (
            <>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Course progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            
              {/* Course sections list */}
              <div className="space-y-2">
                {course.sections.map((section, index) => (
                  <div 
                    key={section.id}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      section.id === currentSection.id 
                        ? 'bg-blue-50 border border-blue-100'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => navigate(`/video/${section.videoId}?course=${course.id}`)}
                  >
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        section.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {section.completed ? <Check size={16} /> : index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock size={12} className="mr-1" />
                          <span>{section.duration}</span>
                        </div>
                      </div>
                      {section.id === currentSection.id && (
                        <div className="ml-auto">
                          <Play size={16} className="text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {activeTab === 'segments' && (
            <VideoSegments
              videoId={activeVideoId}
              description={currentSection.description || ''}
              currentTime={currentTime}
              duration={totalTime}
              onSeek={handleSeekTo}
              onSegmentComplete={(segmentId) => {
                // Optional: Add any additional logic when a segment is completed
              }}
            />
          )}
          
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <textarea
                ref={noteInputRef}
                className="w-full border rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about this video..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>
              
              <div className="flex space-x-2">
                <Button onClick={saveNote} disabled={!note.trim()}>
                  Save Note
                </Button>
                <Button variant="outline" onClick={() => setNote('')} disabled={!note.trim()}>
                  Clear
                </Button>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Saved Notes</h3>
                {(savedNotes[currentSection.videoId] || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">No notes saved for this video yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(savedNotes[currentSection.videoId] || []).map((noteItem, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">
                            {new Date(noteItem.timestamp * 1000).toISOString().substr(11, 8)}
                          </span>
                          <button 
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => handleSeekTo(noteItem.timestamp)}
                          >
                            Jump to time
                          </button>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{noteItem.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'bookmarks' && (
            <CourseBookmark
              videoId={activeVideoId}
              currentTime={currentTime}
              onSeek={handleSeekTo}
            />
          )}
        </div>
        
        {/* Bottom navigation */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              disabled={currentIndex === 0}
              onClick={handlePrevious}
              className="px-3 py-2"
            >
              <ChevronLeft size={18} className="mr-1" /> Previous
            </Button>
            <Button 
              disabled={currentIndex >= course.sections.length - 1} 
              onClick={handleNext}
              className="px-3 py-2"
            >
              Next <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
          <div className="mt-3">
            <label className="flex items-center cursor-pointer">
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={autoPlay}
                  onChange={() => setAutoPlay(!autoPlay)}
                />
                <div className="h-4 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[-2px] after:left-0 after:bg-white after:border after:border-gray-300 after:h-6 after:w-6 after:rounded-full after:transition-all"></div>
              </div>
              <span className="text-xs text-gray-700">
                Auto-play next chapter
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-96">
        {/* Video player */}
        <div 
          ref={videoContainerRef}
          className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'aspect-video w-full'}`}
        >
          <VideoPlayer
            ref={playerRef}
            videoId={activeVideoId}
            onTimeUpdate={(time, duration) => {
              setCurrentTime(time);
              setTotalTime(duration);
            }}
            className="w-full h-full"
            segments={segments}
            showSegmentMarkers={true}
          />
          
          {/* Fullscreen toggle */}
          <button 
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded hover:bg-opacity-90"
          >
            <Maximize2 size={18} />
          </button>
        </div>
        
        {/* Content below video */}
        <div className="p-4 flex-1">
          <div className="flex flex-wrap items-start justify-between mb-4">
            <div className="mr-4 mb-4">
              <h1 className="text-2xl font-bold">{currentSection.title}</h1>
              <div className="text-sm text-gray-500 mt-1 flex items-center">
                <span className="flex items-center mr-4">
                  <Clock size={14} className="mr-1" /> {currentSection.duration}
                </span>
                <span>Chapter {currentIndex + 1} of {course.sections.length}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={currentSection.completed ? "outline" : "default"}
                onClick={handleMarkComplete}
                className="flex items-center"
              >
                {currentSection.completed ? (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    Mark as complete
                  </>
                )}
              </Button>
              <Button
                variant="outline" 
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              </div>
            </div>
            
          {/* Video Description */}
          <div className="mt-8">
            <h2 className="text-lg font-medium mb-2">About this lesson</h2>
            <div className="text-gray-700 prose max-w-none">
                <TimestampParser 
                description={currentSection.description || ''}
                  onSeek={handleSeekTo}
                  currentTime={currentTime}
                videoId={activeVideoId}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Share this lesson</h3>
            <div className="flex items-center mb-4">
              <input
                type="text"
                readOnly 
                value={shareLink}
                className="flex-1 border border-gray-300 rounded-l-lg p-2"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyShareLink}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSection; 