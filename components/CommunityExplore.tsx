import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCommunityStore, communityLevelToGameLevel, type CommunityLevel } from '../store/communityStore';
import { useGameStore } from '../store/gameStore';

type ActiveFilter = 'all' | 'shared' | 'liked' | 'mine';

interface ServerStatus {
  queuedUploads: number;
  queuedDeletes: number;
  rateLimited: boolean;
  nextRefreshIn: number;
  totalLevels: number;
}

function getApiBase(): string {
  try {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname.replace('.expo.', '.');
      return `${window.location.protocol}//${h}`;
    }
  } catch {}
  return '';
}

export default function CommunityExplore() {
  const [filter, setFilter] = useState<ActiveFilter>('all');
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const {
    levels, remoteLevels, likedLevelIds, solvedLevelIds, syncStatus,
    getAllBrowsableLevels, getLevelById, refreshRemoteLevels,
    incrementPlays, toggleLike, deleteLevel,
  } = useCommunityStore();

  const { initGame } = useGameStore();

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
    await Promise.all([refreshRemoteLevels(), fetchStatus()]);
    setSyncing(false);
  };

  useEffect(() => {
    handleRefresh();
    const refreshId = setInterval(() => refreshRemoteLevels(), 3 * 60 * 1000);
    const statusId = setInterval(fetchStatus, 10_000);
    return () => { clearInterval(refreshId); clearInterval(statusId); };
  }, []);

  const allBrowsable = getAllBrowsableLevels();

  const filteredLevels = useMemo(() => {
    switch (filter) {
      case 'all': return allBrowsable;
      case 'shared': return remoteLevels;
      case 'liked': return allBrowsable.filter((l) => likedLevelIds.includes(l.id));
      case 'mine': return levels.filter((l) => l.published && l.createdByPlayer);
    }
  }, [filter, allBrowsable, remoteLevels, likedLevelIds, levels]);

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

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusLabel}>🌐 Community</Text>
        {serverStatus?.rateLimited && (
          <View style={styles.badge}><Text style={styles.badgeText}>⚠ Rate limited</Text></View>
        )}
        {(serverStatus?.queuedUploads ?? 0) > 0 && (
          <View style={[styles.badge, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
            <Text style={styles.badgeText}>↑ {serverStatus!.queuedUploads} queued</Text>
          </View>
        )}
        <Text style={styles.remoteCount}>{serverStatus?.totalLevels ?? remoteLevels.length} remote</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={isSyncing} style={styles.refreshBtn}>
          {isSyncing
            ? <ActivityIndicator size="small" color="#60a5fa" />
            : <Text style={styles.refreshIcon}>↻</Text>}
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatPill icon="🗂" label={`${allBrowsable.length} levels`} />
        <StatPill icon="🏆" label={`${totalSolved} solved`} />
        {totalLiked > 0 && <StatPill icon="❤" label={`${totalLiked} liked`} />}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {([['all', `All (${allBrowsable.length})`], ['shared', `🌐 Shared (${sharedCount})`], ['liked', '❤ Liked'], ['mine', `👤 Mine (${myMineCount})`]] as [ActiveFilter, string][]).map(([f, label]) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive[f]]}
            onPress={() => { setFilter(f); setConfirmDeleteId(null); }}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Level list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredLevels.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filteredLevels.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              isSolved={solvedLevelIds.includes(level.id)}
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

function EmptyState({ filter }: { filter: ActiveFilter }) {
  const messages: Record<ActiveFilter, { icon: string; text: string }> = {
    all: { icon: '👥', text: 'No levels yet. Create or refresh to discover levels.' },
    shared: { icon: '🌐', text: 'No shared levels yet. Tap Refresh.' },
    liked: { icon: '❤', text: 'No liked levels yet.' },
    mine: { icon: '👤', text: "You haven't published any levels yet." },
  };
  const m = messages[filter];
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{m.icon}</Text>
      <Text style={styles.emptyText}>{m.text}</Text>
    </View>
  );
}

function LevelCard({
  level, isSolved, isLiked, showTrash, confirmDelete,
  onPlay, onLike, onTrash, onCancelDelete, onConfirmDelete,
}: {
  level: CommunityLevel;
  isSolved: boolean;
  isLiked: boolean;
  showTrash: boolean;
  confirmDelete: boolean;
  onPlay: () => void;
  onLike: () => void;
  onTrash: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <View style={[styles.card, isSolved && styles.cardSolved]}>
      <View style={styles.cardMain}>
        {/* Left: info */}
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
          </View>
        </View>

        {/* Right: actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
            <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
              {isLiked ? '❤' : '🤍'}
            </Text>
          </TouchableOpacity>
          {showTrash && (
            <TouchableOpacity style={styles.actionBtn} onPress={onTrash}>
              <Text style={styles.actionIcon}>🗑</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.playBtn} onPress={onPlay}>
            <Text style={styles.playBtnText}>{isSolved ? 'Replay' : 'Play'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete confirmation row */}
      {confirmDelete && (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>Delete this level permanently?</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelDelete}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={onConfirmDelete}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Dynamic active color per filter
const FILTER_ACTIVE_BG: Record<ActiveFilter, string> = {
  all: 'rgba(96,165,250,0.2)',
  shared: 'rgba(59,130,246,0.25)',
  liked: 'rgba(244,63,94,0.2)',
  mine: 'rgba(251,191,36,0.2)',
};
const FILTER_ACTIVE_BORDER: Record<ActiveFilter, string> = {
  all: 'rgba(96,165,250,0.5)',
  shared: 'rgba(59,130,246,0.5)',
  liked: 'rgba(244,63,94,0.5)',
  mine: 'rgba(251,191,36,0.5)',
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
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterBtnActive: {
    all: { backgroundColor: FILTER_ACTIVE_BG.all, borderColor: FILTER_ACTIVE_BORDER.all },
    shared: { backgroundColor: FILTER_ACTIVE_BG.shared, borderColor: FILTER_ACTIVE_BORDER.shared },
    liked: { backgroundColor: FILTER_ACTIVE_BG.liked, borderColor: FILTER_ACTIVE_BORDER.liked },
    mine: { backgroundColor: FILTER_ACTIVE_BG.mine, borderColor: FILTER_ACTIVE_BORDER.mine },
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
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  metaDot: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },

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
