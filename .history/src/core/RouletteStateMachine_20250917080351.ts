// src/core/RouletteStateMachine.ts

import { RouletteState, StateTransition } from '../types';
import { EventEmitter } from '../utils/EventEmitter';

interface StateConfig {
  name: RouletteState;
  onEnter?: () => void;
  onExit?: () => void;
  transitions: Partial<Record<RouletteState, boolean | (() => boolean)>>;
}

export class RouletteStateMachine extends EventEmitter {
  private currentState: RouletteState = 'idle';
  private stateConfigs: Map<RouletteState, StateConfig> = new Map();
  private isTransitioning = false;

  constructor() {
    super();
    this.initializeStates();
  }

  private initializeStates(): void {
    const configs: StateConfig[] = [
      {
        name: 'idle',
        onEnter: () => console.log('Estado: Esperando datos'),
        transitions: {
          'dataLoaded': true,
          'configuring': true
        }
      },
      {
        name: 'dataLoaded',
        onEnter: () => console.log('Estado: Datos cargados'),
        transitions: {
          'manualMode': true,
          'autoMode': true,
          'configuring': true
        }
      },
      {
        name: 'manualMode',
        onEnter: () => {
          console.log('Estado: Modo manual activado');
          this.emit('setupManualControls');
        },
        transitions: {
          'spinning': () => this.isSpacebarPressed(),
          'autoMode': true,
          'configuring': true,
          'finished': () => this.noPrizesLeft()
        }
      },
      {
        name: 'autoMode',
        onEnter: () => {
          console.log('Estado: Modo automático activado');
          this.emit('startAutoTimer');
        },
        onExit: () => {
          this.emit('stopAutoTimer');
        },
        transitions: {
          'spinning': () => this.autoTimerExpired(),
          'paused': true,
          'manualMode': true,
          'finished': () => this.noPrizesLeft(),
          'configuring': true
        }
      },
      {
        name: 'spinning',
        onEnter: () => {
          console.log('Estado: Girando');
          this.emit('startSpin');
        },
        transitions: {
          'celebrating': () => this.spinCompleted()
        }
      },
      {
        name: 'celebrating',
        onEnter: () => {
          console.log('Estado: Celebrando');
          this.emit('showCelebration');
        },
        transitions: {
          'manualMode': () => this.getMode() === 'manual',
          'autoMode': () => this.getMode() === 'auto',
          'finished': () => this.noPrizesLeft()
        }
      },
      {
        name: 'paused',
        onEnter: () => {
          console.log('Estado: Pausado');
          this.emit('pauseOperations');
        },
        transitions: {
          'autoMode': true,
          'manualMode': true,
          'configuring': true
        }
      },
      {
        name: 'configuring',
        onEnter: () => {
          console.log('Estado: Configurando');
          this.emit('showConfigPanel');
        },
        transitions: {
          'idle': true,
          'dataLoaded': () => this.hasData(),
          'manualMode': () => this.hasData(),
          'autoMode': () => this.hasData()
        }
      },
      {
        name: 'finished',
        onEnter: () => {
          console.log('Estado: Terminado - No hay más premios');
          this.emit('showFinished');
        },
        transitions: {
          'idle': true,
          'configuring': true
        }
      }
    ];

    configs.forEach(config => {
      this.stateConfigs.set(config.name, config);
    });
  }

  public transition(to: RouletteState): boolean {
    if (this.isTransitioning) {
      console.warn('Transición en progreso, ignorando nueva transición');
      return false;
    }

    const currentConfig = this.stateConfigs.get(this.currentState);
    if (!currentConfig) {
      console.error(`Configuración de estado no encontrada: ${this.currentState}`);
      return false;
    }

    const transitionRule = currentConfig.transitions[to];
    
    // Verificar si la transición está permitida
    if (transitionRule === undefined) {
      console.warn(`Transición no permitida: ${this.currentState} -> ${to}`);
      return false;
    }

    // Verificar condición si es una función
    if (typeof transitionRule === 'function' && !transitionRule()) {
      console.log(`Condición de transición no cumplida: ${this.currentState} -> ${to}`);
      return false;
    }

    // Ejecutar transición
    this.isTransitioning = true;
    
    try {
      // Ejecutar onExit del estado actual
      if (currentConfig.onExit) {
        currentConfig.onExit();
      }

      const previousState = this.currentState;
      this.currentState = to;

      // Ejecutar onEnter del nuevo estado
      const newConfig = this.stateConfigs.get(to);
      if (newConfig?.onEnter) {
        newConfig.onEnter();
      }

      // Emitir evento de cambio de estado
      this.emit('stateChange', { from: previousState, to });
      
      console.log(`Transición exitosa: ${previousState} -> ${to}`);
      return true;

    } catch (error) {
      console.error('Error durante la transición:', error);
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  public getCurrentState(): RouletteState {
    return this.currentState;
  }

  public canTransitionTo(state: RouletteState): boolean {
    const currentConfig = this.stateConfigs.get(this.currentState);
    if (!currentConfig) return false;

    const transitionRule = currentConfig.transitions[state];
    if (transitionRule === undefined) return false;
    if (typeof transitionRule === 'function') return transitionRule();
    return transitionRule;
  }

  public getAvailableTransitions(): RouletteState[] {
    const currentConfig = this.stateConfigs.get(this.currentState);
    if (!currentConfig) return [];

    return Object.keys(currentConfig.transitions)
      .filter(state => this.canTransitionTo(state as RouletteState))
      .map(state => state as RouletteState);
  }

  // Métodos auxiliares para condiciones
  private spacebarPressed = false;
  private autoTimer = false;
  private spinComplete = false;
  private mode: 'manual' | 'auto' = 'manual';
  private dataLoaded = false;
  private prizesAvailable = true;

  public setSpacebarPressed(pressed: boolean): void {
    this.spacebarPressed = pressed;
  }

  private isSpacebarPressed(): boolean {
    return this.spacebarPressed;
  }

  public setAutoTimerExpired(expired: boolean): void {
    this.autoTimer = expired;
  }

  private autoTimerExpired(): boolean {
    return this.autoTimer;
  }

  public setSpinCompleted(completed: boolean): void {
    this.spinComplete = completed;
  }

  private spinCompleted(): boolean {
    return this.spinComplete;
  }

  public setMode(mode: 'manual' | 'auto'): void {
    this.mode = mode;
  }

  private getMode(): 'manual' | 'auto' {
    return this.mode;
  }

  public setDataLoaded(loaded: boolean): void {
    this.dataLoaded = loaded;
  }

  private hasData(): boolean {
    return this.dataLoaded;
  }

  public setPrizesAvailable(available: boolean): void {
    this.prizesAvailable = available;
  }

  private noPrizesLeft(): boolean {
    return !this.prizesAvailable;
  }

  public reset(): void {
    this.currentState = 'idle';
    this.spacebarPressed = false;
    this.autoTimer = false;
    this.spinComplete = false;
    this.dataLoaded = false;
    this.prizesAvailable = true;
    this.mode = 'manual';
    this.emit('reset');
  }
}