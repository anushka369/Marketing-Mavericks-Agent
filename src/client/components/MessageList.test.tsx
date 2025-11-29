import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageList from './MessageList';
import { Message } from '../types';

describe('MessageList', () => {
  const mockOnCopy = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }
    ];

    render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should render assistant messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'assistant', content: 'Hi there!', timestamp: Date.now() }
    ];

    render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should style user and assistant messages differently', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'User message', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Assistant message', timestamp: Date.now() }
    ];

    const { container } = render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    // Find the message containers (the divs with bg-blue-500 or bg-white classes)
    const userMessageContainer = container.querySelector('.bg-blue-500');
    const assistantMessageContainer = container.querySelector('.bg-white');

    expect(userMessageContainer).toBeInTheDocument();
    expect(assistantMessageContainer).toBeInTheDocument();
    expect(userMessageContainer).toHaveTextContent('User message');
    expect(assistantMessageContainer).toHaveTextContent('Assistant message');
  });

  it('should provide copy button for assistant messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'assistant', content: 'Test content', timestamp: Date.now() }
    ];

    render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
  });

  it('should provide download button for assistant messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'assistant', content: 'Test content', timestamp: Date.now() }
    ];

    render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    expect(screen.getByTitle('Download as text file')).toBeInTheDocument();
  });

  it('should call onCopy when copy button is clicked', async () => {
    const user = userEvent.setup();
    const messages: Message[] = [
      { id: '1', role: 'assistant', content: 'Test content', timestamp: Date.now() }
    ];

    render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    const copyButton = screen.getByTitle('Copy to clipboard');
    await user.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledWith('Test content');
  });

  it('should call onDownload when download button is clicked', async () => {
    const user = userEvent.setup();
    const messages: Message[] = [
      { id: '1', role: 'assistant', content: 'Test content', timestamp: Date.now() }
    ];

    render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    const downloadButton = screen.getByTitle('Download as text file');
    await user.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledWith('Test content');
  });

  it('should not show copy/download buttons for user messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'User message', timestamp: Date.now() }
    ];

    render(<MessageList messages={messages} onCopy={mockOnCopy} onDownload={mockOnDownload} />);

    expect(screen.queryByTitle('Copy to clipboard')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Download as text file')).not.toBeInTheDocument();
  });
});
