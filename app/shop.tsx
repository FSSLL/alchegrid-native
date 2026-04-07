import React, { useState } from 'react';
import Pressable from '../components/Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../store/playerStore';
import { useSubscription, COINS_PER_PACKAGE } from '../lib/revenuecat';
import type { PurchasesPackage } from 'react-native-purchases';

const HINT_COST = 40;

// Icon + label per coin pack (keyed by RevenueCat package lookup_key)
const PACK_META: Record<string, { icon: string; label: string; coins: number; tag?: string }> = {
  "$rc_custom_small":  { icon: "🪙",  label: "100 Coins",  coins: 100 },
  "$rc_custom_medium": { icon: "💰",  label: "600 Coins",  coins: 600,  tag: "Popular" },
  "$rc_custom_large":  { icon: "💎",  label: "1500 Coins", coins: 1500, tag: "Best Value" },
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { coins, hintBalance, unlimitedHints, spendCoins, addHint, addCoins } = usePlayerStore();
  const { packages, isLoading, purchasePackage, restorePurchases, isPurchasing, isRestoring } = useSubscription();

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [buyingHint, setBuyingHint] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2400);
  };

  const handleBuyHint = () => {
    if (buyingHint) return;
    if (unlimitedHints) { showToast('You already have unlimited hints!', false); return; }
    if (coins < HINT_COST) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(`Need ${HINT_COST} 🪙 — buy coins below`, false);
      return;
    }
    setBuyingHint(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    spendCoins(HINT_COST);
    addHint(1);
    showToast('+1 Hint added!', true);
    setTimeout(() => setBuyingHint(false), 600);
  };

  const handleBuyCoins = async (pkg: PurchasesPackage) => {
    if (isPurchasing || purchasingId) return;
    setPurchasingId(pkg.identifier);
    try {
      await purchasePackage(pkg);
      const coinsToAdd = COINS_PER_PACKAGE[pkg.identifier] ?? 0;
      if (coinsToAdd > 0) {
        addCoins(coinsToAdd);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(`+${coinsToAdd} Coins added! 🪙`, true);
      }
    } catch (e: any) {
      if (!e?.userCancelled) {
        showToast('Purchase failed. Please try again.', false);
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      showToast('Purchases restored!', true);
    } catch {
      showToast('Nothing to restore.', false);
    }
  };

  const canAffordHint = coins >= HINT_COST && !unlimitedHints;

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

      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>
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

        {/* ─── Spend coins on hints ───────────────────────────────────── */}
        <Text style={ss.sectionTitle}>Spend Coins</Text>

        <View style={ss.itemCard}>
          <View style={ss.itemIconCircle}>
            <Text style={ss.itemIconText}>💡</Text>
          </View>
          <View style={ss.itemInfo}>
            <Text style={ss.itemName}>Hint</Text>
            <Text style={ss.itemDesc}>Reveals one correct cell on the board</Text>
          </View>
          <View style={ss.itemRight}>
            <View style={ss.priceRow}>
              <Text style={ss.priceIcon}>🪙</Text>
              <Text style={ss.priceAmount}>{HINT_COST}</Text>
            </View>
            <Pressable
              style={[ss.buyBtn, !canAffordHint && ss.buyBtnDisabled]}
              activeOpacity={canAffordHint ? 0.82 : 1}
              onPress={handleBuyHint}
            >
              {buyingHint
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={[ss.buyBtnText, !canAffordHint && ss.buyBtnTextDisabled]}>Buy</Text>
              }
            </Pressable>
          </View>
        </View>

        {!canAffordHint && !unlimitedHints && (
          <Text style={ss.lowCoinNote}>
            Need more coins? Buy a pack below or earn up to 30 🪙 per level.
          </Text>
        )}

        {/* ─── Buy coin packs ─────────────────────────────────────────── */}
        <Text style={[ss.sectionTitle, { marginTop: 28 }]}>Buy Coins</Text>

        {isLoading ? (
          <ActivityIndicator color="#60a5fa" style={{ marginVertical: 24 }} />
        ) : packages.length === 0 ? (
          <Text style={ss.lowCoinNote}>Coin packs not available right now.</Text>
        ) : (
          packages.map((pkg) => {
            const meta = PACK_META[pkg.identifier];
            const busy = purchasingId === pkg.identifier;
            const price = pkg.product.priceString;
            return (
              <View key={pkg.identifier} style={ss.packCard}>
                {meta?.tag && (
                  <View style={ss.packTag}>
                    <Text style={ss.packTagText}>{meta.tag}</Text>
                  </View>
                )}
                <View style={ss.packRow}>
                  <View style={ss.packIconCircle}>
                    <Text style={ss.packIconText}>{meta?.icon ?? '🪙'}</Text>
                  </View>
                  <View style={ss.packInfo}>
                    <Text style={ss.packName}>{meta?.label ?? pkg.product.title}</Text>
                    <Text style={ss.packDesc}>{pkg.product.description || 'In-game coins'}</Text>
                  </View>
                  <Pressable
                    style={[ss.packBuyBtn, busy && ss.packBuyBtnBusy]}
                    onPress={() => handleBuyCoins(pkg)}
                    disabled={!!purchasingId}
                  >
                    {busy
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={ss.packBuyText}>{price}</Text>
                    }
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {/* Restore */}
        <Pressable style={ss.restoreBtn} onPress={handleRestore} disabled={isRestoring}>
          {isRestoring
            ? <ActivityIndicator size="small" color="#60a5fa" />
            : <Text style={ss.restoreText}>Restore Purchases</Text>
          }
        </Pressable>

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

  balanceRow:  { flexDirection: 'row', gap: 12, marginBottom: 28 },
  balancePill: {
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
  itemInfo:  { flex: 1, gap: 4 },
  itemName:  { fontSize: 17, fontWeight: '800', color: '#fff' },
  itemDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 17 },
  itemRight: { alignItems: 'center', gap: 8 },
  priceRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceIcon: { fontSize: 15 },
  priceAmount: { fontSize: 16, fontWeight: '800', color: '#fbbf24' },
  buyBtn:         { backgroundColor: '#ff6a00', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9, minWidth: 64, alignItems: 'center' },
  buyBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  buyBtnText:         { color: '#fff', fontSize: 14, fontWeight: '800' },
  buyBtnTextDisabled: { color: 'rgba(255,255,255,0.3)' },

  lowCoinNote: {
    marginTop: 10, textAlign: 'center',
    color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 18,
  },

  packCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10, overflow: 'hidden',
  },
  packTag: {
    backgroundColor: 'rgba(96,165,250,0.2)',
    paddingHorizontal: 14, paddingVertical: 4,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 10,
  },
  packTagText: { color: '#93c5fd', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  packRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  packIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(251,191,36,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  packIconText: { fontSize: 26 },
  packInfo:    { flex: 1 },
  packName:    { fontSize: 16, fontWeight: '800', color: '#fff' },
  packDesc:    { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  packBuyBtn:  { backgroundColor: '#3b82f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, minWidth: 70, alignItems: 'center' },
  packBuyBtnBusy: { backgroundColor: 'rgba(59,130,246,0.5)' },
  packBuyText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  restoreBtn: {
    marginTop: 20, alignSelf: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  restoreText: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '600' },

  toast:     { position: 'absolute', bottom: 40, left: 24, right: 24, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  toastOk:   { backgroundColor: 'rgba(52,211,153,0.92)' },
  toastErr:  { backgroundColor: 'rgba(220,38,38,0.92)' },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
