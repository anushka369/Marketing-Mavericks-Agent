/**
 * @jest-environment node
 */
import * as fc from 'fast-check';
import request from 'supertest';
import { app, server } from './index';
import * as openaiModule from './openai';

// Mock the OpenAI module
jest.mock('./openai', () => ({
  ...jest.requireActual('./openai'),
  generateContent: jest.fn(),
}));

const mockedGenerateContent = openaiModule.generateContent as jest.MockedFunction<typeof openaiModule.generateContent>;

describe('Chat API Property Tests', () => {
  // Set timeout for all tests in this suite
  jest.setTimeout(35000);

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Feature: marketing-mavericks-agent, Property 8: Response time constraint
  // Validates: Requirements 3.2
  test('Property 8: For any valid user request, the agent should return a response within 30 seconds', async () => {
    // Mock fast responses
    mockedGenerateContent.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms processing
      return 'Mocked marketing content response';
    });

    // Generator for valid messages (non-empty after trimming)
    const validMessageGenerator = fc.string({ minLength: 1, maxLength: 500 })
      .filter(s => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        validMessageGenerator,
        async (message) => {
          const startTime = Date.now();
          
          const response = await request(app)
            .post('/api/chat')
            .send({ message })
            .expect((res) => {
              // Should complete within 30 seconds
              const duration = Date.now() - startTime;
              expect(duration).toBeLessThan(30000);
              
              // Should return success
              expect(res.body.success).toBe(true);
              expect(res.body.response).toBeDefined();
            });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: marketing-mavericks-agent, Property 10: Conversation history maintenance
  // Validates: Requirements 4.3
  test('Property 10: For any sequence of messages, the API should maintain and pass complete conversation history', async () => {
    // Track what history was passed to generateContent
    let capturedHistory: any[] = [];
    
    mockedGenerateContent.mockImplementation(async (message, history) => {
      capturedHistory = history || [];
      return 'Response to: ' + message;
    });

    // Generator for message history
    const messageGenerator = fc.record({
      id: fc.uuid(),
      role: fc.constantFrom('user' as const, 'assistant' as const),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 })
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(messageGenerator, { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (history, newMessage) => {
          capturedHistory = [];
          
          await request(app)
            .post('/api/chat')
            .send({ 
              message: newMessage,
              history: history
            })
            .expect(200);
          
          // Verify that the history passed to generateContent matches what was sent
          expect(capturedHistory).toEqual(history);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
