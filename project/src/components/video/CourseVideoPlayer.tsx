import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { getCourseSectionByVideoId, getNextSection } from '../../data/mockCourseData';

interface CourseVideoPlayerProps {
  videoId: string;
}

const CourseVideoPlayer: React.FC<CourseVideoPlayerProps> = ({ videoId }) => {
  const navigate = useNavigate();
  const [autoPlay, setAutoPlay] = useState(false);
  const [currentCourseData, setCurrentCourseData] = useState<{
    courseId: string;
    title: string;
    sections: any[];
    currentSection: any;
    currentIndex: number;
  } | null>(null);
  
  useEffect(() => {
    // Find the course and section for this video
    const data = getCourseSectionByVideoId(videoId);
    
    if (data) {
      const { course, section } = data;
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
    }
  }, [videoId]);
  
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

  if (!currentCourseData) {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }

  const completedCount = currentCourseData.sections.filter(s => s.completed).length;
  const totalSections = currentCourseData.sections.length;
  const currentSectionNumber = currentCourseData.currentIndex + 1;
  
  return (
    <div className="flex flex-col md:h-[calc(100vh-64px)] h-screen">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar - hidden by default on mobile, toggled with button */}
        <div className="md:w-80 w-full md:h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden md:block">
          {/* Progress counter and autoplay toggle */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-right text-sm text-gray-600 mb-3">
              {completedCount}/{totalSections} completed
            </div>
            
            <div className="flex items-start">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoPlay}
                    onChange={handleAutoPlayToggle}
                  />
                  <div className={`block w-10 h-6 rounded-full ${autoPlay ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoPlay ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="ml-2 text-sm font-medium">Play All</span>
              </label>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Automatically move to the next video in the Classroom when playback concludes
            </div>
          </div>
          
          {/* Course sections list */}
          <div className="overflow-y-auto flex-grow">
            {currentCourseData.sections.map((section, index) => (
              <div 
                key={section.id}
                className={`flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  section.current ? 'bg-blue-50' : ''
                }`}
                onClick={() => navigate(`/video/${section.videoId}`)}
              >
                <div className="flex-shrink-0 w-8 h-8 mr-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    section.completed ? 'bg-white' : 'bg-gray-100'
                  } text-gray-700`}>
                    {section.completed ? (
                      <CheckCircle size={20} className="text-blue-600" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </div>
                <div className="flex-grow">
                  <span className={`${section.current ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                    {section.title}
                  </span>
                </div>
                {section.current && (
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="bg-black flex-grow">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
          <div className="p-3 md:p-6 bg-white">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div className="text-gray-500 text-sm">
                  {currentSectionNumber} of {totalSections}
                </div>
                <div className="flex-shrink-0">
                  <button 
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md w-full sm:w-auto"
                    onClick={handleMarkComplete}
                  >
                    <CheckCircle size={18} />
                    <span className="whitespace-nowrap">Mark as complete</span>
                  </button>
                </div>
              </div>
              
              <h2 className="text-xl font-bold mt-2">
                {currentCourseData.currentSection.title}
              </h2>
              <div className="text-sm text-gray-500 mt-1">
                Class Central Classrooms
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseVideoPlayer; 