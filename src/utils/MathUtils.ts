// src/utils/MathUtils.ts

export class MathUtils {
  // Generar colores aleatorios vibrantes para participantes
  public static generateVibrantColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#AED6F1', '#F1948A', '#D7BDE2',
      '#A9DFBF', '#F9E79F', '#85C1E9', '#F5B7B1', '#D2B4DE'
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Generar ID único simple
  public static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Calcular rotación final de la ruleta
  public static calculateRouletteRotation(
    winnerIndex: number,
    totalParticipants: number,
    baseSpins: number = 3
  ): number {
    if (totalParticipants === 0) return 0;

    // Ángulo por participante
    const anglePerParticipant = (2 * Math.PI) / totalParticipants;

    // Ángulo del ganador (invertido para compensar rotación clockwise)
    const winnerAngle = (totalParticipants - winnerIndex) * anglePerParticipant;

    // Rotación base (varias vueltas)
    const baseRotation = baseSpins * 2 * Math.PI;

    // Variación aleatoria para naturalidad
    const randomVariation = (Math.random() - 0.5) * 0.3;

    return baseRotation + winnerAngle + randomVariation;
  }

  // Calcular posición final del scroll
  public static calculateScrollPosition(
    winnerIndex: number,
    totalParticipants: number,
    itemHeight: number = 60,
    containerHeight: number = 400,
    extraScrolls: number = 3
  ): number {
    if (totalParticipants === 0) return 0;
    
    // Posición del ganador
    const winnerPosition = winnerIndex * itemHeight;
    
    // Centro del contenedor
    const centerOffset = containerHeight / 2 - itemHeight / 2;
    
    // Vueltas extra para efecto visual
    const totalListHeight = totalParticipants * itemHeight;
    const extraDistance = totalListHeight * extraScrolls;
    
    return extraDistance + winnerPosition - centerOffset;
  }

  // Funciones de easing personalizadas
  public static easing = {
    linear: (t: number): number => t,
    
    easeInQuad: (t: number): number => t * t,
    
    easeOutQuad: (t: number): number => t * (2 - t),
    
    easeInOutQuad: (t: number): number => 
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    
    easeInCubic: (t: number): number => t * t * t,
    
    easeOutCubic: (t: number): number => 
      --t * t * t + 1,
    
    easeInOutCubic: (t: number): number => 
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    
    easeInQuart: (t: number): number => t * t * t * t,
    
    easeOutQuart: (t: number): number => 
      1 - --t * t * t * t,
    
    easeInOutQuart: (t: number): number => 
      t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
    
    easeOutBack: (t: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    
    easeOutElastic: (t: number): number => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : 
        Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    
    easeOutBounce: (t: number): number => {
      const n1 = 7.5625;
      const d1 = 2.75;

      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
  };

  // Interpolar entre dos valores
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, t));
  }

  // Interpolar entre dos colores (formato hex)
  public static lerpColor(colorA: string, colorB: string, t: number): string {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      const componentToHex = (c: number) => {
        const hex = Math.round(c).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    };

    const colorARgb = hexToRgb(colorA);
    const colorBRgb = hexToRgb(colorB);

    const r = this.lerp(colorARgb.r, colorBRgb.r, t);
    const g = this.lerp(colorARgb.g, colorBRgb.g, t);
    const b = this.lerp(colorARgb.b, colorBRgb.b, t);

    return rgbToHex(r, g, b);
  }

  // Normalizar ángulo a rango 0-2π
  public static normalizeAngle(angle: number): number {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
  }

  // Convertir grados a radianes
  public static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Convertir radianes a grados
  public static radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  }

  // Generar número aleatorio en rango
  public static randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  // Generar entero aleatorio en rango (inclusivo)
  public static randomIntInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Seleccionar elemento aleatorio de un array
  public static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Mezclar array (Fisher-Yates shuffle)
  public static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Obtener elementos únicos de un array
  public static getUniqueItems<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  // Calcular distancia entre dos puntos
  public static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Clamp value between min and max
  public static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  // Mapear valor de un rango a otro
  public static map(
    value: number, 
    inputMin: number, 
    inputMax: number, 
    outputMin: number, 
    outputMax: number
  ): number {
    return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
  }

  // Verificar si un número está dentro de un rango
  public static inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  // Redondear a número específico de decimales
  public static roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  // Formatear tiempo en mm:ss
  public static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Calcular progreso como porcentaje
  public static calculateProgress(current: number, total: number): number {
    if (total === 0) return 0;
    return Math.max(0, Math.min(100, (current / total) * 100));
  }

  // Generar gradiente CSS
  public static generateGradient(colors: string[], direction: string = 'to right'): string {
    if (colors.length < 2) return colors[0] || '#000000';
    
    const colorStops = colors.map((color, index) => {
      const position = (index / (colors.length - 1)) * 100;
      return `${color} ${position}%`;
    }).join(', ');
    
    return `linear-gradient(${direction}, ${colorStops})`;
  }
}