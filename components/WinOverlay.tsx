import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface WinOverlayProps {
  stars: number;
  elapsed: number;
  coinsEarned: number;
  onNext: () => void;
  onReplay: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WinOverlay({ stars, elapsed, coinsEarned, onNext, onReplay }: WinOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const starEmojis = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.title}>Level Complete!</Text>
        <Text style={styles.stars}>{starEmojis}</Text>
        <Text style={styles.time}>Time: {formatTime(elapsed)}</Text>
        <Text style={styles.coins}>+{coinsEarned} coins 🪙</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.replayBtn} onPress={onReplay}>
            <Text style={styles.replayText}>Replay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextText}>Next Level →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 17, 23, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#171c26',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: width * 0.8,
    borderWidth: 1,
    borderColor: '#00ff55',
    shadowColor: '#00ff55',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ff6a00',
    letterSpacing: 2,
    marginBottom: 12,
  },
  stars: {
    fontSize: 36,
    marginBottom: 16,
  },
  time: {
    fontSize: 16,
    color: '#8e9ab0',
    fontWeight: '600',
    marginBottom: 4,
  },
  coins: {
    fontSize: 18,
    color: '#fbbf24',
    fontWeight: '700',
    marginBottom: 28,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  replayBtn: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#242e42',
  },
  replayText: {
    color: '#8e9ab0',
    fontWeight: '700',
    fontSize: 15,
  },
  nextBtn: {
    backgroundColor: '#ff6a00',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  nextText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
