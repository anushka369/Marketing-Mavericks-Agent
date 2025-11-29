import OpenAI from 'openai';
declare const openai: OpenAI;
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
export declare function buildSystemPrompt(userMessage: string, brandContext?: BrandContext): string;
/**
 * Generate marketing content using OpenAI with retry logic
 */
export declare function generateContent(userMessage: string, conversationHistory?: Message[], brandContext?: BrandContext, maxRetries?: number): Promise<string>;
export { openai };
//# sourceMappingURL=openai.d.ts.map