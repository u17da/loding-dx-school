import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CaseDetailPage from '../page';

vi.mock('next/navigation', () => ({
  useParams: vi.fn().mockReturnValue({ id: '123' }),
  useRouter: vi.fn().mockReturnValue({
    back: vi.fn(),
    push: vi.fn()
  })
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => 
    React.createElement('img', { src, alt, 'data-testid': 'case-image' })
}));

const mockSingleFn = vi.fn();
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingleFn
        })
      })
    })
  })
}));

describe('CaseDetailPage', () => {
  const mockCase = {
    id: '123',
    title: 'Test Case Title',
    summary: 'This is a detailed summary of the test case.',
    tags: ['Tag1', 'Tag2', 'Tag3'],
    image_url: 'https://example.com/image.jpg',
    created_at: '2023-05-10T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockSingleFn.mockReturnValue(new Promise(() => {})); // Never resolves during test
    
    render(<CaseDetailPage />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('renders case details when data is loaded', async () => {
    mockSingleFn.mockResolvedValueOnce({ data: mockCase, error: null });

    render(<CaseDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Case Title')).toBeInTheDocument();
    });
    
    expect(screen.getByText('This is a detailed summary of the test case.')).toBeInTheDocument();
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag2')).toBeInTheDocument();
    expect(screen.getByText('Tag3')).toBeInTheDocument();
    
    const image = screen.getByTestId('case-image');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Case Title');
    
    expect(screen.getByText(/投稿日:/)).toBeInTheDocument();
  });

  it('renders error state when data fetch fails', async () => {
    mockSingleFn.mockResolvedValueOnce({ 
      data: null, 
      error: { message: 'Failed to fetch case' } 
    });

    render(<CaseDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
    
    expect(screen.getByText('事例の取得中にエラーが発生しました。')).toBeInTheDocument();
    expect(screen.getByText('トップページに戻る')).toBeInTheDocument();
  });

  it('renders error state when no data is returned', async () => {
    mockSingleFn.mockResolvedValueOnce({ data: null, error: null });

    render(<CaseDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
    
    expect(screen.getByText('事例の取得中にエラーが発生しました。')).toBeInTheDocument();
  });
});
