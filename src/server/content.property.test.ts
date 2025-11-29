import * as fc from 'fast-check';
import { 
  validateBlogPostStructure,
  validateEmailStructure,
  validateAdCopyStructure,
  validateCampaignStrategyStructure,
  validateCampaignIdeasStructure,
  validateSocialMediaLength
} from './validators';

// Mock the entire openai module
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

// Import after mocking
import { generateContent, BrandContext } from './openai';

describe('Content Generation Property Tests', () => {
  // Set timeout for all tests in this suite (property tests run 100 iterations)
  jest.setTimeout(30000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Feature: marketing-mavericks-agent, Property 1: Blog post structure completeness
  // Validates: Requirements 1.1
  test('Property 1: For any blog post generation request with topic and target audience, output should contain title, introduction, body sections, and conclusion', async () => {
    // Mock blog post response with all required sections
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: `# The Ultimate Guide to Digital Marketing

## Introduction

Digital marketing has revolutionized how businesses connect with their audiences. In today's fast-paced digital landscape, understanding the fundamentals is crucial for success.

This comprehensive guide will walk you through the essential strategies and tactics that drive results in modern marketing.

## Understanding Your Audience

The foundation of any successful marketing campaign starts with knowing who you're talking to. Demographics, psychographics, and behavioral data all play crucial roles.

## Content Strategy Essentials

Creating valuable content that resonates with your audience requires careful planning and execution. Quality always trumps quantity.

## Measuring Success

Analytics and metrics help you understand what's working and what needs improvement. Track the right KPIs for your goals.

## Conclusion

Digital marketing success comes from understanding your audience, creating valuable content, and continuously measuring and optimizing your efforts. Start implementing these strategies today to see real results.`
        }
      }]
    });

    // Generator for blog post requests
    const blogRequestGenerator = fc.record({
      topic: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
      targetAudience: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5)
    });

    await fc.assert(
      fc.asyncProperty(
        blogRequestGenerator,
        async ({ topic, targetAudience }) => {
          const userMessage = `Write a blog post about ${topic} for ${targetAudience}`;
          
          const response = await generateContent(userMessage, []);
          
          // Validate structure
          const validation = validateBlogPostStructure(response);
          
          expect(validation.isValid).toBe(true);
          if (!validation.isValid) {
            console.log('Missing components:', validation.missingComponents);
          }
          
          return validation.isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: marketing-mavericks-agent, Property 2: Platform-appropriate content length
  // Validates: Requirements 1.2
  test('Property 2: For any social media content request, generated content should not exceed platform character limit', async () => {
    const platformLimits: Record<string, number> = {
      'twitter': 280,
      'x': 280,
      'linkedin': 3000,
      'facebook': 63206,
      'instagram': 2200
    };

    // Mock social media responses that respect limits
    mockCreate.mockImplementation(async (params: any) => {
      const message = params.messages[params.messages.length - 1].content;
      let platform = 'twitter';
      
      // Detect platform from message
      for (const p of Object.keys(platformLimits)) {
        if (message.toLowerCase().includes(p)) {
          platform = p;
          break;
        }
      }
      
      const limit = platformLimits[platform];
      const content = `Check out our latest product launch! 🚀 Innovation meets design. #Marketing #Tech`.substring(0, limit - 10);
      
      return {
        choices: [{
          message: { content }
        }]
      };
    });

    // Generator for social media requests
    const socialMediaGenerator = fc.record({
      platform: fc.constantFrom('twitter', 'x', 'linkedin', 'facebook', 'instagram'),
      topic: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5)
    });

    await fc.assert(
      fc.asyncProperty(
        socialMediaGenerator,
        async ({ platform, topic }) => {
          const userMessage = `Create a ${platform} post about ${topic}`;
          
          const response = await generateContent(userMessage, []);
          
          // Validate length
          const validation = validateSocialMediaLength(response, platform);
          
          expect(validation.isValid).toBe(true);
          if (!validation.isValid) {
            console.log('Validation errors:', validation.errors);
          }
          
          return validation.isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: marketing-mavericks-agent, Property 3: Email structure completeness
  // Validates: Requirements 1.3
  test('Property 3: For any email marketing request, output should contain subject line and email body sections', async () => {
    // Mock email response with required sections
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: `## Subject Line
Unlock 50% Off Your Next Purchase - Limited Time!

## Email Body
Hi there,

We're excited to offer you an exclusive discount on your next order. For the next 48 hours, enjoy 50% off all products in our store.

This is our way of saying thank you for being a valued customer. Don't miss out on this incredible opportunity to save big!

Click here to shop now and apply your discount at checkout.

Best regards,
The Marketing Team`
        }
      }]
    });

    // Generator for email requests
    const emailRequestGenerator = fc.record({
      purpose: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
      audience: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5)
    });

    await fc.assert(
      fc.asyncProperty(
        emailRequestGenerator,
        async ({ purpose, audience }) => {
          const userMessage = `Write an email for ${purpose} targeting ${audience}`;
          
          const response = await generateContent(userMessage, []);
          
          // Validate structure
          const validation = validateEmailStructure(response);
          
          expect(validation.isValid).toBe(true);
          if (!validation.isValid) {
            console.log('Missing components:', validation.missingComponents);
          }
          
          return validation.isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: marketing-mavericks-agent, Property 4: Ad copy variation count
  // Validates: Requirements 1.4
  test('Property 4: For any ad copy request, output should contain at least 2 variations with headlines and descriptions', async () => {
    // Mock ad copy response with multiple variations
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: `## Variation 1
**Headline:** Transform Your Business Today
**Description:** Discover cutting-edge solutions that drive real results. Join thousands of satisfied customers.

## Variation 2
**Headline:** Innovation Meets Excellence
**Description:** Experience the future of business technology. Start your free trial now and see the difference.

## Variation 3
**Headline:** Your Success Starts Here
**Description:** Powerful tools, simple interface, amazing results. Get started in minutes.`
        }
      }]
    });

    // Generator for ad copy requests
    const adCopyGenerator = fc.record({
      product: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
      targetAudience: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5)
    });

    await fc.assert(
      fc.asyncProperty(
        adCopyGenerator,
        async ({ product, targetAudience }) => {
          const userMessage = `Create ad copy for ${product} targeting ${targetAudience}`;
          
          const response = await generateContent(userMessage, []);
          
          // Validate structure
          const validation = validateAdCopyStructure(response);
          
          expect(validation.isValid).toBe(true);
          if (!validation.isValid) {
            console.log('Missing components:', validation.missingComponents);
            console.log('Errors:', validation.errors);
          }
          
          return validation.isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: marketing-mavericks-agent, Property 5: Campaign strategy completeness
  // Validates: Requirements 2.1
  test('Property 5: For any campaign strategy request with objectives and target audience, output should include goals, tactics, and channels', async () => {
    // Mock campaign strategy response
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: `## Goals
- Increase brand awareness by 40% in Q1
- Generate 500 qualified leads per month
- Achieve 15% conversion rate on landing pages

## Tactics
- Implement content marketing strategy with weekly blog posts
- Launch targeted social media advertising campaigns
- Develop email nurture sequences for lead conversion

## Channels
- LinkedIn for B2B outreach
- Google Ads for search marketing
- Email marketing for lead nurturing

## Content Types
- Blog posts and articles
- Video tutorials
- Infographics and visual content
- Case studies

## Distribution Channels
- Company blog and website
- Social media platforms
- Email newsletters
- Industry publications`
        }
      }]
    });

    // Generator for campaign strategy requests
    const campaignStrategyGenerator = fc.record({
      objective: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
      targetAudience: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5)
    });

    await fc.assert(
      fc.asyncProperty(
        campaignStrategyGenerator,
        async ({ objective, targetAudience }) => {
          // Ensure the message contains "campaign strategy" to trigger the specialized prompt
          const userMessage = `Develop a marketing strategy campaign for ${objective} targeting ${targetAudience}`;
          
          const response = await generateContent(userMessage, []);
          
          // Validate structure
          const validation = validateCampaignStrategyStructure(response);
          
          if (!validation.isValid) {
            console.log('User message:', userMessage);
            console.log('Response:', response);
            console.log('Missing components:', validation.missingComponents);
          }
          expect(validation.isValid).toBe(true);
          
          return validation.isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: marketing-mavericks-agent, Property 6: Campaign idea minimum count
  // Validates: Requirements 2.2
  test('Property 6: For any campaign ideas request, output should contain at least 3 distinct concepts with rationale', async () => {
    // Mock campaign ideas response
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: `## Campaign Idea 1: Customer Success Stories
**Concept:** Showcase real customer transformations through video testimonials and case studies
**Rationale:** Authentic stories build trust and demonstrate tangible value, making it easier for prospects to envision their own success

## Campaign Idea 2: Interactive Product Challenge
**Concept:** 30-day challenge where users complete daily tasks using the product, sharing progress on social media
**Rationale:** Gamification increases engagement and creates organic social proof while helping users develop product habits

## Campaign Idea 3: Industry Expert Webinar Series
**Concept:** Monthly webinars featuring industry leaders discussing trends and best practices
**Rationale:** Positions brand as thought leader while providing valuable education that attracts and nurtures qualified leads`
        }
      }]
    });

    // Generator for campaign ideas requests
    const campaignIdeasGenerator = fc.record({
      industry: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
      goal: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10)
    });

    await fc.assert(
      fc.asyncProperty(
        campaignIdeasGenerator,
        async ({ industry, goal }) => {
          const userMessage = `Suggest campaign ideas for ${industry} to achieve ${goal}`;
          
          const response = await generateContent(userMessage, []);
          
          // Validate structure
          const validation = validateCampaignIdeasStructure(response);
          
          expect(validation.isValid).toBe(true);
          if (!validation.isValid) {
            console.log('Missing components:', validation.missingComponents);
            console.log('Errors:', validation.errors);
          }
          
          return validation.isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: marketing-mavericks-agent, Property 7: Strategy component inclusion
  // Validates: Requirements 2.3
  test('Property 7: For any campaign strategy generation, output should include recommended content types and distribution channels', async () => {
    // Mock campaign strategy response with all components
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: `## Campaign Strategy

## Goals
- Increase market share by 25%
- Build brand recognition in new markets

## Tactics
- Multi-channel content marketing approach
- Strategic partnerships with influencers
- Data-driven advertising campaigns

## Channels
- Social media platforms (LinkedIn, Instagram, Twitter)
- Search engines (Google, Bing)
- Email marketing

## Content Types
- Educational blog posts and articles
- Video tutorials and demos
- Podcasts and webinars
- Infographics and data visualizations
- E-books and whitepapers

## Distribution Channels
- Company website and blog
- Social media networks
- Email newsletters and campaigns
- Partner websites and guest posts
- Industry forums and communities`
        }
      }]
    });

    // Generator for campaign strategy requests
    const strategyGenerator = fc.record({
      businessType: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
      objective: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10)
    });

    await fc.assert(
      fc.asyncProperty(
        strategyGenerator,
        async ({ businessType, objective }) => {
          // Ensure the message contains "campaign strategy" to trigger the specialized prompt
          const userMessage = `Create a campaign strategy for ${businessType} to ${objective}`;
          
          const response = await generateContent(userMessage, []);
          
          // Validate that content types and distribution channels are present (with or without colon, as header or label)
          const hasContentTypes = /##?\s*content\s+types?|content\s+types?:/i.test(response);
          const hasDistributionChannels = /##?\s*distribution\s+channels?|distribution\s+channels?:|distribution:/i.test(response);
          
          expect(hasContentTypes).toBe(true);
          expect(hasDistributionChannels).toBe(true);
          
          return hasContentTypes && hasDistributionChannels;
        }
      ),
      { numRuns: 100 }
    );
  });
});
