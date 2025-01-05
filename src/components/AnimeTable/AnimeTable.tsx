import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Calendar, Search, SortAsc, SortDesc } from 'lucide-react';
import styles from './AnimeTable.module.css';
import {availableTypes, availableGenres, DEFAULT_ORDER_BY, DEFAULT_SORT} from './constants'
import { AnimeData, Filters, Genre } from '../../types/animeTypes';

const AnimeTable = () => {
  const [data, setData] = useState<AnimeData[]>([]);
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    type: [],
    genres: [],
    search: '',
    airedFrom: '',
    year: 0
  });

  const fetchGenres = async () => {
    try {
      const response = await fetch("https://api.jikan.moe/v4/genres/anime")
      const result = await response.json()
      setGenres(result.data)
    } catch (error) {
      console.error("Error fetching genres: ", error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchGenres()

  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.jikan.moe/v4/anime?page=${page}&limit=20&order_by=${DEFAULT_ORDER_BY}&sort=${DEFAULT_SORT}&${
          filters.search ? `&q=${filters.search}` : ''
        }`
      );
      const result = await response.json();
      
      if (result.data) {
        setData(prev => [...prev, ...result.data]);
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
  }, [data]);

  const handleTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const handleSearch = debounce((value: string) => {
    setData([]);
    setPage(1);
    setFilters(prev => ({ ...prev, search: value }));
  }, 500);

  const filteredData = data.filter(item => {
    const matchesType = filters.type.length === 0 || filters.type.includes(item.type);
    return matchesType
  })


  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
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
        </div>

        {/* <div className={styles.filterGroup}>
          <div className={styles.genresFilter}>
            {genres.map(genre => (
              <button
                key={genre.mal_id}
                className={`${styles.genresButton} ${
                  filters.type.includes(genre.name) ? styles.active : ''
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div> */}

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


      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th>
              <div className={styles.tableHeader}>
                Title
              </div>
            </th>
            <th>
              <div className={styles.tableHeader}>
                Type
              </div>
            </th>

            <th>
              <div className={styles.tableHeader}>
                Genres
              </div>
            </th>

            <th>Release Date</th>
            <th>
              <div className={styles.tableHeader}>
                Episodes
              </div>
            </th>
            <th>
              <div className={styles.tableHeader}>
                Score
              </div>
            </th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {filteredData.map(anime => (
            <tr key={anime.mal_id}>
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


      {loading && (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner} />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={() => setPage(prev => prev + 1)}
          className={styles.loadMoreButton}
        >
          Load More
        </button>
      )}
    </div>

  );
};

export default AnimeTable;