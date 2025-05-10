'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

type Case = {
  id: string;
  title: string;
  created_at: string;
  tags: string | string[];
};

export default function AdminDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select('id, title, created_at, tags')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (err: any) {
      setError(err.message || 'ケースの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      setCases(cases.filter(c => c.id !== deleteId));
      setDeleteSuccess('ケースが正常に削除されました。');
      
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '削除に失敗しました。');
    } finally {
      setShowConfirmation(false);
      setDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmation(false);
    setDeleteId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseTags = (tags: string | string[]): string[] => {
    if (Array.isArray(tags)) return tags;
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">管理者ダッシュボード</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          ログアウト
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {deleteSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {deleteSuccess}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">ケースがありません。</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">タイトル</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">作成日時</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">タグ</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map((caseItem) => (
                <tr key={caseItem.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{caseItem.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">{caseItem.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(caseItem.created_at)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {parseTags(caseItem.tags).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-accent text-xs px-2 py-1 rounded-full text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/edit/${caseItem.id}`}
                        className="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-700"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(caseItem.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">削除の確認</h3>
            <p className="text-gray-700 mb-6">このケースを削除してもよろしいですか？この操作は元に戻せません。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
