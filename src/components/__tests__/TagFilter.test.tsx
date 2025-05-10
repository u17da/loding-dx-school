import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagFilter from '../TagFilter';

describe('TagFilter', () => {
  const mockOnTagsChange = vi.fn();
  const sampleTags = ['DX', 'ネットワーク', '端末管理', 'セキュリティ'];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with available tags', () => {
    render(
      <TagFilter 
        availableTags={sampleTags} 
        onTagsChange={mockOnTagsChange} 
      />
    );
    
    sampleTags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
    
    expect(screen.getByText('タグでフィルター')).toBeInTheDocument();
  });

  it('does not render when no tags are available', () => {
    const { container } = render(
      <TagFilter 
        availableTags={[]} 
        onTagsChange={mockOnTagsChange} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('calls onTagsChange when a tag is selected', () => {
    render(
      <TagFilter 
        availableTags={sampleTags} 
        onTagsChange={mockOnTagsChange} 
      />
    );
    
    fireEvent.click(screen.getByText('DX'));
    
    expect(mockOnTagsChange).toHaveBeenCalledWith(['DX']);
  });

  it('supports multiple tag selection', () => {
    render(
      <TagFilter 
        availableTags={sampleTags} 
        onTagsChange={mockOnTagsChange} 
      />
    );
    
    fireEvent.click(screen.getByText('DX'));
    fireEvent.click(screen.getByText('ネットワーク'));
    
    expect(mockOnTagsChange).toHaveBeenCalledWith(['DX', 'ネットワーク']);
  });

  it('toggles tag selection on click', () => {
    render(
      <TagFilter 
        availableTags={sampleTags} 
        onTagsChange={mockOnTagsChange} 
      />
    );
    
    fireEvent.click(screen.getByText('DX'));
    
    fireEvent.click(screen.getByText('DX'));
    
    expect(mockOnTagsChange).toHaveBeenCalledWith([]);
  });

  it('clears all selected tags when clear button is clicked', () => {
    render(
      <TagFilter 
        availableTags={sampleTags} 
        onTagsChange={mockOnTagsChange} 
      />
    );
    
    fireEvent.click(screen.getByText('DX'));
    fireEvent.click(screen.getByText('ネットワーク'));
    
    const clearButton = screen.getByText('クリア');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    
    expect(mockOnTagsChange).toHaveBeenCalledWith([]);
  });

  it('applies correct styling to selected tags', () => {
    render(
      <TagFilter 
        availableTags={sampleTags} 
        onTagsChange={mockOnTagsChange} 
      />
    );
    
    const tagButton = screen.getByText('DX');
    
    expect(tagButton).toHaveClass('bg-gray-100');
    expect(tagButton).not.toHaveClass('bg-primary');
    
    fireEvent.click(tagButton);
    
    expect(tagButton).toHaveClass('bg-primary');
    expect(tagButton).toHaveClass('text-white');
  });
});
