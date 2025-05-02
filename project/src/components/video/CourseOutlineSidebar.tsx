import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CourseSection {
  id: string;
  title: string;
  videoId: string;
  completed: boolean;
  current: boolean;
}

interface CourseOutlineSidebarProps {
  courseSections: CourseSection[];
  progress: {
    completed: number;
    total: number;
  };
  autoPlay: boolean;
  onAutoPlayToggle: () => void;
  onMarkComplete: () => void;
  currentSectionId: string;
}

const CourseOutlineSidebar: React.FC<CourseOutlineSidebarProps> = ({
  courseSections,
  progress,
  autoPlay,
  onAutoPlayToggle,
  onMarkComplete,
  currentSectionId
}) => {
  return (
    <div className="bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="text-right text-sm text-gray-600 mb-3">
          {progress.completed}/{progress.total} completed
        </div>
        
        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={autoPlay}
                onChange={onAutoPlayToggle}
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
      
      <div className="overflow-y-auto flex-grow">
        {courseSections.map((section, index) => (
          <Link
            key={section.id}
            to={`/video/${section.videoId}`}
            className={`flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 ${
              section.current ? 'bg-blue-50' : ''
            }`}
          >
            <div className="mr-4 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-700">
              {section.completed ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="flex-grow">
              <div className={`${section.current ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                {section.title}
              </div>
            </div>
            {section.current && (
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-500"></div>
            )}
          </Link>
        ))}
      </div>
      
      {currentSectionId && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-3">
            {courseSections.find(s => s.id === currentSectionId)?.title}
          </h3>
          <button
            onClick={onMarkComplete}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <CheckCircle size={16} />
            Mark as complete
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseOutlineSidebar; 