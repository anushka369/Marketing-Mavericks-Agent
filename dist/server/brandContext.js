"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandContextStore = exports.brandContextStore = void 0;
/**
 * In-memory brand context storage
 * Maps session IDs to brand contexts
 */
class BrandContextStore {
    constructor() {
        this.contexts = new Map();
    }
    /**
     * Store brand context for a session
     */
    set(sessionId, context) {
        this.contexts.set(sessionId, { ...context });
    }
    /**
     * Retrieve brand context for a session
     */
    get(sessionId) {
        const context = this.contexts.get(sessionId);
        return context ? { ...context } : undefined;
    }
    /**
     * Update brand context for a session (merges with existing)
     */
    update(sessionId, context) {
        const existing = this.contexts.get(sessionId) || {};
        this.contexts.set(sessionId, { ...existing, ...context });
    }
    /**
     * Check if a session has brand context
     */
    has(sessionId) {
        return this.contexts.has(sessionId);
    }
    /**
     * Delete brand context for a session
     */
    delete(sessionId) {
        return this.contexts.delete(sessionId);
    }
    /**
     * Clear all stored contexts
     */
    clear() {
        this.contexts.clear();
    }
    /**
     * Get number of stored contexts
     */
    size() {
        return this.contexts.size;
    }
}
exports.BrandContextStore = BrandContextStore;
// Export singleton instance
exports.brandContextStore = new BrandContextStore();
//# sourceMappingURL=brandContext.js.map