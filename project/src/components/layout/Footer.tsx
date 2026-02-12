import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Phone,
  Twitter,
  Github,
  Linkedin,
  ArrowRight,
  Instagram,
  Youtube,
  Send,
  Heart
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black text-white overflow-hidden font-sans">
      {/* Decorative Background Elements - Simulating a moderngenerated image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-900 via-black to-black opacity-90"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-48 bg-gradient-to-t from-blue-900/10 to-transparent"></div>

        {/* Abstract Grid Mesh Overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-10">

        {/* Top Section: CTA & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16 border-b border-white/10 pb-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Transform your learning today.
            </h2>
            <p className="text-gray-400 text-lg max-w-md">
              Join our community of lifelong learners and get exclusive AI-powered insights delivered to your inbox.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg p-2 rounded-2xl border border-white/10 flex items-center shadow-2xl max-w-lg w-full ml-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="bg-transparent border-none text-white placeholder-gray-500 flex-1 px-4 py-3 focus:outline-none focus:ring-0"
            />
            <button className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 group">
              Subscribe
              <Send size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center space-x-3 mb-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <img src={logoImg} alt="Yene Learn" className="w-12 h-12 object-contain relative z-10" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-white block">YENE LEARN</span>
                <span className="text-xs text-blue-400 font-medium tracking-widest uppercase">AI Intelligence</span>
              </div>
            </Link>
            <p className="text-gray-400 mb-8 leading-relaxed max-w-sm">
              We're building the future of education with artificial intelligence.
              Our mission is to make personalized, adaptive learning accessible to everyone, everywhere.
            </p>
            <div className="flex space-x-4">
              {[Twitter, Github, Linkedin, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-110"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2 md:col-span-4">
            <h4 className="text-white font-semibold mb-6 text-lg">Platform</h4>
            <ul className="space-y-4">
              {['Browse Courses', 'AI Assistant', 'Progress Tracking', 'Live Workshops', 'Certification'].map((item) => (
                <li key={item}>
                  <Link to="/explore" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-all"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 md:col-span-4">
            <h4 className="text-white font-semibold mb-6 text-lg">Company</h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Blog', 'Press', 'Partners'].map((item) => (
                <li key={item}>
                  <Link to="/about" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-all"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 md:col-span-4">
            <h4 className="text-white font-semibold mb-6 text-lg">Support</h4>
            <ul className="space-y-4">
              {['Help Center', 'Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Contact Us'].map((item) => (
                <li key={item}>
                  <Link to="/contact" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-all"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 md:col-span-4">
            <h4 className="text-white font-semibold mb-6 text-lg">Contact</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <span>123 Innovation Dr,<br />Tech City, TC 90210</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail size={18} className="text-blue-500 shrink-0" />
                <span>hello@yenelearn.com</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone size={18} className="text-blue-500 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {currentYear} Yene Learn Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> by Yene Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
