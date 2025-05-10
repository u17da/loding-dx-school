import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminEdit from '../../../../../components/admin/edit/AdminEdit';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

const mockFrom = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Case Title',
      summary: 'Test Case Summary',
      tags: JSON.stringify(['tag1', 'tag2']),
      image_url: 'https://example.com/image.jpg',
    },
    error: null,
  });
});
const mockUpdate = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    error: null,
  });
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useParams: () => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
  }),
}));

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    from: mockFrom,
    select: mockSelect,
    single: mockSingle,
    update: mockUpdate,
    eq: mockEq,
  }),
}));

describe('EditCasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the edit form with case data', async () => {
    render(<AdminEdit caseId="123e4567-e89b-12d3-a456-426614174000" />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('ケースの編集')).toBeInTheDocument();
    });
    
    expect(screen.getByDisplayValue('Test Case Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Case Summary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('tag1, tag2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument();
    
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
    expect(screen.getByText('保存する')).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    render(<AdminEdit caseId="123e4567-e89b-12d3-a456-426614174000" />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Case Title')).toBeInTheDocument();
    });
    
    const titleInput = screen.getByDisplayValue('Test Case Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    const summaryInput = screen.getByDisplayValue('Test Case Summary');
    fireEvent.change(summaryInput, { target: { value: 'Updated Summary' } });
    
    const tagsInput = screen.getByDisplayValue('tag1, tag2');
    fireEvent.change(tagsInput, { target: { value: 'tag1, tag2, tag3' } });
    
    fireEvent.click(screen.getByText('保存する'));
    
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('cases');
      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'Updated Title',
        summary: 'Updated Summary',
        tags: JSON.stringify(['tag1', 'tag2', 'tag3']),
        image_url: 'https://example.com/image.jpg',
      });
      expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
    });
    
    expect(screen.getByText('ケースが正常に更新されました。')).toBeInTheDocument();
  });

  it('handles validation errors', async () => {
    render(<AdminEdit caseId="123e4567-e89b-12d3-a456-426614174000" />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Case Title')).toBeInTheDocument();
    });
    
    const titleInput = screen.getByDisplayValue('Test Case Title');
    fireEvent.change(titleInput, { target: { value: '' } });
    
    fireEvent.click(screen.getByText('保存する'));
    
    expect(screen.getByText('すべての必須フィールドを入力してください。')).toBeInTheDocument();
  });

  it('handles cancel button correctly', async () => {
    render(<AdminEdit caseId="123e4567-e89b-12d3-a456-426614174000" />);
    
    await waitFor(() => {
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('キャンセル'));
    
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });
});
