/**
 * @jest-environment node
 */
import * as fc from 'fast-check';
import request from 'supertest';
import { app, server, brandContextStore } from './index';
import * as openaiModule from './openai';

// Mock the OpenAI module
jest.mock('./openai', () => ({
  ...jest.requireActual('./openai'),
  generateContent: jest.fn(),
}));

const mockedGenerateContent = openaiModule.generateContent as jest.MockedFunction<typeof openaiModule.generateContent>;

describe('Brand Context Property Tests', () => {
  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  beforeEach(() => {
    // Clear brand context store before each test
    brandContextStore.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Feature: marketing-mavericks-agent, Property 11: Brand context persistence
  // Validates: Requirements 5.1
  test('Property 11: For any conversation where brand information is provided, subsequent API calls should include the brand context', async () => {
    // Track what brand context was passed to generateContent
    let capturedBrandContext: any = undefined;
    
    mockedGenerateContent.mockImplementation(async (message, history, brandContext) => {
      capturedBrandContext = brandContext;
      return 'Response with brand context';
    });

    // Generator for brand context
    const brandContextGenerator = fc.record({
      brandName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      brandVoice: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      targetAudience: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      industry: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
    }).filter(ctx => 
      // At least one field should be defined
      ctx.brandName !== undefined || 
      ctx.brandVoice !== undefined || 
      ctx.targetAudience !== undefined || 
      ctx.industry !== undefined
    );

    // Generator for session IDs
    const sessionIdGenerator = fc.string({ minLength: 5, maxLength: 50 });

    // Generator for valid messages
    const messageGenerator = fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        brandContextGenerator,
        sessionIdGenerator,
        messageGenerator,
        messageGenerator,
        async (brandContext, sessionId, firstMessage, secondMessage) => {
          // First request: provide brand context with sessionId
          capturedBrandContext = undefined;
          
          const firstResponse = await request(app)
            .post('/api/chat')
            .send({ 
              message: firstMessage,
              brandContext: brandContext,
              sessionId: sessionId
            })
            .expect(200);
          
          expect(firstResponse.body.success).toBe(true);
          expect(capturedBrandContext).toEqual(brandContext);
          
          // Second request: use same sessionId but don't provide brand context
          capturedBrandContext = undefined;
          
          const secondResponse = await request(app)
            .post('/api/chat')
            .send({ 
              message: secondMessage,
              sessionId: sessionId
            })
            .expect(200);
          
          expect(secondResponse.body.success).toBe(true);
          // Brand context should be retrieved from storage and passed to generateContent
          expect(capturedBrandContext).toEqual(brandContext);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
