import React, { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  placeholder = "Search for educational videos...",
  className = ""
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-3xl mx-auto group ${className}`}>
      <div className="relative flex items-center bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100 p-1.5 focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200">
        <div className="pl-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={22} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 bg-transparent border-0 focus:ring-0 text-gray-900 placeholder-gray-400 font-medium text-lg outline-none"
          aria-label={placeholder}
        />
        <Button
          type="submit"
          isLoading={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
          aria-label="Search"
        >
          <span>Search</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;