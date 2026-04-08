import React, { useEffect, useState } from 'react';
import Pressable from '../../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHardcoreStore } from '../../store/hardcoreStore';
import { useGameStore } from '../../store/gameStore';
import { getHardcoreLevel } from '../../lib/generateHardcoreLevel';

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function getNextSundayResetMs(): number {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntil = day === 0
    ? (now.getUTCHours() >= 3 ? 7 : 0)
    : (7 - day);
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + daysUntil);
  next.setUTCHours(3, 0, 0, 0);
  return next.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const REASON_META: Record<string, { title: string; icon: string }> = {
  mistakes:  { title: 'Out of Lives!',    icon: '💀' },
  inactivity:{ title: 'Timed Out!',       icon: '💀' },
  surrender: { title: 'Run Ended',        icon: '💀' },
  completed: { title: 'All 70 Cleared!',  icon: '👑' },
};

export default function HardcoreLobby() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const [tab, setTab] = useState<'start' | 'leaderboard'>('start');
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetIn, setResetIn] = useState(() => getNextSundayResetMs());

  useEffect(() => {
    const id = setInterval(() => setResetIn(getNextSundayResetMs()), 60_000);
    return () => clearInterval(id);
  }, []);

  const {
    runActive, showGameOver, gameOverReason,
    currentLevel, totalTimeMs, mistakesLeft, bestLevel,
    leaderboard, startRun, submitScore, dismissGameOver, refreshLeaderboard,
  } = useHardcoreStore();

  const { initGame } = useGameStore();

  useEffect(() => { refreshLeaderboard(); }, []);

  const handleStartRun = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRun();
    const level = getHardcoreLevel(1);
    if (level) initGame(level);
    router.push('/hardcore/play');
  };

  const handlePlayAgain = () => {
    dismissGameOver();
    setSubmitted(false);
    setPlayerName('');
    handleStartRun();
  };

  const handleSubmit = async () => {
    if (!playerName.trim() || submitted) return;
    setSubmitting(true);
    await submitScore(playerName.trim());
    setSubmitting(false);
    setSubmitted(true);
    setTab('leaderboard');
  };

  // ── Game Over card ──────────────────────────────────────────────────────
  if (showGameOver) {
    const meta = REASON_META[gameOverReason ?? 'surrender'] ?? REASON_META.surrender;
    const levelReached = gameOverReason === 'completed' ? currentLevel : currentLevel - 1;
    const canSubmit = levelReached >= 1;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <Text style={styles.gameOverIcon}>{meta.icon}</Text>
        <Text style={styles.gameOverTitle}>{meta.title}</Text>
        <Text style={styles.gameOverSub}>Hardcore Mode</Text>

        <View style={styles.statsGrid}>
          <StatBox label="Level Reached" value={levelReached.toString()} accent={levelReached >= 70 ? '#fbbf24' : '#60a5fa'} />
          <StatBox label="of 70" value="/70" accent="rgba(255,255,255,0.3)" />
          <StatBox label="Total Time" value={formatTime(totalTimeMs)} accent="#34d399" />
          <StatBox label="Best Level" value={bestLevel.toString()} accent="#fb923c" />
        </View>

        {canSubmit && !submitted && (
          <View style={styles.submitSection}>
            <Text style={styles.submitLabel}>Save your run to the leaderboard</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name (max 20 chars)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={playerName}
              onChangeText={(t) => setPlayerName(t.slice(0, 20))}
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              style={[styles.submitBtn, (!playerName.trim() || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!playerName.trim() || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>Submit Score</Text>}
            </Pressable>
          </View>
        )}

        {submitted && <Text style={styles.submittedText}>✓ Run submitted!</Text>}

        <View style={styles.gameOverButtons}>
          <Pressable style={styles.playAgainBtn} onPress={handlePlayAgain}>
            <Text style={styles.playAgainText}>▶  Play Again</Text>
          </Pressable>
          <Pressable style={styles.homeBtn} onPress={() => { dismissGameOver(); router.back(); }}>
            <Text style={styles.homeBtnText}>← Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── Normal lobby ──────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Hardcore Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'start' && styles.tabActive]}
          onPress={() => setTab('start')}
        >
          <Text style={[styles.tabText, tab === 'start' && styles.tabTextActive]}>Start</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'leaderboard' && styles.tabActive]}
          onPress={() => { setTab('leaderboard'); refreshLeaderboard(); }}
        >
          <Text style={[styles.tabText, tab === 'leaderboard' && styles.tabTextActive]}>Leaderboard</Text>
        </Pressable>
      </View>

      {tab === 'start' ? (
        <ScrollView contentContainerStyle={styles.startContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.modeDesc}>
            70 handcrafted levels. 3 lives. No hints. No zone tooltips.
            Climb from 4×4 to 7×7 — or die trying.
          </Text>

          <View style={styles.livesRow}>
            {[0, 1, 2].map((i) => (
              <Text key={i} style={styles.lifeHeart}>❤️</Text>
            ))}
            <Text style={styles.livesLabel}>Three lives total</Text>
          </View>

          <View style={styles.rulesBox}>
            <RuleRow icon="💀" text="3 lives shared across all 70 levels" />
            <RuleRow icon="🚫" text="No hints, no zone tooltips" />
            <RuleRow icon="📈" text="4×4 → 7×7 grid progression" />
            <RuleRow icon="⏱" text="60 second inactivity timeout" />
            <RuleRow icon="👑" text="Beat all 70 to join the legends" />
          </View>

          {bestLevel > 0 && (
            <View style={styles.bestRow}>
              <Text style={styles.bestLabel}>Your Best</Text>
              <Text style={styles.bestVal}>Level {bestLevel}</Text>
            </View>
          )}

          <Pressable style={styles.startBtn} onPress={handleStartRun} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Start Hardcore Run</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.lbContent} showsVerticalScrollIndicator={false}>
          <View style={styles.resetNote}>
            <Text style={styles.resetNoteText}>🔄 Resets every Sunday at 6 AM (GMT+3)</Text>
            <Text style={styles.resetNoteCountdown}>Next reset in {formatCountdown(resetIn)}</Text>
          </View>
          {leaderboard.length === 0 ? (
            <Text style={styles.emptyLb}>No runs yet — be the first!</Text>
          ) : (
            leaderboard.map((entry, i) => (
              <View key={`${entry.playerName}-${i}`} style={styles.lbRow}>
                <Text style={[styles.lbRank, i === 0 && { color: '#fbbf24' }]}>{i + 1}</Text>
                <View style={styles.lbInfo}>
                  <Text style={styles.lbName}>{entry.playerName}</Text>
                  <Text style={styles.lbMeta}>{formatTime(entry.totalTimeMs)}</Text>
                </View>
                <View style={styles.lbLevelWrap}>
                  <Text style={styles.lbLevel}>Lv {entry.levelReached}</Text>
                  {entry.levelReached >= 70 && <Text style={styles.lbCrown}>👑</Text>}
                </View>
              </View>
            ))
          )}
          <View style={{ height: Platform.OS === 'web' ? 20 : insets.bottom + 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

function StatBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RuleRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleIcon}>{icon}</Text>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(8,11,18,0.97)' },
  content: { paddingHorizontal: 20, paddingBottom: 48 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
  },
  backIcon: { color: '#cbd5e1', fontSize: 20, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 12 },
  tabText: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  tabTextActive: { color: '#f87171', fontWeight: '800' },

  startContent: { paddingHorizontal: 20, paddingTop: 16, gap: 16, paddingBottom: 40 },
  modeDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  livesRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  lifeHeart: { fontSize: 22 },
  livesLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600', marginLeft: 4 },

  rulesBox: {
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleIcon: { fontSize: 18, width: 28 },
  ruleText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500', flex: 1 },

  bestRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  bestLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600' },
  bestVal: { color: '#f87171', fontSize: 20, fontWeight: '900' },

  startBtn: {
    backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },

  lbContent: { paddingHorizontal: 16, paddingTop: 12, gap: 2 },
  resetNote: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, marginBottom: 12, alignItems: 'center', gap: 2 },
  resetNoteText: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  resetNoteCountdown: { color: '#ff6a00', fontSize: 12, fontWeight: '600' },
  emptyLb: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40, fontSize: 15 },
  lbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12,
  },
  lbRank: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '900', width: 24, textAlign: 'center' },
  lbInfo: { flex: 1 },
  lbName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  lbMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  lbLevelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lbLevel: { color: '#f87171', fontSize: 18, fontWeight: '900' },
  lbCrown: { fontSize: 16 },

  // Game Over
  gameOverIcon: { fontSize: 52, textAlign: 'center', marginTop: 8 },
  gameOverTitle: { fontSize: 30, fontWeight: '900', color: '#fff', textAlign: 'center', marginTop: 4 },
  gameOverSub: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14,
    alignItems: 'center', width: '45%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  submitSection: { gap: 10, marginBottom: 12 },
  submitLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center' },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  submitBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  submittedText: { color: '#34d399', textAlign: 'center', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  gameOverButtons: { gap: 10 },
  playAgainBtn: { backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  playAgainText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  homeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
