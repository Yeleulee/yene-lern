import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, CheckCircle, BookOpen, Layers, Clock3, BookmarkIcon, GraduationCap, BarChart, Eye, Trash2 } from 'lucide-react';
import { Video, UserVideo, LearningStatus } from '../../types';
import Button from '../ui/Button';
import { getCourseSectionByVideoId } from '../../data/mockCourseData';

interface VideoCardProps {
  video: Video | UserVideo;
  onSave?: (video: Video) => void;
  onUpdateStatus?: (videoId: string, status: LearningStatus) => void;
  onRemove?: (videoId: string) => void;
  isSaved?: boolean;
}

// Add a function to format the duration string (ISO 8601 duration format PT1H20M30S) as "X hr Y min"
const formatDuration = (duration: string): string => {
  if (!duration) return '';

  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return '';

  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  } else {
    return `${minutes} min`;
  }
};

// Format view count with k/m suffix
const formatViewCount = (viewCount?: string): string => {
  if (!viewCount) return '';
  
  const count = parseInt(viewCount, 10);
  if (isNaN(count)) return '';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  } else {
    return `${count} views`;
  }
};

// Calculate difficulty level based on duration and content complexity
const getDifficultyLevel = (video: Video | UserVideo): { level: string; color: string } => {
  if (!video.duration) return { level: 'Beginner', color: 'green' };
  
  const durationMatches = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!durationMatches) return { level: 'Beginner', color: 'green' };
  
  const hours = parseInt(durationMatches[1] || '0', 10);
  const minutes = parseInt(durationMatches[2] || '0', 10);
  const totalMinutes = hours * 60 + minutes;
  
  // Check for advanced keywords in the title or description
  const advancedKeywords = ['advanced', 'expert', 'complex', 'comprehensive', 'professional', 'in-depth'];
  const hasAdvancedContent = advancedKeywords.some(keyword => 
    video.title.toLowerCase().includes(keyword) || 
    video.description.toLowerCase().includes(keyword)
  );
  
  // Check for beginner keywords
  const beginnerKeywords = ['beginner', 'intro', 'introduction', 'basics', 'fundamental', 'getting started'];
  const hasBeginnerContent = beginnerKeywords.some(keyword => 
    video.title.toLowerCase().includes(keyword) || 
    video.description.toLowerCase().includes(keyword)
  );
  
  if (hasAdvancedContent || totalMinutes > 120) {
    return { level: 'Advanced', color: 'red' };
  } else if (hasBeginnerContent || totalMinutes < 40) {
    return { level: 'Beginner', color: 'green' };
  } else {
    return { level: 'Intermediate', color: 'yellow' };
  }
};

const VideoCard: React.FC<VideoCardProps> = ({ video, onSave, onUpdateStatus, onRemove, isSaved }) => {
  const isUserVideo = 'status' in video;
  const courseData = getCourseSectionByVideoId(video.id);
  const isPartOfCourse = !!courseData;
  
  // Check if video has segments by parsing description for timestamps
  const hasSegments = React.useMemo(() => {
    if (!video.description) return false;
    
    const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?(?:\s?[-–—]\s?|\s)([^\r\n]+)/gm;
    return timestampRegex.test(video.description);
  }, [video.description]);
  
  // Count segments in video description
  const segmentCount = React.useMemo(() => {
    if (!video.description) return 0;
    
    const timestampRegex = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?(?:\s?[-–—]\s?|\s)([^\r\n]+)/gm;
    let count = 0;
    let match;
    
    while ((match = timestampRegex.exec(video.description)) !== null) {
      count++;
    }
    
    return count;
  }, [video.description]);
  
  const statusIcons = {
    'to-learn': <BookOpen size={14} />,
    'in-progress': <Clock size={14} />,
    'completed': <CheckCircle size={14} />
  };

  const statusLabels = {
    'to-learn': 'To Learn',
    'in-progress': 'In Progress',
    'completed': 'Completed'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Estimate course duration in minutes (assuming average video is 5 minutes)
  const estimatedDuration = isPartOfCourse 
    ? courseData?.course.sections.length * 5 
    : 0;

  // Extract and format the duration from the video object
  const formattedDuration = video.duration ? formatDuration(video.duration) : '';
  
  // Format view count
  const formattedViews = video.viewCount ? formatViewCount(video.viewCount) : '';
  
  // Get difficulty level
  const difficulty = getDifficultyLevel(video);
  
  // Calculate progress percentage for in-progress videos
  const progressPercentage = isUserVideo && (video as UserVideo).status === 'in-progress' ? 35 : 0;
  
  // Generate the correct link with course context if part of a course
  const getVideoLink = () => {
    if (isPartOfCourse && courseData) {
      return `/video/${video.id}?course=${courseData.course.id}`;
    }
    // For segmented videos, just go to the video page - no special parameters needed
    return `/video/${video.id}`;
  };

  return (
    <div 
      className="card group hover:transform hover:scale-[1.01] transition-all shadow-sm hover:shadow-md border border-gray-200 rounded-lg overflow-hidden"
      tabIndex={0}
      aria-label={`${video.title} ${isPartOfCourse ? 'course' : hasSegments ? 'segmented course' : 'course'}`}
    >
      <div className="relative aspect-video overflow-hidden flex items-center justify-center bg-black">
        <img
          src={video.thumbnailUrl}
          alt=""
          className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
          style={{ width: 'auto', height: 'auto', maxHeight: '100%' }}
          loading="lazy"
          onError={(e) => {
            // Fallback for failed thumbnails
            e.currentTarget.src = 'https://via.placeholder.com/480x360?text=Video+Thumbnail';
          }}
        />
        {isPartOfCourse && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md flex items-center z-10">
            <GraduationCap size={12} className="mr-1" aria-hidden="true" />
            Full Course
          </div>
        )}
        {!isPartOfCourse && hasSegments && (
          <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-md flex items-center z-10">
            <BookmarkIcon size={12} className="mr-1" aria-hidden="true" />
            Segmented Course
          </div>
        )}
        {!isPartOfCourse && !hasSegments && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md flex items-center z-10">
            <GraduationCap size={12} className="mr-1" aria-hidden="true" />
            Full Course
          </div>
        )}
        
        {/* Difficulty badge */}
        <div className={`absolute top-2 right-2 ${
          difficulty.color === 'red' ? 'bg-red-600' : 
          difficulty.color === 'yellow' ? 'bg-yellow-600' : 
          'bg-green-600'} text-white text-xs px-2 py-1 rounded-md flex items-center z-10`}>
          <BarChart size={12} className="mr-1" aria-hidden="true" />
          {difficulty.level}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            to={getVideoLink()}
            className="bg-white hover:bg-blue-600 hover:text-white group-hover:scale-110 transition-all duration-300 rounded-full w-12 h-12 flex items-center justify-center text-blue-600"
            aria-label={`Watch ${video.title}`}
          >
            <Play fill="currentColor" size={20} />
          </Link>
        </div>
        {formattedDuration && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
            <Clock size={12} className="mr-1" aria-hidden="true" />
            {formattedDuration}
          </div>
        )}
        {isPartOfCourse && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
            <Layers size={12} className="mr-1" aria-hidden="true" />
            {courseData?.course.sections.length} lessons
          </div>
        )}
        {!isPartOfCourse && hasSegments && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
            <BookmarkIcon size={12} className="mr-1" aria-hidden="true" />
            {segmentCount} chapters
          </div>
        )}
        
        {/* Progress bar for user videos that are in progress */}
        {isUserVideo && (video as UserVideo).status === 'in-progress' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div 
              className="h-full bg-blue-500"
              style={{ width: `${progressPercentage}%` }}
              aria-label={`${progressPercentage}% complete`}
            ></div>
          </div>
        )}
      </div>

      <div className="flex flex-col p-4 h-[calc(100%-56.25%)]">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-medium text-gray-900 text-lg leading-tight line-clamp-2">
            <Link to={getVideoLink()} className="hover:text-primary-600 transition-colors">
              {video.title}
            </Link>
          </h3>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-gray-500 text-sm">{video.channelTitle}</p>
          {isPartOfCourse && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center">
              <GraduationCap size={10} className="mr-1" aria-hidden="true" />
              Full Course
            </span>
          )}
          {!isPartOfCourse && hasSegments && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full flex items-center">
              <BookmarkIcon size={10} className="mr-1" aria-hidden="true" />
              Segmented Course
            </span>
          )}
          <span className={`${
            difficulty.color === 'red' ? 'bg-red-100 text-red-800' : 
            difficulty.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-green-100 text-green-800'} text-xs px-2 py-0.5 rounded-full flex items-center`}>
            <BarChart size={10} className="mr-1" aria-hidden="true" />
            {difficulty.level}
          </span>
          {formattedDuration && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center">
              <Clock size={10} className="mr-1" aria-hidden="true" />
              {formattedDuration}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <p className="text-gray-500 text-xs">
            Published: {formatDate(video.publishedAt)}
          </p>
          {video.viewCount && (
            <p className="text-gray-500 text-xs flex items-center">
              <Eye size={10} className="mr-1" aria-hidden="true" />
              {formattedViews}
            </p>
          )}
        </div>
        
        <p className="text-gray-700 text-sm line-clamp-2 mb-auto">
          {video.description}
        </p>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
          {isUserVideo ? (
            <div className="flex items-center space-x-2">
              <span 
                className={`status-pill status-${(video as UserVideo).status} flex items-center`}
                aria-label={`Status: ${statusLabels[(video as UserVideo).status]}`}
              >
                <span className="mr-1" aria-hidden="true">{statusIcons[(video as UserVideo).status]}</span>
                <span>{statusLabels[(video as UserVideo).status]}</span>
              </span>
              
              {onUpdateStatus && (
                <div className="flex space-x-1" role="group" aria-label="Update status">
                  <button
                    onClick={() => onUpdateStatus(video.id, 'to-learn')}
                    className={`p-1 rounded-full transition-colors ${(video as UserVideo).status === 'to-learn' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    title="Mark as To Learn"
                    aria-pressed={(video as UserVideo).status === 'to-learn'}
                  >
                    <BookOpen size={14} className="text-gray-700" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onUpdateStatus(video.id, 'in-progress')}
                    className={`p-1 rounded-full transition-colors ${(video as UserVideo).status === 'in-progress' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Mark as In Progress"
                    aria-pressed={(video as UserVideo).status === 'in-progress'}
                  >
                    <Clock size={14} className="text-gray-700" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onUpdateStatus(video.id, 'completed')}
                    className={`p-1 rounded-full transition-colors ${(video as UserVideo).status === 'completed' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                    title="Mark as Completed"
                    aria-pressed={(video as UserVideo).status === 'completed'}
                  >
                    <CheckCircle size={14} className="text-gray-700" aria-hidden="true" />
                  </button>
                  
                  {onRemove && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this course from your learning list?')) {
                          onRemove(video.id);
                        }
                      }}
                      className="p-1 rounded-full hover:bg-red-100 transition-colors ml-2"
                      title="Remove from My Learning"
                    >
                      <Trash2 size={14} className="text-red-600" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isPartOfCourse && (
                <span className="text-xs text-blue-700 flex items-center">
                  <Layers size={14} className="mr-1" aria-hidden="true" />
                  {courseData?.course.sections.length} lessons
                </span>
              )}
              {hasSegments && !isPartOfCourse && (
                <span className="text-xs text-indigo-700 flex items-center">
                  <BookmarkIcon size={14} className="mr-1" aria-hidden="true" />
                  {segmentCount} chapters
                </span>
              )}
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSave(video as Video)}
                  disabled={isSaved}
                  aria-label={isSaved ? 'Already saved to learning' : 'Save to learning'}
                >
                  {isSaved ? 'Saved' : 'Save to Learning'}
                </Button>
              )}
            </div>
          )}
          
          <Link to={getVideoLink()}>
            <Button 
              size="sm"
              className="group-hover:bg-blue-700 transition-colors"
            >
              {isPartOfCourse ? 'Start Course' : hasSegments ? 'Start Learning' : 'Watch & Learn'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;