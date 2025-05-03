import React, { useState, useEffect } from 'react';
import { BookmarkIcon, Clock, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

interface Bookmark {
  id: string;
  timestamp: number; // in seconds
  label: string;
  videoId: string;
}

interface CourseBookmarkProps {
  videoId: string;
  currentTime?: number;
  onSeek?: (timestamp: number) => void;
}

const CourseBookmark: React.FC<CourseBookmarkProps> = ({ 
  videoId, 
  currentTime = 0,
  onSeek 
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('video_bookmarks');
    if (savedBookmarks) {
      const parsedBookmarks = JSON.parse(savedBookmarks) as Bookmark[];
      setBookmarks(parsedBookmarks);
    }
  }, []);

  // Filter bookmarks for the current video
  const videoBookmarks = bookmarks.filter(bookmark => bookmark.videoId === videoId);

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddBookmark = () => {
    if (!videoId) return;
    
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      timestamp: currentTime,
      label: bookmarkLabel || `Bookmark at ${formatTimestamp(currentTime)}`,
      videoId
    };
    
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    
    // Save to localStorage
    localStorage.setItem('video_bookmarks', JSON.stringify(updatedBookmarks));
    
    // Reset form
    setBookmarkLabel('');
    setIsAddingBookmark(false);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
    setBookmarks(updatedBookmarks);
    
    // Save to localStorage
    localStorage.setItem('video_bookmarks', JSON.stringify(updatedBookmarks));
  };

  const handleSeekToBookmark = (timestamp: number) => {
    if (onSeek) {
      onSeek(timestamp);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg flex items-center">
          <BookmarkIcon size={18} className="mr-2 text-blue-600" />
          Bookmarks
        </h3>
        <Button 
          size="sm" 
          variant={isAddingBookmark ? "primary" : "outline"}
          onClick={() => setIsAddingBookmark(!isAddingBookmark)}
          aria-expanded={isAddingBookmark}
        >
          {isAddingBookmark ? 'Cancel' : 'Add Bookmark'}
        </Button>
      </div>

      {isAddingBookmark && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="mb-2">
            <label htmlFor="bookmarkLabel" className="block text-sm font-medium text-gray-700 mb-1">
              Bookmark Label
            </label>
            <input
              id="bookmarkLabel"
              type="text"
              value={bookmarkLabel}
              onChange={(e) => setBookmarkLabel(e.target.value)}
              placeholder={`Bookmark at ${formatTimestamp(currentTime)}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Clock size={14} className="mr-1" />
            Current time: {formatTimestamp(currentTime)}
          </div>
          <Button onClick={handleAddBookmark} size="sm">
            Save Bookmark
          </Button>
        </div>
      )}

      {videoBookmarks.length > 0 ? (
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {videoBookmarks.map(bookmark => (
            <li 
              key={bookmark.id} 
              className="flex items-center justify-between bg-gray-50 rounded-md p-2 text-sm hover:bg-gray-100 transition-colors"
            >
              <button 
                className="flex items-center text-left flex-grow"
                onClick={() => handleSeekToBookmark(bookmark.timestamp)}
              >
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 min-w-[40px] text-center">
                  {formatTimestamp(bookmark.timestamp)}
                </span>
                <span className="font-medium">{bookmark.label}</span>
              </button>
              <button 
                onClick={() => handleDeleteBookmark(bookmark.id)}
                className="text-gray-400 hover:text-red-500 p-1"
                aria-label={`Delete bookmark: ${bookmark.label}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm p-2">
          No bookmarks for this video yet. Add one to mark important moments.
        </p>
      )}
    </div>
  );
};

export default CourseBookmark; 