/**
 * @jest-environment node
 */
import request from 'supertest';
import { app, server, brandContextStore } from './index';
import * as openaiModule from './openai';

// Mock the OpenAI module
jest.mock('./openai', () => ({
  ...jest.requireActual('./openai'),
  generateContent: jest.fn(),
}));

const mockedGenerateContent = openaiModule.generateContent as jest.MockedFunction<typeof openaiModule.generateContent>;

describe('API Endpoints Unit Tests', () => {
  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  beforeEach(() => {
    brandContextStore.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'marketing-mavericks-agent');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('POST /api/chat', () => {
    beforeEach(() => {
      mockedGenerateContent.mockResolvedValue('Test marketing response');
    });

    it('should accept valid chat request', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Create a blog post about AI' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBe('Test marketing response');
    });

    it('should accept request with conversation history', async () => {
      const history = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'Hi there!', timestamp: Date.now() }
      ];

      const response = await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Continue our conversation',
          history 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockedGenerateContent).toHaveBeenCalledWith(
        'Continue our conversation',
        history,
        undefined
      );
    });

    it('should accept request with brand context', async () => {
      const brandContext = {
        brandName: 'TechCorp',
        brandVoice: 'Professional and innovative',
        targetAudience: 'Tech professionals',
        industry: 'Technology'
      };

      const response = await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Create an ad',
          brandContext 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockedGenerateContent).toHaveBeenCalledWith(
        'Create an ad',
        [],
        brandContext
      );
    });

    it('should reject empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('message cannot be empty');
    });

    it('should reject whitespace-only message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('message cannot be empty');
    });

    it('should reject missing message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('message is required');
    });

    it('should reject non-string message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('must be a string');
    });

    it('should reject invalid history format', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Test',
          history: 'not an array'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('history must be an array');
    });

    it('should handle OpenAI errors gracefully', async () => {
      mockedGenerateContent.mockRejectedValue(new Error('OpenAI API error'));

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Test message' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to generate response');
    });

    it('should handle timeout errors', async () => {
      mockedGenerateContent.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve('Late response'), 30000))
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Test message' })
        .expect(500);

      expect(response.body.success).toBe(false);
    }, 35000);
  });

  describe('Error Handling Scenarios', () => {
    beforeEach(() => {
      mockedGenerateContent.mockResolvedValue('Test response');
    });

    describe('Network and Timeout Errors', () => {
      it('should handle network timeout gracefully', async () => {
        mockedGenerateContent.mockImplementation(() => 
          new Promise((_, reject) => setTimeout(() => reject(new Error('Generation timeout')), 100))
        );

        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'Test message' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Failed to generate response');
      });

      it('should handle OpenAI connection errors', async () => {
        mockedGenerateContent.mockRejectedValue(new Error('Failed to fetch'));

        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'Test message' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Failed to generate response');
      });
    });

    describe('Rate Limiting Errors', () => {
      it('should handle rate limit errors from OpenAI', async () => {
        const rateLimitError: any = new Error('Rate limit exceeded');
        rateLimitError.status = 429;
        mockedGenerateContent.mockRejectedValue(rateLimitError);

        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'Test message' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Failed to generate response');
      });
    });

    describe('Invalid Input Handling', () => {
      it('should reject message exceeding maximum length', async () => {
        const longMessage = 'a'.repeat(5001);

        const response = await request(app)
          .post('/api/chat')
          .send({ message: longMessage })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('exceeds maximum length');
      });

      it('should sanitize message with null bytes', async () => {
        const messageWithNullBytes = 'Test\0message\0here';

        const response = await request(app)
          .post('/api/chat')
          .send({ message: messageWithNullBytes })
          .expect(200);

        expect(response.body.success).toBe(true);
        // Verify generateContent was called with sanitized message
        expect(mockedGenerateContent).toHaveBeenCalledWith(
          'Test message here',
          [],
          undefined
        );
      });

      it('should normalize excessive whitespace', async () => {
        const messageWithWhitespace = 'Test    message   with    spaces';

        const response = await request(app)
          .post('/api/chat')
          .send({ message: messageWithWhitespace })
          .expect(200);

        expect(response.body.success).toBe(true);
        // Verify generateContent was called with normalized message
        expect(mockedGenerateContent).toHaveBeenCalledWith(
          'Test message with spaces',
          [],
          undefined
        );
      });

      it('should reject history exceeding maximum length', async () => {
        const longHistory = Array(51).fill({
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: Date.now()
        });

        const response = await request(app)
          .post('/api/chat')
          .send({ 
            message: 'Test message',
            history: longHistory
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('history exceeds maximum length');
      });

      it('should reject history with invalid message format', async () => {
        const invalidHistory = [
          { id: '1', role: 'user' } // Missing content
        ];

        const response = await request(app)
          .post('/api/chat')
          .send({ 
            message: 'Test message',
            history: invalidHistory
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('history messages must have role and content');
      });

      it('should reject history with non-string content', async () => {
        const invalidHistory = [
          { id: '1', role: 'user', content: 123, timestamp: Date.now() }
        ];

        const response = await request(app)
          .post('/api/chat')
          .send({ 
            message: 'Test message',
            history: invalidHistory
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('history messages must have role and content');
      });
    });

    describe('Timeout Handling', () => {
      it('should timeout requests exceeding 30 seconds', async () => {
        mockedGenerateContent.mockImplementation(() => 
          new Promise((resolve) => setTimeout(() => resolve('Late response'), 31000))
        );

        const response = await request(app)
          .post('/api/chat')
          .send({ message: 'Test message' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('timeout');
      }, 35000);
    });
  });

  describe('Brand Context Management', () => {
    beforeEach(() => {
      mockedGenerateContent.mockResolvedValue('Test response');
    });

    it('should store brand context when provided with sessionId', async () => {
      const brandContext = {
        brandName: 'TechCorp',
        brandVoice: 'Professional',
        targetAudience: 'Developers',
        industry: 'Technology'
      };
      const sessionId = 'test-session-123';

      await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Create a blog post',
          brandContext,
          sessionId
        })
        .expect(200);

      // Verify context was stored
      expect(brandContextStore.has(sessionId)).toBe(true);
      expect(brandContextStore.get(sessionId)).toEqual(brandContext);
    });

    it('should retrieve stored brand context on subsequent requests', async () => {
      const brandContext = {
        brandName: 'TechCorp',
        brandVoice: 'Professional'
      };
      const sessionId = 'test-session-456';

      // First request with brand context
      await request(app)
        .post('/api/chat')
        .send({ 
          message: 'First message',
          brandContext,
          sessionId
        })
        .expect(200);

      // Second request without brand context but with same sessionId
      await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Second message',
          sessionId
        })
        .expect(200);

      // Verify generateContent was called with stored brand context
      expect(mockedGenerateContent).toHaveBeenLastCalledWith(
        'Second message',
        [],
        brandContext
      );
    });

    it('should generate sessionId when brand context provided without sessionId', async () => {
      const brandContext = {
        brandName: 'TechCorp'
      };

      const response = await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Test message',
          brandContext
        })
        .expect(200);

      // Should return a sessionId
      expect(response.body.sessionId).toBeDefined();
      expect(typeof response.body.sessionId).toBe('string');

      // Verify context was stored with generated sessionId
      const sessionId = response.body.sessionId;
      expect(brandContextStore.has(sessionId)).toBe(true);
      expect(brandContextStore.get(sessionId)).toEqual(brandContext);
    });

    it('should not include brand context when not provided and no stored context', async () => {
      await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Test message'
        })
        .expect(200);

      // Verify generateContent was called without brand context
      expect(mockedGenerateContent).toHaveBeenCalledWith(
        'Test message',
        [],
        undefined
      );
    });

    it('should update stored brand context when new context provided', async () => {
      const sessionId = 'test-session-789';
      const initialContext = {
        brandName: 'TechCorp'
      };
      const updatedContext = {
        brandName: 'TechCorp',
        brandVoice: 'Professional'
      };

      // First request
      await request(app)
        .post('/api/chat')
        .send({ 
          message: 'First message',
          brandContext: initialContext,
          sessionId
        })
        .expect(200);

      // Second request with updated context
      await request(app)
        .post('/api/chat')
        .send({ 
          message: 'Second message',
          brandContext: updatedContext,
          sessionId
        })
        .expect(200);

      // Verify context was updated
      expect(brandContextStore.get(sessionId)).toEqual(updatedContext);
    });
  });
});
