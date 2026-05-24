import { useMemo, useState, useRef, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useGalaxyMovies, useTimelineMovies } from '@/hooks/useTMDB';
import { buildGalaxy, type GalaxyNode } from '@/utils/galaxy';
import { yearOf, ratingPct } from '@/utils/formatters';
import { posterUrl } from '@/services/tmdb';
import GalaxyScene, { type GalaxyMode } from '@/components/three/GalaxyScene';
import TunnelCanvas from '@/components/three/TunnelCanvas';
import type { TMDBMovie } from '@/types/movie';

export default function Galaxy() {
  const { data: movies, isLoading } = useGalaxyMovies();
  const { data: timeline } = useTimelineMovies();
  const navigate = useNavigate();
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [selected, setSelected] = useState<GalaxyNode | null>(null);
  const [hovered, setHovered] = useState<GalaxyNode | null>(null);
  const [mode, setMode] = useState<GalaxyMode>('cluster');

  // tunnel state
  const [tunnelHover, setTunnelHover] = useState<{ movie: TMDBMovie; decade: number } | null>(null);
  const [tunnelPct, setTunnelPct] = useState(0);
  const [tunnelDecade, setTunnelDecade] = useState(0);
  const [tunnelProgress, setTunnelProgress] = useState(0);
  const touchStart = useRef<number | null>(null);

  // Wheel and drag drive the tunnel journey (Lenis is bypassed via data-lenis-prevent).
  const onTunnelWheel = (e: React.WheelEvent) => {
    setTunnelProgress((p) => Math.max(0, Math.min(1, p + e.deltaY * 0.0008)));
  };
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dy = touchStart.current - e.touches[0].clientY;
    touchStart.current = e.touches[0].clientY;
    setTunnelProgress((p) => Math.max(0, Math.min(1, p + dy * 0.0014)));
  };

  const { nodes, constellations } = useMemo(
    () => (movies ? buildGalaxy(movies) : { nodes: [], constellations: [] }),
    [movies],
  );

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="display-fluid text-2xl text-text-muted">Mapping the galaxy…</div>
      </div>
    );

  return (
    <div className="fixed inset-0 md:left-[72px]">
      {mode === 'cluster' ? (
        <Suspense fallback={null}>
          <GalaxyScene
            nodes={nodes}
            constellations={constellations}
            activeGenre={activeGenre}
            selected={selected}
            onSelect={setSelected}
            onHover={setHovered}
          />
        </Suspense>
      ) : timeline ? (
        <div
          data-lenis-prevent
          onWheel={onTunnelWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          className="absolute inset-0"
        >
          <TunnelCanvas
            groups={timeline}
            progress={tunnelProgress}
            onHover={setTunnelHover}
            onSelect={(m) => navigate(`/movie/${m.id}`)}
            onProgress={(pct, decade) => {
              setTunnelPct(pct);
              setTunnelDecade(decade);
            }}
          />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="display-fluid text-2xl text-text-muted">Charting the decades…</div>
        </div>
      )}

      {/* Title + instructions */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[60vw] md:left-6 md:top-6 md:max-w-none">
        <div className="eyebrow mb-1 hidden md:block">{mode === 'cluster' ? 'Constellation view' : 'Time tunnel'}</div>
        <h1 className="display-fluid text-xl text-text-primary md:text-4xl">The Movie Galaxy</h1>
        <p className="mt-1 hidden font-mono text-xs text-text-muted md:block">
          {mode === 'cluster' ? 'Drag to orbit · scroll to zoom · click a star' : 'Scroll to fly through the decades · click a film'}
        </p>
      </div>

      {/* Mode toggle */}
      <button
        data-hoverable
        onClick={() => {
          setSelected(null);
          setTunnelHover(null);
          setTunnelProgress(0);
          setMode((m) => (m === 'cluster' ? 'tunnel' : 'cluster'));
        }}
        className="glass glass-hover absolute right-4 top-4 z-20 flex items-center gap-2 px-3 py-2 font-ui text-xs text-text-primary md:right-6 md:top-6 md:px-4 md:py-2.5 md:text-sm"
        aria-label={mode === 'cluster' ? 'Travel through time' : 'Back to constellations'}
      >
        <span>{mode === 'cluster' ? '⟳' : '✦'}</span>
        <span className="hidden md:inline">
          {mode === 'cluster' ? 'Travel Through Time' : 'Back to Constellations'}
        </span>
      </button>

      {/* === TUNNEL OVERLAY === */}
      {mode === 'tunnel' && (
        <>
          {/* big decade readout */}
          <div className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 text-center">
            <motion.div
              key={tunnelDecade}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="display-fluid text-6xl text-accent-gold md:text-8xl"
            >
              {tunnelDecade}s
            </motion.div>
          </div>

          {/* progress timeline */}
          <div className="absolute bottom-10 left-1/2 z-10 w-[min(80vw,520px)] -translate-x-1/2">
            <div className="hairline relative">
              <div
                className="absolute -top-[1px] left-0 h-[3px] rounded-full bg-gradient-to-r from-accent-crimson to-accent-gold transition-[width] duration-150"
                style={{ width: `${tunnelPct * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-text-muted">
              <span>{timeline?.[0]?.decade}s</span>
              <span>{timeline?.[timeline.length - 1]?.decade}s</span>
            </div>
          </div>

          {/* hovered film card */}
          <AnimatePresence>
            {tunnelHover && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute right-6 top-24 z-10 glass flex w-72 gap-3 p-3"
              >
                {tunnelHover.movie.poster_path && (
                  <img
                    src={posterUrl(tunnelHover.movie.poster_path, 'w342')}
                    alt={tunnelHover.movie.title}
                    className="h-24 w-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="font-display text-base italic leading-tight">{tunnelHover.movie.title}</div>
                  <div className="mt-1 font-mono text-xs text-accent-teal">★ {tunnelHover.movie.vote_average.toFixed(1)}</div>
                  <div className="font-mono text-[10px] text-text-muted">{yearOf(tunnelHover.movie.release_date)}</div>
                  <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">click to open →</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* === CLUSTER OVERLAY === */}
      {mode === 'cluster' && (
        <div className="absolute inset-x-0 bottom-40 z-10 px-3 md:bottom-6 md:left-1/2 md:inset-x-auto md:-translate-x-1/2 md:px-0">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 md:max-w-[90vw] md:flex-wrap md:justify-center md:overflow-visible"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              data-hoverable
              onClick={() => setActiveGenre(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 font-ui text-xs transition-colors ${
                activeGenre === null ? 'bg-text-primary text-void' : 'glass text-text-secondary'
              }`}
            >
              All
            </button>
            {constellations.map((c) => (
              <button
                key={c.genre}
                data-hoverable
                onClick={() => setActiveGenre(activeGenre === c.genre ? null : c.genre)}
                className="shrink-0 rounded-full px-3 py-1.5 font-ui text-xs transition-all"
                style={{
                  background: activeGenre === c.genre ? `${c.color}33` : 'rgba(20,20,31,0.6)',
                  color: activeGenre === c.genre ? c.color : 'rgba(242,240,255,0.6)',
                  border: `1px solid ${activeGenre === c.genre ? c.color : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {c.genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* cluster hover tooltip */}
      <AnimatePresence>
        {hovered && !selected && mode === 'cluster' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute right-6 top-24 z-10 glass w-72 p-4"
          >
            <div className="font-display text-lg italic leading-tight">{hovered.movie.title}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-text-muted">
              <span>{yearOf(hovered.movie.release_date)}</span>
              <span className="text-accent-teal">★ {hovered.movie.vote_average.toFixed(1)}</span>
              <span>{ratingPct(hovered.movie.vote_average)}% match</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold"
                style={{ background: `${hovered.color}22`, color: hovered.color }}
              >
                {hovered.genre}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {Math.round(hovered.movie.vote_count).toLocaleString()} votes
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, hovered.movie.popularity / 5)}%`, background: hovered.color }}
              />
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wide text-text-muted">popularity</div>
            {hovered.movie.overview && (
              <p className="mt-2 line-clamp-3 font-ui text-xs leading-relaxed text-text-secondary">
                {hovered.movie.overview}
              </p>
            )}
            <div className="mt-2 font-mono text-[9px] uppercase tracking-widest text-text-muted">click to focus →</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* selected mini panel */}
      <AnimatePresence>
        {selected && mode === 'cluster' && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            className="absolute right-0 top-0 z-20 flex h-full w-full flex-col border-l border-glass bg-void-2/85 p-6 backdrop-blur-glass md:w-96"
          >
            <button
              data-hoverable
              onClick={() => setSelected(null)}
              className="mb-4 self-end text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
            {selected.movie.poster_path && (
              <img
                src={posterUrl(selected.movie.poster_path, 'w500')}
                alt={selected.movie.title}
                className="mb-4 w-40 self-center rounded-2xl shadow-glow"
              />
            )}
            <h2 className="font-display text-2xl italic">{selected.movie.title}</h2>
            <div className="mt-2 flex items-center gap-3 font-mono text-sm text-text-secondary">
              <span className="text-accent-teal">{ratingPct(selected.movie.vote_average)}%</span>
              <span>{yearOf(selected.movie.release_date)}</span>
              <span style={{ color: selected.color }}>{selected.genre}</span>
            </div>
            <p className="mt-3 line-clamp-6 font-ui text-sm text-text-secondary">{selected.movie.overview}</p>
            <Link
              to={`/movie/${selected.movie.id}`}
              data-hoverable
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-accent-crimson to-accent-violet px-6 py-3 font-ui text-sm font-semibold text-white"
            >
              Open detail →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
