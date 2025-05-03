import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ConnectionStatusProps {
  showRefreshButton?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ showRefreshButton = true }) => {
  const { connectionStatus, checkConnection } = useChat();
  
  // Map connection status to display values
  const statusMessages = {
    'connected': 'Connected to Gemini API',
    'disconnected': 'Failed to connect to Gemini API',
    'checking': 'Checking connection...',
    'unknown': 'Connection status unknown'
  };
  
  const isLoading = connectionStatus === 'checking';

  return (
    <div className="flex items-center gap-1 px-3 py-2 text-sm rounded-md bg-gray-50 border">
      {connectionStatus === 'checking' && (
        <RefreshCw size={16} className="animate-spin text-blue-500" />
      )}
      {connectionStatus === 'connected' && (
        <CheckCircle size={16} className="text-green-500" />
      )}
      {(connectionStatus === 'disconnected' || connectionStatus === 'unknown') && (
        <AlertCircle size={16} className="text-red-500" />
      )}
      
      <span className={`${
        connectionStatus === 'disconnected' || connectionStatus === 'unknown' ? 'text-red-700' : 
        connectionStatus === 'connected' ? 'text-green-700' : 
        'text-blue-700'
      }`}>
        {statusMessages[connectionStatus]}
      </span>
      
      {showRefreshButton && (
        <button 
          onClick={() => checkConnection()} 
          disabled={isLoading}
          className="ml-auto text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
          aria-label="Test connection"
        >
          Test
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus; 