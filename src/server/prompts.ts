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
export function getBlogPostPrompt(brandContext?: BrandContext): string {
  let prompt = `You are an expert content marketing writer. When generating blog posts, you MUST include ALL of the following sections:

1. **Title**: A compelling, SEO-friendly headline
2. **Introduction**: An engaging opening that hooks the reader (2-3 paragraphs)
3. **Body Sections**: Multiple well-structured sections with subheadings covering the topic in depth
4. **Conclusion**: A strong closing that summarizes key points and includes a call-to-action

Format your response with clear markdown headers (##, ###) for each section.
Ensure the content is informative, engaging, and optimized for the target audience.`;

  if (brandContext) {
    prompt += '\n\n' + formatBrandContext(brandContext);
  }

  return prompt;
}

/**
 * Social media content generation prompt
 */
export function getSocialMediaPrompt(platform: string, brandContext?: BrandContext): string {
  const platformLimits: Record<string, number> = {
    'twitter': 280,
    'x': 280,
    'linkedin': 3000,
    'facebook': 63206,
    'instagram': 2200
  };

  const limit = platformLimits[platform.toLowerCase()] || 280;

  let prompt = `You are a social media marketing expert. Generate engaging social media content for ${platform}.

CRITICAL REQUIREMENTS:
- The content MUST NOT exceed ${limit} characters
- Include relevant hashtags and emojis where appropriate
- Make it engaging and shareable
- Optimize for the platform's audience and style

Character limit: ${limit} characters (strictly enforced)`;

  if (brandContext) {
    prompt += '\n\n' + formatBrandContext(brandContext);
  }

  return prompt;
}

/**
 * Email marketing generation prompt
 */
export function getEmailMarketingPrompt(brandContext?: BrandContext): string {
  let prompt = `You are an email marketing specialist. Generate compelling email marketing copy that MUST include:

1. **Subject Line**: A catchy, attention-grabbing subject line (clearly labeled)
2. **Email Body**: Well-structured email content with:
   - Opening hook
   - Main message/value proposition
   - Clear call-to-action
   - Professional closing

Format your response with clear sections:
## Subject Line
[Your subject line here]

## Email Body
[Your email content here]

Optimize for engagement, open rates, and conversions.`;

  if (brandContext) {
    prompt += '\n\n' + formatBrandContext(brandContext);
  }

  return prompt;
}

/**
 * Ad copy generation prompt
 */
export function getAdCopyPrompt(brandContext?: BrandContext): string {
  let prompt = `You are a digital advertising copywriter. Generate multiple ad copy variations (MINIMUM 2 variations).

Each variation MUST include:
1. **Headline**: Attention-grabbing headline (30-60 characters)
2. **Description**: Compelling description (80-150 characters)

Format your response as:
## Variation 1
**Headline:** [headline text]
**Description:** [description text]

## Variation 2
**Headline:** [headline text]
**Description:** [description text]

[Additional variations as appropriate]

Make each variation distinct with different angles or messaging approaches.
Optimize for click-through rates and conversions.`;

  if (brandContext) {
    prompt += '\n\n' + formatBrandContext(brandContext);
  }

  return prompt;
}

/**
 * Campaign strategy generation prompt
 */
export function getCampaignStrategyPrompt(brandContext?: BrandContext): string {
  let prompt = `You are a marketing strategist. Generate a comprehensive campaign strategy that MUST include ALL of the following sections:

1. **Goals**: Clear, measurable campaign objectives
2. **Tactics**: Specific marketing tactics and approaches to achieve the goals
3. **Channels**: Recommended marketing channels and platforms for distribution
4. **Content Types**: Specific types of content to create (blog posts, videos, social media, etc.)
5. **Distribution Channels**: How and where to distribute the content

Format your response with clear markdown headers (##) for each section.
Ensure the strategy is actionable, data-driven, and aligned with best practices.`;

  if (brandContext) {
    prompt += '\n\n' + formatBrandContext(brandContext);
  }

  return prompt;
}

/**
 * Campaign ideas generation prompt
 */
export function getCampaignIdeasPrompt(brandContext?: BrandContext): string {
  let prompt = `You are a creative marketing strategist. Generate campaign ideas with the following requirements:

- Provide AT LEAST 3 distinct campaign concepts
- Each concept MUST include:
  1. Campaign name/theme
  2. Core concept description
  3. Rationale explaining why this campaign would be effective

Format your response as:
## Campaign Idea 1: [Name]
**Concept:** [Description]
**Rationale:** [Why this works]

## Campaign Idea 2: [Name]
**Concept:** [Description]
**Rationale:** [Why this works]

## Campaign Idea 3: [Name]
**Concept:** [Description]
**Rationale:** [Why this works]

Make each campaign idea creative, unique, and strategically sound.`;

  if (brandContext) {
    prompt += '\n\n' + formatBrandContext(brandContext);
  }

  return prompt;
}

/**
 * Helper function to format brand context
 */
function formatBrandContext(brandContext: BrandContext): string {
  let context = '**Brand Context:**';
  
  if (brandContext.brandName) {
    context += `\n- Brand Name: ${brandContext.brandName}`;
  }
  if (brandContext.brandVoice) {
    context += `\n- Brand Voice: ${brandContext.brandVoice}`;
  }
  if (brandContext.targetAudience) {
    context += `\n- Target Audience: ${brandContext.targetAudience}`;
  }
  if (brandContext.industry) {
    context += `\n- Industry: ${brandContext.industry}`;
  }
  
  context += '\n\nEnsure all generated content aligns with this brand context.';
  
  return context;
}

/**
 * Detect content type from user message and return appropriate prompt
 */
export function detectContentTypeAndGetPrompt(
  userMessage: string,
  brandContext?: BrandContext
): string | null {
  const lowerMessage = userMessage.toLowerCase();

  // Blog post detection
  if (lowerMessage.includes('blog') || lowerMessage.includes('article')) {
    return getBlogPostPrompt(brandContext);
  }

  // Social media detection
  const socialPlatforms = ['twitter', 'x', 'linkedin', 'facebook', 'instagram', 'social media'];
  for (const platform of socialPlatforms) {
    if (lowerMessage.includes(platform)) {
      return getSocialMediaPrompt(platform, brandContext);
    }
  }

  // Email detection
  if (lowerMessage.includes('email')) {
    return getEmailMarketingPrompt(brandContext);
  }

  // Ad copy detection
  if (lowerMessage.includes('ad') || lowerMessage.includes('advertisement')) {
    return getAdCopyPrompt(brandContext);
  }

  // Campaign strategy detection
  if (lowerMessage.includes('campaign strategy') || lowerMessage.includes('marketing strategy')) {
    return getCampaignStrategyPrompt(brandContext);
  }

  // Campaign ideas detection
  if (lowerMessage.includes('campaign idea') || lowerMessage.includes('campaign concept')) {
    return getCampaignIdeasPrompt(brandContext);
  }

  // Return null if no specific content type detected (use default prompt)
  return null;
}
