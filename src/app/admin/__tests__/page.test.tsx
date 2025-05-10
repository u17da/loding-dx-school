import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '../page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Test Case 1',
            created_at: '2025-05-10T08:00:00.000Z',
            tags: JSON.stringify(['tag1', 'tag2']),
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            title: 'Test Case 2',
            created_at: '2025-05-09T08:00:00.000Z',
            tags: JSON.stringify(['tag3', 'tag4']),
          },
        ],
        error: null,
      });
    }),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        error: null,
      });
    }),
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin dashboard with cases', async () => {
    render(<AdminDashboard />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('管理者ダッシュボード')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    expect(screen.getByText('Test Case 2')).toBeInTheDocument();
    
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    
    const editButtons = screen.getAllByText('編集');
    const deleteButtons = screen.getAllByText('削除');
    expect(editButtons.length).toBe(2);
    expect(deleteButtons.length).toBe(2);
  });

  it('handles logout correctly', async () => {
    const { auth } = createClientComponentClient();
    const { push } = useRouter();
    
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('ログアウト'));
    
    expect(auth.signOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('shows delete confirmation dialog and handles deletion', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('削除')[0]).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getAllByText('削除')[0]);
    
    expect(screen.getByText('削除の確認')).toBeInTheDocument();
    expect(screen.getByText('このケースを削除してもよろしいですか？この操作は元に戻せません。')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('削除する'));
    
    await waitFor(() => {
      expect(screen.getByText('ケースが正常に削除されました。')).toBeInTheDocument();
    });
  });

  it('cancels deletion when cancel button is clicked', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('削除')[0]).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getAllByText('削除')[0]);
    
    expect(screen.getByText('削除の確認')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('キャンセル'));
    
    await waitFor(() => {
      expect(screen.queryByText('削除の確認')).not.toBeInTheDocument();
    });
  });
});

function createClientComponentClient() {
  return require('@supabase/auth-helpers-nextjs').createClientComponentClient();
}

function useRouter() {
  return require('next/navigation').useRouter();
}
