import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { chatClient } from './api/chatClient';

// Mock the chat client
jest.mock('./api/chatClient', () => ({
  chatClient: {
    sendMessage: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

const mockChatClient = chatClient as jest.Mocked<typeof chatClient>;

describe('Frontend-Backend Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Complete message flow', () => {
    it('should send a message and display the response', async () => {
      mockChatClient.sendMessage.mockResolvedValueOnce({
        success: true,
        response: 'Here is your marketing content!',
      });

      render(<App />);

      // Click on an example prompt to start
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      // Wait for the response to appear
      await waitFor(() => {
        expect(screen.getByText('Here is your marketing content!')).toBeInTheDocument();
      });

      // Verify the API was called
      expect(mockChatClient.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should send user input and display response', async () => {
      mockChatClient.sendMessage.mockResolvedValueOnce({
        success: true,
        response: 'Blog post created!',
      });

      render(<App />);

      // Type a message
      const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i);
      await userEvent.type(textarea, 'Create a blog post about AI');

      // Click send
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Blog post created!')).toBeInTheDocument();
      });

      // Verify user message is displayed
      expect(screen.getByText('Create a blog post about AI')).toBeInTheDocument();
    });

    it('should clear input after sending', async () => {
      mockChatClient.sendMessage.mockResolvedValueOnce({
        success: true,
        response: 'Response',
      });

      render(<App />);

      const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i) as HTMLTextAreaElement;
      await userEvent.type(textarea, 'Test message');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Input should be cleared
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should show loading state while waiting for response', async () => {
      mockChatClient.sendMessage.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, response: 'Done' }), 100))
      );

      render(<App />);

      const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i);
      await userEvent.type(textarea, 'Test');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      // Should show loading state
      expect(screen.getByText(/Generating response/i)).toBeInTheDocument();
      expect(sendButton).toHaveTextContent('Sending...');

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message on network failure', async () => {
      mockChatClient.sendMessage.mockRejectedValueOnce(
        new Error('Network error. Please check your connection and try again.')
      );

      render(<App />);

      // Click example to show chat interface
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should display error message on timeout', async () => {
      mockChatClient.sendMessage.mockRejectedValueOnce(
        new Error('Request timed out after 30 seconds. Please try again.')
      );

      render(<App />);

      // Click example to show chat interface
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      await waitFor(() => {
        expect(screen.getByText(/timed out/i)).toBeInTheDocument();
      });
    });

    it('should display error message on API failure', async () => {
      mockChatClient.sendMessage.mockResolvedValueOnce({
        success: false,
        response: '',
        error: 'API rate limit exceeded',
      });

      render(<App />);

      // Click example to show chat interface
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      await waitFor(() => {
        expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      // First call fails
      mockChatClient.sendMessage.mockRejectedValueOnce(new Error('Network error'));
      
      // Second call succeeds
      mockChatClient.sendMessage.mockResolvedValueOnce({
        success: true,
        response: 'Success!',
      });

      render(<App />);

      // Click example to trigger first request
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      // Now we should have the chat interface
      const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Retry
      await userEvent.type(textarea, 'Test again');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation continuity', () => {
    it('should maintain conversation history across messages', async () => {
      mockChatClient.sendMessage
        .mockResolvedValueOnce({
          success: true,
          response: 'First response',
        })
        .mockResolvedValueOnce({
          success: true,
          response: 'Second response',
        });

      render(<App />);

      // Click example to start conversation
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      await waitFor(() => {
        expect(screen.getByText('First response')).toBeInTheDocument();
      });

      // Now send second message
      const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(textarea, 'Second message');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Second response')).toBeInTheDocument();
      });

      // Verify history was passed in second call
      expect(mockChatClient.sendMessage).toHaveBeenCalledTimes(2);
      
      const secondCall = mockChatClient.sendMessage.mock.calls[1][0];
      expect(secondCall.history).toHaveLength(2); // First user message and first assistant response
      expect(secondCall.history![1].content).toBe('First response');
    });

    it('should pass brand context in subsequent requests', async () => {
      mockChatClient.sendMessage
        .mockResolvedValueOnce({
          success: true,
          response: 'Got it!',
        })
        .mockResolvedValueOnce({
          success: true,
          response: 'Using your brand context',
        });

      render(<App />);

      // Click example to start
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      await waitFor(() => {
        expect(screen.getByText('Got it!')).toBeInTheDocument();
      });

      // Now send message with brand info
      const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(textarea, 'My brand is TechCorp and we target developers');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Using your brand context')).toBeInTheDocument();
      });

      // Verify brand context was extracted and passed
      const secondCall = mockChatClient.sendMessage.mock.calls[1][0];
      expect(secondCall.brandContext).toBeDefined();
      expect(secondCall.brandContext?.brandName).toBeTruthy();
    });

    it('should display all messages in conversation order', async () => {
      mockChatClient.sendMessage
        .mockResolvedValueOnce({ success: true, response: 'Response 1' })
        .mockResolvedValueOnce({ success: true, response: 'Response 2' })
        .mockResolvedValueOnce({ success: true, response: 'Response 3' });

      render(<App />);

      // Click example to start
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      await waitFor(() => {
        expect(screen.getByText('Response 1')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText(/Ask me to create marketing content/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send two more messages
      for (let i = 2; i <= 3; i++) {
        await userEvent.type(textarea, `Message ${i}`);
        fireEvent.click(sendButton);
        await waitFor(() => {
          expect(screen.getByText(`Response ${i}`)).toBeInTheDocument();
        });
      }

      // All messages should be visible
      expect(screen.getByText('Response 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
      expect(screen.getByText('Response 2')).toBeInTheDocument();
      expect(screen.getByText('Message 3')).toBeInTheDocument();
      expect(screen.getByText('Response 3')).toBeInTheDocument();
    });
  });

  describe('Content interaction', () => {
    it('should provide copy functionality for assistant messages', async () => {
      const testResponse = 'Content to copy';
      mockChatClient.sendMessage.mockResolvedValueOnce({
        success: true,
        response: testResponse,
      });

      render(<App />);

      // Click example to start
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      // Wait for response to appear
      await waitFor(() => {
        const copyButtons = screen.queryAllByRole('button', { name: /copy/i });
        expect(copyButtons.length).toBeGreaterThan(0);
      });

      // Find and click copy button
      const copyButton = screen.getAllByRole('button', { name: /copy/i })[0];
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testResponse);
    });

    it('should provide download functionality for assistant messages', async () => {
      const testResponse = 'Content to download';
      mockChatClient.sendMessage.mockResolvedValueOnce({
        success: true,
        response: testResponse,
      });

      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      render(<App />);

      // Click example to start
      const exampleButton = screen.getAllByRole('button')[0];
      fireEvent.click(exampleButton);

      // Wait for response to appear
      await waitFor(() => {
        const downloadButtons = screen.queryAllByRole('button', { name: /download/i });
        expect(downloadButtons.length).toBeGreaterThan(0);
      });

      // Find and click download button
      const downloadButton = screen.getAllByRole('button', { name: /download/i })[0];
      fireEvent.click(downloadButton);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
