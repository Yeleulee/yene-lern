import React, { useState, useEffect } from 'react';
import { checkGeminiCompatibility } from '../services/geminiService';

const GeminiTestPage: React.FC = () => {
  // Initialize with the provided API key
  const [apiKey, setApiKey] = useState<string>("AIzaSyA7jQcLw_M0Dt6ZMQFf7VOsJsAPKo6h35Y");
  const [query, setQuery] = useState<string>('Explain how AI works');
  const [response, setResponse] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [endpoint, setEndpoint] = useState<string>("v1beta/models/gemini-pro");
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('');
  const [endpointTest, setEndpointTest] = useState<{ [key: string]: string }>({});

  // Check if API key is loaded
  useEffect(() => {
    if (apiKey) {
      setStatus(`API Key loaded (${apiKey.length} characters, starts with ${apiKey.substring(0, 5)}...)`);
    } else {
      setStatus('No API key found in environment variables');
    }
  }, [apiKey]);

  const testApi = async () => {
    setLoading(true);
    setResponse('');
    setStatus('Testing connection...');

    try {
      // Direct API call to Gemini using the selected endpoint
      const apiUrl = `https://generativelanguage.googleapis.com/${endpoint}:generateContent?key=${apiKey}`;
      console.log("Testing API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: query,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (!response.ok) {
        setStatus(`Error: ${response.status} ${response.statusText}`);
        if (data.error) {
          setResponse(`Error: ${data.error.message || 'Unknown error'}`);
          setDiagnosticInfo(JSON.stringify(data.error, null, 2));
        }
        return;
      }

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        setResponse(data.candidates[0].content.parts[0].text);
        setStatus('Success! API is working correctly');
        setDiagnosticInfo('');
      } else {
        setResponse('Received response but no content found');
        setStatus('Unexpected response format');
        setDiagnosticInfo(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error testing API:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDiagnosticInfo(error instanceof Error ? error.stack || error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const runCompatibilityCheck = async () => {
    setLoading(true);
    setStatus('Running compatibility check...');
    setEndpointTest({});
    
    try {
      const result = await checkGeminiCompatibility();
      
      if (result.workingEndpoint) {
        setStatus(`Found working endpoint: ${result.workingEndpoint}`);
        setEndpoint(`v1beta/models/gemini-pro`); // Default to beta
        
        if (result.workingEndpoint === 'v1') {
          setEndpoint('v1/models/gemini-1.0-pro');
        } else if (result.workingEndpoint === 'v1beta15') {
          setEndpoint('v1beta/models/gemini-1.5-pro');
        }
      } else {
        setStatus(`Compatibility check failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error in compatibility check:', error);
      setStatus(`Error checking compatibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gemini API Diagnostics</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Status</h2>
        <p className={status.includes('Success') || status.includes('working endpoint') 
          ? 'text-green-600' 
          : status.includes('Error') 
            ? 'text-red-600' 
            : 'text-blue-600'}>
          {status}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2">
            API Key
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
              placeholder="Enter your Gemini API key"
            />
          </label>
        </div>
        
        <div>
          <label className="block mb-2">
            API Endpoint
            <select
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1"
            >
              <option value="v1beta/models/gemini-pro">v1beta/models/gemini-pro (Beta)</option>
              <option value="v1/models/gemini-1.0-pro">v1/models/gemini-1.0-pro (v1)</option>
              <option value="v1beta/models/gemini-1.5-pro">v1beta/models/gemini-1.5-pro (1.5)</option>
            </select>
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">
          Test Query
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            rows={3}
            placeholder="Enter your test query"
          />
        </label>
      </div>
      
      <div className="flex gap-3 mb-6">
        <button
          onClick={testApi}
          disabled={loading || !apiKey.trim()}
          className={`px-4 py-2 rounded ${
            loading || !apiKey.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Testing...' : 'Test Gemini API'}
        </button>
        
        <button
          onClick={runCompatibilityCheck}
          disabled={loading || !apiKey.trim()}
          className={`px-4 py-2 rounded ${
            loading || !apiKey.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading ? 'Checking...' : 'Check All Endpoints'}
        </button>
      </div>
      
      {response && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Response</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{response}</pre>
        </div>
      )}
      
      {diagnosticInfo && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Diagnostic Information</h2>
          <pre className="bg-red-50 text-red-800 p-4 rounded whitespace-pre-wrap text-sm overflow-auto max-h-[300px]">{diagnosticInfo}</pre>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="font-semibold mb-2">API Troubleshooting Guide</h2>
        <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm">
          <p className="font-medium mb-2">Common Gemini API Issues:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Invalid API key format (must start with "AIza")</li>
            <li>Unauthorized API key (needs to be activated in Google AI Studio)</li>
            <li>Rate limiting (too many requests in a short period)</li>
            <li>Region restrictions (some regions may not have access)</li>
            <li>Content policy violations in queries</li>
            <li>API version compatibility issues</li>
          </ul>
          <p className="mt-3">
            For more help, visit the <a href="https://ai.google.dev/docs/gemini_api_overview" target="_blank" rel="noopener noreferrer" className="underline">Gemini API Documentation</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeminiTestPage; 