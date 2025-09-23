// src/core/TimingEngine.ts

import { animate } from 'popmotion';

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
  private currentAnimations: any[] = [];

  // Funciones de easing personalizadas compatibles con Popmotion
  private easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
  private easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);
  private easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
  private easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  private linear = (t: number): number => t;

  public createSyncedTimeline(
    duration: number,
    finalRotation: number,
    winnerPosition: number,
    onUpdate: (values: SyncedAnimation) => void,
    onComplete: () => void
  ): Promise<void> {
    
    if (this.isRunning) {
      console.warn('Timeline ya está ejecutándose');
      return Promise.reject(new Error('Timeline en progreso'));
    }

    this.isRunning = true;

    return new Promise((resolve, reject) => {
      try {
        // Estados actuales para interpolación sincronizada
        let currentValues = {
          rotation: 0,
          position: 0,
          volume: 1.0,
          frequency: 800
        };

        // Crear animaciones paralelas con Popmotion
        const animations = [
          // Rotación de ruleta
          animate({
            from: 0,
            to: finalRotation,
            duration: duration * 1000,
            ease: this.easeOutCubic,
            onUpdate: (value: number) => {
              currentValues.rotation = value;
            }
          }),

          // Posición de scroll
          animate({
            from: 0,
            to: winnerPosition,
            duration: duration * 1000,
            ease: this.easeOutCubic,
            onUpdate: (value: number) => {
              currentValues.position = value;
            }
          }),

          // Volumen de audio
          animate({
            from: 1.0,
            to: 0.001,
            duration: duration * 1000,
            ease: this.easeOutExpo,
            onUpdate: (value: number) => {
              currentValues.volume = value;
            }
          }),

          // Frecuencia de audio
          animate({
            from: 800,
            to: 100,
            duration: duration * 1000,
            ease: this.linear,
            onUpdate: (value: number) => {
              currentValues.frequency = value;
            }
          })
        ];

        // Guardar animaciones para poder detenerlas
        this.currentAnimations = animations;

        // Loop de actualización sincronizado
        const updateLoop = () => {
          if (!this.isRunning) return;

          const syncedValues: SyncedAnimation = {
            roulette: {
              rotation: currentValues.rotation
            },
            scroll: {
              position: currentValues.position
            },
            audio: {
              volume: currentValues.volume,
              frequency: currentValues.frequency
            }
          };
          
          onUpdate(syncedValues);
          requestAnimationFrame(updateLoop);
        };

        // Iniciar loop de actualización
        updateLoop();

        // Esperar a que todas las animaciones terminen
        Promise.all(animations).then(() => {
          this.isRunning = false;
          this.currentAnimations = [];
          onComplete();
          resolve();
          console.log(`Timeline completado - Duración: ${duration}s`);
        }).catch((error) => {
          this.isRunning = false;
          this.currentAnimations = [];
          console.error('Error en timeline:', error);
          reject(error);
        });

        console.log(`Timeline iniciado - Duración: ${duration}s`);

      } catch (error) {
        this.isRunning = false;
        this.currentAnimations = [];
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
      return Promise.reject(new Error('Animación en progreso'));
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
        ease: this.easeOutCubic,
        onUpdate: (value: number) => {
          currentValues.rotation = value;
        }
      }),

      // Posición de scroll
      animate({
        from: 0,
        to: winnerPosition,
        duration: duration * 1000,
        ease: this.easeOutCubic,
        onUpdate: (value: number) => {
          currentValues.position = value;
        }
      }),

      // Volumen de audio
      animate({
        from: 1.0,
        to: 0.001,
        duration: duration * 1000,
        ease: this.easeOutExpo,
        onUpdate: (value: number) => {
          currentValues.volume = value;
        }
      }),

      // Frecuencia de audio
      animate({
        from: 800,
        to: 100,
        duration: duration * 1000,
        ease: this.linear,
        onUpdate: (value: number) => {
          currentValues.frequency = value;
        }
      })
    ];

    this.currentAnimations = animations;

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
      this.currentAnimations = [];
      onComplete();
      console.log('Todas las animaciones completadas');
    }).catch((error) => {
      this.isRunning = false;
      this.currentAnimations = [];
      console.error('Error en animaciones:', error);
      throw error;
    });
  }


// MÉTODO CORREGIDO - Reemplazar en TimingEngine.ts
public createSimpleSpinAnimation(
  duration: number,
  spins: number,
  onUpdate: (rotation: number) => void,
  onComplete: () => void
): Promise<void> {

  if (this.isRunning) {
    return Promise.reject(new Error('Animación en progreso'));
  }

  this.isRunning = true;
  
  // Calcular rotación total - MANTENER ACUMULATIVA
  const totalRotation = spins * 360 * (Math.PI / 180); // Convertir a radianes
  let currentRotation = 0; // Estado actual de rotación

  return new Promise((resolve, reject) => {
    try {
      // FASE 1: Aceleración y velocidad alta (70% del tiempo)
      const phase1Duration = duration * 0.7 * 1000; // ms
      const phase1Rotation = totalRotation * 0.8; // 80% de la rotación total
      
      console.log('Iniciando fase 1 de rotación:', {
        duration: phase1Duration / 1000,
        rotation: phase1Rotation * (180/Math.PI) // debug en grados
      });
      
      const phase1Animation = animate({
        from: 0,
        to: phase1Rotation,
        duration: phase1Duration,
        ease: this.easeOutCubic,
        onUpdate: (value: number) => {
          currentRotation = value; // Actualizar estado
          onUpdate(currentRotation); // Enviar valor acumulativo
        },
        onComplete: () => {
          // FASE 2: Desaceleración suave (30% del tiempo)
          const phase2Duration = duration * 0.3 * 1000; // ms
          
          console.log('Iniciando fase 2 de rotación:', {
            duration: phase2Duration / 1000,
            fromRotation: phase1Rotation * (180/Math.PI), // debug en grados
            toRotation: totalRotation * (180/Math.PI) // debug en grados
          });
          
          const phase2Animation = animate({
            from: phase1Rotation, // Continuar desde donde terminó fase 1
            to: totalRotation,    // Hasta la rotación final
            duration: phase2Duration,
            ease: this.easeOutQuint, // Desaceleración más suave
            onUpdate: (value: number) => {
              currentRotation = value; // Mantener acumulativo
              onUpdate(currentRotation);
            },
            onComplete: () => {
              this.isRunning = false;
              this.currentAnimations = [];
              onComplete();
              resolve();
              console.log('Animación de rotación completada suavemente');
            }
          });

          this.currentAnimations = [phase2Animation];
        }
      });

      this.currentAnimations = [phase1Animation];
      
    } catch (error) {
      this.isRunning = false;
      this.currentAnimations = [];
      console.error('Error iniciando animación de rotación:', error);
      reject(error);
    }
  });
}

  public stopCurrentAnimation(): void {
    if (this.currentAnimations.length > 0) {
      this.currentAnimations.forEach(animation => {
        try {
          if (animation && typeof animation.stop === 'function') {
            animation.stop();
          }
        } catch (e) {
          console.warn('Error stopping animation:', e);
        }
      });
      this.currentAnimations = [];
    }
    this.isRunning = false;
    console.log('Animación detenida');
  }

  public isAnimating(): boolean {
    return this.isRunning;
  }

  // Funciones de easing estáticas para uso externo
  public static easingFunctions = {
    easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
    easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
    easeOutQuint: (t: number): number => 1 - Math.pow(1 - t, 5),
    easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeOutBack: (t: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    linear: (t: number): number => t
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