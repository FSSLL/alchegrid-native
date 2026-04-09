import React, { useEffect, useState, useMemo } from 'react';
import Pressable from './Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCommunityStore, communityLevelToGameLevel, formatSolveTime, type CommunityLevel } from '../store/communityStore';
import { getApiBase } from '../lib/apiBase';
import { useGameStore } from '../store/gameStore';
import { useT } from '../hooks/useT';

type ActiveFilter = 'all' | 'shared' | 'liked' | 'mine' | 'solved';
type SortOption = 'newest' | 'oldest' | 'grid_asc' | 'grid_desc';

interface ServerStatus {
  queuedUploads: number;
  queuedDeletes: number;
  rateLimited: boolean;
  nextRefreshIn: number;
  totalLevels: number;
}

export default function CommunityExplore() {
  const t = useT();
  const [filter, setFilter] = useState<ActiveFilter>('all');
  const [sort, setSort]   = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [hideSolved, setHideSolved] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    levels, remoteLevels, likedLevelIds, solvedLevelIds, solvedLevelTimes, syncStatus,
    getAllBrowsableLevels, getLevelById, refreshRemoteLevels,
    incrementPlays, toggleLike, deleteLevel,
  } = useCommunityStore();

  const { initGame } = useGameStore();

  const SORT_LABELS: Record<SortOption, string> = {
    newest:    t('comSortNewest'),
    oldest:    t('comSortOldest'),
    grid_asc:  t('comSortGridAsc'),
    grid_desc: t('comSortGridDesc'),
  };

  const fetchStatus = async () => {
    const base = getApiBase();
    if (!base) return;
    try {
      const res = await fetch(`${base}/api/community/status`);
      if (res.ok) setServerStatus(await res.json());
    } catch {}
  };

  const handleRefresh = async () => {
    setSyncing(true);
    setFetchError(null);
    try {
      await Promise.all([refreshRemoteLevels(), fetchStatus()]);
      if (useCommunityStore.getState().syncStatus === 'error') {
        setFetchError(t('comServerError'));
      }
    } catch {
      setFetchError(t('comServerError'));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
    const refreshId = setInterval(() => refreshRemoteLevels(), 3 * 60 * 1000);
    const statusId = setInterval(fetchStatus, 10_000);
    return () => { clearInterval(refreshId); clearInterval(statusId); };
  }, []);

  const allBrowsable = getAllBrowsableLevels();

  const filteredLevels = useMemo(() => {
    let base: CommunityLevel[];
    switch (filter) {
      case 'shared': base = remoteLevels; break;
      case 'liked':  base = allBrowsable.filter((l) => likedLevelIds.includes(l.id)); break;
      case 'mine':   base = levels.filter((l) => l.published && l.createdByPlayer); break;
      case 'solved': base = allBrowsable.filter((l) => solvedLevelIds.includes(l.id)); break;
      default:       base = allBrowsable;
    }

    const q = search.trim().toLowerCase();
    if (q) {
      base = base.filter((l) => l.name.toLowerCase().includes(q));
    }

    if (hideSolved && filter !== 'solved') {
      base = base.filter((l) => !solvedLevelIds.includes(l.id));
    }

    const sorted = [...base];
    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => {
          const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return tb - ta;
        });
        break;
      case 'oldest':
        sorted.sort((a, b) => {
          const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return ta - tb;
        });
        break;
      case 'grid_asc':  sorted.sort((a, b) => a.size - b.size); break;
      case 'grid_desc': sorted.sort((a, b) => b.size - a.size); break;
    }
    return sorted;
  }, [filter, sort, search, hideSolved, allBrowsable, remoteLevels, likedLevelIds, solvedLevelIds, levels]);

  const totalSolved = useMemo(
    () => solvedLevelIds.filter((id) => allBrowsable.some((l) => l.id === id)).length,
    [solvedLevelIds, allBrowsable],
  );
  const totalLiked = useMemo(
    () => likedLevelIds.filter((id) => allBrowsable.some((l) => l.id === id)).length,
    [likedLevelIds, allBrowsable],
  );

  const myMineCount = levels.filter((l) => l.published && l.createdByPlayer).length;
  const sharedCount = remoteLevels.length;
  const solvedCount = totalSolved;

  const handlePlay = (levelId: string) => {
    const cl = getLevelById(levelId);
    if (!cl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementPlays(levelId);
    initGame(communityLevelToGameLevel(cl));
    router.push(`/community/play/${levelId}`);
  };

  const handleDelete = (id: string) => {
    deleteLevel(id);
    setConfirmDeleteId(null);
  };

  const isSyncing = syncing || syncStatus === 'syncing';

  const FILTERS: [ActiveFilter, string][] = [
    ['all',    `${t('comFilterAll')} (${allBrowsable.length})`],
    ['shared', `${t('comFilterShared')} (${sharedCount})`],
    ['liked',  t('comFilterLiked')],
    ['solved', `${t('comFilterSolved')} (${solvedCount})`],
    ['mine',   `${t('comFilterMine')} (${myMineCount})`],
  ];

  return (
    <View style={styles.container}>
      {/* Status / refresh row */}
      <View style={styles.statusBar}>
        <Text style={styles.statusLabel}>🌐 {t('community')}</Text>
        {serverStatus?.rateLimited && (
          <View style={styles.badge}><Text style={styles.badgeText}>{t('comRateLimited')}</Text></View>
        )}
        {(serverStatus?.queuedUploads ?? 0) > 0 && (
          <View style={[styles.badge, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
            <Text style={styles.badgeText}>{t('comQueued', { n: serverStatus!.queuedUploads })}</Text>
          </View>
        )}
        <Text style={styles.remoteCount}>{t('comRemote', { n: serverStatus?.totalLevels ?? remoteLevels.length })}</Text>
        <Pressable onPress={handleRefresh} disabled={isSyncing} style={styles.refreshBtn}>
          {isSyncing
            ? <ActivityIndicator size="small" color="#60a5fa" />
            : <Text style={styles.refreshIcon}>↻</Text>}
        </Pressable>
      </View>

      {/* Error banner */}
      {fetchError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {fetchError}</Text>
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('comSearchPlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatPill icon="🗂" label={t('comLevelsCount', { n: allBrowsable.length })} />
        <StatPill icon="🏆" label={t('comSolvedCount', { n: totalSolved })} />
        {totalLiked > 0 && <StatPill icon="❤" label={t('comLikedCount', { n: totalLiked })} />}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(([f, label]) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive[f]]}
            onPress={() => { setFilter(f); setConfirmDeleteId(null); }}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort + hide-solved row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={styles.sortContent}>
        <Text style={styles.sortLabel}>{t('comSortLabel')}</Text>
        {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
          <Pressable
            key={s}
            style={[styles.sortBtn, sort === s && styles.sortBtnActive]}
            onPress={() => setSort(s)}
          >
            <Text style={[styles.sortBtnText, sort === s && styles.sortBtnTextActive]}>
              {SORT_LABELS[s]}
            </Text>
          </Pressable>
        ))}
        <View style={styles.sortSeparator} />
        <Pressable
          style={[styles.hidesolvedBtn, hideSolved && styles.hidesolvedBtnActive]}
          onPress={() => setHideSolved((v) => !v)}
        >
          <View style={[styles.checkbox, hideSolved && styles.checkboxChecked]}>
            {hideSolved && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.hidesolvedText, hideSolved && styles.hidesolvedTextActive]}>
            {t('comHideSolved')}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Level list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleRefresh}
            tintColor="#60a5fa"
          />
        }
      >
        {filteredLevels.length === 0 ? (
          <EmptyState filter={filter} hasSearch={search.length > 0} />
        ) : (
          filteredLevels.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              isSolved={solvedLevelIds.includes(level.id)}
              solveTime={solvedLevelTimes?.[level.id]}
              isLiked={likedLevelIds.includes(level.id)}
              showTrash={filter === 'mine' && level.createdByPlayer}
              confirmDelete={confirmDeleteId === level.id}
              onPlay={() => handlePlay(level.id)}
              onLike={() => toggleLike(level.id)}
              onTrash={() => setConfirmDeleteId(confirmDeleteId === level.id ? null : level.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={() => handleDelete(level.id)}
            />
          ))
        )}
        <View style={{ height: Platform.OS === 'web' ? 20 : 40 }} />
      </ScrollView>
    </View>
  );
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statText}>{icon} {label}</Text>
    </View>
  );
}

function EmptyState({ filter, hasSearch }: { filter: ActiveFilter; hasSearch: boolean }) {
  const t = useT();
  if (hasSearch) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyText}>{t('comEmptySearch')}</Text>
      </View>
    );
  }
  const messages: Record<ActiveFilter, { icon: string; textKey: 'comEmptyAll' | 'comEmptyShared' | 'comEmptyLiked' | 'comEmptySolved' | 'comEmptyMine' }> = {
    all:    { icon: '👥', textKey: 'comEmptyAll' },
    shared: { icon: '🌐', textKey: 'comEmptyShared' },
    liked:  { icon: '❤', textKey: 'comEmptyLiked' },
    solved: { icon: '🏆', textKey: 'comEmptySolved' },
    mine:   { icon: '👤', textKey: 'comEmptyMine' },
  };
  const m = messages[filter];
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{m.icon}</Text>
      <Text style={styles.emptyText}>{t(m.textKey)}</Text>
    </View>
  );
}

function LevelCard({
  level, isSolved, solveTime, isLiked, showTrash, confirmDelete,
  onPlay, onLike, onTrash, onCancelDelete, onConfirmDelete,
}: {
  level: CommunityLevel;
  isSolved: boolean;
  solveTime?: number;
  isLiked: boolean;
  showTrash: boolean;
  confirmDelete: boolean;
  onPlay: () => void;
  onLike: () => void;
  onTrash: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const t = useT();
  return (
    <View style={[styles.card, isSolved && styles.cardSolved]}>
      <View style={styles.cardMain}>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={1}>{level.name}</Text>
            {isSolved && <Text style={styles.solvedBadge}>✓</Text>}
            {!level.createdByPlayer && <Text style={styles.globalBadge}>🌐</Text>}
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.metaText}>{level.size}×{level.size}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>👁 {level.plays}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>❤ {level.likes}</Text>
            {isSolved && solveTime !== undefined && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.solveTimeText}>⏱ {formatSolveTime(solveTime)}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          <Pressable style={styles.actionBtn} onPress={onLike}>
            <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
              {isLiked ? '❤' : '🤍'}
            </Text>
          </Pressable>
          {showTrash && (
            <Pressable style={styles.actionBtn} onPress={onTrash}>
              <Text style={styles.actionIcon}>🗑</Text>
            </Pressable>
          )}
          <Pressable style={styles.playBtn} onPress={onPlay}>
            <Text style={styles.playBtnText}>{isSolved ? t('replay') : t('comPlay')}</Text>
          </Pressable>
        </View>
      </View>

      {confirmDelete && (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>{t('comDeleteConfirm')}</Text>
          <Pressable style={styles.cancelBtn} onPress={onCancelDelete}>
            <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={onConfirmDelete}>
            <Text style={styles.deleteBtnText}>{t('comDelete')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const FILTER_ACTIVE_BG: Record<ActiveFilter, string> = {
  all:    'rgba(96,165,250,0.2)',
  shared: 'rgba(59,130,246,0.25)',
  liked:  'rgba(244,63,94,0.2)',
  solved: 'rgba(16,185,129,0.2)',
  mine:   'rgba(251,191,36,0.2)',
};
const FILTER_ACTIVE_BORDER: Record<ActiveFilter, string> = {
  all:    'rgba(96,165,250,0.5)',
  shared: 'rgba(59,130,246,0.5)',
  liked:  'rgba(244,63,94,0.5)',
  solved: 'rgba(16,185,129,0.5)',
  mine:   'rgba(251,191,36,0.5)',
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 14, paddingVertical: 7,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
  },
  statusLabel: { color: '#93c5fd', fontSize: 13, fontWeight: '700', flex: 1 },
  badge: {
    backgroundColor: 'rgba(245,158,11,0.25)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)',
  },
  badgeText: { color: '#fbbf24', fontSize: 11, fontWeight: '700' },
  remoteCount: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  refreshBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { color: '#60a5fa', fontSize: 20, fontWeight: '700' },

  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)', borderBottomWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)', paddingHorizontal: 14, paddingVertical: 8,
  },
  errorBannerText: { color: '#fca5a5', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginTop: 8, marginBottom: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10, height: 38,
  },
  searchIcon: { fontSize: 14, marginRight: 6, opacity: 0.5 },
  searchInput: {
    flex: 1, color: '#fff', fontSize: 14, paddingVertical: 0,
    fontWeight: '500',
  },
  clearBtn: {
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  clearBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },

  filterRow: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },

  sortRow: { maxHeight: 40, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  sortContent: { paddingHorizontal: 12, paddingVertical: 5, gap: 6, alignItems: 'center' },
  sortLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600', marginRight: 2, alignSelf: 'center' },
  sortBtn: {
    paddingHorizontal: 11, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sortBtnActive: { backgroundColor: 'rgba(96,165,250,0.2)', borderColor: 'rgba(96,165,250,0.45)' },
  sortBtnText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
  sortBtnTextActive: { color: '#93c5fd', fontWeight: '700' },

  sortSeparator: {
    width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 2, alignSelf: 'center',
  },
  hidesolvedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  hidesolvedBtnActive: {
    backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.4)',
  },
  checkbox: {
    width: 14, height: 14, borderRadius: 3,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fbbf24', borderColor: '#fbbf24',
  },
  checkmark: { color: '#1e293b', fontSize: 9, fontWeight: '900', lineHeight: 12 },
  hidesolvedText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
  hidesolvedTextActive: { color: '#fbbf24', fontWeight: '700' },

  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: {
    all:    { backgroundColor: FILTER_ACTIVE_BG.all,    borderColor: FILTER_ACTIVE_BORDER.all },
    shared: { backgroundColor: FILTER_ACTIVE_BG.shared, borderColor: FILTER_ACTIVE_BORDER.shared },
    liked:  { backgroundColor: FILTER_ACTIVE_BG.liked,  borderColor: FILTER_ACTIVE_BORDER.liked },
    solved: { backgroundColor: FILTER_ACTIVE_BG.solved, borderColor: FILTER_ACTIVE_BORDER.solved },
    mine:   { backgroundColor: FILTER_ACTIVE_BG.mine,   borderColor: FILTER_ACTIVE_BORDER.mine },
  },
  filterBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  filterBtnTextActive: { color: '#fff', fontWeight: '700' },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 6, gap: 8 },

  emptyWrap: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyIcon: { fontSize: 40, opacity: 0.5 },
  emptyText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  cardSolved: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'nowrap' },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  solvedBadge: { color: '#34d399', fontSize: 13, fontWeight: '800' },
  globalBadge: { fontSize: 13 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
  metaText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  metaDot: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },
  solveTimeText: { color: '#34d399', fontSize: 12, fontWeight: '700' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: {
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
  },
  actionIcon: { fontSize: 17 },
  likedIcon: { color: '#f43f5e' },
  playBtn: {
    backgroundColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
  },
  playBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  confirmRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', borderTopWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    paddingTop: 8,
  },
  confirmText: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  cancelBtn: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8,
  },
  cancelBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ef4444', borderRadius: 8 },
  deleteBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
