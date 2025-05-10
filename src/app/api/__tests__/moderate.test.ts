import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../moderate/route';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const createMockResponse = <T extends object>(data: T): Promise<Response> => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  } as unknown as Response);
};

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      moderations: {
        create: vi.fn().mockImplementation(({ input }) => {
          const isFlagged = input.toLowerCase().includes('violence');
          return Promise.resolve({
            results: [
              {
                flagged: isFlagged,
                categories: {
                  harassment: false,
                  'harassment/threatening': false,
                  hate: false,
                  'hate/threatening': false,
                  'self-harm': false,
                  'self-harm/intent': false,
                  'self-harm/instructions': false,
                  sexual: false,
                  'sexual/minors': false,
                  violence: isFlagged,
                  'violence/graphic': false
                },
                category_scores: {
                  harassment: 0.0,
                  'harassment/threatening': 0.0,
                  hate: 0.0,
                  'hate/threatening': 0.0,
                  'self-harm': 0.0,
                  'self-harm/intent': 0.0,
                  'self-harm/instructions': 0.0,
                  sexual: 0.0,
                  'sexual/minors': 0.0,
                  violence: isFlagged ? 0.9 : 0.0,
                  'violence/graphic': 0.0
                }
              }
            ]
          });
        })
      }
    }))
  };
});

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((data, options) => ({
      data,
      options
    }))
  }
}));

describe('Moderation API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  it('returns 400 if content is missing', async () => {
    const request = new Request('http://localhost:3000/api/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    await POST(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Content text is required' },
      { status: 400 }
    );
  });

  it('returns moderation results for safe content', async () => {
    const request = new Request('http://localhost:3000/api/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'This is safe content.' })
    });

    await POST(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        flagged: false,
        categories: expect.any(Object),
        category_scores: expect.any(Object)
      })
    );
  });

  it('flags content with violent themes', async () => {
    const request = new Request('http://localhost:3000/api/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'This contains violence and should be flagged.' })
    });

    await POST(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        flagged: true,
        categories: expect.objectContaining({
          violence: true
        })
      })
    );
  });

  it('handles API errors gracefully', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

    const request = new Request('http://localhost:3000/api/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Test content' })
    });

    await POST(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to process the moderation request' },
      { status: 500 }
    );
  });
});
