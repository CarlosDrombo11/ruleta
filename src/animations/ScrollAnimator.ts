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

  // Altura lógica (sólo base visual del item)
  private readonly ITEM_HEIGHT = 60;

  // Paso real entre filas (se mide con 2 ítems)
  private rowStep = this.ITEM_HEIGHT;

  // Alto visual exacto del item (sin el “step”)
  private itemVisualHeight = this.ITEM_HEIGHT;

  // Grosor del contorno del cintillo
  private readonly BAND_BORDER_PX = 12;

  // Microajuste manual opcional (px) por si quieres mover 1–2 px el centro
  private readonly CENTER_TWEAK = 0;

  private highlightColor = '#FF6B6B';

  // Copias / alturas
  private readonly MIN_COPIES = 5;
  private copies = this.MIN_COPIES;
  private listHeight = 0;
  private totalHeight = 0;

  // Posición absoluta (px de translateY del contenido)
  private baseStart = 0;
  private absPos = 0;

  private animationId = 0;

  // Cintillo
  private highlightBandEl!: HTMLDivElement;
  private lastPainted: HTMLElement[] = [];

  // Colores de filas
  private readonly BRAND_A = '#7acb00';
  private readonly BRAND_B = '#ff0198';
  private readonly ITEM_TEXT_COLOR = '#000';
  private readonly USE_GRADIENT_PER_ITEM = false;

  constructor(scrollElement: HTMLElement) {
    this.scrollElement = scrollElement;
    this.participantsContainer = this.createParticipantsContainer();
    this.scrollElement.appendChild(this.participantsContainer);
    this.setupHighlightBand();

    // Recalcular en resize (también se dispara con zoom en la mayoría de navegadores)
    window.addEventListener('resize', () => {
      this.renderParticipants();
      this.syncBandToItemShape();
      this.paintUnderBand();
    });
  }

  // ---------- UI base ----------
  private createParticipantsContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'participants-list';
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: auto;
      will-change: transform;
      backface-visibility: hidden;
      transform: translate3d(0,0,0);
    `;
    return container;
  }

  private setupHighlightBand(): void {
    const band = document.createElement('div');
    band.className = 'highlight-band';
    band.style.cssText = `
      position: absolute;
      top: 50%;
      left: 10px;
      right: 10px;
      height: ${this.ITEM_HEIGHT}px;
      transform: translateY(-50%);
      z-index: 10;
      pointer-events: none;
      border-radius: 20px;
      background: transparent;
      box-shadow: none;
      box-sizing: border-box; /* para que el borde no desplace el centro */
    `;
    band.style.border = `${this.BAND_BORDER_PX}px solid ${this.darken(this.highlightColor, 0.28)}`;

    if (getComputedStyle(this.scrollElement).position === 'static') {
      this.scrollElement.style.position = 'relative';
    }
    this.scrollElement.appendChild(band);
    this.highlightBandEl = band;
  }

  public setHighlightColor(color: string): void {
    this.highlightColor = color;
    if (this.highlightBandEl) {
      this.highlightBandEl.style.background = 'transparent';
      this.highlightBandEl.style.boxShadow = 'none';
      this.highlightBandEl.style.border = `${this.BAND_BORDER_PX}px solid ${this.darken(color, 0.28)}`;
      this.syncBandToItemShape();
    }
  }

  /** Copia forma y márgenes del ítem al cintillo */
  private syncBandToItemShape(): void {
    if (!this.highlightBandEl) return;
    const sample = this.participantsContainer.querySelector('.participant-item') as HTMLElement | null;
    if (!sample) return;

    const rect = sample.getBoundingClientRect();
    const cs = getComputedStyle(sample);

    const height = Math.max(1, Math.round(rect.height));
    const radius = cs.borderRadius && cs.borderRadius !== '0px'
      ? cs.borderRadius
      : `${Math.round(height / 2)}px`;

    const ml = parseFloat(cs.marginLeft || '0') || 0;
    const mr = parseFloat(cs.marginRight || '0') || 0;

    this.highlightBandEl.style.height = `${height}px`;
    this.highlightBandEl.style.borderRadius = radius;
    this.highlightBandEl.style.left = `${ml}px`;
    this.highlightBandEl.style.right = `${mr}px`;
  }

  // ---------- utilidades ----------
  private darken(hex: string, amt = 0.2): string {
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    let [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    r = clamp(r * (1 - amt));
    g = clamp(g * (1 - amt));
    b = clamp(b * (1 - amt));
    return `rgb(${r},${g},${b})`;
  }

  /** Alinea a píxel físico (evita “desfase” con zooms raros) */
  private alignToDevicePixel(v: number): number {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(v * dpr) / dpr;
  }

  /** Centro real del cintillo usando DOMRect (sub-píxel), relativo al top del scrollElement */
  private getBandCenter(): number {
    if (!this.highlightBandEl) return this.scrollElement.clientHeight / 2 + this.CENTER_TWEAK;
    const se = this.scrollElement.getBoundingClientRect();
    const br = this.highlightBandEl.getBoundingClientRect();
    const center = (br.top + br.bottom) / 2 - se.top;
    return center + this.CENTER_TWEAK;
  }

  // ---------- Datos ----------
  public setParticipants(participants: Participant[]): void {
    this.participants = [...participants];
    this.renderParticipants();
    this.paintUnderBand();
  }

  private ensureCopiesFor(targetDistancePx: number): void {
    const viewport = Math.max(1, this.scrollElement.clientHeight);
    const needHeight = this.baseStart + targetDistancePx + viewport * 1.5;
    const neededCopies = Math.ceil(needHeight / this.listHeight) + 1;
    if (neededCopies > this.copies) {
      this.copies = Math.max(neededCopies, this.MIN_COPIES);
      this.renderParticipants();
    }
  }

  /** Mide paso real entre filas con 2 ítems de muestra (incluye colapsos de margen, bordes, etc.) */
  private measureRowMetrics(): { step: number; itemH: number } {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position:absolute; left:0; top:0; visibility:hidden; pointer-events:none;
      width:100%;
    `;

    const makeItem = () => {
      const el = document.createElement('div');
      el.className = 'participant-item';
      el.style.cssText = `
        height: ${this.ITEM_HEIGHT}px;
        display:flex; align-items:center; padding:0 20px;
        background:${this.BRAND_A}; color:${this.ITEM_TEXT_COLOR};
        border-radius:20px; margin:8px 10px; box-sizing:border-box;
      `;
      el.textContent = 'Item';
      return el;
    };

    const a = makeItem();
    const b = makeItem();
    wrap.appendChild(a);
    wrap.appendChild(b);
    this.participantsContainer.appendChild(wrap);

    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();

    const itemH = Math.round(ra.height);
    const step = Math.max(1, Math.round(rb.top - ra.top)); // distancia entre TOPs
    wrap.remove();

    return { step, itemH };
  }

  private renderParticipants(): void {
    this.participantsContainer.innerHTML = '';
    if (this.participants.length === 0) return;

    // 1) medir paso real y alto visual
    const m = this.measureRowMetrics();
    this.rowStep = m.step;
    this.itemVisualHeight = m.itemH;

    // 2) calcular copias base con paso real
    this.listHeight = this.participants.length * this.rowStep;
    const viewport = Math.max(1, this.scrollElement.clientHeight);
    const baseCopies = Math.max(this.MIN_COPIES, 1 + Math.ceil((2 * viewport) / this.listHeight) + 2);
    this.copies = Math.max(this.copies, baseCopies);

    // 3) pintar filas
    let rowIndex = 0;
    for (let i = 0; i < this.copies; i++) {
      for (let pIdx = 0; pIdx < this.participants.length; pIdx++) {
        const p = this.participants[pIdx];
        this.participantsContainer.appendChild(this.createParticipantItem(p, rowIndex));
        rowIndex++;
      }
    }

    // 4) volver a medir por si el CSS definitivo varía y alinear cintillo
    const m2 = this.measureRowMetrics();
    this.rowStep = m2.step;
    this.itemVisualHeight = m2.itemH;
    this.listHeight = this.participants.length * this.rowStep;
    this.syncBandToItemShape();

    // 5) posicionamiento inicial
    this.totalHeight = this.copies * this.listHeight;
    const center = Math.floor(this.copies / 2) * this.listHeight;
    const low = viewport;
    const high = Math.max(low, this.totalHeight - this.listHeight - viewport);
    this.baseStart = Math.min(Math.max(center, low), high);

    this.absPos = this.baseStart;
    this.applyAbsolutePosition(this.absPos);
  }

  private createParticipantItem(participant: Participant, rowIndex: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'participant-item';
    item.dataset.participantId = participant.id;

    const baseColor = rowIndex % 2 === 0 ? this.BRAND_A : this.BRAND_B;
    const bg = this.USE_GRADIENT_PER_ITEM
      ? `linear-gradient(90deg, ${this.BRAND_A} 0%, ${this.BRAND_B} 100%)`
      : baseColor;

    item.style.cssText = `
      height: ${this.ITEM_HEIGHT}px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      background: ${participant.eliminated ? '#7F8C8D' : bg};
      color: ${this.ITEM_TEXT_COLOR};
      font-weight: 700;
      font-size: 16px;
      border-bottom: 2px solid rgba(255,255,255,0.2);
      position: relative;
      z-index: 5;
      opacity: ${participant.eliminated ? 0.5 : 1};
      transition: color .15s ease, text-shadow .15s ease, background .3s ease, opacity .3s ease;
      border-radius: 20px;
      margin: 8px 10px;
      box-sizing: border-box;
    `;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = participant.name;
    nameSpan.style.color = 'inherit';
    item.appendChild(nameSpan);

    return item;
  }

  // ---------- Pintado bajo el cintillo ----------
  private paintUnderBand(): void {
    // Reset de los últimos pintados
    for (const el of this.lastPainted) {
      const span = (el.querySelector(':scope > span') as HTMLElement) || el;
      span.style.removeProperty('color');
      span.style.textShadow = '0 1px 1px rgba(0,0,0,.35)';
    }
    this.lastPainted.length = 0;

    if (!this.participants.length) return;

    const bandCenter = this.getBandCenter(); // sub-píxel real
    const totalItems = this.copies * this.participants.length;

    const kCenter = Math.round(
      (this.absPos + bandCenter - this.rowStep / 2) / this.rowStep
    );

    for (let d = -2; d <= 2; d++) {
      const k = Math.min(Math.max(kCenter + d, 0), totalItems - 1);
      const node = this.participantsContainer.children.item(k) as HTMLElement | null;
      if (!node) continue;
      const span = (node.querySelector(':scope > span') as HTMLElement) || node;
      span.style.setProperty('color', this.ITEM_TEXT_COLOR, 'important');
      span.style.textShadow = 'none';
      this.lastPainted.push(node);
    }
  }

  // ---------- Sincronización con la ruleta ----------
  public async syncWithRoulette(duration: number, winner: Participant): Promise<void> {
    if (this.isAnimating) return Promise.reject(new Error('Animación en progreso'));

    this.isAnimating = true;
    this.winner = winner;
    this.animationId++;
    const animId = this.animationId;

    try {
      const winnerIndex = this.participants.findIndex(p => p.id === winner.id);
      if (winnerIndex === -1) throw new Error('Ganador no encontrado');

      const targetDistance = this.calculateWinnerDelta(winnerIndex);
      this.ensureCopiesFor(targetDistance);

      await this.animateAbsolute(d => this.baseStart + d, targetDistance, duration, animId);

      this.highlightWinner();
    } finally {
      // Normalizar posición a la base con el paso real
      const deltaFromBase = this.absPos - this.baseStart;
      const reduced = ((deltaFromBase % this.listHeight) + this.listHeight) % this.listHeight;
      this.absPos = this.baseStart + reduced;
      this.applyAbsolutePosition(this.absPos);

      this.isAnimating = false;
    }
  }

  private calculateWinnerDelta(winnerIndex: number): number {
    const bandCenter   = this.getBandCenter(); // centro real del cintillo
    const winnerTop    = winnerIndex * this.rowStep;
    const winnerCenter = winnerTop + this.rowStep / 2;
    const extraScrolls = 3; // pasadas antes de frenar
    return extraScrolls * this.listHeight + (winnerCenter - bandCenter);
  }

  private animateAbsolute(
    mapper: (value: number) => number,
    distance: number,
    duration: number,
    animId: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAnimating || this.animationId !== animId) {
        reject(new Error('Animación cancelada'));
        return;
      }

      this.currentAnimation = animate({
        from: 0,
        to: distance,
        duration: duration * 1000,
        ease: this.rouletteEasing,
        onUpdate: (value: number) => {
          if (!this.isAnimating || this.animationId !== animId) return;
          this.absPos = mapper(value);
          this.applyAbsolutePosition(this.absPos);
          this.paintUnderBand();
        },
        onComplete: () => resolve(),
        onStop: () => reject(new Error('Animación detenida'))
      });
    });
  }

  private rouletteEasing = (t: number): number => {
    if (t < 0.7) return 0.85 * t / 0.7;
    const r = (t - 0.7) / 0.3;
    return 0.85 + 0.15 * (1 - Math.pow(1 - r, 4));
  };

  private applyAbsolutePosition(abs: number): void {
    const y = this.alignToDevicePixel(abs);
    this.participantsContainer.style.transform = `translate3d(0, -${y}px, 0)`;
  }

  private highlightWinner(): void {
    if (!this.winner) return;
    const nodes = this.participantsContainer.querySelectorAll(
      `[data-participant-id="${this.winner.id}"]`
    );
    nodes.forEach(el => {
      (el as HTMLElement).style.cssText += `
        background: linear-gradient(45deg, ${this.winner!.color}, #FFD700) !important;
        box-shadow: 0 0 20px rgba(255,215,0,.8);
        z-index: 15;
        border: 3px solid #FFD700;
      `;
      (el as HTMLElement).style.animation = 'winnerPulse 2s ease-in-out infinite';
    });
    this.injectWinnerKeyframes();
  }

  private injectWinnerKeyframes(): void {
    const id = 'winner-pulse-animation';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes winnerPulse {
        0%,100% { transform: scale(1); opacity:1; }
        50% { transform: scale(1.05); opacity:.9; }
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- API ----------
  public eliminateParticipant(participant: Participant): void {
    this.removeParticipantById(participant.id);
  }

  public removeParticipantById(id: string): void {
    const before = this.participants.length;
    this.participants = this.participants.filter(p => p.id !== id);
    if (this.participants.length !== before) {
      this.renderParticipants();
      this.syncBandToItemShape();
      this.paintUnderBand();
    }
  }

  public resetParticipants(): void {
    this.participants.forEach(p => (p.eliminated = false));
    this.renderParticipants();
    this.syncBandToItemShape();
    this.paintUnderBand();
  }

  public stopAnimation(): void {
    this.animationId++;
    if (this.currentAnimation && typeof this.currentAnimation.stop === 'function') {
      try { this.currentAnimation.stop(); } catch {}
      this.currentAnimation = null;
    }
    this.isAnimating = false;
  }

  public isCurrentlyAnimating(): boolean { return this.isAnimating; }
  public getParticipants(): Participant[] { return [...this.participants]; }
  public getCurrentWinner(): Participant | null { return this.winner; }

  public destroy(): void {
    this.stopAnimation();
    if (this.highlightBandEl) this.highlightBandEl.remove();
    const style = document.getElementById('winner-pulse-animation');
    if (style) style.remove();
    this.participantsContainer.remove();
  }
}
