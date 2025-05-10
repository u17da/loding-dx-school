'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceTime?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'キーワードで検索...',
  className = '',
  debounceTime = 300
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useCallback(
    (value: string) => {
      const handler = setTimeout(() => {
        onSearch(value);
      }, debounceTime);

      return () => {
        clearTimeout(handler);
      };
    },
    [onSearch, debounceTime]
  );

  useEffect(() => {
    const cleanup = debouncedSearch(searchTerm);
    return cleanup;
  }, [searchTerm, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          className="block w-full p-3 pl-10 text-sm text-text border border-gray-300 rounded-lg bg-white focus:ring-primary focus:border-primary"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={handleClear}
            aria-label="クリア"
          >
            <svg
              className="w-4 h-4 text-gray-500 hover:text-gray-700"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
