// background.js - Background script para automatización de licitaciones

class LicitacionBackgroundManager {
    constructor() {
        this.activeAutomations = new Map();
        this.registeredContentScripts = new Map(); // 🆕 Para registrar content scripts
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

                    case 'contentScriptReady':
                        // 🆕 Content script se registra activamente
                        const tabId = sender.tab?.id;
                        if (tabId) {
                            console.log('✅ Content script registrado para tab', tabId);
                            this.registeredContentScripts.set(tabId, {
                                ready: true,
                                url: request.url,
                                timestamp: request.timestamp || Date.now()
                            });
                            sendResponse({
                                success: true,
                                message: 'Registro recibido correctamente'
                            });
                        } else {
                            sendResponse({
                                success: false,
                                error: 'No se pudo identificar el tab'
                            });
                        }
                        break;

                    case 'getAutomationData':
                        // 🆕 Content script solicita datos de automatización
                        console.log('📦 Content script solicita datos para:', request.automationId);
                        const automation = this.activeAutomations.get(request.automationId);
                        if (automation) {
                            console.log('✅ Enviando datos de automatización al content script');
                            sendResponse({
                                success: true,
                                licitacionData: automation.licitacionData,
                                userData: automation.userData,
                                credentials: automation.credentials,
                                config: this.config
                            });
                        } else {
                            console.error('❌ No se encontró automatización activa para:', request.automationId);
                            sendResponse({
                                success: false,
                                error: 'No se encontró automatización activa'
                            });
                        }
                        break;

                    case 'downloadDocument':
                        // 🆕 NUEVO: Handler para descarga de documentos de licitaciones
                        console.log('📥 Background: Iniciando descarga de documento para licitaciones...');
                        try {
                            const downloadResult = await this.downloadDocumentFromLaravel(request.url);
                            sendResponse(downloadResult);
                        } catch (downloadError) {
                            console.error('❌ Error en descarga de documento:', downloadError);
                            sendResponse({
                                success: false,
                                error: downloadError.message
                            });
                        }
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
            const { licitacionId, licitacionData, userData } = request;
            const originTabId = sender.tab.id; // Tab de PharmaTender
            
            console.log(`🚀 Iniciando automatización para licitación ${licitacionId}`);
            console.log(`   📄 Tab origen (PharmaTender): ${originTabId}`);
            
            // 🆕 Verificar si hay automatización activa Y si está bloqueada
            if (this.activeAutomations.has(licitacionId)) {
                const existing = this.activeAutomations.get(licitacionId);
                const timeElapsed = Date.now() - existing.startTime;
                const maxStaleTime = 2 * 60 * 1000; // 2 minutos
                
                if (existing.status === 'running') {
                    // Si ha pasado más de 2 minutos, considerarla "stale" y limpiarla
                    if (timeElapsed > maxStaleTime) {
                        console.log('⚠️ Automatización bloqueada detectada, limpiando...');
                        this.activeAutomations.delete(licitacionId);
                        
                        // Cerrar tab si existe
                        if (existing.mpTabId) {
                            try {
                                await chrome.tabs.remove(existing.mpTabId);
                            } catch (e) {
                                console.log('Tab ya cerrado');
                            }
                        }
                    } else {
                        const remainingTime = Math.round((maxStaleTime - timeElapsed) / 1000);
                        sendResponse({
                            success: false,
                            error: `Ya hay una automatización activa. Espera ${remainingTime}s o cierra la pestaña de MP.`
                        });
                        return;
                    }
                }
            }
            
            // Verificar que tenemos credenciales
            const hasCredentials = await this.checkCredentials();
            
            if (!hasCredentials) {
                sendResponse({
                    success: false,
                    error: 'Configurar credenciales primero'
                });
                return;
            }
            
            // Obtener credenciales desde storage
            const stored = await chrome.storage.local.get(['encryptedCredentials']);
            const credentials = stored.encryptedCredentials;
            
            if (!credentials || !credentials.username || !credentials.password || !credentials.rutRepresentante) {
                sendResponse({
                    success: false,
                    error: 'Credenciales incompletas. Por favor configúralas en la extensión.'
                });
                return;
            }
            
            console.log('✅ Credenciales verificadas:', {
                username: credentials.username,
                rutRepresentante: credentials.rutRepresentante
            });
            
            // 🆕 GUARDAR DATOS EN STORAGE PRIMERO
            console.log('💾 Guardando datos en storage...');
            await chrome.storage.local.set({
                licitacionAutomationData: {
                    licitacionId: licitacionId,
                    licitacionData: licitacionData,
                    userData: userData,
                    credentials: credentials,
                    timestamp: Date.now(),
                    status: 'ready',
                    source: 'background'
                }
            });
            console.log('✅ Datos guardados en storage');
            
            // 🆕 PASO CLAVE: Abrir NUEVA PESTAÑA en Mercado Público
            console.log('🌐 Abriendo nueva pestaña en Mercado Público...');
            
            const mercadoPublicoTab = await chrome.tabs.create({
                url: 'https://www.mercadopublico.cl/Portal/Modules/Menu/Menu.aspx',
                active: true // Hacer que la pestaña sea visible
            });
            
            const mpTabId = mercadoPublicoTab.id;
            console.log(`   ✅ Nueva pestaña creada: ${mpTabId}`);
            
            // Crear registro de automatización CON EL TAB CORRECTO
            const automation = {
                id: licitacionId,
                licitacionData: licitacionData,
                userData: userData,
                credentials: credentials,
                originTabId: originTabId,      // Tab de PharmaTender
                mpTabId: mpTabId,              // Tab de Mercado Público
                startTime: Date.now(),
                lastActivityTime: Date.now(),  // 🆕 Para detectar inactividad
                status: 'running',
                currentStep: 'initializing',
                progress: 0,
                logs: []
            };
            
            this.activeAutomations.set(licitacionId, automation);
            
            // 🆕 Configurar timeout de inactividad (3 minutos sin actividad = limpiar)
            this.setupInactivityTimeout(licitacionId, mpTabId);
            
            // Esperar a que la página de Mercado Público cargue
            console.log('⏳ Esperando que Mercado Público cargue...');
            
            await this.waitForTabLoad(mpTabId);
            
            console.log('✅ Mercado Público cargado');
            
            // 🆕 ESPERAR A QUE EL CONTENT SCRIPT SE REGISTRE ACTIVAMENTE
            console.log('⏳ Esperando a que content-licitacion.js se registre activamente...');
            console.log('   Tiempo máximo de espera: 30 segundos');
            
            let contentScriptReady = false;
            let elapsedTime = 0;
            const maxWaitTime = 30000; // 30 segundos
            const checkInterval = 500; // Revisar cada 500ms
            
            // Crear una promesa que se resuelve cuando el content script se registra
            const waitForRegistration = new Promise((resolve) => {
                const checkRegistration = setInterval(() => {
                    elapsedTime += checkInterval;
                    
                    // Verificar si el content script ya está en la lista de registrados
                    const registeredScript = this.registeredContentScripts?.get(mpTabId);
                    
                    if (registeredScript && registeredScript.ready) {
                        clearInterval(checkRegistration);
                        console.log('✅ Content script se registró activamente después de', elapsedTime, 'ms');
                        resolve(true);
                    } else if (elapsedTime >= maxWaitTime) {
                        clearInterval(checkRegistration);
                        console.log('⏱️ Timeout esperando registro activo. Intentando con ping...');
                        resolve(false);
                    } else {
                        console.log(`   ⏳ Esperando registro... ${elapsedTime}ms / ${maxWaitTime}ms`);
                    }
                }, checkInterval);
            });
            
            contentScriptReady = await waitForRegistration;
            
            // Si no se registró activamente, intentar con ping como fallback
            if (!contentScriptReady) {
                console.log('🏓 Fallback: Intentando con ping...');
                
                let attempts = 0;
                const maxAttempts = 10;
                
                while (!contentScriptReady && attempts < maxAttempts) {
                    attempts++;
                    console.log(`   Intento ${attempts}/${maxAttempts}...`);
                    
                    try {
                        const pingResponse = await chrome.tabs.sendMessage(mpTabId, {
                            action: 'ping'
                        });
                        
                        if (pingResponse && pingResponse.pong) {
                            contentScriptReady = true;
                            console.log('✅ Content script respondió al ping');
                        }
                    } catch (pingError) {
                        console.log(`   ⏳ Esperando 500ms...`);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
            
            if (!contentScriptReady) {
                console.error('❌ Content script no respondió ni se registró');
                automation.status = 'error';
                automation.error = 'Content script no se cargó en Mercado Público';
                
                sendResponse({
                    success: false,
                    error: 'El script de automatización no se cargó. Abrir consola (F12) en Mercado Público para más detalles.',
                    debugMessage: 'La pestaña quedó abierta para debugging'
                });
                return;
            }
            
            console.log('✅ Content script completamente listo para recibir comandos');
            
            console.log('');
            console.log('=' .repeat(80));
            console.log('📡 ENVIANDO COMANDO INITIATE LICITACION PROCESS');
            console.log('=' .repeat(80));
            console.log('🎯 Tab destino:', mpTabId);
            console.log('🎯 Licitación ID:', licitacionId);
            console.log('📦 Datos a enviar:');
            console.log('   - action: initiateLicitacionProcess');
            console.log('   - licitacionId:', licitacionId);
            console.log('   - hasLicitacionData:', !!licitacionData);
            console.log('   - hasUserData:', !!userData);
            console.log('   - hasCredentials:', !!credentials);
            console.log('   - hasConfig:', !!this.config);
            console.log('=' .repeat(80));
            
            try {
                console.log('⏳ Enviando mensaje...');
                
                const response = await chrome.tabs.sendMessage(mpTabId, {
                    action: 'initiateLicitacionProcess',
                    licitacionId: licitacionId,
                    licitacionData: licitacionData,
                    userData: userData,
                    credentials: credentials,
                    config: this.config
                });
                
                console.log('');
                console.log('=' .repeat(80));
                console.log('📨 RESPUESTA RECIBIDA DEL CONTENT SCRIPT');
                console.log('=' .repeat(80));
                console.log('Response:', response);
                console.log('=' .repeat(80));
                
                if (response && response.success) {
                    automation.currentStep = 'process_started';
                    automation.progress = 10;
                    
                    // Programar verificación de progreso
                    this.scheduleProgressCheck(licitacionId, mpTabId);
                    
                    sendResponse({
                        success: true,
                        automationId: licitacionId,
                        mpTabId: mpTabId,
                        message: 'Automatización iniciada en nueva pestaña de Mercado Público'
                    });
                    
                    // Mostrar notificación
                    await this.showNotification(
                        'Automatización iniciada', 
                        `Procesando licitación: ${licitacionData.nombre || licitacionId}`
                    );
                    
                } else {
                    console.error('❌ Content script respondió con error:', response?.error);
                    
                    automation.status = 'error';
                    automation.error = response?.error || 'Error desconocido del content script';
                    
                    // 🆕 NO CERRAR LA PESTAÑA - dejar que el usuario vea qué pasó
                    console.log('⚠️ NO cerrando pestaña para debugging - revisar consola de Mercado Público');
                    
                    sendResponse({
                        success: false,
                        error: automation.error,
                        debugMessage: 'La pestaña de Mercado Público quedó abierta para debugging'
                    });
                }
                
            } catch (tabError) {
                console.error('❌ Error enviando mensaje al tab de Mercado Público:', tabError);
                console.error('   Stack:', tabError.stack);
                
                automation.status = 'error';
                automation.error = `No se pudo comunicar con Mercado Público: ${tabError.message}`;
                
                // 🆕 NO CERRAR LA PESTAÑA - dejar que el usuario vea qué pasó
                console.log('⚠️ NO cerrando pestaña para debugging - revisar consola de Mercado Público');
                console.log('   Posibles causas:');
                console.log('   1. content-licitacion.js no se cargó');
                console.log('   2. El listener no está activo');
                console.log('   3. La página de Mercado Público bloqueó el script');
                
                sendResponse({
                    success: false,
                    error: automation.error,
                    debugMessage: 'La pestaña de Mercado Público quedó abierta para debugging. Abre la consola (F12) en esa pestaña.'
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
    
    // 🆕 Método auxiliar para esperar que un tab cargue completamente
    async waitForTabLoad(tabId, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout esperando carga de página'));
            }, timeoutMs);
            
            const listener = (updatedTabId, changeInfo, tab) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    clearTimeout(timeout);
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };
            
            chrome.tabs.onUpdated.addListener(listener);
            
            // Verificar si ya está cargado
            chrome.tabs.get(tabId, (tab) => {
                if (tab.status === 'complete') {
                    clearTimeout(timeout);
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            });
        });
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
                
                // 🆕 Actualizar tiempo de última actividad
                automation.lastActivityTime = Date.now();
                
                // Actualizar estado según el evento
                if (event.type === 'progress') {
                    automation.progress = event.progress || automation.progress;
                    automation.currentStep = event.step || automation.currentStep;
                }
                
                if (event.type === 'completed') {
                    automation.status = 'completed';
                    automation.endTime = Date.now();
                    automation.progress = 100;
                    
                    // Limpiar timeout
                    if (automation.timeoutIntervalId) {
                        clearInterval(automation.timeoutIntervalId);
                    }
                    
                    await this.showNotification(
                        'Automatización completada',
                        `Licitación procesada: ${automation.licitacionData.nombre}`
                    );
                }
                
                if (event.type === 'error') {
                    automation.status = 'error';
                    automation.error = event.error;
                    automation.endTime = Date.now();
                    
                    // Limpiar timeout
                    if (automation.timeoutIntervalId) {
                        clearInterval(automation.timeoutIntervalId);
                    }
                    
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
    
    // 🆕 Timeout de inactividad para limpiar automatizaciones bloqueadas
    setupInactivityTimeout(automationId, tabId) {
        console.log(`⏰ Configurando timeout de inactividad para ${automationId}`);
        
        const inactivityLimit = 3 * 60 * 1000; // 3 minutos sin actividad
        const checkInterval = 30 * 1000; // Revisar cada 30 segundos
        
        const intervalId = setInterval(async () => {
            try {
                const automation = this.activeAutomations.get(automationId);
                
                // Si ya no existe o no está running, limpiar interval
                if (!automation || automation.status !== 'running') {
                    console.log(`✅ Automatización ${automationId} ya no está activa, limpiando timeout`);
                    clearInterval(intervalId);
                    return;
                }
                
                const timeSinceLastActivity = Date.now() - automation.lastActivityTime;
                
                if (timeSinceLastActivity > inactivityLimit) {
                    console.log(`⏱️ Automatización ${automationId} sin actividad por ${Math.round(timeSinceLastActivity/1000)}s`);
                    console.log(`🧹 Limpiando automatización bloqueada...`);
                    
                    automation.status = 'timeout';
                    automation.error = 'Timeout por inactividad (3 min sin respuesta)';
                    automation.endTime = Date.now();
                    
                    // Notificar al usuario
                    await this.showNotification(
                        'Automatización detenida',
                        `La automatización de ${automationId} se detuvo por inactividad`
                    );
                    
                    // Limpiar después de 1 minuto
                    setTimeout(() => {
                        this.activeAutomations.delete(automationId);
                        console.log(`🗑️ Automatización ${automationId} eliminada del registro`);
                    }, 60 * 1000);
                    
                    clearInterval(intervalId);
                }
            } catch (error) {
                console.error('❌ Error en timeout de inactividad:', error);
                clearInterval(intervalId);
            }
        }, checkInterval);
        
        // Guardar intervalId en la automatización para poder limpiarlo si es necesario
        const automation = this.activeAutomations.get(automationId);
        if (automation) {
            automation.timeoutIntervalId = intervalId;
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

    // ================================
    // DESCARGA DE DOCUMENTOS PARA LICITACIONES
    // ================================

    async downloadDocumentFromLaravel(documentUrl) {
        try {
            console.log('📥 Background: Descargando documento desde Laravel para licitaciones:', documentUrl);
            
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
            
            console.log('✅ Background: Documento descargado exitosamente desde Laravel para licitaciones');
            
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
}

// ================================
// INICIALIZACIÓN
// ================================

// Crear instancia global del manager
const licitacionBackgroundManager = new LicitacionBackgroundManager();
