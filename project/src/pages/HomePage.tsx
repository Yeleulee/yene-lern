import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Trophy, Brain, Star, Users, ArrowRight, Play, CheckCircle, TrendingUp, Zap, Target, Award, Sparkles, BarChart3, Clock, MessageCircle } from 'lucide-react';
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
  const [animatedStats, setAnimatedStats] = useState({ learners: 0, courses: 0, answers: 0 });

  // Animated counter effect for stats
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        learners: 10000,
        courses: 120000,
        answers: 1200000
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
      {/* Clean Minimalist Hero Section - ORB AI Style */}
      <section className="relative bg-white min-h-screen flex items-center overflow-hidden -mt-20 pt-20">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          {/* Minimal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-blue-50/30" />
          
          {/* Subtle floating elements */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
          
          {/* Clean geometric shapes */}
          <div className="absolute top-20 right-20 w-2 h-2 bg-blue-300 rounded-full animate-float" />
          <div className="absolute bottom-32 left-16 w-1 h-1 bg-purple-300 rounded-full animate-float" style={{animationDelay: '1s'}} />
          <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-gray-300 rounded-full animate-float" style={{animationDelay: '3s'}} />
        </div>
        
                <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Clean Badge */}
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium mb-12 animate-fade-in">
              <Brain size={16} />
              AI AUTOMATION FOR LEARNERS
            </div>

            {/* Clean Brand Logo */}
            <div className="mb-8 animate-slide-up">
              <div className="relative inline-flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-500">
                  <div className="text-white text-2xl font-bold transform rotate-12">⧫</div>
                </div>
                <h1 className="text-6xl md:text-8xl font-bold text-gray-900 tracking-tight leading-none" style={{ fontFamily: 'Dancing Script, cursive' }}>
                  Yene Learn
                </h1>
              </div>
            </div>

            {/* Clean Subtitle */}
            <h2 className="text-xl md:text-2xl font-normal text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Custom AI learning solutions, built for the innovators of tomorrow
            </h2>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-10 animate-slide-up">
              <SearchBar 
                onSearch={handleSearch} 
                isLoading={isSearching}
                placeholder="Discover your next learning breakthrough..."
                className="shadow-2xl"
              />
            </div>
            
                        {/* Clean CTA Buttons */}
            <div className="animate-fade-in mb-16">
              {user ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/my-learning">
                    <Button className="group w-full sm:w-auto bg-black text-white hover:bg-gray-800 px-8 py-4 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl">
                      <ArrowRight size={18} className="mr-2 group-hover:translate-x-1 transition-transform" />
                      Continue Learning
                    </Button>
                  </Link>
                  <Link to="/explore">
                    <Button variant="outline" className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-base rounded-xl transition-all duration-300">
                      See Our Courses
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/signup">
                    <Button className="group w-full sm:w-auto bg-black text-white hover:bg-gray-800 px-8 py-4 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl">
                      <ArrowRight size={18} className="mr-2 group-hover:translate-x-1 transition-transform" />
                      Get Template
                    </Button>
                  </Link>
                  <Link to="/explore">
                    <Button variant="outline" className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-base rounded-xl transition-all duration-300">
                      See Our Services
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Minimal Quote */}
            <div className="text-center">
              <blockquote className="text-lg md:text-xl text-gray-600 italic max-w-3xl mx-auto leading-relaxed mb-8">
                "We harness your learning data, understand your educational needs, and use AI to help your knowledge grow beyond expectations. The best part? We execute, too."
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Founder of Yene Learn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sleek Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Trusted by learners worldwide
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our growing community of students achieving their learning goals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="bg-gray-50 rounded-3xl p-10 hover:bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users size={36} className="text-white" />
                </div>
                <div className="text-5xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Dancing Script, cursive' }}>
                  {animatedStats.learners > 0 ? `${(animatedStats.learners / 1000).toFixed(0)}k+` : '0'}
                </div>
                <div className="text-base font-medium text-gray-700">Active Learners</div>
                <div className="text-sm text-gray-500 mt-2">Growing daily</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gray-50 rounded-3xl p-10 hover:bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen size={36} className="text-white" />
                </div>
                <div className="text-5xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Dancing Script, cursive' }}>
                  {animatedStats.courses > 0 ? `${(animatedStats.courses / 1000).toFixed(0)}k+` : '0'}
                </div>
                <div className="text-base font-medium text-gray-700">Courses Saved</div>
                <div className="text-sm text-gray-500 mt-2">Knowledge preserved</div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gray-50 rounded-3xl p-10 hover:bg-white hover:shadow-lg transition-all duration-500 group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={36} className="text-white" />
                </div>
                <div className="text-5xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Dancing Script, cursive' }}>
                  {animatedStats.answers > 0 ? `${(animatedStats.answers / 1000000).toFixed(1)}M` : '0'}
                </div>
                <div className="text-base font-medium text-gray-700">AI Responses</div>
                <div className="text-sm text-gray-500 mt-2">Questions answered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sleek Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-white text-gray-600 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <Sparkles size={16} />
              FEATURES
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Everything you need to learn better
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover elegant features that streamline your learning workflow and accelerate your educational journey.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group">
              <div className="bg-white rounded-3xl p-10 h-full hover:shadow-lg transition-all duration-500 group-hover:scale-[1.02] border border-gray-100">
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-sm">
                      <Brain size={36} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Dancing Script, cursive' }}>AI-Powered Summaries</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Get instant, intelligent summaries of any educational content. Our AI adapts to your learning patterns and boosts comprehension.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Zap size={16} />
                        <span>Instant Processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target size={16} />
                        <span>99% Accuracy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="bg-white rounded-3xl p-10 h-full hover:shadow-lg transition-all duration-500 group-hover:scale-[1.02] border border-gray-100">
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-sm">
                      <BarChart3 size={36} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Dancing Script, cursive' }}>Progress Tracking</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Track your learning journey with elegant analytics that identify knowledge gaps and optimize your study schedule automatically.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Real-time Updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        <span>Smart Insights</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="bg-white rounded-3xl p-10 h-full hover:shadow-lg transition-all duration-500 group-hover:scale-[1.02] border border-gray-100">
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-sm">
                      <MessageCircle size={36} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Dancing Script, cursive' }}>Learning Assistant</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Get personalized guidance with advanced AI chat that answers questions, explains concepts, and provides contextual help.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Brain size={16} />
                        <span>Contextual Help</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award size={16} />
                        <span>Expert Knowledge</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group">
              <div className="bg-white rounded-3xl p-10 h-full hover:shadow-lg transition-all duration-500 group-hover:scale-[1.02] border border-gray-100">
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-sm">
                      <Trophy size={36} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Dancing Script, cursive' }}>Personalized Paths</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      Experience AI-driven recommendations and customized study plans that adapt to your pace and learning objectives.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Target size={16} />
                        <span>Custom Plans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} />
                        <span>Adaptive Learning</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link to="/explore">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <ArrowRight size={20} className="mr-2" />
                Explore All Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-full text-sm font-medium mb-8">
              <Zap size={16} />
              HOW IT WORKS
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Start learning in three simple steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience the future of learning with our streamlined process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="relative group">
              <div className="bg-gray-50 rounded-3xl p-10 text-center hover:bg-white hover:shadow-lg transition-all duration-500 transform group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Search size={32} className="text-white" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Dancing Script, cursive' }}>01</div>
                <h3 className="text-xl font-medium mb-4 text-gray-900">Find Videos</h3>
                <p className="text-gray-600 leading-relaxed">
                  Search for educational videos or paste YouTube URLs to get started
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                <div className="w-12 h-0.5 bg-gray-300 group-hover:bg-black transition-colors duration-300"></div>
                <ArrowRight size={20} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors duration-300" />
              </div>
            </div>

            <div className="relative group">
              <div className="bg-gray-50 rounded-3xl p-10 text-center hover:bg-white hover:shadow-lg transition-all duration-500 transform group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Play size={32} className="text-white" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Dancing Script, cursive' }}>02</div>
                <h3 className="text-xl font-medium mb-4 text-gray-900">Learn with AI</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get intelligent summaries and ask questions while watching
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                <div className="w-12 h-0.5 bg-gray-300 group-hover:bg-black transition-colors duration-300"></div>
                <ArrowRight size={20} className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors duration-300" />
              </div>
            </div>

            <div className="relative group">
              <div className="bg-gray-50 rounded-3xl p-10 text-center hover:bg-white hover:shadow-lg transition-all duration-500 transform group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Dancing Script, cursive' }}>03</div>
                <h3 className="text-xl font-medium mb-4 text-gray-900">Track Progress</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor your learning journey and celebrate achievements
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-white text-gray-600 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <Users size={16} />
              TESTIMONIALS
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Loved by learners worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See what our community says about their learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-3xl p-8 hover:shadow-lg transition-all duration-500 transform group-hover:scale-105 border border-gray-100 hover:border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover mr-4 group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <Star size={12} className="text-white fill-current" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-lg">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="text-yellow-400 fill-current mr-1 group-hover:scale-110 transition-transform duration-200"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-500 font-medium">5.0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Pricing Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-full text-sm font-medium mb-8">
              <Trophy size={16} />
              PRICING
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Simple pricing for all learners
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Flexible pricing plans that fit your learning budget and scale with your educational needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="group">
              <div className="bg-gray-50 rounded-3xl p-10 hover:bg-white hover:shadow-lg transition-all duration-500 transform group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-medium mb-4 text-gray-900">Starter</h3>
                  <div className="text-5xl font-light mb-4" style={{ fontFamily: 'Dancing Script, cursive' }}>Free</div>
                  <p className="text-gray-600">Perfect for getting started with AI-powered learning</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">5 AI summaries per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Basic progress tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Community support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Mobile app access</span>
                  </li>
                </ul>
                
                <Link to="/signup" className="block">
                  <Button variant="outline" className="w-full py-4 group-hover:bg-black group-hover:text-white transition-all duration-300">Get Started</Button>
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="group relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                  Most Popular
                </div>
              </div>
              
              <div className="bg-black text-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 transform group-hover:scale-105">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-medium mb-4">Pro</h3>
                  <div className="text-5xl font-light mb-4" style={{ fontFamily: 'Dancing Script, cursive' }}>$19</div>
                  <p className="text-gray-300">Built for serious learners who want advanced AI features</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                    <span>Unlimited AI summaries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                    <span>Advanced analytics & insights</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                    <span>AI learning assistant</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                    <span>Custom learning paths</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                    <span>Priority support</span>
                  </li>
                </ul>
                
                <Link to="/signup" className="block">
                  <Button className="w-full py-4 bg-white text-black hover:bg-gray-100 transition-all duration-300">Get Started</Button>
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="group">
              <div className="bg-gray-50 rounded-3xl p-10 hover:bg-white hover:shadow-lg transition-all duration-500 transform group-hover:scale-105 border border-transparent hover:border-gray-200">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-medium mb-4 text-gray-900">Enterprise</h3>
                  <div className="text-5xl font-light mb-4" style={{ fontFamily: 'Dancing Script, cursive' }}>$99</div>
                  <p className="text-gray-600">For teams and organizations needing advanced features</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Team collaboration tools</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Advanced reporting</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Custom integrations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                    <span className="text-gray-700">Dedicated support manager</span>
                  </li>
                </ul>
                
                <Link to="/contact" className="block">
                  <Button variant="outline" className="w-full py-4 group-hover:bg-black group-hover:text-white transition-all duration-300">Contact Sales</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-gray-600 text-base">
              💝 We donate 2% of your membership to educational charities worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Sleek CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white text-gray-600 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <ArrowRight size={16} />
              GET STARTED
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Dancing Script, cursive' }}>
              Ready to transform your learning?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of learners who are already using Yene Learn to accelerate their educational journey with AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/signup">
                <Button className="group w-full sm:w-auto bg-black text-white hover:bg-gray-800 px-10 py-5 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl">
                  <ArrowRight size={20} className="mr-3 group-hover:translate-x-1 transition-transform" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" className="w-full sm:w-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-10 py-5 text-lg rounded-xl transition-all duration-300">
                  Explore Courses
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Search Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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