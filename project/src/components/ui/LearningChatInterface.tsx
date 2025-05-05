import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader, User, Eraser, BookOpen, AlertCircle, KeyRound, RefreshCw } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import Button from './Button';
import ApiKeyForm from './ApiKeyForm';

interface LearningChatInterfaceProps {
  title?: string;
}

const LearningChatInterface: React.FC<LearningChatInterfaceProps> = ({ 
  title = "AI Learning Assistant"
}) => {
  const { messages, isLoading, sendMessage, clearChat, connectionStatus, checkConnection, runCompatibilityCheck, resetAndReconnect } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [compatibilityStatus, setCompatibilityStatus] = useState<string | null>(null);
  const [isCheckingCompatibility, setIsCheckingCompatibility] = useState(false);

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

  // Function to test API compatibility
  const handleCompatibilityCheck = async () => {
    setIsCheckingCompatibility(true);
    setCompatibilityStatus("Checking Gemini API compatibility...");
    
    try {
      const result = await runCompatibilityCheck();
      
      if (result.success) {
        setCompatibilityStatus(`Success: ${result.message}. Refreshing connection...`);
        // Wait a moment to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setCompatibilityStatus(`Compatibility check failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error during compatibility check:", error);
      setCompatibilityStatus("Error running compatibility check. Please try again.");
    } finally {
      setIsCheckingCompatibility(false);
    }
  };

  const handleSetNewApiKey = () => {
    setCompatibilityStatus("API key saved successfully! Checking connection...");
    setTimeout(async () => {
      const result = await checkConnection();
      if (result) {
        setCompatibilityStatus("Connection successful! Refreshing...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setCompatibilityStatus("Connection test failed. The API key may be invalid or restricted.");
      }
    }, 500);
  };

  // Add new function to force reconnection with the default key
  const forceReconnectWithDefaultKey = async () => {
    setCompatibilityStatus("Resetting connection and trying to reconnect...");
    setIsCheckingCompatibility(true);
    
    try {
      // Use our new reset function
      const result = await resetAndReconnect();
      
      if (result) {
        setCompatibilityStatus("Connection successful! Refreshing...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setCompatibilityStatus("Could not establish connection. Please check your internet and try again.");
      }
    } catch (error) {
      console.error("Error during reconnection:", error);
      setCompatibilityStatus("Error during reconnection attempt.");
    } finally {
      setIsCheckingCompatibility(false);
    }
  };

  // Example prompt suggestions for learning
  const examplePrompts = [
    "How can I improve my learning efficiency?",
    "What are some effective study techniques?",
    "Can you explain the best way to learn programming?",
    "How do I stay motivated when learning difficult topics?"
  ];

  // Show API key configuration message when disconnected
  if (connectionStatus === 'disconnected') {
    return (
      <div className="chat-container h-[600px]">
        {/* Header */}
        <div className="chat-header">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-2" size={20} />
            <h2 className="font-medium text-gray-900">API Connection Error</h2>
          </div>
        </div>

        {/* API Configuration Message */}
        <div className="chat-messages bg-white">
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Service Connection Issue</h3>
            <p className="text-gray-700 max-w-md mb-4">
              The AI chat functionality is unable to connect to the Gemini API. We're trying to use the default API key.
            </p>
            
            {/* First try automatic reconnection */}
            <div className="w-full max-w-md mb-6">
              <Button 
                className="w-full mb-4 flex items-center justify-center gap-2"
                variant="primary"
                disabled={isCheckingCompatibility}
                onClick={forceReconnectWithDefaultKey}
              >
                {isCheckingCompatibility ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Reset Connection & Try Again
                  </>
                )}
              </Button>
              
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline"
                  className="flex-1"
                  disabled={isCheckingCompatibility}
                  onClick={handleCompatibilityCheck}
                >
                  {isCheckingCompatibility ? 'Checking...' : 'Run Compatibility Check'}
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
            
            {compatibilityStatus && (
              <div className={`w-full max-w-md mb-4 p-3 rounded text-sm ${
                compatibilityStatus.includes('Success') || compatibilityStatus.includes('successful')
                  ? 'bg-green-100 text-green-800' 
                  : compatibilityStatus.includes('failed') || compatibilityStatus.includes('Could not connect')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
              }`}>
                {compatibilityStatus}
              </div>
            )}
            
            {/* Only show API key form if automatic attempts fail */}
            <div className="w-full max-w-md mt-2">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-left mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Common issues:</h4>
                <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                  <li>Network connectivity problems</li>
                  <li>API key may have reached its quota limit</li>
                  <li>Region restrictions on the API</li>
                  <li>Gemini API service may be temporarily unavailable</li>
                </ul>
              </div>
              
              <details className="mb-4">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                  Use your own API key (Advanced)
                </summary>
                <div className="mt-4">
                  <ApiKeyForm onSuccess={handleSetNewApiKey} />
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container h-[600px]">
      {/* Header */}
      <div className="chat-header">
        <div className="flex items-center">
          <Sparkles className="text-indigo-600 mr-2" size={20} />
          <h2 className="font-medium text-gray-900">{title}</h2>
          {connectionStatus === 'checking' && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Checking connection...</span>
          )}
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
                      : message.error ? 'bg-red-600 mr-3' : 'bg-indigo-600 mr-3'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="text-white" size={16} />
                    ) : message.error ? (
                      <AlertCircle className="text-white" size={16} />
                    ) : (
                      <Sparkles className="text-white" size={16} />
                    )}
                  </div>
                  <div className={`message-bubble ${
                    message.sender === 'user' 
                      ? 'message-user rounded-tr-none' 
                      : message.error
                        ? 'message-error rounded-tl-none'
                        : 'message-bot rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">
                      {message.content.replace('[Learning Assistant] ', '')}
                    </div>
                    {message.error && (
                      <div className="mt-2 text-xs">
                        <Button
                          size="sm"
                          variant="outline"
                          className="py-1 px-2 text-xs"
                          onClick={handleCompatibilityCheck}
                        >
                          Run Compatibility Check
                        </Button>
                      </div>
                    )}
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