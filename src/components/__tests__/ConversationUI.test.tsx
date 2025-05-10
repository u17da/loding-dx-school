import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConversationUI from '../ConversationUI';

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

describe('ConversationUI', () => {
  const mockOnComplete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    (global.fetch as unknown as { 
  mockImplementation: (callback: (url: string) => Promise<Response>) => void;
  mockImplementationOnce: (callback: ((url: string) => Promise<Response>) | (() => Promise<Response>)) => void;
}).mockImplementation((url: string) => {
      if (url === '/api/conversation') {
        return createMockResponse({
          message: 'その失敗はいつ頃起きましたか？',
          conversationData: {
            summary: 'テスト用の失敗事例です',
          },
          complete: false,
        });
      }
      
      return createMockResponse({});
    });
  });
  
  it('renders the initial assistant message', () => {
    render(<ConversationUI onComplete={mockOnComplete} />);
    
    expect(screen.getByText('どのような失敗だったのか教えてください。')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('メッセージを入力...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });
  
  it('handles user input and displays messages', async () => {
    render(<ConversationUI onComplete={mockOnComplete} />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByRole('button', { name: '送信' });
    
    fireEvent.change(input, { target: { value: 'テスト用の失敗事例です' } });
    fireEvent.click(sendButton);
    
    expect(screen.getByText('テスト用の失敗事例です')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(screen.getByText('その失敗はいつ頃起きましたか？')).toBeInTheDocument();
    });
  });
  
  it('completes the conversation when API returns complete=true', async () => {
    (global.fetch as unknown as { 
  mockImplementation: (callback: (url: string) => Promise<Response>) => void;
  mockImplementationOnce: (callback: ((url: string) => Promise<Response>) | (() => Promise<Response>)) => void;
}).mockImplementationOnce((url: string) => {
      if (url === '/api/conversation') {
        return createMockResponse({
          message: '情報が揃いました。以下の内容で送信してよろしいですか？',
          conversationData: {
            summary: 'テスト用の失敗事例です',
            when: '2025年4月',
            location: '社内開発環境',
            who: '開発チーム',
            impact: 'プロジェクトが遅延した',
            cause: '環境構築の問題',
            suggestions: '自動化ツールの導入',
            tags: ['開発環境', 'ツール', 'プロセス'],
            title: 'テスト失敗事例',
            paragraph_summary: '2025年4月、社内開発環境で開発チームが環境構築の問題に直面し、プロジェクトが遅延しました。この問題を解決するためには、自動化ツールの導入が効果的であると考えられます。',
          },
          complete: true,
        });
      }
      
      return createMockResponse({});
    });
    
    render(<ConversationUI onComplete={mockOnComplete} />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByRole('button', { name: '送信' });
    
    fireEvent.change(input, { target: { value: 'テスト用の失敗事例です' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object));
    });
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        {
          summary: 'テスト用の失敗事例です',
          when: '2025年4月',
          location: '社内開発環境',
          who: '開発チーム',
          impact: 'プロジェクトが遅延した',
          cause: '環境構築の問題',
          suggestions: '自動化ツールの導入',
          tags: ['開発環境', 'ツール', 'プロセス'],
          title: 'テスト失敗事例',
        },
        expect.any(Array)
      );
    });
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
  
  it('handles API errors gracefully', async () => {
    (global.fetch as unknown as { 
  mockImplementation: (callback: (url: string) => Promise<Response>) => void;
  mockImplementationOnce: (callback: ((url: string) => Promise<Response>) | (() => Promise<Response>)) => void;
}).mockImplementationOnce(() => Promise.reject(new Error('API Error')));
    
    render(<ConversationUI onComplete={mockOnComplete} />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByRole('button', { name: '送信' });
    
    fireEvent.change(input, { target: { value: 'テスト用の失敗事例です' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('すみません、エラーが発生しました。もう一度お試しください。')).toBeInTheDocument();
    });
  });
  
  it('shows loading state while waiting for API response', async () => {
    (global.fetch as unknown as { 
  mockImplementation: (callback: (url: string) => Promise<Response>) => void;
  mockImplementationOnce: (callback: ((url: string) => Promise<Response>) | (() => Promise<Response>)) => void;
}).mockImplementationOnce(() => new Promise<Response>(resolve => {
      setTimeout(() => {
        resolve(createMockResponse({
          message: 'その失敗はいつ頃起きましたか？',
          conversationData: {
            summary: 'テスト用の失敗事例です',
          },
          complete: false,
        }));
      }, 100);
    }));
    
    render(<ConversationUI onComplete={mockOnComplete} />);
    
    const input = screen.getByPlaceholderText('メッセージを入力...');
    const sendButton = screen.getByRole('button', { name: '送信' });
    
    fireEvent.change(input, { target: { value: 'テスト用の失敗事例です' } });
    fireEvent.click(sendButton);
    
    expect(screen.getByText('テスト用の失敗事例です')).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('その失敗はいつ頃起きましたか？')).toBeInTheDocument();
    });
    
    expect(input).not.toBeDisabled();
  });
});
