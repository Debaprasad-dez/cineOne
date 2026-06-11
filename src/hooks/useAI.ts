import { useMutation, useQuery } from '@tanstack/react-query';
import { chat, parseJSON } from '@/services/openrouter';
import { searchMovies, discoverMovies, type DiscoverParams } from '@/services/tmdb';
import { GENRE_MAP } from '@/utils/constants';
import type { AIRecommendation, ChatMessage, MoodQuery } from '@/types/ai';
import type { TMDBMovie } from '@/types/movie';

export interface MoodResult {
  movie: TMDBMovie;
  why: string;
  notes: string;
}

// When the AI path yields nothing (parse failure, rate limit, hallucinated
// titles), fall back to a plain TMDB discover query built from the same
// filters so the user never lands on an empty screen.
async function tmdbFallback(q: MoodQuery): Promise<MoodResult[]> {
  const genreIds = Object.entries(GENRE_MAP)
    .filter(([, name]) => q.genres.includes(name))
    .map(([id]) => id);

  const params: DiscoverParams = {
    sort_by: 'vote_average.desc',
    'vote_count.gte': 300,
    'primary_release_date.gte': `${q.era[0]}-01-01`,
    'primary_release_date.lte': `${q.era[1] + 9}-12-31`,
  };
  if (genreIds.length) params.with_genres = genreIds.join(',');
  if (q.runtime === '<90') params['with_runtime.lte'] = 90;
  else if (q.runtime === '90-150') {
    params['with_runtime.gte'] = 90;
    params['with_runtime.lte'] = 150;
  } else if (q.runtime === '150+') params['with_runtime.gte'] = 150;

  const movies = await discoverMovies(params);
  const moodLabel = q.moods.join(' · ').toLowerCase() || 'your';
  return movies
    .filter((m) => m.poster_path)
    .slice(0, 12)
    .map((movie) => ({
      movie,
      why: `A highly rated ${q.era[0]}s–${q.era[1]}s pick matching your ${moodLabel} frequency.`,
      notes: '',
    }));
}

async function recommendByMood(q: MoodQuery): Promise<MoodResult[]> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a world-class cinematheque curator. Always respond with ONLY a JSON array, no prose.',
    },
    {
      role: 'user',
      content: `Based on: moods=[${q.moods.join(', ')}], energy=${q.energy}/100, tempo=${q.tempo}, genres=[${q.genres.join(', ')}], era=${q.era[0]}s-${q.era[1]}s, recommend 12 films that match this emotional fingerprint. Return JSON array of objects with keys: title (string), year (number), tmdb_id (number or null), why_you_match (string, 1 sentence), emotional_notes (string), pacing (string), tone (string).`,
    },
  ];

  let results: MoodResult[] = [];
  try {
    const raw = await chat(messages, 0.85);
    const recs = parseJSON<AIRecommendation[]>(raw) ?? [];

    const found = await Promise.all(
      recs.slice(0, 12).map(async (r) => {
        const candidates = await searchMovies(`${r.title}`).catch(() => []);
        const movie =
          candidates.find((m) => yearMatch(m.release_date, r.year)) ?? candidates[0];
        if (!movie) return null;
        return { movie, why: r.why_you_match, notes: r.emotional_notes } satisfies MoodResult;
      }),
    );

    // dedupe — the AI sometimes resolves multiple titles to the same film
    const seen = new Set<number>();
    results = found.filter(
      (x): x is MoodResult => x !== null && !seen.has(x.movie.id) && !!seen.add(x.movie.id),
    );
  } catch {
    results = [];
  }

  return results.length > 0 ? results : tmdbFallback(q);
}

function yearMatch(date: string, year: number): boolean {
  return date?.startsWith(String(year));
}

export function useMoodRecommend() {
  return useMutation({ mutationFn: recommendByMood });
}

export interface ArcPoint {
  t: number; // 0..100 runtime percent
  intensity: number; // 0..1
  scene: string;
}

export interface SceneCard {
  timestamp: string;
  title: string;
  mood: string;
  analysis: string;
}

export interface MovieAnalysis {
  why: string;
  arc: ArcPoint[];
  scenes: SceneCard[];
}

async function analyzeMovie(title: string, year: string): Promise<MovieAnalysis> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a film analyst. Respond with ONLY a JSON object, no prose.',
    },
    {
      role: 'user',
      content: `Analyze the film "${title}" (${year}). Return a JSON object with keys: why (string, 2 sentences on why a curious viewer would love it), arc (array of 12 objects {t:number 0-100, intensity:number 0-1, scene:string short}), scenes (array of 6 objects {timestamp:string, title:string, mood:string, analysis:string 2 sentences}).`,
    },
  ];
  const raw = await chat(messages, 0.8);
  const parsed = parseJSON<MovieAnalysis>(raw);
  return parsed ?? { why: '', arc: [], scenes: [] };
}

export interface HeroPick {
  movie: TMDBMovie;
  why: string;
}

interface PickJSON {
  title: string;
  year: number;
  why: string;
}

async function findFirst(title: string, year: number): Promise<TMDBMovie | null> {
  const found = await searchMovies(title);
  return found.find((m) => m.release_date?.startsWith(String(year))) ?? found[0] ?? null;
}

// "Surprise Me": one unexpected, lesser-known great film.
async function surpriseFilm(): Promise<HeroPick | null> {
  const raw = await chat(
    [
      { role: 'system', content: 'You are a daring cinematheque curator. Respond with ONLY a JSON object.' },
      {
        role: 'user',
        content:
          'Surprise me with one unexpected, lesser-known but acclaimed film most people have not seen. Avoid obvious blockbusters. Return JSON {title, year, why} where why is one vivid sentence.',
      },
    ],
    1,
  );
  const p = parseJSON<PickJSON>(raw);
  if (!p) return null;
  const movie = await findFirst(p.title, p.year);
  return movie ? { movie, why: p.why } : null;
}

// "Tonight's Pick": tailored to time-of-day mood + the user's taste.
async function tonightFilm(mood: string, watchedTitles: string[]): Promise<HeroPick | null> {
  const raw = await chat(
    [
      { role: 'system', content: 'You are a thoughtful cinema curator. Respond with ONLY a JSON object.' },
      {
        role: 'user',
        content: `It is "${mood}" right now. The viewer has watched: ${watchedTitles.slice(0, 8).join(', ') || 'nothing yet'}. Recommend one film perfect for this moment. Return JSON {title, year, why} where why is one sentence tying it to the time and their taste.`,
      },
    ],
    0.9,
  );
  const p = parseJSON<PickJSON>(raw);
  if (!p) return null;
  const movie = await findFirst(p.title, p.year);
  return movie ? { movie, why: p.why } : null;
}

export function useSurprise() {
  return useMutation({ mutationFn: surpriseFilm });
}

export function useTonightPick() {
  return useMutation({
    mutationFn: ({ mood, watched }: { mood: string; watched: string[] }) => tonightFilm(mood, watched),
  });
}

export function useMovieAnalysis(title?: string, year?: string) {
  return useQuery({
    queryKey: ['analysis', title, year],
    queryFn: () => analyzeMovie(title!, year!),
    enabled: !!title,
    staleTime: Infinity,
  });
}
