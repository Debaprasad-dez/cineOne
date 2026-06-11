import PageTransition from '@/components/layout/PageTransition';
import FeatureToggles from '@/components/layout/FeatureToggles';
import ThemePicker from '@/components/layout/ThemePicker';

export default function Settings() {
  return (
    <PageTransition>
      <div className="mx-auto min-h-screen max-w-2xl px-6 py-10 pb-24 md:px-12">
        <h1 className="mb-2 font-display text-4xl italic">Settings</h1>
        <p className="mb-8 font-ui text-text-secondary">Personalize CinemaOne. Changes save automatically.</p>

        <h2 className="eyebrow mb-3">Theme</h2>
        <ThemePicker />

        <div className="hairline my-8" />

        <h2 className="eyebrow mb-3">Features</h2>
        <FeatureToggles />
      </div>
    </PageTransition>
  );
}
