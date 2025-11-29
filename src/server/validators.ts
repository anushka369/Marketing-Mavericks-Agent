/**
 * Content structure validators for marketing content
 */

export interface ValidationResult {
  isValid: boolean;
  missingComponents?: string[];
  errors?: string[];
}

/**
 * Validate blog post structure
 * Requirements: Must have title, introduction, body sections, and conclusion
 */
export function validateBlogPostStructure(content: string): ValidationResult {
  const missingComponents: string[] = [];
  
  // Check for title (usually first heading or line)
  const hasTitle = /^#\s+.+/m.test(content) || /^.+\n[=]+/m.test(content) || content.trim().split('\n')[0].length > 0;
  if (!hasTitle) {
    missingComponents.push('title');
  }
  
  // Check for introduction (look for intro-related keywords or first substantial paragraph)
  const hasIntroduction = /introduction|intro|overview/i.test(content) || 
                          content.split('\n\n').filter(p => p.trim().length > 50).length > 0;
  if (!hasIntroduction) {
    missingComponents.push('introduction');
  }
  
  // Check for body sections (multiple headings or substantial paragraphs)
  const headingCount = (content.match(/^#{1,6}\s+.+/gm) || []).length;
  const paragraphCount = content.split('\n\n').filter(p => p.trim().length > 50).length;
  const hasBodySections = headingCount >= 2 || paragraphCount >= 3;
  if (!hasBodySections) {
    missingComponents.push('body sections');
  }
  
  // Check for conclusion
  const hasConclusion = /conclusion|summary|final|closing|in conclusion|to sum up|takeaway/i.test(content);
  if (!hasConclusion) {
    missingComponents.push('conclusion');
  }
  
  return {
    isValid: missingComponents.length === 0,
    missingComponents: missingComponents.length > 0 ? missingComponents : undefined
  };
}

/**
 * Validate email structure
 * Requirements: Must have subject line and email body
 */
export function validateEmailStructure(content: string): ValidationResult {
  const missingComponents: string[] = [];
  
  // Check for subject line section
  const hasSubjectLine = /subject\s*line|subject:/i.test(content);
  if (!hasSubjectLine) {
    missingComponents.push('subject line');
  }
  
  // Check for email body section
  const hasEmailBody = /email\s*body|body:|message:/i.test(content) || 
                       content.split('\n\n').filter(p => p.trim().length > 30).length >= 2;
  if (!hasEmailBody) {
    missingComponents.push('email body');
  }
  
  return {
    isValid: missingComponents.length === 0,
    missingComponents: missingComponents.length > 0 ? missingComponents : undefined
  };
}

/**
 * Validate ad copy structure
 * Requirements: Must have at least 2 variations, each with headline and description
 */
export function validateAdCopyStructure(content: string): ValidationResult {
  const missingComponents: string[] = [];
  const errors: string[] = [];
  
  // Count variations
  const variationMatches = content.match(/variation\s+\d+/gi) || [];
  const variationCount = variationMatches.length;
  
  if (variationCount < 2) {
    errors.push(`Found ${variationCount} variation(s), but at least 2 are required`);
  }
  
  // Check for headlines
  const headlineMatches = content.match(/headline:/gi) || [];
  if (headlineMatches.length < 2) {
    missingComponents.push('headlines (need at least 2)');
  }
  
  // Check for descriptions
  const descriptionMatches = content.match(/description:/gi) || [];
  if (descriptionMatches.length < 2) {
    missingComponents.push('descriptions (need at least 2)');
  }
  
  return {
    isValid: missingComponents.length === 0 && errors.length === 0,
    missingComponents: missingComponents.length > 0 ? missingComponents : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate campaign strategy structure
 * Requirements: Must have goals, tactics, and channels sections
 */
export function validateCampaignStrategyStructure(content: string): ValidationResult {
  const missingComponents: string[] = [];
  
  // Check for goals section (with or without colon, as header or label)
  const hasGoals = /##?\s*goals?|goals?:|objectives?:/i.test(content);
  if (!hasGoals) {
    missingComponents.push('goals');
  }
  
  // Check for tactics section
  const hasTactics = /##?\s*tactics?|tactics?:|approaches?:|strategies?:/i.test(content);
  if (!hasTactics) {
    missingComponents.push('tactics');
  }
  
  // Check for channels section
  const hasChannels = /##?\s*channels?|channels?:|platforms?:/i.test(content);
  if (!hasChannels) {
    missingComponents.push('channels');
  }
  
  // Check for content types (additional requirement from 2.3)
  const hasContentTypes = /##?\s*content\s+types?|content\s+types?:/i.test(content);
  if (!hasContentTypes) {
    missingComponents.push('content types');
  }
  
  // Check for distribution channels (additional requirement from 2.3)
  const hasDistribution = /##?\s*distribution\s+channels?|distribution\s+channels?:|distribution:/i.test(content);
  if (!hasDistribution) {
    missingComponents.push('distribution channels');
  }
  
  return {
    isValid: missingComponents.length === 0,
    missingComponents: missingComponents.length > 0 ? missingComponents : undefined
  };
}

/**
 * Validate campaign ideas structure
 * Requirements: Must have at least 3 campaign ideas, each with rationale
 */
export function validateCampaignIdeasStructure(content: string): ValidationResult {
  const errors: string[] = [];
  const missingComponents: string[] = [];
  
  // Count campaign ideas
  const ideaMatches = content.match(/campaign\s+idea\s+\d+/gi) || 
                      content.match(/##\s+campaign/gi) ||
                      content.match(/\d+\.\s+campaign/gi) || [];
  const ideaCount = ideaMatches.length;
  
  if (ideaCount < 3) {
    errors.push(`Found ${ideaCount} campaign idea(s), but at least 3 are required`);
  }
  
  // Check for rationale sections
  const rationaleMatches = content.match(/rationale:/gi) || [];
  if (rationaleMatches.length < 3) {
    missingComponents.push('rationale for each campaign (need at least 3)');
  }
  
  return {
    isValid: errors.length === 0 && missingComponents.length === 0,
    missingComponents: missingComponents.length > 0 ? missingComponents : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate social media content length for specific platform
 */
export function validateSocialMediaLength(content: string, platform: string): ValidationResult {
  const platformLimits: Record<string, number> = {
    'twitter': 280,
    'x': 280,
    'linkedin': 3000,
    'facebook': 63206,
    'instagram': 2200
  };
  
  const limit = platformLimits[platform.toLowerCase()];
  
  if (!limit) {
    return {
      isValid: false,
      errors: [`Unknown platform: ${platform}`]
    };
  }
  
  // Extract the actual content (remove markdown formatting, headers, etc.)
  const cleanContent = content
    .replace(/^#+\s+.+$/gm, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .trim();
  
  const contentLength = cleanContent.length;
  
  if (contentLength > limit) {
    return {
      isValid: false,
      errors: [`Content length (${contentLength}) exceeds ${platform} limit of ${limit} characters`]
    };
  }
  
  return {
    isValid: true
  };
}
