'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

type Case = {
  id: string;
  title: string;
  summary: string;
  tags: string | string[];
  image_url: string;
};

export default function AdminEdit({ caseId }: { caseId: string }) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .single();

        if (error) throw error;
        
        if (data) {
          setCaseData(data);
          setTitle(data.title || '');
          setSummary(data.summary || '');
          
          if (typeof data.tags === 'string') {
            try {
              const parsedTags = JSON.parse(data.tags);
              setTags(Array.isArray(parsedTags) ? parsedTags.join(', ') : '');
            } catch {
              setTags(data.tags || '');
            }
          } else if (Array.isArray(data.tags)) {
            setTags(data.tags.join(', '));
          }
          
          setImageUrl(data.image_url || '');
        }
      } catch (err: unknown) {
        const pgError = err as { message?: string };
        setError(pgError.message || 'ケースの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const tagsJson = JSON.stringify(tagsArray);

      const { error } = await supabase
        .from('cases')
        .update({
          title,
          summary,
          tags: tagsJson,
          image_url: imageUrl,
        })
        .eq('id', caseId);

      if (error) throw error;
      
      setSuccess('ケースが正常に更新されました。');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: unknown) {
      const pgError = err as { message?: string };
      setError(pgError.message || '更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!caseData && !loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ケースが見つかりませんでした。
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">ケースの編集</h1>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          キャンセル
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 font-bold mb-2">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="summary" className="block text-gray-700 font-bold mb-2">
            概要
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-32"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="tags" className="block text-gray-700 font-bold mb-2">
            タグ（カンマ区切り）
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-sm text-gray-500 mt-1">例: ネットワーク, 端末管理, セキュリティ</p>
        </div>

        <div className="mb-6">
          <label htmlFor="image_url" className="block text-gray-700 font-bold mb-2">
            画像URL
          </label>
          <input
            type="url"
            id="image_url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {imageUrl && (
          <div className="mb-6">
            <p className="block text-gray-700 font-bold mb-2">プレビュー</p>
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt="ケース画像"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-2"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </form>
    </div>
  );
}
