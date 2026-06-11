import { useQuery } from '@tanstack/react-query';
import {
  getTrending,
  getPopular,
  getTopRated,
  getMovie,
  getSimilar,
  searchMovies,
  discoverMovies,
  type DiscoverParams,
} from '@/services/tmdb';
import type { TMDBMovie } from '@/types/movie';

export const useTrending = () =>
  useQuery({ queryKey: ['trending'], queryFn: () => getTrending('week') });

export const usePopular = () =>
  useQuery({ queryKey: ['popular'], queryFn: () => getPopular() });

export const useTopRated = () =>
  useQuery({ queryKey: ['topRated'], queryFn: () => getTopRated() });

export const useMovie = (id: number) =>
  useQuery({ queryKey: ['movie', id], queryFn: () => getMovie(id), enabled: !!id });

export const useSimilar = (id: number) =>
  useQuery({ queryKey: ['similar', id], queryFn: () => getSimilar(id), enabled: !!id });

export const useSearch = (query: string) =>
  useQuery({
    queryKey: ['search', query],
    queryFn: () => searchMovies(query),
    enabled: query.trim().length > 1,
  });

export const useDiscover = (params: DiscoverParams, key: string) =>
  useQuery({ queryKey: ['discover', key], queryFn: () => discoverMovies(params) });

// Timeline: top-rated films spread across decades for the time tunnel.
export const useTimelineMovies = () =>
  useQuery({
    queryKey: ['timeline'],
    staleTime: Infinity,
    queryFn: async () => {
      const decades = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
      const perDecade = await Promise.all(
        decades.map((d) =>
          discoverMovies({
            'primary_release_date.gte': `${d}-01-01`,
            'primary_release_date.lte': `${d + 9}-12-31`,
            sort_by: 'vote_average.desc',
            'vote_count.gte': 500,
          }).then((list) => ({ decade: d, films: list.filter((m) => m.poster_path).slice(0, 7) })),
        ),
      );
      return perDecade.filter((g) => g.films.length > 0);
    },
  });

// Galaxy: combine several popular pages into one node set.
export const useGalaxyMovies = () =>
  useQuery({
    queryKey: ['galaxy'],
    queryFn: async () => {
      const pages = await Promise.all([getPopular(1), getPopular(2), getPopular(3)]);
      const seen = new Set<number>();
      return pages
        .flat()
        .filter((m) => m.poster_path && !seen.has(m.id) && seen.add(m.id))
        .slice(0, 60);
    },
    staleTime: Infinity,
  });

// Hidden gems: well-rated but low vote count.
export const useHiddenGems = () =>
  useQuery({
    queryKey: ['hiddenGems'],
    queryFn: () =>
      discoverMovies({
        sort_by: 'vote_average.desc',
        'vote_count.gte': 100,
        'vote_count.lte': 1000,
      }),
  });

// Full collection pages for the "See all" view — several TMDB pages merged.
export type CollectionKey = 'trending' | 'popular' | 'top-rated' | 'hidden-gems';

export const COLLECTION_META: Record<CollectionKey, { title: string; accent: string }> = {
  trending: { title: 'Trending Now', accent: '#E8624A' },
  popular: { title: 'Popular Picks', accent: '#7B5EA7' },
  'top-rated': { title: 'The Cinematic Canon', accent: '#C9954C' },
  'hidden-gems': { title: 'Hidden Gems', accent: '#4ECDC4' },
};

async function fetchCollection(key: CollectionKey): Promise<TMDBMovie[]> {
  const pages = [1, 2, 3];
  const lists = await Promise.all(
    pages.map((page) => {
      switch (key) {
        case 'trending':
          return getTrending('week'); // trending endpoint ignores page granularity we need
        case 'popular':
          return getPopular(page);
        case 'top-rated':
          return getTopRated(page);
        case 'hidden-gems':
          return discoverMovies({
            sort_by: 'vote_average.desc',
            'vote_count.gte': 100,
            'vote_count.lte': 1000,
            page,
          });
      }
    }),
  );
  const seen = new Set<number>();
  return lists.flat().filter((m) => m.poster_path && !seen.has(m.id) && !!seen.add(m.id));
}

export const useCollection = (key: CollectionKey) =>
  useQuery({ queryKey: ['collection', key], queryFn: () => fetchCollection(key) });
