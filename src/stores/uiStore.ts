import { create } from 'zustand';

export interface ActiveMovie {
  title: string;
  year: string;
  rating: number;
  genres: string[];
  overview: string;
}

export interface PlayerMovie {
  id: number;
  title: string;
  resumeAt?: number; // seconds — resume playback from here
}

interface UIState {
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  companionOpen: boolean;
  companionSeed: string | null;
  activeMovie: ActiveMovie | null;
  playerMovie: PlayerMovie | null;
  setPalette: (v: boolean) => void;
  setShortcuts: (v: boolean) => void;
  setActiveMovie: (m: ActiveMovie | null) => void;
  openCompanion: (seed?: string) => void;
  setCompanionOpen: (v: boolean) => void;
  playMovie: (m: PlayerMovie) => void;
  closePlayer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  paletteOpen: false,
  shortcutsOpen: false,
  companionOpen: false,
  companionSeed: null,
  activeMovie: null,
  playerMovie: null,
  setPalette: (v) => set({ paletteOpen: v }),
  setShortcuts: (v) => set({ shortcutsOpen: v }),
  setActiveMovie: (m) => set({ activeMovie: m }),
  openCompanion: (seed) => set({ companionOpen: true, companionSeed: seed ?? null }),
  setCompanionOpen: (v) => set({ companionOpen: v }),
  playMovie: (m) => set({ playerMovie: m }),
  closePlayer: () => set({ playerMovie: null }),
}));
