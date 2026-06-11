import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSurprise, useTonightPick, type HeroPick } from '@/hooks/useAI';
import { useUserStore } from '@/stores/userStore';
import { useUIStore } from '@/stores/uiStore';
import { getTimeMood } from '@/utils/timeOfDay';
import { posterUrl } from '@/services/tmdb';

interface Action {
  label: string;
  icon: string;
  hint: string;
  onClick: () => void;
  primary?: boolean;
  wide?: boolean; // spans both grid columns on mobile
  curve: number; // vertical offset for the arc
}

export default function HeroActions() {
  const navigate = useNavigate();
  const watched = useUserStore((s) => s.watched);
  const openCompanion = useUIStore((s) => s.openCompanion);
  const surprise = useSurprise();
  const tonight = useTonightPick();
  const [pick, setPick] = useState<HeroPick | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const busy = surprise.isPending || tonight.isPending;

  // When the result/loading card appears, scroll it into view with bottom breathing room.
  useEffect(() => {
    if (busy || pick) {
      const t = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [busy, pick]);

  const doSurprise = async () => {
    setPick(null);
    const r = await surprise.mutateAsync().catch(() => null);
    if (r) setPick(r);
  };
  const doTonight = async () => {
    setPick(null);
    const mood = getTimeMood().title;
    const r = await tonight
      .mutateAsync({ mood, watched: watched.map((w) => w.title) })
      .catch(() => null);
    if (r) setPick(r);
  };

  const actions: Action[] = [
    { label: 'Surprise', icon: '✦', hint: 'AI', onClick: doSurprise, curve: 0, primary: true },
    { label: 'Tonight', icon: '🌙', hint: 'AI', onClick: doTonight, curve: 0 },
    { label: 'By mood', icon: '◐', hint: '', onClick: () => navigate('/discover'), curve: 0 },
    { label: 'Curator', icon: '✺', hint: 'AI', onClick: () => openCompanion('What should I watch tonight?'), curve: 0 },
    { label: 'Time tunnel', icon: '⟳', hint: '', onClick: () => navigate('/galaxy?view=tunnel'), curve: 0 },
    { label: 'Search', icon: '⌕', hint: '', onClick: () => navigate('/search'), curve: 0, wide: true },
  ];

  return (
    <div className="pointer-events-auto relative flex w-full flex-col items-center">
      <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:flex sm:max-w-none sm:items-start sm:justify-center sm:gap-2.5">
        {actions.map((a, i) => (
          <motion.button
            key={a.label}
            data-hoverable
            onClick={a.onClick}
            disabled={busy}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.04 }}
            className={`group relative flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 font-ui text-xs font-semibold transition-colors disabled:opacity-50 sm:h-10 sm:w-36 sm:shrink-0 ${
              a.primary ? 'col-span-2 bg-grad text-white shadow-glow-crimson sm:col-span-1' : 'glass glass-hover text-text-primary'
            } ${a.wide ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <span className="shrink-0 text-sm" style={{ color: a.primary ? '#fff' : 'var(--accent-gold)' }}>
              {a.icon}
            </span>
            <span>{a.label}</span>
            {a.hint && (
              <span className="ml-1 rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[8px] uppercase leading-none tracking-wider">
                {a.hint}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* AI pick result — absolute so the buttons never move */}
      <AnimatePresence>
        {(busy || pick) && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute top-full mt-6 flex w-full max-w-md items-center gap-4 p-4"
          >
            {busy ? (
              <div className="flex items-center gap-3 py-2 font-mono text-sm text-text-muted">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  ✦
                </motion.span>
                Consulting the curator…
              </div>
            ) : pick ? (
              <>
                {pick.movie.poster_path && (
                  <img
                    src={posterUrl(pick.movie.poster_path, 'w342')}
                    alt={pick.movie.title}
                    className="h-28 w-20 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-display text-lg italic text-text-primary">{pick.movie.title}</div>
                  <p className="mt-1 line-clamp-3 font-ui text-xs text-text-secondary">{pick.why}</p>
                  <button
                    data-hoverable
                    onClick={() => navigate(`/movie/${pick.movie.id}`)}
                    className="link-underline mt-2 font-ui text-xs font-semibold text-accent-teal"
                  >
                    Open detail →
                  </button>
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
