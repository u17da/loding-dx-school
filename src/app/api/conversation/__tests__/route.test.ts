import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import OpenAI from 'openai';

type MockRequestJson = {
  mockResolvedValue: (value: Record<string, unknown>) => void;
};

type OpenAIResponse = {
  choices: Array<{
    message: {
      function_call: {
        name: string;
        arguments: string;
      };
    };
  }>;
};

const mockCreate = vi.fn();
const mockOpenAI = {
  chat: {
    completions: {
      create: mockCreate
    }
  }
};

vi.mock('openai', () => {
  return {
    default: vi.fn(() => mockOpenAI)
  };
});

describe('Conversation API Route', () => {
  let mockRequest: NextRequest;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    mockRequest = {
      json: vi.fn(),
    } as Partial<NextRequest> as NextRequest;
  });
  
  it('returns 400 if messages array is missing', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({});
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid request');
  });
  
  it('returns 400 if last message is not from user', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'assistant', content: 'Hello' }
      ]
    });
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid request');
  });
  
  it('extracts data from conversation and returns next question', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'assistant', content: 'どのような失敗だったのか教えてください。' },
        { role: 'user', content: 'テスト用の失敗事例です' }
      ],
      conversationData: {}
    });
    
    const mockOpenAIResponse: OpenAIResponse = {
      choices: [
        {
          message: {
            function_call: {
              name: 'extract_conversation_data',
              arguments: JSON.stringify({
                summary: 'テスト用の失敗事例です'
              })
            }
          }
        }
      ]
    };
    
    mockCreate.mockResolvedValue(mockOpenAIResponse);
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toBe('その失敗はいつ頃起きましたか？');
    expect(data.conversationData).toEqual({ summary: 'テスト用の失敗事例です' });
    expect(data.complete).toBe(false);
    
    expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o',
        functions: expect.any(Array),
        function_call: expect.any(Object)
      })
    );
  });
  
  it('marks conversation as complete when all data is collected', async () => {
    const completeData = {
      summary: 'テスト用の失敗事例です',
      when: '2025年4月',
      location: '社内開発環境',
      who: '開発チーム',
      impact: 'プロジェクトが遅延した',
      cause: '環境構築の問題',
      suggestions: '自動化ツールの導入'
    };
    
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'assistant', content: 'アドバイスを教えてください。' },
        { role: 'user', content: '自動化ツールの導入が必要です' }
      ],
      conversationData: {
        summary: 'テスト用の失敗事例です',
        when: '2025年4月',
        location: '社内開発環境',
        who: '開発チーム',
        impact: 'プロジェクトが遅延した',
        cause: '環境構築の問題'
      }
    });
    
    const mockOpenAIResponse: OpenAIResponse = {
      choices: [
        {
          message: {
            function_call: {
              name: 'extract_conversation_data',
              arguments: JSON.stringify({
                suggestions: '自動化ツールの導入'
              })
            }
          }
        }
      ]
    };
    
    const mockTagsResponse: OpenAIResponse = {
      choices: [
        {
          message: {
            function_call: {
              name: 'generate_tags_and_title',
              arguments: JSON.stringify({
                tags: ['開発環境', 'ツール', 'プロセス'],
                title: 'テスト失敗事例'
              })
            }
          }
        }
      ]
    };
    
    mockCreate.mockResolvedValueOnce(mockOpenAIResponse);
    mockCreate.mockResolvedValueOnce(mockTagsResponse);
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toContain('情報が揃いました');
    expect(data.conversationData).toEqual({
      ...completeData,
      tags: ['開発環境', 'ツール', 'プロセス'],
      title: 'テスト失敗事例'
    });
    expect(data.complete).toBe(true);
    
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
  
  it('handles OpenAI API errors gracefully', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'assistant', content: 'どのような失敗だったのか教えてください。' },
        { role: 'user', content: 'テスト用の失敗事例です' }
      ],
      conversationData: {}
    });
    
    mockCreate.mockRejectedValue(new Error('OpenAI API Error'));
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
