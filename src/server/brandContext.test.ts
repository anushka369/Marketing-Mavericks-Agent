import { BrandContextStore } from './brandContext';
import { BrandContext } from './openai';

describe('BrandContextStore Unit Tests', () => {
  let store: BrandContextStore;

  beforeEach(() => {
    store = new BrandContextStore();
  });

  describe('set and get', () => {
    it('should store and retrieve brand context', () => {
      const sessionId = 'session123';
      const context: BrandContext = {
        brandName: 'TechCorp',
        brandVoice: 'Professional',
        targetAudience: 'Developers',
        industry: 'Technology'
      };

      store.set(sessionId, context);
      const retrieved = store.get(sessionId);

      expect(retrieved).toEqual(context);
    });

    it('should return undefined for non-existent session', () => {
      const retrieved = store.get('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('should return a copy of the context (not reference)', () => {
      const sessionId = 'session123';
      const context: BrandContext = {
        brandName: 'TechCorp'
      };

      store.set(sessionId, context);
      const retrieved = store.get(sessionId);

      // Modify the retrieved context
      if (retrieved) {
        retrieved.brandName = 'Modified';
      }

      // Original stored context should be unchanged
      const retrievedAgain = store.get(sessionId);
      expect(retrievedAgain?.brandName).toBe('TechCorp');
    });
  });

  describe('update', () => {
    it('should merge new context with existing context', () => {
      const sessionId = 'session123';
      const initialContext: BrandContext = {
        brandName: 'TechCorp',
        brandVoice: 'Professional'
      };

      store.set(sessionId, initialContext);
      store.update(sessionId, { targetAudience: 'Developers' });

      const retrieved = store.get(sessionId);
      expect(retrieved).toEqual({
        brandName: 'TechCorp',
        brandVoice: 'Professional',
        targetAudience: 'Developers'
      });
    });

    it('should overwrite existing fields when updating', () => {
      const sessionId = 'session123';
      const initialContext: BrandContext = {
        brandName: 'TechCorp',
        brandVoice: 'Professional'
      };

      store.set(sessionId, initialContext);
      store.update(sessionId, { brandVoice: 'Casual' });

      const retrieved = store.get(sessionId);
      expect(retrieved?.brandVoice).toBe('Casual');
      expect(retrieved?.brandName).toBe('TechCorp');
    });

    it('should create new context if session does not exist', () => {
      const sessionId = 'newsession';
      store.update(sessionId, { brandName: 'NewBrand' });

      const retrieved = store.get(sessionId);
      expect(retrieved).toEqual({ brandName: 'NewBrand' });
    });
  });

  describe('has', () => {
    it('should return true for existing session', () => {
      const sessionId = 'session123';
      store.set(sessionId, { brandName: 'TechCorp' });

      expect(store.has(sessionId)).toBe(true);
    });

    it('should return false for non-existent session', () => {
      expect(store.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing context', () => {
      const sessionId = 'session123';
      store.set(sessionId, { brandName: 'TechCorp' });

      const deleted = store.delete(sessionId);
      expect(deleted).toBe(true);
      expect(store.has(sessionId)).toBe(false);
    });

    it('should return false when deleting non-existent session', () => {
      const deleted = store.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all stored contexts', () => {
      store.set('session1', { brandName: 'Brand1' });
      store.set('session2', { brandName: 'Brand2' });
      store.set('session3', { brandName: 'Brand3' });

      expect(store.size()).toBe(3);

      store.clear();

      expect(store.size()).toBe(0);
      expect(store.has('session1')).toBe(false);
      expect(store.has('session2')).toBe(false);
      expect(store.has('session3')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return correct number of stored contexts', () => {
      expect(store.size()).toBe(0);

      store.set('session1', { brandName: 'Brand1' });
      expect(store.size()).toBe(1);

      store.set('session2', { brandName: 'Brand2' });
      expect(store.size()).toBe(2);

      store.delete('session1');
      expect(store.size()).toBe(1);
    });
  });
});
