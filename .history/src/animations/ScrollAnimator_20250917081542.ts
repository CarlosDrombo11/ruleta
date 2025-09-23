// src/types/index.ts

export interface ExcelData {
  premios: string[];
  participantes: string[];
}

export interface Participant {
  id: string;
  name: string;
  isActive?: boolean;
  timestamp?: Date;
  eliminated?: boolean;
  color?: string;
}

export interface Prize {
  id: string;
  name: string;
  quantity?: number;
  description?: string;
  category?: string;
}

export interface RouletteConfig {
  spinDuration: number;
  soundEnabled: boolean;
  theme: string;
  animationType: 'smooth' | 'bounce' | 'elastic';
  showConfetti: boolean;
  autoSaveResults: boolean;
}

export interface RouletteState {
  isSpinning: boolean;
  isLoaded: boolean;
  currentWinner: Participant | null;
  currentPrize: Prize | null;
  spinCount: number;
  winners: Array<{
    participant: Participant;
    prize: Prize;
    timestamp: Date;
    spinNumber: number;
  }>;
}

export interface SpinResult {
  winner: Participant;
  prize: Prize;
  spinDuration: number;
  timestamp: Date;
}

export interface FileUploadResult {
  success: boolean;
  data?: ExcelData;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export type RouletteEvent = 
  | 'spin-start'
  | 'spin-end'
  | 'winner-selected'
  | 'config-changed'
  | 'data-loaded'
  | 'error';

// Tipos para Popmotion
export type EasingFunction = (t: number) => number;
export type Easing = EasingFunction | 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | number[];

export interface RouletteEventData {
  type: RouletteEvent;
  payload?: any;
  timestamp: Date;
}

// Configuraciones de tema
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  animations: {
    duration: number;
    easing: string;
  };
}

// Estados de carga
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Configuración de sonidos
export interface SoundConfig {
  enabled: boolean;
  volume: number;
  sounds: {
    spin: string;
    win: string;
    click: string;
  };
}