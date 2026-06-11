import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MoodWheel from '@/components/ai/MoodWheel';
import MovieCard from '@/components/cinema/MovieCard';
import { MovieCardSkeleton } from '@/components/cinema/MovieCard';
import MagneticButton from '@/components/ui/MagneticButton';
import PageTransition from '@/components/layout/PageTransition';
import { useMoodRecommend } from '@/hooks/useAI';
import { genreColor } from '@/utils/constants';
import type { Mood, MoodQuery } from '@/types/ai';

const GENRES = ['Sci-Fi', 'Thriller', 'Drama', 'Comedy', 'Horror', 'Romance', 'Action', 'Mystery'];
const TEMPOS: MoodQuery['tempo'][] = ['Slow burn', 'Measured', 'Kinetic'];
const RUNTIMES: { label: string; val: MoodQuery['runtime'] }[] = [
  { label: '<90min', val: '<90' },
  { label: '90–150min', val: '90-150' },
  { label: '150min+', val: '150+' },
];

export default function Discover() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [energy, setEnergy] = useState(50);
  const [tempo, setTempo] = useState<MoodQuery['tempo']>('Measured');
  const [genres, setGenres] = useState<string[]>([]);
  const [runtime, setRuntime] = useState<MoodQuery['runtime']>(null);
  const [era, setEra] = useState<[number, number]>([1990, 2020]);

  const rec = useMoodRecommend();

  const toggleMood = (m: Mood) =>
    setMoods((s) => (s.includes(m) ? s.filter((x) => x !== m) : s.length < 3 ? [...s, m] : s));
  const toggleGenre = (g: string) =>
    setGenres((s) => (s.includes(g) ? s.filter((x) => x !== g) : s.length < 4 ? [...s, g] : s));

  const discover = () => {
    rec.mutate({ moods, energy, tempo, genres, runtime, era });
  };

  const showResults = rec.isPending || rec.data;

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-10 pb-24 md:px-12">
        <h1 className="mb-2 font-display text-4xl italic md:text-5xl">What's your frequency?</h1>
        <p className="mb-10 font-ui text-text-secondary">
          Tune the controls. The AI curator reads your emotional fingerprint.
        </p>

        <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
          {/* Mood wheel */}
          <div className="flex flex-col items-center">
            <MoodWheel selected={moods} onToggle={toggleMood} />
            <span className="mt-2 font-mono text-xs text-text-muted">Pick up to 3 moods</span>
          </div>

          {/* Controls */}
          <div className="space-y-8">
            {/* Energy */}
            <div>
              <label className="mb-2 flex justify-between font-ui text-sm">
                <span>Tranquil</span>
                <span className="text-text-muted">Energy</span>
                <span>Intense</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={energy}
                data-hoverable
                onChange={(e) => setEnergy(+e.target.value)}
                className="h-2 w-full cursor-none appearance-none rounded-full"
                style={{
                  background: `linear-gradient(90deg, #4ECDC4 ${energy}%, #1C1C2A ${energy}%)`,
                }}
              />
            </div>

            {/* Tempo */}
            <div>
              <span className="mb-2 block font-ui text-sm text-text-muted">Tempo</span>
              <div className="flex gap-2">
                {TEMPOS.map((t) => (
                  <button
                    key={t}
                    data-hoverable
                    onClick={() => setTempo(t)}
                    className={`rounded-full px-4 py-2 font-ui text-sm transition-colors ${
                      tempo === t ? 'bg-accent-violet text-white' : 'glass glass-hover text-text-secondary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div>
              <span className="mb-2 block font-ui text-sm text-text-muted">Genre blend (max 4)</span>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => {
                  const active = genres.includes(g);
                  return (
                    <button
                      key={g}
                      data-hoverable
                      onClick={() => toggleGenre(g)}
                      className="rounded-full px-4 py-2 font-ui text-sm transition-all"
                      style={{
                        background: active ? `${genreColor(g)}33` : 'rgba(28,28,42,0.6)',
                        color: active ? genreColor(g) : 'rgba(242,240,255,0.6)',
                        border: `1px solid ${active ? genreColor(g) : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Runtime */}
            <div>
              <span className="mb-2 block font-ui text-sm text-text-muted">Runtime</span>
              <div className="flex gap-2">
                {RUNTIMES.map((r) => (
                  <button
                    key={r.label}
                    data-hoverable
                    onClick={() => setRuntime(runtime === r.val ? null : r.val)}
                    className={`rounded-full px-4 py-2 font-ui text-sm transition-colors ${
                      runtime === r.val ? 'bg-accent-crimson text-white' : 'glass glass-hover text-text-secondary'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Era */}
            <div>
              <label className="mb-2 flex justify-between font-ui text-sm text-text-muted">
                <span>Era</span>
                <span className="font-mono text-text-primary">{era[0]}s – {era[1]}s</span>
              </label>
              <div className="flex gap-4">
                <input
                  type="range" min={1920} max={2020} step={10} value={era[0]} data-hoverable
                  onChange={(e) => setEra([Math.min(+e.target.value, era[1]), era[1]])}
                  className="h-2 w-full cursor-none appearance-none rounded-full bg-surface-2"
                />
                <input
                  type="range" min={1920} max={2020} step={10} value={era[1]} data-hoverable
                  onChange={(e) => setEra([era[0], Math.max(+e.target.value, era[0])])}
                  className="h-2 w-full cursor-none appearance-none rounded-full bg-surface-2"
                />
              </div>
            </div>

            <MagneticButton onClick={discover} disabled={rec.isPending || moods.length === 0}>
              {rec.isPending ? 'Curating…' : 'Discover'}
            </MagneticButton>
            {moods.length === 0 && (
              <span className="ml-3 font-ui text-xs text-text-muted">Pick at least one mood</span>
            )}
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16"
            >
              <h2 className="mb-6 font-display text-3xl italic">Your emotional fingerprint</h2>
              {rec.isError && (
                <p className="font-ui text-accent-crimson">
                  Curator unavailable right now. Try again in a moment.
                </p>
              )}
              {!rec.isPending && rec.data && rec.data.length === 0 && (
                <p className="font-ui text-text-secondary">
                  No films matched this exact frequency. Loosen a filter or two and try again.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {rec.isPending
                  ? Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} />)
                  : rec.data?.map((r, i) => (
                      <div key={r.movie.id}>
                        <MovieCard movie={r.movie} index={i} />
                        <p className="mt-2 font-mono text-[10px] leading-snug text-text-muted">{r.why}</p>
                      </div>
                    ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
