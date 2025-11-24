// background.js - Service Worker CORREGIDO para Laravel 5.5

console.log('🔧 MP Automation Background Service iniciado');

class SimpleBackgroundService {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('✅ Background Service configurado');
    }

    setupEventListeners() {
        // Instalación de la extensión
        if (chrome.runtime.onInstalled) {
            chrome.runtime.onInstalled.addListener((details) => {
                this.handleInstallation(details);
            });
        }

        // Mensajes desde content scripts y popup
        if (chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                this.handleMessage(request, sender, sendResponse);
                return true; // Respuesta asíncrona
            });
        }

        // Cambios de pestañas
        if (chrome.tabs && chrome.tabs.onUpdated) {
            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                this.handleTabUpdate(tabId, changeInfo, tab);
            });
        }
    }

    handleInstallation(details) {
        console.log('📦 Extensión instalada/actualizada:', details.reason);
        
        if (details.reason === 'install') {
            this.showWelcomeNotification();
        }
    }

    showWelcomeNotification() {
        if (chrome.notifications) {
            chrome.notifications.create('welcome', {
                type: 'basic',
                title: 'MP Login Automation',
                message: '¡Extensión instalada! Inicia sesión en PharmaTender para comenzar.'
            });
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'ping':
                    sendResponse({ 
                        success: true, 
                        message: 'Background script activo',
                        timestamp: Date.now()
                    });
                    break;

                // ✅ CORREGIDO: Handler para peticiones API con CORS apropiado
                case 'API_REQUEST':
                    console.log('🌐 Background: Procesando petición API...', request);
                    const apiResult = await this.handleApiRequestFixed(request);
                    sendResponse(apiResult);
                    break;

                case 'checkExtensionStatus':
                    const status = await this.getExtensionStatus();
                    sendResponse(status);
                    break;

                case 'activateExtension':
                    await this.autoActivateExtension();
                    sendResponse({ success: true, message: 'Extensión activada' });
                    break;

                case 'openPopup':
                    console.log('📱 Solicitud de abrir popup desde content script');
                    sendResponse({ success: true });
                    break;

                case 'checkConnection':
                    const result = await this.checkPlatformConnection(request.platformUrl);
                    sendResponse(result);
                    break;

                case 'logActivity':
                    this.logActivity(request.message, request.type);
                    sendResponse({ success: true });
                    break;

                // ✅ CORREGIDO: Handler para downloadDocument
                case 'downloadDocument':
                    console.log('📥 Background: Iniciando descarga de documento...');
                    const downloadResult = await this.downloadDocumentFromPlatformFixed(request.url);
                    sendResponse(downloadResult);
                    break;

                case 'showNotification':
                    this.showNotification(request.title, request.message);
                    sendResponse({ success: true });
                    break;
               
                default:
                    console.warn('⚠️ Acción no reconocida:', request.action);
                    sendResponse({ success: false, error: 'Acción no reconocida: ' + request.action });
            }
        } catch (error) {
            console.error('❌ Error manejando mensaje en background:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    /**
     * ✅ CORREGIDO: Handler API específico para Laravel 5.5
     */
    async handleApiRequestFixed(request) {
        try {
            console.log('🌐 Procesando API Request CORREGIDO:', {
                url: request.url,
                method: request.method,
                data: request.data
            });

            // ✅ HEADERS ESPECÍFICOS PARA LARAVEL 5.5
            const requestOptions = {
                method: request.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    // ✅ AGREGAR: Headers específicos para CORS con Laravel
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                // ✅ CRÍTICO: credentials para mantener sesión Laravel
                credentials: 'include'
            };

            // ✅ AGREGAR: Obtener CSRF token si está disponible
            try {
                // Intentar obtener token CSRF de la página activa
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.url && tab.url.includes('pharmatender.cl')) {
                    // El token CSRF se manejará automáticamente por Laravel con credentials: 'include'
                    console.log('✅ Enviando request con credenciales incluidas para Laravel');
                }
            } catch (tokenError) {
                console.warn('⚠️ No se pudo obtener contexto de pestaña para CSRF');
            }

            // Agregar body para POST/PUT
            if (request.method === 'POST' || request.method === 'PUT') {
                requestOptions.body = JSON.stringify(request.data);
            }

            console.log('📡 Enviando fetch request a Laravel:', request.url);
            console.log('📡 Request options:', requestOptions);
            
            const response = await fetch(request.url, requestOptions);
            
            console.log('📨 Response status:', response.status);
            console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                // ✅ MEJORAR: Manejo específico de errores Laravel
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorText = await response.text();
                    console.error('❌ Response error body:', errorText);
                    
                    // Intentar parsear como JSON para obtener mensaje Laravel
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.message) {
                            errorMessage = errorJson.message;
                        } else if (errorJson.error) {
                            errorMessage = errorJson.error;
                        }
                    } catch (parseError) {
                        // Si no es JSON, usar el texto crudo
                        if (errorText.length < 200) {
                            errorMessage += ': ' + errorText;
                        }
                    }
                } catch (textError) {
                    console.error('❌ No se pudo leer error response:', textError);
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            console.log('✅ API Response exitosa desde Laravel:', data);
            
            return {
                success: true,
                data: data,
                status: response.status
            };

        } catch (error) {
            console.error('❌ Error en API Request:', error);
            
            // ✅ MEJORAR: Detalles específicos del error
            let errorDetails = {
                url: request.url,
                method: request.method,
                originalError: error.toString()
            };

            // Agregar contexto específico del error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorDetails.likely_cause = 'Network error o CORS issue';
                errorDetails.suggestion = 'Verificar que Laravel esté corriendo y CORS configurado';
            } else if (error.message.includes('401')) {
                errorDetails.likely_cause = 'Not authenticated';
                errorDetails.suggestion = 'Usuario no logueado en Laravel';
            } else if (error.message.includes('403')) {
                errorDetails.likely_cause = 'Forbidden - CSRF token issue';
                errorDetails.suggestion = 'Problema con token CSRF de Laravel';
            } else if (error.message.includes('419')) {
                errorDetails.likely_cause = 'CSRF token mismatch';
                errorDetails.suggestion = 'Token CSRF expirado en Laravel';
            }
            
            return {
                success: false,
                error: error.message,
                details: errorDetails
            };
        }
    }

    /**
     * ✅ CORREGIDO: Download específico para Laravel 5.5
     */
    async downloadDocumentFromPlatformFixed(documentUrl) {
        try {
            console.log('📥 Background: Descargando documento desde Laravel:', documentUrl);
            
            // ✅ VALIDAR URL antes de hacer fetch
            try {
                new URL(documentUrl);
                console.log(`✅ URL válida: ${documentUrl}`);
            } catch (urlValidationError) {
                console.error(`❌ URL inválida: ${documentUrl}`, urlValidationError);
                return {
                    success: false,
                    error: `URL malformada: ${documentUrl}`
                };
            }
            
            // ✅ REQUEST ESPECÍFICO PARA LARAVEL con timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(documentUrl, {
                method: 'GET',
                credentials: 'include', // ✅ CRÍTICO para Laravel
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log(`📡 Background: Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Background: Error HTTP ${response.status}:`, errorText);
                
                return {
                    success: false,
                    error: `Error HTTP: ${response.status} - ${response.statusText}`,
                    details: errorText.substring(0, 500)
                };
            }

            // ✅ VALIDAR Content-Type
            const contentType = response.headers.get('Content-Type') || '';
            console.log(`📡 Background: Content-Type: ${contentType}`);
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('❌ Background: Error parseando JSON:', parseError);
                const textResponse = await response.text();
                return {
                    success: false,
                    error: 'Respuesta no es JSON válido',
                    details: textResponse.substring(0, 500)
                };
            }
            
            console.log('✅ Background: Documento descargado exitosamente desde Laravel');
            
            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('❌ Background: Error descargando documento:', error);
            
            let errorMessage = error.message;
            
            if (error.name === 'AbortError') {
                errorMessage = 'Timeout descargando documento (30s)';
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Error de red - Verificar conexión a Laravel';
            }
            
            return {
                success: false,
                error: errorMessage,
                details: error.stack
            };
        }
    }

    async checkPlatformConnection(platformUrl) {
        try {
            const response = await fetch(`${platformUrl}/api/extension/ping`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            return {
                success: response.ok,
                status: response.status,
                message: response.ok ? 'Conexión exitosa' : 'Error de conexión'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
            this.analyzeTab(tab);
        }
    }

    analyzeTab(tab) {
        try {
            const url = new URL(tab.url);
            
            if (url.hostname.includes('pharmatender.cl') || url.hostname === 'localhost') {
                this.updateBadge(tab.id, '🏢', '#28a745', 'PharmaTender detectado');
            } else if (url.hostname.includes('mercadopublico.cl')) {
                this.updateBadge(tab.id, '🏛️', '#17a2b8', 'Mercado Público detectado');
            } else if (url.hostname.includes('claveunica.gob.cl')) {
                this.updateBadge(tab.id, '🗝️', '#ffc107', 'Clave Única detectado');
            } else {
                this.clearBadge(tab.id);
            }
        } catch (error) {
            console.warn('Error analizando pestaña:', error);
        }
    }

    async updateBadge(tabId, text, color, title) {
        try {
            if (chrome.action) {
                await chrome.action.setBadgeText({ text, tabId });
                await chrome.action.setBadgeBackgroundColor({ color, tabId });
                await chrome.action.setTitle({ title, tabId });
            }
        } catch (error) {
            console.warn('Error actualizando badge:', error);
        }
    }

    async clearBadge(tabId) {
        try {
            if (chrome.action) {
                await chrome.action.setBadgeText({ text: '', tabId });
                await chrome.action.setTitle({ title: 'MP Login Automation', tabId });
            }
        } catch (error) {
            console.warn('Error limpiando badge:', error);
        }
    }

    logActivity(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`📝 [${timestamp}] ${type.toUpperCase()}: ${message}`);
    }

    showNotification(title, message, type = 'basic') {
        if (chrome.notifications) {
            const notificationId = `notification_${Date.now()}`;
            
            chrome.notifications.create(notificationId, {
                type: 'basic',
                title: title,
                message: message
            });
            
            setTimeout(() => {
                chrome.notifications.clear(notificationId);
            }, 5000);
        }
    }
}

// Inicializar service worker
const backgroundService = new SimpleBackgroundService();