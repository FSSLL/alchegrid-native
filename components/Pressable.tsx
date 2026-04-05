import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { tap } from '../lib/feedback';

export default function Pressable({ onPress, ...props }: TouchableOpacityProps) {
  return (
    <TouchableOpacity
      {...props}
      onPress={onPress ? (e) => { tap(); onPress(e); } : undefined}
    />
  );
}
