import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Search } from 'lucide-react';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';
import Button from '../components/ui/Button';

const MyLearningPage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, updateStatus } = useLearning();
  const [filter, setFilter] = useState<'all' | 'to-learn' | 'in-progress' | 'completed'>('all');

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">My Learning</h1>
        <p className="text-gray-600 mb-8">Please sign in to view and manage your learning progress.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <Button>Login</Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredVideos = filter === 'all' 
    ? userVideos 
    : userVideos.filter(video => video.status === filter);

  const statusCounts = {
    'to-learn': userVideos.filter(v => v.status === 'to-learn').length,
    'in-progress': userVideos.filter(v => v.status === 'in-progress').length,
    'completed': userVideos.filter(v => v.status === 'completed').length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Learning</h1>
        <p className="text-gray-600">Track and manage your learning journey</p>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
          className="flex items-center gap-1"
        >
          All ({userVideos.length})
        </Button>
        <Button
          variant={filter === 'to-learn' ? 'primary' : 'outline'}
          onClick={() => setFilter('to-learn')}
          className="flex items-center gap-1"
        >
          <BookOpen size={16} />
          To Learn ({statusCounts['to-learn']})
        </Button>
        <Button
          variant={filter === 'in-progress' ? 'primary' : 'outline'}
          onClick={() => setFilter('in-progress')}
          className="flex items-center gap-1"
        >
          <Clock size={16} />
          In Progress ({statusCounts['in-progress']})
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'outline'}
          onClick={() => setFilter('completed')}
          className="flex items-center gap-1"
        >
          <CheckCircle size={16} />
          Completed ({statusCounts['completed']})
        </Button>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No videos found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? "You haven't saved any videos to your learning list yet."
              : `You don't have any ${filter.replace('-', ' ')} videos.`}
          </p>
          <Link to="/explore">
            <Button>Explore Videos</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onUpdateStatus={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLearningPage;