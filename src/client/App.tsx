import { useState, useEffect } from 'react';
import { Message, BrandContext } from './types';
import ChatInterface from './components/ChatInterface';
import WelcomeScreen from './components/WelcomeScreen';
import { chatClient } from './api/chatClient';
import { extractBrandContext, mergeBrandContext } from './utils/contextExtractor';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [brandContext, setBrandContext] = useState<BrandContext>({});

  // Extract and update brand context whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const extractedContext = extractBrandContext(messages);
      setBrandContext(prev => mergeBrandContext(prev, extractedContext));
    }
  }, [messages]);

  const handleSend = async (message: string) => {
    // Clear any previous errors
    setError(null);
    setLastFailedMessage(null);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatClient.sendMessage({
        message,
        history: messages,
        brandContext: Object.keys(brandContext).length > 0 ? brandContext : undefined
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get response');
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMsg);
      setLastFailedMessage(message);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      // Remove the last error message before retrying
      setMessages(prev => prev.slice(0, -1));
      handleSend(lastFailedMessage);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-content-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExampleClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          {lastFailedMessage && (
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs font-medium"
            >
              Retry
            </button>
          )}
        </div>
      )}
      {messages.length === 0 ? (
        <WelcomeScreen onExampleClick={handleExampleClick} />
      ) : (
        <ChatInterface
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

export default App;
