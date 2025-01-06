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

// Хук для фильтрации данных
export const useFilters = () => {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // Фильтрация по типу аниме
  const handleTypeFilter = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  }, []);

  // Фильтрация по жанрам аниме
  const handleGenreFilter = useCallback((genreId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genreId)
        ? prev.selectedGenres.filter(id => id !== genreId)
        : [...prev.selectedGenres, genreId]
    }));
  }, []);

  // Поиск по названию
  const handleSearch = debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 500);

  // Фильтрация по оценке аниме
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