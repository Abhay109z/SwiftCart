import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, Clock } from 'lucide-react';
import { Product } from '../types.js';
import { getApiUrl } from '../apiConfig.js';

interface FuzzySearchBarProps {
  onSelectProduct: (product: Product) => void;
  onFilterCategory?: (category: string) => void;
}

export const FuzzySearchBar: React.FC<FuzzySearchBarProps> = ({ onSelectProduct, onFilterCategory }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Instant sub-50ms fuzzy search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLatencyMs(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(getApiUrl(`/api/products/search?q=${encodeURIComponent(query)}`));
        const data = await res.json();
        setResults(data.results || []);
        setLatencyMs(data.latencyMs || 0.4);
        setIsOpen(true);
      } catch (err) {
        console.error('Fuzzy search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 40); // 40ms debounce for ultra-snappy feel

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (p: Product) => {
    onSelectProduct(p);
    setQuery('');
    setIsOpen(false);
  };

  const sampleKeywords = ['Milk', 'Maggi', "Lay's", 'Curd', 'Ice Cream', 'Bread'];

  return (
    <div ref={dropdownRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-stone-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          id="instant-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search for milk, chips, bread, curd, ice cream..."
          className="w-full pl-10 pr-10 py-2.5 bg-white text-stone-900 placeholder:text-stone-500 text-xs sm:text-sm font-medium rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-xs transition-all outline-none"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 p-1 text-stone-400 hover:text-stone-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggested Quick Searches Chips */}
      {!isOpen && (
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
          <span className="text-stone-500 font-medium whitespace-nowrap">Trending:</span>
          {sampleKeywords.map((kw, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(kw);
              }}
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      )}

      {/* Instant Autocomplete Suggestions Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between px-3.5 py-2 bg-stone-50 border-b border-stone-100 text-[11px] text-stone-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Matching Products ({results.length})</span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-stone-500">Searching products...</div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item)}
                  className="flex items-center gap-3 p-2.5 hover:bg-amber-50/50 cursor-pointer transition-colors"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-11 h-11 object-cover rounded-lg border border-stone-200 bg-stone-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-stone-600">
                      {item.unit} • {item.brand}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-stone-900">₹{item.price}</p>
                    {item.mrp > item.price && (
                      <p className="text-[10px] text-stone-400 line-through">₹{item.mrp}</p>
                    )}
                    <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      ⚡ 8-10m
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-xs font-semibold text-stone-700">No items found</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Try searching for "milk", "lays", "bread", or "curd".
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
