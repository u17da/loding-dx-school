import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CaseCard from '../CaseCard';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt })
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => 
    React.createElement('a', { href }, children)
}));

describe('CaseCard Component', () => {
  const mockCase = {
    id: '123',
    title: 'Test Case Title',
    summary: 'This is a test summary for the case card component that will be displayed in the card.',
    tags: ['Tag1', 'Tag2', 'Tag3'],
    imageUrl: 'https://example.com/image.jpg',
  };

  it('renders the case card with correct data', () => {
    render(React.createElement(CaseCard, mockCase));
    
    expect(screen.getByText('Test Case Title')).toBeInTheDocument();
    expect(screen.getByText('This is a test summary for the case card component that will be displayed in the card.')).toBeInTheDocument();
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag2')).toBeInTheDocument();
    expect(screen.getByText('Tag3')).toBeInTheDocument();
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Case Title');
  });

  it('truncates long summaries to 100 characters', () => {
    const longSummaryCase = {
      ...mockCase,
      summary: 'This is a very long summary that should be truncated because it exceeds the 100 character limit that we have set for the summary display in our case cards. This text should not appear.'
    };

    render(React.createElement(CaseCard, longSummaryCase));
    
    const truncatedText = 'This is a very long summary that should be truncated because it exceeds the 100 character limit that...';
    expect(screen.getByText(truncatedText)).toBeInTheDocument();
  });
});
