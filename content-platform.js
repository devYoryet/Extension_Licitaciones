// content-platform.js - Detector de licitaciones en PharmaTender

class PlatformLicitacionDetector {
    constructor() {
        this.userInfo = null;
        this.isAuthenticated = false;
        this.licitacionesDetectadas = [];
        
        console.log('🏢 Platform Licitacion Detector cargado en:', window.location.href);
        this.init();
    }
    
    init() {
        this.detectAuthenticationState();
        this.detectLicitacionesPage();
        this.addPlatformIndicator();
        this.setupMessageListener();
    }
    
    detectAuthenticationState() {
        try {
            // Verificar elementos DOM que indican autenticación
            const userMenus = [
                '.user-menu',
                '.navbar-nav .dropdown',
                '[data-user]',
                '.user-info',
                '#user-dropdown',
                '.user-name'
            ];
            
            let userElement = null;
            for (const selector of userMenus) {
                userElement = document.querySelector(selector);
                if (userElement) break;
            }
            
            // Buscar información de usuario en el DOM
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
            
            // Verificar presencia de token CSRF
            const csrfToken = document.querySelector('meta[name="csrf-token"]');
            
            // Verificar si NO estamos en login page
            const isLoginPage = window.location.href.includes('/login') || 
                               window.location.pathname === '/login';
            
            this.isAuthenticated = !isLoginPage && (userElement || userName || csrfToken);
            
            if (this.isAuthenticated) {
                this.userInfo = {
                    name: userName || 'Usuario autenticado',
                    hasMenu: !!userElement,
                    hasCsrf: !!csrfToken
                };
                
                console.log('✅ Usuario autenticado detectado:', this.userInfo);
            } else {
                console.log('❌ Usuario no autenticado o en página de login');
            }
            
        } catch (error) {
            console.error('❌ Error detectando autenticación:', error);
            this.isAuthenticated = false;
        }
    }

    detectLicitacionesPage() {
        // Detectar si estamos en una página relacionada con licitaciones
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;
        
        // Patrones de URLs relacionadas con licitaciones
        const licitacionPatterns = [
            '/licitaciones',
            '/licitacion/',
            '/tender/',
            '/bid/',
            '/procurement/',
            'licitacion'
        ];
        
        const isLicitacionPage = licitacionPatterns.some(pattern => 
            currentUrl.includes(pattern) || currentPath.includes(pattern)
        );
        
        if (isLicitacionPage) {
            console.log('📋 Página de licitaciones detectada');
            this.scanForLicitaciones();
        }
    }

    scanForLicitaciones() {
        // Buscar licitaciones en la página actual
        try {
            const licitacionSelectors = [
                '[data-licitacion-id]',
                '.licitacion-item',
                '.tender-item',
                '.bid-item',
                'tr[data-id]', // Filas de tabla con ID
                '.card[data-licitacion]'
            ];
            
            const licitaciones = [];
            
            for (const selector of licitacionSelectors) {
                const elements = document.querySelectorAll(selector);
                
                elements.forEach(element => {
                    const id = element.dataset.licitacionId || 
                              element.dataset.id ||
                              element.dataset.licitacion ||
                              element.getAttribute('data-id');
                    
                    if (id) {
                        const nombre = this.extractLicitacionName(element);
                        const estado = this.extractLicitacionState(element);
                        
                        licitaciones.push({
                            id: id,
                            nombre: nombre,
                            estado: estado,
                            element: element
                        });
                    }
                });
            }
            
            this.licitacionesDetectadas = licitaciones;
            
            if (licitaciones.length > 0) {
                console.log(`📋 ${licitaciones.length} licitaciones detectadas:`, licitaciones);
                this.addLicitacionActions();
            }
            
        } catch (error) {
            console.error('❌ Error escaneando licitaciones:', error);
        }
    }

    extractLicitacionName(element) {
        const nameSelectors = [
            '.licitacion-nombre',
            '.tender-name',
            '.title',
            'h3',
            'h4',
            '.name',
            'td:nth-child(2)', // Segunda columna en tabla
            '.card-title'
        ];
        
        for (const selector of nameSelectors) {
            const nameElement = element.querySelector(selector);
            if (nameElement && nameElement.textContent.trim()) {
                return nameElement.textContent.trim();
            }
        }
        
        return 'Licitación sin nombre';
    }

    extractLicitacionState(element) {
        const stateSelectors = [
            '.estado',
            '.state',
            '.status',
            '.badge',
            '.label'
        ];
        
        for (const selector of stateSelectors) {
            const stateElement = element.querySelector(selector);
            if (stateElement && stateElement.textContent.trim()) {
                return stateElement.textContent.trim();
            }
        }
        
        return 'Estado desconocido';
    }

    addLicitacionActions() {
        // Agregar botones de automatización a cada licitación
        this.licitacionesDetectadas.forEach(licitacion => {
            this.addAutomationButton(licitacion);
        });
    }

    addAutomationButton(licitacion) {
        // Evitar duplicados
        if (licitacion.element.querySelector('.automation-button')) {
            return;
        }
        
        const button = document.createElement('button');
        button.className = 'automation-button';
        button.innerHTML = `
            <span style="margin-right: 5px;">🤖</span>
            Automatizar
        `;
        
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            margin: 5px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        });
        
        button.addEventListener('click', () => {
            this.startLicitacionAutomation(licitacion);
        });
        
        // Insertar el botón en un lugar apropiado del elemento
        const actionContainer = licitacion.element.querySelector('.actions') ||
                               licitacion.element.querySelector('.buttons') ||
                               licitacion.element;
        
        if (actionContainer) {
            actionContainer.appendChild(button);
        }
    }

    async startLicitacionAutomation(licitacion) {
        try {
            console.log('🚀 Iniciando automatización para licitación:', licitacion.id);
            
            // Deshabilitar botón temporalmente
            const button = licitacion.element.querySelector('.automation-button');
            if (button) {
                button.disabled = true;
                button.textContent = '⏳ Procesando...';
            }
            
            // Enviar mensaje al background script para iniciar automatización
            const response = await chrome.runtime.sendMessage({
                action: 'startLicitacionAutomation',
                licitacionId: licitacion.id,
                licitacionData: {
                    id: licitacion.id,
                    nombre: licitacion.nombre,
                    estado: licitacion.estado
                }
            });
            
            if (response && response.success) {
                console.log('✅ Automatización iniciada exitosamente');
                
                if (button) {
                    button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                    button.textContent = '✅ Iniciada';
                }
                
                // Mostrar notificación
                this.showNotification('Automatización iniciada', 'success');
                
            } else {
                console.error('❌ Error iniciando automatización:', response);
                
                if (button) {
                    button.disabled = false;
                    button.innerHTML = '<span style="margin-right: 5px;">🤖</span>Automatizar';
                }
                
                this.showNotification('Error iniciando automatización', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error en startLicitacionAutomation:', error);
            this.showNotification('Error en automatización', 'error');
        }
    }

    addPlatformIndicator() {
        // Solo mostrar indicador si estamos autenticados
        if (!this.isAuthenticated) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'pharmatender-licitacion-indicator';
        
        const licitacionCount = this.licitacionesDetectadas.length;
        const indicatorText = licitacionCount > 0 ? 
            `🤖 Extensión Lista (${licitacionCount} licitaciones)` :
            '🤖 Extensión Licitaciones Lista';
        
        indicator.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 18px;
                border-radius: 25px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                opacity: 0.9;
                max-width: 250px;
            " onmouseover="this.style.opacity='1'; this.style.transform='scale(1.05)';" 
               onmouseout="this.style.opacity='0.9'; this.style.transform='scale(1)';">
                <span>${indicatorText}</span>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Click para abrir popup de extensión
        indicator.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
        });
        
        // Auto-fade después de 8 segundos
        setTimeout(() => {
            if (indicator) {
                indicator.style.opacity = '0.6';
                indicator.style.transform = 'scale(0.9)';
            }
        }, 8000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pharmatender-notification notification-${type}`;
        
        const colors = {
            success: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            error: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            info: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
            warning: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)'
        };
        
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                background: ${colors[type] || colors.info};
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                max-width: 300px;
                animation: slideInNotification 0.3s ease-out;
            ">
                ${message}
            </div>
            <style>
                @keyframes slideInNotification {
                    from { opacity: 0; transform: translateX(100px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove después de 4 segundos
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'getAuthStatus':
                    sendResponse({
                        authenticated: this.isAuthenticated,
                        userInfo: this.userInfo,
                        url: window.location.href,
                        licitacionesDetectadas: this.licitacionesDetectadas.length
                    });
                    break;
                    
                case 'refreshAuthStatus':
                    this.detectAuthenticationState();
                    this.detectLicitacionesPage();
                    sendResponse({
                        authenticated: this.isAuthenticated,
                        userInfo: this.userInfo,
                        licitacionesDetectadas: this.licitacionesDetectadas.length
                    });
                    break;

                case 'getLicitacionData':
                    const licitacion = this.licitacionesDetectadas.find(l => 
                        l.id === request.licitacionId
                    );
                    
                    if (licitacion) {
                        sendResponse({
                            success: true,
                            licitacion: licitacion
                        });
                    } else {
                        sendResponse({
                            success: false,
                            error: 'Licitación no encontrada'
                        });
                    }
                    break;
                    
                default:
                    sendResponse({ error: 'Acción no reconocida' });
            }
        });
    }
}

// ================================
// INICIALIZACIÓN
// ================================

let platformLicitacionDetector = null;

// Esperar a que el DOM se cargue completamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlatformDetector);
} else {
    initializePlatformDetector();
}

function initializePlatformDetector() {
    try {
        platformLicitacionDetector = new PlatformLicitacionDetector();
        console.log('✅ Platform Licitacion Detector inicializado');
    } catch (error) {
        console.error('❌ Error inicializando Platform Licitacion Detector:', error);
    }
}

// Re-escanear cuando cambie la página (para SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('📍 URL cambió, re-escaneando...');
        
        setTimeout(() => {
            if (platformLicitacionDetector) {
                platformLicitacionDetector.detectLicitacionesPage();
            }
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });