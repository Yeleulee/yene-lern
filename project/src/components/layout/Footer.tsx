import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, MapPin, Phone, Twitter, Github, Linkedin, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">YENE LEARN</h3>
                <p className="text-gray-300 text-sm">AI-Powered Learning</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Next-generation AI learning solutions, built for the innovators of tomorrow. Transform your educational journey with intelligent automation.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
              >
                <Github size={18} />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Features</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/explore" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  AI Video Summaries
                </Link>
              </li>
              <li>
                <Link to="/my-learning" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Progress Tracking
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Smart Recommendations
                </Link>
              </li>
              <li>
                <Link to="/my-learning" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Learning Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                  <ArrowRight size={14} className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Get in Touch</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail size={16} className="text-gray-400" />
                <span>hello@yenelearn.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone size={16} className="text-gray-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start space-x-3 text-gray-300">
                <MapPin size={16} className="text-gray-400 mt-1" />
                <span>San Francisco, CA<br />United States</span>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-gray-300 text-sm mb-3">Subscribe to our newsletter</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-l-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-700 rounded-r-xl hover:from-black hover:to-gray-800 transition-all duration-300">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
            <div className="text-sm text-gray-300">
              <p>© {currentYear} YENE LEARN. All rights reserved. Designed with ❤️ for learners worldwide.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
