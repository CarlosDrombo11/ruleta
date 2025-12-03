// src/utils/RemoteStorage.ts - Sistema de control remoto con Firebase Realtime Database

import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { Participant, Prize, RemoteControl, RemoteControlMap } from '../types';

const REMOTE_CONTROL_PATH = 'roulette/remote_control';
const REMOTE_CONTROL_MAP_PATH = 'roulette/remote_control_map'; // Nueva ruta para múltiples reservaciones
const PARTICIPANTS_PATH = 'roulette/participants';
const PRIZES_PATH = 'roulette/prizes';

// Fallback a localStorage
const REMOTE_CONTROL_KEY = 'roulette_remote_control';
const REMOTE_CONTROL_MAP_KEY = 'roulette_remote_control_map'; // Nueva key para múltiples reservaciones
const PARTICIPANTS_KEY = 'roulette_participants';
const PRIZES_KEY = 'roulette_prizes';

export class RemoteStorage {
  // ==================== CONTROL REMOTO ====================

  static getRemoteControl(): RemoteControl | null {
    try {
      const data = localStorage.getItem(REMOTE_CONTROL_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async setRemoteControl(winnerId: string | null, prizeId: string | null): Promise<void> {
    const control: RemoteControl = {
      forcedWinnerId: winnerId,
      forcedPrizeId: prizeId,
      active: !!(winnerId && prizeId),
      timestamp: Date.now()
    };

    // Guardar en localStorage para acceso inmediato
    localStorage.setItem(REMOTE_CONTROL_KEY, JSON.stringify(control));

    // Guardar en Firebase para sincronización multi-dispositivo
    try {
      await set(ref(database, REMOTE_CONTROL_PATH), control);
    } catch (error) {
      console.error('Error setting remote control in Firebase:', error);
    }
  }

  static async clearRemoteControl(): Promise<void> {
    // Limpiar localStorage inmediatamente
    localStorage.removeItem(REMOTE_CONTROL_KEY);

    // Limpiar Firebase
    try {
      await remove(ref(database, REMOTE_CONTROL_PATH));
    } catch (error) {
      console.error('Error clearing remote control in Firebase:', error);
    }
  }

  // ==================== CONTROL REMOTO - MÚLTIPLES RESERVACIONES ====================

  /**
   * Obtener el mapa completo de reservaciones (prizeId -> winnerId)
   */
  static getRemoteControlMap(): RemoteControlMap {
    try {
      const data = localStorage.getItem(REMOTE_CONTROL_MAP_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Agregar una reservación al mapa (prizeId -> winnerId)
   */
  static async addRemoteControl(prizeId: string, winnerId: string): Promise<void> {
    const map = this.getRemoteControlMap();
    map[prizeId] = winnerId;

    // Guardar en localStorage
    localStorage.setItem(REMOTE_CONTROL_MAP_KEY, JSON.stringify(map));

    // Guardar en Firebase
    try {
      await set(ref(database, REMOTE_CONTROL_MAP_PATH), map);
      console.log('[REMOTE] Reservación agregada:', { prizeId, winnerId });
    } catch (error) {
      console.error('Error adding remote control to Firebase:', error);
    }
  }

  /**
   * Eliminar una reservación específica del mapa
   */
  static async removeRemoteControl(prizeId: string): Promise<void> {
    const map = this.getRemoteControlMap();
    delete map[prizeId];

    // Guardar en localStorage
    localStorage.setItem(REMOTE_CONTROL_MAP_KEY, JSON.stringify(map));

    // Guardar en Firebase
    try {
      await set(ref(database, REMOTE_CONTROL_MAP_PATH), map);
      console.log('[REMOTE] Reservación eliminada:', prizeId);
    } catch (error) {
      console.error('Error removing remote control from Firebase:', error);
    }
  }

  /**
   * Limpiar todas las reservaciones
   */
  static async clearRemoteControlMap(): Promise<void> {
    // Limpiar localStorage
    localStorage.removeItem(REMOTE_CONTROL_MAP_KEY);

    // Limpiar Firebase
    try {
      await remove(ref(database, REMOTE_CONTROL_MAP_PATH));
      console.log('[REMOTE] Todas las reservaciones limpiadas');
    } catch (error) {
      console.error('Error clearing remote control map from Firebase:', error);
    }
  }

  /**
   * Verificar si un premio tiene reservación
   */
  static hasReservation(prizeId: string): boolean {
    const map = this.getRemoteControlMap();
    return prizeId in map;
  }

  /**
   * Obtener el ganador reservado para un premio específico
   */
  static getReservedWinner(prizeId: string): string | null {
    const map = this.getRemoteControlMap();
    return map[prizeId] || null;
  }

  /**
   * Escucha cambios en tiempo real del mapa de control remoto desde Firebase
   */
  static onRemoteControlMapChange(callback: (map: RemoteControlMap) => void): () => void {
    const mapRef = ref(database, REMOTE_CONTROL_MAP_PATH);
    const unsubscribe = onValue(mapRef, (snapshot) => {
      const map = snapshot.exists() ? snapshot.val() : {};
      // Sincronizar con localStorage
      localStorage.setItem(REMOTE_CONTROL_MAP_KEY, JSON.stringify(map));
      callback(map);
    }, (error) => {
      console.error('Error listening to remote control map changes:', error);
    });
    return unsubscribe;
  }

  // ==================== PARTICIPANTES ====================

  static async saveParticipants(participants: Participant[]): Promise<void> {
    // Guardar en localStorage para acceso inmediato
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));

    // Guardar en Firebase
    try {
      await set(ref(database, PARTICIPANTS_PATH), participants);
    } catch (error) {
      console.error('Error saving participants to Firebase:', error);
    }
  }

  static loadParticipants(): Participant[] {
    try {
      const data = localStorage.getItem(PARTICIPANTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async toggleParticipantFrozen(participantId: string): Promise<void> {
    const participants = this.loadParticipants();
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      participant.frozen = !participant.frozen;
      await this.saveParticipants(participants);
    }
  }

  static getFrozenParticipants(): Participant[] {
    return this.loadParticipants().filter(p => p.frozen);
  }

  static getAvailableParticipants(): Participant[] {
    return this.loadParticipants().filter(p => !p.eliminated && !p.frozen);
  }

  // ==================== PREMIOS ====================

  static async savePrizes(prizes: Prize[]): Promise<void> {
    // Guardar en localStorage para acceso inmediato
    localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));

    // Guardar en Firebase
    try {
      await set(ref(database, PRIZES_PATH), prizes);
    } catch (error) {
      console.error('Error saving prizes to Firebase:', error);
    }
  }

  static loadPrizes(): Prize[] {
    try {
      const data = localStorage.getItem(PRIZES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async togglePrizeFrozen(prizeId: string): Promise<void> {
    const prizes = this.loadPrizes();
    const prize = prizes.find(p => p.id === prizeId);
    if (prize) {
      prize.frozen = !prize.frozen;
      await this.savePrizes(prizes);
    }
  }

  static getFrozenPrizes(): Prize[] {
    return this.loadPrizes().filter(p => p.frozen);
  }

  static getAvailablePrizes(): Prize[] {
    return this.loadPrizes().filter(p => !p.frozen);
  }

  // ==================== SINCRONIZACIÓN EN TIEMPO REAL ====================

  /**
   * Escucha cambios en tiempo real del control remoto desde Firebase
   */
  static onRemoteControlChange(callback: (control: RemoteControl | null) => void): () => void {
    const controlRef = ref(database, REMOTE_CONTROL_PATH);
    const unsubscribe = onValue(controlRef, (snapshot) => {
      const control = snapshot.exists() ? snapshot.val() : null;
      // Sincronizar con localStorage
      if (control) {
        localStorage.setItem(REMOTE_CONTROL_KEY, JSON.stringify(control));
      } else {
        localStorage.removeItem(REMOTE_CONTROL_KEY);
      }
      callback(control);
    }, (error) => {
      console.error('Error listening to remote control changes:', error);
    });
    return unsubscribe;
  }

  /**
   * Escucha cambios en tiempo real de participantes desde Firebase
   */
  static onParticipantsChange(callback: (participants: Participant[]) => void): () => void {
    const participantsRef = ref(database, PARTICIPANTS_PATH);
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const participants = snapshot.exists() ? snapshot.val() : [];
      // Sincronizar con localStorage
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
      callback(participants);
    }, (error) => {
      console.error('Error listening to participants changes:', error);
    });
    return unsubscribe;
  }

  /**
   * Escucha cambios en tiempo real de premios desde Firebase
   */
  static onPrizesChange(callback: (prizes: Prize[]) => void): () => void {
    const prizesRef = ref(database, PRIZES_PATH);
    const unsubscribe = onValue(prizesRef, (snapshot) => {
      const prizes = snapshot.exists() ? snapshot.val() : [];
      // Sincronizar con localStorage
      localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
      callback(prizes);
    }, (error) => {
      console.error('Error listening to prizes changes:', error);
    });
    return unsubscribe;
  }

  /**
   * Escucha cambios en el localStorage (desde otros tabs/ventanas)
   * DEPRECATED: Usar onRemoteControlChange, onParticipantsChange, onPrizesChange
   */
  static onStorageChange(callback: (key: string) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === REMOTE_CONTROL_KEY || e.key === PARTICIPANTS_KEY || e.key === PRIZES_KEY) {
        callback(e.key);
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}
