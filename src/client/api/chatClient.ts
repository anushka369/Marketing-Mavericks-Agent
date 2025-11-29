import { ChatRequest, ChatResponse, Message } from '../types';

const API_TIMEOUT = 30000; // 30 seconds as per requirement 3.2

export class ChatClient {
  private baseUrl: string;
  private maxRetries: number = 2;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a chat message to the API with timeout handling and retry logic
   */
  async sendMessage(request: ChatRequest, retryCount: number = 0): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error (${response.status})`;
        
        // Handle specific status codes
        if (response.status === 429) {
          throw new Error('The service is experiencing high demand. Please wait a moment and try again.');
        }
        
        if (response.status === 408) {
          throw new Error('Request timed out. The response took longer than expected. Please try again.');
        }
        
        if (response.status >= 500) {
          // Retry on server errors
          if (retryCount < this.maxRetries) {
            console.log(`Server error, retrying... (${retryCount + 1}/${this.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.sendMessage(request, retryCount + 1);
          }
          throw new Error('The service is temporarily unavailable. Please try again in a moment.');
        }
        
        throw new Error(errorMessage);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        // Handle abort/timeout errors
        if (error.name === 'AbortError') {
          throw new Error('Request timed out after 30 seconds. Please try again with a simpler request.');
        }
        
        // Handle network errors with retry
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          if (retryCount < this.maxRetries) {
            console.log(`Network error, retrying... (${retryCount + 1}/${this.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return this.sendMessage(request, retryCount + 1);
          }
          throw new Error('Network error. Please check your internet connection and try again.');
        }

        // Re-throw errors with messages (already formatted)
        throw error;
      }

      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const chatClient = new ChatClient();
