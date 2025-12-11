export type DeckId = 'A' | 'B';

export interface DeckState {
  id: DeckId;
  title: string;
  artist: string;
  bpm: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number; // 1.0 is normal
  volume: number; // -Infinity to 0 dB
  isLoaded: boolean;
  coverArt: string;
  errorMessage?: string | null;
}

export interface MixerState {
  crossfader: number; // -1 (A) to 1 (B)
  volumeA: number;
  volumeB: number;
  eqA: EQState;
  eqB: EQState;
}

export interface EQState {
  high: number; // -12 to 12
  mid: number;
  low: number;
}

export interface TrackInfo {
  url: string;
  title: string;
  artist: string;
  coverArt: string;
  bpm: number;
}

export type StemType = 'vocals' | 'drums' | 'bass' | 'other';
export type StemState = Record<StemType, boolean>; // true = active, false = muted

export interface EffectState {
  cutoff: number; // Hz
  resonance: number; // 0-1
  active: boolean;
}