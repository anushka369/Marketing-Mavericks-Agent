import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  onCopy: (content: string) => void;
  onDownload: (content: string) => void;
}

export default function MessageList({ messages, onCopy, onDownload }: MessageListProps) {
  const formatContent = (content: string, messageId: string) => {
    // Simple markdown-like formatting
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const key = `${messageId}-line-${i}`;
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={key} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={key} className="text-xl font-bold mt-3 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={key} className="text-lg font-semibold mt-2 mb-1">{line.slice(4)}</h3>;
      }
      // Bold
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={key} className="mb-2">
            {parts.map((part, j) => 
              j % 2 === 1 ? <strong key={`${key}-bold-${j}`}>{part}</strong> : part
            )}
          </p>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <br key={key} />;
      }
      // Regular paragraph
      return <p key={key} className="mb-2">{line}</p>;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-3xl rounded-lg p-4 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            <div className="prose prose-sm max-w-none">
              {message.role === 'user' ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div>
                  <div className="whitespace-pre-wrap">{formatContent(message.content, message.id)}</div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => onCopy(message.content)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => onDownload(message.content)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Download as text file"
                    >
                      💾 Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
