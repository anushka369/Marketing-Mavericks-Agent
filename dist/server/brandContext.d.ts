import { BrandContext } from './openai';
/**
 * In-memory brand context storage
 * Maps session IDs to brand contexts
 */
declare class BrandContextStore {
    private contexts;
    constructor();
    /**
     * Store brand context for a session
     */
    set(sessionId: string, context: BrandContext): void;
    /**
     * Retrieve brand context for a session
     */
    get(sessionId: string): BrandContext | undefined;
    /**
     * Update brand context for a session (merges with existing)
     */
    update(sessionId: string, context: Partial<BrandContext>): void;
    /**
     * Check if a session has brand context
     */
    has(sessionId: string): boolean;
    /**
     * Delete brand context for a session
     */
    delete(sessionId: string): boolean;
    /**
     * Clear all stored contexts
     */
    clear(): void;
    /**
     * Get number of stored contexts
     */
    size(): number;
}
export declare const brandContextStore: BrandContextStore;
export { BrandContextStore };
//# sourceMappingURL=brandContext.d.ts.map