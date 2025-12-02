// src/utils/RemoteStorage.ts - Sistema de control remoto para producción

import { Participant, Prize, RemoteControl } from '../types';

const REMOTE_CONTROL_KEY = 'roulette_remote_control';
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

  static setRemoteControl(winnerId: string | null, prizeId: string | null): void {
    const control: RemoteControl = {
      forcedWinnerId: winnerId,
      forcedPrizeId: prizeId,
      active: !!(winnerId && prizeId),
      timestamp: Date.now()
    };
    localStorage.setItem(REMOTE_CONTROL_KEY, JSON.stringify(control));
  }

  static clearRemoteControl(): void {
    localStorage.removeItem(REMOTE_CONTROL_KEY);
  }

  // ==================== PARTICIPANTES ====================

  static saveParticipants(participants: Participant[]): void {
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  }

  static loadParticipants(): Participant[] {
    try {
      const data = localStorage.getItem(PARTICIPANTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static toggleParticipantFrozen(participantId: string): void {
    const participants = this.loadParticipants();
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
      participant.frozen = !participant.frozen;
      this.saveParticipants(participants);
    }
  }

  static getFrozenParticipants(): Participant[] {
    return this.loadParticipants().filter(p => p.frozen);
  }

  static getAvailableParticipants(): Participant[] {
    return this.loadParticipants().filter(p => !p.eliminated && !p.frozen);
  }

  // ==================== PREMIOS ====================

  static savePrizes(prizes: Prize[]): void {
    localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
  }

  static loadPrizes(): Prize[] {
    try {
      const data = localStorage.getItem(PRIZES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static togglePrizeFrozen(prizeId: string): void {
    const prizes = this.loadPrizes();
    const prize = prizes.find(p => p.id === prizeId);
    if (prize) {
      prize.frozen = !prize.frozen;
      this.savePrizes(prizes);
    }
  }

  static getFrozenPrizes(): Prize[] {
    return this.loadPrizes().filter(p => p.frozen);
  }

  static getAvailablePrizes(): Prize[] {
    return this.loadPrizes().filter(p => !p.frozen);
  }

  // ==================== SINCRONIZACIÓN ====================

  /**
   * Escucha cambios en el localStorage (desde otros tabs/ventanas)
   */
  static onStorageChange(callback: (key: string) => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === REMOTE_CONTROL_KEY ||
          e.key === PARTICIPANTS_KEY ||
          e.key === PRIZES_KEY) {
        callback(e.key);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}
