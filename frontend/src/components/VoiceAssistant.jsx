import React, { useState, useEffect } from 'react';

// Using mock implementation for development
import { MockRetellWebClient as RetellWebClient } from '../utils/retellMock';
import API from '../api';
import { notify } from '../ui/toastBus';

console.log('Using mock Retell implementation for voice assistant');

const VoiceAssistant = ({ context = 'general' }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retellClient, setRetellClient] = useState(null);

  useEffect(() => {
    // Initialize Retell client
    const client = new RetellWebClient();
    setRetellClient(client);

    // Cleanup on unmount
    return () => {
      if (client && isCalling) {
        client.stopCall();
      }
    };
  }, []);

  const toggleConversation = async () => {
    if (!retellClient) {
      console.error('Retell client not initialized');
      return;
    }

    if (isCalling) {
      // Stop the call
      retellClient.stopCall();
      setIsCalling(false);
      setIsLoading(false);
    } else {
      // Start the call
      setIsLoading(true);
      try {
        const { data } = await API.post('/retell/auth', { context }); // sends the login token
        
        if (data.access_token) {
          await retellClient.startCall({ 
            accessToken: data.access_token,
            callId: data.call_id 
          });
          setIsCalling(true);
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        console.error('Failed to start Retell call:', error);
        notify.auto('Failed to start voice assistant. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggleConversation}
        disabled={isLoading}
        className={`
          relative p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110
          ${isCalling 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-4 focus:ring-blue-300
        `}
        title={isCalling ? 'Stop Voice Assistant' : 'Start Voice Assistant'}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            fill="white" 
            viewBox="0 0 16 16"
            className={`transition-transform duration-200 ${isCalling ? 'scale-110' : ''}`}
          >
            <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/>
            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
          </svg>
        )}
        
        {/* Status indicator */}
        {isCalling && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}
      </button>
      
      {/* Status text */}
      {(isCalling || isLoading) && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap">
          {isLoading ? 'Connecting...' : 'Voice Assistant Active'}
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;