import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitPage from '../page';

const createMockResponse = <T extends object>(data: T): Promise<Response> => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  } as unknown as Response);
};

global.fetch = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: [{ id: '123' }], error: null });
    })
  })
}));

describe('SubmitPage with Moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(global.fetch).mockReset();
  });

  it('displays the submit form initially', () => {
    render(<SubmitPage />);
    
    expect(screen.getByText('Submit a DX Failure Scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('DX Failure Scenario')).toBeInTheDocument();
    expect(screen.getByText('Generate Case')).toBeInTheDocument();
  });

  it('shows error when submitting empty input', () => {
    render(<SubmitPage />);
    
    const submitButton = screen.getByText('Generate Case');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Please enter a description of the DX failure scenario.')).toBeInTheDocument();
  });

  it('handles successful moderation and submission', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        title: 'Test Title',
        summary: 'Test Summary',
        tags: ['tag1', 'tag2']
      })
    );
    
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        imageUrl: 'https://example.com/image.jpg'
      })
    );
    
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        flagged: false,
        categories: {},
        category_scores: {}
      })
    );
    
    render(<SubmitPage />);
    
    const textarea = screen.getByLabelText('DX Failure Scenario');
    fireEvent.change(textarea, { target: { value: 'This is a test scenario' } });
    
    const submitButton = screen.getByText('Generate Case');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Confirm & Submit');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText('Submission Successful!')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/analyze', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/generate-image', expect.any(Object));
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/moderate', expect.any(Object));
  });

  it('handles failed moderation and shows message', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        title: 'Test Title',
        summary: 'Test Summary with inappropriate content',
        tags: ['tag1', 'tag2']
      })
    );
    
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        imageUrl: 'https://example.com/image.jpg'
      })
    );
    
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        flagged: true,
        categories: { violence: true },
        category_scores: { violence: 0.9 }
      })
    );
    
    render(<SubmitPage />);
    
    const textarea = screen.getByLabelText('DX Failure Scenario');
    fireEvent.change(textarea, { target: { value: 'This is a test scenario with inappropriate content' } });
    
    const submitButton = screen.getByText('Generate Case');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Confirm & Submit');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText('コンテンツモデレーションに失敗しました')).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/moderate', expect.any(Object));
  });

  it('handles moderation API errors gracefully', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        title: 'Test Title',
        summary: 'Test Summary',
        tags: ['tag1', 'tag2']
      })
    );
    
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      createMockResponse({
        imageUrl: 'https://example.com/image.jpg'
      })
    );
    
    vi.mocked(global.fetch).mockImplementationOnce(() => 
      Promise.reject(new Error('API Error'))
    );
    
    render(<SubmitPage />);
    
    const textarea = screen.getByLabelText('DX Failure Scenario');
    fireEvent.change(textarea, { target: { value: 'This is a test scenario' } });
    
    const submitButton = screen.getByText('Generate Case');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Confirm & Submit');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to save your submission/)).toBeInTheDocument();
    });
  });
});
