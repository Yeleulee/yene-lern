import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Star, 
  Users, 
  Calendar, 
  Share, 
  ChevronRight,
  BarChart,
  Brain,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import { getVideoDetails, getVideoStats } from '../services/youtubeService';
import { generateVideoSummary } from '../services/geminiService';
import { Video } from '../types';
import { getCourseSectionByVideoId } from '../data/mockCourseData';

const CourseDetail: React.FC = () => {
  const { videoId = '' } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getVideoById, addVideo, updateStatus } = useLearning();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [videoStats, setVideoStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState<string | null>(null);
  
  const userVideo = user ? getVideoById(videoId) : undefined;
  const isVideoSaved = !!userVideo;

  useEffect(() => {
    async function loadCourseData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if this is a valid course video
        const courseData = getCourseSectionByVideoId(videoId);
        if (!courseData) {
          console.warn(`Video ID ${videoId} is not part of any course`);
        }
        
        // Get video details
        const videoDetails = await getVideoDetails(videoId);
        if (videoDetails) {
          setVideo(videoDetails);
          
          // Get video stats (like duration, views)
          const stats = await getVideoStats(videoId);
          if (stats) {
            setVideoStats(stats);
          }
          
          // Generate AI summary
          const summaryData = await generateVideoSummary(
            videoDetails.title,
            videoDetails.description
          );
          setSummary(summaryData.summary);
        } else {
          setError('Unable to load video details. The video may be unavailable.');
        }
      } catch (error) {
        console.error('Error loading video details:', error);
        setError('An error occurred while loading course details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    if (videoId) {
      loadCourseData();
    } else {
      setError('Invalid video ID');
      setIsLoading(false);
    }
  }, [videoId]);

  const handleSaveToCourse = async () => {
    if (user && video) {
      await addVideo(video);
    } else {
      navigate('/login');
    }
  };

  const handleStartCourse = () => {
    // Verify the video is still available before navigating
    const courseData = getCourseSectionByVideoId(videoId);
    if (courseData) {
      // Make sure to include the course ID in the URL when navigating to the video page
      navigate(`/video/${videoId}?course=${courseData.course.id}`);
    } else {
      setError('This course is not available at the moment. Please try another course.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="aspect-video bg-gray-300 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Course Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/explore">
            <Button>Explore Other Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or is unavailable.</p>
        <Link to="/explore">
          <Button>Back to Explore</Button>
        </Link>
      </div>
    );
  }

  // Format the duration from ISO 8601 format
  const formatDuration = (isoDuration: string = 'PT0M0S') => {
    const hours = isoDuration.match(/(\d+)H/);
    const minutes = isoDuration.match(/(\d+)M/);
    const seconds = isoDuration.match(/(\d+)S/);
    
    let result = '';
    if (hours) result += `${hours[1]}h `;
    if (minutes) result += `${minutes[1]}m `;
    if (seconds && !hours && !minutes) result += `${seconds[1]}s`;
    
    return result.trim();
  };

  // Format view count
  const formatViewCount = (count: string = '0') => {
    const num = parseInt(count);
    if (num > 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num > 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Video Preview */}
        <div className="mb-6 rounded-lg overflow-hidden shadow-md">
          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>

        {/* Course Title and Basic Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
          <p className="text-gray-600 mb-4">Programming with {video.channelTitle}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            {videoStats && (
              <>
                <div className="flex items-center gap-1">
                  <Clock size={18} />
                  <span>{formatDuration(videoStats.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={18} />
                  <span>{formatViewCount(videoStats.viewCount)} views</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={18} />
              <span>Published {new Date(video.publishedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={18} className="text-yellow-400" />
              <span>4.8 (128 ratings)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleStartCourse} 
              className="px-4 sm:px-6 py-2 bg-gray-900 hover:bg-gray-800 w-full sm:w-auto"
            >
              Start Learning
            </Button>
            {!isVideoSaved ? (
              <Button 
                variant="outline" 
                onClick={handleSaveToCourse} 
                className="px-4 sm:px-6 py-2 border-gray-900 text-gray-900 hover:bg-gray-100 w-full sm:w-auto"
              >
                Save to My Learning
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="px-4 sm:px-6 py-2 border-green-600 text-green-600 hover:bg-green-50 w-full sm:w-auto"
                disabled
              >
                <CheckCircle size={18} className="mr-2" />
                Saved to My Learning
              </Button>
            )}
            <Button 
              variant="ghost" 
              className="px-4 text-gray-600 w-full sm:w-auto"
            >
              <Share size={18} className="mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Content - Tabs */}
          <div className="md:col-span-2">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
              <div className="flex gap-4 md:gap-6 -mb-px min-w-max">
                <button 
                  className={`py-3 px-1 font-medium border-b-2 ${
                    activeTab === 'summary' 
                      ? 'border-gray-900 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('summary')}
                >
                  <Brain size={18} className="inline-block mr-2" />
                  <span>AI Summary</span>
                </button>
                <button 
                  className={`py-3 px-1 font-medium border-b-2 ${
                    activeTab === 'about' 
                      ? 'border-gray-900 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('about')}
                >
                  <BookOpen size={18} className="inline-block mr-2" />
                  <span>About</span>
                </button>
                <button 
                  className={`py-3 px-1 font-medium border-b-2 ${
                    activeTab === 'statistics' 
                      ? 'border-gray-900 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('statistics')}
                >
                  <BarChart size={18} className="inline-block mr-2" />
                  <span>Statistics</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              {activeTab === 'summary' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">AI-Generated Summary</h2>
                  <p className="text-gray-700 mb-4">{summary}</p>
                  <div className="text-sm text-gray-500 italic">
                    Summary generated using Gemini AI based on course content
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">About This Course</h2>
                  <div className="text-gray-700 mb-6 whitespace-pre-line">
                    {video.description}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-medium mb-2">Instructor</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelTitle)}&background=random`} 
                          alt={video.channelTitle} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{video.channelTitle}</div>
                        <div className="text-sm text-gray-500">Course Creator</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'statistics' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Course Statistics</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Views</div>
                      <div className="text-xl font-medium">
                        {videoStats ? formatViewCount(videoStats.viewCount) : 'N/A'}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Likes</div>
                      <div className="text-xl font-medium">
                        {videoStats ? formatViewCount(videoStats.likeCount) : 'N/A'}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Duration</div>
                      <div className="text-xl font-medium">
                        {videoStats ? formatDuration(videoStats.duration) : 'N/A'}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Published</div>
                      <div className="text-xl font-medium">
                        {new Date(video.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Related Courses */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Related Courses</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(item => (
                  <div key={item} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="h-40 bg-gray-200"></div>
                    <div className="p-4">
                      <h3 className="font-medium mb-1 line-clamp-2">Related Course Title #{item}</h3>
                      <p className="text-sm text-gray-500 mb-2">Instructor Name</p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm flex items-center gap-1">
                          <Star size={16} className="text-yellow-400" />
                          <span>4.7</span>
                        </div>
                        <Link to="#" className="text-sm text-gray-900 hover:text-black flex items-center">
                          View <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="md:col-span-1">
            {/* Track Progress Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Track Your Progress</h2>
              <p className="text-gray-600 mb-4">
                Save this course to track your progress and receive personalized recommendations.
              </p>
              {user ? (
                <Button 
                  onClick={handleSaveToCourse} 
                  disabled={isVideoSaved}
                  className="w-full"
                >
                  {isVideoSaved ? 'Already Saved' : 'Save to My Learning'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button as="a" href="/login" className="w-full">
                    Log In to Save
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                   Don't have an account? <Link to="/signup" className="text-gray-900 hover:underline">Sign up</Link>
                  </p>
                </div>
              )}
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">What You'll Learn</h2>
              <ul className="space-y-2">
                {summary.split('. ').slice(0, 4).map((point, index) => (
                  <li key={index} className="flex gap-2">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{point}.</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {['Programming', 'Python', 'Beginner', 'Web Development', 'Data Science'].map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 