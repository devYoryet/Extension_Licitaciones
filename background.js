// background.js - Background script para automatización de licitaciones

class LicitacionBackgroundManager {
    constructor() {
        this.activeAutomations = new Map();
        this.config = null;
        this.credentialManager = null;
        
        console.log('🔧 Licitacion Background Manager iniciado');
        this.init();
    }
    
    async init() {
        try {
            await this.loadConfiguration();
            this.setupEventListeners();
            this.setupAlarms();
            
            console.log('✅ Background Manager configurado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Background Manager:', error);
        }
    }
    
    async loadConfiguration() {
        try {
            // Cargar configuración desde storage o usar valores por defecto
            const stored = await chrome.storage.local.get(['licitacionConfig']);
            
            if (stored.licitacionConfig) {
                this.config = stored.licitacionConfig;
            } else {
                // Configuración por defecto
                this.config = {
                    autoLogin: true,
                    notificaciones: true,
                    timeout: 30000,
                    retryAttempts: 3,
                    debugMode: false
                };
                
                await chrome.storage.local.set({ licitacionConfig: this.config });
            }
            
            console.log('⚙️ Configuración cargada:', this.config);
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
        }
    }
    
    setupEventListeners() {
        // Listener para mensajes de content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Mantener canal abierto para respuestas asíncronas
        });
        
        // Listener para cambios en tabs
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });
        
        // Listener para cerrar tabs
        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            this.handleTabClosed(tabId);
        });
        
        // Listener para instalación/actualización de extensión
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleExtensionInstalled(details);
        });
        
        // Listener para startup de Chrome
        chrome.runtime.onStartup.addListener(() => {
            console.log('🚀 Chrome iniciado, reinicializando Background Manager');
            this.init();
        });
    }
    
    setupAlarms() {
        // Crear alarma para limpiar automatizaciones caducas
        chrome.alarms.create('cleanupAutomations', {
            delayInMinutes: 5,
            periodInMinutes: 10
        });
        
        // Crear alarma para verificar estado de licitaciones
        chrome.alarms.create('checkLicitacionStatus', {
            delayInMinutes: 1,
            periodInMinutes: 5
        });
        
        // Listener para alarmas
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
    }
    
    handleMessage(request, sender, sendResponse) {
        console.log('📨 Mensaje recibido:', request.action, sender.tab?.url);

        // Manejar mensajes asíncronos correctamente
        const handleAsync = async () => {
            try {
                switch (request.action) {
                    case 'startLicitacionAutomation':
                        await this.startLicitacionAutomation(request, sender, sendResponse);
                        break;

                    case 'stopAutomation':
                        await this.stopAutomation(request, sender, sendResponse);
                        break;

                    case 'getAutomationStatus':
                        await this.getAutomationStatus(request, sender, sendResponse);
                        break;

                    case 'openPopup':
                        await this.openPopup(request, sender, sendResponse);
                        break;

                    case 'getConfiguration':
                        sendResponse({
                            success: true,
                            config: this.config
                        });
                        break;

                    case 'updateConfiguration':
                        await this.updateConfiguration(request, sender, sendResponse);
                        break;

                    case 'testCredentials':
                        await this.testCredentials(request, sender, sendResponse);
                        break;

                    case 'logAutomationEvent':
                        await this.logAutomationEvent(request, sender, sendResponse);
                        break;

                    default:
                        sendResponse({
                            success: false,
                            error: 'Acción no reconocida: ' + request.action
                        });
                }
            } catch (error) {
                console.error('❌ Error manejando mensaje:', error);
                sendResponse({
                    success: false,
                    error: error.message || 'Error desconocido'
                });
            }
        };

        // Ejecutar handler asíncrono
        handleAsync();

        // Retornar true para mantener el canal de sendResponse abierto
        return true;
    }
    
    async startLicitacionAutomation(request, sender, sendResponse) {
        try {
            const { licitacionId, licitacionData } = request;
            const tabId = sender.tab.id;
            
            console.log(`🚀 Iniciando automatización para licitación ${licitacionId} en tab ${tabId}`);
            
            // Verificar si ya hay una automatización activa para esta licitación
            if (this.activeAutomations.has(licitacionId)) {
                const existing = this.activeAutomations.get(licitacionId);
                
                if (existing.status === 'running') {
                    sendResponse({
                        success: false,
                        error: 'Ya hay una automatización activa para esta licitación'
                    });
                    return;
                }
            }
            
            // Crear registro de automatización
            const automation = {
                id: licitacionId,
                licitacionData: licitacionData,
                tabId: tabId,
                startTime: Date.now(),
                status: 'running',
                currentStep: 'initializing',
                progress: 0,
                logs: []
            };
            
            this.activeAutomations.set(licitacionId, automation);
            
            // Verificar que tenemos credenciales
            const hasCredentials = await this.checkCredentials();
            
            if (!hasCredentials) {
                automation.status = 'error';
                automation.error = 'No se encontraron credenciales válidas';
                
                sendResponse({
                    success: false,
                    error: 'Configurar credenciales primero'
                });
                return;
            }
            
            // Enviar comando de inicio al content script
            try {
                const response = await chrome.tabs.sendMessage(tabId, {
                    action: 'initiateLicitacionProcess',
                    licitacionId: licitacionId,
                    licitacionData: licitacionData,
                    config: this.config
                });
                
                if (response && response.success) {
                    automation.currentStep = 'process_started';
                    automation.progress = 10;
                    
                    // Programar verificación de progreso
                    this.scheduleProgressCheck(licitacionId, tabId);
                    
                    sendResponse({
                        success: true,
                        automationId: licitacionId,
                        message: 'Automatización iniciada correctamente'
                    });
                    
                    // Mostrar notificación
                    await this.showNotification(
                        'Automatización iniciada', 
                        `Procesando licitación: ${licitacionData.nombre}`
                    );
                    
                } else {
                    automation.status = 'error';
                    automation.error = response?.error || 'Error desconocido del content script';
                    
                    sendResponse({
                        success: false,
                        error: automation.error
                    });
                }
                
            } catch (tabError) {
                console.error('❌ Error enviando mensaje al tab:', tabError);
                
                automation.status = 'error';
                automation.error = 'No se pudo comunicar con la página';
                
                sendResponse({
                    success: false,
                    error: 'La página no responde. Recargar e intentar nuevamente.'
                });
            }
            
        } catch (error) {
            console.error('❌ Error iniciando automatización:', error);
            
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    async stopAutomation(request, sender, sendResponse) {
        try {
            const { automationId } = request;
            
            if (this.activeAutomations.has(automationId)) {
                const automation = this.activeAutomations.get(automationId);
                automation.status = 'stopped';
                automation.endTime = Date.now();
                
                // Notificar al content script
                if (automation.tabId) {
                    try {
                        await chrome.tabs.sendMessage(automation.tabId, {
                            action: 'stopAutomation',
                            automationId: automationId
                        });
                    } catch (error) {
                        console.warn('⚠️ No se pudo notificar stop al content script:', error);
                    }
                }
                
                console.log(`⏹️ Automatización ${automationId} detenida`);
                
                sendResponse({
                    success: true,
                    message: 'Automatización detenida'
                });
                
            } else {
                sendResponse({
                    success: false,
                    error: 'Automatización no encontrada'
                });
            }
            
        } catch (error) {
            console.error('❌ Error deteniendo automatización:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    async getAutomationStatus(request, sender, sendResponse) {
        try {
            const { automationId } = request;
            
            if (automationId) {
                // Estado de automatización específica
                const automation = this.activeAutomations.get(automationId);
                
                if (automation) {
                    sendResponse({
                        success: true,
                        automation: {
                            id: automation.id,
                            status: automation.status,
                            currentStep: automation.currentStep,
                            progress: automation.progress,
                            startTime: automation.startTime,
                            endTime: automation.endTime,
                            error: automation.error
                        }
                    });
                } else {
                    sendResponse({
                        success: false,
                        error: 'Automatización no encontrada'
                    });
                }
            } else {
                // Estado general de todas las automatizaciones
                const automations = Array.from(this.activeAutomations.values()).map(automation => ({
                    id: automation.id,
                    status: automation.status,
                    currentStep: automation.currentStep,
                    progress: automation.progress,
                    startTime: automation.startTime,
                    licitacionData: automation.licitacionData
                }));
                
                sendResponse({
                    success: true,
                    automations: automations,
                    activeCount: automations.filter(a => a.status === 'running').length
                });
            }
            
        } catch (error) {
            console.error('❌ Error obteniendo estado:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    async openPopup(request, sender, sendResponse) {
        try {
            // Abrir popup de la extensión
            await chrome.action.openPopup();
            
            sendResponse({
                success: true,
                message: 'Popup abierto'
            });
            
        } catch (error) {
            console.error('❌ Error abriendo popup:', error);
            sendResponse({
                success: false,
                error: 'No se pudo abrir popup'
            });
        }
    }
    
    async updateConfiguration(request, sender, sendResponse) {
        try {
            const { config } = request;
            
            // Validar configuración
            if (!config || typeof config !== 'object') {
                sendResponse({
                    success: false,
                    error: 'Configuración inválida'
                });
                return;
            }
            
            // Actualizar configuración
            this.config = { ...this.config, ...config };
            
            // Guardar en storage
            await chrome.storage.local.set({ licitacionConfig: this.config });
            
            console.log('⚙️ Configuración actualizada:', this.config);
            
            sendResponse({
                success: true,
                config: this.config
            });
            
        } catch (error) {
            console.error('❌ Error actualizando configuración:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    async checkCredentials() {
        try {
            const stored = await chrome.storage.local.get(['encryptedCredentials']);
            return !!stored.encryptedCredentials;
        } catch (error) {
            console.error('❌ Error verificando credenciales:', error);
            return false;
        }
    }
    
    async testCredentials(request, sender, sendResponse) {
        try {
            const hasCredentials = await this.checkCredentials();
            
            if (!hasCredentials) {
                sendResponse({
                    success: false,
                    error: 'No se encontraron credenciales'
                });
                return;
            }
            
            // TODO: Implementar test real de credenciales
            // Por ahora solo verificamos que existan
            
            sendResponse({
                success: true,
                message: 'Credenciales encontradas'
            });
            
        } catch (error) {
            console.error('❌ Error probando credenciales:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    async logAutomationEvent(request, sender, sendResponse) {
        try {
            const { automationId, event, data } = request;
            
            if (this.activeAutomations.has(automationId)) {
                const automation = this.activeAutomations.get(automationId);
                
                // Actualizar estado según el evento
                if (event.type === 'progress') {
                    automation.progress = event.progress || automation.progress;
                    automation.currentStep = event.step || automation.currentStep;
                }
                
                if (event.type === 'completed') {
                    automation.status = 'completed';
                    automation.endTime = Date.now();
                    automation.progress = 100;
                    
                    await this.showNotification(
                        'Automatización completada',
                        `Licitación procesada: ${automation.licitacionData.nombre}`
                    );
                }
                
                if (event.type === 'error') {
                    automation.status = 'error';
                    automation.error = event.error;
                    automation.endTime = Date.now();
                    
                    await this.showNotification(
                        'Error en automatización',
                        event.error || 'Error desconocido'
                    );
                }
                
                // Agregar log
                automation.logs.push({
                    timestamp: Date.now(),
                    event: event,
                    data: data
                });
                
                console.log(`📝 Evento registrado para ${automationId}:`, event);
            }
            
            sendResponse({
                success: true
            });
            
        } catch (error) {
            console.error('❌ Error registrando evento:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    
    scheduleProgressCheck(automationId, tabId) {
        // Verificar progreso cada 10 segundos
        const checkInterval = setInterval(async () => {
            try {
                const automation = this.activeAutomations.get(automationId);
                
                if (!automation || automation.status !== 'running') {
                    clearInterval(checkInterval);
                    return;
                }
                
                // Verificar si el tab sigue activo
                try {
                    await chrome.tabs.get(tabId);
                } catch (error) {
                    // Tab cerrado
                    automation.status = 'cancelled';
                    automation.error = 'Tab cerrado por el usuario';
                    clearInterval(checkInterval);
                    return;
                }
                
                // Solicitar actualización de progreso
                try {
                    await chrome.tabs.sendMessage(tabId, {
                        action: 'getProgress',
                        automationId: automationId
                    });
                } catch (error) {
                    console.warn('⚠️ No se pudo obtener progreso:', error);
                }
                
            } catch (error) {
                console.error('❌ Error en verificación de progreso:', error);
                clearInterval(checkInterval);
            }
        }, 10000);
        
        // Timeout después de 30 minutos
        setTimeout(() => {
            clearInterval(checkInterval);
            
            const automation = this.activeAutomations.get(automationId);
            if (automation && automation.status === 'running') {
                automation.status = 'timeout';
                automation.error = 'Timeout - proceso tomó demasiado tiempo';
                automation.endTime = Date.now();
            }
        }, 30 * 60 * 1000);
    }
    
    handleTabUpdate(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
            // Verificar si alguna automatización está esperando esta URL
            for (const [automationId, automation] of this.activeAutomations) {
                if (automation.tabId === tabId && automation.status === 'running') {
                    // Notificar al content script sobre la nueva página
                    chrome.tabs.sendMessage(tabId, {
                        action: 'pageLoaded',
                        url: tab.url
                    }).catch(error => {
                        console.warn('⚠️ Content script no disponible en nueva página');
                    });
                }
            }
        }
    }
    
    handleTabClosed(tabId) {
        // Marcar automatizaciones como canceladas si se cierra el tab
        for (const [automationId, automation] of this.activeAutomations) {
            if (automation.tabId === tabId && automation.status === 'running') {
                automation.status = 'cancelled';
                automation.error = 'Tab cerrado por el usuario';
                automation.endTime = Date.now();
                
                console.log(`❌ Automatización ${automationId} cancelada (tab cerrado)`);
            }
        }
    }
    
    handleExtensionInstalled(details) {
        if (details.reason === 'install') {
            console.log('🎉 Extensión instalada por primera vez');
            
            // Abrir página de configuración inicial
            chrome.tabs.create({
                url: chrome.runtime.getURL('popup.html')
            });
            
        } else if (details.reason === 'update') {
            console.log('🔄 Extensión actualizada');
            
            // Limpiar datos obsoletos si es necesario
            this.cleanupObsoleteData();
        }
    }
    
    handleAlarm(alarm) {
        switch (alarm.name) {
            case 'cleanupAutomations':
                this.cleanupCompletedAutomations();
                break;
                
            case 'checkLicitacionStatus':
                this.checkActiveLicitacionStatus();
                break;
        }
    }
    
    cleanupCompletedAutomations() {
        const cutoffTime = Date.now() - (2 * 60 * 60 * 1000); // 2 horas
        
        for (const [automationId, automation] of this.activeAutomations) {
            if (automation.endTime && automation.endTime < cutoffTime) {
                this.activeAutomations.delete(automationId);
                console.log(`🧹 Automatización ${automationId} limpiada (antigua)`);
            }
        }
    }
    
    async checkActiveLicitacionStatus() {
        const runningAutomations = Array.from(this.activeAutomations.values())
            .filter(automation => automation.status === 'running');
        
        if (runningAutomations.length > 0) {
            console.log(`🔍 Verificando ${runningAutomations.length} automatizaciones activas`);
            
            // Actualizar badge con count
            await chrome.action.setBadgeText({
                text: runningAutomations.length.toString()
            });
            
            await chrome.action.setBadgeBackgroundColor({
                color: '#667eea'
            });
        } else {
            await chrome.action.setBadgeText({ text: '' });
        }
    }
    
    async cleanupObsoleteData() {
        try {
            // Limpiar datos antiguos si es necesario
            const keys = ['obsoleteKey1', 'obsoleteKey2'];
            await chrome.storage.local.remove(keys);
            
            console.log('🧹 Datos obsoletos limpiados');
        } catch (error) {
            console.error('❌ Error limpiando datos obsoletos:', error);
        }
    }
    
    async showNotification(title, message) {
        if (!this.config.notificaciones) return;
        
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: title,
                message: message
            });
        } catch (error) {
            console.warn('⚠️ No se pudo mostrar notificación:', error);
        }
    }
}

// ================================
// INICIALIZACIÓN
// ================================

// Crear instancia global del manager
const licitacionBackgroundManager = new LicitacionBackgroundManager();
