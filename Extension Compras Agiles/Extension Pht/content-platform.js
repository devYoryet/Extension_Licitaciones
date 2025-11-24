// content-platform.js - Detector de estado en la plataforma PharmatTender

class PlatformDetector {
    constructor() {
        this.userInfo = null;
        this.isAuthenticated = false;
        this.init();
        
        console.log('🏢 Platform Detector cargado en:', window.location.href);
    }
    
    init() {
        this.detectAuthenticationState();
        this.addPlatformIndicator();
        this.setupMessageListener();
    }
    
    detectAuthenticationState() {
        try {
            // Método 1: Verificar elementos DOM que indican autenticación
            const userMenus = [
                '.user-menu',
                '.navbar-nav .dropdown',
                '[data-user]',
                '.user-info',
                '#user-dropdown'
            ];
            
            let userElement = null;
            for (const selector of userMenus) {
                userElement = document.querySelector(selector);
                if (userElement) break;
            }
            
            // Método 2: Buscar información de usuario en el DOM
            const userNameElements = [
                '.user-name',
                '.username',
                '[data-username]',
                '.navbar-text',
                '.welcome-text'
            ];
            
            let userName = null;
            for (const selector of userNameElements) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    userName = element.textContent.trim();
                    break;
                }
            }
            
            // Método 3: Verificar presencia de token CSRF (indica sesión activa)
            const csrfToken = document.querySelector('meta[name="csrf-token"]');
            
            // Método 4: Verificar URL - si estamos en login page, no estamos autenticados
            const isLoginPage = window.location.href.includes('/login') || 
                               window.location.pathname === '/login';
            
            // Determinar estado de autenticación
            this.isAuthenticated = !isLoginPage && (userElement || userName || csrfToken);
            
            if (this.isAuthenticated) {
                this.userInfo = {
                    name: userName || 'Usuario autenticado',
                    hasMenu: !!userElement,
                    hasCsrf: !!csrfToken
                };
                
                console.log('✅ Usuario autenticado detectado:', this.userInfo);
            } else {
                console.log('❌ Usuario no autenticado');
            }
            
        } catch (error) {
            console.error('Error detectando autenticación:', error);
            this.isAuthenticated = false;
        }
    }
    
    addPlatformIndicator() {
        // Solo mostrar indicador si estamos autenticados
        if (!this.isAuthenticated) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'pharmatender-extension-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 10px 15px;
                border-radius: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 12px;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                opacity: 0.9;
            " onmouseover="this.style.opacity='1'; this.style.transform='scale(1.05)';" 
               onmouseout="this.style.opacity='0.9'; this.style.transform='scale(1)';">
                <span>🤖</span>
                <span>Extensión MP Lista</span>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Click para abrir popup de extensión
        indicator.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
        });
        
        // Auto-hide después de 5 segundos
        setTimeout(() => {
            if (indicator) {
                indicator.style.opacity = '0.6';
                indicator.style.transform = 'scale(0.9)';
            }
        }, 5000);
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getAuthStatus':
                    sendResponse({
                        authenticated: this.isAuthenticated,
                        userInfo: this.userInfo,
                        url: window.location.href
                    });
                    break;
                    
                case 'refreshAuthStatus':
                    this.detectAuthenticationState();
                    sendResponse({
                        authenticated: this.isAuthenticated,
                        userInfo: this.userInfo
                    });
                    break;
                    
                default:
                    sendResponse({ error: 'Acción no reconocida' });
            }
        });
    }
    
    // Método para inyectar botón de automatización en páginas específicas
    injectAutomationButton() {
        // Buscar si estamos en una página de cotización
        const cotizationPage = window.location.href.includes('carga-documentos-ca') ||
                              window.location.href.includes('cotizacion');
        
        if (!cotizationPage) return;
        
        // Buscar contenedor donde insertar el botón
        const containers = [
            '.card-body',
            '.panel-body',
            '.content',
            '.main-content'
        ];
        
        let container = null;
        for (const selector of containers) {
            container = document.querySelector(selector);
            if (container) break;
        }
        
        if (!container) return;
        
        // Crear botón de automatización
        const automationSection = document.createElement('div');
        automationSection.className = 'mp-automation-section';
        automationSection.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            ">
                <h4 style="margin: 0 0 15px 0;">🤖 Automatización Mercado Público</h4>
                <p style="margin: 0 0 15px 0; opacity: 0.9;">
                    Extensión detectada y lista para automatizar el login en Mercado Público
                </p>
                <button id="start-mp-automation" style="
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    🚀 Iniciar Automatización MP
                </button>
            </div>
        `;
        
        container.insertBefore(automationSection, container.firstChild);
        
        // Event listener para el botón
        document.getElementById('start-mp-automation').addEventListener('click', () => {
            this.startMPAutomation();
        });
    }
    
    async startMPAutomation() {
        try {
            console.log('🚀 Iniciando automatización MP desde plataforma');
            
            // Abrir nueva pestaña con MP
            const mpTab = await chrome.tabs.create({ 
                url: 'https://www.mercadopublico.cl',
                active: true 
            });
            
            // Mostrar notificación en la plataforma
            this.showNotification('Automatización iniciada en nueva pestaña', 'success');
            
        } catch (error) {
            console.error('Error iniciando automatización:', error);
            this.showNotification('Error iniciando automatización: ' + error.message, 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            animation: slideDown 0.3s ease-out;
        `;
        
        // Agregar animación CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove después de 4 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideDown 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }
}

// Inicializar detector
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PlatformDetector();
    });
} else {
    new PlatformDetector();
}

// Detectar cambios de página en SPAs
let currentUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('📍 Cambio de página detectado:', currentUrl);
        
        // Re-detectar autenticación en nueva página
        setTimeout(() => {
            new PlatformDetector();
        }, 1000);
    }
}, 1000);