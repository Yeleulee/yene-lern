import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, BookOpen, Home, CompassIcon, ChevronDown, X, Sparkles, MessageCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { getCourseSectionByVideoId } from '../../data/mockCourseData';
import logoImg from '../../assets/logo.png';

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
              <img src={logoImg} alt="Yene Learn" className="w-9 h-9 object-contain transform hover:scale-105 transition-transform" />
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
    <header className={`sticky top-0 z-20 border-b transition-all duration-500 ease-in-out ${isScrolled
      ? 'bg-white/70 backdrop-blur-xl border-white/20 shadow-sm py-2'
      : 'bg-white/90 backdrop-blur-lg border-white/10 py-4'
      }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Clean Logo */}
        <Link to="/" className="flex items-center space-x-3 group text-decoration-none">
          <img src={logoImg} alt="Yene Learn" className="w-12 h-12 object-contain transform group-hover:scale-110 transition-all duration-300 drop-shadow-sm" />
        </Link>

        {/* Clean Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {user && (
            <Link
              to="/dashboard"
              className="relative group text-gray-700 hover:text-black transition-all duration-200 font-medium hover:-translate-y-0.5"
            >
              Dashboard
              <span className={`pointer-events-none absolute -bottom-1 left-0 h-0.5 w-full origin-left bg-black transition-transform duration-300 ${isActive('/dashboard') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100`} />
            </Link>
          )}

          {user && (
            <>
              <Link
                to="/explore"
                className="relative group text-gray-700 hover:text-black transition-all duration-200 font-medium hover:-translate-y-0.5"
              >
                Explore
                <span className={`pointer-events-none absolute -bottom-1 left-0 h-0.5 w-full origin-left bg-black transition-transform duration-300 ${isActive('/explore') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100`} />
              </Link>
              <Link
                to="/my-learning"
                className="relative group text-gray-700 hover:text-black transition-all duration-200 font-medium hover:-translate-y-0.5"
              >
                My Learning
                <span className={`pointer-events-none absolute -bottom-1 left-0 h-0.5 w-full origin-left bg-black transition-transform duration-300 ${isActive('/my-learning') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100`} />
              </Link>
              <Link
                to="/ai-chat"
                className="relative group text-gray-700 hover:text-black transition-all duration-200 font-medium hover:-translate-y-0.5"
              >
                AI Chat
                <span className={`pointer-events-none absolute -bottom-1 left-0 h-0.5 w-full origin-left bg-black transition-transform duration-300 ${isActive('/ai-chat') ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100`} />
              </Link>
            </>
          )}
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
                <div className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/30 py-2 z-50 animate-slide-down">
                  <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50">
                    <div className="flex items-center space-x-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Profile'}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-bold">
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
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/50 transition-all duration-200 active:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="p-1.5 rounded-lg bg-gray-100/50 mr-3">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Profile & Settings</p>
                        <p className="text-xs text-gray-500">Manage your account</p>
                      </div>
                    </Link>

                    <Link
                      to="/my-learning"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/50 transition-all duration-200 active:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="p-1.5 rounded-lg bg-gray-100/50 mr-3">
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
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 transition-all duration-200 active:bg-red-100"
                    >
                      <div className="p-1.5 rounded-lg bg-red-100/50 mr-3">
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
              <Button className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg">
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
          className="md:hidden fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-200 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Enhanced Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[73px] bottom-0 bg-white/95 backdrop-blur-xl shadow-lg border-t border-white/20 z-50 animate-slide-down flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {/* User Profile Section for Mobile */}
            {user && (
              <div className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Profile'}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-bold shadow-md">
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
                {user && (
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${isActive('/dashboard')
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className={`p-2 rounded-lg ${isActive('/dashboard') ? 'bg-gray-200' : 'bg-gray-100'}`}>
                      <LayoutDashboard size={18} className={isActive('/dashboard') ? 'text-gray-900' : 'text-gray-600'} />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">Dashboard</span>
                      <p className="text-xs text-gray-500">Your learning overview</p>
                    </div>
                    {isActive('/dashboard') && <div className="w-2 h-2 bg-gray-900 rounded-full"></div>}
                  </Link>
                )}

                {user && (
                  <>
                    <Link
                      to="/explore"
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${isActive('/explore')
                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className={`p-2 rounded-lg ${isActive('/explore') ? 'bg-gray-200' : 'bg-gray-100'}`}>
                        <CompassIcon size={18} className={isActive('/explore') ? 'text-gray-900' : 'text-gray-600'} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Explore</span>
                        <p className="text-xs text-gray-500">Browse all courses</p>
                      </div>
                      {isActive('/explore') && <div className="w-2 h-2 bg-gray-900 rounded-full"></div>}
                    </Link>

                    <Link
                      to="/my-learning"
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${isActive('/my-learning')
                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className={`p-2 rounded-lg ${isActive('/my-learning') ? 'bg-gray-200' : 'bg-gray-100'}`}>
                        <BookOpen size={18} className={isActive('/my-learning') ? 'text-gray-900' : 'text-gray-600'} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">My Learning</span>
                        <p className="text-xs text-gray-500">Track your progress</p>
                      </div>
                      {isActive('/my-learning') && <div className="w-2 h-2 bg-gray-900 rounded-full"></div>}
                    </Link>

                    <Link
                      to="/ai-chat"
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 ${isActive('/ai-chat')
                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className={`p-2 rounded-lg ${isActive('/ai-chat') ? 'bg-gray-200' : 'bg-gray-100'}`}>
                        <MessageCircle size={18} className={isActive('/ai-chat') ? 'text-gray-900' : 'text-gray-600'} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">AI Chat</span>
                        <p className="text-xs text-gray-500">Ask anything</p>
                      </div>
                      {isActive('/ai-chat') && <div className="w-2 h-2 bg-gray-900 rounded-full"></div>}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Section */}
          <div className="p-4 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100">
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 text-gray-700 hover:bg-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="p-2 rounded-lg bg-white border border-gray-100">
                    <User size={18} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Profile & Settings</span>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 active:scale-95 text-white bg-red-600 shadow-md w-full"
                >
                  <div className="p-2 rounded-lg bg-red-700">
                    <LogOut size={18} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-medium">Sign Out</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block">
                  <Button variant="outline" className="w-full py-3 text-sm font-medium active:scale-95 transition-transform bg-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block">
                  <Button className="w-full py-3 text-sm font-medium bg-black text-white hover:bg-gray-800 active:scale-95 transition-all">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
