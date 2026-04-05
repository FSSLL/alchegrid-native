import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { audioManager } from './audioManager';
import { useAudioStore } from '../store/audioStore';

export function tap() {
  audioManager.playClick().catch(() => {});
  if (Platform.OS !== 'web' && useAudioStore.getState().hapticsEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}
