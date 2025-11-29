import { BrandContext, Message } from '../types';

/**
 * Extract brand context information from conversation messages
 */
export function extractBrandContext(messages: Message[]): BrandContext {
  const context: BrandContext = {};
  
  // Look through user messages for brand-related information
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase());
  
  const allText = userMessages.join(' ');
  
  // Extract brand name - look for patterns like "my brand is X", "for X brand", "brand: X"
  const brandPatterns = [
    /(?:my brand is|brand is|for|brand:)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+(?:and|which|that|,|\.|$))/i,
    /(?:we are|we're|i'm with|i work for)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+(?:and|which|that|,|\.|$))/i
  ];
  
  for (const pattern of brandPatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) {
      context.brandName = match[1].trim();
      break;
    }
  }
  
  // Extract target audience
  const audiencePatterns = [
    /(?:target audience|audience|targeting|for)\s+(?:is|are|:)?\s*([a-z0-9\s,\-]+?)(?:\s+(?:who|that|and|,|\.|$))/i,
    /(?:customers|clients|users)\s+(?:are|is)?\s*([a-z0-9\s,\-]+?)(?:\s+(?:who|that|and|,|\.|$))/i
  ];
  
  for (const pattern of audiencePatterns) {
    const match = allText.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      context.targetAudience = match[1].trim();
      break;
    }
  }
  
  // Extract industry
  const industryPatterns = [
    /(?:industry|sector|field|in the)\s+(?:is|:)?\s*([a-z\s]+?)(?:\s+(?:industry|sector|space|market|,|\.|$))/i,
    /(?:we're in|work in|operate in)\s+(?:the)?\s*([a-z\s]+?)(?:\s+(?:industry|sector|space|market|,|\.|$))/i
  ];
  
  for (const pattern of industryPatterns) {
    const match = allText.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      context.industry = match[1].trim();
      break;
    }
  }
  
  // Extract brand voice/tone
  const voicePatterns = [
    /(?:tone|voice|style)\s+(?:is|should be|:)?\s*([a-z\s,]+?)(?:\s+(?:and|,|\.|$))/i,
    /(?:sound|be|feel)\s+(?:more)?\s*(professional|casual|friendly|formal|playful|serious|conversational)(?:\s+(?:and|,|\.|$))/i
  ];
  
  for (const pattern of voicePatterns) {
    const match = allText.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      context.brandVoice = match[1].trim();
      break;
    }
  }
  
  return context;
}

/**
 * Merge new context with existing context, preferring newer information
 */
export function mergeBrandContext(existing: BrandContext, newContext: BrandContext): BrandContext {
  return {
    brandName: newContext.brandName || existing.brandName,
    brandVoice: newContext.brandVoice || existing.brandVoice,
    targetAudience: newContext.targetAudience || existing.targetAudience,
    industry: newContext.industry || existing.industry,
  };
}
