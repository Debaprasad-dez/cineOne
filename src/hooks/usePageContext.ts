import { useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';

// Builds a context string describing where the user is and what they are
// looking at, fed to the AI companion so its replies are page-aware.
export function usePageContext(): string {
  const { pathname } = useLocation();
  const { watched, watchlist } = useUserStore();
  const activeMovie = useUIStore((s) => s.activeMovie);

  const taste =
    watched.length + watchlist.length > 0
      ? `The user has ${watched.length} watched and ${watchlist.length} saved films.`
      : 'The user has no watch history yet.';

  let where = 'browsing CinemaOne';
  if (pathname === '/') where = 'on the home screen';
  else if (pathname === '/discover') where = 'tuning the mood-based discovery controls';
  else if (pathname === '/galaxy') where = 'exploring the 3D movie galaxy';
  else if (pathname === '/search') where = 'searching for films';
  else if (pathname === '/profile') where = 'viewing their taste profile';
  else if (pathname.startsWith('/movie/')) where = 'reading a movie detail page';

  let movieContext = '';
  if (pathname.startsWith('/movie/') && activeMovie) {
    movieContext =
      ` The movie currently open on screen is "${activeMovie.title}" (${activeMovie.year}), ` +
      `TMDB rating ${activeMovie.rating.toFixed(1)}/10, genres: ${activeMovie.genres.join(', ') || 'unknown'}. ` +
      `Synopsis: ${activeMovie.overview} ` +
      `When the user refers to "this movie", "the movie open", or asks how good it is, they mean "${activeMovie.title}".`;
  }

  return `Context: the user is currently ${where}.${movieContext} ${taste}`;
}
