import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PlayerStore {
  coins: number;
  hintBalance: number;
  lastDailyFreeHint: string;
  progressIndex: number;
  starsByLevel: Record<number, number>;
  redeemedCodes: string[];
  unlimitedHints: boolean;
  tutorialDismissed: boolean;
  seenWorlds: number[];

  completeLevel: (globalLevel: number, stars: number) => void;
  addCoins: (n: number) => void;
  spendCoins: (n: number) => void;
  usePaidHint: () => void;
  addHint: (n: number) => void;
  useDailyFreeHint: () => void;
  markCodeRedeemed: (hash: string) => void;
  activateUnlimitedHints: () => void;
  markWorldSeen: (worldIndex: number) => void;
  dismissTutorial: () => void;
  canUseHint: () => boolean;
  hasDailyFreeHint: () => boolean;
  unlockAll: () => void;
  resetProgress: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      coins: 0,
      hintBalance: 10,
      lastDailyFreeHint: '',
      progressIndex: 0,
      starsByLevel: {},
      redeemedCodes: [],
      unlimitedHints: false,
      tutorialDismissed: false,
      seenWorlds: [],

      completeLevel: (globalLevel, stars) => {
        set((s) => {
          const existingStars = s.starsByLevel[globalLevel] ?? 0;
          const newStars = Math.max(existingStars, stars);
          const coinsEarned = stars * 10;
          return {
            progressIndex: Math.max(s.progressIndex, globalLevel),
            starsByLevel: { ...s.starsByLevel, [globalLevel]: newStars },
            coins: s.coins + coinsEarned,
          };
        });
      },

      addCoins: (n) => set((s) => ({ coins: s.coins + n })),

      spendCoins: (n) => set((s) => ({ coins: Math.max(0, s.coins - n) })),

      usePaidHint: () => {
        set((s) => ({
          hintBalance: s.unlimitedHints ? s.hintBalance : Math.max(0, s.hintBalance - 1),
        }));
      },

      addHint: (n) => set((s) => ({ hintBalance: s.hintBalance + n })),

      useDailyFreeHint: () => {
        const today = new Date().toISOString().split('T')[0];
        set({ hintBalance: get().hintBalance + 1, lastDailyFreeHint: today });
      },

      markCodeRedeemed: (hash) => {
        set((s) => ({ redeemedCodes: [...s.redeemedCodes, hash] }));
      },

      activateUnlimitedHints: () => {
        set({ unlimitedHints: true });
      },

      markWorldSeen: (worldIndex) => {
        set((s) => ({
          seenWorlds: s.seenWorlds.includes(worldIndex)
            ? s.seenWorlds
            : [...s.seenWorlds, worldIndex],
        }));
      },

      dismissTutorial: () => set({ tutorialDismissed: true }),

      unlockAll: () => {
        const allStars: Record<number, number> = {};
        for (let i = 1; i <= 240; i++) allStars[i] = 3;
        set({
          progressIndex: 240,
          starsByLevel: allStars,
          coins: 9999,
          hintBalance: 99,
          unlimitedHints: true,
          tutorialDismissed: true,
          seenWorlds: [0, 1, 2, 3, 4, 5, 6, 7],
        });
      },

      resetProgress: () =>
        set({
          progressIndex: 0,
          starsByLevel: {},
          coins: 0,
          hintBalance: 10,
          unlimitedHints: false,
          tutorialDismissed: false,
          seenWorlds: [],
          lastDailyFreeHint: '',
        }),

      canUseHint: () => {
        const { hintBalance, unlimitedHints } = get();
        return unlimitedHints || hintBalance > 0;
      },

      hasDailyFreeHint: () => {
        const { hintBalance, lastDailyFreeHint } = get();
        if (hintBalance > 0) return false;
        const today = new Date().toISOString().split('T')[0];
        return lastDailyFreeHint !== today;
      },
    }),
    {
      name: 'alchegrid-player',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
