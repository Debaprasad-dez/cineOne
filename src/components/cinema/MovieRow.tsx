import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { TMDBMovie } from '@/types/movie';
import MovieCard, { MovieCardSkeleton } from './MovieCard';

interface Props {
  title: string;
  movies?: TMDBMovie[];
  loading?: boolean;
  accent?: string;
  seeAllTo?: string; // route for the full-collection page; falls back to scrolling
}

export default function MovieRow({ title, movies, loading, accent = '#E8624A', seeAllTo }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  const seeAllInner = (
    <>
      <span className="link-underline">See all</span>
      <span
        className="inline-block transition-transform duration-300 group-hover:translate-x-1"
        style={{ color: accent }}
      >
        →
      </span>
    </>
  );

  return (
    <section className="mb-16">
      <div className="mb-5 flex items-end justify-between px-1">
        <div>
          <div className="eyebrow mb-1.5 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            Collection
          </div>
          <h2 className="display-fluid text-3xl text-text-primary md:text-4xl">{title}</h2>
        </div>
        {seeAllTo ? (
          <Link
            to={seeAllTo}
            data-hoverable
            className="group flex items-center gap-1.5 font-ui text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {seeAllInner}
          </Link>
        ) : (
          <button
            data-hoverable
            onClick={() => scroll(1)}
            className="group flex items-center gap-1.5 font-ui text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            {seeAllInner}
          </button>
        )}
      </div>

      <div className="relative">
        <button
          data-hoverable
          onClick={() => scroll(-1)}
          className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-void/70 backdrop-blur-sm hover:bg-surface-2 md:flex"
        >
          ‹
        </button>
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-40 shrink-0 md:w-48">
                  <MovieCardSkeleton />
                </div>
              ))
            : movies?.map((m, i) => (
                <div key={m.id} className="w-40 shrink-0 md:w-48">
                  <MovieCard movie={m} index={i} />
                </div>
              ))}
        </div>
        <button
          data-hoverable
          onClick={() => scroll(1)}
          className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-void/70 backdrop-blur-sm hover:bg-surface-2 md:flex"
        >
          ›
        </button>
      </div>
    </section>
  );
}
