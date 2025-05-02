import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { Video, UserVideo, LearningStatus } from '../../types';
import Button from '../ui/Button';

interface VideoCardProps {
  video: Video | UserVideo;
  onSave?: (video: Video) => void;
  onUpdateStatus?: (videoId: string, status: LearningStatus) => void;
  isSaved?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onSave, onUpdateStatus, isSaved }) => {
  const isUserVideo = 'status' in video;
  
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

  return (
    <div className="card group hover:transform hover:scale-[1.01] transition-all">
      <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Link
            to={`/video/${video.id}`}
            className="bg-primary-600 hover:bg-primary-700 rounded-full w-12 h-12 flex items-center justify-center text-white"
          >
            <Play fill="white" size={20} />
          </Link>
        </div>
      </div>

      <div className="flex flex-col h-40">
        <h3 className="font-medium text-gray-900 text-lg leading-tight line-clamp-2 mb-1">
          <Link to={`/video/${video.id}`} className="hover:text-primary-600 transition-colors">
            {video.title}
          </Link>
        </h3>
        <p className="text-gray-500 text-sm mb-1">{video.channelTitle}</p>
        <p className="text-gray-500 text-xs mb-2">
          Published: {formatDate(video.publishedAt)}
        </p>
        <p className="text-gray-700 text-sm line-clamp-2 mb-auto">
          {video.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          {isUserVideo ? (
            <div className="flex items-center space-x-2">
              <span className={`status-pill status-${(video as UserVideo).status}`}>
                <span className="mr-1">{statusIcons[(video as UserVideo).status]}</span>
                <span>{statusLabels[(video as UserVideo).status]}</span>
              </span>
              
              {onUpdateStatus && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => onUpdateStatus(video.id, 'to-learn')}
                    className={`p-1 rounded-full transition-colors ${(video as UserVideo).status === 'to-learn' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                    title="Mark as To Learn"
                  >
                    <BookOpen size={14} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() => onUpdateStatus(video.id, 'in-progress')}
                    className={`p-1 rounded-full transition-colors ${(video as UserVideo).status === 'in-progress' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    title="Mark as In Progress"
                  >
                    <Clock size={14} className="text-gray-700" />
                  </button>
                  <button
                    onClick={() => onUpdateStatus(video.id, 'completed')}
                    className={`p-1 rounded-full transition-colors ${(video as UserVideo).status === 'completed' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                    title="Mark as Completed"
                  >
                    <CheckCircle size={14} className="text-gray-700" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave(video)}
                disabled={isSaved}
              >
                {isSaved ? 'Saved' : 'Save to Learning'}
              </Button>
            )
          )}
          
          <Link to={`/video/${video.id}`}>
            <Button size="sm">Watch & Learn</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;