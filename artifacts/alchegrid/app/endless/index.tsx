import React, { useEffect, useState, useRef } from 'react';
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
import { useEndlessStore } from '../../store/endlessStore';
import { useGameStore } from '../../store/gameStore';
import { generateEndlessLevel } from '../../lib/generateEndlessLevel';

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function formatScore(n: number): string {
  return n.toLocaleString();
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

export default function EndlessLobby() {
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
    runActive,
    showGameOver,
    gameOverReason,
    totalScore,
    levelsCompleted,
    totalMistakes,
    totalTimeMs,
    skillTracker,
    bestScore,
    leaderboard,
    startRun,
    submitScore,
    dismissGameOver,
    refreshLeaderboard,
  } = useEndlessStore();

  const { initGame } = useGameStore();

  useEffect(() => {
    refreshLeaderboard();
  }, []);

  const handleStartRun = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startRun();
    const level = generateEndlessLevel(4, 0, 0);
    initGame(level);
    router.push('/endless/play');
  };

  const handlePlayAgain = () => {
    dismissGameOver();
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

  // ── Game Over card ────────────────────────────────────────────────────────
  if (showGameOver) {
    const highestGrid = skillTracker.currentGridSize;
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <Text style={styles.gameOverTitle}>
          {gameOverReason === 'timer' ? '⏱ Timed Out' : '🏳 Run Ended'}
        </Text>
        <Text style={styles.gameOverSub}>Endless Mode</Text>

        <View style={styles.statsGrid}>
          <StatBox label="Score" value={formatScore(totalScore)} accent="#fbbf24" />
          <StatBox label="Levels" value={levelsCompleted.toString()} accent="#60a5fa" />
          <StatBox label="Time" value={formatTime(totalTimeMs)} accent="#34d399" />
          <StatBox label="Mistakes" value={totalMistakes.toString()} accent="#f87171" />
          <StatBox label="Highest Grid" value={`${highestGrid}×${highestGrid}`} accent="#a78bfa" />
          <StatBox label="Best Score" value={formatScore(bestScore)} accent="#fb923c" />
        </View>

        {levelsCompleted >= 1 && !submitted && (
          <View style={styles.submitSection}>
            <Text style={styles.submitLabel}>Save your score to the leaderboard</Text>
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

        {submitted && (
          <Text style={styles.submittedText}>✓ Score submitted!</Text>
        )}

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Endless Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
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
            Solve an infinite stream of puzzles. The grid grows as your skill improves.
            One wrong move costs points. Inactivity ends your run.
          </Text>

          <View style={styles.rulesBox}>
            <RuleRow icon="⚡" text="Starts at 4×4 grid" />
            <RuleRow icon="📈" text="Grid grows to 7×7 based on skill" />
            <RuleRow icon="⚠️" text="–5 pts per conflict placed" />
            <RuleRow icon="⏱" text="60 second inactivity timeout" />
            <RuleRow icon="🏆" text="Speed bonus up to 3×" />
          </View>

          {bestScore > 0 && (
            <View style={styles.bestScoreRow}>
              <Text style={styles.bestScoreLabel}>Your Best</Text>
              <Text style={styles.bestScoreVal}>{formatScore(bestScore)}</Text>
            </View>
          )}

          <Pressable style={styles.startBtn} onPress={handleStartRun} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Start Endless Run</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.lbContent} showsVerticalScrollIndicator={false}>
          <View style={styles.resetNote}>
            <Text style={styles.resetNoteText}>🔄 Resets every Sunday at 6 AM (GMT+3)</Text>
            <Text style={styles.resetNoteCountdown}>Next reset in {formatCountdown(resetIn)}</Text>
          </View>
          {leaderboard.length === 0 ? (
            <Text style={styles.emptyLb}>No scores yet — be the first!</Text>
          ) : (
            leaderboard.map((entry, i) => (
              <View key={`${entry.playerName}-${i}`} style={styles.lbRow}>
                <Text style={styles.lbRank}>{i + 1}</Text>
                <View style={styles.lbInfo}>
                  <Text style={styles.lbName}>{entry.playerName}</Text>
                  <Text style={styles.lbMeta}>
                    {entry.levelsCompleted} lvls · {entry.highestGrid}×{entry.highestGrid} · {formatTime(entry.totalTimeMs)}
                  </Text>
                </View>
                <Text style={styles.lbScore}>{formatScore(entry.totalScore)}</Text>
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

  tabs: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(251,191,36,0.2)', borderRadius: 12 },
  tabText: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  tabTextActive: { color: '#fbbf24', fontWeight: '800' },

  startContent: { paddingHorizontal: 20, paddingTop: 16, gap: 16, paddingBottom: 40 },
  modeDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22, textAlign: 'center' },

  rulesBox: {
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleIcon: { fontSize: 18, width: 28 },
  ruleText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500', flex: 1 },

  bestScoreRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)',
  },
  bestScoreLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600' },
  bestScoreVal: { color: '#fbbf24', fontSize: 20, fontWeight: '900' },

  startBtn: {
    backgroundColor: '#fbbf24', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', shadowColor: '#fbbf24', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  startBtnText: { color: '#1a1200', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },

  lbContent: { paddingHorizontal: 16, paddingTop: 12, gap: 2 },
  resetNote: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, marginBottom: 12, alignItems: 'center', gap: 2 },
  resetNoteText: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  resetNoteCountdown: { color: '#ff6a00', fontSize: 12, fontWeight: '600' },
  emptyLb: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40, fontSize: 15 },
  lbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12,
  },
  lbRank: { color: '#fbbf24', fontSize: 16, fontWeight: '900', width: 24, textAlign: 'center' },
  lbInfo: { flex: 1 },
  lbName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  lbMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  lbScore: { color: '#fbbf24', fontSize: 18, fontWeight: '900' },

  // Game Over styles
  gameOverTitle: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', marginTop: 8 },
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
  submitBtn: { backgroundColor: '#fbbf24', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#1a1200', fontSize: 16, fontWeight: '900' },
  submittedText: { color: '#34d399', textAlign: 'center', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  gameOverButtons: { gap: 10 },
  playAgainBtn: { backgroundColor: '#fbbf24', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  playAgainText: { color: '#1a1200', fontSize: 17, fontWeight: '900' },
  homeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
