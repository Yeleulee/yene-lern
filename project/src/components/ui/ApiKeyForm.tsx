import React, { useState } from 'react';
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import Button from './Button';

interface ApiKeyFormProps {
  onSuccess: () => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onSuccess }) => {
  const { setApiKey } = useChat();
  const [apiKey, setApiKeyValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!apiKey.trim()) {
        throw new Error('Please enter an API key');
      }

      // Update the API key using the context
      const success = setApiKey(apiKey.trim());
      
      if (!success) {
        throw new Error('The API key format is invalid. It should start with "AIza" and be at least 30 characters.');
      }

      // If successful, call the onSuccess callback
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <KeyRound className="text-indigo-600 mr-2" size={22} />
        <h2 className="text-lg font-semibold">Enter Your Gemini API Key</h2>
      </div>
      
      <p className="text-gray-600 mb-4">
        To use AI features, please provide your Gemini API key. You can get one for free from the{' '}
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline"
        >
          Google AI Studio
        </a>.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Your key is stored locally on your device and never sent to our servers.
          </p>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Validating...' : 'Save API Key'}
        </Button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="flex items-center">
          <CheckCircle className="text-green-500 mr-2" size={14} />
          Private: Your key never leaves your device
        </p>
        <p className="flex items-center mt-1">
          <CheckCircle className="text-green-500 mr-2" size={14} />
          Secure: Your key is stored in your browser's local storage
        </p>
      </div>
    </div>
  );
};

export default ApiKeyForm; 