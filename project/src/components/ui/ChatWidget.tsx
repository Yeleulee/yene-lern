import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Trash2, BookOpen, Save, CheckCheck } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useLocation, Link } from 'react-router-dom';
import { getSavedLearningPlanIds, saveLearningPlanId } from '../../services/learningPlanService';
import logoImg from '../../assets/logo.png';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const [savedPlans, setSavedPlans] = useState<Set<string>>(new Set());

  // Get current video ID if on a video page
  const currentVideoId = location.pathname.startsWith('/video/')
    ? location.pathname.split('/').pop()
    : undefined;

  // Scroll to bottom of messages when new message is added or chat is opened
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load saved plans from localStorage
  useEffect(() => {
    const savedPlanIds = getSavedLearningPlanIds();
    setSavedPlans(new Set(savedPlanIds));
  }, []);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input, currentVideoId);
    setInput('');
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearChat();
    }
  };

  // Function to save a learning plan
  const saveLearningPlan = (messageId: string) => {
    saveLearningPlanId(messageId);
    const newSavedPlans = new Set(savedPlans);
    newSavedPlans.add(messageId);
    setSavedPlans(newSavedPlans);
  };

  return (
    <div className="fixed bottom-5 right-5 z-20">
      {/* Chat button — owl logo instead of generic icon */}
      <button
        onClick={handleToggleChat}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 hover:bg-black text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <img src={logoImg} alt="Chat" className="w-9 h-9 object-contain" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[28rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="Yene Learn" className="w-7 h-7 object-contain" />
              <div>
                <h3 className="font-semibold text-sm">Yene Learn Assistant</h3>
                <p className="text-[10px] text-gray-400">Always here to help you learn</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/ai-chat"
                className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white text-[10px] font-medium"
                title="Open full chat"
                onClick={() => setIsOpen(false)}
              >
                Full Chat
              </Link>
              <button onClick={handleClearChat} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors" title="Clear chat history">
                <Trash2 size={14} />
              </button>
              <button onClick={handleToggleChat} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors" title="Close chat">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Context indicator */}
          {currentVideoId && (
            <div className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs border-b border-gray-100">
              <span className="font-medium">✓ Video context active</span> — Ask about this video
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
              >
                {message.sender === 'ai' && message.context === 'learning-plan' ? (
                  <div className="inline-block max-w-[95%] p-4 bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <BookOpen size={14} className="text-gray-700 mr-2" />
                        <span className="font-semibold text-gray-900 text-xs">Your Learning Plan</span>
                      </div>
                      {savedPlans.has(message.id) ? (
                        <span className="text-green-600 flex items-center text-xs">
                          <CheckCheck size={12} className="mr-1" />
                          Saved
                        </span>
                      ) : (
                        <button
                          onClick={() => saveLearningPlan(message.id)}
                          className="text-gray-600 hover:text-gray-900 text-xs flex items-center"
                        >
                          <Save size={12} className="mr-1" />
                          Save
                        </button>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-line leading-relaxed">
                      {message.content.split(/\d+\./).map((section, i) => {
                        if (i === 0) return null;
                        const titleMatch = section.match(/([^\n]+)/);
                        const title = titleMatch ? titleMatch[0].trim() : '';
                        const content = titleMatch ? section.replace(titleMatch[0], '').trim() : section.trim();
                        return (
                          <div key={i} className="mb-2">
                            <div className="font-semibold text-gray-800 mb-0.5">{i}. {title}</div>
                            <div className="pl-4 text-gray-600">{content}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    {message.sender === 'ai' && (
                      <img src={logoImg} alt="AI" className="w-6 h-6 object-contain flex-shrink-0 mb-4" />
                    )}
                    <div>
                      <div
                        className={`inline-block max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${message.sender === 'user'
                          ? 'bg-gray-900 text-white rounded-br-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                          }`}
                      >
                        {message.content}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center">
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-3 flex items-end gap-2">
                <img src={logoImg} alt="AI" className="w-6 h-6 object-contain animate-pulse" />
                <div className="inline-block px-4 py-2.5 rounded-2xl bg-white text-gray-600 border border-gray-200 rounded-bl-md shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Network status warning */}
          {!navigator.onLine && (
            <div className="px-3 py-2 bg-gray-100 text-gray-600 text-xs border-t border-gray-200 flex items-center">
              <span>You're offline. Messages won't be sent until you reconnect.</span>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none text-sm bg-gray-50"
                placeholder={currentVideoId
                  ? "Ask about this video..."
                  : "Ask anything..."}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!navigator.onLine}
              />
              <button
                className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || !navigator.onLine}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget; 