import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Level, Zone, ElementID, CellCoord } from '../lib/types';

// ── Pending tab signal (avoids navigation stacking) ──────────────────────────
let _pendingCommunityTab: 'explore' | 'build' | null = null;
export function requestCommunityTab(tab: 'explore' | 'build') { _pendingCommunityTab = tab; }
export function takePendingCommunityTab(): 'explore' | 'build' | null {
  const t = _pendingCommunityTab;
  _pendingCommunityTab = null;
  return t;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CommunityLevel {
  id: string;
  name: string;
  size: number;
  elements: ElementID[];
  zones: Zone[];
  canonicalSolution: ElementID[][];
  createdAt: string;
  updatedAt: string;
  published: boolean;
  publishedAt: string | null;
  plays: number;
  likes: number;
  createdByPlayer: boolean;
}

export interface DraftState {
  name: string;
  size: number;
  zones: Zone[];
  currentZoneCells: CellCoord[];
  editingZoneIndex: number | null;
  canonicalSolution: ElementID[][] | null;
  solvedAfterLastEdit: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';
export type ActiveFilter = 'all' | 'shared' | 'liked' | 'mine';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getApiBase(): string {
  // 1. Native iOS/Android: use the hardcoded production URL from app.json extra
  const configured: string | undefined = Constants.expoConfig?.extra?.apiUrl;
  if (configured) return configured.replace(/\/$/, '');

  // 2. Web / dev preview fallback: derive from window.location
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const h = window.location.hostname.replace('.expo.', '.');
      return `${window.location.protocol}//${h}`;
    }
  } catch {}
  return '';
}

function generateId(): string {
  return 'cl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export function deriveElements(zones: Zone[]): ElementID[] {
  const set = new Set<string>();
  zones.forEach((z) => z.ingredients.forEach((i) => set.add(i)));
  return [...set].sort();
}

export function communityLevelToGameLevel(cl: CommunityLevel): Level {
  return {
    id: cl.id,
    worldId: 'community',
    size: cl.size,
    elements: cl.elements,
    zones: cl.zones,
    canonicalSolution: cl.canonicalSolution,
    starThresholds: { three: 60, two: 120 },
  };
}

export function formatSolveTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function createEmptyDraft(): DraftState {
  return {
    name: '',
    size: 5,
    zones: [],
    currentZoneCells: [],
    editingZoneIndex: null,
    canonicalSolution: null,
    solvedAfterLastEdit: false,
  };
}

async function uploadToServer(level: CommunityLevel): Promise<boolean> {
  const base = getApiBase();
  if (!base) return false;
  try {
    await fetch(`${base}/api/community/init`, { method: 'POST' });
    const res = await fetch(`${base}/api/community/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(level),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deleteFromServer(id: string): Promise<void> {
  const base = getApiBase();
  if (!base) return;
  try {
    await fetch(`${base}/api/community/levels/${id}`, { method: 'DELETE' });
  } catch { /* fire-and-forget */ }
}

export async function checkNameAvailability(name: string): Promise<'available' | 'taken' | 'error'> {
  const base = getApiBase();
  if (!base) return 'error';
  try {
    const res = await fetch(`${base}/api/community/levels`);
    if (!res.ok) return 'error';
    const levels: CommunityLevel[] = await res.json();
    const taken = levels.some((l) => l.name.trim().toLowerCase() === name.trim().toLowerCase());
    return taken ? 'taken' : 'available';
  } catch {
    return 'error';
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface CommunityStore {
  // Persisted
  levels: CommunityLevel[];
  draft: DraftState;
  likedLevelIds: string[];
  solvedLevelIds: string[];
  solvedLevelTimes: Record<string, number>;
  // Not persisted
  remoteLevels: CommunityLevel[];
  syncStatus: SyncStatus;

  // Draft actions
  setDraftName: (name: string) => void;
  setDraftSize: (size: number) => void;
  addCellToCurrentZone: (r: number, c: number) => void;
  removeCellFromCurrentZone: (r: number, c: number) => void;
  clearCurrentZone: () => void;
  commitCurrentZone: (recipe: { name: string; ingredients: string[] }) => void;
  editZone: (index: number) => void;
  removeZone: (index: number) => void;
  markEdited: () => void;
  markSolved: () => void;
  setSolution: (solution: ElementID[][]) => void;
  resetDraft: () => void;

  // Level management
  publishLevel: () => Promise<string>;
  deleteLevel: (id: string) => void;

  // Play tracking
  incrementPlays: (id: string) => void;
  toggleLike: (id: string) => void;
  markLevelSolved: (id: string, timeSeconds?: number) => void;

  // Publish sync status (per publish attempt)
  publishSyncStatus: 'idle' | 'uploading' | 'uploaded' | 'error';

  // Remote sync
  refreshRemoteLevels: () => Promise<void>;

  // Selectors
  getAllBrowsableLevels: () => CommunityLevel[];
  getLevelById: (id: string) => CommunityLevel | null;
}

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      levels: [],
      draft: createEmptyDraft(),
      likedLevelIds: [],
      solvedLevelIds: [],
      solvedLevelTimes: {},
      remoteLevels: [],
      syncStatus: 'idle',
      publishSyncStatus: 'idle',

      // ── Draft actions ─────────────────────────────────────────────────────

      setDraftName: (name) => set((s) => ({ draft: { ...s.draft, name } })),

      setDraftSize: (size) =>
        set((s) => ({
          draft: {
            ...createEmptyDraft(),
            name: s.draft.name,
            size,
          },
        })),

      addCellToCurrentZone: (r, c) =>
        set((s) => ({
          draft: {
            ...s.draft,
            currentZoneCells: [...s.draft.currentZoneCells, { row: r, col: c }],
          },
        })),

      removeCellFromCurrentZone: (r, c) =>
        set((s) => ({
          draft: {
            ...s.draft,
            currentZoneCells: s.draft.currentZoneCells.filter(
              (cell) => !(cell.row === r && cell.col === c),
            ),
          },
        })),

      clearCurrentZone: () =>
        set((s) => ({
          draft: { ...s.draft, currentZoneCells: [], editingZoneIndex: null },
        })),

      commitCurrentZone: (recipe) =>
        set((s) => {
          const { draft } = s;
          const newZone: Zone = {
            id: `cz_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            recipeName: recipe.name,
            ingredients: recipe.ingredients,
            cells: [...draft.currentZoneCells],
          };

          let newZones: Zone[];
          if (draft.editingZoneIndex !== null) {
            newZones = draft.zones.map((z, i) =>
              i === draft.editingZoneIndex ? newZone : z,
            );
          } else {
            newZones = [...draft.zones, newZone];
          }

          return {
            draft: {
              ...draft,
              zones: newZones,
              currentZoneCells: [],
              editingZoneIndex: null,
              solvedAfterLastEdit: false,
              canonicalSolution: null,
            },
          };
        }),

      editZone: (index) =>
        set((s) => ({
          draft: {
            ...s.draft,
            currentZoneCells: [...s.draft.zones[index].cells],
            editingZoneIndex: index,
          },
        })),

      removeZone: (index) =>
        set((s) => ({
          draft: {
            ...s.draft,
            zones: s.draft.zones.filter((_, i) => i !== index),
            solvedAfterLastEdit: false,
            canonicalSolution: null,
          },
        })),

      markEdited: () =>
        set((s) => ({
          draft: { ...s.draft, solvedAfterLastEdit: false, canonicalSolution: null },
        })),

      markSolved: () =>
        set((s) => ({ draft: { ...s.draft, solvedAfterLastEdit: true } })),

      setSolution: (solution) =>
        set((s) => ({ draft: { ...s.draft, canonicalSolution: solution } })),

      resetDraft: () => set({ draft: createEmptyDraft() }),

      // ── Level management ──────────────────────────────────────────────────

      publishLevel: async () => {
        const { draft } = get();
        const elements = deriveElements(draft.zones);
        const id = generateId();
        const now = new Date().toISOString();
        const cl: CommunityLevel = {
          id,
          name: draft.name.trim() || `Community Level #${Date.now().toString(36)}`,
          size: draft.size,
          elements,
          zones: draft.zones,
          canonicalSolution: draft.canonicalSolution ?? [],
          createdAt: now,
          updatedAt: now,
          published: true,
          publishedAt: now,
          plays: 0,
          likes: 0,
          createdByPlayer: true,
        };
        set((s) => ({ levels: [cl, ...s.levels], draft: createEmptyDraft(), publishSyncStatus: 'uploading' }));
        const ok = await uploadToServer(cl);
        set({ publishSyncStatus: ok ? 'uploaded' : 'error' });
        if (ok) {
          get().refreshRemoteLevels();
        }
        return id;
      },

      deleteLevel: (id) => {
        set((s) => ({ levels: s.levels.filter((l) => l.id !== id) }));
        deleteFromServer(id);
      },

      // ── Play tracking ─────────────────────────────────────────────────────

      incrementPlays: (id) => {
        // Update local state optimistically
        set((s) => ({
          levels: s.levels.map((l) => (l.id === id ? { ...l, plays: l.plays + 1 } : l)),
          remoteLevels: s.remoteLevels.map((l) => (l.id === id ? { ...l, plays: l.plays + 1 } : l)),
        }));
        // Fire-and-forget server update
        const base = getApiBase();
        if (base) {
          fetch(`${base}/api/community/levels/${id}/play`, { method: 'POST' }).catch(() => {});
        }
      },

      toggleLike: (id) =>
        set((s) => {
          const liked = s.likedLevelIds.includes(id);
          return {
            likedLevelIds: liked
              ? s.likedLevelIds.filter((x) => x !== id)
              : [...s.likedLevelIds, id],
            levels: s.levels.map((l) =>
              l.id === id ? { ...l, likes: liked ? l.likes - 1 : l.likes + 1 } : l,
            ),
          };
        }),

      markLevelSolved: (id, timeSeconds) =>
        set((s) => ({
          solvedLevelIds: s.solvedLevelIds.includes(id)
            ? s.solvedLevelIds
            : [...s.solvedLevelIds, id],
          solvedLevelTimes: timeSeconds !== undefined
            ? { ...s.solvedLevelTimes, [id]: timeSeconds }
            : s.solvedLevelTimes,
        })),

      // ── Remote sync ───────────────────────────────────────────────────────

      refreshRemoteLevels: async () => {
        const base = getApiBase();
        if (!base) return;
        set({ syncStatus: 'syncing' });
        try {
          const res = await fetch(`${base}/api/community/levels`);
          if (!res.ok) throw new Error('fetch failed');
          const data: CommunityLevel[] = await res.json();
          set({ remoteLevels: data, syncStatus: 'idle' });
        } catch {
          set({ syncStatus: 'error' });
        }
      },

      // ── Selectors ─────────────────────────────────────────────────────────

      getAllBrowsableLevels: () => {
        const { levels, remoteLevels } = get();
        const localIds = new Set(levels.map((l) => l.id));
        const published = levels.filter((l) => l.published);
        const remote = remoteLevels.filter((r) => !localIds.has(r.id));
        return [...published, ...remote];
      },

      getLevelById: (id) => {
        const { levels, remoteLevels } = get();
        return (
          levels.find((l) => l.id === id) ??
          remoteLevels.find((l) => l.id === id) ??
          null
        );
      },
    }),
    {
      name: 'elemental-community-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      migrate: (persisted: any, version: number) => {
        if (version < 6) {
          return { ...persisted, solvedLevelTimes: {} };
        }
        return persisted;
      },
      partialize: (state) => ({
        levels: state.levels,
        draft: state.draft,
        likedLevelIds: state.likedLevelIds,
        solvedLevelIds: state.solvedLevelIds,
        solvedLevelTimes: state.solvedLevelTimes,
      }),
    },
  ),
);
