// src/core/TimingEngine.ts

import { animate, timeline } from 'popmotion';

export interface SyncedAnimation {
  roulette: {
    rotation: number;
  };
  scroll: {
    position: number;
  };
  audio: {
    volume: number;
    frequency: number;
  };
}

export class TimingEngine {
  private isRunning = false;
  private currentTimeline: any = null;

  public createSyncedTimeline(
    duration: number,
    finalRotation: number,
    winnerPosition: number,
    onUpdate: (values: SyncedAnimation) => void,
    onComplete: () => void
  ): Promise<void> {
    
    if (this.isRunning) {
      console.warn('Timeline ya está ejecutándose');
      return Promise.reject('Timeline en progreso');
    }

    this.isRunning = true;

    return new Promise((resolve, reject) => {
      try {
        // Crear timeline sincronizado con múltiples tracks
        this.currentTimeline = timeline([
          // Track de rotación de la ruleta
          {
            track: 'roulette',
            from: 0,
            to: finalRotation,
            duration: duration * 1000, // Popmotion usa milisegundos
            ease: 'easeOutCubic'
          },
          // Track de posición del scroll
          {
            track: 'scroll', 
            from: 0,
            to: winnerPosition,
            duration: duration * 1000,
            ease: 'easeOutCubic'
          },
          // Track de volumen de audio
          {
            track: 'audioVolume',
            from: 1.0,
            to: 0.001,
            duration: duration * 1000,
            ease: 'easeOutExpo'
          },
          // Track de frecuencia de audio
          {
            track: 'audioFrequency',
            from: 800,
            to: 100,
            duration: duration * 1000,
            ease: 'linear'
          }
        ]);

        // Configurar callbacks del timeline
        this.currentTimeline.subscribe({
          update: (values: any) => {
            const syncedValues: SyncedAnimation = {
              roulette: {
                rotation: values.roulette || 0
              },
              scroll: {
                position: values.scroll || 0
              },
              audio: {
                volume: values.audioVolume || 1.0,
                frequency: values.audioFrequency || 800
              }
            };
            
            onUpdate(syncedValues);
          },
          complete: () => {
            this.isRunning = false;
            this.currentTimeline = null;
            onComplete();
            resolve();
          },
          error: (error: any) => {
            this.isRunning = false;
            this.currentTimeline = null;
            console.error('Error en timeline:', error);
            reject(error);
          }
        });

        console.log(`Timeline iniciado - Duración: ${duration}s`);

      } catch (error) {
        this.isRunning = false;
        console.error('Error creando timeline:', error);
        reject(error);
      }
    });
  }

  // Método alternativo usando animate individual para mayor control
  public createIndividualAnimations(
    duration: number,
    finalRotation: number,
    winnerPosition: number,
    onUpdate: (values: SyncedAnimation) => void,
    onComplete: () => void
  ): Promise<void> {

    if (this.isRunning) {
      return Promise.reject('Animación en progreso');
    }

    this.isRunning = true;

    // Estados actuales para interpolación
    let currentValues = {
      rotation: 0,
      position: 0,
      volume: 1.0,
      frequency: 800
    };

    // Configurar animaciones paralelas
    const animations = [
      // Rotación de ruleta
      animate({
        from: 0,
        to: finalRotation,
        duration: duration * 1000,
        ease: 'easeOutCubic',
        onUpdate: (value: number) => {
          currentValues.rotation = value;
        }
      }),

      // Posición de scroll
      animate({
        from: 0,
        to: winnerPosition,
        duration: duration * 1000,
        ease: 'easeOutCubic',
        onUpdate: (value: number) => {
          currentValues.position = value;
        }
      }),

      // Volumen de audio
      animate({
        from: 1.0,
        to: 0.001,
        duration: duration * 1000,
        ease: 'easeOutExpo',
        onUpdate: (value: number) => {
          currentValues.volume = value;
        }
      }),

      // Frecuencia de audio
      animate({
        from: 800,
        to: 100,
        duration: duration * 1000,
        ease: 'linear',
        onUpdate: (value: number) => {
          currentValues.frequency = value;
        }
      })
    ];

    // Loop de actualización sincronizado
    const updateLoop = () => {
      if (!this.isRunning) return;

      onUpdate({
        roulette: { rotation: currentValues.rotation },
        scroll: { position: currentValues.position },
        audio: { 
          volume: currentValues.volume,
          frequency: currentValues.frequency
        }
      });

      requestAnimationFrame(updateLoop);
    };

    // Iniciar loop de actualización
    updateLoop();

    // Esperar a que todas las animaciones terminen
    return Promise.all(animations).then(() => {
      this.isRunning = false;
      onComplete();
      console.log('Todas las animaciones completadas');
    }).catch((error) => {
      this.isRunning = false;
      console.error('Error en animaciones:', error);
      throw error;
    });
  }

  public createSimpleSpinAnimation(
    duration: number,
    spins: number,
    onUpdate: (rotation: number) => void,
    onComplete: () => void
  ): Promise<void> {

    if (this.isRunning) {
      return Promise.reject('Animación en progreso');
    }

    this.isRunning = true;
    const totalRotation = spins * 360 * (Math.PI / 180); // Convertir a radianes

    return new Promise((resolve, reject) => {
      animate({
        from: 0,
        to: totalRotation,
        duration: duration * 1000,
        ease: 'easeOutCubic',
        onUpdate: onUpdate,
        onComplete: () => {
          this.isRunning = false;
          onComplete();
          resolve();
        },
        onStop: () => {
          this.isRunning = false;
          reject('Animación detenida');
        }
      });
    });
  }

  public stopCurrentAnimation(): void {
    if (this.currentTimeline) {
      this.currentTimeline.stop();
      this.currentTimeline = null;
    }
    this.isRunning = false;
    console.log('Animación detenida');
  }

  public isAnimating(): boolean {
    return this.isRunning;
  }

  // Funciones de easing personalizadas
  public static easingFunctions = {
    easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
    easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
    easeOutQuint: (t: number): number => 1 - Math.pow(1 - t, 5),
    easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeOutBack: (t: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
  };

  public calculateFinalRotation(winner: string, participants: string[], baseSpins = 3): number {
    const winnerIndex = participants.indexOf(winner);
    if (winnerIndex === -1) {
      console.warn('Ganador no encontrado en la lista de participantes');
      return baseSpins * 2 * Math.PI;
    }

    const participantAngle = (winnerIndex / participants.length) * 2 * Math.PI;
    const baseRotation = baseSpins * 2 * Math.PI;
    
    // Añadir variación aleatoria para que no sea predecible
    const randomVariation = (Math.random() - 0.5) * 0.2; // ±0.1 radianes
    
    return baseRotation + participantAngle + randomVariation;
  }

  public calculateScrollPosition(winner: string, participants: string[], itemHeight = 60): number {
    const winnerIndex = participants.indexOf(winner);
    if (winnerIndex === -1) return 0;

    // Calcular posición para centrar el ganador
    const targetPosition = winnerIndex * itemHeight;
    
    // Añadir múltiples vueltas para efecto visual
    const extraScrolls = 3;
    const totalScrollDistance = (participants.length * itemHeight * extraScrolls) + targetPosition;
    
    return totalScrollDistance;
  }
}