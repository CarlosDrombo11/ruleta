// src/components/Roulette.ts - Componente principal de la ruleta (solo modo automático)

import { RouletteStateMachine } from '../core/RouletteStateMachine';
import { CanvasRenderer } from '../core/CanvasRenderer';
import { AudioEngine } from '../core/AudioEngine';
import { TimingEngine } from '../core/TimingEngine';
import { ExcelParser } from '../core/ExcelParser';
import { ParticleSystem } from '../animations/ParticleSystem';
import { ScrollAnimator } from '../animations/ScrollAnimator';
import { Storage } from '../utils/Storage';
import { RemoteStorage } from '../utils/RemoteStorage';
import { MathUtils } from '../utils/MathUtils';
import { EventEmitter } from '../utils/EventEmitter';
import {
  AppConfig,
  ExcelData,
  Participant,
  Prize,
  RouletteState
} from '../types';

declare global {
  interface Window {
    __rouletteKeyHandler?: (e: KeyboardEvent) => void;
  }
}

export class Roulette extends EventEmitter {
  private static keyboardBound = false;

  // Candados anti doble-giro
  private spinningGuard = false;     // protege durante startSpin()
  private spinRequested = false;     // evita pedir 'spinning' 2 veces seguidas

  // Core systems
  private stateMachine!: RouletteStateMachine;
  private canvasRenderer!: CanvasRenderer;
  private audioEngine!: AudioEngine;
  private timingEngine!: TimingEngine;
  private particleSystem!: ParticleSystem;
  private scrollAnimator!: ScrollAnimator;
  private excelParser!: ExcelParser;

  // DOM
  private container: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private participantsSection!: HTMLElement;
  private statusIndicator!: HTMLElement;
  private configPanel!: HTMLElement;

  // Datos
  private participants: Participant[] = [];
  private prizes: Prize[] = [];
  private usedPrizes: Prize[] = [];
  private config: AppConfig;

  // Estado de sorteo
  private currentPrize: Prize | null = null;
  private currentWinner: Participant | null = null;
  private autoTimer: number | null = null;
  private initialized = false;

  // ====== KEY HANDLER (Alt+C, Alt+I, Alt+P; permite escribir espacios) ======
  private keyHandler = (e: KeyboardEvent) => {
    // Alt + C → abrir/cerrar configuración
    if (e.altKey && e.code === 'KeyC') {
      e.preventDefault();
      e.stopPropagation();
      this.toggleConfigPanel();
      return;
    }

    // Alt + I → arrancar modo automático y girar YA
    if (e.altKey && e.code === 'KeyI' && !e.ctrlKey && !e.metaKey && !e.repeat) {
      // si está escribiendo, no interceptar
      const active = document.activeElement as HTMLElement | null;
      const typing =
        !!active && (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable ||
          active.getAttribute('contenteditable') === 'true'
        );
      if (typing) return;

      e.preventDefault();
      e.stopPropagation();
      this.startAutoNow();
      return;
    }

    // Alt + P → pausar/detener modo automático
    if (e.altKey && e.code === 'KeyP' && !e.ctrlKey && !e.metaKey && !e.repeat) {
      const active = document.activeElement as HTMLElement | null;
      const typing =
        !!active && (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable ||
          active.getAttribute('contenteditable') === 'true'
        );
      if (typing) return;

      e.preventDefault();
      e.stopPropagation();
      this.pauseAutoMode();
      return;
    }

    // Space: permitir escribir en campos; fuera de ellos, no hacer nada
    if (e.code === 'Space') {
      const active = document.activeElement as HTMLElement | null;
      const typing =
        !!active && (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable ||
          active.getAttribute('contenteditable') === 'true'
        );
      const targetEl = (e.target as HTMLElement) || null;
      const isInteractiveTarget = !!targetEl?.closest(
        'input, textarea, select, [contenteditable="true"], button, [role="button"], a'
      );
      if (typing || isInteractiveTarget) return;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  /** Pausa el modo automático o manual */
  private pauseAutoMode(): void {
    console.log('[PAUSE] pauseAutoMode');
    const state = this.stateMachine.getCurrentState();

    // Si está en modo automático o manual, pausar
    if (state === 'autoMode' || state === 'manualMode') {
      this.clearAutoTimer();
      this.stateMachine.transition('paused');
      this.showInfoNotification(`${state === 'autoMode' ? 'Modo automático' : 'Modo semi-automático'} pausado - Los datos se mantienen`);
    }
    // Si está pausado, reanudar al modo anterior
    else if (state === 'paused') {
      // Reanudar al modo que corresponda según la configuración
      const targetMode = this.config.operationMode === 'full-auto' ? 'autoMode' : 'manualMode';
      this.stateMachine.transition(targetMode);
      this.showInfoNotification(`${targetMode === 'autoMode' ? 'Modo automático' : 'Modo semi-automático'} reanudado`);
    }
  }

  /** Arranca/re-normaliza autoMode y lanza el primer giro inmediatamente */
  private startAutoNow(): void {
    // Validaciones básicas
    if (this.participants.length === 0 || this.prizes.length === 0) {
      this.showErrorDialog('Carga datos Excel primero (participantes y premios)');
      return;
    }

    const state = this.stateMachine.getCurrentState();
    if (state === 'spinning' || state === 'celebrating' || state === 'finished') {
      return;
    }

    // Cerrar panel y normalizar flags
    this.configPanel.classList.remove('open');
    this.clearAutoTimer();

    this.stateMachine.setDataLoaded(true);
    this.stateMachine.setPrizesAvailable(this.prizes.length > 0);
    this.stateMachine.setMode('auto');

    // Entrar a autoMode si aún no
    if (state !== 'autoMode') {
      this.stateMachine.transition('autoMode');
    }

    // Evitar doble solicitud
    if (this.spinRequested || this.spinningGuard || this.stateMachine.getCurrentState() === 'spinning') {
      return;
    }

    // Giro inmediato
    this.spinRequested = true;
    this.stateMachine.setAutoTimerExpired(true);
    if (this.stateMachine.canTransitionTo('spinning')) {
      this.stateMachine.transition('spinning');
    } else {
      this.spinRequested = false; // liberar si no pudo
    }
  }

  constructor(container: HTMLElement) {
    super();

    console.time('[init] total');
    console.log('[ROULETTE] constructor');

    this.container = container;
    this.config = Storage.loadConfig();
    console.log('Config cargada:', this.config);

    console.time('[init] DOM');
    this.initializeDOM();
    console.timeEnd('[init] DOM');

    console.time('[init] systems');
    this.initializeSystems();
    console.timeEnd('[init] systems');

    console.time('[init] listeners');
    this.setupEventListeners();
    console.timeEnd('[init] listeners');

    console.time('[init] applyConfiguration');
    this.applyConfiguration();
    console.timeEnd('[init] applyConfiguration');

    this.initialized = true;
    console.log('Roulette initialized =', this.initialized);
    console.timeEnd('[init] total');
  }

  private initializeDOM(): void {
    console.log('[DOM] initializeDOM');
    this.container.innerHTML = `
      <div class="app-container">
        <header class="header">
          <h1 class="main-title">${this.config.title.text}</h1>
        </header>

        <main class="main-content">
          <section class="participants-section">
            <div class="participants-header">Participantes</div>
            <div class="participants-scroll-container"></div>
          </section>

          <section class="roulette-section">
            <div class="roulette-container">
              <canvas class="roulette-canvas"></canvas>
            </div>
          </section>
        </main>

        <div class="status-indicator idle">Esperando datos...</div>
        <div class="controls-overlay">
          <button class="control-button" id="loadDataBtn" tabindex="-1">Cargar Excel</button>
          <button class="control-button secondary" id="configBtn" tabindex="-1">Configuración</button>
        </div>
      </div>

      <div class="config-panel" id="configPanel"></div>
    `;

    const canvas = this.container.querySelector('.roulette-canvas') as HTMLCanvasElement;
    const participantsSection = this.container.querySelector('.participants-scroll-container') as HTMLElement;
    const statusIndicator = this.container.querySelector('.status-indicator') as HTMLElement;
    const configPanel = this.container.querySelector('.config-panel') as HTMLElement;

    if (!canvas || !participantsSection || !statusIndicator || !configPanel) {
      throw new Error('Required DOM elements not found');
    }

    this.canvas = canvas;
    this.participantsSection = participantsSection;
    this.statusIndicator = statusIndicator;
    this.configPanel = configPanel;
  }

  private initializeSystems(): void {
    console.log('[SYSTEMS] initializeSystems');

    this.stateMachine = new RouletteStateMachine();
    this.canvasRenderer = new CanvasRenderer(this.canvas);
    this.audioEngine = new AudioEngine();
    this.timingEngine = new TimingEngine();
    this.particleSystem = new ParticleSystem();
    this.scrollAnimator = new ScrollAnimator(this.participantsSection);
    this.excelParser = new ExcelParser();

    this.stateMachine.on('stateChange', ({ from, to }) => {
      console.log('[FSM] stateChange', { from, to });
      this.onStateChange(from, to);
    });

    this.stateMachine.on('startSpin', () => {
      console.log('[FSM] onEnter(spinning) → startSpin()');
      this.startSpin();
    });

    this.stateMachine.on('showCelebration', () => {
      console.log('[FSM] onEnter(celebrating) → showCelebrationModal()');
      this.showCelebrationModal();
    });

    console.log('All systems initialized');
  }

  private setupEventListeners(): void {
    console.log('[LISTENERS] setupEventListeners');

    // Garantizar un único listener global
    if (window.__rouletteKeyHandler) {
      document.removeEventListener('keydown', window.__rouletteKeyHandler);
    }
    window.__rouletteKeyHandler = this.keyHandler;
    document.addEventListener('keydown', window.__rouletteKeyHandler);
    console.log('Event listener de teclado registrado (único, window-guard)');

    const loadDataBtn = this.container.querySelector('#loadDataBtn') as HTMLElement;
    const configBtn = this.container.querySelector('#configBtn') as HTMLElement;

    loadDataBtn?.addEventListener('click', () => {
      console.log('[UI] click Cargar Excel');
      this.showFileLoadDialog();
    });

    configBtn?.addEventListener('click', () => {
      console.log('[UI] click Configuración');
      this.toggleConfigPanel();
    });

    // Drag & drop
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer?.files || []);
      const excelFile = files.find(f => this.excelParser.validateFileType(f));
      if (excelFile) this.loadExcelFile(excelFile);
    });
  }

  private applyConfiguration(): void {
    console.log('[CONFIG] applyConfiguration');

    // Forzar a auto desde configuración
    this.config.mode = 'auto';

    const root = document.documentElement;
    root.style.setProperty('--bg-color', this.config.background.value);
    root.style.setProperty('--text-color', this.config.title.color);
    root.style.setProperty('--highlight-color', this.config.highlightColor);

    const titleElement = this.container.querySelector('.main-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = this.config.title.text;
      titleElement.style.fontSize = `${this.config.title.fontSize}px`;
      titleElement.style.color = this.config.title.color;
      titleElement.style.fontFamily = this.config.title.fontFamily;
      titleElement.className = 'main-title';
      this.config.title.effects.forEach(effect => {
        titleElement.classList.add(`with-${effect}`);
      });
    }

    // Fondo del header (nuevo)
    this.applyTitleBackground();

    this.applyBackground();
    this.audioEngine.setVolume(this.config.audio.volume);
    this.particleSystem.startAnimation(
      this.config.animations.type,
      this.config.animations.intensity,
      this.config.animations.speed
    );
    this.scrollAnimator.setHighlightColor(this.config.highlightColor);
  }

private applyBackground(): void {
  const body = document.body;
  const rouletteArea = this.container.querySelector('.roulette-section') as HTMLElement;
  if (!rouletteArea) return;

  // Limpia cualquier fondo previo en <body>
  body.style.background = 'var(--bg-color, #ECF0F1)';
  body.style.backgroundImage = '';
  body.style.backgroundRepeat = '';
  body.style.backgroundSize = '';
  body.style.backgroundPosition = '';

  // Limpia fondo previo de la sección
  rouletteArea.style.background = '';
  rouletteArea.style.backgroundImage = '';
  rouletteArea.style.backgroundRepeat = '';
  rouletteArea.style.backgroundSize = '';
  rouletteArea.style.backgroundPosition = '';

  switch (this.config.background.type) {
    case 'color':
    case 'gradient': {
      // Solo la zona de la ruleta
      rouletteArea.style.background = this.config.background.value;
      break;
    }

    case 'image': {
      const size = this.config.background.adjustment || 'cover';
      const pos  = this.config.background.position || 'center center';
      const fade = 1 - (this.config.background.opacity ?? 1);

      // Gradiente para opacidad + imagen (sin overlays extra)
      rouletteArea.style.backgroundImage =
        `linear-gradient(rgba(255,255,255,${fade}), rgba(255,255,255,${fade})), url(${this.config.background.value})`;
      rouletteArea.style.backgroundRepeat = 'no-repeat, no-repeat';
      rouletteArea.style.backgroundSize   = `${size}, ${size}`;
      rouletteArea.style.backgroundPosition = `${pos}, ${pos}`;
      break;
    }
  }
}


  // Aplica el color de fondo del título/encabezado
  private applyTitleBackground(): void {
    const header = this.container.querySelector('.header') as HTMLElement | null;
    if (!header) return;

    // Reset de clases y estilos previos
    header.className = 'header';
    header.style.background = '';

    // Aplicar estilo según configuración
    if (this.config.title.headerStyle && this.config.title.headerStyle !== 'default') {
      header.classList.add(this.config.title.headerStyle);
    } else {
      header.style.background = this.config.title.backgroundColor || '#FFFFFF';
    }
  }

  private onStateChange(from: RouletteState, to: RouletteState): void {
    console.log('[FSM] onStateChange handler', { from, to });
    this.updateStatusIndicator(to);

    switch (to) {
      case 'dataLoaded':
        // Transicionar al modo correcto según la configuración
        const targetMode = this.config.operationMode === 'full-auto' ? 'autoMode' : 'manualMode';
        this.stateMachine.transition(targetMode);
        break;
      case 'autoMode':
        this.setupAutoMode();
        break;
      case 'manualMode':
        this.setupAutoMode(); // Usa la misma lógica de timer
        break;
      case 'finished':
        this.showFinishedDialog();
        break;
    }
  }

  private updateStatusIndicator(state: RouletteState): void {
    const messages: Record<string, string> = {
      idle: 'Esperando datos...',
      dataLoaded: 'Datos cargados',
      autoMode: 'Modo automático',
      manualMode: 'Modo semi-automático',
      spinning: 'Girando...',
      celebrating: '¡Ganador!',
      paused: 'Pausado',
      configuring: 'Configurando...',
      finished: 'Sorteo terminado'
    };
    console.log('[UI] statusIndicator ->', state);
    this.statusIndicator.textContent = messages[state] || state;
    this.statusIndicator.className = `status-indicator ${state}`;
  }

  // ====== Carga de datos ======
  public async loadExcelFile(file: File): Promise<void> {
    console.log('[DATA] loadExcelFile', file.name);
    try {
      this.updateStatusIndicator('spinning' as RouletteState);
      const result = await this.excelParser.parseFile(file);
      console.log('Excel parse result:', result);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error parsing file');
      }
      await this.setData(result.data);
    } catch (error) {
      console.error('Error loading Excel file:', error);
      this.showErrorDialog(`Error cargando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  public async setData(data: ExcelData): Promise<void> {
    console.log('[DATA] setData');
    this.participants = data.participantes.map((name) => ({
      id: MathUtils.generateId(),
      name: name.trim(),
      color: MathUtils.generateVibrantColor(),
      eliminated: false,
      frozen: false
    }));

    this.prizes = data.premios.map((name, index) => ({
      id: MathUtils.generateId(),
      name: name.trim(),
      imageIndex: (index % 8) + 1,
      frozen: false
    }));

    // Los premios se mantienen en el orden del Excel (sin barajear)

    this.usedPrizes = [];
    this.scrollAnimator.setParticipants(this.participants);

    Storage.saveData(data);

    // Guardar en RemoteStorage para sincronización
    RemoteStorage.saveParticipants(this.participants);
    RemoteStorage.savePrizes(this.prizes);

    this.stateMachine.setDataLoaded(true);
    this.stateMachine.setPrizesAvailable(this.prizes.length > 0);
    this.stateMachine.transition('dataLoaded');
  }

  // ====== Modo Automático ======
  private setupAutoMode(): void {
    console.log('[MODE] auto');
    this.stateMachine.setMode('auto');

    // Activar super Vegas en modo automático (opcional)
    if (this.config.title.vegasStyle) {
      this.activateSuperVegasMode();
    }

    this.startAutoTimer();
  }

  public toggleVegasMode(): void {
    this.config.title.vegasStyle = !this.config.title.vegasStyle;
    this.applyTitleChanges();
    Storage.saveConfig(this.config);

    console.log('Vegas mode:', this.config.title.vegasStyle ? 'ON' : 'OFF');
  }

  private startAutoTimer(): void {
    console.log('[TIMER] startAutoTimer', this.config.timing.autoInterval, 's');
    this.clearAutoTimer();
    const interval = this.config.timing.autoInterval * 1000;

    this.autoTimer = window.setTimeout(() => {
      console.log('[TIMER] autoTimer expired → solicitar spinning');
      if (this.spinRequested || this.spinningGuard || this.stateMachine.getCurrentState() === 'spinning') {
        console.warn('[TIMER] ignorado: ya hay giro en curso o pedido');
        return;
      }
      this.spinRequested = true;
      this.stateMachine.setAutoTimerExpired(true);
      if (this.stateMachine.canTransitionTo('spinning')) {
        this.stateMachine.transition('spinning');
      } else {
        console.warn('[TIMER] no puede transicionar a spinning ahora');
        this.spinRequested = false;
      }
    }, interval);
  }

  private clearAutoTimer(): void {
    if (this.autoTimer) {
      console.log('[TIMER] clearAutoTimer');
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }

  // ====== Giro principal ======
  private async startSpin(): Promise<void> {
    console.group('[SPIN] startSpin()');
    try {
      // Guard: sin premios o sin participantes activos
      if (this.prizes.length === 0) {
        this.stateMachine.setPrizesAvailable(false);
        this.stateMachine.transition('finished');
        console.groupEnd();
        return;
      }
      const availableParticipants = this.participants.filter(p => !p.eliminated);
      if (availableParticipants.length === 0) {
        console.warn('[SPIN] No hay participantes activos');
        this.stateMachine.transition('finished');
        console.groupEnd();
        return;
      }

      // Si había timer automático, apagar para evitar solapes
      this.clearAutoTimer();

      // Guards anti-reentrada durante la animación
      if (this.spinningGuard || this.canvasRenderer.isCurrentlyAnimating() || this.scrollAnimator.isCurrentlyAnimating()) {
        console.warn('[SPIN] abortado: ya animando o guard activo');
        console.groupEnd();
        return;
      }
      this.spinningGuard = true;

      // MODO SECUENCIAL: Siempre seleccionar el primer premio disponible (orden Excel)
      const availableToSelect = availableParticipants.filter(p => !p.frozen);
      const availablePrizes = this.prizes.filter(p => !p.frozen);

      if (availableToSelect.length === 0 || availablePrizes.length === 0) {
        console.error('[SPIN] No hay participantes/premios disponibles (todos congelados)');
        this.spinningGuard = false;
        return;
      }

      // Seleccionar el siguiente premio en orden
      this.currentPrize = availablePrizes[0]; // Primer premio disponible (orden Excel)

      // Verificar si hay control remoto para ESTE premio específico
      const remoteControl = RemoteStorage.getRemoteControl();
      if (remoteControl && remoteControl.active && remoteControl.forcedPrizeId === this.currentPrize.id) {
        // CONTROL REMOTO: Este premio tiene un ganador reservado
        const forcedWinner = this.participants.find(p => p.id === remoteControl.forcedWinnerId);

        if (forcedWinner && !forcedWinner.eliminated && !forcedWinner.frozen) {
          this.currentWinner = forcedWinner;
          console.log('[SPIN] ⭐ CONTROL REMOTO - Ganador reservado para este premio', {
            prize: this.currentPrize?.name,
            winner: this.currentWinner?.name
          });
          // Limpiar el control remoto después de usarlo
          RemoteStorage.clearRemoteControl();
        } else {
          console.warn('[SPIN] Ganador reservado no válido, seleccionando aleatorio');
          this.currentWinner = MathUtils.randomChoice(availableToSelect);
        }
      } else {
        // Selección normal: ganador aleatorio
        this.currentWinner = MathUtils.randomChoice(availableToSelect);
        console.log('[SPIN] Selección secuencial', {
          prize: this.currentPrize?.name,
          winner: this.currentWinner?.name
        });
      }

      // Mostrar premio en el centro
      this.canvasRenderer.setPrize(this.currentPrize.name, this.currentPrize.imageIndex);

      // Parámetros
      const duration = this.config.timing.spinDuration;
      const winnerIndex = this.participants.findIndex(p => p.id === this.currentWinner!.id);
      if (winnerIndex < 0) throw new Error('Ganador no encontrado en la lista de participantes');

      const spins = 6;
      const current = this.canvasRenderer.getCurrentRotation();

      // Offset COMPLETAMENTE ALEATORIO - cada giro termina en un lugar diferente
      // No depende del índice del ganador, es 100% aleatorio
      const randomOffset = Math.random() * 2 * Math.PI; // Entre 0 y 360 grados (una vuelta completa)

      // Calcular el target: desde la posición actual + vueltas completas + offset aleatorio
      const target = current + spins * Math.PI * 2 + randomOffset;

      console.log('[SPIN] target', { current, winnerIndex, randomOffset, spins, target, duration });

      // Lanzar en paralelo
      const audioPromise = this.audioEngine.createSpinSound(this.config.audio.type, duration);
      const scrollPromise = this.scrollAnimator.syncWithRoulette(duration, this.currentWinner!);

      this.canvasRenderer.startSpin(target, duration);

      const wheelPromise = new Promise<void>(res => setTimeout(res, duration * 1000));

      // ✅ Solo una espera (antes teníamos Promise.all duplicado)
      await Promise.all([audioPromise, scrollPromise, wheelPromise]);
      console.log('🎊 TODAS las promesas completadas - continuando con celebración');

      // Celebración
      this.audioEngine.playCelebrationSound();

      // Actualizar datos: remover el premio sorteado de la lista
      this.usedPrizes.push(this.currentPrize);
      this.prizes = this.prizes.filter(p => p.id !== this.currentPrize!.id);

      Storage.saveToHistory(this.currentPrize, this.currentWinner.name);

      // Avanzar estado
      this.stateMachine.setSpinCompleted(true);
      this.stateMachine.transition('celebrating');

    } catch (error) {
      console.error('[SPIN] Error durante el giro:', error);
      this.showErrorDialog('Error durante el sorteo');
    } finally {
      console.log('[SPIN] finally → liberar guards');
      this.spinningGuard = false;
      this.spinRequested = false; // ← muy importante
      console.groupEnd();
    }
  }

  private showCelebrationModal(): void {
    if (!this.currentPrize || !this.currentWinner) return;

    // Efecto Vegas para el ganador (si está activo)
    this.activateWinnerVegasEffect();

    // Esperar 2 segundos antes de mostrar el modal
    setTimeout(() => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay celebration-modal';

      // Modo automático total: mostrar ganador sin pregunta
      if (this.config.operationMode === 'full-auto') {
        modal.innerHTML = `
          <div class="modal">
            <div class="celebration-content">
              <div class="celebration-prize">🎉 ${this.currentPrize.name} 🎉</div>
              <img class="celebration-image" src="/images/premio-${this.currentPrize.imageIndex}.jpg" alt="${this.currentPrize.name}">
              <div class="celebration-winner">Ganador: ${this.currentWinner.name}</div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        // Auto-cerrar y continuar después del tiempo de celebración
        setTimeout(() => {
          modal.remove();
          this.completeCelebration();
        }, this.config.timing.celebrationDuration * 1000);
        return;
      }

      // Modo semi-automático: mostrar modal con opciones
      modal.innerHTML = `
        <div class="modal">
          <div class="celebration-content">
            <div class="celebration-prize">🎉 ${this.currentPrize.name} 🎉</div>
            <img class="celebration-image" src="/images/premio-${this.currentPrize.imageIndex}.jpg" alt="${this.currentPrize.name}">
            <div class="celebration-winner">Ganador: ${this.currentWinner.name}</div>
            <div style="margin-top: 30px;">
              <p style="font-size: 18px; margin-bottom: 15px; color: #2C3E50;">¿El ganador está presente?</p>
              <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="control-button present-btn" style="background: #27ae60; flex: 1;">
                  ✓ Presente
                </button>
                <button class="control-button absent-btn" style="background: #e74c3c; flex: 1;">
                  ✗ Ausente
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Botón "Presente" - continúa normalmente
      const presentBtn = modal.querySelector('.present-btn');
      presentBtn?.addEventListener('click', () => {
        modal.remove();
        this.completeCelebration();
      });

      // Botón "Ausente" - elimina ganador y vuelve a sortear el premio
      const absentBtn = modal.querySelector('.absent-btn');
      absentBtn?.addEventListener('click', () => {
        modal.remove();
        this.handleAbsentWinner();
      });
    }, 2000); // 2 segundos de delay antes de mostrar el modal
  }

private completeCelebration(): void {
  console.log('[FSM] completeCelebration');

  // Quitar ganador de la lista para próximas rondas
  if (this.currentWinner) {
    const id = this.currentWinner.id;
    this.participants = this.participants.filter(p => p.id !== id);
    this.scrollAnimator.removeParticipantById(id);
  }

  if (this.prizes.length === 0 || this.participants.length === 0) {
    this.stateMachine.setPrizesAvailable(false);
    this.stateMachine.transition('finished');
  } else {
    // Regresar al modo correcto según la configuración
    const targetMode = this.config.operationMode === 'full-auto' ? 'autoMode' : 'manualMode';
    this.stateMachine.transition(targetMode);
  }
}

private handleAbsentWinner(): void {
  console.log('[FSM] handleAbsentWinner - Ganador ausente, re-sorteando premio');

  // Registrar en el historial de ausentes ANTES de eliminar
  if (this.currentPrize && this.currentWinner) {
    Storage.saveAbsentWinner(this.currentPrize, this.currentWinner.name);
  }

  // Eliminar al ganador ausente de la lista de participantes
  if (this.currentWinner) {
    const id = this.currentWinner.id;
    this.participants = this.participants.filter(p => p.id !== id);
    this.scrollAnimator.removeParticipantById(id);
    console.log(`Participante ${this.currentWinner.name} eliminado por ausencia`);
  }

  // Devolver el premio al inicio de la lista para que sea el siguiente en orden secuencial
  if (this.currentPrize) {
    this.prizes.unshift(this.currentPrize); // Agregar al inicio para que sea el siguiente
    console.log(`Premio "${this.currentPrize.name}" devuelto como siguiente en la secuencia`);
  }

  // Limpiar ganador y premio actuales
  this.currentWinner = null;
  this.currentPrize = null;

  // Verificar si aún hay participantes
  if (this.participants.length === 0) {
    this.stateMachine.setPrizesAvailable(false);
    this.stateMachine.transition('finished');
    this.showErrorDialog('No hay más participantes disponibles');
  } else {
    // Mostrar notificación y volver al modo correcto para re-sortear
    this.showInfoNotification('El premio será sorteado nuevamente');
    const targetMode = this.config.operationMode === 'full-auto' ? 'autoMode' : 'manualMode';
    this.stateMachine.transition(targetMode);
  }
}

private showInfoNotification(message: string): void {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #3498db;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 300px;
    font-size: 16px;
    line-height: 1.4;
    animation: slideIn 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 24px;">ℹ️</span>
      <div>${message}</div>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remover después de 3 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}


  private showFinishedDialog(): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>🎊 Sorteo Completado 🎊</h2>
        <p>Todos los premios han sido entregados</p>
        <div style="margin-top: 20px;">
          <button class="control-button" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  private showErrorDialog(message: string): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Error</h2>
        <p>${message}</p>
        <div style="margin-top: 20px;">
          <button class="control-button" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  private showFileLoadDialog(): void {
    console.log('[UI] showFileLoadDialog');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('Archivo seleccionado:', file.name);
        this.loadExcelFile(file);
      }
    };
    input.click();
  }

  private toggleConfigPanel(): void {
    console.log('[UI] toggleConfigPanel');
    const isOpen = this.configPanel.classList.contains('open');
    const currentState = this.stateMachine.getCurrentState();

    if (isOpen) {
      this.configPanel.classList.remove('open');
      if (currentState === 'configuring') {
        if (this.participants.length > 0 && this.prizes.length > 0) {
          this.stateMachine.setDataLoaded(true);
          this.stateMachine.setPrizesAvailable(true);
          this.stateMachine.setMode('auto');
          this.stateMachine.transition('autoMode');
        } else {
          this.stateMachine.transition('idle');
        }
      }
    } else {
      this.configPanel.classList.add('open');
      if (currentState !== 'configuring') {
        this.stateMachine.transition('configuring');
      }
      this.generateConfigPanelContent();
    }
  }

  public resetStateMachine(): void {
    console.log('[FSM] resetStateMachine()');
    this.configPanel.classList.remove('open');
    this.stateMachine.reset();

    if (this.participants.length > 0 && this.prizes.length > 0) {
      this.stateMachine.setDataLoaded(true);
      this.stateMachine.setPrizesAvailable(true);
      this.stateMachine.setMode('auto');
      this.stateMachine.transition('dataLoaded');
      setTimeout(() => this.stateMachine.transition('autoMode'), 100);
    }
  }

  // ====== Config Panel ======
  private generateConfigPanelContent(): void {
    this.configPanel.innerHTML = `
      <div class="config-header">
        <h2 class="config-title">⚙️ Configuración</h2>
        <button class="modal-close" onclick="this.closest('.config-panel').classList.remove('open')">✕</button>
      </div>

      <!-- Modo de Operación (PRIORITARIO) -->
      <div class="config-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <h3 class="config-section-title" style="color: white; font-size: 18px; margin-bottom: 15px;">🎯 Modo de Operación (Importante)</h3>
        <div class="config-group">
          <label class="config-label" style="color: white; font-weight: bold; margin-bottom: 10px; display: block;">Selecciona el modo de funcionamiento:</label>
          <select class="config-input" id="operationMode" style="font-size: 16px; padding: 12px;">
            <option value="semi-auto" ${this.config.operationMode === 'semi-auto' ? 'selected' : ''}>
              🟡 Semi-automático (Confirmar ganador presente)
            </option>
            <option value="full-auto" ${this.config.operationMode === 'full-auto' ? 'selected' : ''}>
              🟢 Automático Total (Sin interrupciones)
            </option>
          </select>
          <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 14px; line-height: 1.5;">
            <strong>Semi-automático:</strong> La ruleta se detiene al encontrar ganador y pregunta si está presente.<br>
            <strong>Automático Total:</strong> La ruleta gira continuamente sin detenerse.
          </div>
        </div>
      </div>

      <!-- Carga de Datos -->
      <div class="config-section">
        <h3 class="config-section-title">📁 Carga de Datos</h3>
        <div class="config-group">
          <div class="drag-drop-area" id="excelDropArea">
            <div class="drag-drop-text">Arrastra tu archivo Excel aquí</div>
            <div class="drag-drop-hint">o haz clic para seleccionar (.xlsx, .xls)</div>
          </div>
          <button class="control-button mt-10" id="downloadTemplateBtn">Descargar Plantilla</button>
        </div>
      </div>

      <!-- Personalización Visual -->
      <div class="config-section">
        <h3 class="config-section-title">🎨 Personalización Visual</h3>

          <!-- ===== SECCIÓN DE TÍTULO DESACTIVADA (guardar para futuro) =====
          <div class="config-group">
            <label class="config-label">📝 Título</label>
            <input type="text" class="config-input" id="titleText" value="${this.config.title.text}">
            <label class="config-label">Tamaño de fuente</label>
            <input type="range" class="config-range" id="titleSize" min="24" max="72" value="${this.config.title.fontSize}">
            <span id="titleSizeValue">${this.config.title.fontSize}px</span>
            <label class="config-label">Color del texto</label>
            <input type="color" class="config-input" id="titleColor" value="${this.config.title.color}">
            <label class="config-label">Color de fondo del título</label>
            <input type="color" class="config-input" id="titleBgColor" value="${this.config.title.backgroundColor || '#ffffff'}">
          </div>

          <div class="config-group">
            <label class="config-label">
              <input type="checkbox" class="config-checkbox" id="vegasStyle" ${this.config.title.vegasStyle ? 'checked' : ''}>
              🎰 Marquesina Estilo Las Vegas
            </label>
            <small style="color:#666;display:block;margin-top:5px;">Activa luces parpadeantes y efectos de neón</small>
            <button class="control-button warning" id="testVegasBtn" style="width:100%;margin-top:15px;">✨ Probar Efecto Vegas</button>
          </div>

          <div class="config-group">
            <label class="config-label">🎭 Estilo del Header</label>
            <div class="config-radio-group">
              ${[
                ['default','🔳 Normal (color personalizable)'],
                ['vegas-header','💎 Vegas Elegante (patrón diamantes)'],
                ['vegas-theater','🎭 Teatro (cortina roja)'],
                ['vegas-casino','🌃 Casino Neón (futurista)'],
                ['vegas-deco','✨ Art Deco (años 20)']
              ].map(([val,label]) => `
                <label class="config-radio-item ${this.config.title.headerStyle === (val as any) ? 'selected' : ''}" data-header-style="${val}">
                  <input type="radio" name="headerStyle" value="${val}" class="config-radio" ${this.config.title.headerStyle === (val as any) ? 'checked' : ''}>
                  <span>${label}</span>
                </label>
              `).join('')}
            </div>
            <small style="color:#666;display:block;margin-top:5px;">Selecciona el estilo de fondo para todo el header</small>
          </div>
          ===== FIN SECCIÓN DE TÍTULO DESACTIVADA ===== -->

        <!-- Fondo -->
        <div class="config-group">
          <label class="config-label">🖼️ Fondo</label>
          <div class="config-radio-group">
            <label class="config-radio-item ${this.config.background.type === 'color' ? 'selected' : ''}" data-bg-type="color">
              <input type="radio" name="backgroundType" value="color" class="config-radio" ${this.config.background.type === 'color' ? 'checked' : ''}>
              <span>Color sólido</span>
            </label>
            <label class="config-radio-item ${this.config.background.type === 'gradient' ? 'selected' : ''}" data-bg-type="gradient">
              <input type="radio" name="backgroundType" value="gradient" class="config-radio" ${this.config.background.type === 'gradient' ? 'checked' : ''}>
              <span>Gradiente</span>
            </label>
            <label class="config-radio-item ${this.config.background.type === 'image' ? 'selected' : ''}" data-bg-type="image">
              <input type="radio" name="backgroundType" value="image" class="config-radio" ${this.config.background.type === 'image' ? 'checked' : ''}>
              <span>Imagen personalizada</span>
            </label>
          </div>
          <div id="backgroundControls" class="mt-10"></div>
        </div>

        <!-- Cintillo -->
        <div class="config-group">
          <label class="config-label">🎯 Color del cintillo destacador</label>
          <input type="color" class="config-input" id="highlightColor" value="${this.config.highlightColor}">
        </div>
      </div>

      <!-- Animaciones -->
      <div class="config-section">
        <h3 class="config-section-title">✨ Animaciones</h3>
        <div class="config-group">
          <div class="config-radio-group" id="animationOptions">
            ${[
              ['none', 'Sin animación'],
              ['snow', '❄️ Copos de nieve'],
              ['autumn', '🍂 Hojas de otoño'],
              ['confetti', '🎊 Confeti'],
              ['bubbles', '🫧 Burbujas'],
              ['stars', '⭐ Estrellas'],
              ['petals', '🌸 Pétalos']
            ]
              .map(
                ([val, label]) => `
              <label class="config-radio-item ${this.config.animations.type === (val as any) ? 'selected' : ''}" data-anim-type="${val}">
                <input type="radio" name="animationType" value="${val}" class="config-radio" ${this.config.animations.type === (val as any) ? 'checked' : ''}>
                <span>${label}</span>
              </label>`
              )
              .join('')}
          </div>

          <label class="config-label">Intensidad (1-10)</label>
          <input type="range" class="config-range" id="animationIntensity" min="1" max="10" value="${this.config.animations.intensity}">
          <span id="intensityValue">${this.config.animations.intensity}</span>

          <label class="config-label">Velocidad (1-10)</label>
          <input type="range" class="config-range" id="animationSpeed" min="1" max="10" value="${this.config.animations.speed}">
          <span id="speedValue">${this.config.animations.speed}</span>
        </div>
      </div>

      <!-- Sonidos -->
      <div class="config-section">
        <h3 class="config-section-title">🔊 Sonidos</h3>
        <div class="config-group">
          <div class="config-radio-group">
            <label class="config-radio-item ${this.config.audio.type === 'classic' ? 'selected' : ''}" data-audio-type="classic">
              <input type="radio" name="audioType" value="classic" class="config-radio" ${this.config.audio.type === 'classic' ? 'checked' : ''}>
              <span>Ruleta Clásica (tick-tick-tick)</span>
            </label>
            <label class="config-radio-item ${this.config.audio.type === 'electronic' ? 'selected' : ''}" data-audio-type="electronic">
              <input type="radio" name="audioType" value="electronic" class="config-radio" ${this.config.audio.type === 'electronic' ? 'checked' : ''}>
              <span>Tambor Electrónico (whoosh)</span>
            </label>
          </div>

          <label class="config-label">Volumen del giro (1-10)</label>
          <input type="range" class="config-range" id="audioVolume" min="0.1" max="1" step="0.1" value="${this.config.audio.volume}">
          <span id="volumeValue">${Math.round(this.config.audio.volume * 10)}</span>
        </div>
      </div>

      <!-- Configuraciones de Sorteo -->
      <div class="config-section">
        <h3 class="config-section-title">⚙️ Configuraciones de Sorteo</h3>

        <div class="config-group">
          <label class="config-label">🎮 Modo de Activación</label>
          <div class="config-note">El modo manual está deshabilitado. La ruleta opera en <strong>automático</strong>.</div>
        </div>

        <div class="config-group">
          <label class="config-label">⏱️ Duración del sorteo (3-10 seg)</label>
          <input type="range" class="config-range" id="spinDuration" min="3" max="10" value="${this.config.timing.spinDuration}">
          <span id="durationValue">${this.config.timing.spinDuration}s</span>

          <label class="config-label">Tiempo entre sorteos automáticos (2-60 seg)</label>
          <input type="range" class="config-range" id="autoInterval" min="2" max="60" value="${this.config.timing.autoInterval}">
          <span id="intervalValue">${this.config.timing.autoInterval}s</span>
        </div>
      </div>

      <!-- Controles de Modo Automático -->
      <div class="config-section">
        <h3 class="config-section-title">🎬 Modo Automático</h3>
        <div class="config-group">
          <button class="control-button success" id="startAutoBtn">▶️ Iniciar Automático</button>
          <button class="control-button warning" id="pauseAutoBtn">⏸️ Pausar</button>
          <button class="control-button secondary" id="stopAutoBtn">⏹️ Detener</button>
        </div>
      </div>

      <!-- Historial -->
      <div class="config-section">
        <h3 class="config-section-title">📄 Historial</h3>
        <div class="config-group">
          <button class="control-button" id="viewHistoryBtn">Ver Historial</button>
          <button class="control-button warning" id="clearHistoryBtn">Limpiar Historial</button>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="config-section">
        <div class="config-group">
          <button class="control-button success" id="saveConfigBtn">💾 Guardar Configuración</button>
          <button class="control-button secondary" id="resetConfigBtn">🔄 Resetear</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.setupConfigEventListeners();
      this.updateBackgroundControls();
    }, 50);
  }

  private setupConfigEventListeners(): void {
    console.log('[CONFIG] setupConfigEventListeners');
    if (!this.configPanel) {
      console.error('Config panel not available');
      return;
    }

    const dropArea = this.configPanel.querySelector('#excelDropArea') as HTMLElement;
    dropArea?.addEventListener('click', () => {
      console.log('[CONFIG] click dropArea → showFileLoadDialog');
      this.showFileLoadDialog();
    });

    const downloadBtn = this.configPanel.querySelector('#downloadTemplateBtn') as HTMLElement;
    downloadBtn?.addEventListener('click', () => this.downloadTemplate());

    // Modo de operación
    const operationModeSelect = this.configPanel.querySelector('#operationMode') as HTMLSelectElement;
    operationModeSelect?.addEventListener('change', (e) => {
      this.config.operationMode = (e.target as HTMLSelectElement).value as 'semi-auto' | 'full-auto';
      Storage.saveConfig(this.config);
      console.log('[CONFIG] Modo de operación cambiado a:', this.config.operationMode);
    });

    // Título
    const titleText = this.configPanel.querySelector('#titleText') as HTMLInputElement;
    titleText?.addEventListener('input', (e) => {
      this.config.title.text = (e.target as HTMLInputElement).value;
      this.applyTitleChanges();
    });

    this.configPanel.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;

      if (target.name === 'headerStyle') {
        this.config.title.headerStyle = target.value as any;
        this.applyTitleBackground();

        // Actualizar selección visual
        const radioItems = this.configPanel.querySelectorAll('[data-header-style]');
        radioItems.forEach(item => item.classList.remove('selected'));
        target.closest('[data-header-style]')?.classList.add('selected');
      }
    });

    const titleSize = this.configPanel.querySelector('#titleSize') as HTMLInputElement;
    const titleSizeValue = this.configPanel.querySelector('#titleSizeValue') as HTMLElement;
    titleSize?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.title.fontSize = value;
      if (titleSizeValue) titleSizeValue.textContent = `${value}px`;
      this.applyTitleChanges();
    });

    const vegasStyle = this.configPanel.querySelector('#vegasStyle') as HTMLInputElement;
    vegasStyle?.addEventListener('change', (e) => {
      this.config.title.vegasStyle = (e.target as HTMLInputElement).checked;
      this.applyTitleChanges();
    });

    const testVegasBtn = this.configPanel.querySelector('#testVegasBtn') as HTMLElement;
    testVegasBtn?.addEventListener('click', () => {
      if (this.config.title.vegasStyle) {
        this.activateSuperVegasMode();
        setTimeout(() => {
          this.deactivateSuperVegasMode();
          this.activateWinnerVegasEffect();
        }, 2000);
      } else {
        alert('Activa primero la marquesina Vegas');
      }
    });

    const titleColor = this.configPanel.querySelector('#titleColor') as HTMLInputElement;
    titleColor?.addEventListener('change', (e) => {
      this.config.title.color = (e.target as HTMLInputElement).value;
      this.applyTitleChanges();
    });

    const titleBgColor = this.configPanel.querySelector('#titleBgColor') as HTMLInputElement;
    titleBgColor?.addEventListener('change', (e) => {
      this.config.title.backgroundColor = (e.target as HTMLInputElement).value;
      this.applyTitleBackground();
    });

    // Fondo
    this.configPanel.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;

      if (target.name === 'backgroundType') {
        this.config.background.type = target.value as any;
        this.updateBackgroundControls();
        this.applyConfiguration();

        const radioItems = this.configPanel.querySelectorAll('.config-radio-item');
        radioItems.forEach(item => item.classList.remove('selected'));
        target.closest('.config-radio-item')?.classList.add('selected');
      }
    });

    // Cintillo
    const highlightColor = this.configPanel.querySelector('#highlightColor') as HTMLInputElement;
    highlightColor?.addEventListener('change', (e) => {
      this.config.highlightColor = (e.target as HTMLInputElement).value;
      this.scrollAnimator.setHighlightColor(this.config.highlightColor);
    });

    // Animaciones
    this.configPanel.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;

      if (target.name === 'animationType') {
        this.config.animations.type = target.value as any;
        this.particleSystem.startAnimation(
          this.config.animations.type,
          this.config.animations.intensity,
          this.config.animations.speed
        );

        const radioItems = this.configPanel.querySelectorAll('[data-anim-type]');
        radioItems.forEach(item => item.classList.remove('selected'));
        target.closest('[data-anim-type]')?.classList.add('selected');
      }
    });

    const animationIntensity = this.configPanel.querySelector('#animationIntensity') as HTMLInputElement;
    const intensityValue = this.configPanel.querySelector('#intensityValue') as HTMLElement;
    animationIntensity?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.animations.intensity = value;
      if (intensityValue) intensityValue.textContent = value.toString();
      this.particleSystem.setIntensity(value);
    });

    const animationSpeed = this.configPanel.querySelector('#animationSpeed') as HTMLInputElement;
    const speedValue = this.configPanel.querySelector('#speedValue') as HTMLElement;
    animationSpeed?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.animations.speed = value;
      if (speedValue) speedValue.textContent = value.toString();
      this.particleSystem.setSpeed(value);
    });

    // Audio
    this.configPanel.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;

      if (target.name === 'audioType') {
        this.config.audio.type = target.value as any;

        const radioItems = this.configPanel.querySelectorAll('[data-audio-type]');
        radioItems.forEach(item => item.classList.remove('selected'));
        target.closest('[data-audio-type]')?.classList.add('selected');
      }
    });

    const audioVolume = this.configPanel.querySelector('#audioVolume') as HTMLInputElement;
    const volumeValue = this.configPanel.querySelector('#volumeValue') as HTMLElement;
    audioVolume?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.config.audio.volume = value;
      if (volumeValue) volumeValue.textContent = Math.round(value * 10).toString();
      this.audioEngine.setVolume(value);
    });

    // Timing
    const spinDuration = this.configPanel.querySelector('#spinDuration') as HTMLInputElement;
    const durationValue = this.configPanel.querySelector('#durationValue') as HTMLElement;
    spinDuration?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.timing.spinDuration = value;
      if (durationValue) durationValue.textContent = `${value}s`;
    });

    const autoInterval = this.configPanel.querySelector('#autoInterval') as HTMLInputElement;
    const intervalValue = this.configPanel.querySelector('#intervalValue') as HTMLElement;
    autoInterval?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.timing.autoInterval = value;
      if (intervalValue) intervalValue.textContent = `${value}s`;
    });

    // Auto mode botones
    const startAutoBtn = this.configPanel.querySelector('#startAutoBtn') as HTMLElement;
    startAutoBtn?.addEventListener('click', () => {
      this.config.mode = 'auto';
      this.stateMachine.setMode('auto');
      this.stateMachine.transition('autoMode');
    });

    const pauseAutoBtn = this.configPanel.querySelector('#pauseAutoBtn') as HTMLElement;
    pauseAutoBtn?.addEventListener('click', () => {
      if (this.stateMachine.getCurrentState() === 'autoMode') {
        this.stateMachine.transition('paused');
      } else if (this.stateMachine.getCurrentState() === 'paused') {
        this.stateMachine.transition('autoMode');
      }
    });

    const stopAutoBtn = this.configPanel.querySelector('#stopAutoBtn') as HTMLElement;
    stopAutoBtn?.addEventListener('click', () => {
      this.pauseAutoMode();
    });

    const viewHistoryBtn = this.configPanel.querySelector('#viewHistoryBtn') as HTMLElement;
    viewHistoryBtn?.addEventListener('click', () => this.showHistoryModal());

    const clearHistoryBtn = this.configPanel.querySelector('#clearHistoryBtn') as HTMLElement;
    clearHistoryBtn?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres limpiar todo el historial?')) {
        Storage.clearHistory();
        alert('Historial limpiado');
      }
    });

    const saveConfigBtn = this.configPanel.querySelector('#saveConfigBtn') as HTMLElement;
    saveConfigBtn?.addEventListener('click', () => {
      this.config.mode = 'auto';
      Storage.saveConfig(this.config);
      alert('Configuración guardada');
    });

    const resetConfigBtn = this.configPanel.querySelector('#resetConfigBtn') as HTMLElement;
    resetConfigBtn?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres resetear toda la configuración?')) {
        this.config = Storage.getDefaultConfig();
        this.config.mode = 'auto';
        Storage.saveConfig(this.config);
        this.applyConfiguration();
        this.generateConfigPanelContent();
        alert('Configuración restablecida');
      }
    });

    console.log('✅ Config event listeners configurados correctamente');
  }

  private updateBackgroundControls(): void {
    const controlsDiv = this.configPanel.querySelector('#backgroundControls') as HTMLElement;
    if (!controlsDiv) return;

    switch (this.config.background.type) {
      case 'color': {
        controlsDiv.innerHTML = `
          <label class="config-label">Color de fondo</label>
          <input type="color" class="config-input" id="backgroundColor" value="${this.config.background.value}">
        `;
        const colorInput = controlsDiv.querySelector('#backgroundColor') as HTMLInputElement;
        colorInput?.addEventListener('change', (e) => {
          this.config.background.value = (e.target as HTMLInputElement).value;
          this.applyBackground();
        });
        break;
      }

      case 'gradient': {
        controlsDiv.innerHTML = `
          <label class="config-label">Gradiente personalizado</label>
          <input type="text" class="config-input" id="gradientValue"
                 value="${this.config.background.value}"
                 placeholder="linear-gradient(45deg, #667eea, #764ba2)">
        `;
        const gradientInput = controlsDiv.querySelector('#gradientValue') as HTMLInputElement;
        gradientInput?.addEventListener('change', (e) => {
          this.config.background.value = (e.target as HTMLInputElement).value;
          this.applyBackground();
        });
        break;
      }

      case 'image': {
        const previewHtml = this.config.background.value
          ? `<img src="${this.config.background.value}" alt="Vista previa"
                  style="max-width:100%; max-height:200px; border-radius:6px;">`
          : '';

        controlsDiv.innerHTML = `
          <div class="image-upload-section">
            <label class="config-label">Subir imagen desde tu computadora</label>
            <div class="image-upload-area" id="imageUploadArea">
              <input type="file" id="imageFileInput" accept="image/*" style="display:none;">
              <div class="upload-content">
                <div class="upload-icon">📁</div>
                <div class="upload-text">Haz clic para seleccionar imagen</div>
                <div class="upload-hint">o arrastra una imagen aquí</div>
                <div class="upload-formats">Formatos: JPG, PNG, GIF, WebP</div>
              </div>
            </div>

            <div class="image-preview" id="imagePreview" style="margin-top:15px;">
              ${previewHtml}
            </div>

            <div class="image-controls" style="margin-top:15px;">
              <label class="config-label">Ajuste de imagen</label>
              <select class="config-select" id="imageAdjustment">
                <option value="cover"   ${this.config.background.adjustment === 'cover' ? 'selected' : ''}>Cubrir (recomendado)</option>
                <option value="contain" ${this.config.background.adjustment === 'contain' ? 'selected' : ''}>Contener</option>
                <option value="repeat"  ${this.config.background.adjustment === 'repeat' ? 'selected' : ''}>Repetir</option>
                <option value="center"  ${this.config.background.adjustment === 'center' ? 'selected' : ''}>Centrar</option>
              </select>

              <label class="config-label" style="margin-top:10px">Posición</label>
              <select class="config-select" id="imagePosition">
                ${[
                  'center center','left center','right center',
                  'center top','center bottom',
                  'left top','right top','left bottom','right bottom'
                ].map(p => `<option value="${p}" ${ (this.config.background.position || 'center center') === p ? 'selected' : '' }>${p}</option>`).join('')}
              </select>

              <label class="config-label">Opacidad</label>
              <input type="range" class="config-range" id="imageOpacity" min="0.1" max="1" step="0.1" value="${this.config.background.opacity}">
              <span id="opacityValue">${Math.round(this.config.background.opacity * 100)}%</span>
            </div>

        `;

        const fileInput = controlsDiv.querySelector('#imageFileInput') as HTMLInputElement;
        const uploadArea = controlsDiv.querySelector('#imageUploadArea') as HTMLElement;
        const imagePreview = controlsDiv.querySelector('#imagePreview') as HTMLElement;

        uploadArea?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) this.handleImageFile(file, imagePreview);
        });

        uploadArea?.addEventListener('dragover', (e) => {
          e.preventDefault(); e.stopPropagation();
          uploadArea.classList.add('drag-over');
        });
        uploadArea?.addEventListener('dragleave', (e) => {
          e.preventDefault(); e.stopPropagation();
          uploadArea.classList.remove('drag-over');
        });
        uploadArea?.addEventListener('drop', (e) => {
          e.preventDefault(); e.stopPropagation();
          uploadArea.classList.remove('drag-over');
          const files = Array.from(e.dataTransfer?.files || []);
          const imageFile = files.find(f => f.type.startsWith('image/'));
          if (imageFile) this.handleImageFile(imageFile, imagePreview);
        });

        const imagePosition = controlsDiv.querySelector('#imagePosition') as HTMLSelectElement;
imagePosition?.addEventListener('change', (e) => {
  this.config.background.position = (e.target as HTMLSelectElement).value;
  this.applyBackground();
});


        const imageAdjustment = controlsDiv.querySelector('#imageAdjustment') as HTMLSelectElement;
        imageAdjustment?.addEventListener('change', (e) => {
          this.config.background.adjustment = (e.target as HTMLSelectElement).value as any;
          this.applyBackground();
        });

        const imageOpacity = controlsDiv.querySelector('#imageOpacity') as HTMLInputElement;
        const opacityValue = controlsDiv.querySelector('#opacityValue') as HTMLElement;
        imageOpacity?.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          this.config.background.opacity = value;
          if (opacityValue) opacityValue.textContent = `${Math.round(value * 100)}%`;
          this.applyBackground();
        });
        break;
      }
    }
  }

  private handleImageFile(file: File, previewElement: HTMLElement): void {
    if (!file.type.startsWith('image/')) {
      this.showErrorDialog('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showErrorDialog('La imagen es demasiado grande. Por favor selecciona una imagen menor a 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '';
      this.config.background.value = dataUrl;
      this.applyBackground();
      this.updateImagePreview(dataUrl, previewElement);
      console.log('Imagen cargada exitosamente');
    };
    reader.onerror = () => {
      this.showErrorDialog('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  }

  private updateImagePreview(src: string, previewElement: HTMLElement): void {
    if (src && previewElement) {
      previewElement.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${src}" alt="Vista previa" style="
            max-width: 100%;
            max-height: 200px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            object-fit: cover;
            display: block;
          ">
          <button class="remove-image-btn" id="removeImageBtn" style="
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(231, 76, 60, 0.9);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
          ">✕</button>
        </div>
      `;
      const removeBtn = previewElement.querySelector('#removeImageBtn') as HTMLElement;
      removeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.removeBackgroundImage();
      });
    } else {
      previewElement.innerHTML = '';
    }
  }

  private removeBackgroundImage(): void {
    this.config.background.value = '';
    this.config.background.type = 'color';
    this.config.background.value = '#667eea';
    this.applyBackground();
    this.updateBackgroundControls();

    const colorRadio = this.configPanel.querySelector('input[name="backgroundType"][value="color"]') as HTMLInputElement;
    if (colorRadio) {
      colorRadio.checked = true;
      const radioItems = this.configPanel.querySelectorAll('.config-radio-item');
      radioItems.forEach(item => item.classList.remove('selected'));
      colorRadio.closest('.config-radio-item')?.classList.add('selected');
    }
    console.log('Imagen de fondo removida');
  }

  private applyTitleChanges(): void {
    const titleElement = this.container.querySelector('.main-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = this.config.title.text;
      titleElement.style.fontSize = `${this.config.title.fontSize}px`;
      titleElement.style.color = this.config.title.color;
      titleElement.style.fontFamily = this.config.title.fontFamily;

      // Limpiar clases existentes
      titleElement.className = 'main-title';

      // Aplicar efectos regulares
      this.config.title.effects.forEach(effect => {
        titleElement.classList.add(`with-${effect}`);
      });

      // Estilo Vegas si está activado
      if (this.config.title.vegasStyle) {
        titleElement.classList.add('vegas-marquee');
        this.addVegasSparkles(titleElement);
      } else {
        this.removeVegasSparkles(titleElement);
      }
    }
    this.applyTitleBackground();
  }

  private addVegasSparkles(titleElement: HTMLElement): void {
    this.removeVegasSparkles(titleElement);
    for (let i = 1; i <= 6; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'vegas-sparkle';
      sparkle.setAttribute('data-sparkle', i.toString());
      titleElement.appendChild(sparkle);
    }
  }

  private removeVegasSparkles(titleElement: HTMLElement): void {
    const sparkles = titleElement.querySelectorAll('.vegas-sparkle');
    sparkles.forEach(sparkle => sparkle.remove());
  }

  public activateWinnerVegasEffect(): void {
    const titleElement = this.container.querySelector('.main-title') as HTMLElement;
    if (titleElement && this.config.title.vegasStyle) {
      titleElement.classList.add('winner-celebration');
      setTimeout(() => {
        titleElement.classList.remove('winner-celebration');
      }, 3000);
    }
  }

  public activateSuperVegasMode(): void {
    const titleElement = this.container.querySelector('.main-title') as HTMLElement;
    if (titleElement && this.config.title.vegasStyle) {
      titleElement.classList.add('super-vegas');
    }
  }

  public deactivateSuperVegasMode(): void {
    const titleElement = this.container.querySelector('.main-title') as HTMLElement;
    if (titleElement) {
      titleElement.classList.remove('super-vegas');
    }
  }

  private downloadTemplate(): void {
    try {
      const templateBuffer = this.excelParser.generateTemplate();
      const blob = new Blob([templateBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_sorteo.xlsx';
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating template:', error);
      this.showErrorDialog('Error generando plantilla');
    }
  }

  private showHistoryModal(): void {
    const history = Storage.loadHistory();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        <h2>📄 Historial de Sorteos</h2>
        <div style="max-height: 400px; overflow-y: auto; margin-top: 20px;">
          ${
            history.length === 0
              ? '<p>No hay entradas en el historial</p>'
              : history
                  .map((entry) => `
                    <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <strong>${entry.prize}</strong><br>
                        <span style="color: #666;">Ganador: ${entry.winner}</span>
                      </div>
                      <span style="color: #999; font-size: 12px;">
                        ${new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  `)
                  .join('')
          }
        </div>
        ${
          history.length > 0
            ? `
          <div style="margin-top: 20px; text-align: center;">
            <button class="control-button" id="downloadHistoryBtn">📥 Descargar PDF</button>
          </div>
        `
            : ''
        }
      </div>
    `;

    document.body.appendChild(modal);

    const btn = modal.querySelector('#downloadHistoryBtn') as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener('click', () => this.downloadHistory());
    }
  }

  private downloadHistory(): void {
    try {
      const history = Storage.loadHistory();
      const absent = Storage.loadAbsentWinners();
      const title = 'Historial de Sorteos';

      const rows = history.map(e => `
        <tr>
          <td>${this.escapeHtml(e.prize)}</td>
          <td>${this.escapeHtml(e.winner)}</td>
          <td style="white-space:nowrap">${new Date(e.timestamp).toLocaleString()}</td>
        </tr>
      `).join('');

      const absentRows = absent.map(e => `
        <tr>
          <td>${this.escapeHtml(e.prize)}</td>
          <td>${this.escapeHtml(e.winner)}</td>
          <td style="white-space:nowrap">${new Date(e.timestamp).toLocaleString()}</td>
        </tr>
      `).join('');

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color:#222; }
            h1 { margin: 0 0 16px; }
            h2 { margin: 32px 0 16px; color: #27ae60; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 32px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; }
            th { background:#f5f5f5; text-align: left; }
            tr:nth-child(even){ background:#fafafa; }
            .absent-section { margin-top: 40px; }
            .absent-section h2 { color: #e74c3c; }
            .absent-section table th { background: #ffebee; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${title}</h1>

          <h2>✓ Premios Entregados</h2>
          ${history.length === 0 ? '<p>No hay entradas en el historial</p>' : `
            <table>
              <thead>
                <tr><th>Premio</th><th>Ganador</th><th>Fecha</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `}

          ${absent.length > 0 ? `
            <div class="absent-section">
              <h2>✗ Ganadores Ausentes (Re-sorteados)</h2>
              <p style="color: #666; margin-bottom: 16px;">
                Los siguientes participantes resultaron ganadores pero no estuvieron presentes para reclamar su premio, por lo que fueron re-sorteados.
              </p>
              <table>
                <thead>
                  <tr><th>Premio</th><th>Participante Ausente</th><th>Fecha</th></tr>
                </thead>
                <tbody>${absentRows}</tbody>
              </table>
            </div>
          ` : ''}

          <script>
            setTimeout(function(){ window.print(); }, 150);
          </script>
        </body>
        </html>
      `;

      const w = window.open('', '_blank');
      if (!w) {
        alert('No se pudo abrir la ventana de impresión (¿bloqueador de pop-ups?)');
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
    } catch (err) {
      console.error('Error generando historial:', err);
      this.showErrorDialog(`Error generando historial: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private escapeHtml(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ====== API pública / limpieza ======
  public reset(): void {
    this.stateMachine.reset();
    this.participants = [];
    this.prizes = [];
    this.usedPrizes = [];
    this.currentPrize = null;
    this.currentWinner = null;
    this.clearAutoTimer();
    this.scrollAnimator.resetParticipants();
    this.canvasRenderer.clearPrize();
    Storage.clearData();
  }

  public destroy(): void {
    this.clearAutoTimer();
    this.stateMachine.removeAllListeners();
    this.canvasRenderer.destroy();
    this.audioEngine.destroy();
    this.timingEngine.stopCurrentAnimation();
    this.particleSystem.destroy();
    this.scrollAnimator.destroy();
    if (window.__rouletteKeyHandler) {
      document.removeEventListener('keydown', window.__rouletteKeyHandler);
      window.__rouletteKeyHandler = undefined;
    }
  }

  public getConfig(): AppConfig { return { ...this.config }; }
  public getParticipants(): Participant[] { return [...this.participants]; }
  public getPrizes(): Prize[] { return [...this.prizes]; }
  public getCurrentState(): RouletteState { return this.stateMachine.getCurrentState(); }
  public isInitialized(): boolean { return this.initialized; }
}

export default Roulette;
