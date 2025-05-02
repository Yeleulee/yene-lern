import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Loader, Trash } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useLocation } from 'react-router-dom';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();

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
  
  // Retry sending message if it fails
  const handleRetry = async (failedMessage: string) => {
    if (isLoading) return;
    await sendMessage(failedMessage, currentVideoId);
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
              <button onClick={handleClearChat} className="p-1 mx-1 rounded hover:bg-blue-700" title="Clear chat history">
                <Trash size={16} />
              </button>
              <button onClick={handleToggleChat} className="p-1 rounded hover:bg-blue-700" title="Close chat">
                <X size={18} />
              </button>
            </div>
          </div>

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
                <div
                  className={`inline-block max-w-[85%] px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  {message.content}
                </div>
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
              />
              <button
                className="ml-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
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