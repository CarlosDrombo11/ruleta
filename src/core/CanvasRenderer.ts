// src/core/CanvasRenderer.ts

// --- Parche de seguridad para drawImage: omite fuentes 0x0 ---
(() => {
  const proto = CanvasRenderingContext2D.prototype as any;
  if (!proto.__patchedDrawImage) {
    const original = proto.drawImage;
    proto.drawImage = function (img: any, ...args: any[]) {
      try {
        const w =
          (img?.width ?? img?.videoWidth ?? img?.naturalWidth ?? 0) | 0;
        const h =
          (img?.height ?? img?.videoHeight ?? img?.naturalHeight ?? 0) | 0;
        if (w === 0 || h === 0) {
          // Evita InvalidStateError cuando la fuente es OffscreenCanvas/Imagen 0x0
          return;
        }
      } catch {
        // Si no pudimos leer dimensiones, seguimos con el original
      }
      return original.call(this, img, ...args);
    };
    proto.__patchedDrawImage = true;
  }
})();

export class CanvasRenderer {
  private mainCanvas: HTMLCanvasElement;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private mainCtx: CanvasRenderingContext2D;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

  // Animación (duración-basada, NO asintótica)
  private animationId: number | null = null;
  private isAnimating = false;
  private currentRotation = 0;
  private fromRotation = 0;
  private toRotation = 0;
  private animStart = 0;
  private animDurationMs = 0;

  // Handlers de resize
  private resizeHandler: () => void;
  private resizeObserver: ResizeObserver | null = null;
  private resizeScheduled = false;

  // Configuración visual
  private readonly SEGMENTS_COUNT = 200;
  private segmentColors: string[] = [];
  private prizeImage: HTMLImageElement | null = null;
  private prizeText = '';

  constructor(canvas: HTMLCanvasElement) {
    this.mainCanvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto 2D del canvas');
    this.mainCtx = ctx;

    this.initializeOffscreenCanvas();
    this.generateSegmentColors();

    // Resize por ventana
    this.resizeHandler = () => this.queueResize();
    window.addEventListener('resize', this.resizeHandler);

    // Resize por cambios de layout del contenedor (split view/paneles)
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.queueResize());
      this.resizeObserver.observe(this.mainCanvas.parentElement ?? this.mainCanvas);
    }

    // Primer ajuste + primer render
    this.resizeCanvas();
  }

  // ---------- Utilidades de tamaño seguro ----------
  private cssAndRealSizeFromContainer(container: HTMLElement): { css: number; real: number } {
    const rect = container.getBoundingClientRect();
    // Nunca dejar que baje de 1px (evita 0x0 en transiciones de layout)
    const cssSize = Math.max(1, Math.floor(Math.min(rect.width * 0.98, rect.height * 0.98)));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const realSize = Math.max(1, Math.floor(cssSize * dpr));
    return { css: cssSize, real: realSize };
  }

  private hasValidSize(el?: { width?: number; height?: number } | null): boolean {
    if (!el) return false;
    const w = (el as any).width ?? 0;
    const h = (el as any).height ?? 0;
    return (w | 0) > 0 && (h | 0) > 0;
  }

  // Throttle del resize al siguiente frame
  private queueResize(): void {
    if (this.resizeScheduled) return;
    this.resizeScheduled = true;
    requestAnimationFrame(() => {
      this.resizeScheduled = false;
      this.resizeCanvas();
    });
  }

  // ---------- Setup de offscreen ----------
  private initializeOffscreenCanvas(): void {
    try {
      // arranca en 1x1 para evitar estados inválidos
      this.offscreenCanvas = new OffscreenCanvas(1, 1);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      if (this.offscreenCtx) {
        this.prerenderSegments();
      }
    } catch (error) {
      console.warn('OffscreenCanvas no soportado, usando fallback:', error);
      this.offscreenCanvas = null;
      this.offscreenCtx = null;
    }
  }

  private generateSegmentColors(): void {
    const baseColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    for (let i = 0; i < this.SEGMENTS_COUNT; i++) {
      this.segmentColors.push(baseColors[i % baseColors.length]);
    }
  }

  // ---------- Redimensionado seguro ----------
  private resizeCanvas(): void {
    const container = this.mainCanvas.parentElement ?? this.mainCanvas;
    const { css, real } = this.cssAndRealSizeFromContainer(container as HTMLElement);

    // sólo actualizamos si cambió
    if (this.mainCanvas.width !== real || this.mainCanvas.height !== real) {
      this.mainCanvas.width = real;
      this.mainCanvas.height = real;
    }
    this.mainCanvas.style.width = `${css}px`;
    this.mainCanvas.style.height = `${css}px`;

    if (this.offscreenCanvas && this.offscreenCtx) {
      if (this.offscreenCanvas.width !== real || this.offscreenCanvas.height !== real) {
        this.offscreenCanvas.width = real;
        this.offscreenCanvas.height = real;
      }
      this.prerenderSegments();
    }

    this.render();
  }

  private prerenderSegments(): void {
    if (!this.offscreenCtx || !this.offscreenCanvas) return;
    if (!this.hasValidSize(this.offscreenCanvas)) return;

    const ctx = this.offscreenCtx;
    const size = this.offscreenCanvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.48;
    const innerRadius = size * 0.15;

    ctx.clearRect(0, 0, size, size);

    const anglePerSegment = (2 * Math.PI) / this.SEGMENTS_COUNT;

    for (let i = 0; i < this.SEGMENTS_COUNT; i++) {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = this.segmentColors[i];
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // ---------- Render ----------
  public render(): void {
    // Si el canvas aún está en tamaño no válido (p.ej. justo tras un split), no pintamos
    if (!this.hasValidSize(this.mainCanvas)) return;

    const size = this.mainCanvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const innerRadius = size * 0.2;

    this.mainCtx.clearRect(0, 0, size, size);

    // Anillo giratorio
    this.mainCtx.save();
    this.mainCtx.translate(centerX, centerY);
    this.mainCtx.rotate(this.currentRotation);
    this.mainCtx.translate(-centerX, -centerY);

    if (this.offscreenCanvas && this.hasValidSize(this.offscreenCanvas)) {
      // Sólo dibujamos el offscreen si tiene dimensiones válidas
      try {
        this.mainCtx.drawImage(this.offscreenCanvas, 0, 0);
      } catch (e) {
        // Si a pesar del check el browser lanza, caemos a render directo
        console.warn('[CanvasRenderer] drawImage offscreen omitido:', e);
        this.renderSegmentsDirect();
      }
    } else {
      this.renderSegmentsDirect();
    }

    this.mainCtx.restore();

    // Círculo interior con premio
    this.renderInnerCircle(centerX, centerY, innerRadius);
  }

  private renderSegmentsDirect(): void {
    if (!this.hasValidSize(this.mainCanvas)) return;

    const size = this.mainCanvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.2;
    const anglePerSegment = (2 * Math.PI) / this.SEGMENTS_COUNT;

    for (let i = 0; i < this.SEGMENTS_COUNT; i++) {
      const startAngle = i * anglePerSegment;
      const endAngle = (i + 1) * anglePerSegment;

      this.mainCtx.beginPath();
      this.mainCtx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      this.mainCtx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      this.mainCtx.closePath();

      this.mainCtx.fillStyle = this.segmentColors[i];
      this.mainCtx.fill();
      this.mainCtx.strokeStyle = '#FFF';
      this.mainCtx.lineWidth = 1;
      this.mainCtx.stroke();
    }
  }

  private renderInnerCircle(centerX: number, centerY: number, radius: number): void {
    this.mainCtx.beginPath();
    this.mainCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.mainCtx.fillStyle = '#2C3E50';
    this.mainCtx.fill();
    this.mainCtx.strokeStyle = '#ECF0F1';
    this.mainCtx.lineWidth = 4;
    this.mainCtx.stroke();

    // Dibujo seguro de imagen (naturalWidth/Height > 0)
    if (this.prizeImage && this.prizeImage.complete &&
        (this.prizeImage.naturalWidth | 0) > 0 && (this.prizeImage.naturalHeight | 0) > 0) {
      this.mainCtx.save();
      this.mainCtx.beginPath();
      this.mainCtx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
      this.mainCtx.clip();

      const imageSize = (radius - 4) * 2;
      this.mainCtx.drawImage(
        this.prizeImage,
        centerX - radius + 4,
        centerY - radius + 4,
        imageSize,
        imageSize
      );
      this.mainCtx.restore();
    }

    if (this.prizeText) {
      this.renderPrizeText(centerX, centerY, radius);
    }
  }

  private renderPrizeText(centerX: number, centerY: number, radius: number): void {
    this.mainCtx.save();
    const fontSize = Math.max(16, radius * 0.15);
    this.mainCtx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.mainCtx.textAlign = 'center';
    this.mainCtx.textBaseline = 'middle';
    this.mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.mainCtx.shadowBlur = 4;
    this.mainCtx.shadowOffsetX = 2;
    this.mainCtx.shadowOffsetY = 2;
    this.mainCtx.fillStyle = '#FFFFFF';
    this.mainCtx.fillText(this.prizeText, centerX, centerY);
    this.mainCtx.shadowColor = 'transparent';
    this.mainCtx.strokeStyle = '#2C3E50';
    this.mainCtx.lineWidth = 2;
    this.mainCtx.strokeText(this.prizeText, centerX, centerY);
    this.mainCtx.restore();
  }

  // ==== EASING determinista
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private step = (now: number) => {
    if (!this.isAnimating) return;

    const elapsed = now - this.animStart;
    const t = Math.min(1, elapsed / this.animDurationMs);
    const k = this.easeOutCubic(t);
    const delta = this.toRotation - this.fromRotation;
    this.currentRotation = this.fromRotation + delta * k;

    // Saltar frames si el canvas aún no tiene tamaño válido
    if (this.hasValidSize(this.mainCanvas)) {
      this.render();
    }

    if (t < 1) {
      this.animationId = requestAnimationFrame(this.step);
    } else {
      this.isAnimating = false;
      this.animationId = null;
      this.currentRotation = this.toRotation;
      this.render();
    }
  };

  private cancelAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Gira la ruleta hasta 'targetRotation' usando una **duración exacta** (segundos).
   * Se cancela cualquier animación previa.
   */
  public startSpin(targetRotation: number, durationSeconds: number): void {
    this.cancelAnimation();
    this.fromRotation = this.currentRotation;
    this.toRotation = targetRotation;
    this.animDurationMs = Math.max(50, durationSeconds * 1000);
    this.animStart = performance.now();
    this.isAnimating = true;
    this.animationId = requestAnimationFrame(this.step);
  }

  public setRotation(rotation: number): void {
    this.cancelAnimation();
    this.currentRotation = rotation;
    this.render();
  }

  public setPrize(text: string, imageIndex: number): void {
    this.prizeText = text;
    this.loadPrizeImage(imageIndex);
  }

  private async loadPrizeImage(index: number): Promise<void> {
    try {
      const img = new Image();
      img.onload = () => {
        this.prizeImage = img;
        this.render();
      };
      img.onerror = () => {
        console.warn(`No se pudo cargar la imagen del premio ${index}`);
        this.prizeImage = null;
        this.render();
      };
      img.src = `/images/premio-${index}.jpg`;
    } catch (error) {
      console.error('Error cargando imagen del premio:', error);
    }
  }

  public clearPrize(): void {
    this.prizeText = '';
    this.prizeImage = null;
    this.render();
  }

  public getCurrentRotation(): number {
    return this.currentRotation;
  }

  public isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  public destroy(): void {
    this.cancelAnimation();
    window.removeEventListener('resize', this.resizeHandler);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}
