import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config.js';

interface NextConfig {
  images?: {
    remotePatterns?: Array<{
      protocol: string;
      hostname: string;
    }>;
  };
}

describe('Next.js Configuration', () => {
  it('should allow OpenAI domains for images', () => {
    const config = nextConfig as NextConfig;
    
    expect(config.images).toBeDefined();
    expect(config.images?.remotePatterns).toBeDefined();
    
    const remotePatterns = config.images?.remotePatterns || [];
    expect(Array.isArray(remotePatterns)).toBe(true);
    
    const hasOpenAIDomain = remotePatterns.some(
      pattern => pattern.hostname === '**.openai.com'
    );
    
    expect(hasOpenAIDomain).toBe(true);
  });
  
  it('should allow DALL-E API blob storage domain for images', () => {
    const config = nextConfig as NextConfig;
    const remotePatterns = config.images?.remotePatterns || [];
    
    const hasDALLEDomain = remotePatterns.some(
      pattern => pattern.hostname === 'oaidalleapiprodscus.blob.core.windows.net'
    );
    
    expect(hasDALLEDomain).toBe(true);
  });
});
