// src/components/Roulette.ts - Componente principal de la ruleta

import { RouletteStateMachine } from '../core/RouletteStateMachine';
import { CanvasRenderer } from '../core/CanvasRenderer';
import { AudioEngine } from '../core/AudioEngine';
import { TimingEngine } from '../core/TimingEngine';
import { ExcelParser } from '../core/ExcelParser';
import { ParticleSystem } from '../animations/ParticleSystem';
import { ScrollAnimator } from '../animations/ScrollAnimator';
import { Storage } from '../utils/Storage';
import { MathUtils } from '../utils/MathUtils';
import { EventEmitter } from '../utils/EventEmitter';
import { 
  AppConfig, 
  ExcelData, 
  Participant, 
  Prize, 
  RouletteState 
} from '../types';

export class Roulette extends EventEmitter {
  // Core systems
  private stateMachine: RouletteStateMachine;
  private canvasRenderer: CanvasRenderer;
  private audioEngine: AudioEngine;
  private timingEngine: TimingEngine;
  private particleSystem: ParticleSystem;
  private scrollAnimator: ScrollAnimator;
  private excelParser: ExcelParser;

  // DOM elements
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private participantsSection: HTMLElement;
  private statusIndicator: HTMLElement;
  private configPanel: HTMLElement;
  
  // Data
  private participants: Participant[] = [];
  private prizes: Prize[] = [];
  private usedPrizes: Prize[] = [];
  private config: AppConfig;
  
  // State
  private currentPrize: Prize | null = null;
  private currentWinner: Participant | null = null;
  private autoTimer: number | null = null;
  private isInitialized = false;

  constructor(container: HTMLElement) {
    super();
    
    this.container = container;
    this.config = Storage.loadConfig();
    
    this.initializeDOM();
    this.initializeSystems();
    this.setupEventListeners();
    this.applyConfiguration();
    
    console.log('Roulette initialized');
    this.isInitialized = true;
  }

  private initializeDOM(): void {
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
          <button class="control-button" id="loadDataBtn">Cargar Excel</button>
          <button class="control-button secondary" id="configBtn">Configuración</button>
        </div>
      </div>
      
      <div class="config-panel" id="configPanel">
        <!-- Config panel content will be generated -->
      </div>
    `;

    // Get DOM references
    this.canvas = this.container.querySelector('.roulette-canvas') as HTMLCanvasElement;
    this.participantsSection = this.container.querySelector('.participants-scroll-container') as HTMLElement;
    this.statusIndicator = this.container.querySelector('.status-indicator') as HTMLElement;
    this.configPanel = this.container.querySelector('.config-panel') as HTMLElement;
  }

  private initializeSystems(): void {
    // Initialize core systems
    this.stateMachine = new RouletteStateMachine();
    this.canvasRenderer = new CanvasRenderer(this.canvas);
    this.audioEngine = new AudioEngine();
    this.timingEngine = new TimingEngine();
    this.particleSystem = new ParticleSystem();
    this.scrollAnimator = new ScrollAnimator(this.participantsSection);
    this.excelParser = new ExcelParser();

    // Setup state machine event listeners
    this.stateMachine.on('stateChange', ({ from, to }) => {
      this.onStateChange(from, to);
    });

    this.stateMachine.on('startSpin', () => {
      this.startSpin();
    });

    this.stateMachine.on('showCelebration', () => {
      this.showCelebrationModal();
    });

    console.log('All systems initialized');
  }

  private setupEventListeners(): void {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleSpacebarPress();
      } else if (e.altKey && e.code === 'KeyC') {
        e.preventDefault();
        this.toggleConfigPanel();
      }
    });

    // Button controls
    const loadDataBtn = this.container.querySelector('#loadDataBtn') as HTMLElement;
    const configBtn = this.container.querySelector('#configBtn') as HTMLElement;

    loadDataBtn.addEventListener('click', () => this.showFileLoadDialog());
    configBtn.addEventListener('click', () => this.toggleConfigPanel());

    // File drop handling
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = Array.from(e.dataTransfer?.files || []);
      const excelFile = files.find(f => this.excelParser.validateFileType(f));
      
      if (excelFile) {
        this.loadExcelFile(excelFile);
      }
    });

    console.log('Event listeners configured');
  }

  private applyConfiguration(): void {
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty('--bg-color', this.config.background.value);
    root.style.setProperty('--text-color', this.config.title.color);
    root.style.setProperty('--highlight-color', this.config.highlightColor);

    // Apply title styling
    const titleElement = this.container.querySelector('.main-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = this.config.title.text;
      titleElement.style.fontSize = `${this.config.title.fontSize}px`;
      titleElement.style.color = this.config.title.color;
      titleElement.style.fontFamily = this.config.title.fontFamily;
      
      // Apply title effects
      titleElement.className = 'main-title';
      this.config.title.effects.forEach(effect => {
        titleElement.classList.add(`with-${effect}`);
      });
    }

    // Apply background
    this.applyBackground();

    // Configure audio
    this.audioEngine.setVolume(this.config.audio.volume);

    // Configure particles
    this.particleSystem.startAnimation(
      this.config.animations.type,
      this.config.animations.intensity,
      this.config.animations.speed
    );

    // Configure scroll animator
    this.scrollAnimator.setHighlightColor(this.config.highlightColor);

    console.log('Configuration applied');
  }

  private applyBackground(): void {
    const body = document.body;
    
    switch (this.config.background.type) {
      case 'color':
        body.style.background = this.config.background.value;
        break;
        
      case 'gradient':
        body.style.background = this.config.background.value;
        break;
        
      case 'image':
        body.style.backgroundImage = `url(${this.config.background.value})`;
        body.style.backgroundSize = this.config.background.adjustment || 'cover';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundPosition = 'center';
        
        if (this.config.background.opacity < 1) {
          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, ${1 - this.config.background.opacity});
            pointer-events: none;
            z-index: -1;
          `;
          body.appendChild(overlay);
        }
        break;
    }
  }

  private onStateChange(from: RouletteState, to: RouletteState): void {
    console.log(`State transition: ${from} -> ${to}`);
    
    // Update status indicator
    this.updateStatusIndicator(to);
    
    // Handle state-specific logic
    switch (to) {
      case 'dataLoaded':
        this.stateMachine.transition('manualMode');
        break;
        
      case 'manualMode':
        this.setupManualMode();
        break;
        
      case 'autoMode':
        this.setupAutoMode();
        break;
        
      case 'spinning':
        // Spinning logic is handled by startSpin()
        break;
        
      case 'celebrating':
        // Celebration logic is handled by showCelebrationModal()
        break;
        
      case 'finished':
        this.showFinishedDialog();
        break;
    }
  }

  private updateStatusIndicator(state: RouletteState): void {
    const messages = {
      idle: 'Esperando datos...',
      dataLoaded: 'Datos cargados',
      manualMode: 'Modo manual - Presiona ESPACIO',
      autoMode: 'Modo automático',
      spinning: 'Girando...',
      celebrating: '¡Ganador!',
      paused: 'Pausado',
      configuring: 'Configurando...',
      finished: 'Sorteo terminado'
    };

    this.statusIndicator.textContent = messages[state] || state;
    this.statusIndicator.className = `status-indicator ${state}`;
  }

  // Public methods
  public async loadExcelFile(file: File): Promise<void> {
    try {
      this.updateStatusIndicator('loading' as RouletteState);
      
      const result = await this.excelParser.parseFile(file);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Error parsing file');
      }

      await this.setData(result.data);
      
      console.log('Excel file loaded successfully');
      
    } catch (error) {
      console.error('Error loading Excel file:', error);
      this.showErrorDialog(`Error cargando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  public async setData(data: ExcelData): Promise<void> {
    // Convert strings to objects
    this.participants = data.participantes.map((name, index) => ({
      id: MathUtils.generateId(),
      name: name.trim(),
      color: MathUtils.generateVibrantColor(),
      eliminated: false
    }));

    this.prizes = data.premios.map((name, index) => ({
      id: MathUtils.generateId(),
      name: name.trim(),
      imageIndex: (index % 8) + 1
    }));

    this.usedPrizes = [];

    // Update UI
    this.scrollAnimator.setParticipants(this.participants);
    
    // Save data
    Storage.saveData(data);
    
    // Update state
    this.stateMachine.setDataLoaded(true);
    this.stateMachine.setPrizesAvailable(this.prizes.length > 0);
    this.stateMachine.transition('dataLoaded');

    console.log(`Data loaded: ${this.participants.length} participants, ${this.prizes.length} prizes`);
  }

  private setupManualMode(): void {
    this.clearAutoTimer();
    this.stateMachine.setMode('manual');
  }

  private setupAutoMode(): void {
    this.stateMachine.setMode('auto');
    this.startAutoTimer();
  }

  private startAutoTimer(): void {
    this.clearAutoTimer();
    
    const interval = this.config.timing.autoInterval * 1000;
    
    this.autoTimer = window.setTimeout(() => {
      this.stateMachine.setAutoTimerExpired(true);
      if (this.stateMachine.canTransitionTo('spinning')) {
        this.stateMachine.transition('spinning');
      }
    }, interval);
  }

  private clearAutoTimer(): void {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }

  private handleSpacebarPress(): void {
    if (this.stateMachine.getCurrentState() === 'manualMode') {
      this.stateMachine.setSpacebarPressed(true);
      if (this.stateMachine.canTransitionTo('spinning')) {
        this.stateMachine.transition('spinning');
      }
      // Reset spacebar state
      setTimeout(() => this.stateMachine.setSpacebarPressed(false), 100);
    }
  }

  private async startSpin(): Promise<void> {
    if (this.prizes.length === 0) {
      this.stateMachine.setPrizesAvailable(false);
      this.stateMachine.transition('finished');
      return;
    }

    try {
      // Select random prize and winner
      this.currentPrize = MathUtils.randomChoice(this.prizes);
      const availableParticipants = this.participants.filter(p => !p.eliminated);
      this.currentWinner = MathUtils.randomChoice(availableParticipants);

      console.log(`Selected: ${this.currentPrize.name} -> ${this.currentWinner.name}`);

      // Show prize immediately
      this.canvasRenderer.setPrize(this.currentPrize.name, this.currentPrize.imageIndex);

      // Calculate animation parameters
      const duration = this.config.timing.spinDuration;
      const finalRotation = MathUtils.calculateRouletteRotation(
        this.participants.indexOf(this.currentWinner),
        this.participants.length
      );
      const scrollPosition = MathUtils.calculateScrollPosition(
        this.participants.indexOf(this.currentWinner),
        this.participants.length
      );

      // Start synchronized animations
      const audioPromise = this.audioEngine.createSpinSound(this.config.audio.type, duration);
      const scrollPromise = this.scrollAnimator.syncWithRoulette(duration, this.currentWinner);
      const roulettePromise = this.timingEngine.createSimpleSpinAnimation(
        duration,
        3, // Number of spins
        (rotation) => this.canvasRenderer.setRotation(rotation),
        () => {}
      );

      // Wait for all animations to complete
      await Promise.all([audioPromise, scrollPromise, roulettePromise]);

      // Play celebration sound
      this.audioEngine.playCelebrationSound();

      // Update data
      this.currentWinner.eliminated = true;
      this.usedPrizes.push(this.currentPrize);
      this.prizes = this.prizes.filter(p => p.id !== this.currentPrize!.id);

      // Save to history
      Storage.saveToHistory(this.currentPrize, this.currentWinner.name);

      // Transition to celebration
      this.stateMachine.setSpinCompleted(true);
      this.stateMachine.transition('celebrating');

    } catch (error) {
      console.error('Error during spin:', error);
      this.showErrorDialog('Error durante el sorteo');
    }
  }

  private showCelebrationModal(): void {
    if (!this.currentPrize || !this.currentWinner) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay celebration-modal';
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

    // Auto-close after celebration duration
    setTimeout(() => {
      modal.remove();
      this.completeCelebration();
    }, this.config.timing.celebrationDuration * 1000);
  }

  private completeCelebration(): void {
    // Check if more prizes available
    if (this.prizes.length === 0) {
      this.stateMachine.setPrizesAvailable(false);
      this.stateMachine.transition('finished');
    } else {
      // Continue based on mode
      const currentMode = this.config.mode;
      if (currentMode === 'manual') {
        this.stateMachine.transition('manualMode');
      } else {
        this.stateMachine.transition('autoMode');
      }
    }
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.loadExcelFile(file);
      }
    };

    input.click();
  }

  private toggleConfigPanel(): void {
    this.configPanel.classList.toggle('open');
    
    if (this.configPanel.classList.contains('open')) {
      this.stateMachine.transition('configuring');
      this.generateConfigPanelContent();
    }
  }

  private generateConfigPanelContent(): void {
    this.configPanel.innerHTML = `
      <div class="config-header">
        <h2 class="config-title">⚙️ Configuración</h2>
        <button class="modal-close" onclick="this.closest('.config-panel').classList.remove('open')">✕</button>
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
        
        <!-- Título -->
        <div class="config-group">
          <label class="config-label">📝 Título</label>
          <input type="text" class="config-input" id="titleText" value="${this.config.title.text}">
          
          <label class="config-label">Tamaño de fuente</label>
          <input type="range" class="config-range" id="titleSize" min="24" max="72" value="${this.config.title.fontSize}">
          <span id="titleSizeValue">${this.config.title.fontSize}px</span>
          
          <label class="config-label">Color del texto</label>
          <input type="color" class="config-input" id="titleColor" value="${this.config.title.color}">
        </div>

        <!-- Fondo -->
        <div class="config-group">
          <label class="config-label">🖼️ Fondo</label>
          <div class="config-radio-group">
            <div class="config-radio-item ${this.config.background.type === 'color' ? 'selected' : ''}" data-bg-type="color">
              <input type="radio" name="backgroundType" value="color" class="config-radio" ${this.config.background.type === 'color' ? 'checked' : ''}>
              Color sólido
            </div>
            <div class="config-radio-item ${this.config.background.type === 'gradient' ? 'selected' : ''}" data-bg-type="gradient">
              <input type="radio" name="backgroundType" value="gradient" class="config-radio" ${this.config.background.type === 'gradient' ? 'checked' : ''}>
              Gradiente
            </div>
            <div class="config-radio-item ${this.config.background.type === 'image' ? 'selected' : ''}" data-bg-type="image">
              <input type="radio" name="backgroundType" value="image" class="config-radio" ${this.config.background.type === 'image' ? 'checked' : ''}>
              Imagen personalizada
            </div>
          </div>
          
          <div id="backgroundControls" class="mt-10">
            <!-- Dynamic content based on selection -->
          </div>
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
            <div class="config-radio-item ${this.config.animations.type === 'none' ? 'selected' : ''}" data-anim-type="none">
              <input type="radio" name="animationType" value="none" class="config-radio" ${this.config.animations.type === 'none' ? 'checked' : ''}>
              Sin animación
            </div>
            <div class="config-radio-item ${this.config.animations.type === 'snow' ? 'selected' : ''}" data-anim-type="snow">
              <input type="radio" name="animationType" value="snow" class="config-radio" ${this.config.animations.type === 'snow' ? 'checked' : ''}>
              ❄️ Copos de nieve
            </div>
            <div class="config-radio-item ${this.config.animations.type === 'autumn' ? 'selected' : ''}" data-anim-type="autumn">
              <input type="radio" name="animationType" value="autumn" class="config-radio" ${this.config.animations.type === 'autumn' ? 'checked' : ''}>
              🍂 Hojas de otoño
            </div>
            <div class="config-radio-item ${this.config.animations.type === 'confetti' ? 'selected' : ''}" data-anim-type="confetti">
              <input type="radio" name="animationType" value="confetti" class="config-radio" ${this.config.animations.type === 'confetti' ? 'checked' : ''}>
              🎊 Confeti
            </div>
            <div class="config-radio-item ${this.config.animations.type === 'bubbles' ? 'selected' : ''}" data-anim-type="bubbles">
              <input type="radio" name="animationType" value="bubbles" class="config-radio" ${this.config.animations.type === 'bubbles' ? 'checked' : ''}>
              🫧 Burbujas
            </div>
            <div class="config-radio-item ${this.config.animations.type === 'stars' ? 'selected' : ''}" data-anim-type="stars">
              <input type="radio" name="animationType" value="stars" class="config-radio" ${this.config.animations.type === 'stars' ? 'checked' : ''}>
              ⭐ Estrellas
            </div>
            <div class="config-radio-item ${this.config.animations.type === 'petals' ? 'selected' : ''}" data-anim-type="petals">
              <input type="radio" name="animationType" value="petals" class="config-radio" ${this.config.animations.type === 'petals' ? 'checked' : ''}>
              🌸 Pétalos
            </div>
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
            <div class="config-radio-item ${this.config.audio.type === 'classic' ? 'selected' : ''}" data-audio-type="classic">
              <input type="radio" name="audioType" value="classic" class="config-radio" ${this.config.audio.type === 'classic' ? 'checked' : ''}>
              Ruleta Clásica (tick-tick-tick)
            </div>
            <div class="config-radio-item ${this.config.audio.type === 'electronic' ? 'selected' : ''}" data-audio-type="electronic">
              <input type="radio" name="audioType" value="electronic" class="config-radio" ${this.config.audio.type === 'electronic' ? 'checked' : ''}>
              Tambor Electrónico (whoosh)
            </div>
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
          <div class="config-radio-group">
            <div class="config-radio-item ${this.config.mode === 'manual' ? 'selected' : ''}" data-mode="manual">
              <input type="radio" name="activationMode" value="manual" class="config-radio" ${this.config.mode === 'manual' ? 'checked' : ''}>
              Manual (Barra Espaciadora)
            </div>
            <div class="config-radio-item ${this.config.mode === 'auto' ? 'selected' : ''}" data-mode="auto">
              <input type="radio" name="activationMode" value="auto" class="config-radio" ${this.config.mode === 'auto' ? 'checked' : ''}>
              Automático
            </div>
          </div>
        </div>

        <div class="config-group">
          <label class="config-label">⏱️ Duración del sorteo (3-10 seg)</label>
          <input type="range" class="config-range" id="spinDuration" min="3" max="10" value="${this.config.timing.spinDuration}">
          <span id="durationValue">${this.config.timing.spinDuration}s</span>
          
          <label class="config-label">Tiempo entre sorteos automáticos (5-60 seg)</label>
          <input type="range" class="config-range" id="autoInterval" min="5" max="60" value="${this.config.timing.autoInterval}">
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

    this.setupConfigEventListeners();
  }

  private setupConfigEventListeners(): void {
    // Excel drop area
    const dropArea = this.configPanel.querySelector('#excelDropArea') as HTMLElement;
    dropArea?.addEventListener('click', () => this.showFileLoadDialog());

    // Download template
    const downloadBtn = this.configPanel.querySelector('#downloadTemplateBtn') as HTMLElement;
    downloadBtn?.addEventListener('click', () => this.downloadTemplate());

    // Title controls
    const titleText = this.configPanel.querySelector('#titleText') as HTMLInputElement;
    titleText?.addEventListener('input', (e) => {
      this.config.title.text = (e.target as HTMLInputElement).value;
      this.applyTitleChanges();
    });

    const titleSize = this.configPanel.querySelector('#titleSize') as HTMLInputElement;
    const titleSizeValue = this.configPanel.querySelector('#titleSizeValue') as HTMLElement;
    titleSize?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.title.fontSize = value;
      titleSizeValue.textContent = `${value}px`;
      this.applyTitleChanges();
    });

    const titleColor = this.configPanel.querySelector('#titleColor') as HTMLInputElement;
    titleColor?.addEventListener('change', (e) => {
      this.config.title.color = (e.target as HTMLInputElement).value;
      this.applyTitleChanges();
    });

    // Background controls
    const backgroundRadios = this.configPanel.querySelectorAll('input[name="backgroundType"]');
    backgroundRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.config.background.type = (e.target as HTMLInputElement).value as any;
        this.updateBackgroundControls();
        this.applyConfiguration();
      });
    });

    // Highlight color
    const highlightColor = this.configPanel.querySelector('#highlightColor') as HTMLInputElement;
    highlightColor?.addEventListener('change', (e) => {
      this.config.highlightColor = (e.target as HTMLInputElement).value;
      this.scrollAnimator.setHighlightColor(this.config.highlightColor);
    });

    // Animation controls
    const animationRadios = this.configPanel.querySelectorAll('input[name="animationType"]');
    animationRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.config.animations.type = (e.target as HTMLInputElement).value as any;
        this.particleSystem.startAnimation(
          this.config.animations.type,
          this.config.animations.intensity,
          this.config.animations.speed
        );
      });
    });

    const animationIntensity = this.configPanel.querySelector('#animationIntensity') as HTMLInputElement;
    const intensityValue = this.configPanel.querySelector('#intensityValue') as HTMLElement;
    animationIntensity?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.animations.intensity = value;
      intensityValue.textContent = value.toString();
      this.particleSystem.setIntensity(value);
    });

    const animationSpeed = this.configPanel.querySelector('#animationSpeed') as HTMLInputElement;
    const speedValue = this.configPanel.querySelector('#speedValue') as HTMLElement;
    animationSpeed?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.animations.speed = value;
      speedValue.textContent = value.toString();
      this.particleSystem.setSpeed(value);
    });

    // Audio controls
    const audioRadios = this.configPanel.querySelectorAll('input[name="audioType"]');
    audioRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.config.audio.type = (e.target as HTMLInputElement).value as any;
      });
    });

    const audioVolume = this.configPanel.querySelector('#audioVolume') as HTMLInputElement;
    const volumeValue = this.configPanel.querySelector('#volumeValue') as HTMLElement;
    audioVolume?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.config.audio.volume = value;
      volumeValue.textContent = Math.round(value * 10).toString();
      this.audioEngine.setVolume(value);
    });

    // Mode controls
    const modeRadios = this.configPanel.querySelectorAll('input[name="activationMode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.config.mode = (e.target as HTMLInputElement).value as any;
        this.stateMachine.setMode(this.config.mode);
        
        if (this.config.mode === 'manual') {
          this.stateMachine.transition('manualMode');
        } else {
          this.stateMachine.transition('autoMode');
        }
      });
    });

    // Timing controls
    const spinDuration = this.configPanel.querySelector('#spinDuration') as HTMLInputElement;
    const durationValue = this.configPanel.querySelector('#durationValue') as HTMLElement;
    spinDuration?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.timing.spinDuration = value;
      durationValue.textContent = `${value}s`;
    });

    const autoInterval = this.configPanel.querySelector('#autoInterval') as HTMLInputElement;
    const intervalValue = this.configPanel.querySelector('#intervalValue') as HTMLElement;
    autoInterval?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.config.timing.autoInterval = value;
      intervalValue.textContent = `${value}s`;
    });

    // Auto mode controls
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
      this.config.mode = 'manual';
      this.stateMachine.setMode('manual');
      this.stateMachine.transition('manualMode');
    });

    // History controls
    const viewHistoryBtn = this.configPanel.querySelector('#viewHistoryBtn') as HTMLElement;
    viewHistoryBtn?.addEventListener('click', () => this.showHistoryModal());

    const clearHistoryBtn = this.configPanel.querySelector('#clearHistoryBtn') as HTMLElement;
    clearHistoryBtn?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres limpiar todo el historial?')) {
        Storage.clearHistory();
        alert('Historial limpiado');
      }
    });

    // Save/Reset controls
    const saveConfigBtn = this.configPanel.querySelector('#saveConfigBtn') as HTMLElement;
    saveConfigBtn?.addEventListener('click', () => {
      Storage.saveConfig(this.config);
      alert('Configuración guardada');
    });

    const resetConfigBtn = this.configPanel.querySelector('#resetConfigBtn') as HTMLElement;
    resetConfigBtn?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres resetear toda la configuración?')) {
        this.config = Storage.getDefaultConfig();
        Storage.saveConfig(this.config);
        this.applyConfiguration();
        this.generateConfigPanelContent(); // Regenerate panel with default values
        alert('Configuración restablecida');
      }
    });
  }

  private updateBackgroundControls(): void {
    const controlsDiv = this.configPanel.querySelector('#backgroundControls') as HTMLElement;
    
    switch (this.config.background.type) {
      case 'color':
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

      case 'gradient':
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

      case 'image':
        controlsDiv.innerHTML = `
          <label class="config-label">URL de imagen</label>
          <input type="text" class="config-input" id="imageUrl" 
                 value="${this.config.background.value}" 
                 placeholder="https://ejemplo.com/imagen.jpg">
          
          <label class="config-label">Ajuste de imagen</label>
          <select class="config-select" id="imageAdjustment">
            <option value="cover" ${this.config.background.adjustment === 'cover' ? 'selected' : ''}>Cubrir</option>
            <option value="contain" ${this.config.background.adjustment === 'contain' ? 'selected' : ''}>Contener</option>
            <option value="repeat" ${this.config.background.adjustment === 'repeat' ? 'selected' : ''}>Repetir</option>
            <option value="center" ${this.config.background.adjustment === 'center' ? 'selected' : ''}>Centrar</option>
          </select>
          
          <label class="config-label">Opacidad</label>
          <input type="range" class="config-range" id="imageOpacity" min="0.1" max="1" step="0.1" value="${this.config.background.opacity}">
          <span id="opacityValue">${Math.round(this.config.background.opacity * 100)}%</span>
        `;
        
        const imageUrl = controlsDiv.querySelector('#imageUrl') as HTMLInputElement;
        imageUrl?.addEventListener('change', (e) => {
          this.config.background.value = (e.target as HTMLInputElement).value;
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
          opacityValue.textContent = `${Math.round(value * 100)}%`;
          this.applyBackground();
        });
        break;
    }
  }

  private applyTitleChanges(): void {
    const titleElement = this.container.querySelector('.main-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = this.config.title.text;
      titleElement.style.fontSize = `${this.config.title.fontSize}px`;
      titleElement.style.color = this.config.title.color;
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
          ${history.length === 0 ? 
            '<p>No hay entradas en el historial</p>' :
            history.map(entry => `
              <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>${entry.prize}</strong><br>
                  <span style="color: #666;">Ganador: ${entry.winner}</span>
                </div>
                <span style="color: #999; font-size: 12px;">
                  ${new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            `).join('')
          }
        </div>
        ${history.length > 0 ? `
          <div style="margin-top: 20px; text-align: center;">
            <button class="control-button" onclick="this.downloadHistory()">📥 Descargar PDF</button>
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Public API methods
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
    console.log('Roulette reset');
  }

  public destroy(): void {
    this.clearAutoTimer();
    this.stateMachine.removeAllListeners();
    this.canvasRenderer.destroy();
    this.audioEngine.destroy();
    this.timingEngine.stopCurrentAnimation();
    this.particleSystem.destroy();
    this.scrollAnimator.destroy();
    
    console.log('Roulette destroyed');
  }

  // Getters
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public getParticipants(): Participant[] {
    return [...this.participants];
  }

  public getPrizes(): Prize[] {
    return [...this.prizes];
  }

  public getCurrentState(): RouletteState {
    return this.stateMachine.getCurrentState();
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }
}