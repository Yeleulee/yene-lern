import React, { useState, useRef } from 'react';
import { Send, X, Loader, PlusCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface VideoAssistantProps {
  videoId: string;
  videoTitle?: string;
}

const VideoAssistant: React.FC<VideoAssistantProps> = ({ videoId, videoTitle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Filter messages to show only those related to this video context
  const videoMessages = messages.filter(
    (msg) => msg.context === videoId || (!msg.context && msg.id === '1')
  );

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick question templates
  const quickQuestions = [
    "Explain the main concept",
    "Summarize key points",
    "Give examples of this",
    "How can I apply this?",
    "What should I learn next?",
    "Explain like I'm five"
  ];

  // Retry sending message if it fails
  const handleRetry = async (failedMessage: string) => {
    if (isLoading) return;
    await sendMessage(failedMessage, videoId);
  };

  return (
    <div className="rounded-lg shadow-md border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <span>Video Assistant</span>
          {videoTitle && <span className="ml-2 text-xs opacity-80">| {videoTitle}</span>}
        </h3>
        <button 
          onClick={isExpanded ? handleMinimize : handleExpand}
          className="text-white hover:bg-blue-700 p-1 rounded"
        >
          {isExpanded ? <X size={18} /> : <PlusCircle size={18} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded ? (
        <>
          {/* Chat Messages */}
          <div className="p-3 bg-gray-50 h-56 overflow-y-auto">
            {videoMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Ask a question about this video
              </div>
            ) : (
              videoMessages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                  
                  {/* Show retry button for error messages */}
                  {message.sender === 'ai' && 
                   message.content.includes('Sorry, I encountered an error') && (
                    <div className="mt-1">
                      <button 
                        onClick={() => {
                          // Find the user message that caused this error
                          const index = videoMessages.findIndex(m => m.id === message.id);
                          if (index > 0 && videoMessages[index-1].sender === 'user') {
                            handleRetry(videoMessages[index-1].content);
                          }
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-left mb-3">
                <div className="inline-block max-w-[85%] px-3 py-2 rounded-lg bg-white text-gray-800 border border-gray-200 rounded-tl-none text-sm">
                  <div className="flex items-center gap-2">
                    <Loader size={14} className="animate-spin" /> 
                    <span>Thinking...</span>
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
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                onClick={() => {
                  sendMessage(question, videoId);
                }}
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 flex items-end">
            <textarea
              ref={inputRef}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              placeholder="Ask about this video..."
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
        </>
      ) : (
        // Minimized state - just show a prompt
        <div 
          className="p-3 text-center text-gray-600 cursor-pointer hover:bg-gray-50" 
          onClick={handleExpand}
        >
          <p className="text-sm">Click to ask questions about this video</p>
        </div>
      )}
    </div>
  );
};

export default VideoAssistant; 