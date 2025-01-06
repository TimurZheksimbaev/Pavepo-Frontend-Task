import { useState, useEffect, useRef } from 'react';
import { Search} from 'lucide-react';
import styles from './AnimeTable.module.css';
import { useAnimeData } from '../../hooks/useAnimeData';
import { useFilters } from '../../hooks/useFilters';
import { useSorting } from '../../hooks/useSorting';
import {availableTypes} from '../../constants/animeConstants'
import { Genre} from '../../types/animeTypes';

const AnimeTable = () => {
    const { filters, setFilters, handleTypeFilter, handleGenreFilter, handleSearch, handleScoreFilter } = useFilters();
    const { data, loading, lastElementRef, setData } = useAnimeData(filters);
    const { sortConfig, handleSort, sortData } = useSorting();

    const [genres, setGenres] = useState<Genre[]>([]);
    const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
    const [genreSearch, setGenreSearch] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Скрываем меню для выбора жанров
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsGenreMenuOpen(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
  
    // Получаем жанры
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
  
    const sortedAndFilteredData = sortData(data).filter(anime => {
      // Фильтруем по типам
      if (filters.type.length > 0 && !filters.type.includes(anime.type)) {
        return false;
      }
  
      // Фильтруем по жанрам
      if (filters.selectedGenres.length > 0 && 
          !anime.genres.some(genre => filters.selectedGenres.includes(genre.mal_id))) {
        return false;
      }
  
      // Фильтруем по оценке
      if (anime.score < filters.score.min || anime.score > filters.score.max) {
        return false;
      }
  
      return true;
    });



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
            {sortedAndFilteredData.map((anime, index) => (
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