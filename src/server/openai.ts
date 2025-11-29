import OpenAI from 'openai';
import { detectContentTypeAndGetPrompt } from './prompts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface BrandContext {
  brandName?: string;
  brandVoice?: string;
  targetAudience?: string;
  industry?: string;
}

/**
 * Build system prompt for marketing tasks
 */
export function buildSystemPrompt(userMessage: string, brandContext?: BrandContext): string {
  // Try to detect specific content type and use specialized prompt
  const specializedPrompt = detectContentTypeAndGetPrompt(userMessage, brandContext);
  
  if (specializedPrompt) {
    return specializedPrompt;
  }

  // Default general marketing assistant prompt
  let prompt = `You are Marketing Mavericks, an expert AI marketing assistant. You help businesses and marketers create compelling marketing content, develop strategic campaigns, and optimize their marketing efforts.

Your capabilities include:
- Generating blog posts with title, introduction, body sections, and conclusion
- Creating platform-appropriate social media content (Twitter/X: 280 chars, LinkedIn: 3000 chars, etc.)
- Writing email marketing copy with subject lines and body content
- Producing multiple ad copy variations with headlines and descriptions
- Developing comprehensive campaign strategies with goals, tactics, and channels
- Suggesting at least 3 distinct campaign ideas with rationale
- Including recommended content types and distribution channels in strategies

Always maintain a professional, creative, and strategic tone.`;

  if (brandContext) {
    prompt += '\n\nBrand Context:';
    if (brandContext.brandName) {
      prompt += `\n- Brand Name: ${brandContext.brandName}`;
    }
    if (brandContext.brandVoice) {
      prompt += `\n- Brand Voice: ${brandContext.brandVoice}`;
    }
    if (brandContext.targetAudience) {
      prompt += `\n- Target Audience: ${brandContext.targetAudience}`;
    }
    if (brandContext.industry) {
      prompt += `\n- Industry: ${brandContext.industry}`;
    }
    prompt += '\n\nEnsure all generated content aligns with this brand context.';
  }

  return prompt;
}

/**
 * Generate marketing content using OpenAI with retry logic
 */
export async function generateContent(
  userMessage: string,
  conversationHistory: Message[] = [],
  brandContext?: BrandContext,
  maxRetries: number = 3
): Promise<string> {
  const systemPrompt = buildSystemPrompt(userMessage, brandContext);
  
  // Build messages array for OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history
  for (const msg of conversationHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  // Retry logic with exponential backoff
  let lastError: Error | null = null;
  let isRateLimited = false;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error (429)
      if (error && typeof error === 'object' && 'status' in error && (error as any).status === 429) {
        isRateLimited = true;
        console.log(`Rate limited, attempt ${attempt + 1}/${maxRetries}`);
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Check for authentication errors (401)
      if (error && typeof error === 'object' && 'status' in error && (error as any).status === 401) {
        throw new Error('API authentication failed. Please check your OpenAI API key.');
      }
      
      // Check for invalid request errors (400)
      if (error && typeof error === 'object' && 'status' in error && (error as any).status === 400) {
        throw new Error('Invalid request to OpenAI API. Please try rephrasing your message.');
      }
      
      // Check for server errors (500+)
      if (error && typeof error === 'object' && 'status' in error && (error as any).status >= 500) {
        console.log(`OpenAI server error, attempt ${attempt + 1}/${maxRetries}`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error('OpenAI service is temporarily unavailable. Please try again in a moment.');
      }
      
      // For network/connection errors, retry
      if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
        console.log(`Network error, attempt ${attempt + 1}/${maxRetries}`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error('Network connection error. Please check your internet connection and try again.');
      }
      
      // For other errors, retry with shorter delay
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  // All retries failed - provide user-friendly error message
  if (isRateLimited) {
    throw new Error('The service is experiencing high demand. Please wait a moment and try again.');
  }
  
  throw new Error(`Unable to generate content: ${lastError?.message || 'Unknown error'}. Please try again.`);
}

export { openai };
