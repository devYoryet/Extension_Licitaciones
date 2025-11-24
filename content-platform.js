// content-platform.js - Detector de licitaciones en PharmaTender (SIMPLIFICADO)

class PlatformLicitacionDetector {
    constructor() {
        this.userInfo = null;
        this.isAuthenticated = false;
        this.currentLicitacionId = null;

        console.log('🏢 Platform Licitacion Detector cargado en:', window.location.href);
        this.init();
    }

    init() {
        this.detectAuthenticationState();
        this.detectLicitacionPage();
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

    detectLicitacionPage() {
        const currentPath = window.location.pathname;

        // SOLO detectar en páginas específicas de carga de documentos
        const isCargaDocumentosPage = currentPath.includes('/carga-documentos/');

        if (isCargaDocumentosPage) {
            console.log('📋 Página de carga de documentos detectada');

            // Extraer ID de licitación de la URL
            const match = currentPath.match(/\/carga-documentos\/([^\/]+)/);
            if (match && match[1]) {
                this.currentLicitacionId = match[1];
                console.log('🎯 ID de licitación extraído:', this.currentLicitacionId);

                // Agregar botón de automatización y indicador
                this.addAutomationButton();
                this.addInfoIndicator();
            }
        } else {
            console.log('ℹ️ No es una página de carga de documentos, extensión en espera');
        }
    }

    addAutomationButton() {
        // Evitar duplicados
        const existingButton = document.getElementById('pht-automation-btn');
        if (existingButton) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'pht-automation-btn';
        button.innerHTML = `
            <span style="margin-right: 8px; font-size: 18px;">🤖</span>
            <span>Automatizar Licitación</span>
        `;

        button.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 16px 24px;
            border-radius: 50px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            z-index: 9998;
            display: flex;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-4px) scale(1.05)';
            button.style.boxShadow = '0 12px 28px rgba(102, 126, 234, 0.6)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
        });

        button.addEventListener('click', () => {
            this.startLicitacionAutomation();
        });

        document.body.appendChild(button);
        console.log('✅ Botón de automatización agregado');
    }

    addInfoIndicator() {
        // Evitar duplicados
        const existingIndicator = document.getElementById('pht-info-indicator');
        if (existingIndicator) {
            return;
        }

        const indicator = document.createElement('div');
        indicator.id = 'pht-info-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                color: white;
                padding: 12px 18px;
                border-radius: 12px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
                z-index: 9997;
                max-width: 280px;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.05)';"
               onmouseout="this.style.transform='scale(1)';">
                <div style="font-size: 11px; opacity: 0.9; margin-bottom: 4px;">Extensión PharmaTender</div>
                <div style="font-size: 14px; font-weight: 600;">📋 ${this.currentLicitacionId}</div>
            </div>
        `;

        document.body.appendChild(indicator);

        // Click para abrir popup de extensión
        indicator.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' }).catch(() => {
                console.log('No se pudo abrir popup');
            });
        });

        console.log('✅ Indicador de información agregado');
    }

    async startLicitacionAutomation() {
        try {
            console.log('🚀 Iniciando automatización para licitación:', this.currentLicitacionId);

            // Actualizar botón
            const button = document.getElementById('pht-automation-btn');
            if (button) {
                button.disabled = true;
                button.innerHTML = '<span style="margin-right: 8px;">⏳</span><span>Iniciando...</span>';
                button.style.cursor = 'not-allowed';
                button.style.opacity = '0.7';
            }

            // Enviar mensaje al background script para iniciar automatización
            const response = await chrome.runtime.sendMessage({
                action: 'startLicitacionAutomation',
                licitacionId: this.currentLicitacionId,
                licitacionData: {
                    id: this.currentLicitacionId,
                    url: window.location.href
                }
            });

            console.log('📨 Respuesta del background:', response);

            if (response && response.success) {
                console.log('✅ Automatización iniciada exitosamente');

                if (button) {
                    button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100())';
                    button.innerHTML = '<span style="margin-right: 8px;">✅</span><span>Automatización Iniciada</span>';
                }

                this.showNotification('✅ Automatización iniciada correctamente', 'success');

            } else {
                const errorMsg = response?.error || 'Error desconocido';
                console.error('❌ Error iniciando automatización:', errorMsg);

                if (button) {
                    button.disabled = false;
                    button.innerHTML = '<span style="margin-right: 8px;">🤖</span><span>Automatizar Licitación</span>';
                    button.style.cursor = 'pointer';
                    button.style.opacity = '1';
                }

                this.showNotification('❌ Error: ' + errorMsg, 'error');
            }

        } catch (error) {
            console.error('❌ Error en startLicitacionAutomation:', error);

            const button = document.getElementById('pht-automation-btn');
            if (button) {
                button.disabled = false;
                button.innerHTML = '<span style="margin-right: 8px;">🤖</span><span>Automatizar Licitación</span>';
                button.style.cursor = 'pointer';
                button.style.opacity = '1';
            }

            this.showNotification('❌ Error al iniciar automatización', 'error');
        }
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
                max-width: 350px;
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

        // Auto-remove después de 5 segundos
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
        }, 5000);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('📨 Mensaje recibido en platform detector:', message);

            switch (message.action) {
                case 'getPageInfo':
                    sendResponse({
                        success: true,
                        data: {
                            authenticated: this.isAuthenticated,
                            licitacionId: this.currentLicitacionId,
                            userInfo: this.userInfo,
                            url: window.location.href
                        }
                    });
                    return false;

                case 'showNotification':
                    this.showNotification(message.message, message.type || 'info');
                    sendResponse({ success: true });
                    return false;

                default:
                    console.log('⚠️ Acción no reconocida:', message.action);
                    sendResponse({ success: false, error: 'Acción no reconocida' });
                    return false;
            }
        });

        console.log('✅ Message listener configurado');
    }
}

// Inicializar detector cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.platformLicitacionDetector = new PlatformLicitacionDetector();
    });
} else {
    window.platformLicitacionDetector = new PlatformLicitacionDetector();
}

console.log('✅ content-platform.js cargado completamente');
