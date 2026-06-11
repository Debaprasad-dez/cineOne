import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';
import MovieCard, { MovieCardSkeleton } from '@/components/cinema/MovieCard';
import { useCollection, COLLECTION_META, type CollectionKey } from '@/hooks/useTMDB';

export default function Collection() {
  const { key } = useParams<{ key: string }>();
  const meta = key && key in COLLECTION_META ? COLLECTION_META[key as CollectionKey] : null;

  if (!meta) return <Navigate to="/" replace />;
  return <Inner key={key} collectionKey={key as CollectionKey} title={meta.title} accent={meta.accent} />;
}

function Inner({ collectionKey, title, accent }: { collectionKey: CollectionKey; title: string; accent: string }) {
  const { data: movies, isLoading } = useCollection(collectionKey);

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-10 pb-24 md:px-12">
        <Link
          to="/"
          data-hoverable
          className="link-underline mb-6 inline-block font-ui text-sm text-text-secondary hover:text-text-primary"
        >
          ← Home
        </Link>

        <div className="mb-10">
          <div className="eyebrow mb-1.5 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            Collection
          </div>
          <h1 className="display-fluid text-4xl text-text-primary md:text-6xl">{title}</h1>
          {!isLoading && movies && (
            <p className="mt-2 font-mono text-xs text-text-muted">{movies.length} films</p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {isLoading
            ? Array.from({ length: 18 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : movies?.map((m, i) => <MovieCard key={m.id} movie={m} index={i} />)}
        </motion.div>
      </div>
    </PageTransition>
  );
}
