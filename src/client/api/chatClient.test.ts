import { ChatClient } from './chatClient';
import { ChatRequest, ChatResponse } from '../types';

// Mock fetch
global.fetch = jest.fn();

describe('ChatClient Error Handling', () => {
  let chatClient: ChatClient;

  beforeEach(() => {
    chatClient = new ChatClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Network Errors', () => {
    it('should handle network failure with retry', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // First two attempts fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, response: 'Success after retry' })
        } as Response);

      const request: ChatRequest = { message: 'Test message' };
      const response = await chatClient.sendMessage(request);

      expect(response.success).toBe(true);
      expect(response.response).toBe('Success after retry');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries on network failure', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // All attempts fail
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      const request: ChatRequest = { message: 'Test message' };

      await expect(chatClient.sendMessage(request)).rejects.toThrow(
        /Network error.*check your internet connection/i
      );

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Timeout Errors', () => {
    it('should handle 408 timeout status from server', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 408,
        json: async () => ({ success: false, error: 'Request timeout' })
      } as Response);

      const request: ChatRequest = { message: 'Test message' };

      await expect(chatClient.sendMessage(request)).rejects.toThrow(
        /Request timed out/i
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should handle 429 rate limit error', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ success: false, error: 'Rate limit exceeded' })
      } as Response);

      const request: ChatRequest = { message: 'Test message' };

      await expect(chatClient.sendMessage(request)).rejects.toThrow(
        /high demand.*wait a moment/i
      );
    });
  });

  describe('Server Errors', () => {
    it('should retry on 500 server error', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // First two attempts return 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: 'Internal server error' })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: 'Internal server error' })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, response: 'Success after retry' })
        } as Response);

      const request: ChatRequest = { message: 'Test message' };
      const response = await chatClient.sendMessage(request);

      expect(response.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries on server error', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ success: false, error: 'Service unavailable' })
      } as Response);

      const request: ChatRequest = { message: 'Test message' };

      await expect(chatClient.sendMessage(request)).rejects.toThrow(
        /temporarily unavailable/i
      );

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Invalid Responses', () => {
    it('should handle malformed JSON response', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      const request: ChatRequest = { message: 'Test message' };

      await expect(chatClient.sendMessage(request)).rejects.toThrow();
    });

    it('should handle 400 bad request', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Invalid request format' })
      } as Response);

      const request: ChatRequest = { message: 'Test message' };

      await expect(chatClient.sendMessage(request)).rejects.toThrow(
        /Invalid request format/i
      );
    });
  });

  describe('Health Check', () => {
    it('should return true when health check succeeds', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        ok: true
      } as Response);

      const result = await chatClient.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await chatClient.healthCheck();

      expect(result).toBe(false);
    });
  });
});
