// src/utils/Storage.ts

import { AppConfig, ExcelData, Prize } from '../types';

export class Storage {
  private static readonly CONFIG_KEY = 'roulette-config';
  private static readonly DATA_KEY = 'roulette-data';
  private static readonly HISTORY_KEY = 'roulette-history';
  private static readonly VERSION_KEY = 'roulette-version';
  private static readonly CURRENT_VERSION = '1.0.0';

  // Configuración por defecto
  private static readonly DEFAULT_CONFIG: AppConfig = {
    title: {
      text: 'Gran Sorteo de Premios 2025',
      fontSize: 48,
      color: '#2C3E50',
      fontFamily: 'Arial, sans-serif',
      effects: ['shadow']
    },
    background: {
      type: 'color',
      value: '#ECF0F1',
      opacity: 1,
      blur: 0,
      adjustment: 'cover'
    },
    audio: {
      type: 'classic',
      volume: 0.5,
      celebrationVolume: 0.7
    },
    timing: {
      spinDuration: 5,
      autoInterval: 10,
      celebrationDuration: 3
    },
    animations: {
      type: 'none',
      intensity: 5,
      speed: 1
    },
    mode: 'manual',
    highlightColor: '#FF6B6B'
  };

  public static saveConfig(config: AppConfig): boolean {
    try {
      const serialized = JSON.stringify(config);
      localStorage.setItem(this.CONFIG_KEY, serialized);
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      
      console.log('Configuración guardada:', config);
      return true;
    } catch (error) {
      console.error('Error guardando configuración:', error);
      return false;
    }
  }

  public static loadConfig(): AppConfig {
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY);
      const version = localStorage.getItem(this.VERSION_KEY);
      
      if (!saved) {
        console.log('No hay configuración guardada, usando configuración por defecto');
        return { ...this.DEFAULT_CONFIG };
      }

      // Verificar compatibilidad de versión
      if (version !== this.CURRENT_VERSION) {
        console.warn('Versión de configuración incompatible, usando configuración por defecto');
        this.clearConfig();
        return { ...this.DEFAULT_CONFIG };
      }

      const parsed = JSON.parse(saved) as AppConfig;
      
      // Merge con configuración por defecto para añadir nuevas propiedades
      const merged = this.mergeConfig(this.DEFAULT_CONFIG, parsed);
      
      console.log('Configuración cargada:', merged);
      return merged;
      
    } catch (error) {
      console.error('Error cargando configuración:', error);
      return { ...this.DEFAULT_CONFIG };
    }
  }

  private static mergeConfig(defaultConfig: AppConfig, savedConfig: any): AppConfig {
    const merged = { ...defaultConfig };
    
    // Merge recursivo de propiedades
    Object.keys(savedConfig).forEach(key => {
      if (typeof defaultConfig[key as keyof AppConfig] === 'object' && 
          defaultConfig[key as keyof AppConfig] !== null &&
          !Array.isArray(defaultConfig[key as keyof AppConfig])) {
        merged[key as keyof AppConfig] = {
          ...defaultConfig[key as keyof AppConfig],
          ...savedConfig[key]
        } as any;
      } else {
        merged[key as keyof AppConfig] = savedConfig[key];
      }
    });
    
    return merged;
  }

  public static saveData(data: ExcelData): boolean {
    try {
      const serialized = JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(this.DATA_KEY, serialized);
      
      console.log('Datos guardados:', {
        premios: data.premios.length,
        participantes: data.participantes.length
      });
      return true;
    } catch (error) {
      console.error('Error guardando datos:', error);
      return false;
    }
  }

  public static loadData(): ExcelData | null {
    try {
      const saved = localStorage.getItem(this.DATA_KEY);
      if (!saved) {
        console.log('No hay datos guardados');
        return null;
      }

      const parsed = JSON.parse(saved);
      console.log('Datos cargados:', {
        premios: parsed.premios?.length || 0,
        participantes: parsed.participantes?.length || 0,
        timestamp: parsed.timestamp
      });

      return {
        premios: parsed.premios || [],
        participantes: parsed.participantes || []
      };
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      return null;
    }
  }

  public static saveToHistory(prize: Prize, winner: string): boolean {
    try {
      const history = this.loadHistory();
      const entry = {
        id: Date.now().toString(),
        prize: prize.name,
        winner: winner,
        timestamp: new Date().toISOString(),
        prizeImage: prize.imageIndex
      };

      history.unshift(entry);
      
      // Mantener solo los últimos 100 registros
      const trimmedHistory = history.slice(0, 100);
      
      const serialized = JSON.stringify(trimmedHistory);
      localStorage.setItem(this.HISTORY_KEY, serialized);
      
      console.log('Entrada agregada al historial:', entry);
      return true;
      
    } catch (error) {
      console.error('Error guardando en historial:', error);
      return false;
    }
  }

  public static loadHistory(): Array<{
    id: string;
    prize: string;
    winner: string;
    timestamp: string;
    prizeImage: number;
  }> {
    try {
      const saved = localStorage.getItem(this.HISTORY_KEY);
      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);
      console.log(`Historial cargado: ${parsed.length} entradas`);
      
      return parsed;
      
    } catch (error) {
      console.error('Error cargando historial:', error);
      return [];
    }
  }

  public static clearHistory(): boolean {
    try {
      localStorage.removeItem(this.HISTORY_KEY);
      console.log('Historial limpiado');
      return true;
    } catch (error) {
      console.error('Error limpiando historial:', error);
      return false;
    }
  }

  public static clearConfig(): boolean {
    try {
      localStorage.removeItem(this.CONFIG_KEY);
      localStorage.removeItem(this.VERSION_KEY);
      console.log('Configuración limpiada');
      return true;
    } catch (error) {
      console.error('Error limpiando configuración:', error);
      return false;
    }
  }

  public static clearData(): boolean {
    try {
      localStorage.removeItem(this.DATA_KEY);
      console.log('Datos limpiados');
      return true;
    } catch (error) {
      console.error('Error limpiando datos:', error);
      return false;
    }
  }

  public static clearAll(): boolean {
    try {
      localStorage.removeItem(this.CONFIG_KEY);
      localStorage.removeItem(this.DATA_KEY);
      localStorage.removeItem(this.HISTORY_KEY);
      localStorage.removeItem(this.VERSION_KEY);
      console.log('Todos los datos limpiados');
      return true;
    } catch (error) {
      console.error('Error limpiando todos los datos:', error);
      return false;
    }
  }

  public static exportData(): string {
    const config = this.loadConfig();
    const data = this.loadData();
    const history = this.loadHistory();
    
    const exportData = {
      version: this.CURRENT_VERSION,
      exportDate: new Date().toISOString(),
      config,
      data,
      history
    };

    return JSON.stringify(exportData, null, 2);
  }

  public static importData(jsonString: string): boolean {
    try {
      const importData = JSON.parse(jsonString);
      
      // Validar estructura
      if (!importData.version || !importData.config) {
        throw new Error('Formato de datos inválido');
      }

      // Verificar compatibilidad de versión
      if (importData.version !== this.CURRENT_VERSION) {
        console.warn('Versión de datos diferente, intentando importar...');
      }

      // Importar configuración
      if (importData.config) {
        this.saveConfig(importData.config);
      }

      // Importar datos
      if (importData.data) {
        this.saveData(importData.data);
      }

      // Importar historial
      if (importData.history && Array.isArray(importData.history)) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(importData.history));
      }

      console.log('Datos importados exitosamente');
      return true;
      
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }

  public static getStorageInfo(): {
    configSize: number;
    dataSize: number;
    historySize: number;
    totalSize: number;
    lastModified: string | null;
  } {
    const getItemSize = (key: string): number => {
      const item = localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    };

    const configSize = getItemSize(this.CONFIG_KEY);
    const dataSize = getItemSize(this.DATA_KEY);
    const historySize = getItemSize(this.HISTORY_KEY);
    
    // Obtener fecha de última modificación (aproximada)
    const data = this.loadData();
    const lastModified = data ? new Date().toISOString() : null;

    return {
      configSize,
      dataSize,
      historySize,
      totalSize: configSize + dataSize + historySize,
      lastModified
    };
  }

  public static isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public static getStorageUsage(): number {
    if (!this.isStorageAvailable()) return 0;

    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    
    return total;
  }

  public static getStorageQuota(): { used: number; available: number; total: number } {
    const defaultQuota = 5 * 1024 * 1024; // 5MB por defecto
    
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          console.log('Storage quota:', {
            usage: estimate.usage || 0,
            quota: estimate.quota || defaultQuota
          });
        });
      }
    } catch (error) {
      console.warn('No se puede obtener información de cuota de almacenamiento');
    }

    const used = this.getStorageUsage();
    return {
      used,
      available: Math.max(0, defaultQuota - used),
      total: defaultQuota
    };
  }

  // Utilidades para backup automático
  public static createBackup(): string {
    const backup = {
      version: this.CURRENT_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        config: localStorage.getItem(this.CONFIG_KEY),
        data: localStorage.getItem(this.DATA_KEY),
        history: localStorage.getItem(this.HISTORY_KEY)
      }
    };
    
    return JSON.stringify(backup);
  }

  public static restoreBackup(backupString: string): boolean {
    try {
      const backup = JSON.parse(backupString);
      
      if (backup.data.config) {
        localStorage.setItem(this.CONFIG_KEY, backup.data.config);
      }
      
      if (backup.data.data) {
        localStorage.setItem(this.DATA_KEY, backup.data.data);
      }
      
      if (backup.data.history) {
        localStorage.setItem(this.HISTORY_KEY, backup.data.history);
      }
      
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      
      console.log('Backup restaurado exitosamente');
      return true;
      
    } catch (error) {
      console.error('Error restaurando backup:', error);
      return false;
    }
  }

  public static getDefaultConfig(): AppConfig {
    return { ...this.DEFAULT_CONFIG };
  }
}