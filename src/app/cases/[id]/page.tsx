'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabase } from '@/lib/supabase';

interface Case {
  id: string;
  title: string;
  summary: string;
  tags: string[] | string; // Can be array or JSON string from Supabase
  image_url: string;
  created_at: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseDetail = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('事例が見つかりませんでした');
        
        setCaseData(data as Case);
      } catch (err) {
        console.error('Error fetching case detail:', err);
        setError('事例の取得中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-light">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-6 rounded-lg inline-block">
            <p className="font-semibold text-lg">エラーが発生しました</p>
            <p>{error || '事例が見つかりませんでした'}</p>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => router.push('/')}
              className="btn"
            >
              トップページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(caseData.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const parseTags = (): string[] => {
    if (Array.isArray(caseData.tags)) {
      return caseData.tags;
    }
    
    try {
      const parsedTags = JSON.parse(caseData.tags as string);
      return Array.isArray(parsedTags) ? parsedTags : [];
    } catch (error) {
      console.error('Error parsing tags:', error);
      return [];
    }
  };
  
  const tagsList = parseTags();

  return (
    <div className="container mx-auto px-4 py-12">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-primary hover:underline mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        戻る
      </button>
      
      <div className="card">
        <div className="relative h-64 md:h-96 lg:h-[500px] w-full mb-6 rounded-t-2xl overflow-hidden">
          <Image
            src={caseData.image_url}
            alt={caseData.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 1200px, 1400px"
            className="object-contain md:object-cover"
            priority
          />
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
            {caseData.title}
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {tagsList.map((tag: string, index: number) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
          
          <p className="text-text-light text-sm md:text-base mb-6">
            <span className="inline-block bg-gray-100 px-2 py-1 rounded">
              投稿日: {formattedDate}
            </span>
          </p>
          
          <div className="prose max-w-none">
            <p className="text-text text-base md:text-lg whitespace-pre-line leading-relaxed">
              {caseData.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
