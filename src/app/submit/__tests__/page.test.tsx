import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitPage from '../page';

global.fetch = vi.fn();

const createMockResponse = <T extends object>(data: T): Promise<Response> => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  } as Partial<Response> as Response);
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
    
    (global.fetch as unknown as { mockImplementation: (callback: (url: string) => Promise<Response>) => void }).mockImplementation((url: string) => {
      if (url === '/api/generate-image-from-summary') {
        return createMockResponse({ imageUrl: 'https://example.com/image.jpg' });
      }
      
      if (url === '/api/moderate') {
        return createMockResponse({ flagged: false });
      }
      
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'それは大変でしたね。もう少し詳しく教えていただけますか？',
          conversationData: {
            title: 'Test DX Failure',
            summary: 'This is a test summary',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
            tags: ['開発環境', 'ツール', 'プロセス']
          },
          nextState: 'asking_for_additional_details',
          complete: false
        });
      }
      
      return createMockResponse({});
    });
  });
  
  it('renders the input form initially', () => {
    render(<SubmitPage />);
    
    expect(screen.getByText('ローディングDX（しくじり）事例を共有してください！')).toBeInTheDocument();
    expect(screen.getByText('あなたの『これは失敗だった…。』という事例をざっくりで良いので教えてください。内容を深掘りさせていただき、こちらでタイトルや画像などを生成しちゃいます。')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('送信する')).toBeInTheDocument();
  });
  
  it('transitions to conversation step after initial input', async () => {
    render(<SubmitPage />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'テスト用の失敗事例です' } });
    
    const submitButton = screen.getByText('送信する');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object));
    });
    
    // Mock the conversation response
    (global.fetch as unknown as { mockImplementation: (callback: (url: string) => Promise<Response>) => void }).mockImplementationOnce((url: string) => {
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'それは大変でしたね。もう少し詳しく教えていただけますか？',
          conversationData: {
            title: 'Test DX Failure',
            summary: 'This is a test summary',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
            tags: ['開発環境', 'ツール', 'プロセス']
          },
          nextState: 'asking_for_additional_details',
          complete: false
        });
      }
      return createMockResponse({});
    });
    
    await waitFor(() => {
      expect(screen.getByText('それは大変でしたね。もう少し詳しく教えていただけますか？')).toBeInTheDocument();
    });
  });
  
  it('completes conversation and transitions to review step', async () => {
    render(<SubmitPage />);
    
    // Initial input
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'テスト用の失敗事例です' } });
    
    const submitButton = screen.getByText('送信する');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object));
    });
    
    // Mock the conversation response with complete=true
    (global.fetch as unknown as { mockImplementation: (callback: (url: string) => Promise<Response>) => void }).mockImplementationOnce((url: string) => {
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'ありがとうございます！それではいただいた情報でローディングDX事例を生成してみます！',
          conversationData: {
            title: 'Test DX Failure',
            summary: 'This is a test summary',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
            tags: ['開発環境', 'ツール', 'プロセス']
          },
          nextState: 'conversation_completed',
          complete: true
        });
      }
      return createMockResponse({});
    });
    
    // Continue conversation
    const messageInput = await waitFor(() => screen.getByPlaceholderText('メッセージを入力...'));
    fireEvent.change(messageInput, { target: { value: '自動化ツールを導入すべきでした' } });
    
    const sendButton = screen.getByText('送信');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test DX Failure')).toBeInTheDocument();
    });
    
    expect(screen.getByText('2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。')).toBeInTheDocument();
    
    expect(screen.getByText('開発環境')).toBeInTheDocument();
    expect(screen.getByText('ツール')).toBeInTheDocument();
    expect(screen.getByText('プロセス')).toBeInTheDocument();
  });
  
  it('submits the case to Supabase after confirmation', async () => {
    render(<SubmitPage />);
    
    // Initial input
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'テスト用の失敗事例です' } });
    
    const submitButton = screen.getByText('送信する');
    fireEvent.click(submitButton);
    
    // Mock the conversation response with complete=true
    (global.fetch as unknown as { mockImplementation: (callback: (url: string) => Promise<Response>) => void }).mockImplementationOnce((url: string) => {
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'ありがとうございます！それではいただいた情報でローディングDX事例を生成してみます！',
          conversationData: {
            title: 'Test DX Failure',
            summary: 'This is a test summary',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
            tags: ['開発環境', 'ツール', 'プロセス']
          },
          nextState: 'conversation_completed',
          complete: true
        });
      }
      return createMockResponse({});
    });
    
    // Skip to review step
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
    (global.fetch as unknown as { mockImplementation: (callback: (url: string) => Promise<Response>) => void }).mockImplementation((url: string) => {
      if (url === '/api/generate-image-from-summary') {
        return createMockResponse({ imageUrl: 'https://example.com/image.jpg' });
      }
      
      if (url === '/api/moderate') {
        return createMockResponse({ flagged: true });
      }
      
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'ありがとうございます！それではいただいた情報でローディングDX事例を生成してみます！',
          conversationData: {
            title: 'Test DX Failure',
            summary: 'This is a test summary',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
            tags: ['開発環境', 'ツール', 'プロセス']
          },
          nextState: 'conversation_completed',
          complete: true
        });
      }
      
      return createMockResponse({});
    });
    
    render(<SubmitPage />);
    
    // Initial input
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'テスト用の失敗事例です' } });
    
    const submitButton = screen.getByText('送信する');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object));
    });
    
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
    (global.fetch as unknown as { mockImplementation: (callback: (url: string) => Promise<Response>) => void }).mockImplementation((url: string) => {
      if (url === '/api/generate-image-from-summary') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to generate image' }),
          headers: new Headers(),
          status: 500,
          statusText: 'Error',
          text: () => Promise.resolve(JSON.stringify({ error: 'Failed to generate image' }))
        } as Response);
      }
      
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'ありがとうございます！それではいただいた情報でローディングDX事例を生成してみます！',
          conversationData: {
            title: 'Test DX Failure',
            summary: 'This is a test summary',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
            tags: ['開発環境', 'ツール', 'プロセス']
          },
          nextState: 'conversation_completed',
          complete: true
        });
      }
      
      return createMockResponse({});
    });
    
    render(<SubmitPage />);
    
    // Initial input
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'テスト用の失敗事例です' } });
    
    const submitButton = screen.getByText('送信する');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('画像の生成中にエラーが発生しました。もう一度お試しください。')).toBeInTheDocument();
    });
  });
  
  it('allows resetting the form after review', async () => {
    (global.fetch as unknown as { mockImplementation: (callback: (url: string) => Promise<Response>) => void }).mockImplementation((url: string) => {
      if (url === '/api/generate-image-from-summary') {
        return createMockResponse({ imageUrl: 'https://example.com/image.jpg' });
      }
      
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'ありがとうございます！それではいただいた情報でローディングDX事例を生成してみます！',
          conversationData: {
            title: 'Test DX Failure',
            summary: 'This is a test summary',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
            tags: ['開発環境', 'ツール', 'プロセス']
          },
          nextState: 'conversation_completed',
          complete: true
        });
      }
      
      return createMockResponse({});
    });
    
    render(<SubmitPage />);
    
    // Initial input
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'テスト用の失敗事例です' } });
    
    const submitButton = screen.getByText('送信する');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-image-from-summary', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('最初からやり直す')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('最初からやり直す'));
    
    expect(screen.getByText('ローディングDX（しくじり）事例を共有してください！')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
