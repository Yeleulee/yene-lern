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
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-medium text-sm">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-700 font-medium">
                    {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </button>
                
                {/* Modern Dropdown menu */}
                <div className="absolute right-0 mt-3 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl py-2 z-10 hidden group-hover:block border border-gray-100">
                  <Link to="/profile" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors rounded-lg mx-2">
                    <User size={16} className="mr-3" />
                    Profile Settings
                  </Link>
                  <Link to="/my-learning" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors rounded-lg mx-2">
                    <GraduationCap size={16} className="mr-3" />
                    My Learning
                  </Link>
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center transition-colors rounded-lg mx-2"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
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