'use client';

import { useEffect, useState, useCallback } from 'react';
import Hero from '@/components/Hero';
import CaseList from '@/components/CaseList';
import SearchBar from '@/components/SearchBar';
import TagFilter from '@/components/TagFilter';
import { getSupabase } from '@/lib/supabase';
import { extractUniqueTags } from '@/utils/tagUtils';

interface Case {
  id: string;
  title: string;
  summary: string;
  tags: string[] | string;
  image_url: string;
  created_at: string;
}

const CASES_PER_PAGE = 12;

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [allCases, setAllCases] = useState<Case[]>([]); // Store all cases for tag extraction
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchAllCases = useCallback(async () => {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('cases')
        .select('tags')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAllCases(data as Case[]);
      
      const uniqueTags = extractUniqueTags(data as Case[]);
      setAvailableTags(uniqueTags);
    } catch (err) {
      console.error('Error fetching all cases for tags:', err);
    }
  }, []);

  const fetchCases = useCallback(async (pageNumber: number, query: string, tags: string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = getSupabase();
      const from = (pageNumber - 1) * CASES_PER_PAGE;
      const to = from + CASES_PER_PAGE - 1;
      
      let queryBuilder = supabase
        .from('cases')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,summary.ilike.%${query}%`);
      }
      
      if (tags.length > 0) {
        tags.forEach(tag => {
          queryBuilder = queryBuilder.filter('tags', 'cs', `%${tag}%`);
        });
      }
      
      queryBuilder = queryBuilder.range(from, to);
      
      const { data, error, count } = await queryBuilder;
      
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
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCases();
  }, [fetchAllCases]);

  useEffect(() => {
    fetchCases(page, searchQuery, selectedTags);
  }, [page, searchQuery, selectedTags, fetchCases]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedTags]);

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
  };

  const handleTagsChange = (tags: string[]) => {
    setIsSearching(true);
    setSelectedTags(tags);
  };

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
          
          <div className="mb-8">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="タイトルや内容で検索..."
              className="mb-6"
            />
            
            {availableTags.length > 0 && (
              <TagFilter 
                availableTags={availableTags} 
                onTagsChange={handleTagsChange}
              />
            )}
          </div>
          
          {isSearching && isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-2 text-text-light">検索中...</p>
            </div>
          ) : (
            <CaseList
              cases={cases}
              isLoading={isLoading && !isSearching}
              error={error}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          )}
          
          {!isLoading && !error && cases.length === 0 && (searchQuery || selectedTags.length > 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-lg text-text-light">
                検索条件に一致する事例が見つかりませんでした。
              </p>
              <p className="text-text-light mt-2">
                検索キーワードやタグを変更してみてください。
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
