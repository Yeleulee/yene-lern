import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { askDeepSeek, testDeepSeekConnection } from '../services/deepSeekService';

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
      content: 'Hi there! I\'m your Yene Learn AI assistant (Powered by DeepSeek). How can I help you with your learning journey today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking' | 'unknown'>('checking');
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [lastConnectionCheck, setLastConnectionCheck] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

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

  // Compatibility check is now a simple pass-through since DeepSeek manages its own endpoints
  const runCompatibilityCheck = useCallback(async () => {
    return { success: true, message: "DeepSeek API is compatible." };
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
      const result = await testDeepSeekConnection();
      const isConnected = result.success;
      if (!result.success) setLastError(result.message);

      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      setConnectionChecked(true);
      return isConnected;
    } catch (error) {
      console.error('Error checking connection:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      setConnectionStatus('disconnected');
      return false;
    }
  }, [connectionStatus, connectionChecked, lastConnectionCheck]);

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

      // Construct context-aware prompt
      let prompt = content;
      let isLearningPlan = false;
      const isLearningAssistant = content.startsWith('[Learning Assistant]');

      if (isLearningAssistant) {
        const question = content.replace('[Learning Assistant]', '').trim();
        const contextMessages = messages.slice(-4).map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

        isLearningPlan = question.includes('Generate a personalized learning plan');

        if (isLearningPlan) {
          prompt = `Generate a personalized learning plan based on: ${question}. Context: ${contextMessages}`;
        } else {
          prompt = `Context: ${contextMessages}. User Question: ${question}`;
        }
      } else if (videoContext) {
        const contextMessages = messages
          .filter(m => m.context === videoContext || !m.context)
          .slice(-6)
          .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');

        prompt = `VideoID: ${videoContext}. Conversation Context: ${contextMessages}. User Question: ${content}`;
      }

      try {
        // Get DeepSeek response
        const response = await askDeepSeek(prompt);

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
        setLastError(error instanceof Error ? error.message : 'Unknown error');

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: error instanceof Error
            ? `AI Error: ${error.message}`
            : 'Error connecting to AI service.',
          sender: 'ai',
          timestamp: new Date(),
          context: videoContext,
          error: true
        };

        setMessages((prev) => [...prev, errorMessage]);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error in sendMessage function:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error
          ? `Error: ${error.message}`
          : 'Error occurred.',
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
        content: 'Hi there! I\'m your Yene Learn AI assistant (Powered by DeepSeek). How can I help you with your learning journey today?',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem('chat_messages');
  };

  // Set a new API key stub
  const setApiKey = useCallback((key: string): boolean => {
    console.warn("API Key update for DeepSeek should be done via .env VITE_OPENROUTER_API_KEY");
    return false;
  }, []);

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