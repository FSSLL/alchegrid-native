import React, { useMemo, useState, useRef, useEffect } from 'react';
import Pressable from './Pressable';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCommunityStore, deriveElements, checkNameAvailability } from '../store/communityStore';
import { useGameStore } from '../store/gameStore';
import { RECIPE_CATALOG } from '../constants/recipeCatalog';
import { ZONE_COLORS, isCellsConnected, isAdjacentToSet, maxZoneSizeForGrid } from '../lib/recipeCatalog';
import type { Level } from '../lib/types';
import { useT } from '../hooks/useT';

// ── Builder cell sizes ────────────────────────────────────────────────────────
const CELL_SZ: Record<number, number> = {
  4: 58, 5: 50, 6: 42, 7: 37, 8: 32, 9: 28, 10: 26, 11: 24,
};
const GRID_GAP = 2;

type Step = 'setup' | 'zones' | 'publish';

// ── Validation ────────────────────────────────────────────────────────────────
function validateDraft(draft: {
  name: string; size: number; zones: any[]; solvedAfterLastEdit: boolean;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const total = draft.size * draft.size;
  const allCells = draft.zones.flatMap((z: any) => z.cells);

  if (draft.zones.length === 0) errors.push('Add at least one zone.');

  const elements = deriveElements(draft.zones);
  if (elements.length !== draft.size) {
    errors.push(`Need exactly ${draft.size} unique elements (have ${elements.length}).`);
  }

  const cellSet = new Set<string>();
  let hasOverlap = false;
  allCells.forEach((c: any) => {
    const k = `${c.row},${c.col}`;
    if (cellSet.has(k)) hasOverlap = true;
    cellSet.add(k);
  });
  if (hasOverlap) errors.push('Zones have overlapping cells.');

  if (allCells.length < total) {
    errors.push(`${total - allCells.length} cell${total - allCells.length > 1 ? 's' : ''} not covered.`);
  }

  draft.zones.forEach((z: any, i: number) => {
    if (z.cells.length !== z.ingredients.length) {
      errors.push(`Zone ${i + 1}: ${z.cells.length} cells / ${z.ingredients.length} ingredients mismatch.`);
    }
    if (z.cells.length > 1 && !isCellsConnected(z.cells)) {
      errors.push(`Zone ${i + 1} cells are not all connected.`);
    }
  });

  if (!draft.solvedAfterLastEdit) errors.push('Test-play and solve the level first.');

  return { ok: errors.length === 0, errors };
}

// ── Main builder component ────────────────────────────────────────────────────
export default function CommunityBuilder() {
  const t = useT();
  const [step, setStep] = useState<Step>('setup');
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    draft, setDraftName, setDraftSize,
    addCellToCurrentZone, removeCellFromCurrentZone, clearCurrentZone,
    commitCurrentZone, editZone, removeZone, markEdited, resetDraft,
    publishLevel, publishSyncStatus,
  } = useCommunityStore();

  const { initGame } = useGameStore();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  // ── Name availability debounce ─────────────────────────────────────────────
  useEffect(() => {
    const trimmed = draft.name.trim();
    if (!trimmed) { setNameStatus('idle'); return; }
    setNameStatus('checking');
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(async () => {
      const result = await checkNameAvailability(trimmed);
      setNameStatus(result);
    }, 600);
    return () => { if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current); };
  }, [draft.name]);

  // ── Computed values ───────────────────────────────────────────────────────
  const totalCells = draft.size * draft.size;
  const usedCells = draft.zones.reduce((s, z) => s + z.cells.length, 0);

  const committedElements = useMemo(() => {
    const set = new Set<string>();
    draft.zones.forEach((z, i) => {
      if (i !== draft.editingZoneIndex) z.ingredients.forEach((el) => set.add(el));
    });
    return set;
  }, [draft.zones, draft.editingZoneIndex]);

  const remainingBudget = draft.size - committedElements.size;
  const cellCount = draft.currentZoneCells.length;

  const availableRecipes = useMemo(() => {
    const worldNum = draft.size - 3; // 4×4=W1, 5×5=W2 ... 11×11=W8
    return RECIPE_CATALOG.filter((r) => {
      if (r.world !== worldNum) return false;
      if (r.ingredients.length !== cellCount) return false;
      const newEls = r.ingredients.filter((el) => !committedElements.has(el));
      return newEls.length <= remainingBudget;
    });
  }, [draft.size, cellCount, committedElements, remainingBudget]);

  // Build zone map: -1=empty, -2=current zone, N=committed zone index
  const zoneMap = useMemo(() => {
    const map: number[][] = Array.from({ length: draft.size }, () =>
      new Array(draft.size).fill(-1),
    );
    draft.zones.forEach((zone, i) => {
      zone.cells.forEach(({ row, col }) => { map[row][col] = i; });
    });
    draft.currentZoneCells.forEach(({ row, col }) => { map[row][col] = -2; });
    return map;
  }, [draft.zones, draft.currentZoneCells, draft.size]);

  const uniqueElements = useMemo(() => deriveElements(draft.zones), [draft.zones]);
  const validation = useMemo(() => validateDraft(draft), [draft]);

  // ── Grid cell press ───────────────────────────────────────────────────────
  const handleCellPress = (row: number, col: number) => {
    if (!isDrawingZone) return;

    const inCurrent = draft.currentZoneCells.some((c) => c.row === row && c.col === col);
    if (inCurrent) {
      removeCellFromCurrentZone(row, col);
      return;
    }

    // Taken by a committed zone
    if (zoneMap[row][col] >= 0) return;

    // Max size check
    const maxSize = maxZoneSizeForGrid(draft.size);
    if (draft.currentZoneCells.length >= maxSize) {
      showToast(`Max zone size for ${draft.size}×${draft.size} is ${maxSize} cells`);
      return;
    }

    // Adjacency check
    if (!isAdjacentToSet(draft.currentZoneCells, row, col)) {
      showToast('Cells must be connected');
      return;
    }

    addCellToCurrentZone(row, col);
  };

  // ── Zone actions ──────────────────────────────────────────────────────────
  const handleStartZone = () => {
    clearCurrentZone();
    setIsDrawingZone(true);
    setShowRecipePicker(false);
  };

  const handleFinishDrawing = () => {
    if (draft.currentZoneCells.length === 0) {
      showToast('Select at least one cell');
      return;
    }
    setShowRecipePicker(true);
    setIsDrawingZone(false);
  };

  const handlePickRecipe = (recipe: { name: string; ingredients: string[] }) => {
    commitCurrentZone(recipe);
    setShowRecipePicker(false);
    setIsDrawingZone(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancelDraw = () => {
    clearCurrentZone();
    setIsDrawingZone(false);
    setShowRecipePicker(false);
  };

  const handleEditZone = (i: number) => {
    editZone(i);
    setIsDrawingZone(true);
    setShowRecipePicker(false);
    markEdited();
  };

  const handleRemoveZone = (i: number) => {
    removeZone(i);
    markEdited();
  };

  // ── Test play ─────────────────────────────────────────────────────────────
  const handleTestPlay = () => {
    const elements = deriveElements(draft.zones);
    if (elements.length !== draft.size) {
      showToast(`Need ${draft.size} unique elements (have ${elements.length})`);
      return;
    }
    if (usedCells < totalCells) {
      showToast(`${totalCells - usedCells} cells not covered`);
      return;
    }
    const testLevel: Level = {
      id: 'draft_test',
      worldId: 'community',
      size: draft.size,
      elements,
      zones: draft.zones,
      canonicalSolution: Array.from({ length: draft.size }, () =>
        new Array(draft.size).fill(''),
      ),
      starThresholds: { three: 60, two: 120 },
    };
    initGame(testLevel);
    router.push('/community/test');
  };

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!validation.ok || isPublishing) return;
    setIsPublishing(true);
    try {
      await publishLevel();
      setStep('setup');
      showToast(t('builderPublished'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReset = () => {
    resetDraft();
    setStep('setup');
    setIsDrawingZone(false);
    setShowRecipePicker(false);
  };

  const cellSz = CELL_SZ[draft.size] ?? 24;
  const gridPx = draft.size * cellSz + (draft.size - 1) * GRID_GAP;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Toast */}
      {toastMsg !== null && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Step nav */}
      <View style={styles.stepNav}>
        {(['setup', 'zones', 'publish'] as Step[]).map((s, idx) => (
          <Pressable
            key={s}
            style={[styles.stepPill, step === s && styles.stepPillActive]}
            onPress={() => setStep(s)}
          >
            <Text style={[styles.stepText, step === s && styles.stepTextActive]}>
              {idx + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── STEP 1: Setup ─────────────────────────────────────────────────── */}
      {step === 'setup' && (
        <ScrollView contentContainerStyle={styles.setupContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>{t('builderLevelName')}</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              placeholder={t('builderEnterName')}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={draft.name}
              onChangeText={setDraftName}
              maxLength={40}
            />
            <View style={styles.nameStatusBadge}>
              {nameStatus === 'checking' && (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
              )}
              {nameStatus === 'available' && (
                <Text style={styles.nameAvailable}>✓</Text>
              )}
              {nameStatus === 'taken' && (
                <Text style={styles.nameTaken}>✕</Text>
              )}
            </View>
          </View>
          {nameStatus === 'taken' && (
            <Text style={styles.nameTakenHint}>{t('builderNameTaken')}</Text>
          )}
          {nameStatus === 'available' && (
            <Text style={styles.nameAvailableHint}>{t('builderNameAvailable')}</Text>
          )}

          <Text style={styles.fieldLabel}>{t('builderBoardSize')}</Text>
          <View style={styles.sizeGrid}>
            {[4, 5, 6, 7].map((s) => (
              <Pressable
                key={s}
                style={[styles.sizeBtn, draft.size === s && styles.sizeBtnActive]}
                onPress={() => setDraftSize(s)}
              >
                <Text style={[styles.sizeBtnText, draft.size === s && styles.sizeBtnTextActive]}>
                  {s}×{s}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t('builderStep1')}</Text>
            <Text style={styles.infoText}>{t('builderStep2')}</Text>
            <Text style={styles.infoText}>{t('builderStep3')}</Text>
            <Text style={styles.infoText}>{t('builderStep4')}</Text>
          </View>

          <Pressable
            style={[
              styles.nextBtn,
              (!draft.name.trim() || nameStatus === 'taken') && styles.disabledBtn,
            ]}
            onPress={() => {
              if (!draft.name.trim()) {
                showToast(t('builderEnterNameFirst'));
                return;
              }
              if (nameStatus === 'taken') {
                showToast(t('builderNameTaken'));
                return;
              }
              if (draft.size > 7) setDraftSize(4);
              setStep('zones');
            }}
          >
            <Text style={styles.nextBtnText}>{t('builderNextZones')}</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── STEP 2: Zones ─────────────────────────────────────────────────── */}
      {step === 'zones' && (
        <View style={styles.zonesContainer}>
          {/* Info bar */}
          <View style={styles.infoBar}>
            <Text style={styles.infoBarText}>
              {t('builderCellsInfo', { used: usedCells, total: totalCells })}
            </Text>
            <Text style={styles.infoBarText}>
              {t('builderElementsInfo', { n: uniqueElements.length, total: draft.size })}
            </Text>
          </View>

          {/* Element pills */}
          {uniqueElements.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.elementRow} contentContainerStyle={styles.elementRowContent}>
              {uniqueElements.map((el) => (
                <View key={el} style={styles.elementPill}>
                  <Text style={styles.elementPillText}>{el}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Recipe picker OR grid */}
          {showRecipePicker ? (
            <View style={styles.pickerWrap}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  {t('builderPickRecipe', { n: cellCount, s: cellCount > 1 ? 's' : '' })}
                </Text>
                <Pressable onPress={() => { setShowRecipePicker(false); setIsDrawingZone(true); }}>
                  <Text style={styles.pickerCancel}>{t('tutBackBtn')}</Text>
                </Pressable>
              </View>
              {availableRecipes.length === 0 ? (
                <View style={styles.pickerEmpty}>
                  <Text style={styles.pickerEmptyText}>
                    {t('builderNoRecipes', { n: cellCount, s: cellCount > 1 ? 's' : '', n2: remainingBudget })}
                  </Text>
                  <Text style={styles.pickerEmptyHint}>
                    {t('builderTryDifferent')}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={availableRecipes}
                  keyExtractor={(r, i) => `${i}-${r.ingredients.join('+')}`}
                  contentContainerStyle={styles.recipeList}
                  renderItem={({ item }) => (
                    <Pressable style={styles.recipeRow} onPress={() => handlePickRecipe(item)}>
                      <View style={styles.recipeIngredients}>
                        {item.ingredients.map((el) => (
                          <View key={el} style={[styles.elementPill, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                            <Text style={[styles.elementPillText, { color: '#93c5fd' }]}>{el}</Text>
                          </View>
                        ))}
                        {item.ingredients.length > 1 && <Text style={styles.arrowText}>→</Text>}
                      </View>
                      <Text style={styles.recipeNameText}>{item.name}</Text>
                    </Pressable>
                  )}
                />
              )}
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.gridArea} showsVerticalScrollIndicator={false}>
              {/* Grid */}
              <View style={[styles.gridWrap, { width: gridPx, height: gridPx }]}>
                {Array.from({ length: draft.size }).map((_, row) =>
                  Array.from({ length: draft.size }).map((__, col) => {
                    const zid = zoneMap[row][col];
                    const isCurrentZone = zid === -2;
                    const isCommitted = zid >= 0;
                    const isEmpty = zid === -1;
                    const bgColor = isCurrentZone
                      ? '#3b82f6'
                      : isCommitted
                        ? ZONE_COLORS[zid % ZONE_COLORS.length]
                        : 'rgba(30,41,59,0.8)';

                    // Compute zone edge borders for committed cells
                    const borders: any = {};
                    if (isCommitted) {
                      borders.borderTopWidth = (row === 0 || zoneMap[row - 1][col] !== zid) ? 2 : 0;
                      borders.borderBottomWidth = (row === draft.size - 1 || zoneMap[row + 1][col] !== zid) ? 2 : 0;
                      borders.borderLeftWidth = (col === 0 || zoneMap[row][col - 1] !== zid) ? 2 : 0;
                      borders.borderRightWidth = (col === draft.size - 1 || zoneMap[row][col + 1] !== zid) ? 2 : 0;
                      borders.borderColor = 'rgba(255,255,255,0.65)';
                    } else if (isCurrentZone) {
                      borders.borderWidth = 2;
                      borders.borderColor = '#93c5fd';
                    } else if (isDrawingZone && isEmpty) {
                      borders.borderWidth = 1;
                      borders.borderColor = 'rgba(255,255,255,0.25)';
                      borders.borderStyle = 'dashed' as const;
                    } else {
                      borders.borderWidth = 1;
                      borders.borderColor = 'rgba(255,255,255,0.1)';
                    }

                    return (
                      <Pressable
                        key={`${row}-${col}`}
                        style={[
                          styles.gridCell,
                          {
                            top: row * (cellSz + GRID_GAP),
                            left: col * (cellSz + GRID_GAP),
                            width: cellSz,
                            height: cellSz,
                            backgroundColor: bgColor,
                            borderRadius: 4,
                            ...borders,
                          },
                        ]}
                        onPress={() => handleCellPress(row, col)}
                        activeOpacity={isDrawingZone && isEmpty ? 0.7 : 1}
                      >
                        {isCurrentZone && (
                          <Text style={styles.cellCurrentText}>+</Text>
                        )}
                        {isCommitted && (
                          <Text style={[styles.cellZoneNum, { fontSize: cellSz < 34 ? 9 : 11 }]}>
                            {zid + 1}
                          </Text>
                        )}
                      </Pressable>
                    );
                  }),
                )}
              </View>

              {/* Drawing controls */}
              {isDrawingZone ? (
                <View style={styles.drawControls}>
                  <Pressable style={styles.cancelDrawBtn} onPress={handleCancelDraw}>
                    <Text style={styles.cancelDrawText}>{t('cancel')}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.finishDrawBtn, draft.currentZoneCells.length === 0 && styles.disabledBtn]}
                    onPress={handleFinishDrawing}
                    disabled={draft.currentZoneCells.length === 0}
                  >
                    <Text style={styles.finishDrawText}>
                      {t('builderPickCombo', { n: draft.currentZoneCells.length, s: draft.currentZoneCells.length !== 1 ? 's' : '' })}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.addZoneBtn} onPress={handleStartZone}>
                  <Text style={styles.addZoneBtnText}>{t('builderAddZone')}</Text>
                </Pressable>
              )}

              {/* Zone list */}
              {draft.zones.length > 0 && !isDrawingZone && (
                <View style={styles.zoneList}>
                  {draft.zones.map((zone, i) => (
                    <View key={zone.id} style={styles.zoneRow}>
                      <View style={[styles.zoneIndexBadge, { backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] }]}>
                        <Text style={styles.zoneIndexText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.zoneRecipe} numberOfLines={1}>{zone.recipeName}</Text>
                      <View style={styles.zoneIngredients}>
                        {zone.ingredients.map((el) => (
                          <View key={el} style={styles.miniPill}>
                            <Text style={styles.miniPillText}>{el.slice(0, 4)}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.zoneCellCount}>{zone.cells.length}c</Text>
                      <Pressable style={styles.zoneActionBtn} onPress={() => handleEditZone(i)}>
                        <Text style={styles.zoneActionText}>✏</Text>
                      </Pressable>
                      <Pressable style={styles.zoneActionBtn} onPress={() => handleRemoveZone(i)}>
                        <Text style={[styles.zoneActionText, { color: '#f87171' }]}>🗑</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Bottom action bar */}
              {!isDrawingZone && (
                <View style={styles.zoneActions}>
                  <Pressable
                    style={[styles.testPlayBtn, (usedCells < totalCells || draft.zones.length === 0) && styles.disabledBtn]}
                    onPress={handleTestPlay}
                    disabled={usedCells < totalCells || draft.zones.length === 0}
                  >
                    <Text style={styles.testPlayText}>{t('builderTestPlay')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.nextStepBtn}
                    onPress={() => setStep('publish')}
                  >
                    <Text style={styles.nextStepText}>{t('builderReviewPublish')}</Text>
                  </Pressable>
                </View>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* ── STEP 3: Publish ───────────────────────────────────────────────── */}
      {step === 'publish' && (
        <ScrollView contentContainerStyle={styles.publishContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewCard}>
            <ReviewRow label={t('builderReviewName')} value={draft.name || '(untitled)'} />
            <ReviewRow label={t('builderReviewSize')} value={`${draft.size}×${draft.size}`} />
            <ReviewRow
              label={t('builderReviewElements')}
              value={uniqueElements.join(', ') || '—'}
            />
            <ReviewRow label={t('builderReviewZones')} value={draft.zones.length.toString()} />
            <ReviewRow
              label={t('builderReviewSolved')}
              value={draft.solvedAfterLastEdit ? '✓ Yes' : '✗ No'}
              accent={draft.solvedAfterLastEdit ? '#34d399' : '#f87171'}
            />
          </View>

          {!validation.ok && (
            <View style={styles.errorsBox}>
              {validation.errors.map((err, i) => (
                <Text key={i} style={styles.errorText}>• {err}</Text>
              ))}
            </View>
          )}

          {!draft.solvedAfterLastEdit && (
            <Pressable style={styles.testSolveBtn} onPress={handleTestPlay}>
              <Text style={styles.testSolveBtnText}>{t('builderTestSolve')}</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.publishBtn, (!validation.ok || isPublishing) && styles.disabledBtn]}
            onPress={handlePublish}
            disabled={!validation.ok || isPublishing}
          >
            <Text style={styles.publishBtnText}>
              {isPublishing ? t('builderPublishing') : publishSyncStatus === 'error' ? t('builderRetryPublish') : t('builderPublish')}
            </Text>
          </Pressable>
          {publishSyncStatus === 'error' && (
            <Text style={styles.uploadErrorText}>{t('builderUploadFailed')}</Text>
          )}

          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>{t('builderReset')}</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function ReviewRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={[styles.reviewValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  toast: {
    position: 'absolute', top: 52, left: 0, right: 0, alignItems: 'center', zIndex: 99,
  },
  toastText: {
    backgroundColor: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: 13, fontWeight: '700',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  stepNav: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 6, gap: 6,
  },
  stepPill: {
    flex: 1, paddingVertical: 6, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stepPillActive: { backgroundColor: 'rgba(96,165,250,0.2)', borderColor: '#60a5fa' },
  stepText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  stepTextActive: { color: '#60a5fa', fontWeight: '800' },

  // Setup
  setupContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12, paddingBottom: 40 },
  fieldLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', marginBottom: -4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  nameStatusBadge: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  nameAvailable: { color: '#34d399', fontSize: 16, fontWeight: '900' },
  nameTaken: { color: '#f87171', fontSize: 16, fontWeight: '900' },
  nameTakenHint: { color: '#f87171', fontSize: 12, fontWeight: '600', marginTop: -6 },
  nameAvailableHint: { color: '#34d399', fontSize: 12, fontWeight: '600', marginTop: -6 },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sizeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  sizeBtnActive: { backgroundColor: 'rgba(96,165,250,0.25)', borderColor: '#60a5fa' },
  sizeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  sizeBtnTextActive: { color: '#93c5fd', fontWeight: '800' },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 14, gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  infoText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  nextBtn: { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  // Zones
  zonesContainer: { flex: 1 },
  infoBar: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.25)', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoBarText: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  infoBarVal: { color: '#fff', fontWeight: '800' },
  elementRow: { maxHeight: 34 },
  elementRowContent: { paddingHorizontal: 12, paddingVertical: 4, gap: 5 },
  elementPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  elementPillText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  gridArea: { alignItems: 'center', paddingTop: 12, paddingBottom: 16, gap: 12, paddingHorizontal: 16 },
  gridWrap: { position: 'relative' },
  gridCell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  cellCurrentText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  cellZoneNum: { color: 'rgba(255,255,255,0.8)', fontWeight: '900' },

  drawControls: { flexDirection: 'row', gap: 8, width: '100%' },
  cancelDrawBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  cancelDrawText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  finishDrawBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#3b82f6', alignItems: 'center',
  },
  finishDrawText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  addZoneBtn: {
    width: '100%', paddingVertical: 11, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.2)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.4)',
  },
  addZoneBtnText: { color: '#60a5fa', fontSize: 15, fontWeight: '800' },

  zoneList: { width: '100%', gap: 6 },
  zoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 8,
  },
  zoneIndexBadge: {
    width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  zoneIndexText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  zoneRecipe: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700' },
  zoneIngredients: { flexDirection: 'row', gap: 3 },
  miniPill: {
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  miniPillText: { color: 'rgba(255,255,255,0.7)', fontSize: 9 },
  zoneCellCount: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  zoneActionBtn: {
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8,
  },
  zoneActionText: { fontSize: 15 },

  zoneActions: { flexDirection: 'row', gap: 8, width: '100%' },
  testPlayBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.2)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)',
  },
  testPlayText: { color: '#34d399', fontSize: 14, fontWeight: '800' },
  nextStepBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  nextStepText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  disabledBtn: { opacity: 0.35 },

  // Recipe picker
  pickerWrap: { flex: 1 },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  pickerCancel: { color: '#60a5fa', fontSize: 14, fontWeight: '700' },
  pickerEmpty: { padding: 24, alignItems: 'center', gap: 8 },
  pickerEmptyText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 14 },
  pickerEmptyHint: { color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontSize: 12 },
  recipeList: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  recipeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  recipeIngredients: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, flexWrap: 'wrap' },
  arrowText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  recipeNameText: { color: '#fbbf24', fontSize: 14, fontWeight: '800', marginLeft: 8 },

  // Publish
  publishContent: { paddingHorizontal: 16, paddingTop: 12, gap: 12, paddingBottom: 40 },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  reviewValue: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right', flexWrap: 'wrap' },
  errorsBox: {
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12, padding: 14, gap: 6,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#f87171', fontSize: 13, fontWeight: '600' },
  testSolveBtn: {
    backgroundColor: 'rgba(52,211,153,0.2)', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)',
  },
  testSolveBtnText: { color: '#34d399', fontSize: 15, fontWeight: '800' },
  publishBtn: {
    backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  publishBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  uploadErrorText: { color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: -4 },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  resetBtnText: { color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: '700' },
});
