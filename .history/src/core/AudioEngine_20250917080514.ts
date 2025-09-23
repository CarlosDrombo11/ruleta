// src/core/AudioEngine.ts

import { AudioType } from '../types';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private isInitialized = false;
  private currentVolume = 0.5;

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.isInitialized = true;
      
      // Precargar sonidos predeterminados
      await this.loadDefaultSounds();
    } catch (error) {
      console.error('Error inicializando AudioEngine:', error);
    }
  }

  private async loadDefaultSounds(): Promise<void> {
    // Los sonidos se generan proceduralmente, no se cargan archivos
    console.log('Sonidos predeterminados listos');
  }

  public async createSpinSound(type: AudioType, duration: number): Promise<void> {
    if (!this.isInitialized || !this.audioContext || !this.gainNode) {
      console.warn('AudioEngine no está inicializado');
      return;
    }

    // Asegurar que el contexto esté activo
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Detener cualquier sonido anterior
    this.stopCurrentSound();

    const now = this.audioContext.currentTime;

    if (type === 'classic') {
      await this.createClassicSpinSound(duration, now);
    } else if (type === 'electronic') {
      await this.createElectronicSpinSound(duration, now);
    }
  }

  private async createClassicSpinSound(duration: number, startTime: number): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    // Crear tick-tick-tick mecánico
    const tickInterval = 0.1; // Inicial: 10 ticks por segundo
    const totalTicks = Math.floor(duration / tickInterval * 2); // Más ticks al inicio

    for (let i = 0; i < totalTicks; i++) {
      const tickTime = startTime + (i * tickInterval * (1 + i * 0.05)); // Espaciado creciente
      const volume = Math.max(0.001, this.currentVolume * (1 - i / totalTicks));
      
      if (tickTime > startTime + duration) break;

      this.createTick(tickTime, volume);
    }
  }

  private createTick(time: number, volume: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(this.gainNode);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    oscillator.start(time);
    oscillator.stop(time + 0.05);
  }

  private async createElectronicSpinSound(duration: number, startTime: number): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    this.oscillator = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    // Configurar filtro
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.frequency.linearRampToValueAtTime(200, startTime + duration);

    // Configurar LFO para modulación
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(20, startTime);
    lfo.frequency.linearRampToValueAtTime(2, startTime + duration);

    lfoGain.gain.setValueAtTime(100, startTime);

    // Conectar cadena de audio
    lfo.connect(lfoGain);
    lfoGain.connect(this.oscillator.frequency);
    
    this.oscillator.connect(filter);
    filter.connect(this.gainNode);

    // Configurar oscilador principal
    this.oscillator.type = 'sawtooth';
    this.oscillator.frequency.setValueAtTime(400, startTime);
    this.oscillator.frequency.linearRampToValueAtTime(80, startTime + duration);

    // Envelope de volumen
    this.gainNode.gain.setValueAtTime(this.currentVolume, startTime);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Iniciar sonido
    lfo.start(startTime);
    this.oscillator.start(startTime);
    
    // Programar parada
    lfo.stop(startTime + duration);
    this.oscillator.stop(startTime + duration);
  }

  public playCelebrationSound(): void {
    if (!this.isInitialized || !this.audioContext || !this.gainNode) return;

    const now = this.audioContext.currentTime;
    const duration = 1.5;

    // Crear fanfarria simple
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      const delay = index * 0.15;
      const oscillator = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      oscillator.connect(gain);
      gain.connect(this.gainNode!);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.currentVolume * 0.3, now + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.8);
    });
  }

  public stopCurrentSound(): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator = null;
      } catch (e) {
        // El oscilador ya está detenido
      }
    }
  }

  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.currentVolume, this.audioContext!.currentTime);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public async loadCustomSound(file: File): Promise<void> {
    if (!this.audioContext) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set('custom', audioBuffer);
      console.log('Sonido personalizado cargado');
    } catch (error) {
      console.error('Error cargando sonido personalizado:', error);
    }
  }

  public playCustomSound(): void {
    if (!this.audioContext || !this.gainNode) return;

    const buffer = this.buffers.get('custom');
    if (!buffer) {
      console.warn('Sonido personalizado no cargado');
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();
  }

  public destroy(): void {
    this.stopCurrentSound();
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.buffers.clear();
    this.isInitialized = false;
  }
}