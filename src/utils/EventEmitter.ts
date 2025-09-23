// src/utils/EventEmitter.ts

type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();
  private maxListeners = 10;

  public on(event: string, callback: EventCallback): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const listeners = this.events.get(event)!;
    
    if (listeners.size >= this.maxListeners) {
      console.warn(`Máximo número de listeners alcanzado para el evento: ${event}`);
    }

    listeners.add(callback);
    return this;
  }

  public once(event: string, callback: EventCallback): this {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, onceCallback);
    };

    this.on(event, onceCallback);
    return this;
  }

  public off(event: string, callback?: EventCallback): this {
    if (!callback) {
      // Remover todos los listeners para el evento
      this.events.delete(event);
      return this;
    }

    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }

    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }

    // Crear una copia para evitar problemas si se modifican los listeners durante la emisión
    const listenersArray = Array.from(listeners);
    
    for (const callback of listenersArray) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error en listener para evento ${event}:`, error);
      }
    }

    return true;
  }

  public eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  public listenerCount(event: string): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }

  public removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  public setMaxListeners(n: number): this {
    this.maxListeners = Math.max(0, n);
    return this;
  }

  public getMaxListeners(): number {
    return this.maxListeners;
  }
}