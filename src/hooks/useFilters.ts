import { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { Filters } from '../types/animeTypes';

const initialFilters: Filters = {
  type: [],
  genres: [],
  search: '',
  airedFrom: '',
  year: 0,
  score: { min: 0, max: 10 },
  selectedGenres: []
};

export const useFilters = () => {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleTypeFilter = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  }, []);

  const handleGenreFilter = useCallback((genreId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genreId)
        ? prev.selectedGenres.filter(id => id !== genreId)
        : [...prev.selectedGenres, genreId]
    }));
  }, []);

  const handleSearch = debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 500);

  const handleScoreFilter = debounce((min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      score: { min, max }
    }));
  }, 300);

  return {
    filters,
    setFilters,
    handleTypeFilter,
    handleGenreFilter,
    handleSearch,
    handleScoreFilter
  };
};