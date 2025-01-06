import { useState, useCallback } from 'react';
import { AnimeData } from '../types/animeTypes';

type SortConfig = {
  field: keyof AnimeData | 'aired.from';
  order: 'asc' | 'desc';
};

// Хук для сортировки данных
export const useSorting = () => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'aired.from',
    order: 'asc'
  });

  const handleSort = useCallback((field: keyof AnimeData | 'aired.from') => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortData = useCallback((data: AnimeData[]) => {
    const sortedData = [...data];
    
    if (sortConfig.field) {
      sortedData.sort((a, b) => {
        let aValue = sortConfig.field === 'aired.from' 
          ? new Date(a.aired.from).getTime()
          : a[sortConfig.field];
        let bValue = sortConfig.field === 'aired.from'
          ? new Date(b.aired.from).getTime()
          : b[sortConfig.field];

        if (sortConfig.order === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return sortedData;
  }, [sortConfig]);

  return {
    sortConfig,
    handleSort,
    sortData
  };
};