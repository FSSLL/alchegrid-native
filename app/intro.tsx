import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useAudioStore } from '../store/audioStore';
import { audioManager } from '../lib/audioManager';

const INTRO_VIDEO  = require('../assets/videos/intro.mp4');
const SKIP_DELAY   = 3000;
const RING_R       = 21;
const RING_CIRC    = 2 * Math.PI * RING_R;

// ── Skip ring ──────────────────────────────────────────────────────────────
function SkipRing({ progress }: { progress: number }) {
  const canSkip = progress >= 1;
  const offset  = RING_CIRC * (1 - Math.min(progress, 1));

  return (
    <View style={ring.wrap}>
      <Svg width={56} height={56} style={ring.svg}>
        <Circle
          cx={28} cy={28} r={RING_R}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={3}
          fill="none"
        />
        <Circle
          cx={28} cy={28} r={RING_R}
          stroke={canSkip ? '#22c55e' : '#ff6a00'}
          strokeWidth={3}
          fill="none"
          strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin="28,28"
        />
      </Svg>
      <Text style={[ring.label, canSkip && ring.labelReady]}>
        {canSkip ? 'SKIP' : '●●●'}
      </Text>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap:       { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  svg:        { position: 'absolute' },
  label:      { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  labelReady: { color: '#22c55e', fontSize: 9 },
});

// ── Intro screen ────────────────────────────────────────────────────────────
export default function IntroScreen() {
  const musicVolume = useAudioStore((s) => s.musicVolume);
  const [posMs,    setPosMs]    = useState(0);
  const [showRing, setShowRing] = useState(false);
  const canSkip  = posMs >= SKIP_DELAY;
  const progress = posMs / SKIP_DELAY;

  const goHome = useCallback(() => {
    audioManager.startMusic().catch(() => {});
    router.replace('/(tabs)');
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') goHome();
  }, [goHome]);

  const handleStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      setPosMs(status.positionMillis ?? 0);
      if (status.didJustFinish) goHome();
    },
    [goHome],
  );

  const handlePress = () => {
    if (canSkip) {
      goHome();
    } else {
      setShowRing(true);
    }
  };

  useEffect(() => {
    if (canSkip) setShowRing(true);
  }, [canSkip]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video fills width, black bars fill the remaining height */}
      <Video
        source={INTRO_VIDEO}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        isMuted={musicVolume === 0}
        volume={musicVolume}
        onPlaybackStatusUpdate={handleStatus}
      />

      {/* Fade mask — top: black → transparent, ~20% of screen */}
      <LinearGradient
        colors={['#000000', 'transparent']}
        style={styles.fadeTop}
        pointerEvents="none"
      />

      {/* Fade mask — bottom: transparent → black, ~20% of screen */}
      <LinearGradient
        colors={['transparent', '#000000']}
        style={styles.fadeBottom}
        pointerEvents="none"
      />

      {/* Full-screen tap area */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={handlePress}
        activeOpacity={1}
      />

      {/* Skip ring */}
      {showRing && (
        <View
          style={[
            styles.skipCorner,
            Platform.OS === 'ios' ? styles.skipIOS : styles.skipAndroid,
            { pointerEvents: 'none' },
          ]}
        >
          <SkipRing progress={progress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  fadeTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '22%',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '22%',
  },
  skipCorner:   { position: 'absolute', right: 20 },
  skipIOS:      { top: 58 },
  skipAndroid:  { top: 38 },
});
