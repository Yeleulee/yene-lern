import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, BookmarkPlus, ArrowLeft, Menu, X } from 'lucide-react';
import { getCourseSectionByVideoId, getNextSection, getPrevSection } from '../../data/mockCourseData';

interface CourseVideoPlayerProps {
  videoId: string;
}

const CourseVideoPlayer: React.FC<CourseVideoPlayerProps> = ({ videoId }) => {
  const navigate = useNavigate();
  const [autoPlay, setAutoPlay] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentCourseData, setCurrentCourseData] = useState<{
    courseId: string;
    title: string;
    sections: any[];
    currentSection: any;
    currentIndex: number;
  } | null>(null);
  
  // Check window size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowOutline(false);
      } else {
        setShowOutline(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    console.log(`Loading course video with ID: ${videoId}`);
    // Find the course and section for this video
    const data = getCourseSectionByVideoId(videoId);
    
    if (data) {
      const { course, section } = data;
      console.log(`Found course: ${course.title}, section: ${section.title}`);
      
      // Verify this is a valid video ID
      if (section.videoId !== videoId) {
        console.error(`Video ID mismatch: expected ${section.videoId}, got ${videoId}`);
        setVideoError('Invalid video ID. The requested video does not match the course content.');
        return;
      }
      
      const currentIndex = course.sections.findIndex(s => s.id === section.id);
      
      // Update all sections to set the current one
      const updatedSections = course.sections.map(s => ({
        ...s,
        current: s.id === section.id
      }));
      
      setCurrentCourseData({
        courseId: course.id,
        title: course.title,
        sections: updatedSections,
        currentSection: section,
        currentIndex
      });
      
      // Clear any previous errors
      setVideoError(null);
      // Reset video loaded state
      setIsVideoLoaded(false);
    } else {
      console.error(`No course found for video ID: ${videoId}`);
      setVideoError('Video not found in any course.');
    }
  }, [videoId]);

  // Handle video loading events
  const handleIframeLoad = () => {
    console.log('Video iframe loaded');
    setIsVideoLoaded(true);
  };
  
  const handleIframeError = () => {
    console.error('Video iframe failed to load');
    setVideoError('Failed to load the video. Please try again later.');
  };
  
  const handleAutoPlayToggle = () => {
    setAutoPlay(!autoPlay);
  };
  
  const handleMarkComplete = () => {
    if (currentCourseData) {
      // In a real app, this would update the database
      const updatedSections = currentCourseData.sections.map(section => 
        section.id === currentCourseData.currentSection.id 
          ? { ...section, completed: true }
          : section
      );
      
      setCurrentCourseData({
        ...currentCourseData,
        sections: updatedSections
      });
      
      // Auto navigate to next section if autoplay is on
      if (autoPlay) {
        const nextSection = getNextSection(currentCourseData.courseId, currentCourseData.currentSection.id);
        if (nextSection) {
          navigate(`/video/${nextSection.videoId}`);
        }
      }
    }
  };

  const navigateToNextSection = () => {
    if (currentCourseData) {
      const nextSection = getNextSection(currentCourseData.courseId, currentCourseData.currentSection.id);
      if (nextSection) {
        navigate(`/video/${nextSection.videoId}`);
      }
    }
  };

  const navigateToPrevSection = () => {
    if (currentCourseData) {
      const prevSection = getPrevSection(currentCourseData.courseId, currentCourseData.currentSection.id);
      if (prevSection) {
        navigate(`/video/${prevSection.videoId}`);
      }
    }
  };

  // Display an error message if the video can't be found or loaded
  if (videoError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Video Error</h2>
          <p className="text-gray-600 mb-6">{videoError}</p>
          <button 
            onClick={() => navigate('/my-learning')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Go to My Learning
          </button>
        </div>
      </div>
    );
  }

  if (!currentCourseData) {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          ref={iframeRef}
        ></iframe>
      </div>
    );
  }

  const completedCount = currentCourseData.sections.filter(s => s.completed).length;
  const totalSections = currentCourseData.sections.length;
  const currentSectionNumber = currentCourseData.currentIndex + 1;
  const nextSection = getNextSection(currentCourseData.courseId, currentCourseData.currentSection.id);
  const prevSection = getPrevSection(currentCourseData.courseId, currentCourseData.currentSection.id);
  
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 py-2 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-2 text-gray-700"
              onClick={() => setShowOutline(!showOutline)}
            >
              {showOutline ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/my-learning" className="text-gray-700 hover:text-blue-600 flex items-center">
              <ArrowLeft size={18} className="mr-1" />
              <span className="text-sm">Back</span>
            </Link>
            <span className="mx-2 text-gray-400">|</span>
            <h1 className="text-sm font-medium text-gray-800">{currentCourseData.title}</h1>
          </div>
          <div className="flex items-center">
            <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm">
              <BookmarkPlus size={16} className="mr-1" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - conditionally shown based on showOutline state */}
        <div className={`${showOutline ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300 absolute md:relative z-10 h-full`}>
          {/* Play All Toggle */}
          <div className="border-b border-gray-200 p-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={autoPlay}
                  onChange={handleAutoPlayToggle}
                />
                <div className={`h-6 w-12 rounded-full transition ${autoPlay ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute transform ${autoPlay ? 'translate-x-6' : 'translate-x-1'} transition ease-in-out duration-200 h-4 w-4 rounded-full bg-white`}></div>
              </div>
              <span className="text-sm font-medium">Play All</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Automatically move to the next video in the Classroom when playback concludes
            </p>
          </div>

          {/* Course Sections List */}
          <div className="flex-1 overflow-y-auto">
            {currentCourseData.sections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center border-b border-gray-100 p-4 hover:bg-gray-50 cursor-pointer ${
                  section.current ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  navigate(`/video/${section.videoId}`);
                  if (window.innerWidth < 768) {
                    setShowOutline(false);
                  }
                }}
              >
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                  {section.completed ? (
                    <CheckCircle size={16} className="text-blue-600" />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                  )}
                </div>
                <span className={`text-sm truncate ${
                  section.current ? 'font-medium text-blue-700' : 
                  section.completed ? 'text-gray-600' : 'text-gray-700'
                }`}>
                  {section.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Player */}
          <div className="w-full bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              ref={iframeRef}
            ></iframe>
          </div>

          {/* Course Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Current section info */}
            <div className="bg-white p-4 border-t border-gray-200 border-b-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-sm text-gray-500 mr-2">{currentSectionNumber} of {totalSections}</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${(completedCount / totalSections) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold">{currentCourseData.currentSection.title}</h2>
                </div>
                
                <button
                  onClick={handleMarkComplete}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  <CheckCircle size={16} />
                  <span>Mark as complete</span>
                </button>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="bg-white p-3 border-t border-gray-200 mt-auto flex items-center justify-between">              
              <button
                onClick={navigateToPrevSection}
                className={`flex items-center space-x-1 px-3 py-1.5 border ${
                  prevSection 
                  ? 'border-gray-300 hover:bg-gray-50 text-gray-700' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
                } rounded`}
                disabled={!prevSection}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <button
                onClick={navigateToNextSection}
                className={`flex items-center space-x-1 px-3 py-1.5 ${
                  nextSection
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } rounded`}
                disabled={!nextSection}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseVideoPlayer; 