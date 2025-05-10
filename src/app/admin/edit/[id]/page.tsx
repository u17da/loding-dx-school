'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { PostgrestError } from '@supabase/supabase-js';

type Case = {
  id: string;
  title: string;
  summary: string;
  tags: string | string[];
  image_url: string;
};

export default function EditCasePage() {
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
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClientComponentClient();

  const fetchCase = useCallback(async (caseId: string) => {
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
        setTitle(data.title);
        setSummary(data.summary);
        
        if (typeof data.tags === 'string') {
          try {
            const parsedTags = JSON.parse(data.tags);
            setTags(Array.isArray(parsedTags) ? parsedTags.join(', ') : '');
          } catch {
            setTags('');
          }
        } else if (Array.isArray(data.tags)) {
          setTags(data.tags.join(', '));
        }
        
        setImageUrl(data.image_url);
      }
    } catch (err: unknown) {
      const pgError = err as PostgrestError;
      setError(pgError.message || 'ケースの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (id) {
      fetchCase(id);
    }
  }, [id, fetchCase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !summary.trim() || !imageUrl.trim()) {
      setError('すべての必須フィールドを入力してください。');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const { error } = await supabase
        .from('cases')
        .update({
          title,
          summary,
          tags: JSON.stringify(tagsArray),
          image_url: imageUrl
        })
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('ケースが正常に更新されました。');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: unknown) {
      const pgError = err as PostgrestError;
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!caseData && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ケースが見つかりませんでした。
        </div>
        <div className="text-center mt-4">
          <Link href="/admin" className="text-primary hover:underline">
            管理者ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">ケースの編集</h1>
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          ダッシュボードに戻る
        </Link>
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

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="summary" className="block text-gray-700 text-sm font-bold mb-2">
            概要 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">
            タグ (カンマ区切り)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="タグ1, タグ2, タグ3"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="image_url" className="block text-gray-700 text-sm font-bold mb-2">
            画像URL <span className="text-red-500">*</span>
          </label>
          <input
            id="image_url"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
          {imageUrl && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">プレビュー:</p>
              <div className="relative w-full max-w-full h-48">
                <Image
                  src={imageUrl}
                  alt="プレビュー"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
