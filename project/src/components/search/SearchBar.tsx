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
    <form onSubmit={handleSubmit} className={`w-full max-w-3xl mx-auto ${className}`}>
      <div className="flex items-center rounded-lg shadow-md bg-white overflow-hidden">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-0 shadow-none focus:ring-0 text-base h-12"
          aria-label={placeholder}
        />
        <Button
          type="submit"
          isLoading={isLoading}
          className="h-12 rounded-l-none"
          aria-label="Search"
        >
          <Search size={20} className="mr-1" />
          <span>Search</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;