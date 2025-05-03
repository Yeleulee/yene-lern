import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader, User, Eraser, BookOpen } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import Button from './Button';

interface LearningChatInterfaceProps {
  title?: string;
}

const LearningChatInterface: React.FC<LearningChatInterfaceProps> = ({ 
  title = "AI Learning Assistant"
}) => {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filter messages to show only learning-related ones
  const learningMessages = messages.filter(
    msg => !msg.context || msg.context === 'learning' || msg.context === 'learning-plan'
  );

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [learningMessages]);

  // Focus input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add [Learning Assistant] prefix to better handle the context
    const message = `[Learning Assistant] ${input}`;
    await sendMessage(message);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearChat();
    }
  };

  // Example prompt suggestions for learning
  const examplePrompts = [
    "How can I improve my learning efficiency?",
    "What are some effective study techniques?",
    "Can you explain the best way to learn programming?",
    "How do I stay motivated when learning difficult topics?"
  ];

  return (
    <div className="chat-container h-[600px]">
      {/* Header */}
      <div className="chat-header">
        <div className="flex items-center">
          <Sparkles className="text-indigo-600 mr-2" size={20} />
          <h2 className="font-medium text-gray-900">{title}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearChat}
          className="text-gray-500 hover:text-gray-700"
        >
          <Eraser size={16} className="mr-1" />
          Clear chat
        </Button>
      </div>

      {/* Messages Container */}
      <div className="chat-messages bg-white">
        {learningMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Assistant</h3>
            <p className="text-gray-500 max-w-md mb-6">
              Ask any questions about your learning journey, study techniques, or content recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setInput(prompt);
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                >
                  <span className="text-gray-800">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {learningMessages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 ml-3' 
                      : 'bg-indigo-600 mr-3'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="text-white" size={16} />
                    ) : (
                      <Sparkles className="text-white" size={16} />
                    )}
                  </div>
                  <div className={`message-bubble ${
                    message.sender === 'user' 
                      ? 'message-user rounded-tr-none' 
                      : 'message-bot rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">
                      {message.content.replace('[Learning Assistant] ', '')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                    <Sparkles className="text-white" size={16} />
                  </div>
                  <div className="message-bubble message-bot rounded-tl-none flex items-center">
                    <Loader size={16} className="animate-spin mr-2" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <div className="relative">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask anything about your learning journey..."
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={`absolute right-3 bottom-3 p-2 rounded-lg ${
              input.trim() && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
          <span>Shift + Enter for new line</span>
          <span className="flex items-center">
            <Sparkles size={12} className="mr-1" />
            Powered by Gemini
          </span>
        </div>
      </div>
    </div>
  );
};

export default LearningChatInterface; 