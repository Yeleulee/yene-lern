import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { askGemini, testGeminiConnection, checkGeminiCompatibility, updateApiKey } from '../services/geminiService';

// Define types
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  context?: string; // Optional context like videoId
  isFallback?: boolean;
  error?: boolean;
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'checking' | 'unknown';
  sendMessage: (content: string, videoContext?: string) => Promise<void>;
  clearChat: () => void;
  checkConnection: () => Promise<boolean>;
  runCompatibilityCheck: () => Promise<{ success: boolean; message: string }>;
  setApiKey: (key: string) => boolean;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi there! I\'m your Yene Learn AI assistant. How can I help you with your learning journey today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking' | 'unknown'>('checking');
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [lastConnectionCheck, setLastConnectionCheck] = useState(0);
  const [compatibilityChecked, setCompatibilityChecked] = useState(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
    
    // Check connection status immediately on load
    checkConnection();
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Run a compatibility check to find a working endpoint
  const runCompatibilityCheck = useCallback(async () => {
    console.log("Running compatibility check from context...");
    
    try {
      setConnectionStatus('checking');
      const result = await checkGeminiCompatibility();
      setCompatibilityChecked(true);
      
      if (result.workingEndpoint) {
        // If we found a working endpoint, run a connection test
        const connectionTest = await testGeminiConnection();
        
        if (connectionTest.success) {
          setConnectionStatus('connected');
          return { 
            success: true, 
            message: `Found working endpoint: ${result.workingEndpoint}` 
          };
        } else {
          setConnectionStatus('disconnected');
          return { 
            success: false, 
            message: `Found endpoint ${result.workingEndpoint} but connection test failed: ${connectionTest.message}` 
          };
        }
      } else {
        setConnectionStatus('disconnected');
        return { 
          success: false, 
          message: result.message 
        };
      }
    } catch (error) {
      console.error("Error in compatibility check:", error);
      setConnectionStatus('disconnected');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error during compatibility check"
      };
    }
  }, []);

  // Check connection status periodically
  const checkConnection = useCallback(async () => {
    // Only check if we haven't checked in the last 2 minutes
    const now = Date.now();
    if (now - lastConnectionCheck < 2 * 60 * 1000 && connectionChecked) {
      return connectionStatus === 'connected';
    }

    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      return false;
    }

    setConnectionStatus('checking');
    setLastConnectionCheck(now);

    try {
      const result = await testGeminiConnection();
      const isConnected = result.success;
      
      if (!isConnected && !compatibilityChecked) {
        // If connection failed and we haven't tried compatibility check yet,
        // attempt to find a working endpoint
        console.log("Connection test failed, trying compatibility check...");
        const compatResult = await runCompatibilityCheck();
        if (compatResult.success) {
          setConnectionStatus('connected');
          setConnectionChecked(true);
          return true;
        }
      }
      
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      setConnectionChecked(true);
      return isConnected;
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  }, [connectionStatus, connectionChecked, lastConnectionCheck, compatibilityChecked, runCompatibilityCheck]);

  // Check connection on mount and when online status changes
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (navigator.onLine) {
        checkConnection();
      } else {
        setConnectionStatus('disconnected');
      }
    };

    // Initial check
    checkConnection();

    // Set up event listeners for online/offline status
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [checkConnection]);

  // Send a message and get a response
  const sendMessage = async (content: string, videoContext?: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      context: videoContext
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check connection before sending
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to AI service. Please check your internet connection, API key, and try again.');
      }

      // Construct a more comprehensive prompt with context
      let prompt = content;
      let isLearningPlan = false;
      
      // Check if this is a learning assistant message
      const isLearningAssistant = content.startsWith('[Learning Assistant]');
      if (isLearningAssistant) {
        // Extract the actual question
        const question = content.replace('[Learning Assistant]', '').trim();
        
        // Get the last few messages for context
        const contextMessages = messages
          .slice(-4) // Get the most recent 4 messages as context
          .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');
        
        // Check if this is a personalized learning plan request
        isLearningPlan = question.includes('Generate a personalized learning plan');
        
        if (isLearningPlan) {
          prompt = `${question}
                   
                   Please format your response as a structured learning plan with the following sections:
                   1. Summary of my learning profile
                   2. Goals based on my profile
                   3. Recommended next steps (be specific)
                   4. Daily learning schedule
                   5. Resources tailored to my interests
                   
                   Make the plan specific and actionable based on the information provided.
                   Format the plan in a clear, organized way that's easy to follow.`;
        } else {
          prompt = `As a learning platform assistant specialized in helping students improve their learning journey.
                    The user is using the "My Learning" section of the platform where they track their courses and learning progress.
                    
                    Here's our recent conversation:
                    ${contextMessages}
                    
                    The user is asking about their learning journey: ${question}
                    
                    Please provide specific, actionable advice about learning strategies, study techniques, or content recommendations.
                    Focus on being helpful, practical, and motivating.`;
        }
      } else if (videoContext) {
        // Get the last few messages for this context to provide conversation history
        const contextMessages = messages
          .filter(m => m.context === videoContext || !m.context)
          .slice(-6) // Get the most recent 6 messages as context
          .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');
          
        prompt = `I'm watching a YouTube video with ID: ${videoContext}. 
                  Here's our recent conversation about this video:
                  ${contextMessages}
                  
                  My new question is: ${content}`;
      }

      try {
        // Get AI response
        const response = await askGemini(prompt);
        
        // Add AI message
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: 'ai',
          timestamp: new Date(),
          context: videoContext || (isLearningAssistant ? (isLearningPlan ? 'learning-plan' : 'learning') : undefined)
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error('API Error handling message:', error);
        
        // Provide clear error message about API issues
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: error instanceof Error 
            ? `Sorry, there was an error with the AI service: ${error.message}`
            : 'Sorry, there was an error connecting to the AI service. Please try again later.',
          sender: 'ai',
          timestamp: new Date(),
          context: videoContext,
          error: true
        };

        setMessages((prev) => [...prev, errorMessage]);
        
        // Also update connection status for critical API errors
        if (error instanceof Error && (
          error.message.includes('API key') || 
          error.message.includes('authentication') ||
          error.message.includes('unauthorized') ||
          error.message.includes('rate limit')
        )) {
          setConnectionStatus('disconnected');
        }
      }
    } catch (error) {
      console.error('Error in sendMessage function:', error);
      
      // Add error message with more specific information
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}`
          : 'Sorry, I encountered an error. Please try again later.',
        sender: 'ai',
        timestamp: new Date(),
        context: videoContext,
        error: true
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: 'Hi there! I\'m your Yene Learn AI assistant. How can I help you with your learning journey today?',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem('chat_messages');
  };

  // Set a new API key
  const setApiKey = useCallback((key: string): boolean => {
    try {
      const success = updateApiKey(key);
      if (success) {
        // Trigger a connection check after setting the new key
        setTimeout(() => {
          checkConnection();
        }, 500);
      }
      return success;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  }, [checkConnection]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        connectionStatus,
        sendMessage,
        clearChat,
        checkConnection,
        runCompatibilityCheck,
        setApiKey,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Hook for using the context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext; 