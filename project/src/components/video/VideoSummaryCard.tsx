import React from 'react';
import { VideoSummary } from '../../types';
import { BrainCircuit, ListChecks, HelpCircle } from 'lucide-react';

interface VideoSummaryCardProps {
  videoSummary: VideoSummary;
  isLoading?: boolean;
  userQuestion?: string;
}

const VideoSummaryCard: React.FC<VideoSummaryCardProps> = ({
  videoSummary,
  isLoading = false,
  userQuestion,
}) => {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="mt-6 mb-2">
          <div className="h-5 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 text-primary-700">
          <BrainCircuit size={20} />
          <h3 className="text-lg font-medium">AI Summary</h3>
        </div>
        <p className="text-gray-700">{videoSummary.summary}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 text-secondary-700">
          <ListChecks size={20} />
          <h3 className="text-lg font-medium">Recommended Next Topics</h3>
        </div>
        <ul className="list-disc list-inside pl-1 space-y-1">
          {videoSummary.nextTopics.map((topic, index) => (
            <li key={index} className="text-gray-700">
              {topic}
            </li>
          ))}
        </ul>
      </div>

      {userQuestion && videoSummary.response && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2 text-accent-700">
            <HelpCircle size={20} />
            <h3 className="text-lg font-medium">Your Question</h3>
          </div>
          <p className="text-gray-600 text-sm italic mb-2">"{userQuestion}"</p>
          <p className="text-gray-700">{videoSummary.response}</p>
        </div>
      )}
    </div>
  );
};

export default VideoSummaryCard;