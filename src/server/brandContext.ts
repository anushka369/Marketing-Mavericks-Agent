import { BrandContext } from './openai';

/**
 * In-memory brand context storage
 * Maps session IDs to brand contexts
 */
class BrandContextStore {
  private contexts: Map<string, BrandContext>;

  constructor() {
    this.contexts = new Map();
  }

  /**
   * Store brand context for a session
   */
  set(sessionId: string, context: BrandContext): void {
    this.contexts.set(sessionId, { ...context });
  }

  /**
   * Retrieve brand context for a session
   */
  get(sessionId: string): BrandContext | undefined {
    const context = this.contexts.get(sessionId);
    return context ? { ...context } : undefined;
  }

  /**
   * Update brand context for a session (merges with existing)
   */
  update(sessionId: string, context: Partial<BrandContext>): void {
    const existing = this.contexts.get(sessionId) || {};
    this.contexts.set(sessionId, { ...existing, ...context });
  }

  /**
   * Check if a session has brand context
   */
  has(sessionId: string): boolean {
    return this.contexts.has(sessionId);
  }

  /**
   * Delete brand context for a session
   */
  delete(sessionId: string): boolean {
    return this.contexts.delete(sessionId);
  }

  /**
   * Clear all stored contexts
   */
  clear(): void {
    this.contexts.clear();
  }

  /**
   * Get number of stored contexts
   */
  size(): number {
    return this.contexts.size;
  }
}

// Export singleton instance
export const brandContextStore = new BrandContextStore();

// Export class for testing
export { BrandContextStore };
