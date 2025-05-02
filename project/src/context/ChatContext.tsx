import React, { createContext, useState, useContext, useEffect } from 'react';
import { askGemini } from '../services/geminiService';

// Define types
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  context?: string; // Optional context like videoId
  isFallback?: boolean;
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, videoContext?: string) => Promise<void>;
  clearChat: () => void;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi there! I\'m your Yene Learn AI assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

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
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the welcome message
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

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
      // Construct a prompt that includes context if available
      let prompt = content;
      if (videoContext) {
        prompt = `I'm watching a video with ID: ${videoContext}. ${content}`;
      }

      // Check for network connectivity before making API call
      if (!navigator.onLine) {
        throw new Error('You are currently offline. Please check your internet connection and try again.');
      }

      // Get AI response
      const response = await askGemini(prompt);
      
      // If response starts with "I'm your Yene Learn AI assistant. While I'd normally connect" 
      // that means we got a fallback response, so we should save that fact
      const isFallbackResponse = response.startsWith("I'm your Yene Learn AI assistant. While I'd normally connect");
      
      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        context: videoContext,
        isFallback: isFallbackResponse
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message with more specific information
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}`
          : 'Sorry, I encountered an error. Please try again later.',
        sender: 'ai',
        timestamp: new Date(),
        context: videoContext
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
        content: 'Hi there! I\'m your Yene Learn AI assistant. How can I help you today?',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem('chat_messages');
  };

  return (
    <ChatContext.Provider value={{ messages, isLoading, sendMessage, clearChat }}>
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