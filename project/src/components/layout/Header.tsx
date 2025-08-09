import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, User, LogOut, BookOpen, Home, CompassIcon, GraduationCap, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { getCourseSectionByVideoId } from '../../data/mockCourseData';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInCoursePlayer, setIsInCoursePlayer] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Track scroll position to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold shadow-md">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
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

  // Regular header for other pages
  return (
    <header className={`sticky top-0 z-20 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white shadow-md py-2' 
        : 'bg-blue-600 py-3 text-white'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform`}>
            <span className="text-white font-bold text-lg">Y</span>
          </div>
          <h1 className={`text-xl font-bold tracking-tight ${
            isScrolled 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' 
              : 'text-white'
          }`}>
            Yene <span className="font-normal">Learn</span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-full flex items-center space-x-1 transition-colors ${
              isActive('/') 
                ? (isScrolled ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white') 
                : (isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10')
            }`}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link 
            to="/explore" 
            className={`px-4 py-2 rounded-full flex items-center space-x-1 transition-colors ${
              isActive('/explore') 
                ? (isScrolled ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white') 
                : (isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10')
            }`}
          >
            <CompassIcon size={18} />
            <span>Explore</span>
          </Link>
          <Link 
            to="/my-learning" 
            className={`px-4 py-2 rounded-full flex items-center space-x-1 transition-colors ${
              isActive('/my-learning') 
                ? (isScrolled ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white') 
                : (isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10')
            }`}
          >
            <BookOpen size={18} />
            <span>My Learning</span>
          </Link>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Notification icon */}
          <button className={`p-2 rounded-full ${
            isScrolled ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
          }`}>
            <Bell size={20} />
          </button>
          
          {user ? (
            <div className="flex items-center">
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1.5 rounded-full border-2 border-transparent hover:border-gray-200 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className={isScrolled ? 'text-gray-800' : 'text-white'}>
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 hidden group-hover:block border border-gray-100">
                  <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                    <User size={16} className="mr-2" />
                    Profile
                  </Link>
                  <Link to="/my-learning" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                    <GraduationCap size={16} className="mr-2" />
                    My Courses
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button 
                  variant={isScrolled ? "outline" : "ghost"} 
                  className={!isScrolled ? "border-white/30 text-white hover:bg-white/10" : ""}
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  className={!isScrolled ? "bg-white text-blue-600 hover:bg-blue-50" : ""}
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden p-2 rounded-lg ${
            isScrolled ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'
          } transition-colors`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-fade-in border-t border-gray-100 bg-white text-gray-800">
          <div className="container mx-auto px-4 py-3 flex flex-col">
            <Link
              to="/"
              className="py-3 flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home size={18} className="text-blue-600" />
              <span>Home</span>
            </Link>
            <Link
              to="/explore"
              className="py-3 flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <CompassIcon size={18} className="text-blue-600" />
              <span>Explore</span>
            </Link>
            <Link
              to="/my-learning"
              className="py-3 flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <BookOpen size={18} className="text-blue-600" />
              <span>My Learning</span>
            </Link>
            
            <div className="border-t border-gray-100 my-2 pt-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="py-3 flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} className="text-blue-600" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="py-3 flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 w-full text-left"
                  >
                    <LogOut size={18} className="text-blue-600" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
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