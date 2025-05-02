import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Trophy, Brain, Star, Users, ArrowRight, Play, CheckCircle } from 'lucide-react';
import SearchBar from '../components/search/SearchBar';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import { searchVideos } from '../services/youtubeService';
import VideoCard from '../components/video/VideoCard';
import { Video } from '../types';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { userVideos, addVideo } = useLearning();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Video[]>([]);

  const handleSearch = async (query: string) => {
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

  const isVideoSaved = (videoId: string) => {
    return userVideos.some((v) => v.id === videoId);
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Developer",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      text: "Yene Learn helped me master React in half the time. The AI summaries are incredibly helpful!"
    },
    {
      name: "James Wilson",
      role: "Data Scientist",
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
      text: "The personalized learning paths and progress tracking features are game-changing."
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer",
      image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
      text: "I love how the AI assistant helps me understand complex concepts quickly and effectively."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              Learn Faster with YouTube <span className="text-yellow-300">+</span> AI
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 animate-fade-in">
              Transform your learning experience with AI-powered video summaries,
              smart progress tracking, and personalized learning paths.
            </p>
            
            <div className="max-w-3xl mx-auto mb-8 animate-slide-up">
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />
            </div>
            
            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/dashboard">
                  <Button className="w-full sm:w-auto bg-white text-primary-700 hover:bg-blue-50">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" className="w-full sm:w-auto bg-white/20 border-white/40 text-white hover:bg-white/30">
                    Explore Content
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup">
                  <Button className="w-full sm:w-auto bg-white text-primary-700 hover:bg-blue-50">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="w-full sm:w-auto bg-white/20 border-white/40 text-white hover:bg-white/30">
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Supercharge Your Learning
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform helps you learn more effectively by understanding
              and retaining information from educational videos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Powered Summaries</h3>
              <p className="text-gray-600">
                Get instant, intelligent summaries of any educational video to grasp key concepts quickly.
              </p>
            </div>
            
            <div className="card text-center p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={32} className="text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed progress tracking and insights.
              </p>
            </div>
            
            <div className="card text-center p-8 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain size={32} className="text-accent-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Recommendations</h3>
              <p className="text-gray-600">
                Get personalized suggestions for what to learn next based on your interests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start learning more effectively in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-primary-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Find Videos</h3>
                <p className="text-gray-600">
                  Search for educational videos or paste YouTube URLs
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2">
                <ArrowRight size={24} className="text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play size={24} className="text-secondary-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Learn with AI</h3>
                <p className="text-gray-600">
                  Get AI summaries and ask questions while watching
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2">
                <ArrowRight size={24} className="text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-accent-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Track Progress</h3>
                <p className="text-gray-600">
                  Monitor your learning journey and achievements
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Learners
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of students who are learning faster and better
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">{testimonial.text}</p>
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Learn Faster?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already using Yene Learn to
            accelerate their learning journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button className="w-full sm:w-auto bg-white text-primary-700 hover:bg-blue-50">
                Get Started Free
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" className="w-full sm:w-auto bg-white/20 border-white/40 text-white hover:bg-white/30">
                Explore Content
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Search Results</h2>
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

            <div className="mt-8 text-center">
              <Link to="/explore">
                <Button variant="outline">
                  <Search size={18} className="mr-2" />
                  Explore More Videos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;