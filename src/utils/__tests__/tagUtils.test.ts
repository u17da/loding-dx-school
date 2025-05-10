import { describe, it, expect } from 'vitest';
import { extractUniqueTags } from '../tagUtils';

describe('tagUtils', () => {
  describe('extractUniqueTags', () => {
    it('extracts unique tags from an array of cases with string[] tags', () => {
      const cases = [
        { tags: ['DX', 'ネットワーク'] },
        { tags: ['DX', '端末管理'] },
        { tags: ['セキュリティ', 'ネットワーク'] }
      ];
      
      const result = extractUniqueTags(cases);
      
      expect(result).toEqual(['DX', 'セキュリティ', 'ネットワーク', '端末管理']);
    });
    
    it('extracts unique tags from an array of cases with JSON string tags', () => {
      const cases = [
        { tags: '["DX", "ネットワーク"]' },
        { tags: '["DX", "端末管理"]' },
        { tags: '["セキュリティ", "ネットワーク"]' }
      ];
      
      const result = extractUniqueTags(cases);
      
      expect(result).toEqual(['DX', 'セキュリティ', 'ネットワーク', '端末管理']);
    });
    
    it('handles mixed tag formats (string[] and JSON string)', () => {
      const cases = [
        { tags: ['DX', 'ネットワーク'] },
        { tags: '["DX", "端末管理"]' },
        { tags: ['セキュリティ', 'ネットワーク'] }
      ];
      
      const result = extractUniqueTags(cases);
      
      expect(result).toEqual(['DX', 'セキュリティ', 'ネットワーク', '端末管理']);
    });
    
    it('handles empty arrays', () => {
      const result = extractUniqueTags([]);
      
      expect(result).toEqual([]);
    });
    
    it('handles invalid JSON strings gracefully', () => {
      const cases = [
        { tags: '["DX", "ネットワーク"]' },
        { tags: 'invalid json' },
        { tags: ['セキュリティ'] }
      ];
      
      const result = extractUniqueTags(cases);
      
      expect(result).toEqual(['DX', 'セキュリティ', 'ネットワーク']);
    });
  });
});
