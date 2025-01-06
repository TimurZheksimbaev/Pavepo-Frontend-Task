import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { Search} from 'lucide-react';
import styles from './AnimeTable.module.css';
import {availableTypes, DEFAULT_ORDER_BY, DEFAULT_SORT} from '../../constants/animeConstants'
import { AnimeData, Filters, Genre } from '../../types/animeTypes';

interface SortConfig {
  field: keyof AnimeData | 'aired.from';
  order: 'asc' | 'desc';
}

const AnimeTable = () => {
    // State management
    const [data, setData] = useState<AnimeData[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
    const [genreSearch, setGenreSearch] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Закрываем меню для выбора жанров
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsGenreMenuOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Фильтры и параметры сортировки
    const [filters, setFilters] = useState<Filters>({
      type: [],
      genres: [],
      search: '',
      airedFrom: '',
      year: 0,
      score: { min: 0, max: 10 },
      selectedGenres: []
    });
    const [sortConfig, setSortConfig] = useState<SortConfig>({
      field: 'aired.from',
      order: 'asc'
    });

    // Рефы для бесконечной прокрутки
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

    // Получаем жанры из API
    useEffect(() => {
      const fetchGenres = async () => {
        try {
          const response = await fetch("https://api.jikan.moe/v4/genres/anime");
          const result = await response.json();
          setGenres(result.data);
        } catch (error) {

          console.error("Error fetching genres: ", error);
        }
      };
      fetchGenres();
    }, []);

    // Получаем аниме данные из API
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
    }, [page, filters.search, filters.year]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);


    // Фильтр по типам аниме
    const handleTypeFilter = useCallback((type: string) => {
      setFilters(prev => ({
        ...prev,
        type: prev.type.includes(type)
          ? prev.type.filter(t => t !== type)
          : [...prev.type, type]
      }));
      setPage(1); 
    }, []);

    // Фильтр по жанрам
    const handleGenreFilter = useCallback((genreId: number) => {
      setFilters(prev => ({
        ...prev,
        selectedGenres: prev.selectedGenres.includes(genreId)
          ? prev.selectedGenres.filter(id => id !== genreId)
          : [...prev.selectedGenres, genreId]
      }));
      setPage(1);
    }, []);

    // Поиск по названию аниме
    const handleSearch = debounce((value: string) => {
      setData([]); // Clear existing data
      setPage(1);
      setFilters(prev => ({ ...prev, search: value }));
    }, 500);

    // Фильтр по оценке аниме
    const handleScoreFilter = debounce((min: number, max: number) => {
      setFilters(prev => ({
        ...prev,
        score: { min, max }
      }));
      setPage(1);
    }, 300);

    // Функция сортирующая по полю в модели AnimeData
    const handleSort = useCallback((field: keyof AnimeData | 'aired.from') => {
      setSortConfig(prev => ({
        field,
        order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
      }));
    }, []);

    // Получаем отфильтрованные и отсортированные данные
    const getFilteredAndSortedData = useCallback(() => {
      let filteredData = [...data];

      // Применяем фильтры
      if (filters.type.length > 0) {
        filteredData = filteredData.filter(anime => 
          filters.type.includes(anime.type)
        );
      }

      if (filters.selectedGenres.length > 0) {
        filteredData = filteredData.filter(anime => 
          anime.genres.some(genre => 
            filters.selectedGenres.includes(genre.mal_id)
          )
        );
      }

      if (filters.score.min > 0 || filters.score.max < 10) {
        filteredData = filteredData.filter(anime => 
          anime.score >= filters.score.min && 
          anime.score <= filters.score.max
        );
      }

      // Применяем сортировки
      if (sortConfig.field) {
        filteredData.sort((a, b) => {
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

      return filteredData;
    }, [data, filters, sortConfig]);



    return (
      <div className={styles.container}>
  
          {/* Filters */}
        <div className={styles.filters}>
  
          {/* Filter group */}
          <div className={styles.filterGroup}>
  
              {/* Filter by type */}
            <div className={styles.typeFilter}>
              {availableTypes.map(type => (
                <button
                  onClick={() => handleTypeFilter(type)}
                  key={type}
                  className={`${styles.typeButton} ${
                    filters.type.includes(type) ? styles.active : ''
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
  
              {/* Filter by genres */}
            <div className={styles.genreFilter}>
              <div className={styles.genreDropdown}>
                <button 
                  onClick={() => setIsGenreMenuOpen(prev => !prev)}
                  className={styles.genreDropdownButton}
                >
                  Select Genres ({filters.selectedGenres.length})
                </button>
                {isGenreMenuOpen && (
                  <div ref={menuRef} className={styles.genreMenu}>
                    <input
                      type="text"
                      placeholder="Search genres..."
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      className={styles.genreSearch}
                    />
                    <div className={styles.genreList}>
                      {genres
                        .filter(genre => 
                          genre.name.toLowerCase().includes(genreSearch.toLowerCase())
                        )
                        .map(genre => (
                          <label
                            key={genre.mal_id}
                            className={styles.genreOption}
                          >
                            <input
                              type="checkbox"
                              checked={filters.selectedGenres.includes(genre.mal_id)}
                              onChange={() => handleGenreFilter(genre.mal_id)}
                            />
                            <span>{genre.name}</span>
                            <span className={styles.genreCount}>
                              {data.filter(anime => 
                                anime.genres.some(g => g.mal_id === genre.mal_id)
                              ).length}
                            </span>
                          </label>
                      ))}
                    </div>
                    {filters.selectedGenres.length > 0 && (
                      <button
                        onClick={() => setFilters(prev => ({...prev, selectedGenres: []}))}
                        className={styles.clearGenres}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
  
                {/* Filter by score */}
            <div className={styles.scoreFilter}>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.score.min}
                onChange={(e) => handleScoreFilter(
                  Number(e.target.value),
                  filters.score.max
                )}
                className={styles.scoreSlider}
              />
              <span>Min Score: {filters.score.min}</span>
            </div>
          </div>
  
              {/* Search anime by title */}
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Search anime..."
              onChange={e => handleSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
  
          {/* Anime table  */}
        <table className={styles.table}>
  
          {/* Table Headers */}
          <thead className={styles.tableHeader}>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Genres</th>
              <th onClick={() => handleSort('aired.from')}>
                Release Date {sortConfig.field === 'aired.from' && 
                  (sortConfig.order === 'desc' ? '▲' : '▼')}
              </th>
              <th onClick={() => handleSort('episodes')}>
                Episodes {sortConfig.field === 'episodes' && 
                  (sortConfig.order === 'desc' ? '▲' : '▼')}
              </th>
              <th onClick={() => handleSort('score')}>
                Score {sortConfig.field === 'score' && 
                  (sortConfig.order === 'desc' ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
  
          {/* Table Body */}
          <tbody className={styles.tableBody}>
            {getFilteredAndSortedData().map((anime, index) => (
              <tr 
                key={anime.mal_id}
                ref={index === data.length - 5 ? lastElementRef : null}
              >
                <td>{anime.title}</td>
                <td>{anime.type}</td>
                <td>{anime.genres.map(g => g.name).join(', ')}</td>
                <td>{new Date(anime.aired.from).toLocaleDateString()}</td>
                <td>{anime.episodes}</td>
                <td>{anime.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
  
          {/* Loading disk */}
        {loading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner} />
          </div>
        )}
      </div>
    );
};

export default AnimeTable;