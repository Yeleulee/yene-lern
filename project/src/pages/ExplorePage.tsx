import React, { useState } from 'react';
import SearchBar from '../components/search/SearchBar';
import VideoCard from '../components/video/VideoCard';
import { searchVideos } from '../services/youtubeService';
import { useLearning } from '../context/LearningContext';
import { useAuth } from '../context/AuthContext';
import { Video } from '../types';
import { Search as SearchIcon } from 'lucide-react';

const popularTopics = [
  'JavaScript basics',
  'Python tutorial',
  'Machine Learning',
  'Web Development',
  'React hooks',
  'Data Structures',
  'SQL tutorial',
  'Physics explained',
];

const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, addVideo } = useLearning();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Video[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    try {
      const results = await searchVideos(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    handleSearch(topic);
  };

  const isVideoSaved = (videoId: string) => {
    return userVideos.some((v) => v.id === videoId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore</h1>
        <p className="text-gray-600">Discover educational videos to enhance your learning</p>
      </div>

      <div className="mb-8">
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />
      </div>

      {!searchQuery && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">Popular Topics</h2>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className="px-4 py-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isSearching ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-video bg-gray-300 rounded-lg mb-3"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="flex justify-end">
                <div className="h-8 bg-gray-300 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          <h2 className="text-xl font-medium mb-4">
            Search Results for "{searchQuery}"
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onSave={user ? addVideo : undefined}
                isSaved={isVideoSaved(video.id)}
              />
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <SearchIcon size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No videos found</h3>
          <p className="text-gray-600">
            No results found for "{searchQuery}". Try a different search term.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ExplorePage;