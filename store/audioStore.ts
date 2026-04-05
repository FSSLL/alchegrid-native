import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioStore {
  musicVolume: number;
  sfxVolume: number;
  hapticsEnabled: boolean;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setHapticsEnabled: (v: boolean) => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      musicVolume: 0.5,
      sfxVolume: 0.8,
      hapticsEnabled: true,
      setMusicVolume: (v) => set({ musicVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
    }),
    {
      name: 'alchegrid-audio',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
