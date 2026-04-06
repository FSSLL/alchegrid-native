import React, { useState } from 'react';
import Pressable from '../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../store/playerStore';

const HINT_COST = 40;

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { coins, hintBalance, unlimitedHints, spendCoins, addHint } = usePlayerStore();

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [buying, setBuying] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2200);
  };

  const handleBuyHint = () => {
    if (buying) return;
    if (unlimitedHints) {
      showToast('You already have unlimited hints!', false);
      return;
    }
    if (coins < HINT_COST) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(`Not enough coins — need ${HINT_COST} 🪙`, false);
      return;
    }
    setBuying(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    spendCoins(HINT_COST);
    addHint(1);
    showToast('+1 Hint added to your balance!', true);
    setTimeout(() => setBuying(false), 600);
  };

  const canAfford = coins >= HINT_COST && !unlimitedHints;

  return (
    <View style={[ss.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={ss.header}>
        <Pressable onPress={() => router.back()} style={ss.backBtn}>
          <Text style={ss.backText}>←</Text>
        </Pressable>
        <Text style={ss.headerTitle}>Shop</Text>
        <View style={ss.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={ss.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance bar */}
        <View style={ss.balanceRow}>
          <View style={ss.balancePill}>
            <Text style={ss.balanceIcon}>🪙</Text>
            <Text style={ss.balanceValue}>{coins}</Text>
            <Text style={ss.balanceLabel}>Coins</Text>
          </View>
          <View style={[ss.balancePill, { borderColor: 'rgba(52,211,153,0.35)' }]}>
            <Text style={ss.balanceIcon}>💡</Text>
            <Text style={[ss.balanceValue, { color: '#34d399' }]}>
              {unlimitedHints ? '∞' : hintBalance}
            </Text>
            <Text style={ss.balanceLabel}>Hints</Text>
          </View>
        </View>

        {/* Section heading */}
        <Text style={ss.sectionTitle}>Available Items</Text>

        {/* Hint item card */}
        <View style={ss.itemCard}>
          {/* Icon circle */}
          <View style={ss.itemIconCircle}>
            <Text style={ss.itemIconText}>💡</Text>
          </View>

          {/* Info */}
          <View style={ss.itemInfo}>
            <Text style={ss.itemName}>Hint</Text>
            <Text style={ss.itemDesc}>Reveals one correct cell on the board</Text>
          </View>

          {/* Price + buy */}
          <View style={ss.itemRight}>
            <View style={ss.priceRow}>
              <Text style={ss.priceIcon}>🪙</Text>
              <Text style={ss.priceAmount}>{HINT_COST}</Text>
            </View>
            <Pressable
              style={[ss.buyBtn, !canAfford && ss.buyBtnDisabled]}
              activeOpacity={canAfford ? 0.82 : 1}
              onPress={handleBuyHint}
            >
              <Text style={[ss.buyBtnText, !canAfford && ss.buyBtnTextDisabled]}>
                Buy
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Low-coin hint */}
        {!canAfford && !unlimitedHints && (
          <Text style={ss.lowCoinNote}>
            Complete levels to earn more coins — up to 30 🪙 per level.
          </Text>
        )}

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={[ss.toast, toast.ok ? ss.toastOk : ss.toastErr]}>
          <Text style={ss.toastText}>{toast.msg}</Text>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  root:        { flex: 1, backgroundColor: 'transparent' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:     { minWidth: 40, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 8 },
  backText:    { color: '#eef1f5', fontSize: 18, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  balanceRow:   { flexDirection: 'row', gap: 12, marginBottom: 28 },
  balancePill:  {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  balanceIcon:  { fontSize: 22 },
  balanceValue: { fontSize: 22, fontWeight: '800', color: '#fbbf24' },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 12,
  },

  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
  },

  itemIconCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  itemIconText: { fontSize: 28 },

  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  itemDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17 },

  itemRight:    { alignItems: 'center', gap: 8 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceIcon:    { fontSize: 15 },
  priceAmount:  { fontSize: 16, fontWeight: '800', color: '#fbbf24' },

  buyBtn: {
    backgroundColor: '#ff6a00', borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 9,
    minWidth: 64, alignItems: 'center',
  },
  buyBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  buyBtnText:        { color: '#fff', fontSize: 14, fontWeight: '800' },
  buyBtnTextDisabled: { color: 'rgba(255,255,255,0.3)' },

  lowCoinNote: {
    marginTop: 14, textAlign: 'center',
    color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 18,
  },

  toast: {
    position: 'absolute', bottom: 40, left: 24, right: 24,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    alignItems: 'center',
  },
  toastOk:   { backgroundColor: 'rgba(52,211,153,0.92)' },
  toastErr:  { backgroundColor: 'rgba(220,38,38,0.92)' },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
