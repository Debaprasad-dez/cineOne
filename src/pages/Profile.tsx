import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '@/components/layout/PageTransition';
import FeatureToggles from '@/components/layout/FeatureToggles';
import { MOODS } from '@/utils/constants';
import { useUserStore } from '@/stores/userStore';
import { tasteVector } from '@/utils/taste';
import { posterUrl } from '@/services/tmdb';

const SIZE = 240;
const C = SIZE / 2;
const RAD = C - 34;

function points(values: number[]) {
  return values
    .map((v, i) => {
      const a = (i / values.length) * Math.PI * 2 - Math.PI / 2;
      return `${C + RAD * v * Math.cos(a)},${C + RAD * v * Math.sin(a)}`;
    })
    .join(' ');
}

function archetype(vec: number[]): string {
  const top = MOODS[vec.indexOf(Math.max(...vec))];
  const map: Record<string, string> = {
    Melancholic: 'The Introspective Wanderer',
    Dark: 'The Shadow Seeker',
    Intellectual: 'The Cerebral Explorer',
    Epic: 'The Myth Chaser',
    Romantic: 'The Tender Romantic',
    Playful: 'The Joyful Voyager',
    Tense: 'The Edge Dweller',
    Dreamy: 'The Lucid Dreamer',
    Mysterious: 'The Riddle Hunter',
    Nostalgic: 'The Time Traveler',
    Raw: 'The Truth Seeker',
    Euphoric: 'The Light Chaser',
  };
  return map[top] ?? 'The Cinephile';
}

function IdentityCard() {
  const { name, dob, setProfile } = useUserStore();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftDob, setDraftDob] = useState(dob);

  const save = () => {
    setProfile(draftName.trim(), draftDob);
    setEditing(false);
  };

  if (!editing)
    return (
      <div className="mt-3 flex flex-col items-center gap-1">
        {name && <div className="font-ui text-lg font-semibold text-text-primary">{name}</div>}
        {dob && (
          <div className="font-mono text-xs text-text-muted">
            born {new Date(dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
        <button
          data-hoverable
          onClick={() => {
            setDraftName(name);
            setDraftDob(dob);
            setEditing(true);
          }}
          className="link-underline mt-1 font-ui text-xs text-accent-teal"
        >
          {name || dob ? 'Edit details' : 'Add your name & birthday'}
        </button>
      </div>
    );

  return (
    <div className="glass mt-3 w-full max-w-xs space-y-3 p-4 text-left">
      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Name <span className="normal-case">(optional)</span>
        </label>
        <input
          data-hoverable
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="What should we call you?"
          maxLength={40}
          className="w-full rounded-xl border border-glass bg-void px-3 py-2 font-ui text-sm outline-none placeholder:text-text-muted focus:border-glass-hover"
        />
      </div>
      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Date of birth <span className="normal-case">(optional)</span>
        </label>
        <input
          data-hoverable
          type="date"
          value={draftDob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDraftDob(e.target.value)}
          className="w-full rounded-xl border border-glass bg-void px-3 py-2 font-ui text-sm text-text-primary outline-none focus:border-glass-hover [color-scheme:dark]"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          data-hoverable
          onClick={save}
          className="flex-1 rounded-full bg-gradient-to-r from-accent-crimson to-accent-violet py-2 font-ui text-xs font-semibold text-white"
        >
          Save
        </button>
        <button
          data-hoverable
          onClick={() => setEditing(false)}
          className="glass glass-hover flex-1 rounded-full py-2 font-ui text-xs text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { watched, watchlist } = useUserStore();
  const vec = tasteVector([...watched, ...watchlist]);
  const hasData = watched.length + watchlist.length > 0;

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-10 pb-24 md:px-12">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left */}
          <div className="flex flex-col items-center text-center">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-accent-violet to-accent-crimson" />
            <IdentityCard />
            <h2 className="mt-4 font-display text-2xl italic">{archetype(vec)}</h2>
            <p className="font-ui text-sm text-text-muted">Your movie personality</p>
            <div className="mt-6 flex gap-6 font-mono text-sm">
              <div>
                <div className="text-2xl text-text-primary">{watched.length}</div>
                <div className="text-text-muted">watched</div>
              </div>
              <div>
                <div className="text-2xl text-text-primary">{watchlist.length}</div>
                <div className="text-text-muted">watchlist</div>
              </div>
            </div>
          </div>

          {/* Center — Taste DNA */}
          <div className="flex flex-col items-center">
            <h3 className="mb-4 font-display text-xl italic">Taste DNA</h3>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-60 w-60">
              {[0.25, 0.5, 0.75, 1].map((ring) => (
                <polygon key={ring} points={points(MOODS.map(() => ring))} fill="none" stroke="rgba(255,255,255,0.06)" />
              ))}
              {MOODS.map((m, i) => {
                const a = (i / MOODS.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <text
                    key={m}
                    x={C + (RAD + 16) * Math.cos(a)}
                    y={C + (RAD + 16) * Math.sin(a)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-ui text-[7px]"
                    fill="rgba(242,240,255,0.4)"
                  >
                    {m}
                  </text>
                );
              })}
              <motion.polygon
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                points={points(vec)}
                fill="rgba(232,98,74,0.25)"
                stroke="#E8624A"
                strokeWidth={1.5}
              />
            </svg>
            {!hasData && (
              <p className="mt-2 max-w-xs text-center font-ui text-xs text-text-muted">
                Save and mark films watched to grow your fingerprint.
              </p>
            )}
          </div>

          {/* Right — lists */}
          <div>
            <h3 className="mb-4 font-display text-xl italic">Watchlist</h3>
            {watchlist.length === 0 ? (
              <p className="font-ui text-sm text-text-muted">
                Empty. <Link to="/discover" className="text-accent-crimson">Discover films →</Link>
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {watchlist.slice(0, 12).map((m) => (
                  <Link key={m.id} to={`/movie/${m.id}`} data-hoverable className="overflow-hidden rounded-lg">
                    {m.poster_path ? (
                      <img src={posterUrl(m.poster_path, 'w342')} alt={m.title} className="aspect-[2/3] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[2/3] items-center justify-center bg-surface-2 p-1 text-center font-ui text-[8px] text-text-muted">
                        {m.title}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feature settings */}
        <div className="mt-16">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl italic">Features</h3>
            <Link to="/settings" data-hoverable className="font-ui text-sm text-accent-crimson">
              All settings →
            </Link>
          </div>
          <FeatureToggles />
        </div>
      </div>
    </PageTransition>
  );
}
