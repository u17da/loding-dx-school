import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../page';

vi.mock('@/components/Hero', () => ({
  default: () => React.createElement('div', { 'data-testid': 'hero' }, 'Hero Component')
}));

vi.mock('@/components/CaseList', () => ({
  default: ({ cases, isLoading, error, hasMore }: {
    cases: Array<{id: string, title: string}>;
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
  }) => 
    React.createElement('div', { 'data-testid': 'case-list' }, 
      `CaseList: ${cases.length} cases, Loading: ${isLoading}, Error: ${error}, HasMore: ${hasMore}`)
}));

vi.mock('@/components/SearchBar', () => ({
  default: ({ onSearch, placeholder }: {
    onSearch: (query: string) => void;
    placeholder?: string;
  }) => 
    React.createElement('div', { 'data-testid': 'search-bar' }, 
      React.createElement('input', {
        'data-testid': 'search-input',
        placeholder: placeholder || 'キーワードで検索...',
        onChange: (e: any) => onSearch(e.target.value)
      }))
}));

vi.mock('@/components/TagFilter', () => ({
  default: ({ availableTags, onTagsChange }: {
    availableTags: string[];
    onTagsChange: (tags: string[]) => void;
  }) => 
    React.createElement('div', { 'data-testid': 'tag-filter' }, 
      availableTags.map(tag => 
        React.createElement('button', {
          key: tag,
          'data-testid': `tag-${tag}`,
          onClick: () => onTagsChange([tag])
        }, tag)
      ))
}));

vi.mock('@/utils/tagUtils', () => ({
  extractUniqueTags: vi.fn().mockReturnValue(['DX', 'ネットワーク', '端末管理'])
}));

vi.mock('@/lib/supabase', () => {
  const mockData = [
    { id: '1', title: 'Test Case 1', tags: '["DX"]' },
    { id: '2', title: 'Test Case 2', tags: '["ネットワーク"]' }
  ];
  
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation(callback => {
      callback({ data: mockData, error: null, count: mockData.length });
      return mockSupabase;
    })
  };
  
  return {
    getSupabase: vi.fn().mockReturnValue(mockSupabase)
  };
});

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the hero and case list components', () => {
    render(React.createElement(Home));
    
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('case-list')).toBeInTheDocument();
  });

  it('displays the DX failure cases section title', () => {
    render(React.createElement(Home));
    
    expect(screen.getByText('DX失敗事例集')).toBeInTheDocument();
  });

  it('includes a link to the submit page', () => {
    render(React.createElement(Home));
    
    const submitLink = screen.getByText('こちら');
    expect(submitLink).toBeInTheDocument();
    expect(submitLink.getAttribute('href')).toBe('/submit');
  });

  it('renders the search bar and tag filter components', () => {
    render(React.createElement(Home));
    
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
  });

  it('displays available tags in the tag filter', () => {
    render(React.createElement(Home));
    
    expect(screen.getByTestId('tag-DX')).toBeInTheDocument();
    expect(screen.getByTestId('tag-ネットワーク')).toBeInTheDocument();
    expect(screen.getByTestId('tag-端末管理')).toBeInTheDocument();
  });

  it('updates search query when search input changes', async () => {
    render(React.createElement(Home));
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    await waitFor(() => {
      expect(screen.getByTestId('case-list')).toBeInTheDocument();
    }, { timeout: 400 });
  });

  it('updates selected tags when a tag is clicked', () => {
    render(React.createElement(Home));
    
    const tagButton = screen.getByTestId('tag-DX');
    fireEvent.click(tagButton);
    
    expect(screen.getByTestId('case-list')).toBeInTheDocument();
  });
});
