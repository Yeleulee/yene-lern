import React from 'react';
import { CircleCheck, CircleX, Loader, AlertCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const GeminiStatusIndicator: React.FC = () => {
  const { connectionStatus, checkConnection, runCompatibilityCheck } = useChat();
  
  let icon;
  let label;
  let className;
  
  switch (connectionStatus) {
    case 'connected':
      icon = <CircleCheck size={14} />;
      label = "Gemini API Connected";
      className = "bg-green-100 text-green-800";
      break;
    case 'disconnected':
      icon = <CircleX size={14} />;
      label = "Gemini API Disconnected";
      className = "bg-red-100 text-red-800";
      break;
    case 'checking':
      icon = <Loader size={14} className="animate-spin" />;
      label = "Checking API...";
      className = "bg-yellow-100 text-yellow-800";
      break;
    default:
      icon = <AlertCircle size={14} />;
      label = "API Status Unknown";
      className = "bg-gray-100 text-gray-800";
  }
  
  const handleClick = async () => {
    if (connectionStatus === 'disconnected') {
      const compatResult = await runCompatibilityCheck();
      if (!compatResult.success) {
        // If compatibility check failed, try connection test
        await checkConnection();
      }
    } else {
      // Just run a normal connection check
      await checkConnection();
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${className} hover:opacity-90 transition-opacity`}
      title="Click to check API connection"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default GeminiStatusIndicator; 