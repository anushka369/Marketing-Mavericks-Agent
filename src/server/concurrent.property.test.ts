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

describe('Concurrent Request Property Tests', () => {
  jest.setTimeout(60000); // Longer timeout for concurrent tests

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Feature: marketing-mavericks-agent, Property 12: Concurrent request handling
  // Validates: Requirements 6.2
  test('Property 12: For any set of concurrent user requests, all requests should complete successfully without errors', async () => {
    // Mock responses with slight delays to simulate real processing
    mockedGenerateContent.mockImplementation(async (message) => {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      return `Response to: ${message}`;
    });

    // Generator for valid messages
    const validMessageGenerator = fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        fc.array(validMessageGenerator, { minLength: 2, maxLength: 10 }),
        async (messages) => {
          // Send all requests concurrently
          const requests = messages.map(message =>
            request(app)
              .post('/api/chat')
              .send({ message })
          );

          // Wait for all requests to complete
          const responses = await Promise.all(requests);

          // Verify all requests succeeded
          responses.forEach((response, index) => {
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.response).toBeDefined();
            expect(typeof response.body.response).toBe('string');
            expect(response.body.response.length).toBeGreaterThan(0);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
