import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { ELEMENT_EMOJIS, RECIPE_EMOJIS } from '../lib/elementEmojis';
import { ELEMENT_PNGS } from '../constants/assets';

// ── Video map ────────────────────────────────────────────────────────────────
export const VIDEO_MAP: Record<string, ReturnType<typeof require>> = {
  dust:      require('../assets/videos/dust.mp4'),
  lightning: require('../assets/videos/lightning.mp4'),
  fume:      require('../assets/videos/fume.mp4'),
  reactor:   require('../assets/videos/reactor.mp4'),
  flash:     require('../assets/videos/flash.mp4'),
};

export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

interface ElementIconProps {
  name: string;
  size: number;
  showLabel?: boolean;
  opacity?: number;
  labelFontSize?: number;
}

const ElementIcon = memo(({
  name,
  size,
  showLabel = false,
  opacity = 1,
  labelFontSize,
}: ElementIconProps) => {
  const key = normalizeName(name);
  const videoSrc = VIDEO_MAP[key] ?? null;
  const pngSrc   = videoSrc ? null : (ELEMENT_PNGS[key] ?? ELEMENT_PNGS[name] ?? null);
  const emoji     = ELEMENT_EMOJIS[key] ?? RECIPE_EMOJIS[key] ?? name[0];
  const shortName = name.length > 6 ? name.substring(0, 4) : name;
  const lblSize   = labelFontSize ?? size * 0.28;
  const emojiSize = size * 0.7;

  if (videoSrc) {
    const radius = size * 0.2;
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
          <Video
            source={videoSrc}
            style={{ width: size, height: size, opacity }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            useNativeControls={false}
          />
        </View>
        {showLabel && (
          <Text style={[styles.label, { fontSize: lblSize }]} numberOfLines={1}>
            {shortName}
          </Text>
        )}
      </View>
    );
  }

  if (pngSrc) {
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <Image
          source={pngSrc}
          style={{ width: size, height: size, opacity }}
          resizeMode="stretch"
        />
        {showLabel && (
          <Text style={[styles.label, { fontSize: lblSize }]} numberOfLines={1}>
            {shortName}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Text style={[styles.emoji, { fontSize: emojiSize, opacity }]}>{emoji}</Text>
      {showLabel && (
        <Text style={[styles.label, { fontSize: lblSize }]} numberOfLines={1}>
          {shortName}
        </Text>
      )}
    </View>
  );
});

ElementIcon.displayName = 'ElementIcon';

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
});

export default ElementIcon;
