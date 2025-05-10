import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders correctly with default props', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText('キーワードで検索...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} placeholder="カスタムプレースホルダー" />);
    
    const searchInput = screen.getByPlaceholderText('カスタムプレースホルダー');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearch after debounce time', async () => {
    render(<SearchBar onSearch={mockOnSearch} debounceTime={300} />);
    
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(mockOnSearch).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(300);
    
    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('clears input when clear button is clicked', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    vi.advanceTimersByTime(300);
    
    const clearButton = screen.getByRole('button', { name: 'クリア' });
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    
    vi.advanceTimersByTime(300);
    
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('cancels previous debounce timer when input changes rapidly', () => {
    render(<SearchBar onSearch={mockOnSearch} debounceTime={300} />);
    
    const searchInput = screen.getByRole('searchbox');
    
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    vi.advanceTimersByTime(200);
    
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    vi.advanceTimersByTime(300);
    
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });
});
