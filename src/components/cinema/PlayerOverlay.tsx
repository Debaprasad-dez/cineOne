import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import { useMovie } from '@/hooks/useTMDB';
import VidkingPlayer from './VidkingPlayer';

// Single global player overlay. Any movie card / button opens it via uiStore.playMovie.
export default function PlayerOverlay() {
  const playerMovie = useUIStore((s) => s.playerMovie);
  const closePlayer = useUIStore((s) => s.closePlayer);

  return (
    <AnimatePresence>
      {playerMovie && (
        <Inner id={playerMovie.id} resumeAt={playerMovie.resumeAt} onClose={closePlayer} />
      )}
    </AnimatePresence>
  );
}

function Inner({ id, resumeAt, onClose }: { id: number; resumeAt?: number; onClose: () => void }) {
  const { data: movie } = useMovie(id);
  const { toggleWatched, isWatched, saveProgress, clearProgress } = useUserStore();
  const stageRef = useRef<HTMLDivElement>(null);
  const lastSave = useRef(0);

  const accent =
    getComputedStyle(document.documentElement).getPropertyValue('--accent-crimson').trim().replace('#', '') || 'e8624a';

  // Request native fullscreen on the player stage when it opens; exit closes the player.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.requestFullscreen?.().catch(() => {});
    const onFsChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-void p-4 md:p-10"
    >
      <div ref={stageRef} className="relative flex w-full max-w-6xl items-center bg-void" onClick={(e) => e.stopPropagation()}>
        <button
          data-hoverable
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-void/70 px-3 py-1.5 font-ui text-sm text-text-primary backdrop-blur-sm hover:bg-surface-2"
        >
          ✕
        </button>
        <VidkingPlayer
          tmdbId={id}
          color={accent}
          autoPlay
          startAt={resumeAt}
          className="rounded-none"
          onProgress={(p) => {
            if (p.progress >= 90) {
              // finished — mark watched, drop from continue-watching
              if (movie && !isWatched(id)) toggleWatched(movie);
              clearProgress(id);
              return;
            }
            // persist resume point at most every 5s, once past the first 30s
            if (movie && p.currentTime > 30 && Date.now() - lastSave.current > 5000) {
              lastSave.current = Date.now();
              saveProgress({
                id,
                title: movie.title,
                poster_path: movie.poster_path,
                currentTime: p.currentTime,
                duration: p.duration,
                progress: p.progress,
              });
            }
          }}
        />
      </div>
    </motion.div>
  );
}
