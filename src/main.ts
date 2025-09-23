
// src/main.ts - Archivo principal de la aplicación

import { Roulette } from './components/Roulette';
import './styles/main.css';
import './styles/vegas-marquee.css';

class App {
  private roulette: Roulette | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      console.log('🎰 Iniciando Aplicación de Ruleta de Premios...');
      
      // Esperar a que el DOM esté listo
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Verificar compatibilidad del navegador
      this.checkBrowserCompatibility();

      // Obtener contenedor principal
      const container = document.getElementById('app');
      if (!container) {
        throw new Error('Contenedor de aplicación no encontrado');
      }

      // Mostrar pantalla de carga
      this.showLoadingScreen(container);

      // Pequeña pausa para mostrar la pantalla de carga
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Inicializar componente principal
      this.roulette = new Roulette(container);

      // Configurar listeners globales
      this.setupGlobalListeners();

      // Registrar Service Worker (PWA)
      this.registerServiceWorker();

      this.isInitialized = true;
      console.log('✅ Aplicación inicializada correctamente');

      // Mostrar mensaje de bienvenida
      this.showWelcomeMessage();

    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error);
      this.showErrorScreen(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  private checkBrowserCompatibility(): void {
    const requiredFeatures = [
      { name: 'Canvas', test: () => !!document.createElement('canvas').getContext },
      { name: 'LocalStorage', test: () => typeof Storage !== 'undefined' },
      { name: 'AudioContext', test: () => !!(window.AudioContext || (window as any).webkitAudioContext) },
      { name: 'FileReader', test: () => typeof FileReader !== 'undefined' },
      { name: 'Promises', test: () => typeof Promise !== 'undefined' },
      { name: 'Arrow Functions', test: () => { try { eval('() => {}'); return true; } catch { return false; } } },
      { name: 'ES6 Classes', test: () => { try { eval('class Test {}'); return true; } catch { return false; } } }
    ];

    const unsupportedFeatures = requiredFeatures.filter(feature => !feature.test());
    
    if (unsupportedFeatures.length > 0) {
      const message = `Tu navegador no soporta las siguientes características requeridas:\n${unsupportedFeatures.map(f => f.name).join(', ')}\n\nPor favor actualiza tu navegador o usa Chrome/Firefox/Safari/Edge modernos.`;
      throw new Error(message);
    }

    console.log('✅ Todas las características del navegador son compatibles');
  }

  private showLoadingScreen(container: HTMLElement): void {
    container.innerHTML = `
      <div class="loading-screen" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: Arial, sans-serif;
      ">
        <div class="loading-logo" style="
          font-size: 4rem;
          margin-bottom: 2rem;
          animation: bounce 2s infinite;
        ">🎰</div>
        
        <h1 style="
          font-size: 2.5rem;
          margin-bottom: 1rem;
          text-align: center;
        ">Ruleta de Premios</h1>
        
        <p style="
          font-size: 1.2rem;
          margin-bottom: 3rem;
          text-align: center;
          opacity: 0.9;
        ">Cargando aplicación...</p>
        
        <div class="loading-spinner" style="
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        "></div>
      </div>
      
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-30px); }
          60% { transform: translateY(-15px); }
        }
      </style>
    `;
  }

  private showErrorScreen(message: string): void {
    const container = document.getElementById('app');
    if (!container) return;

    container.innerHTML = `
      <div class="error-screen" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 2rem;
      ">
        <div style="font-size: 4rem; margin-bottom: 2rem;">❌</div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Error de Inicialización</h1>
        <p style="font-size: 1.2rem; margin-bottom: 2rem; max-width: 600px; line-height: 1.6;">
          ${message}
        </p>
        <button onclick="location.reload()" style="
          padding: 12px 24px;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 2px solid white;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
           onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          🔄 Reintentar
        </button>
      </div>
    `;
  }

  private setupGlobalListeners(): void {
    // Prevenir zoom con Ctrl/Cmd + scroll
    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevenir zoom con gestos táctiles
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // Prevenir menú contextual en canvas
    document.addEventListener('contextmenu', (e) => {
      if ((e.target as HTMLElement).tagName === 'CANVAS') {
        e.preventDefault();
      }
    });

    // Manejar cambios de orientación en móviles
    if ('orientation' in screen) {
      screen.orientation.addEventListener('change', () => {
        // Pequeña pausa para que el navegador termine el cambio de orientación
        setTimeout(() => {
          this.handleOrientationChange();
        }, 100);
      });
    }

    // Manejar cambio de tamaño de ventana
    let resizeTimeout: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.handleWindowResize();
      }, 250);
    });

    // Manejar visibilidad de la página (para pausar animaciones cuando no está visible)
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Manejar errores no capturados
    window.addEventListener('error', (e) => {
      console.error('Error no capturado:', e.error);
      this.handleUnexpectedError(e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Promise rechazada no manejada:', e.reason);
      this.handleUnexpectedError(e.reason);
    });

    console.log('🔧 Listeners globales configurados');
  }

  private handleOrientationChange(): void {
    if (this.roulette) {
      console.log('📱 Cambio de orientación detectado');
      // La aplicación se redimensionará automáticamente con CSS responsive
      // Aquí podríamos agregar lógica adicional si es necesaria
    }
  }

  private handleWindowResize(): void {
    if (this.roulette) {
      console.log('🔄 Redimensionamiento de ventana');
      // El canvas se redimensionará automáticamente
      // Las animaciones se ajustarán con CSS responsive
    }
  }

  private handleVisibilityChange(): void {
    if (!this.roulette) return;

    if (document.hidden) {
      console.log('⏸️ Página oculta - pausando animaciones');
      // Pausar animaciones costosas cuando la página no está visible
    } else {
      console.log('▶️ Página visible - reanudando animaciones');
      // Reanudar animaciones
    }
  }

  private handleUnexpectedError(error: any): void {
    // No mostrar modal de error para errores menores
    const minorErrors = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Loading chunk'
    ];

    const errorMessage = String(error);
    const isMinorError = minorErrors.some(minor => errorMessage.includes(minor));

    if (isMinorError) {
      console.warn('Error menor ignorado:', error);
      return;
    }

    // Para errores importantes, mostrar notificación discreta
    this.showErrorNotification(`Error inesperado: ${errorMessage}`);
  }

  private showErrorNotification(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
      cursor: pointer;
      transition: opacity 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <span>⚠️</span>
        <div>
          <strong>Error</strong><br>
          ${message}
        </div>
      </div>
    `;

    notification.onclick = () => notification.remove();
    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration.scope);

        // Manejar actualizaciones del Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailableNotification();
              }
            });
          }
        });

      } catch (error) {
        console.warn('⚠️ Error registrando Service Worker:', error);
      }
    } else {
      console.log('ℹ️ Service Worker no soportado');
    }
  }

  private showUpdateAvailableNotification(): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #3498db;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-size: 14px;
      line-height: 1.4;
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>🆕 Actualización disponible</strong><br>
        Hay una nueva versión de la aplicación
      </div>
      <button onclick="location.reload()" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
      ">Actualizar</button>
      <button onclick="this.closest('div').remove()" style="
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Después</button>
    `;

    document.body.appendChild(notification);
  }

  private showWelcomeMessage(): void {
    // Solo mostrar mensaje de bienvenida la primera vez
    const hasShownWelcome = localStorage.getItem('roulette-welcome-shown');
    
    if (!hasShownWelcome) {
      setTimeout(() => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal">
            <h2>🎉 ¡Bienvenido a Ruleta de Premios!</h2>
            <div style="text-align: left; margin: 20px 0; line-height: 1.6;">
              <p><strong>Para comenzar:</strong></p>
              <ol>
                <li>📁 Carga un archivo Excel con premios y participantes</li>
                <li>⚙️ Configura la aplicación (Alt + C)</li>
                <li>🎯 ¡Presiona ESPACIO para girar!</li>
              </ol>
              
              <p style="margin-top: 20px;"><strong>Controles:</strong></p>
              <ul>
                <li><kbd>ESPACIO</kbd> - Girar la ruleta</li>
                <li><kbd>Alt + C</kbd> - Abrir configuración</li>
              </ul>
            </div>
            <div style="margin-top: 20px;">
              <button class="control-button" onclick="this.closest('.modal-overlay').remove()">¡Entendido!</button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);
        localStorage.setItem('roulette-welcome-shown', 'true');
      }, 1500);
    }
  }

  // Métodos públicos para debugging/testing
  public getRoulette(): Roulette | null {
    return this.roulette;
  }

  public restart(): void {
    if (this.roulette) {
      this.roulette.destroy();
    }
    location.reload();
  }

  public getDebugInfo(): object {
    return {
      initialized: this.isInitialized,
      roulette: this.roulette ? {
        state: this.roulette.getCurrentState(),
        participants: this.roulette.getParticipants().length,
        prizes: this.roulette.getPrizes().length,
        config: this.roulette.getConfig()
      } : null,
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      },
      screen: {
        width: screen.width,
        height: screen.height,
        orientation: screen.orientation?.type || 'unknown'
      },
      performance: {
        memory: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
        } : 'not available'
      }
    };
  }
}

// Crear instancia global de la aplicación
declare global {
  interface Window {
    rouletteApp: App;
  }
}

// Inicializar aplicación
const app = new App();
window.rouletteApp = app;

// Exportar para módulos ES6
export default app;