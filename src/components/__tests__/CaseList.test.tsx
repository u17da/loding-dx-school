import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CaseList from '../CaseList';

vi.mock('../CaseCard', () => ({
  default: ({ id, title }: { id: string; title: string }) => 
    React.createElement('div', { 'data-testid': `case-card-${id}` }, title)
}));

describe('CaseList Component', () => {
  const mockCases = [
    {
      id: '1',
      title: 'Case 1',
      summary: 'Summary 1',
      tags: ['Tag1', 'Tag2'],
      image_url: 'https://example.com/image1.jpg',
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Case 2',
      summary: 'Summary 2',
      tags: ['Tag3', 'Tag4'],
      image_url: 'https://example.com/image2.jpg',
      created_at: '2023-01-02T00:00:00Z',
    },
  ];

  it('renders case cards when cases are provided', () => {
    render(React.createElement(CaseList, {
      cases: mockCases,
      isLoading: false,
      error: null,
      hasMore: false,
      onLoadMore: vi.fn(),
    }));
    
    expect(screen.getByTestId('case-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('case-card-2')).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true and no cases', () => {
    render(React.createElement(CaseList, {
      cases: [],
      isLoading: true,
      error: null,
      hasMore: false,
      onLoadMore: vi.fn(),
    }));
    
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders error message when error is provided', () => {
    const errorMessage = 'Failed to load cases';
    render(React.createElement(CaseList, {
      cases: [],
      isLoading: false,
      error: errorMessage,
      hasMore: false,
      onLoadMore: vi.fn(),
    }));
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state when no cases and not loading', () => {
    render(React.createElement(CaseList, {
      cases: [],
      isLoading: false,
      error: null,
      hasMore: false,
      onLoadMore: vi.fn(),
    }));
    
    expect(screen.getByText('まだDX失敗事例が登録されていません。新しい事例を登録してみましょう。')).toBeInTheDocument();
  });

  it('calls onLoadMore when load more button is clicked', () => {
    const onLoadMore = vi.fn();
    render(React.createElement(CaseList, {
      cases: mockCases,
      isLoading: false,
      error: null,
      hasMore: true,
      onLoadMore,
    }));
    
    const loadMoreButton = screen.getByText('もっと読み込む');
    fireEvent.click(loadMoreButton);
    
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
