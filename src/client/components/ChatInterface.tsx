import { useEffect, useRef } from 'react';
import { Message } from '../types';
import MessageList from './MessageList';
import InputBox from './InputBox';

interface ChatInterfaceProps {
  messages: Message[];
  onSend: (message: string) => void;
  isLoading: boolean;
  onCopy: (content: string) => void;
  onDownload: (content: string) => void;
}

export default function ChatInterface({ 
  messages, 
  onSend, 
  isLoading,
  onCopy,
  onDownload
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <MessageList 
        messages={messages} 
        onCopy={onCopy}
        onDownload={onDownload}
      />
      <div ref={messagesEndRef} />
      {isLoading && (
        <div className="px-4 py-2 text-center text-gray-500">
          <span className="inline-block animate-pulse">Generating response...</span>
        </div>
      )}
      <InputBox onSend={onSend} disabled={isLoading} />
    </div>
  );
}
