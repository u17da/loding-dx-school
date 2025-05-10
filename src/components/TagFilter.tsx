'use client';

import React, { useState, useEffect } from 'react';

interface TagFilterProps {
  availableTags: string[];
  onTagsChange: (selectedTags: string[]) => void;
  className?: string;
}

const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  onTagsChange,
  className = ''
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prevTags => {
      const isSelected = prevTags.includes(tag);
      const newTags = isSelected
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag];
      
      return newTags;
    });
  };

  useEffect(() => {
    onTagsChange(selectedTags);
  }, [selectedTags, onTagsChange]);

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  if (!availableTags.length) {
    return null;
  }

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-primary">タグでフィルター</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAllTags}
            className="text-sm text-gray-500 hover:text-primary"
          >
            クリア
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagFilter;
