'use client';

import React from 'react';
import Link from 'next/link';

interface ModelTabsProps {
  activeModel: string;
  onModelChange: (model: string) => void;
  sortBy: 'featured' | 'newest' | 'popular';
  onSortChange: (sort: 'featured' | 'newest' | 'popular') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  searchSuggestions?: Array<{ id: string; title: string }>;
  showSuggestions?: boolean;
  onSuggestionClick?: () => void;
  searchRef?: React.RefObject<HTMLDivElement | null>;
}

const SORTS: Array<{ value: 'featured' | 'newest' | 'popular'; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
];

const MODELS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Models' },
  { value: 'GPT-Image-2', label: 'GPT Image 2' },
  { value: 'GPT Image', label: 'GPT Image' },
  { value: 'Midjourney v6', label: 'Midjourney' },
  { value: 'SDXL 1.0', label: 'SDXL' },
  { value: 'DALL-E 3', label: 'DALL·E 3' },
  { value: 'Claude 3.5 Sonnet', label: 'Claude' },
];

const ModelTabs: React.FC<ModelTabsProps> = ({
  activeModel,
  onModelChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  totalCount,
  searchSuggestions = [],
  showSuggestions = false,
  onSuggestionClick,
  searchRef,
}) => {
  return (
    <div className="border-b border-zinc-800 pb-3 mb-5 flex flex-col gap-2">
      {/* Row 1: Model Selector + Sort */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {MODELS.map((model) => (
          <button
            key={model.value}
            onClick={() => onModelChange(model.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
              activeModel === model.value
                ? 'bg-zinc-800 text-white ring-1 ring-zinc-600'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            {model.label}
          </button>
        ))}

        {/* Sort Buttons */}
        <div className="ml-auto flex items-center gap-4 flex-shrink-0">
          {SORTS.map((sort) => (
            <button
              key={sort.value}
              onClick={() => onSortChange(sort.value)}
              className={`border-b-2 text-xs transition-all ${
                sortBy === sort.value
                  ? 'text-white border-white'
                  : 'text-zinc-500 hover:text-zinc-300 border-transparent'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Search */}
      <div className="relative flex items-center" ref={searchRef}>
        <svg
          className="absolute left-0 text-zinc-500"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prompts..."
          className="flex-1 pl-8 pr-4 py-2 bg-transparent text-sm outline-none transition-all placeholder:text-zinc-600"
        />

        <span className="text-[10px] text-zinc-600 px-2 py-0.5 rounded bg-zinc-800/50">
          ⌘K
        </span>

        <span className="text-[10px] text-zinc-600 font-mono ml-auto">
          {totalCount}
        </span>

        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
            {searchSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={onSuggestionClick}
                className="block w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all border-b border-zinc-800 last:border-0"
              >
                <span className="text-indigo-400 mr-2">→</span>
                {suggestion.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTabs;
