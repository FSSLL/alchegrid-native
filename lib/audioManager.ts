import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const MUSIC = require('../assets/audio/background.mp3');
const SFX   = require('../assets/audio/drop_sfx.aac');

class AudioManager {
  private music: Audio.Sound | null = null;
  private drop:  Audio.Sound | null = null;
  private musicVol     = 0.5;
  private sfxVol       = 0.8;
  private ready        = false;
  private musicStarted = false; // guard: only play music after startMusic() is called

  async init(musicVolume: number, sfxVolume: number) {
    if (Platform.OS === 'web') return;
    this.musicVol = musicVolume;
    this.sfxVol   = sfxVolume;
    if (this.ready) return;
    this.ready = true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
      });
    } catch {}

    try {
      const { sound } = await Audio.Sound.createAsync(SFX, {
        shouldPlay: false,
        volume: sfxVolume,
      });
      this.drop = sound;
    } catch {}

    try {
      const { sound } = await Audio.Sound.createAsync(MUSIC, {
        shouldPlay: false,
        isLooping: true,
        volume: musicVolume,
      });
      this.music = sound;
    } catch {}
  }

  // Call once when the intro screen finishes — starts looping background music.
  async startMusic() {
    if (Platform.OS === 'web' || !this.music) return;
    this.musicStarted = true;
    if (this.musicVol === 0) return;
    try {
      await this.music.setVolumeAsync(this.musicVol);
      const s = await this.music.getStatusAsync();
      if (s.isLoaded && !s.isPlaying) await this.music.playAsync();
    } catch {}
  }

  async playDrop() {
    if (Platform.OS === 'web' || !this.drop || this.sfxVol === 0) return;
    try {
      await this.drop.setPositionAsync(0);
      await this.drop.playAsync();
    } catch {}
  }

  async playClick() {
    if (Platform.OS === 'web' || !this.drop || this.sfxVol === 0) return;
    try {
      await this.drop.setPositionAsync(0);
      await this.drop.playAsync();
    } catch {}
  }

  async setMusicVolume(vol: number) {
    this.musicVol = vol;
    if (Platform.OS === 'web' || !this.music || !this.musicStarted) return;
    try {
      await this.music.setVolumeAsync(vol);
      if (vol === 0) {
        await this.music.pauseAsync();
      } else {
        const s = await this.music.getStatusAsync();
        if (s.isLoaded && !s.isPlaying) await this.music.playAsync();
      }
    } catch {}
  }

  async setSfxVolume(vol: number) {
    this.sfxVol = vol;
    if (Platform.OS === 'web' || !this.drop) return;
    try {
      await this.drop.setVolumeAsync(vol);
    } catch {}
  }

  async unload() {
    if (Platform.OS === 'web') return;
    try { await this.music?.unloadAsync(); } catch {}
    try { await this.drop?.unloadAsync();  } catch {}
    this.music        = null;
    this.drop         = null;
    this.ready        = false;
    this.musicStarted = false;
  }
}

export const audioManager = new AudioManager();
