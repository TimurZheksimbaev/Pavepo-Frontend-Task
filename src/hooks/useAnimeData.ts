import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimeData, Filters } from '../types/animeTypes';
import { DEFAULT_ORDER_BY, DEFAULT_SORT } from '../constants/animeConstants';

// Хук для получения аниме данных
export const useAnimeData = (filters: Filters) => {
  const [data, setData] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Для бесконечной прокрутки
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Получаем данные из API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        order_by: DEFAULT_ORDER_BY,
        sort: DEFAULT_SORT,
        ...(filters.search && { q: filters.search })
      });

      const response = await fetch(
        `https://api.jikan.moe/v4/anime?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
      if (result.data) {
        setData(prev => page === 1 ? result.data : [...prev, ...result.data]);
        setHasMore(result.pagination.has_next_page);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    hasMore,
    lastElementRef,
    setPage,
    setData
  };
};