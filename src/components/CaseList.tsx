import React from 'react';
import CaseCard from './CaseCard';

interface Case {
  id: string;
  title: string;
  summary: string;
  tags: string[] | string; // Can be array or JSON string from Supabase
  image_url: string;
  created_at: string;
}

interface CaseListProps {
  cases: Case[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
}

const CaseList: React.FC<CaseListProps> = ({ 
  cases, 
  isLoading, 
  error, 
  hasMore, 
  onLoadMore 
}) => {
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg inline-block">
          <p className="font-semibold">エラーが発生しました</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading && cases.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="bg-gray-200 h-48 w-full mb-4 rounded-t-2xl"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cases.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-text-light">
          まだDX失敗事例が登録されていません。新しい事例を登録してみましょう。
        </p>
        <div className="mt-4">
          <a href="/submit" className="btn">
            事例を登録する
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            id={caseItem.id}
            title={caseItem.title}
            summary={caseItem.summary}
            tags={caseItem.tags}
            imageUrl={caseItem.image_url}
          />
        ))}
      </div>
      
      {isLoading && (
        <div className="text-center mt-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-text-light">読み込み中...</p>
        </div>
      )}
      
      {hasMore && !isLoading && (
        <div className="text-center mt-8">
          <button 
            onClick={onLoadMore}
            className="btn px-8"
          >
            もっと読み込む
          </button>
        </div>
      )}
    </div>
  );
};

export default CaseList;
