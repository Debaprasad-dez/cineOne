import { useEffect } from 'react';

const VIDKING_BASE = 'https://www.vidking.net/embed';

interface VidkingProgress {
  type: 'PLAYER_EVENT';
  data: {
    event: 'timeupdate' | 'ended' | 'play' | 'pause';
    currentTime: number;
    duration: number;
    progress: number; // 0..100
    id: string;
  };
}

interface Props {
  tmdbId: number;
  type?: 'movie' | 'tv';
  season?: number;
  episode?: number;
  color?: string; // hex without '#'
  autoPlay?: boolean;
  startAt?: number; // seconds — resume position
  onProgress?: (p: VidkingProgress['data']) => void;
  className?: string;
}

// Embedded streaming player via vidking.net.
// Movie: /embed/movie/{tmdbId} · TV: /embed/tv/{tmdbId}/{season}/{episode}
export default function VidkingPlayer({
  tmdbId,
  type = 'movie',
  season = 1,
  episode = 1,
  color = 'e8624a',
  autoPlay = false,
  startAt,
  onProgress,
  className = '',
}: Props) {
  const path =
    type === 'movie'
      ? `${VIDKING_BASE}/movie/${tmdbId}`
      : `${VIDKING_BASE}/tv/${tmdbId}/${season}/${episode}`;
  const resume = startAt && startAt > 0 ? `&progress=${Math.floor(startAt)}` : '';
  const src = `${path}?color=${color}&autoPlay=${autoPlay}${resume}`;

  useEffect(() => {
    if (!onProgress) return;
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== 'object' || e.data?.type !== 'PLAYER_EVENT') return;
      onProgress((e.data as VidkingProgress).data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onProgress]);

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-void-2 ${className}`}>
      <iframe
        src={src}
        title="CinemaOne player"
        className="absolute inset-0 h-full w-full"
        frameBorder={0}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        referrerPolicy="origin"
      />
    </div>
  );
}
