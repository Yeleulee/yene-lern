import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { getCourseSectionByVideoId } from '../../data/mockCourseData';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInCoursePlayer, setIsInCoursePlayer] = useState(false);
  const location = useLocation();

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

  // Special header for course player to match the image
  if (isInCoursePlayer) {
    return (
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Navigation buttons and logo for course player */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
            </Link>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
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
    <header className="sticky top-0 z-10 bg-white shadow-md transition-all duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Y</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Yene <span className="font-normal">Learn</span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-primary-600 transition-colors">
            Home
          </Link>
          <Link to="/explore" className="text-gray-700 hover:text-primary-600 transition-colors">
            Explore
          </Link>
          <Link to="/my-learning" className="text-gray-700 hover:text-primary-600 transition-colors">
            My Learning
          </Link>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600">
                <User size={20} />
                <span>{user.displayName || user.email}</span>
              </Link>
              <Button variant="outline" onClick={() => logout()} className="flex items-center space-x-1">
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-fade-in border-t border-gray-100">
          <div className="container mx-auto px-4 py-3 flex flex-col">
            <Link
              to="/"
              className="py-2 text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/explore"
              className="py-2 text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              to="/my-learning"
              className="py-2 text-gray-700 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              My Learning
            </Link>
            
            <div className="border-t border-gray-100 my-2 pt-2">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="py-2 text-gray-700 hover:text-primary-600 transition-colors flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} className="mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="py-2 text-gray-700 hover:text-primary-600 transition-colors w-full text-left flex items-center"
                  >
                    <LogOut size={18} className="mr-2" />
                    Logout
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