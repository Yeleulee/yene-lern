import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Trophy, Brain, Star, Users, ArrowRight, Play, CheckCircle, TrendingUp, Zap, Target, Award, Sparkles, BarChart3, Clock, MessageCircle, LayoutDashboard, Globe, Shield } from 'lucide-react';
import SearchBar from '../components/search/SearchBar';
import Button from '../components/ui/Button';
import CursorRevealHero from '../components/ui/CursorRevealHero';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import { searchVideos } from '../services/youtubeService';
import VideoCard from '../components/video/VideoCard';
import { Video } from '../types';
import heroImg from '../assets/herosection.jpg';

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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Hero Section with Cursor Reveal Effect - Kept as requested but maximized */}
      <section className="relative w-full bg-white">
        <CursorRevealHero
          imageSrc={heroImg}
          altText="Learning Background"
          className="w-full h-auto shadow-none" // Removed constraints for full impact
        />
        {/* Absolute Title Overlay - reintroduced minimally for 'Tokko' punchiness if desired, but user asked to remove text previously. 
            Tokko usually has text. User asked to 'remove hero section texts' in previous turn. 
            I will respect the removal but add a massive headline BELOW the image. */}
      </section>

      {/* Massive Headline Section - Tokko Style */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-12 animate-fade-in">
            MASTER <br />
            <span className="text-gray-400">YOUR CRAFT.</span>
          </h1>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-t border-gray-200 pt-8">
            <p className="text-xl md:text-2xl font-medium max-w-xl leading-tight">
              AI-powered learning that adapts to your unique pace and style. Experience the future of education.
            </p>
            <Link to="/explore">
              <Button className="rounded-full px-8 py-6 text-lg bg-black text-white hover:bg-gray-800 transition-all hover:scale-105">
                Start Learning <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grid Stats Section - Tokko Style */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-16 flex items-end justify-between">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">IMPACT BY NUMBERS</h2>
            <div className="hidden md:block text-sm font-mono text-gray-500">LIVE DATA 2024</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
            {/* Big Card 1: Learners */}
            <div className="md:col-span-5 bg-white rounded-[2rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 group border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={120} />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-mono text-sm uppercase text-gray-500">Active Learners</span>
              </div>
              <div>
                <div className="text-7xl md:text-8xl font-bold tracking-tighter mb-2">
                  {animatedStats.learners > 0 ? `${(animatedStats.learners / 1000).toFixed(0)}k` : '0'}
                </div>
                <p className="text-gray-600 font-medium">Students currently mastering new skills on our platform.</p>
              </div>
            </div>

            {/* Right Column Grid */}
            <div className="md:col-span-7 grid grid-rows-2 gap-6">
              {/* Top Row: 2 Cards */}
              <div className="grid grid-cols-2 gap-6 h-full">
                <div className="bg-black text-white rounded-[2rem] p-8 flex flex-col justify-center items-center text-center shadow-lg hover:scale-[1.02] transition-transform">
                  <BookOpen size={48} className="mb-4 text-gray-400" />
                  <div className="text-4xl font-bold mb-1">
                    {animatedStats.courses > 0 ? `${(animatedStats.courses / 1000).toFixed(0)}k+` : '0'}
                  </div>
                  <div className="text-sm text-gray-400 font-mono uppercase">Courses</div>
                </div>
                <div className="bg-blue-600 text-white rounded-[2rem] p-8 flex flex-col justify-center items-center text-center shadow-lg hover:scale-[1.02] transition-transform">
                  <MessageCircle size={48} className="mb-4 text-blue-200" />
                  <div className="text-4xl font-bold mb-1">
                    {animatedStats.answers > 0 ? `${(animatedStats.answers / 1000000).toFixed(1)}M` : '0'}
                  </div>
                  <div className="text-sm text-blue-200 font-mono uppercase">AI Chats</div>
                </div>
              </div>

              {/* Bottom Row: Wide Card */}
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="relative z-10 max-w-md">
                  <div className="flex items-center gap-2 mb-2 font-mono text-sm text-gray-500 uppercase">
                    <Globe size={14} /> Global Reach
                  </div>
                  <h3 className="text-3xl font-bold mb-2 group-hover:text-blue-600 transition-colors">Learning has no borders.</h3>
                  <p className="text-gray-600">Join a community spanning 150+ countries.</p>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 translate-x-1/4">
                  <Globe size={300} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Mode Feature Section - High Contrast */}
      <section className="py-32 bg-black text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-block px-4 py-1 rounded-full border border-gray-800 bg-gray-900 text-sm font-mono mb-8">
                v2.0 AI ENGINE
              </div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-8">
                INTELLIGENCE <br />
                <span className="text-gray-600">REDEFINED.</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-12 max-w-lg">
                We don't just recommend courses. We build them for you, in real-time, based on your gaps and goals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { title: "Adaptive Path", desc: "Curriculum that evolves with you." },
                  { title: "Real-time Fixes", desc: "Instant feedback on your code." },
                  { title: "Visual Analytics", desc: "See your brain grow, literally." },
                  { title: "Smart Context", desc: "AI that remembers your history." }
                ].map((item, idx) => (
                  <div key={idx} className="border-l border-gray-800 pl-6">
                    <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stylized UI Mockup */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-gray-900 rounded-[2rem] border border-gray-800 p-6 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                {/* Browser Header */}
                <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-black rounded-md text-xs font-mono text-gray-500 flex-1 text-center">
                    yene-learn.ai/sim
                  </div>
                </div>

                {/* Chat Interface Simulation */}
                <div className="space-y-6 flex-1 font-mono text-sm overflow-hidden">
                  <div className="flex gap-4 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0"></div>
                    <div className="bg-gray-800 rounded-lg p-3 w-3/4 h-12"></div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      AI
                    </div>
                    <div className="space-y-2 w-full">
                      <div className="bg-gray-800/50 rounded-lg p-4 text-gray-300 border border-gray-700">
                        <p className="mb-2">I noticed you struggled with <strong>React Hooks</strong>.</p>
                        <p>Here's a custom exercise to fix that:</p>
                      </div>
                      <div className="bg-black rounded-lg p-4 border border-gray-800 text-green-400 font-mono text-xs">
                        <code>
                          const CustomComponent = () =&gt; &#123;<br />
                          &nbsp;&nbsp;const [state, setState] = useState(0);<br />
                          &nbsp;&nbsp;// Try implementing useEffect here<br />
                          &#125;
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end mt-4">
                    <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
                      This helps a lot! Why specifically useEffect?
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex-shrink-0"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid - Clean & Minimal */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold mb-16 text-center tracking-tight">COMMUNITY VOICES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-[1.5rem] hover:bg-black hover:text-white transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-4 mb-6">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400 uppercase tracking-wider">{t.role}</div>
                  </div>
                </div>
                <p className="text-lg leading-relaxed font-medium">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA - Tokko Style */}
      <section className="py-32 bg-gray-50 border-t border-gray-200 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-6xl md:text-9xl font-bold tracking-tighter text-gray-200 mb-8 select-none">
            YENE LEARN
          </h2>
          <div className="relative -mt-12 md:-mt-20 z-10">
            <h3 className="text-3xl md:text-5xl font-bold mb-8">Ready to start?</h3>
            <Link to="/signup">
              <Button className="rounded-full px-12 py-6 text-xl bg-black text-white hover:bg-blue-600 transition-colors shadow-2xl hover:scale-105">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
