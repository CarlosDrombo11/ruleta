// src/core/CanvasRenderer.ts

export class CanvasRenderer {
  private mainCanvas: HTMLCanvasElement;
  private offscreenCanvas: OffscreenCanvas | null = null;
  private mainCtx: CanvasRenderingContext2D;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private segmentsPrerendered = false;
  private animationId: number | null = null;
  private currentRotation = 0;
  private targetRotation = 0;
  private isAnimating = false;

  // Configuración visual
  private readonly SEGMENTS_COUNT = 200;
  private segmentColors: string[] = [];
  private prizeImage: HTMLImageElement | null = null;
  private prizeText = '';

  constructor(canvas: HTMLCanvasElement) {
    this.mainCanvas = canvas;
    this.mainCtx = canvas.getContext('2d')!;
    this.initializeOffscreenCanvas();
    this.generateSegmentColors();
    this.resizeCanvas();
    
    // Listener para redimensionamiento
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private initializeOffscreenCanvas(): void {
    try {
      this.offscreenCanvas = new OffscreenCanvas(800, 800);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      if (this.offscreenCtx) {
        this.prerenderSegments();
      }
    } catch (error) {
      console.warn('OffscreenCanvas no soportado, usando fallback:', error);
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

  private resizeCanvas(): void {
    const container = this.mainCanvas.parentElement!;
    const rect = container.getBoundingClientRect();
    
    // Hacer la ruleta lo más grande posible
    const size = Math.min(rect.width * 0.95, rect.height * 0.95);
    
    this.mainCanvas.width = size;
    this.mainCanvas.height = size;
    this.mainCanvas.style.width = `${size}px`;
    this.mainCanvas.style.height = `${size}px`;

    // Re-prerenderizar si es necesario
    if (this.offscreenCanvas && this.offscreenCtx) {
      this.offscreenCanvas.width = size;
      this.offscreenCanvas.height = size;
      this.prerenderSegments();
    }

    this.render();
  }

  private prerenderSegments(): void {
    if (!this.offscreenCtx || !this.offscreenCanvas) return;

    const ctx = this.offscreenCtx;
    const size = this.offscreenCanvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.2;

    ctx.clearRect(0, 0, size, size);

    // Dibujar segmentos del anillo exterior
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

    this.segmentsPrerendered = true;
  }

  public render(): void {
    if (!this.mainCtx) return;

    const size = this.mainCanvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const innerRadius = size * 0.2;

    this.mainCtx.clearRect(0, 0, size, size);

    // Dibujar anillo exterior giratorio
    this.mainCtx.save();
    this.mainCtx.translate(centerX, centerY);
    this.mainCtx.rotate(this.currentRotation);
    this.mainCtx.translate(-centerX, -centerY);

    if (this.offscreenCanvas && this.segmentsPrerendered) {
      // Usar canvas pre-renderizado para mejor performance
      this.mainCtx.drawImage(this.offscreenCanvas, 0, 0);
    } else {
      // Fallback: renderizar directamente
      this.renderSegmentsDirect();
    }

    this.mainCtx.restore();

    // Dibujar círculo interior con premio
    this.renderInnerCircle(centerX, centerY, innerRadius);
  }

  private renderSegmentsDirect(): void {
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
    // Círculo de fondo
    this.mainCtx.beginPath();
    this.mainCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.mainCtx.fillStyle = '#2C3E50';
    this.mainCtx.fill();
    this.mainCtx.strokeStyle = '#ECF0F1';
    this.mainCtx.lineWidth = 4;
    this.mainCtx.stroke();

    // Imagen del premio si existe
    if (this.prizeImage && this.prizeImage.complete) {
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

    // Texto del premio
    if (this.prizeText) {
      this.renderPrizeText(centerX, centerY, radius);
    }
  }

  private renderPrizeText(centerX: number, centerY: number, radius: number): void {
    this.mainCtx.save();
    
    // Configurar texto
    const fontSize = Math.max(16, radius * 0.15);
    this.mainCtx.font = `bold ${fontSize}px Arial, sans-serif`;
    this.mainCtx.textAlign = 'center';
    this.mainCtx.textBaseline = 'middle';
    
    // Sombra para legibilidad
    this.mainCtx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.mainCtx.shadowBlur = 4;
    this.mainCtx.shadowOffsetX = 2;
    this.mainCtx.shadowOffsetY = 2;
    
    // Texto principal
    this.mainCtx.fillStyle = '#FFFFFF';
    this.mainCtx.fillText(this.prizeText, centerX, centerY);
    
    // Contorno
    this.mainCtx.shadowColor = 'transparent';
    this.mainCtx.strokeStyle = '#2C3E50';
    this.mainCtx.lineWidth = 2;
    this.mainCtx.strokeText(this.prizeText, centerX, centerY);
    
    this.mainCtx.restore();
  }

  private animate(): void {
    if (!this.isAnimating) return;

    // Interpolar rotación
    const diff = this.targetRotation - this.currentRotation;
    if (Math.abs(diff) > 0.01) {
      this.currentRotation += diff * 0.1; // Suavizado
      this.render();
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.currentRotation = this.targetRotation;
      this.isAnimating = false;
      this.render();
    }
  }

  public startSpin(targetRotation: number): void {
    this.targetRotation = targetRotation;
    this.isAnimating = true;
    this.animate();
  }

  public setRotation(rotation: number): void {
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
      
      // Cargar imagen predeterminada
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', () => this.resizeCanvas());
  }
}