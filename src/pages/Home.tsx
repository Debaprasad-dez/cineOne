import { motion } from 'framer-motion';
import { useTrending, usePopular, useTopRated, useHiddenGems } from '@/hooks/useTMDB';
import { getTimeMood } from '@/utils/timeOfDay';
import MovieRow from '@/components/cinema/MovieRow';
import ContinueWatchingRow from '@/components/cinema/ContinueWatchingRow';
import PageTransition from '@/components/layout/PageTransition';
import HeroGalaxy from '@/components/three/HeroGalaxy';
import HeroActions from '@/components/cinema/HeroActions';

export default function Home() {
  const mood = getTimeMood();
  const trending = useTrending();
  const popular = usePopular();
  const topRated = useTopRated();
  const gems = useHiddenGems();

  return (
    <PageTransition>
      <div className="pb-24 md:pb-12">
        {/* GALAXY HERO */}
        <section className="relative h-screen w-full overflow-hidden">
          <div className="absolute inset-0 scale-110 blur-[3px]">
            <HeroGalaxy />
          </div>

          {/* readability scrim: darken + center vignette behind copy */}
          <div className="pointer-events-none absolute inset-0 bg-void/45" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_center,rgba(5,5,8,0.75)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent" />

          {/* overlaid copy */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-start px-6 pt-[12vh] text-center md:pt-[20vh]">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 font-mono text-xs uppercase tracking-[0.4em]"
              style={{ color: mood.accent }}
            >
              {mood.title}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="display-fluid max-w-5xl text-5xl text-text-primary md:text-8xl"
            >
              A universe of cinema,
              <br />
              <span className="text-gradient">mapped to your mind.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 max-w-xl font-ui text-base text-text-secondary"
            >
              Every star a film. Drift through constellations of genre, or let the AI curator read your emotional fingerprint.
            </motion.p>

            {/* action band — 32px below the copy */}
            <div className="pointer-events-auto mt-8 w-full">
              <HeroActions />
            </div>
          </div>

        </section>

        {/* ROWS */}
        <div className="relative z-10 px-6 md:-mt-12 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-text-muted">{mood.subtitle}</span>
          </motion.div>

          <ContinueWatchingRow />
          <MovieRow title="Trending Now" movies={trending.data} loading={trending.isLoading} accent={mood.accent} seeAllTo="/collection/trending" />
          <MovieRow title={`Matching ${mood.title}`} movies={popular.data} loading={popular.isLoading} accent={mood.accent} seeAllTo="/collection/popular" />
          <MovieRow title="The Cinematic Canon" movies={topRated.data} loading={topRated.isLoading} accent="#C9954C" seeAllTo="/collection/top-rated" />
          <MovieRow title="Hidden Gems" movies={gems.data} loading={gems.isLoading} accent="#4ECDC4" seeAllTo="/collection/hidden-gems" />
        </div>
      </div>
    </PageTransition>
  );
}
