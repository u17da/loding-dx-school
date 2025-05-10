import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../page';

vi.mock('@/components/Hero', () => ({
  default: () => React.createElement('div', { 'data-testid': 'hero' }, 'Hero Component')
}));

interface ExampleType {
  id: string;
  title: string;
}

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

vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
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
});
