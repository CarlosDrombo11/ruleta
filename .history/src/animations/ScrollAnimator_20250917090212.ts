// src/animations/ScrollAnimator.ts

import { animate } from 'popmotion';
import { Participant } from '../types';

export class ScrollAnimator {
  private scrollElement: HTMLElement;
  private participantsContainer: HTMLElement;
  private participants: Participant[] = [];
  private winner: Participant | null = null;
  private isAnimating = false;
  private currentAnimation: any = null;

  // Configuración visual
  private readonly ITEM_HEIGHT = 60;
  private readonly HIGHLIGHT_BAND_HEIGHT = 80;
  private highlightColor = '#FF6B6B';

  constructor(scrollElement: HTMLElement) {
    this.scrollElement = scrollElement;
    this.participantsContainer = this.createParticipantsContainer();
    this.scrollElement.appendChild(this.participantsContainer);
    this.setupHighlightBand();
  }

  private createParticipantsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'participants-list';
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: auto;
    `;
    return container;
  }

  private setupHighlightBand(): void {
    const band = document.createElement('div');
    band.className = 'highlight-band';
    band.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: ${this.HIGHLIGHT_BAND_HEIGHT}px;
      background: ${this.highlightColor};
      transform: translateY(-50%);
      z-index: 10;
      opacity: 0.8;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      pointer-events: none;
    `;
    this.scrollElement.appendChild(band);
  }

  public setParticipants(participants: Participant[]): void {
    this.participants = [...participants];
    this.renderParticipants();
  }

  private renderParticipants(): void {
    // Limpiar contenido anterior
    this.participantsContainer.innerHTML = '';

    // Crear múltiples copias para loop infinito más sutil (5 copias en lugar de 3)
    const duplicatedList = [
      ...this.participants, 
      ...this.participants, 
      ...this.participants, 
      ...this.participants, 
      ...this.participants
    ];
    
    duplicatedList.forEach((participant, index) => {
      const item = this.createParticipantItem(participant, index);
      this.participantsContainer.appendChild(item);
    });

    // Configurar altura total del contenedor
    const totalHeight = duplicatedList.length * this.ITEM_HEIGHT;
    this.participantsContainer.style.height = `${totalHeight}px`;

    // Posicionar inicialmente en el centro para que el loop sea menos notorio
    const centerOffset = totalHeight / 2;
    this.participantsContainer.style.transform = `translateY(-${centerOffset}px)`;
  }

  private createParticipantItem(participant: Participant, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'participant-item';
    item.dataset.participantId = participant.id;
    
    item.style.cssText = `
      height: ${this.ITEM_HEIGHT}px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      background: ${participant.eliminated ? '#7F8C8D' : participant.color};
      color: white;
      font-weight: bold;
      font-size: 16px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      position: relative;
      z-index: 5;
      opacity: ${participant.eliminated ? 0.5 : 1};
      transition: all 0.3s ease;
    `;

    // Añadir contenido
    const nameSpan = document.createElement('span');
    nameSpan.textContent = participant.name;
    item.appendChild(nameSpan);

    // Indicador de eliminado si es necesario
    if (participant.eliminated) {
      const eliminatedBadge = document.createElement('span');
      eliminatedBadge.textContent = '✓';
      eliminatedBadge.style.cssText = `
        margin-left: auto;
        font-size: 20px;
        opacity: 0.8;
      `;
      item.appendChild(eliminatedBadge);
    }

    return item;
  }

  public async syncWithRoulette(duration: number, winner: Participant): Promise<void> {
    if (this.isAnimating) {
      console.warn('ScrollAnimator ya está animando');
      return Promise.reject(new Error('Animación en progreso'));
    }

    this.winner = winner;
    this.isAnimating = true;

    try {
      // Calcular posición objetivo
      const winnerIndex = this.participants.findIndex(p => p.id === winner.id);
      if (winnerIndex === -1) {
        throw new Error('Ganador no encontrado en la lista');
      }

      const targetPosition = this.calculateWinnerPosition(winnerIndex);

      console.log(`Iniciando scroll sincronizado:`, {
        winner: winner.name,
        targetPosition,
        duration
      });

      // Crear animación con Popmotion
      await this.createScrollAnimation(targetPosition, duration);
      
      // Destacar ganador
      this.highlightWinner();

    } catch (error) {
      console.error('Error en animación de scroll:', error);
      throw error;
    } finally {
      this.isAnimating = false;
    }
  }

  private calculateWinnerPosition(winnerIndex: number): number {
    // Calcular posición para centrar al ganador en el cintillo
    const scrollCenter = this.scrollElement.clientHeight / 2;
    const winnerItemTop = winnerIndex * this.ITEM_HEIGHT;
    const winnerItemCenter = winnerItemTop + (this.ITEM_HEIGHT / 2);
    
    // Añadir múltiples vueltas para efecto visual
    const extraScrolls = 3;
    const listHeight = this.participants.length * this.ITEM_HEIGHT;
    const totalExtraDistance = listHeight * extraScrolls;
    
    return totalExtraDistance + winnerItemCenter - scrollCenter;
  }

  // Funciones de easing personalizadas compatibles con Popmotion
  private easeOut = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  private easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  private createScrollAnimation(targetPosition: number, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Fase 1: Velocidad alta (70% del tiempo)
      const phase1Duration = duration * 0.7 * 1000; // Convertir a ms
      const phase1Distance = targetPosition * 0.8;

      // Crear primera animación
      const phase1Promise = new Promise<void>((phase1Resolve, phase1Reject) => {
        this.currentAnimation = animate({
          from: 0,
          to: phase1Distance,
          duration: phase1Duration,
          ease: this.easeOut,
          onUpdate: (value: number) => {
            this.setScrollPosition(value);
          },
          onComplete: () => {
            phase1Resolve();
          }
        });
      });

      // Encadenar las fases
      phase1Promise
        .then(() => {
          // Fase 2: Desaceleración precisa (30% del tiempo)
          const phase2Duration = duration * 0.3 * 1000;

          return new Promise<void>((phase2Resolve) => {
            this.currentAnimation = animate({
              from: phase1Distance,
              to: targetPosition,
              duration: phase2Duration,
              ease: this.easeOutCubic,
              onUpdate: (value: number) => {
                this.setScrollPosition(value);
              },
              onComplete: () => {
                phase2Resolve();
              }
            });
          });
        })
        .then(() => {
          console.log('Scroll animation completada');
          resolve();
        })
        .catch((error) => {
          console.error('Error en animación de scroll:', error);
          reject(error);
        });
    });
  }

  private setScrollPosition(position: number): void {
    // Aplicar posición de scroll con efecto loop
    const listHeight = this.participants.length * this.ITEM_HEIGHT;
    const normalizedPosition = position % listHeight;
    
    this.participantsContainer.style.transform = `translateY(-${normalizedPosition}px)`;
  }

  private highlightWinner(): void {
    if (!this.winner) return;

    // Encontrar elemento del ganador visible
    const winnerElements = this.participantsContainer.querySelectorAll(
      `[data-participant-id="${this.winner.id}"]`
    );

    winnerElements.forEach(element => {
      const el = element as HTMLElement;
      
      // Efecto especial para el ganador
      el.style.cssText += `
        background: linear-gradient(45deg, ${this.winner!.color}, #FFD700) !important;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
        animation: winnerPulse 2s ease-in-out infinite;
        z-index: 15;
        border: 3px solid #FFD700;
      `;
    });

    // Añadir keyframes de animación si no existen
    this.addWinnerAnimation();
  }

  private addWinnerAnimation(): void {
    const styleId = 'winner-pulse-animation';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes winnerPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
    `;
    document.head.appendChild(style);
  }

  public eliminateParticipant(participant: Participant): void {
    const index = this.participants.findIndex(p => p.id === participant.id);
    if (index !== -1) {
      this.participants[index].eliminated = true;
      this.renderParticipants();
      
      console.log(`Participante eliminado: ${participant.name}`);
    }
  }

  public resetParticipants(): void {
    this.participants.forEach(p => p.eliminated = false);
    this.renderParticipants();
    this.setScrollPosition(0);
    console.log('Lista de participantes restablecida');
  }

  public setHighlightColor(color: string): void {
    this.highlightColor = color;
    const band = this.scrollElement.querySelector('.highlight-band') as HTMLElement;
    if (band) {
      band.style.background = color;
    }
  }

  public stopAnimation(): void {
    if (this.currentAnimation) {
      try {
        if (typeof this.currentAnimation.stop === 'function') {
          this.currentAnimation.stop();
        }
      } catch (e) {
        console.warn('Error stopping animation:', e);
      }
      this.currentAnimation = null;
    }
    this.isAnimating = false;
  }

  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  public getParticipants(): Participant[] {
    return [...this.participants];
  }

  public getCurrentWinner(): Participant | null {
    return this.winner;
  }

  public destroy(): void {
    this.stopAnimation();
    
    // Remover elementos del DOM
    const band = this.scrollElement.querySelector('.highlight-band');
    if (band) band.remove();
    
    const style = document.getElementById('winner-pulse-animation');
    if (style) style.remove();
    
    this.participantsContainer.remove();
  }
}