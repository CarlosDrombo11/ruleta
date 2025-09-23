// src/animations/ParticleSystem.ts

import { Particle, ParticleType } from '../types';

export class ParticleSystem {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private isRunning = false;
  private particleCount = 50;
  private speed = 1;
  private currentType: ParticleType = 'none';

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    
    this.ctx = this.canvas.getContext('2d')!;
    this.resizeCanvas();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    document.body.appendChild(this.canvas);
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public startAnimation(type: ParticleType, intensity: number = 5, speed: number = 1): void {
    if (type === 'none') {
      this.stopAnimation();
      return;
    }

    this.stopAnimation();
    this.currentType = type;
    this.particleCount = Math.max(10, Math.min(100, intensity * 10));
    this.speed = Math.max(0.1, Math.min(3, speed));
    
    this.particles = this.createParticles(type, this.particleCount);
    this.isRunning = true;
    this.animate();
    
    console.log(`Iniciando animación: ${type}, partículas: ${this.particleCount}, velocidad: ${this.speed}`);
  }

  public stopAnimation(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private createParticles(type: ParticleType, count: number): Particle[] {
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'snow':
          particles.push(this.createSnowflake(i));
          break;
        case 'autumn':
          particles.push(this.createLeaf(i));
          break;
        case 'confetti':
          particles.push(this.createConfetti(i));
          break;
        case 'bubbles':
          particles.push(this.createBubble(i));
          break;
        case 'stars':
          particles.push(this.createStar(i));
          break;
        case 'petals':
          particles.push(this.createPetal(i));
          break;
      }
    }

    return particles;
  }

  private createSnowflake(id: number): Particle {
    return {
      id: id.toString(),
      x: Math.random() * window.innerWidth,
      y: -20,
      vx: (Math.random() - 0.5) * 2 * this.speed,
      vy: (Math.random() * 2 + 1) * this.speed,
      size: Math.random() * 4 + 2,
      color: '#FFFFFF',
      life: 1,
      maxLife: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    };
  }

  private createLeaf(id: number): Particle {
    const colors = ['#8B4513', '#CD853F', '#DAA520', '#B22222', '#FF8C00'];
    return {
      id: id.toString(),
      x: Math.random() * window.innerWidth,
      y: -20,
      vx: (Math.random() - 0.5) * 3 * this.speed,
      vy: (Math.random() * 1.5 + 0.5) * this.speed,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05
    };
  }

  private createConfetti(id: number): Particle {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return {
      id: id.toString(),
      x: Math.random() * window.innerWidth,
      y: -20,
      vx: (Math.random() - 0.5) * 6 * this.speed,
      vy: (Math.random() * 3 + 2) * this.speed,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    };
  }

  private createBubble(id: number): Particle {
    return {
      id: id.toString(),
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 20,
      vx: (Math.random() - 0.5) * 2 * this.speed,
      vy: -(Math.random() * 2 + 1) * this.speed,
      size: Math.random() * 15 + 5,
      color: `hsla(${Math.random() * 60 + 180}, 70%, 80%, 0.6)`,
      life: 1,
      maxLife: 1,
      rotation: 0,
      rotationSpeed: 0
    };
  }

  private createStar(id: number): Particle {
    return {
      id: id.toString(),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: 0,
      vy: 0,
      size: Math.random() * 3 + 1,
      color: '#FFD700',
      life: Math.random(),
      maxLife: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    };
  }

  private createPetal(id: number): Particle {
    const colors = ['#FFB6C1', '#FFC0CB', '#FF69B4', '#FF1493', '#DB7093'];
    return {
      id: id.toString(),
      x: Math.random() * window.innerWidth,
      y: -20,
      vx: (Math.random() - 0.5) * 2 * this.speed,
      vy: (Math.random() * 1.5 + 0.5) * this.speed,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03
    };
  }

  private animate(): void {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Actualizar y renderizar partículas
    this.particles = this.particles.filter(particle => {
      this.updateParticle(particle);
      this.renderParticle(particle);
      return this.isParticleAlive(particle);
    });

    // Crear nuevas partículas si es necesario
    if (this.particles.length < this.particleCount) {
      const newParticles = this.createParticles(this.currentType, 1);
      this.particles.push(...newParticles);
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private updateParticle(particle: Particle): void {
    // Actualizar posición
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Actualizar rotación
    if (particle.rotationSpeed) {
      particle.rotation = (particle.rotation || 0) + particle.rotationSpeed;
    }

    // Actualizar vida (solo para estrellas)
    if (this.currentType === 'stars') {
      particle.life += (Math.random() - 0.5) * 0.02;
      particle.life = Math.max(0, Math.min(1, particle.life));
    }

    // Efectos específicos por tipo
    switch (this.currentType) {
      case 'snow':
        // Movimiento ondulante para copos de nieve
        particle.vx += Math.sin(Date.now() * 0.001 + parseInt(particle.id)) * 0.01;
        break;
        
      case 'autumn':
        // Movimiento zigzag para hojas
        particle.vx += Math.sin(particle.y * 0.01) * 0.02;
        particle.vy += Math.sin(particle.x * 0.01) * 0.01;
        break;
        
      case 'bubbles':
        // Movimiento flotante para burbujas
        particle.vx += Math.sin(Date.now() * 0.002 + parseInt(particle.id)) * 0.02;
        break;
        
      case 'confetti':
        // Gravedad para confeti
        particle.vy += 0.05;
        break;
        
      case 'petals':
        // Movimiento suave ondulante para pétalos
        particle.vx += Math.sin(Date.now() * 0.0015 + parseInt(particle.id)) * 0.015;
        break;
    }
  }

  private renderParticle(particle: Particle): void {
    this.ctx.save();
    this.ctx.translate(particle.x, particle.y);
    
    if (particle.rotation) {
      this.ctx.rotate(particle.rotation);
    }

    switch (this.currentType) {
      case 'snow':
        this.renderSnowflake(particle);
        break;
      case 'autumn':
        this.renderLeaf(particle);
        break;
      case 'confetti':
        this.renderConfetti(particle);
        break;
      case 'bubbles':
        this.renderBubble(particle);
        break;
      case 'stars':
        this.renderStar(particle);
        break;
      case 'petals':
        this.renderPetal(particle);
        break;
    }

    this.ctx.restore();
  }

  private renderSnowflake(particle: Particle): void {
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    this.ctx.fill();

    // Añadir brillo
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Dibujar forma de copo de nieve
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    
    // Líneas principales del copo
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const length = particle.size * 0.8;
      
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      
      // Pequeñas ramas
      const branchLength = length * 0.3;
      const branchAngle1 = angle - Math.PI / 6;
      const branchAngle2 = angle + Math.PI / 6;
      
      this.ctx.moveTo(Math.cos(angle) * length * 0.7, Math.sin(angle) * length * 0.7);
      this.ctx.lineTo(
        Math.cos(angle) * length * 0.7 + Math.cos(branchAngle1) * branchLength,
        Math.sin(angle) * length * 0.7 + Math.sin(branchAngle1) * branchLength
      );
      
      this.ctx.moveTo(Math.cos(angle) * length * 0.7, Math.sin(angle) * length * 0.7);
      this.ctx.lineTo(
        Math.cos(angle) * length * 0.7 + Math.cos(branchAngle2) * branchLength,
        Math.sin(angle) * length * 0.7 + Math.sin(branchAngle2) * branchLength
      );
    }
    
    this.ctx.stroke();
  }

  private renderLeaf(particle: Particle): void {
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    
    // Forma de hoja más realista
    this.ctx.moveTo(0, -particle.size);
    this.ctx.quadraticCurveTo(particle.size * 0.5, -particle.size * 0.5, particle.size * 0.3, 0);
    this.ctx.quadraticCurveTo(particle.size * 0.2, particle.size * 0.5, 0, particle.size);
    this.ctx.quadraticCurveTo(-particle.size * 0.2, particle.size * 0.5, -particle.size * 0.3, 0);
    this.ctx.quadraticCurveTo(-particle.size * 0.5, -particle.size * 0.5, 0, -particle.size);
    this.ctx.closePath();
    this.ctx.fill();

    // Línea central de la hoja
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -particle.size);
    this.ctx.lineTo(0, particle.size);
    this.ctx.stroke();
  }

  private renderConfetti(particle: Particle): void {
    this.ctx.fillStyle = particle.color;
    
    // Alternar entre rectángulos y círculos para variedad
    if (parseInt(particle.id) % 2 === 0) {
      this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    } else {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Brillo
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private renderBubble(particle: Particle): void {
    // Burbuja principal
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    this.ctx.fill();

    // Brillo en la burbuja
    const gradient = this.ctx.createRadialGradient(
      -particle.size * 0.3, -particle.size * 0.3, 0,
      0, 0, particle.size
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    this.ctx.fill();

    // Contorno sutil
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private renderStar(particle: Particle): void {
    const alpha = particle.life;
    this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    
    // Dibujar estrella de 5 puntas
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * particle.size;
      const y = Math.sin(angle) * particle.size;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      const innerAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
      const innerX = Math.cos(innerAngle) * (particle.size * 0.4);
      const innerY = Math.sin(innerAngle) * (particle.size * 0.4);
      this.ctx.lineTo(innerX, innerY);
    }
    this.ctx.closePath();
    this.ctx.fill();

    // Brillo de estrella
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();
  }

  private renderPetal(particle: Particle): void {
    this.ctx.fillStyle = particle.color;
    this.ctx.beginPath();
    
    // Forma de pétalo más realista
    this.ctx.moveTo(0, -particle.size);
    this.ctx.quadraticCurveTo(particle.size * 0.8, -particle.size * 0.3, particle.size * 0.4, particle.size * 0.2);
    this.ctx.quadraticCurveTo(0, particle.size * 0.8, -particle.size * 0.4, particle.size * 0.2);
    this.ctx.quadraticCurveTo(-particle.size * 0.8, -particle.size * 0.3, 0, -particle.size);
    this.ctx.closePath();
    this.ctx.fill();

    // Gradiente sutil para más realismo
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    const baseColor = particle.color;
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, baseColor.replace(')', ', 0.7)').replace('rgb', 'rgba'));
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  private isParticleAlive(particle: Particle): boolean {
    const margin = 50;
    
    switch (this.currentType) {
      case 'bubbles':
        return particle.y > -margin;
      case 'stars':
        return true; // Las estrellas permanecen
      default:
        return particle.y < window.innerHeight + margin && 
               particle.x > -margin && 
               particle.x < window.innerWidth + margin;
    }
  }

  public setIntensity(intensity: number): void {
    this.particleCount = Math.max(10, Math.min(100, intensity * 10));
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(3, speed));
    
    // Actualizar velocidades de partículas existentes
    this.particles.forEach(particle => {
      const factor = this.speed / 1; // Normalizar respecto a velocidad base
      particle.vx = particle.vx * factor;
      particle.vy = particle.vy * factor;
    });
  }

  public getCurrentType(): ParticleType {
    return this.currentType;
  }

  public isAnimating(): boolean {
    return this.isRunning;
  }

  public destroy(): void {
    this.stopAnimation();
    window.removeEventListener('resize', () => this.resizeCanvas());
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}