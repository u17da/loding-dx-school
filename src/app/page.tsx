'use client';

import { useEffect, useState } from 'react';
import Hero from '@/components/Hero';
import CaseList from '@/components/CaseList';
import { getSupabase } from '@/lib/supabase';

interface Case {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  image_url: string;
  created_at: string;
}

const CASES_PER_PAGE = 12;

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchCases = async (pageNumber: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = getSupabase();
      const from = (pageNumber - 1) * CASES_PER_PAGE;
      const to = from + CASES_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('cases')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (pageNumber === 1) {
        setCases(data as Case[]);
      } else {
        setCases(prevCases => [...prevCases, ...(data as Case[])]);
      }
      
      setHasMore(count ? from + data.length < count : false);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('データの取得中にエラーが発生しました。後でもう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(page);
  }, [page]);

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <>
      <Hero />
      <div className="container mx-auto px-4 py-12">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary">
            DX失敗事例集
          </h2>
          <p className="text-text mb-8">
            実際のDX失敗事例を学び、同じ失敗を繰り返さないようにしましょう。
            あなたの経験した失敗事例も<a href="/submit" className="text-primary hover:underline">こちら</a>から投稿できます。
          </p>
          
          <CaseList
            cases={cases}
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </section>
      </div>
    </>
  );
}
