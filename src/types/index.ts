// src/types/index.ts

export type RouletteState =
  | 'idle'
  | 'dataLoaded'
  | 'manualMode'
  | 'autoMode'
  | 'spinning'
  | 'celebrating'
  | 'paused'
  | 'configuring'
  | 'finished';

export interface StateTransition {
  from: RouletteState;
  to: RouletteState;
  condition?: () => boolean;
  action?: () => void;
}

export interface ExcelData {
  premios: string[];
  participantes: string[];
}

export interface Participant {
  id: string;
  name: string;
  color: string;
  eliminated: boolean;
}

export interface Prize {
  id: string;
  name: string;
  imageIndex: number;
  winner?: Participant;
}

export type ParticleType = 'snow' | 'autumn' | 'confetti' | 'bubbles' | 'stars' | 'petals' | 'none';
export type AudioType = 'classic' | 'electronic' | 'custom';
export type BackgroundType = 'color' | 'gradient' | 'image';

export interface TitleConfig {
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  effects: string[];
  backgroundColor: string;
  vegasStyle: boolean;
  headerStyle: 'default' | 'vegas-header' | 'vegas-theater' | 'vegas-casino' | 'vegas-deco'; // ← NUEVO
}

export interface BackgroundConfig {
  type: BackgroundType;
  value: string;
  opacity: number;
  blur?: number;
  adjustment?: 'cover' | 'contain' | 'repeat' | 'center';
  position?: string; // 'center center', 'left center', etc.
}

export interface AudioConfig {
  type: AudioType;
  volume: number;
  customUrl?: string;
  celebrationVolume: number;
}

export interface TimingConfig {
  spinDuration: number;
  autoInterval: number;
  celebrationDuration: number;
}

export interface AnimationConfig {
  type: ParticleType;
  intensity: number;
  speed: number;
}

export interface AppConfig {
  title: TitleConfig;
  background: BackgroundConfig;
  audio: AudioConfig;
  timing: TimingConfig;
  animations: AnimationConfig;
  mode: 'manual' | 'auto';
  highlightColor: string;
  operationMode: 'semi-auto' | 'full-auto'; // Modo de operación de la ruleta
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation?: number;
  rotationSpeed?: number;
}

export interface Timeline {
  track: string;
  keyframes: Array<{
    at: number;
    [key: string]: any;
  }>;
  ease?: string;
}
