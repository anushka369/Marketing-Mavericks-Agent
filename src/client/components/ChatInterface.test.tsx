import { render, screen } from '@testing-library/react';
import ChatInterface from './ChatInterface';
import { Message } from '../types';

describe('ChatInterface', () => {
  const mockOnSend = jest.fn();
  const mockOnCopy = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('should render with empty messages', () => {
    render(
      <ChatInterface
        messages={[]}
        onSend={mockOnSend}
        isLoading={false}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByPlaceholderText(/Ask me to create marketing content/i)).toBeInTheDocument();
  });

  it('should render messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() }
    ];

    render(
      <ChatInterface
        messages={messages}
        onSend={mockOnSend}
        isLoading={false}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <ChatInterface
        messages={[]}
        onSend={mockOnSend}
        isLoading={true}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Generating response/i)).toBeInTheDocument();
  });

  it('should disable input when loading', () => {
    render(
      <ChatInterface
        messages={[]}
        onSend={mockOnSend}
        isLoading={true}
        onCopy={mockOnCopy}
        onDownload={mockOnDownload}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i);
    expect(textarea).toBeDisabled();
  });
});
