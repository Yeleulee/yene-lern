import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Play, TrendingUp, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import Button from '../components/ui/Button';
import VideoCard from '../components/video/VideoCard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos } = useLearning();

  const stats = {
    toLearn: userVideos.filter(v => v.status === 'to-learn').length,
    inProgress: userVideos.filter(v => v.status === 'in-progress').length,
    completed: userVideos.filter(v => v.status === 'completed').length
  };

  const recentVideos = userVideos
    .filter(v => v.status === 'in-progress')
    .slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.displayName || 'Learner'}! 👋
        </h1>
        <p className="text-gray-200 mb-6">
          Track your progress and continue your learning journey
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-sm">To Learn</p>
                <p className="text-2xl font-bold">{stats.toLearn}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/explore" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Play size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium">Find Videos</h3>
              <p className="text-sm text-gray-600">Discover new content</p>
            </div>
          </div>
        </Link>
        <Link to="/my-learning" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <TrendingUp size={24} className="text-secondary-600" />
            </div>
            <div>
              <h3 className="font-medium">My Progress</h3>
              <p className="text-sm text-gray-600">Track your learning</p>
            </div>
          </div>
        </Link>
        <Link to="/explore" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-100 rounded-lg">
              <Brain size={24} className="text-accent-600" />
            </div>
            <div>
              <h3 className="font-medium">AI Assistant</h3>
              <p className="text-sm text-gray-600">Get help learning</p>
            </div>
          </div>
        </Link>
        <Link to="/my-learning" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">Completed</h3>
              <p className="text-sm text-gray-600">Review finished videos</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Continue Learning Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Continue Learning</h2>
          <Link to="/my-learning">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        
        {recentVideos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Brain size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium mb-2">Start Learning</h3>
            <p className="text-gray-600 mb-4">
              Begin your learning journey by exploring educational videos
            </p>
            <Link to="/explore">
              <Button>Find Videos</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;