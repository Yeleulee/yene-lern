import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import { useLearningStats } from '../context/LearningStatsContext';
import { ArrowUp, Award, Clock, CheckCircle, TrendingUp, Users, Brain, Calendar, Camera, X, Upload, User } from 'lucide-react';
import Button from '../components/ui/Button';
import ProfilePictureEditor from '../components/profile/ProfilePictureEditor';
import ProfileEditForm from '../components/profile/ProfileEditForm';

interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  completedVideos: number;
  learningStreak: number;
  lastActive: string;
  totalLearningTime: number;
}

// Mock data - in a real app, this would come from Firebase
const mockLeaderboard: LeaderboardUser[] = [
  {
    uid: '1',
    displayName: 'Sarah Johnson',
    completedVideos: 42,
    learningStreak: 7,
    lastActive: '2023-07-15',
    totalLearningTime: 3600,
  },
  {
    uid: '2',
    displayName: 'Michael Chen',
    completedVideos: 38,
    learningStreak: 5,
    lastActive: '2023-07-14',
    totalLearningTime: 3200,
  },
  {
    uid: '3',
    displayName: 'Emma Wilson',
    completedVideos: 35,
    learningStreak: 4,
    lastActive: '2023-07-16',
    totalLearningTime: 2900,
  },
  {
    uid: '4',
    displayName: 'David Kim',
    completedVideos: 29,
    learningStreak: 3,
    lastActive: '2023-07-12',
    totalLearningTime: 2400,
  },
];

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { userVideos } = useLearning();
  const { 
    leaderboard, 
    userPosition, 
    learningStreak, 
    isImproving, 
    fasterLearners,
    refreshStats,
    loading,
    totalLearningTime,
    activityData,
    completionRate,
    averageTimePerVideo
  } = useLearningStats();
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'leaderboard'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Calculate user stats
  const completedVideos = userVideos.filter(v => v.status === 'completed').length;
  const inProgressVideos = userVideos.filter(v => v.status === 'in-progress').length;
  
  // Refresh stats when component mounts
  useEffect(() => {
    if (user) {
      refreshStats();
    }
  }, [user]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Date formatter
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle file selection for profile picture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }
    
    setUploadError(null);
    
    try {
      // Read the file and open the editor
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setTempImageUrl(imageUrl);
        setShowEditor(true);
      };
      reader.onerror = () => {
        setUploadError('Error reading file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading profile picture:', error);
      setUploadError('Failed to read image');
    }
  };

  // Trigger file input click
  const handleProfilePictureClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setShowProfileMenu(false);
  };

  // Handle remove profile picture
  const handleRemovePicture = async () => {
    if (updateProfile) {
      try {
        setIsUploading(true);
        await updateProfile({
          photoURL: null
        });
        setShowProfileMenu(false);
      } catch (error) {
        console.error('Error removing profile picture:', error);
        setUploadError('Failed to remove profile picture');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  // Handle save from editor
  const handleSaveProfilePicture = async (croppedImageData: string) => {
    if (updateProfile) {
      try {
        setIsUploading(true);
        await updateProfile({
          photoURL: croppedImageData
        });
        setShowEditor(false);
        setTempImageUrl(null);
      } catch (error) {
        console.error('Error updating profile picture:', error);
        setUploadError('Failed to update profile picture');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  // Handle cancel from editor
  const handleCancelEdit = () => {
    setShowEditor(false);
    setTempImageUrl(null);
  };

  // Handle profile update
  const handleProfileUpdate = async (updates: Partial<User>) => {
    if (updateProfile) {
      try {
        console.log('ProfilePage: Starting profile update');
        await updateProfile(updates);
        console.log('ProfilePage: Profile update completed successfully');
        // Don't close the form here - let the ProfileEditForm handle the success state and closing
      } catch (error) {
        console.error('ProfilePage: Error updating profile:', error);
        throw error; // Let the form handle the error display
      }
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Profile</h1>
        <p className="text-gray-600 mb-8">Please sign in to view your profile.</p>
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

  // Generate account creation date - in a real app this would come from Firebase
  const accountCreationDate = new Date();
  accountCreationDate.setMonth(accountCreationDate.getMonth() - 2); // Simulate account created 2 months ago

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative group" ref={profileMenuRef}>
            <div 
              className="w-24 h-24 rounded-full bg-white p-1 shadow-lg cursor-pointer overflow-hidden"
              onClick={handleProfilePictureClick}
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "Profile"} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-3xl">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              
              {/* Overlay with camera icon */}
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            
            {/* Profile picture menu */}
            {showProfileMenu && (
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 animate-fade-in">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={handleUploadClick}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                    role="menuitem"
                    disabled={isUploading}
                  >
                    <Upload size={16} className="mr-2" />
                    Upload New Picture
                  </button>
                  {user.photoURL && (
                    <button
                      onClick={handleRemovePicture}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left transition-colors"
                      role="menuitem"
                      disabled={isUploading}
                    >
                      <X size={16} className="mr-2" />
                      Remove Picture
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/jpeg, image/png, image/gif, image/webp" 
            />
            
            {/* Upload error message */}
            {uploadError && (
              <div className="absolute -bottom-6 left-0 right-0 text-center text-red-300 text-xs">
                {uploadError}
              </div>
            )}
            
            {/* Loading indicator */}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{user.displayName || user.email}</h1>
            <p className="text-gray-200 mb-4">Member since {accountCreationDate.toLocaleDateString()}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <div className="bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{completedVideos} Completed</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{inProgressVideos} In Progress</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span>{learningStreak} Day Streak</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex flex-col items-center bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-1">Leaderboard Rank</h3>
            <div className="text-4xl font-bold mb-2">{userPosition}</div>
            {isImproving && (
              <div className="flex items-center text-green-300">
                <ArrowUp size={16} className="mr-1" />
                <span>Improving</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600'}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600'}`}
          onClick={() => setActiveTab('stats')}
        >
          Learning Stats
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'leaderboard' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600'}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">About Me</h2>
              <p className="text-gray-600 mb-4">
                {user.learningPreferences ? 
                  `Interested in: ${user.learningPreferences.join(', ')}` : 
                  `${user.displayName || 'You'} is learning through video tutorials and focused courses. Connect your learning preferences to customize your experience.`}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowEditForm(true)}
              >
                Edit Profile
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Learning Journey</h2>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Completed Courses</h3>
                      <p className="text-sm text-gray-600">{completedVideos} videos finished</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{completedVideos}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Clock size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Learning Time</h3>
                      <p className="text-sm text-gray-600">Total hours spent learning</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{Math.round(totalLearningTime / 3600)} hrs</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <TrendingUp size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Current Streak</h3>
                      <p className="text-sm text-gray-600">Consecutive days learning</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{learningStreak} days</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Competitive Insight</h2>
              {fasterLearners.length > 0 ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    These learners are currently ahead of you:
                  </p>
                  <div className="space-y-4">
                    {fasterLearners.slice(0, 3).map((learner) => (
                      <div key={learner.uid} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                            {learner.displayName[0]}
                          </div>
                          <div>
                            <p className="font-medium">{learner.displayName}</p>
                            <p className="text-sm text-gray-500">{learner.completedVideos} completed</p>
                          </div>
                        </div>
                        <div className="text-red-500 font-medium">
                          +{learner.completedVideos - completedVideos}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Complete {fasterLearners[0]?.completedVideos - completedVideos || 5} more videos to overtake the next person!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award size={48} className="mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-xl font-medium mb-2">Congratulations!</h3>
                  <p className="text-gray-600">
                    You're at the top of the leaderboard!
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Learning Goals</h2>
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(completedVideos * 10, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {completedVideos >= 10 
                    ? 'You\'ve reached your monthly goal! Set a new target.' 
                    : `Complete ${10 - completedVideos} more videos to reach your monthly goal`}
                </p>
                <Button variant="primary" className="w-full">Set New Goal</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Learning Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Brain size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Videos</h3>
                  <p className="text-2xl font-bold">{userVideos.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Completion Rate</h3>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Learning Streak</h3>
                  <p className="text-2xl font-bold">{learningStreak} days</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock size={24} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Avg. Time/Video</h3>
                  <p className="text-2xl font-bold">{averageTimePerVideo} min</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold mb-4">Learning Activity</h3>
            <div className="h-64 bg-gray-50 rounded-xl p-4">
              {/* Activity Chart */}
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-end">
                  {activityData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end">
                      <div 
                        className="w-6 bg-blue-500 rounded-t-md" 
                        style={{ 
                          height: `${Math.min(day.minutes * 2, 100)}%`,
                          opacity: day.minutes > 0 ? 1 : 0.2
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="h-6 mt-2 flex border-t border-gray-200 pt-1">
                  {activityData.map((day, index) => (
                    <div key={index} className="flex-1 text-xs text-center text-gray-500">
                      {formatDate(day.date)}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Last 7 days</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {activityData.reduce((total, day) => total + day.minutes, 0)} total minutes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Learning Leaderboard</h2>
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1">
              <span className="text-sm text-gray-600 mr-2">Your Rank:</span>
              <span className="text-sm font-bold">{userPosition}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((person, index) => (
                  <tr key={person.uid} className={user.uid === person.uid ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-600' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            <Award size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600 font-medium">
                            {index + 1}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                          {person.displayName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{person.displayName}</div>
                          {user.uid === person.uid && (
                            <div className="text-xs text-blue-600">You</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.completedVideos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.learningStreak} days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Picture Editor Modal */}
      {showEditor && tempImageUrl && (
        <ProfilePictureEditor 
          imageUrl={tempImageUrl}
          onSave={handleSaveProfilePicture}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Profile Edit Form Modal */}
      {showEditForm && (
        <ProfileEditForm 
          user={user}
          onSave={handleProfileUpdate}
          onCancel={() => {
            console.log('ProfilePage: Closing edit form');
            setShowEditForm(false);
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage; 