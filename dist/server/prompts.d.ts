import { BrandContext } from './openai';
/**
 * Marketing prompt templates for different content types
 */
export interface PromptTemplate {
    systemPrompt: string;
    userPromptTemplate: (input: string) => string;
}
/**
 * Blog post generation prompt
 */
export declare function getBlogPostPrompt(brandContext?: BrandContext): string;
/**
 * Social media content generation prompt
 */
export declare function getSocialMediaPrompt(platform: string, brandContext?: BrandContext): string;
/**
 * Email marketing generation prompt
 */
export declare function getEmailMarketingPrompt(brandContext?: BrandContext): string;
/**
 * Ad copy generation prompt
 */
export declare function getAdCopyPrompt(brandContext?: BrandContext): string;
/**
 * Campaign strategy generation prompt
 */
export declare function getCampaignStrategyPrompt(brandContext?: BrandContext): string;
/**
 * Campaign ideas generation prompt
 */
export declare function getCampaignIdeasPrompt(brandContext?: BrandContext): string;
/**
 * Detect content type from user message and return appropriate prompt
 */
export declare function detectContentTypeAndGetPrompt(userMessage: string, brandContext?: BrandContext): string | null;
//# sourceMappingURL=prompts.d.ts.map