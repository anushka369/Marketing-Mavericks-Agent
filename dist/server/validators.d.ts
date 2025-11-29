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
export declare function validateBlogPostStructure(content: string): ValidationResult;
/**
 * Validate email structure
 * Requirements: Must have subject line and email body
 */
export declare function validateEmailStructure(content: string): ValidationResult;
/**
 * Validate ad copy structure
 * Requirements: Must have at least 2 variations, each with headline and description
 */
export declare function validateAdCopyStructure(content: string): ValidationResult;
/**
 * Validate campaign strategy structure
 * Requirements: Must have goals, tactics, and channels sections
 */
export declare function validateCampaignStrategyStructure(content: string): ValidationResult;
/**
 * Validate campaign ideas structure
 * Requirements: Must have at least 3 campaign ideas, each with rationale
 */
export declare function validateCampaignIdeasStructure(content: string): ValidationResult;
/**
 * Validate social media content length for specific platform
 */
export declare function validateSocialMediaLength(content: string, platform: string): ValidationResult;
//# sourceMappingURL=validators.d.ts.map