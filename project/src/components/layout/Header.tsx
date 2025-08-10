import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, User, LogOut, BookOpen, Home, CompassIcon, GraduationCap, Bell, Settings, ChevronDown, X, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { getCourseSectionByVideoId } from '../../data/mockCourseData';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isInCoursePlayer, setIsInCoursePlayer] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Track mobile state and scroll position
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Check if we're in a course video page
    if (location.pathname.startsWith('/video/')) {
      const videoId = location.pathname.split('/').pop();
      if (videoId) {
        const courseData = getCourseSectionByVideoId(videoId);
        setIsInCoursePlayer(!!courseData);
      } else {
        setIsInCoursePlayer(false);
      }
    } else {
      setIsInCoursePlayer(false);
    }
  }, [location]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    
    // Add subtle haptic feedback on mobile devices if supported
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Helper function to check if a link is active
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Special header for course player to match the image
  if (isInCoursePlayer) {
    return (
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Navigation buttons and logo for course player */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md transform hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
            </Link>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Profile'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold shadow-md">
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.displayName || 'User'}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User size={16} className="mr-3" />
                      View Profile
                    </Link>
                    
                    <Link
                      to="/my-learning"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <BookOpen size={16} className="mr-3" />
                      My Learning
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="outline">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Clean light header - ORB AI inspired
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 py-4 transition-all duration-300">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Clean Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-sm transform group-hover:scale-105 transition-all duration-300">
            <div className="text-white text-lg font-bold transform rotate-12">⧫</div>
          </div>
          <div className="text-2xl font-bold text-black tracking-tight" style={{ fontFamily: 'Dancing Script, cursive' }}>
            Yene Learn
          </div>
        </Link>

        {/* Clean Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className="text-gray-700 hover:text-black transition-colors font-medium"
          >
            Home
          </Link>
          <Link 
            to="/explore" 
            className="text-gray-700 hover:text-black transition-colors font-medium"
          >
            Explore
          </Link>
          <Link 
            to="/my-learning" 
            className="text-gray-700 hover:text-black transition-colors font-medium"
          >
            My Learning
          </Link>
        </nav>

                {/* Clean Auth Section */}
        <div className="hidden md:flex items-center">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-medium text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-gray-700 font-medium">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Enhanced User dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-slide-down">
                  <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center space-x-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Profile'}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || 'User'}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="p-1.5 rounded-lg bg-gray-100 mr-3">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Profile & Settings</p>
                        <p className="text-xs text-gray-500">Manage your account</p>
                      </div>
                    </Link>
                    
                    <Link
                      to="/my-learning"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="p-1.5 rounded-lg bg-gray-100 mr-3">
                        <BookOpen size={16} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">My Learning</p>
                        <p className="text-xs text-gray-500">Track your progress</p>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 active:bg-red-100"
                    >
                      <div className="p-1.5 rounded-lg bg-red-100 mr-3">
                        <LogOut size={16} className="text-red-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Sign Out</p>
                        <p className="text-xs text-gray-500">See you later!</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/signup">
              <Button className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-xl font-medium transition-all duration-300">
                Get Started
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-all duration-300 active:scale-95"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Enhanced Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[73px] bg-white shadow-lg border-t border-gray-100 z-50 animate-slide-down">
          <div className="max-h-[calc(100vh-73px)] overflow-y-auto">
            {/* User Profile Section for Mobile */}
            {user && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Profile'}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    <div className="flex items-center mt-1">
                      <Sparkles size={12} className="text-yellow-500 mr-1" />
                      <span className="text-xs text-gray-500">Premium Member</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="px-4 py-2">
              <div className="space-y-1">
                <Link
                  to="/"
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${
                    isActive('/') 
                      ? 'bg-blue-50 text-blue-700 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className={`p-2 rounded-lg ${isActive('/') ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Home size={18} className={isActive('/') ? 'text-blue-600' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Home</span>
                    <p className="text-xs text-gray-500">Discover new content</p>
                  </div>
                  {isActive('/') && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </Link>

                <Link
                  to="/explore"
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${
                    isActive('/explore') 
                      ? 'bg-blue-50 text-blue-700 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className={`p-2 rounded-lg ${isActive('/explore') ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <CompassIcon size={18} className={isActive('/explore') ? 'text-blue-600' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Explore</span>
                    <p className="text-xs text-gray-500">Browse all courses</p>
                  </div>
                  {isActive('/explore') && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </Link>

                <Link
                  to="/my-learning"
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${
                    isActive('/my-learning') 
                      ? 'bg-blue-50 text-blue-700 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className={`p-2 rounded-lg ${isActive('/my-learning') ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <BookOpen size={18} className={isActive('/my-learning') ? 'text-blue-600' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">My Learning</span>
                    <p className="text-xs text-gray-500">Track your progress</p>
                  </div>
                  {isActive('/my-learning') && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </Link>
              </div>

              {/* Account Section */}
              {user ? (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 px-3">Account</p>
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${
                        isActive('/profile') 
                          ? 'bg-blue-50 text-blue-700 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className={`p-2 rounded-lg ${isActive('/profile') ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <User size={18} className={isActive('/profile') ? 'text-blue-600' : 'text-gray-600'} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Profile & Settings</span>
                        <p className="text-xs text-gray-500">Manage your account</p>
                      </div>
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 hover:bg-red-100">
                        <LogOut size={18} className="text-gray-600 hover:text-red-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium">Sign Out</span>
                        <p className="text-xs text-gray-500">See you later!</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 pt-4 border-t border-gray-100 px-3 pb-4">
                  <div className="space-y-3">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full py-3 text-sm font-medium active:scale-95 transition-transform">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block">
                      <Button className="w-full py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-95 transition-all">
                        Get Started Free
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Join thousands of learners worldwide
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;