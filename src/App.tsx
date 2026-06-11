import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import MobileTabBar from '@/components/layout/MobileTabBar';
import ParticleField from '@/components/layout/ParticleField';
import CommandPalette from '@/components/layout/CommandPalette';
import ScrollProgress from '@/components/layout/ScrollProgress';
import RouteCurtain from '@/components/layout/RouteCurtain';
import AICompanion from '@/components/ai/AICompanion';
import PlayerOverlay from '@/components/cinema/PlayerOverlay';
import Home from '@/pages/Home';
import Collection from '@/pages/Collection';
import Discover from '@/pages/Discover';
import Galaxy from '@/pages/Galaxy';
import Search from '@/pages/Search';
import Profile from '@/pages/Profile';
import MovieDetail from '@/pages/MovieDetail';
import Settings from '@/pages/Settings';
import WatchParty from '@/pages/WatchParty';
import Compatibility from '@/pages/Compatibility';
import Quests from '@/pages/Quests';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore, applyTheme } from '@/stores/themeStore';
import { useEffect } from 'react';

export default function App() {
  const location = useLocation();
  const flags = useSettingsStore((s) => s.flags);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="relative min-h-screen">
      <ScrollProgress />
      <AnimatePresence mode="wait">
        <RouteCurtain key={location.pathname} />
      </AnimatePresence>
      <ParticleField />
      <Sidebar />
      <main className="relative z-10 md:ml-[72px]">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/collection/:key" element={<Collection />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/galaxy" element={<Galaxy />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/watchparty/:id"
              element={flags.watchParty ? <WatchParty /> : <Navigate to="/settings" replace />}
            />
            <Route
              path="/compatibility"
              element={flags.friendCompat ? <Compatibility /> : <Navigate to="/settings" replace />}
            />
            <Route
              path="/quests"
              element={flags.quests ? <Quests /> : <Navigate to="/settings" replace />}
            />
          </Routes>
        </AnimatePresence>
      </main>
      <MobileTabBar />
      <CommandPalette />
      <PlayerOverlay />
      <AICompanion />
    </div>
  );
}
