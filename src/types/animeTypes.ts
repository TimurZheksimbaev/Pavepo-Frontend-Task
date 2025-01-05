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
  type: string[] // Фильтрация аниме по типам
  genres: {name: string}[] // Фильтрация аниме по жанрам
  search: string // Поиск по названию
  airedFrom: string // Сортировка по дате релиза
  year: number // Числовая фильтрация по году выпуска 
}