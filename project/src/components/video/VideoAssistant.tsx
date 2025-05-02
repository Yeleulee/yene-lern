import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Loader, PlusCircle, ChevronDown, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ReactMarkdown from 'react-markdown';

interface VideoAssistantProps {
  videoId: string;
  videoTitle?: string;
}

const VideoAssistant: React.FC<VideoAssistantProps> = ({ videoId, videoTitle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Filter messages to show only those related to this video context
  const videoMessages = messages.filter(
    (msg) => msg.context === videoId || (!msg.context && msg.id === '1')
  );

  // Auto-resize textarea as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Auto-scroll to bottom of chat when new messages come in
  useEffect(() => {
    if (chatContainerRef.current && isExpanded) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [videoMessages, isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleMinimize = () => {
    setIsExpanded(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input, videoId);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick question templates with icons
  const quickQuestions = [
    { text: "Explain this video", icon: <Sparkles size={14} /> },
    { text: "Summarize key points", icon: <ChevronDown size={14} /> },
    { text: "How to apply this?", icon: <Sparkles size={14} /> }
  ];

  // Retry sending message if it fails
  const handleRetry = async (failedMessage: string) => {
    if (isLoading) return;
    await sendMessage(failedMessage, videoId);
  };

  return (
    <div className="rounded-lg shadow-lg border border-gray-200 bg-white overflow-hidden transition-all duration-300 max-w-full"
         style={{ height: isExpanded ? '500px' : 'auto' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 flex justify-between items-center">
        <h3 className="font-medium flex items-center gap-2">
          <Bot size={18} />
          <span>Yene Learn AI</span>
          {videoTitle && isExpanded && <span className="hidden md:inline ml-2 text-xs opacity-80">| {videoTitle}</span>}
        </h3>
        <div className="flex gap-2">
          {isExpanded && (
            <button 
              onClick={() => clearChat()}
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
              title="Clear chat"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button 
            onClick={isExpanded ? handleMinimize : handleExpand}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <X size={18} /> : <PlusCircle size={18} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded ? (
        <>
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="bg-gray-50 overflow-y-auto p-4 flex flex-col gap-4"
            style={{ height: 'calc(100% - 140px)' }}
          >
            {videoMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-2">
                <Bot size={36} className="text-gray-300" />
                <p>Ask me anything about this video!</p>
              </div>
            ) : (
              videoMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`relative max-w-[85%] flex ${
                      message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center 
                      ${message.sender === 'user' ? 'bg-blue-100 text-blue-600 ml-2' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white mr-2'}`}
                    >
                      {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm shadow-sm 
                      ${message.sender === 'user' 
                        ? 'bg-blue-50 text-gray-800 border border-blue-100' 
                        : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {message.sender === 'ai' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="relative max-w-[85%] flex flex-row">
                  <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white mr-2">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl text-sm shadow-sm bg-white text-gray-800 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="animate-bounce delay-0 h-2 w-2 bg-gray-400 rounded-full"></span>
                        <span className="animate-bounce delay-300 h-2 w-2 bg-gray-400 rounded-full"></span>
                        <span className="animate-bounce delay-600 h-2 w-2 bg-gray-400 rounded-full"></span>
                      </div>
                      <span className="text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="p-2 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-1">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-1"
                onClick={() => {
                  sendMessage(question.text, videoId);
                }}
                disabled={isLoading}
              >
                {question.icon}
                {question.text}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="relative">
              <textarea
                ref={inputRef}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm min-h-[40px] max-h-[120px]"
                placeholder="Message Yene Learn AI..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="absolute right-2 bottom-3 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500 text-center">
              Powered by Google Gemini
            </div>
          </div>
        </>
      ) : (
        // Minimized state - just show a prompt
        <div 
          className="p-3 text-center text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors" 
          onClick={handleExpand}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            <p className="text-sm">Ask AI about this video</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAssistant; 