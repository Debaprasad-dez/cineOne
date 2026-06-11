import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import { posterUrl } from '@/services/tmdb';

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Home-page row of partially-watched films. Resume re-opens the player at
// the saved timestamp; progress is persisted from PlayerOverlay.
export default function ContinueWatchingRow() {
  const continueWatching = useUserStore((s) => s.continueWatching);
  const clearProgress = useUserStore((s) => s.clearProgress);
  const playMovie = useUIStore((s) => s.playMovie);

  if (continueWatching.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-5 px-1">
        <div className="eyebrow mb-1.5 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-teal" />
          Pick up where you left off
        </div>
        <h2 className="display-fluid text-3xl text-text-primary md:text-4xl">Continue Watching</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {continueWatching.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group relative w-64 shrink-0 overflow-hidden rounded-2xl bg-surface-2 md:w-72"
          >
            <Link to={`/movie/${item.id}`} data-hoverable className="block">
              {item.poster_path ? (
                <img
                  src={posterUrl(item.poster_path, 'w500')}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-video w-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:brightness-[0.55]"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-void-3 px-4 text-center font-display text-text-muted">
                  {item.title}
                </div>
              )}
            </Link>

            {/* remove from list */}
            <button
              data-hoverable
              aria-label={`Remove ${item.title} from continue watching`}
              onClick={() => clearProgress(item.id)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-void/70 text-xs text-text-muted opacity-0 backdrop-blur-sm transition-opacity hover:text-text-primary group-hover:opacity-100"
            >
              ✕
            </button>

            {/* resume button */}
            <button
              data-hoverable
              aria-label={`Resume ${item.title}`}
              onClick={() => playMovie({ id: item.id, title: item.title, resumeAt: item.currentTime })}
              className="absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-void/60 pl-1 text-lg text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-grad group-hover:opacity-100"
            >
              ▶
            </button>

            {/* meta + progress */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/85 to-transparent p-3 pt-8">
              <div className="truncate font-display text-base text-text-primary">{item.title}</div>
              <div className="mt-0.5 flex justify-between font-mono text-[10px] text-text-muted">
                <span>{fmtTime(item.currentTime)} watched</span>
                <span>{Math.round(item.progress)}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-crimson to-accent-gold"
                  style={{ width: `${Math.min(100, item.progress)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
