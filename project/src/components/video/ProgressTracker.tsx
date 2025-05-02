import React from 'react';
import { UserVideo, LearningStatus } from '../../types';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

interface ProgressTrackerProps {
  video: UserVideo;
  onUpdateStatus: (videoId: string, status: LearningStatus) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ video, onUpdateStatus }) => {
  const statusInfo = {
    'to-learn': {
      icon: <BookOpen size={18} />,
      label: 'To Learn',
      color: 'bg-gray-100 text-gray-800',
      description: 'This video is in your learning queue.',
    },
    'in-progress': {
      icon: <Clock size={18} />,
      label: 'In Progress',
      color: 'bg-blue-100 text-blue-800',
      description: "You're currently learning from this video.",
    },
    'completed': {
      icon: <CheckCircle size={18} />,
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
      description: "You've completed learning from this video.",
    },
  };

  const currentStatus = statusInfo[video.status];

  return (
    <div className="card">
      <h3 className="text-lg font-medium mb-3">Learning Progress</h3>
      
      <div className="flex items-center mb-4">
        <div className={`rounded-full p-2 ${currentStatus.color} mr-3`}>
          {currentStatus.icon}
        </div>
        <div>
          <p className="font-medium">{currentStatus.label}</p>
          <p className="text-sm text-gray-600">{currentStatus.description}</p>
        </div>
      </div>
      
      {video.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium">{video.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full"
              style={{ width: `${video.progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={video.status === 'to-learn' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onUpdateStatus(video.id, 'to-learn')}
          className="flex items-center gap-1"
        >
          <BookOpen size={16} />
          <span>To Learn</span>
        </Button>
        <Button
          variant={video.status === 'in-progress' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onUpdateStatus(video.id, 'in-progress')}
          className="flex items-center gap-1"
        >
          <Clock size={16} />
          <span>In Progress</span>
        </Button>
        <Button
          variant={video.status === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onUpdateStatus(video.id, 'completed')}
          className="flex items-center gap-1"
        >
          <CheckCircle size={16} />
          <span>Completed</span>
        </Button>
      </div>
    </div>
  );
};

export default ProgressTracker;