import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitPage from '../page';
import ConversationUI from '@/components/ConversationUI';

vi.mock('@/components/ConversationUI', () => ({
  default: vi.fn(({ onComplete }) => {
    return (
      <div data-testid="mock-conversation-ui">
        <button 
          data-testid="complete-conversation-button"
          onClick={() => onComplete(
            {
              title: 'Test DX Failure',
              summary: 'This is a test summary',
              when: '2025年4月',
              location: '社内開発環境',
              who: '開発チーム',
              impact: 'プロジェクトが遅延した',
              cause: '環境構築の問題',
              suggestions: '自動化ツールの導入',
              tags: ['開発環境', 'ツール', 'プロセス']
            },
            [
              { role: 'assistant', content: 'どのような失敗だったのか教えてください。' },
              { role: 'user', content: 'テスト用の失敗事例です' }
            ]
          )}
        >
          Complete Conversation
        </button>
      </div>
    );
  })
}));

global.fetch = vi.fn();

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

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [{ id: '123' }], error: null }))
      }))
    }))
  }))
}));

describe('SubmitPage with Conversational UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/generate-image-from-summary') {
        return createMockResponse({ imageUrl: 'https://example.com/image.jpg' });
      }
      
      if (url === '/api/moderate') {
        return createMockResponse({ flagged: false });
      }
      
      return createMockResponse({});
    });
  });
  
  it('renders the conversation UI initially', () => {
    render(<SubmitPage />);
    
    expect(screen.getByText('DX失敗事例の投稿')).toBeInTheDocument();
    expect(screen.getByText('開発者体験（DX）の失敗事例について、AIアシスタントとの会話形式で情報を入力してください。')).toBeInTheDocument();
    expect(screen.getByTestId('mock-conversation-ui')).toBeInTheDocument();
  });
  
  it('transitions to review step after conversation completion and image generation', async () => {
    render(<SubmitPage />);
    
    fireEvent.click(screen.getByTestId('complete-conversation-button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test DX Failure')).toBeInTheDocument();
    });
    
    expect(screen.getByText('いつ')).toBeInTheDocument();
    expect(screen.getByText('2025年4月')).toBeInTheDocument();
    expect(screen.getByText('どこで')).toBeInTheDocument();
    expect(screen.getByText('社内開発環境')).toBeInTheDocument();
    expect(screen.getByText('誰が')).toBeInTheDocument();
    expect(screen.getByText('開発チーム')).toBeInTheDocument();
    expect(screen.getByText('何が起きたか')).toBeInTheDocument();
    expect(screen.getByText('This is a test summary')).toBeInTheDocument();
    expect(screen.getByText('どうなったか')).toBeInTheDocument();
    expect(screen.getByText('プロジェクトが遅延した')).toBeInTheDocument();
    expect(screen.getByText('原因')).toBeInTheDocument();
    expect(screen.getByText('環境構築の問題')).toBeInTheDocument();
    expect(screen.getByText('改善方法・アドバイス')).toBeInTheDocument();
    expect(screen.getByText('自動化ツールの導入')).toBeInTheDocument();
    
    expect(screen.getByText('開発環境')).toBeInTheDocument();
    expect(screen.getByText('ツール')).toBeInTheDocument();
    expect(screen.getByText('プロセス')).toBeInTheDocument();
  });
  
  it('submits the case to Supabase after confirmation', async () => {
    render(<SubmitPage />);
    
    fireEvent.click(screen.getByTestId('complete-conversation-button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('確認して送信')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('確認して送信'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/moderate', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('送信完了！')).toBeInTheDocument();
    });
    
    expect(screen.getByText('別の事例を投稿する')).toBeInTheDocument();
  });
  
  it('handles moderation failure correctly', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/generate-image-from-summary') {
        return createMockResponse({ imageUrl: 'https://example.com/image.jpg' });
      }
      
      if (url === '/api/moderate') {
        return createMockResponse({ flagged: true });
      }
      
      return createMockResponse({});
    });
    
    render(<SubmitPage />);
    
    fireEvent.click(screen.getByTestId('complete-conversation-button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('確認して送信')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('確認して送信'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/moderate', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('コンテンツモデレーションに失敗しました')).toBeInTheDocument();
    });
  });
  
  it('handles image generation failure correctly', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/generate-image-from-summary') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to generate image' })
        });
      }
      
      return createMockResponse({});
    });
    
    render(<SubmitPage />);
    
    fireEvent.click(screen.getByTestId('complete-conversation-button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('画像の生成中にエラーが発生しました。もう一度お試しください。')).toBeInTheDocument();
    });
  });
  
  it('allows resetting the form after review', async () => {
    render(<SubmitPage />);
    
    fireEvent.click(screen.getByTestId('complete-conversation-button'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('最初からやり直す')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('最初からやり直す'));
    
    expect(screen.getByTestId('mock-conversation-ui')).toBeInTheDocument();
  });
});
