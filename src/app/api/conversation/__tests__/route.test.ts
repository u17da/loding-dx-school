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
      content?: string;
      function_call?: {
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
  
  it('processes initial submission and transitions to asking for details', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'user', content: 'プログラミングの授業でScratchを使おうとして自宅で教材研究をしていたのですが、いざ学校で試してみるとそもそも学校ではフィルタリングの制限でScratchにアクセスできなかった。教材研究の数時間が無駄になってしまった…。' }
      ],
      conversationState: 'waiting_for_initial_submission',
      conversationData: {}
    });
    
    const mockOpenAIResponse: OpenAIResponse = {
      choices: [
        {
          message: {
            content: 'それは大変でしたね。せっかく準備したのに使えないなんて残念です。他に何か詳しく教えていただけますか？',
            function_call: {
              name: 'extract_conversation_data',
              arguments: JSON.stringify({
                summary: 'プログラミングの授業でScratchが学校のフィルタリングで使えなかった',
                location: '学校',
                who: '教師'
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
    expect(data.message).toBe('それは大変でしたね。せっかく準備したのに使えないなんて残念です。他に何か詳しく教えていただけますか？');
    expect(data.conversationData).toEqual({
      summary: 'プログラミングの授業でScratchが学校のフィルタリングで使えなかった',
      location: '学校',
      who: '教師'
    });
    expect(data.nextState).toBe('asking_for_additional_details');
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
  
  it('transitions to asking for suggestions after gathering details', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'assistant', content: 'どのような影響がありましたか？' },
        { role: 'user', content: '授業が予定通り進まず、急遽別の内容に変更する必要がありました。生徒も混乱していました。' },
        { role: 'assistant', content: 'それは大変でしたね。他に何か教えていただけますか？' },
        { role: 'user', content: '事前に学校のネットワーク環境を確認しておくべきでした。' }
      ],
      conversationState: 'asking_for_additional_details',
      conversationData: {
        summary: 'プログラミングの授業でScratchが学校のフィルタリングで使えなかった',
        location: '学校',
        who: '教師'
      }
    });
    
    const mockOpenAIResponse: OpenAIResponse = {
      choices: [
        {
          message: {
            content: 'なるほど、事前確認が大切ですね。この経験から、今後同じような状況を避けるためにどのような対策が考えられますか？',
            function_call: {
              name: 'extract_conversation_data',
              arguments: JSON.stringify({
                impact: '授業が予定通り進まず、急遽別の内容に変更する必要があった。生徒も混乱した。',
                suggestions: '事前に学校のネットワーク環境を確認しておくべきだった。'
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
    expect(data.message).toBe('なるほど、事前確認が大切ですね。この経験から、今後同じような状況を避けるためにどのような対策が考えられますか？');
    expect(data.conversationData).toEqual({
      summary: 'プログラミングの授業でScratchが学校のフィルタリングで使えなかった',
      location: '学校',
      who: '教師',
      impact: '授業が予定通り進まず、急遽別の内容に変更する必要があった。生徒も混乱した。',
      suggestions: '事前に学校のネットワーク環境を確認しておくべきだった。'
    });
    expect(data.nextState).toBe('asking_for_suggestions');
    expect(data.complete).toBe(false);
  });
  
  it('completes conversation when advice is provided', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'assistant', content: 'この経験から、今後同じような状況を避けるためにどのような対策が考えられますか？' },
        { role: 'user', content: '事前に学校の環境を確認することと、オフラインでも使えるバックアッププランを用意しておくべきだと思います。' }
      ],
      conversationState: 'asking_for_suggestions',
      conversationData: {
        summary: 'プログラミングの授業でScratchが学校のフィルタリングで使えなかった',
        location: '学校',
        who: '教師',
        impact: '授業が予定通り進まず、急遽別の内容に変更する必要があった。生徒も混乱した。'
      }
    });
    
    const mockOpenAIResponse: OpenAIResponse = {
      choices: [
        {
          message: {
            content: 'ありがとうございます！それではいただいた情報でローディングDX事例を生成してみます！',
            function_call: {
              name: 'extract_conversation_data',
              arguments: JSON.stringify({
                suggestions: '事前に学校の環境を確認することと、オフラインでも使えるバックアッププランを用意しておくべき。'
              })
            }
          }
        }
      ]
    };
    
    const mockParagraphSummary = 'プログラミングの授業でScratchを使用する予定で自宅で教材研究をしていましたが、実際に学校で試してみると、学校のフィルタリング制限によりScratchにアクセスできないことが判明しました。その結果、授業が予定通り進まず、急遽内容を変更する必要があり、生徒も混乱しました。この問題を防ぐためには、事前に学校のネットワーク環境を確認し、オフラインでも使えるバックアッププランを用意しておくべきだったと考えられます。';
    
    const mockTagsResponse: OpenAIResponse = {
      choices: [
        {
          message: {
            function_call: {
              name: 'generate_tags_and_title',
              arguments: JSON.stringify({
                tags: ['ネットワーク', '教育', 'プログラミング', '環境確認', 'バックアッププラン'],
                title: 'フィルタリングで使えなかったScratch：事前確認の重要性'
              })
            }
          }
        }
      ]
    };
    
    mockCreate.mockResolvedValueOnce(mockOpenAIResponse);
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: mockParagraphSummary } }] });
    mockCreate.mockResolvedValueOnce(mockTagsResponse);
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toContain('情報が揃いました');
    expect(data.conversationData).toEqual({
      summary: 'プログラミングの授業でScratchが学校のフィルタリングで使えなかった',
      location: '学校',
      who: '教師',
      impact: '授業が予定通り進まず、急遽別の内容に変更する必要があった。生徒も混乱した。',
      suggestions: '事前に学校の環境を確認することと、オフラインでも使えるバックアッププランを用意しておくべき。',
      paragraph_summary: mockParagraphSummary,
      tags: ['ネットワーク', '教育', 'プログラミング', '環境確認', 'バックアッププラン'],
      title: 'フィルタリングで使えなかったScratch：事前確認の重要性'
    });
    expect(data.nextState).toBe('conversation_completed');
    expect(data.complete).toBe(true);
    
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });
  
  it('handles OpenAI API errors gracefully', async () => {
    (mockRequest.json as unknown as MockRequestJson).mockResolvedValue({
      messages: [
        { role: 'user', content: 'テスト用の失敗事例です' }
      ],
      conversationState: 'waiting_for_initial_submission',
      conversationData: {}
    });
    
    mockCreate.mockRejectedValue(new Error('OpenAI API Error'));
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
