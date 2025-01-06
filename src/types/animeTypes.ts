export interface Genre {
    mal_id: number
    name: string
}

export interface AnimeData {
  mal_id: number;
  title: string;
  type: string;
  genres: Genre[]
  aired: {
    from: string;
    to: string;
  };
  episodes: number;
  score: number;
}

export interface Filters {
  type: string[];
  genres: Genre[];
  search: string;
  airedFrom: string;
  year: number;
  score: {
    min: number;
    max: number;
  };
  selectedGenres: number[];
}