import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Loader, Trash, Wifi, WifiOff, BookOpen, Save, CheckCheck } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useLocation } from 'react-router-dom';
import ConnectionStatus from './ConnectionStatus';
import { getSavedLearningPlanIds, saveLearningPlanId } from '../../services/learningPlanService';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const { messages, isLoading, connectionStatus, sendMessage, clearChat, checkConnection } = useChat();
  
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
  
  // Toggle connection status display
  const toggleConnectionStatus = () => {
    setShowConnectionStatus(!showConnectionStatus);
  };
  
  // Retry sending message if it fails
  const handleRetry = async (failedMessage: string) => {
    if (isLoading) return;
    await sendMessage(failedMessage, currentVideoId);
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
      {/* Chat button */}
      <button
        onClick={handleToggleChat}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
        aria-label="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[28rem] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-blue-600 text-white">
            <h3 className="font-medium">Yene Learn AI Assistant</h3>
            <div className="flex items-center">
              <button 
                onClick={toggleConnectionStatus} 
                className="p-1 mx-1 rounded hover:bg-blue-700" 
                title="Check API connection"
              >
                {connectionStatus === 'connected' ? 
                  <Wifi size={16} /> : 
                  connectionStatus === 'checking' ? 
                  <Loader size={16} className="animate-spin" /> : 
                  <WifiOff size={16} />}
              </button>
              <button onClick={handleClearChat} className="p-1 mx-1 rounded hover:bg-blue-700" title="Clear chat history">
                <Trash size={16} />
              </button>
              <button onClick={handleToggleChat} className="p-1 rounded hover:bg-blue-700" title="Close chat">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Connection status */}
          {showConnectionStatus && (
            <div className="px-3 py-2 border-b border-gray-200">
              <ConnectionStatus />
            </div>
          )}

          {/* Context indicator */}
          {currentVideoId && (
            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs border-b border-blue-100">
              <span className="font-medium">✓ Video context active:</span> The assistant can help with questions about this video
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {message.sender === 'ai' && message.context === 'learning-plan' ? (
                  <div className="inline-block max-w-[95%] p-4 bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-800 border border-blue-200 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <BookOpen size={16} className="text-blue-600 mr-2" />
                        <span className="font-medium text-blue-800">Your Personalized Learning Plan</span>
                      </div>
                      {savedPlans.has(message.id) ? (
                        <span className="text-green-600 flex items-center text-xs">
                          <CheckCheck size={14} className="mr-1" />
                          Saved
                        </span>
                      ) : (
                        <button 
                          onClick={() => saveLearningPlan(message.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                          title="Save this learning plan"
                        >
                          <Save size={14} className="mr-1" />
                          Save Plan
                        </button>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-line">
                      {message.content.split(/\d+\./).map((section, i) => {
                        if (i === 0) return null; // Skip the first empty part
                        
                        // Find the section title
                        const titleMatch = section.match(/([^\n]+)/);
                        const title = titleMatch ? titleMatch[0].trim() : '';
                        // Get the content after the title
                        const content = titleMatch 
                          ? section.replace(titleMatch[0], '').trim() 
                          : section.trim();
                          
                        return (
                          <div key={i} className="mb-3">
                            <div className="font-medium text-blue-700 mb-1">{i}. {title}</div>
                            <div className="pl-4 text-gray-700">{content}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`inline-block max-w-[85%] px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  {/* Show retry button for error messages */}
                  {message.sender === 'ai' && 
                   message.content.includes('Sorry, I') && (
                    <button 
                      onClick={() => {
                        // Find the user message that caused this error
                        const index = messages.findIndex(m => m.id === message.id);
                        if (index > 0 && messages[index-1].sender === 'user') {
                          handleRetry(messages[index-1].content);
                        }
                      }}
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-3">
                <div className="inline-block max-w-[85%] px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-200 rounded-tl-none">
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin" /> 
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Network status warning */}
          {!navigator.onLine && (
            <div className="px-3 py-2 bg-red-50 text-red-700 text-xs border-t border-red-100 flex items-center">
              <WifiOff size={12} className="mr-1" />
              <span>You're offline. Messages won't be sent until you reconnect.</span>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-end">
              <textarea
                ref={inputRef}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={currentVideoId 
                  ? "Ask about this video or any topic..." 
                  : "Ask me anything about learning..."}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!navigator.onLine}
              />
              <button
                className="ml-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || !navigator.onLine}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget; 