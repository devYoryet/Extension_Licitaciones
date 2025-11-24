// content-compraagil.js - Versión simplificada que solo lee del storage

console.log('🎯 CONTENT SCRIPT COMPRA ÁGIL CARGADO:', window.location.href);
// ========== FUNCIONES DE SEGURIDAD CONTRA AUTO-CLICKS ==========
class FileInputSecurityManager {
    constructor() {
        this.isUploadInProgress = false;
        this.protectedInputs = new Set();
        this.isAutomationRunning = false;
        this.protectedMode = false;
        this.blockedClicks = 0;
        console.log('🔐 FileInputSecurityManager inicializado');
    }
    enableMaxProtection() {
        this.protectedMode = true;
        this.isAutomationRunning = true;
        console.log('🛡️ PROTECCIÓN MÁXIMA ACTIVADA');
        
        // Proteger TODOS los botones de descarga/examinar
        this.protectDownloadButtons();
        this.protectFileInputs();
        this.protectExaminarButtons();
    }
     // ✅ Proteger botones de descarga
    protectDownloadButtons() {
        const downloadSelectors = [
            'a[href*="download"]',
            'button:contains("Descargar")',
            'a:contains("Descargar")',
            '[download]',
            'a[href*=".pdf"]',
            'a[href*=".docx"]',
            'a[href*=".xlsx"]',
            'a[href*=".xls"]',
            'a[href*=".rar"]',
            'a[href*=".doc"]',
            'a[href*=".zip"]'
        ];

        // Buscar todos los elementos que podrían ser botones de descarga
        const allLinks = document.querySelectorAll('a, button');
        
        allLinks.forEach(element => {
            const text = element.textContent?.toLowerCase() || '';
            const href = element.href?.toLowerCase() || '';
            
            if (text.includes('descargar') || text.includes('download') || 
                href.includes('download') || element.hasAttribute('download')) {
                
                element.addEventListener('click', this.blockUnwantedClick.bind(this), true);
                console.log('🛡️ Protegido botón de descarga:', text);
            }
        });
    }

    // ✅ Proteger botones "Examinar"
    protectExaminarButtons() {
        const examinarButtons = document.querySelectorAll('button');
        
        examinarButtons.forEach(button => {
            const text = button.textContent?.toLowerCase() || '';
            
            if (text.includes('examinar') || text.includes('browse') || text.includes('seleccionar')) {
                button.addEventListener('click', this.blockUnwantedClick.bind(this), true);
                console.log('🛡️ Protegido botón examinar:', text);
            }
        });
    }

    // ✅ Bloquear click no deseado
    blockUnwantedClick(event) {
        if (this.protectedMode && this.isAutomationRunning) {
            console.log('🚫 CLICK BLOQUEADO en:', event.target.textContent);
            this.blockedClicks++;
            
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            return false;
        }
    }

    // ✅ Desactivar protección
    disableProtection() {
        this.protectedMode = false;
        this.isAutomationRunning = false;
        console.log('🔓 Protección desactivada. Clicks bloqueados:', this.blockedClicks);
    }
    /**
     * Prevenir clicks automáticos en inputs de archivo
     */
    preventFileInputAutoClick() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            if (this.protectedInputs.has(input)) return;
            
            // Remover event listeners existentes que puedan causar auto-click
            input.removeEventListener('focus', this.handleInputFocus);
            input.removeEventListener('mouseenter', this.handleInputHover);
            
            // Agregar protección contra auto-click
            input.addEventListener('click', this.handleFileInputClick.bind(this));
            
            // Prevenir triggers automáticos
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' &&
                        mutation.attributeName === 'style' &&
                        this.isUploadInProgress) {
                        mutation.target.blur();
                    }
                });
            });
            
            observer.observe(input, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            
            this.protectedInputs.add(input);
        });
    }

    /**
     * Manejar click en input de archivo con protección
     */
    handleFileInputClick(event) {
        if (this.isUploadInProgress) {
            console.log('🛑 Upload en progreso - Previniendo auto-click');
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        
        // Permitir click manual del usuario
        console.log('✅ Click manual permitido en input de archivo');
    }

    /**
     * Deshabilitar temporalmente inputs de archivo durante upload
     */
    disableFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.disabled = true;
            input.style.pointerEvents = 'none';
        });
        this.isUploadInProgress = true;
        console.log('🔒 Inputs de archivo deshabilitados');
    }

    /**
     * Rehabilitar inputs de archivo después del upload
     */
    enableFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.disabled = false;
            input.style.pointerEvents = 'auto';
        });
        this.isUploadInProgress = false;
        console.log('🔓 Inputs de archivo rehabilitados');
    }

    /**
     * Proteger input específico antes de usarlo
     */
    protectAndPrepareInput(input) {
        if (!input) return null;
        
        // Aplicar protección si no la tiene
        if (!this.protectedInputs.has(input)) {
            input.addEventListener('click', this.handleFileInputClick.bind(this));
            this.protectedInputs.add(input);
        }
        
        return input;
    }
}

// ✅ NUEVA FUNCIÓN: Protección global contra clicks automáticos
class AdvancedFileInputProtection {
    constructor() {
        this.isAutomationRunning = false;
        this.protectedMode = false;
        this.blockedClicks = 0;
    }

    // ✅ Activar protección máxima
    enableMaxProtection() {
        this.protectedMode = true;
        this.isAutomationRunning = true;
        console.log('🛡️ PROTECCIÓN MÁXIMA ACTIVADA');
        
        // Proteger TODOS los botones de descarga/examinar
        this.protectDownloadButtons();
        this.protectFileInputs();
        this.protectExaminarButtons();
    }

    // ✅ Proteger botones de descarga
    protectDownloadButtons() {
        const downloadSelectors = [
            'a[href*="download"]',
            'button:contains("Descargar")',
            'a:contains("Descargar")',
            '[download]',
            'a[href*=".pdf"]',
            'a[href*=".xlsx"]',
            'a[href*=".xls"]',
            'a[href*=".docx"]',
            'a[href*=".rar"]',
            'a[href*=".doc"]',
            'a[href*=".zip"]'
        ];

        // Buscar todos los elementos que podrían ser botones de descarga
        const allLinks = document.querySelectorAll('a, button');
        
        allLinks.forEach(element => {
            const text = element.textContent?.toLowerCase() || '';
            const href = element.href?.toLowerCase() || '';
            
            if (text.includes('descargar') || text.includes('download') || 
                href.includes('download') || element.hasAttribute('download')) {
                
                element.addEventListener('click', this.blockUnwantedClick.bind(this), true);
                console.log('🛡️ Protegido botón de descarga:', text);
            }
        });
    }

    // ✅ Proteger botones "Examinar"
    protectExaminarButtons() {
        const examinarButtons = document.querySelectorAll('button');
        
        examinarButtons.forEach(button => {
            const text = button.textContent?.toLowerCase() || '';
            
            if (text.includes('examinar') || text.includes('browse') || text.includes('seleccionar')) {
                button.addEventListener('click', this.blockUnwantedClick.bind(this), true);
                console.log('🛡️ Protegido botón examinar:', text);
            }
        });
    }

    // ✅ Bloquear click no deseado
    blockUnwantedClick(event) {
        if (this.protectedMode && this.isAutomationRunning) {
            console.log('🚫 CLICK BLOQUEADO en:', event.target.textContent);
            this.blockedClicks++;
            
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            return false;
        }
    }

    // ✅ Desactivar protección
    disableProtection() {
        this.protectedMode = false;
        this.isAutomationRunning = false;
        console.log('🔓 Protección desactivada. Clicks bloqueados:', this.blockedClicks);
    }
}

// ✅ Instancia global
const advancedProtection = new AdvancedFileInputProtection();
// Instancia global del manager de seguridad
const fileSecurityManager = new FileInputSecurityManager();

class CompraAgilStorageOnly {
    constructor() {
        this.isRunning = false;
        this.cotizacion = null;
        this.automationData = null;
        this.processedItems = 0;
        this.retryCount = 0;
        this.maxRetries = 2;
        this.estadoCompraAgil = null; // ✅ NUEVO: Estado de la compra ágil
        this.procesoDetenido = false; // ✅ NUEVO: Flag para detener proceso
        //console.log('🤖 Compra Ágil Storage Only - Iniciando...');
        this.extensionActive = false;
        this.userAuthorized = false; // ✅ NUEVO: Control de autorización
        this.estadoActualizacionEnviado = false; // ✅ NUEVA VARIABLE
        this.observadorActivo = null; // ✅ CONTROL DE OBSERVADOR
        this.registerInWindow();

        //this.loadSource = this.detectLoadSource();
      setTimeout(() => {
        this.prepareForCommands();
    }, 2000);

        this.extractCotizacionId();
//        console.log('🔧 Configurando listener de mensajes...'); // ✅ AGREGAR

        //this.setupMessageListener();
        //console.log('✅ Listener configurado'); // ✅ AGREGAR

        this.registerInWindow();
        // ✅ CAMBIO CRÍTICO: Solo inicializar CON validaciones
       
        console.log('✅ Content script Compra Ágil Storage Only listo');
         setTimeout(() => {
            this.checkForOrganizationData();
        }, 1000);
    }

    detectLoadSource() {
    // ✅ DETECTAR TIPO DE NAVEGACIÓN
    if (performance.navigation) {
        switch (performance.navigation.type) {
            case 0: return 'navigate'; // Navegación normal (desde popup)
            case 1: return 'refresh';  // F5 o Ctrl+R
            case 2: return 'back';     // Botón atrás
            default: return 'unknown';
        }
    }
    
    // ✅ MÉTODO ALTERNATIVO
    if (document.referrer === '') {
        return 'direct'; // Acceso directo
    }
    
    return 'navigate';
}
// ✅ NUEVA FUNCIÓN: Verificar datos de organización
async checkForOrganizationData() {
    try {
        const result = await chrome.storage.local.get(['detectedOrganization']);
        if (result.detectedOrganization) {
            console.log('🏢 ORGANIZACIÓN DETECTADA AL CARGAR:', result.detectedOrganization);
            this.showOrganizationPopup(result.detectedOrganization);
            // Limpiar después de mostrar
            await chrome.storage.local.remove(['detectedOrganization']);
        } else {
            console.log('ℹ️ No hay organización detectada en storage');
        }
    } catch (error) {
        console.error('❌ Error verificando organización al cargar:', error);
    }
}
showOrganizationPopup(organizationName) {
    if (!organizationName) return;
    
    // Remover popup existente si existe
    const existingPopup = document.getElementById('organization-popup');
    if (existingPopup) existingPopup.remove();
    
    const popup = document.createElement('div');
    popup.id = 'organization-popup';
    popup.innerHTML = `
        <div style="
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 999999;
            background: white;
            border-radius: 14px;
            padding: 16px 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            min-width: 300px;
            max-width: 380px;
            width: fit-content;
            border: 1px solid #e2e8f0;
            animation: slideIn 0.3s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 10px;
            ">
                <div style="
                    font-size: 20px;
                    color: #6366f1;
                ">🏢</div>
                <div style="
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Organización Detectada</div>
            </div>
            
            <div style="
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                padding: 14px 18px;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                text-align: center;
                word-break: break-word;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            ">${organizationName}</div>
        </div>
        
        <style>
            @keyframes slideIn {
                from { 
                    opacity: 0; 
                    transform: translateX(20px);
                }
                to { 
                    opacity: 1; 
                    transform: translateX(0);
                }
            }
        </style>
    `;
    
    document.body.appendChild(popup);
    
    // ✅ SIN TIMEOUT - Se mantiene durante todo el proceso
    console.log(`🏢 Organización persistente mostrada: ${organizationName}`);
}
// ✅ 2. CONTENT-COMPRAAGIL.JS - MEJORAR checkStorageForCommands con validaciones
async checkStorageForCommands() {
    try {
        const result = await chrome.storage.local.get(['compraAgilCommand']);
        const command = result.compraAgilCommand;
        
        console.log('🔍 VERIFICANDO STORAGE... Comando encontrado:', !!command);
        
        if (!command) {
            console.log('ℹ️ No hay comandos en storage');
            return false;
        }
        
        // ✅ VERIFICAR EXPIRACIÓN
        if (command.expiresAt && Date.now() > command.expiresAt) {
            console.log('⏰ Comando expirado, limpiando...');
            await chrome.storage.local.remove(['compraAgilCommand']);
            return false;
        }
        
        // ✅ VERIFICAR SI YA FUE EJECUTADO
        if (command.executed) {
            // ✅ MOSTRAR INFO AL USUARIO
            const timeAgo = Math.floor((Date.now() - command.executedAt) / 1000);
            console.log(`ℹ️ Comando ya ejecutado hace ${timeAgo} segundos`);
            
            // ✅ SI PASARON MÁS DE 2 MINUTOS, PERMITIR RE-EJECUCIÓN
            if (timeAgo > 120) {
                console.log('🔄 Comando antiguo, permitiendo re-ejecución...');
                command.executed = false;
                command.attempts = (command.attempts || 0) + 1;
                command.timestamp = Date.now();
                await chrome.storage.local.set({ 'compraAgilCommand': command });
            } else {
                this.updateIndicator(`Automatización ejecutada hace ${timeAgo}s. Espera 2 minutos para re-ejecutar.`);
                return false;
            }
        }
        
        // ✅ VERIFICAR MÁXIMO DE INTENTOS
        if (command.attempts >= command.maxAttempts) {
            console.log('❌ Máximo de intentos alcanzado');
            this.updateIndicator('Máximo de intentos alcanzado. Usa el popup para reiniciar.');
            return false;
        }
        
        // ✅ VERIFICAR QUE SEA EL COMANDO CORRECTO
        if (command.action === 'startCompraAgilAutomation') {
            console.log('🚀 === EJECUTANDO COMANDO VÁLIDO ===');
            console.log('📊 Comando:', {
                id: command.id,
                timestamp: new Date(command.timestamp).toLocaleTimeString(),
                attempts: command.attempts,
                source: command.source
            });
            
            // ✅ MARCAR COMO EJECUTADO PERO NO TERMINADO
            command.executed = true;
            command.executedAt = Date.now();
            command.status = 'executing'; // ✅ NUEVO ESTADO
            await chrome.storage.local.set({ 'compraAgilCommand': command });
            
            // ✅ MOSTRAR ESTADO AL USUARIO
            this.updateIndicator('🚀 Iniciando automatización...');
            
            // Ejecutar automatización
            this.startedFromPopup = true;
            console.log('🎯 INICIANDO AUTOMATIZACIÓN DESDE STORAGE...');
            
            this.iniciarProcesoDesdePopup()
                .then(() => {
                    console.log('✅ AUTOMATIZACIÓN COMPLETADA');
                    this.markCommandAsCompleted(command.id);
                    this.updateIndicator('✅ Automatización completada exitosamente');
                })
                .catch((error) => {
                    console.error('❌ ERROR EN AUTOMATIZACIÓN:', error);
                    this.markCommandAsFailed(command.id, error.message);
                    this.updateIndicator(`❌ Error: ${error.message}`);
                });
                
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Error verificando storage:', error);
        return false;
    }
}

async markCommandAsCompleted(commandId) {
    try {
        const result = await chrome.storage.local.get(['compraAgilCommand']);
        if (result.compraAgilCommand && result.compraAgilCommand.id === commandId) {
            result.compraAgilCommand.status = 'completed';
            result.compraAgilCommand.completedAt = Date.now();
            await chrome.storage.local.set({ 'compraAgilCommand': result.compraAgilCommand });
            console.log('✅ Comando marcado como completado');
        }
    } catch (error) {
        console.error('❌ Error marcando comando como completado:', error);
    }
}

async markCommandAsFailed(commandId, errorMessage) {
    try {
        const result = await chrome.storage.local.get(['compraAgilCommand']);
        if (result.compraAgilCommand && result.compraAgilCommand.id === commandId) {
            result.compraAgilCommand.status = 'failed';
            result.compraAgilCommand.failedAt = Date.now();
            result.compraAgilCommand.error = errorMessage;
            await chrome.storage.local.set({ 'compraAgilCommand': result.compraAgilCommand });
            console.log('❌ Comando marcado como fallido');
        }
    } catch (error) {
        console.error('❌ Error marcando comando como fallido:', error);
    }
}


// ✅ 1. CONTENT-COMPRAAGIL.JS - SOLO MODIFICAR prepareForCommands
// ✅ 2. CONTENT-COMPRAAGIL.JS - USAR updateIndicator CORRECTAMENTE en prepareForCommands:
async prepareForCommands() {
    try {
        console.log('🔧 Preparando sistema para recibir comandos...');
        
        const isActive = await this.checkExtensionState();
        
        if (!isActive) {
            console.log('⚠️ EXTENSIÓN DESACTIVADA - Sistema en espera');
            this.updateIndicator('⚠️ Extensión desactivada', 'error');
            return; 
        }
        
        // ✅ USAR FUNCIONES EXISTENTES PARA VERIFICAR ESTADOS
        const estadoValido = await this.verificarEstadoCompraAgil();
        
        if (!estadoValido) {
            // Las funciones existentes ya manejan los indicadores para cancelada/postulada
            return;
        }
        
        console.log('✅ SISTEMA LISTO - EN ESPERA DE COMANDO AUTORIZADO');
        this.updateIndicator('⏳ Esperando comando desde popup', 'default');
        
        console.log('🔧 Configurando listener de mensajes desde command...');
        this.setupMessageListener();
        console.log('✅ Listener de mensajes activo desde command');
        
    } catch (error) {
        console.error('❌ Error preparando comandos:', error);
        this.updateIndicator('❌ Error en sistema', 'error');
    }
}
// ✅ 2. CONTENT-COMPRAAGIL.JS - AGREGAR método para verificar estados especiales
async verificarEstadosEspeciales() {
    try {
        // ✅ VERIFICAR SI YA ESTÁ POSTULADA
        const yaPostulada = await this.verificarSiYaEstaPostulada();
        if (yaPostulada) {
            this.updateIndicator('✅ Ya postulada', 'success');
            return true;
        }
        
        // ✅ VERIFICAR SI ESTÁ CANCELADA
        const estaCancelada = await this.verificarSiEstaCancelada();
        if (estaCancelada) {
            this.updateIndicator('❌ Compra Ágil cancelada', 'error');
            return true;
        }
        
        // ✅ ESTADO NORMAL
        this.addIndicator(); // Mostrar indicador básico con cotización
        this.updateIndicator('⏳ Esperando comando desde popup', 'default');
        return false;
        
    } catch (error) {
        console.error('❌ Error verificando estados:', error);
        return false;
    }
}
// ✅ NUEVA FUNCIÓN: Monitorear autorización automáticamente
async startAuthorizationMonitoring() {
    console.log('👁️ Iniciando monitoreo de autorización...');
    
    const checkAuthorization = async () => {
        try {
            // Verificar si hay autorización válida
            const hasAuthorization = await this.checkUserAuthorization();
            if (!hasAuthorization) {
                return; // Seguir esperando
            }

            // Verificar que la cotización coincida
            const cotizationMatches = await this.validateCotizacionMatch();
            if (!cotizationMatches) {
                console.log('❌ Cotización no coincide, limpiando autorización');
                await this.clearUserAuthorization();
                return;
            }

            // ✅ TODAS LAS VALIDACIONES PASADAS - Ejecutar automatización
            console.log('🚀 AUTORIZACIÓN VÁLIDA DETECTADA - Iniciando automatización automática');
            this.stopAuthorizationMonitoring();
            
            // Buscar datos de automatización
            await this.checkForAutomationData();
            
        } catch (error) {
            console.error('❌ Error en monitoreo de autorización:', error);
        }
    };

    // Verificar cada 2 segundos por un máximo de 10 veces (20 segundos)
    let attempts = 0;
    const maxAttempts = 10;
    
    this.authorizationInterval = setInterval(async () => {
        attempts++;
        console.log(`🔍 Verificando autorización... (${attempts}/${maxAttempts})`);
        
        await checkAuthorization();
        
        if (attempts >= maxAttempts) {
            console.log('⏰ Timeout en monitoreo de autorización');
            this.stopAuthorizationMonitoring();
            this.updateIndicator('⏰ Sin autorización recibida', 'warning');
        }
    }, 2000);
}
// ✅ NUEVA FUNCIÓN: Verificar si ya existe una postulación
async verificarPostulacionExistente() {
    console.log('🔍 Verificando si ya existe postulación...');
    
    try {
        let anularButton = null;
        
        // ✅ MÉTODO 1: Búsqueda por texto específico (MÁS CONFIABLE)
        console.log('🔍 Método 1: Buscando por texto específico...');
        
        const allClickableElements = document.querySelectorAll('a, button, [role="button"], [onclick]');
        console.log(`📋 Elementos clickeables encontrados: ${allClickableElements.length}`);
        
        for (const element of allClickableElements) {
            // Solo elementos visibles
            if (element.offsetParent === null) continue;
            
            const text = element.textContent?.toLowerCase().trim() || '';
            const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
            const title = element.getAttribute('title')?.toLowerCase() || '';
            
            // Patrones específicos para "anular cotización"
            const patternsAnular = [
                'anular cotización',
                'anular cotizacion', 
                'cancelar cotización',
                'cancelar cotizacion',
                'eliminar cotización',
                'eliminar cotizacion'
            ];
            
            const matchesAnular = patternsAnular.some(pattern => {
                return text.includes(pattern) || 
                       ariaLabel.includes(pattern) || 
                       title.includes(pattern);
            });
            
            if (matchesAnular) {
                anularButton = element;
                console.log(`✅ MÉTODO 1 - Botón "Anular cotización" encontrado:`);
                console.log(`   Texto: "${element.textContent?.trim()}"`);
                console.log(`   Tag: ${element.tagName}`);
                console.log(`   Classes: ${element.className}`);
                console.log(`   Href: ${element.href || 'N/A'}`);
                break;
            }
        }
        
        // ✅ MÉTODO 2: Si no encontramos nada, buscar texto "Cotización enviada" o similar
        if (!anularButton) {
            console.log('🔍 Método 2: Buscando texto de cotización enviada...');
            
            const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
            
            for (const element of textElements) {
                const text = element.textContent?.toLowerCase().trim() || '';
                
                const patternsEnviada = [
                    'cotización enviada',
                    'cotizacion enviada',
                    'oferta enviada',
                    'postulación enviada',
                    'postulacion enviada',
                    'ya postulaste',
                    'ya has postulado',
                    'propuesta enviada'
                ];
                
                const matchesEnviada = patternsEnviada.some(pattern => text.includes(pattern));
                
                if (matchesEnviada && element.offsetParent !== null) {
                    console.log(`✅ MÉTODO 2 - Texto de cotización enviada encontrado:`);
                    console.log(`   Texto: "${element.textContent?.trim()}"`);
                    console.log(`   Tag: ${element.tagName}`);
                    console.log(`   Classes: ${element.className}`);
                    
                    // Crear un pseudo-botón para consistency
                    anularButton = element;
                    break;
                }
            }
        }
        
        // ✅ MÉTODO 3: Verificación por estado de la página URL
        if (!anularButton) {
            console.log('🔍 Método 3: Verificando URL de estado...');
            
            const currentUrl = window.location.href.toLowerCase();
            const urlPatternsCompletado = [
                'enviada',
                'completada', 
                'finalizada',
                'success',
                'exitosa'
            ];
            
            const urlIndicatesCompleted = urlPatternsCompletado.some(pattern => 
                currentUrl.includes(pattern)
            );
            
            if (urlIndicatesCompleted) {
                console.log(`✅ MÉTODO 3 - URL indica cotización completada: ${window.location.href}`);
                anularButton = { 
                    textContent: 'URL indicates completed', 
                    tagName: 'URL_INDICATOR',
                    offsetParent: true 
                };
            }
        }
        
        // ✅ RESULTADO FINAL
        if (anularButton) {
            console.log('❌ POSTULACIÓN YA EXISTE - Evidencia detectada');
            console.log('📍 Tipo de evidencia:', anularButton.tagName);
            
            // Verificar que el elemento esté realmente visible
            const isVisible = anularButton.offsetParent !== null || anularButton.tagName === 'URL_INDICATOR';
            console.log('👁️ Evidencia visible:', isVisible);
            
            if (isVisible) {
                this.yaPostulada = true;
                this.procesoDetenido = true;
                
                // Guardar flag en storage
                await this.guardarEstadoYaPostulada();
                
                // Detener monitoreo si está activo
                this.stopAuthorizationMonitoring();
                
                // Actualizar indicador
                this.updateIndicator('✅ Ya Postulada Anteriormente', 'ya_postulada');
                
                console.log('🛑 PROCESO DETENIDO - Cotización ya tiene oferta ingresada');
                return true; // Ya está postulada
            }
        }
        
        // ✅ DEBUG: Mostrar elementos sospechosos para análisis
        console.log('🔍 DEBUG - Analizando elementos con clases sospechosas...');
        const suspiciousElements = document.querySelectorAll('.sc-eJjyvb, [class*="anular"], [class*="cancel"], [class*="delete"]');
        
        if (suspiciousElements.length > 0) {
            console.log(`📋 Elementos sospechosos encontrados: ${suspiciousElements.length}`);
            suspiciousElements.forEach((el, index) => {
                if (el.offsetParent !== null) {
                    console.log(`  ${index + 1}. "${el.textContent?.trim()}" | Tag: ${el.tagName} | Classes: ${el.className}`);
                }
            });
        }
        
        console.log('✅ No se detectó postulación existente - Proceso puede continuar');
        return false; // No está postulada, puede continuar
        
    } catch (error) {
        console.error('❌ Error verificando postulación existente:', error);
        // En caso de error, permitir continuar para no bloquear procesos válidos
        return false;
    }
}

// ✅ FUNCIÓN AUXILIAR: Guardar estado de ya postulada
async guardarEstadoYaPostulada() {
    try {
        const estadoData = {
            cotizacion: this.cotizacion,
            yaPostulada: true,
            timestamp: Date.now(),
            url: window.location.href,
            motivo: 'Botón anular cotización detectado'
        };
        
        await chrome.storage.local.set({
            [`yaPostulada_${this.cotizacion}`]: estadoData
        });
        
        console.log('💾 Estado "ya postulada" guardado en storage');
        
    } catch (error) {
        console.error('❌ Error guardando estado ya postulada:', error);
    }
}
// ✅ NUEVA FUNCIÓN: Detener monitoreo
stopAuthorizationMonitoring() {
    if (this.authorizationInterval) {
        clearInterval(this.authorizationInterval);
        this.authorizationInterval = null;
        console.log('🛑 Monitoreo de autorización detenido');
    }
}
    // ✅ NUEVA FUNCIÓN: Inicialización con validaciones estrictas
    async initializeWithStrictValidation() {
        try {
            console.log('🔒 === INICIANDO VALIDACIONES ESTRICTAS ===');
            
            // ✅ VALIDACIÓN 1: Verificar que extensión esté activa
            const isExtensionActive = await this.checkExtensionState();
            if (!isExtensionActive) {
                console.log('⚠️ EXTENSIÓN DESACTIVADA - No se ejecutará');
                this.showDisabledIndicator();
                return;
            }

            // ✅ VALIDACIÓN 2: Verificar autorización del usuario
            const hasAuthorization = await this.checkUserAuthorization();
            if (!hasAuthorization) {
                console.log('🚫 SIN AUTORIZACIÓN DEL USUARIO - No se ejecutará automáticamente');
                this.addIndicator('🚫 Sin autorización', 'waiting');
                return;
            }

            // ✅ VALIDACIÓN 3: Verificar que la cotización coincida
            const cotizationMatches = await this.validateCotizacionMatch();
            if (!cotizationMatches) {
                console.log('❌ COTIZACIÓN NO COINCIDE - No se ejecutará');
                this.addIndicator('❌ Cotización incorrecta', 'error');
                await this.clearUserAuthorization(); // Limpiar autorización incorrecta
                return;
            }

            console.log('✅ TODAS LAS VALIDACIONES PASADAS - Procediendo con automatización');
            
            // ✅ Solo si pasa TODAS las validaciones, proceder
            if (this.cotizacion) {
                this.addIndicator();
                await this.verificarEstadoCompraAgil();
                
                if (!this.procesoDetenido) {
                    await this.checkForAutomationData();
                }
            }

        } catch (error) {
            console.error('❌ Error en validaciones:', error);
            this.addIndicator('❌ Error en validaciones', 'error');
        }
    }

     // ✅ NUEVA FUNCIÓN: Verificar autorización del usuario
   async checkUserAuthorization() {
    try {
        const authData = await chrome.storage.local.get(['userAuthorization']);
        const authorization = authData.userAuthorization;

        if (!authorization) {
            console.log('🚫 No hay autorización del usuario');
            return false;
        }

        // Verificar que no haya expirado (5 minutos)
        const now = Date.now();
        const ageMinutes = (now - authorization.timestamp) / (1000 * 60);
        
        if (ageMinutes > 5) {
            console.log('⏰ Autorización expirada:', ageMinutes.toFixed(1), 'minutos');
            await this.clearUserAuthorization();
            return false;
        }

        console.log('✅ Autorización válida, edad:', ageMinutes.toFixed(1), 'minutos');
        return true;

    } catch (error) {
        console.error('❌ Error verificando autorización:', error);
        return false;
    }
}
     // ✅ NUEVA FUNCIÓN: Validar que cotización URL coincida con datos
    async validateCotizacionMatch(requestData = null) {
    try {
        // Obtener cotización de la URL actual
        const urlCotizacion = this.cotizacion;
        if (!urlCotizacion) {
            console.log('❌ No se pudo extraer cotización de la URL');
            return false;
        }

        let expectedCotizacion = null;

        // ✅ CASO 1: Viene de mensaje del popup (requestData disponible)
        if (requestData) {
            expectedCotizacion = requestData.cotizacion || requestData.automatizacion?.cotizacion;
            console.log('🔍 Validando con datos de mensaje del popup');
        } 
        // ✅ CASO 2: Auto-validación, usar datos almacenados
        else {
            const authData = await chrome.storage.local.get(['userAuthorization']);
            expectedCotizacion = authData.userAuthorization?.cotizacion;
            console.log('🔍 Validando con cotización de autorización almacenada');
        }

        console.log('🔍 Comparando cotizaciones:');
        console.log('  📍 URL:', urlCotizacion);
        console.log('  📨 Esperada:', expectedCotizacion);

        if (!expectedCotizacion) {
            console.log('❌ No se encontró cotización esperada');
            return false;
        }

        if (urlCotizacion !== expectedCotizacion) {
            console.log('❌ COTIZACIONES NO COINCIDEN');
            console.log(`❌ URL: "${urlCotizacion}" ≠ Esperada: "${expectedCotizacion}"`);
            return false;
        }

        console.log('✅ COTIZACIONES COINCIDEN PERFECTAMENTE');
        return true;

    } catch (error) {
        console.error('❌ Error validando cotización:', error);
        return false;
    }
}


// ✅ NUEVA FUNCIÓN: Limpiar autorización
async clearUserAuthorization() {
    try {
        await chrome.storage.local.remove(['userAuthorization']);
        console.log('🗑️ Autorización de usuario eliminada');
    } catch (error) {
        console.error('❌ Error eliminando autorización:', error);
    }
}

    

    // ✅ NUEVA FUNCIÓN: Inicializar solo si extensión está activa
    async initializeWithStateCheck() {
        try {
            const isActive = await this.checkExtensionState();
            
            if (!isActive) {
                console.log('⚠️ EXTENSIÓN DESACTIVADA - No se ejecutará automatización');
                this.showDisabledIndicator();
                return; 
            }
            
            console.log('✅ EXTENSIÓN ACTIVA - Lista para recibir comandos...');
            
            if (this.cotizacion) {
                this.addIndicator('⏳ Esperando autorización...', 'waiting');
                await this.verificarEstadoCompraAgil();
                
                // ✅ NO auto-ejecutar, solo esperar comando autorizado
                console.log('🔒 Sistema listo, esperando comando autorizado del popup...');
            }
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
        }
    }
    
    // ✅ NUEVA FUNCIÓN: Verificar estado de extensión
    async checkExtensionState() {
        try {
            console.log('🔍 Verificando estado de extensión...');
            
            // ✅ MÉTODO 1: Verificar storage local
            const result = await chrome.storage.local.get(['extensionActive']);
            
            this.extensionActive = result.extensionActive !== false; // Default true si no existe
            
            console.log('📊 Estado de extensión desde storage:', {
                extensionActive: result.extensionActive,
                interpretado: this.extensionActive
            });
            
            // ✅ MÉTODO 2: Ping al background script para confirmación
            try {
                const backgroundResponse = await this.pingBackgroundScript();
                
                if (backgroundResponse && backgroundResponse.success) {
                    console.log('✅ Background script confirma extensión activa');
                    return this.extensionActive;
                } else {
                    console.warn('⚠️ Background script no responde - usando storage');
                    return this.extensionActive;
                }
            } catch (pingError) {
                console.warn('⚠️ Error en ping a background:', pingError);
                return this.extensionActive;
            }
            
        } catch (error) {
            console.error('❌ Error verificando estado de extensión:', error);
            // ✅ En caso de error, asumir desactivada (seguro)
            this.extensionActive = false;
            return false;
        }
    }
    
    // ✅ NUEVA FUNCIÓN: Ping al background script
    async pingBackgroundScript() {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async initializeWithDelay() {
        try {
            if (this.cotizacion) {
                this.addIndicator();
                
                // ✅ NUEVO: Verificar estado ANTES de continuar
                await this.verificarEstadoCompraAgil();
                
                // Solo continuar si el estado es válido
                if (!this.procesoDetenido) {
                    await this.checkForAutomationData();
                }
            }
        } catch (error) {
            console.error('❌ Error en inicialización retardada:', error);
        }
    }
    // ✅ NUEVA FUNCIÓN: Verificar estado de Compra Ágil
    async verificarEstadoCompraAgil() {
        console.log('🔍 Verificando estado de Compra Ágil...');
        
        try {
            // Esperar a que la página cargue completamente
            await this.waitForPageElements([
                '.sc-eUALbN.gAZGlU', // Selector del estado
                'span[color]'        // Selector alternativo
            ]);
            
            // Buscar elementos de estado
            const estadoSelectors = [
                'span[color="error"].sc-eUALbN.gAZGlU',    // Cancelada
                'span[color="success"].sc-eUALbN.gAZGlU',  // Publicada
                '.sc-eUALbN.gAZGlU',                       // Cualquier estado
                'span[color]'                              // Fallback
            ];
            
            let estadoElement = null;
            let estadoTexto = null;
            
            for (const selector of estadoSelectors) {
                const elements = document.querySelectorAll(selector);
                
                for (const element of elements) {
                    const texto = element.textContent.trim().toLowerCase();
                    
                    if (texto.includes('cancelada') || texto.includes('publicada') || 
                        texto.includes('cerrada') || texto.includes('suspendida')) {
                        estadoElement = element;
                        estadoTexto = element.textContent.trim();
                        break;
                    }
                }
                
                if (estadoElement) break;
            }
            
            if (estadoElement) {
                this.estadoCompraAgil = estadoTexto;
                console.log(`📊 Estado detectado: "${this.estadoCompraAgil}"`);
                
                // Verificar si está cancelada
                const estadoLower = estadoTexto.toLowerCase();
                const estadosCancelados = ['cancelada', 'cerrada', 'suspendida', 'anulada'];
                
                const estaCancelada = estadosCancelados.some(estado => 
                    estadoLower.includes(estado)
                );
                
                if (estaCancelada) {
                    console.log('❌ COMPRA ÁGIL CANCELADA - Deteniendo proceso');
                    this.procesoDetenido = true;
                    
                    // Guardar flag en storage
                    await this.guardarEstadoCancelado();
                    // ✅ AGREGAR: Detener monitoreo si está activo
                    this.stopAuthorizationMonitoring();
                    // Actualizar indicador
                    this.updateIndicator('❌ Compra Ágil Cancelada', 'cancelada');
                    
                    // Mostrar mensaje por 10 segundos
                    setTimeout(() => {
                        this.updateIndicator('⚠️ Proceso detenido', 'error');
                    }, 5000);
                    
                    return false; // Proceso detenido
                }
                // ✅ VERIFICACIÓN 2: NUEVA - Si ya está postulada
                const yaPostulada = await this.verificarPostulacionExistente();
                if (yaPostulada) {
                    console.log('✅ POSTULACIÓN YA EXISTE - Deteniendo proceso');
                    return false; // Proceso detenido
                }
                // Si llegamos aquí, está en estado válido (Publicada)
                console.log('✅ Compra Ágil en estado válido - Continuando proceso');
                this.updateIndicator(`✅ Estado: ${this.estadoCompraAgil}`, 'success');
                
                return true; // Proceso puede continuar
                
            } else {
                console.warn('⚠️ No se pudo detectar el estado - Continuando con precaución');
                this.updateIndicator('⚠️ Estado desconocido', 'warning');
                // ✅ VERIFICACIÓN 3: Incluso sin estado detectado, verificar si ya está postulada
                const yaPostulada = await this.verificarPostulacionExistente();
                if (yaPostulada) {
                    console.log('✅ POSTULACIÓN YA EXISTE (sin estado) - Deteniendo proceso');
                    return false; // Proceso detenido
                }
                // Asumir que puede continuar si no detectamos estado
                return true;
            }
            
        } catch (error) {
            console.error('❌ Error verificando estado:', error);
            this.updateIndicator('❌ Error verificando estado', 'error');
            
            // En caso de error, permitir continuar
            return true;
        }
    }
  async actualizarEstadoPostulacion() {
    try {
        console.log('🔄 === INICIO ACTUALIZACIÓN ESTADO POSTULACIÓN ===');

        if (!this.cotizacion) {
            console.warn('⚠️ No hay cotización disponible, omitiendo actualización...');
            return { success: true, message: 'Sin cotización, omitiendo actualización' };
        }

        // ✅ OBTENER RUTs DESDE CHECK-AUTH
        console.log('👤 Obteniendo RUTs desde check-auth...');
        
        const authUrl = this.buildApiUrl('check-auth');
        const authResponse = await this.sendMessageToBackground('API_REQUEST', {
            url: authUrl,
            method: 'GET'
        });

        if (!authResponse.success || !authResponse.data?.authenticated) {
            console.error('❌ Usuario no autenticado:', authResponse);
            return { success: false, message: 'Usuario no autenticado' };
        }

        const rutUsuario = authResponse.data.user?.rut;
        const rutCliente = authResponse.data.company?.rut;
        const companyId = authResponse.data.company?.id || 1;

        if (!rutUsuario || !rutCliente) {
            console.error('❌ RUTs no disponibles en check-auth:', {
                rutUsuario,
                rutCliente,
                authData: authResponse.data
            });
            return { success: false, message: 'RUTs no disponibles en check-auth' };
        }

        console.log('✅ RUTs obtenidos de check-auth:', {
            rutUsuario,
            rutCliente,
            companyId
        });

        const requestData = {
            cotizacion: this.cotizacion,
            company_id: companyId,
            rut_usuario: rutUsuario,
            rut_cliente: rutCliente
        };

        console.log('📦 Datos para actualización:', requestData);

        const apiUrl = this.buildApiUrl('update-estado-postulacion');
        console.log('🔗 URL de API construida:', apiUrl);

        console.log('📡 Enviando actualización de estado...');

        const response = await this.sendMessageToBackground('API_REQUEST', {
            url: apiUrl,
            method: 'POST',
            data: requestData
        });

        console.log('📨 Response del background script:', response);

        if (response.success && response.data?.success) {
            console.log('✅ Estado de postulación actualizado exitosamente:', response.data);
            return response.data;
        } else {
            console.warn('⚠️ Falló la actualización de estado:', response);
            return { 
                success: false, 
                message: 'Error al actualizar estado', 
                error: response.error || response.data?.message || 'Error desconocido'
            };
        }

    } catch (error) {
        console.error('❌ Error en actualizarEstadoPostulacion:', error);
        return { 
            success: false, 
            message: 'Excepción al actualizar estado', 
            error: error.message 
        };
    }
}
    async insertarEstadoPostulacion() {
    try {
        console.log('📝 === INICIO INSERCIÓN ESTADO POSTULACIÓN ===');
        
        // Verificar que tenemos los datos necesarios
        if (!this.cotizacion) {
            console.warn('⚠️ No hay cotización disponible, continuando...');
            this.updateIndicator('⚠️ Sin cotización, continuando...', 'warning');
            return { success: true, message: 'Sin cotización, pero continuando' };
        }
        
        // Obtener company_id de los datos de automatización
        let companyId = null;
        
        console.log('🔍 Buscando company_id en automationData:', this.automationData);
        
        if (this.automationData?.cliente?.id) {
            companyId = this.automationData.cliente.id;
            console.log('✅ Company ID desde cliente:', companyId);
        } else if (this.automationData?.usuario?.company_id) {
            companyId = this.automationData.usuario.company_id;
            console.log('✅ Company ID desde usuario:', companyId);
        } else {
            companyId = 1; // fallback
            console.log('⚠️ Usando company_id fallback:', companyId);
        }
        
        console.log(`📊 Datos para inserción:`, {
            cotizacion: this.cotizacion,
            company_id: companyId,
            automationData: this.automationData
        });
        
        // Construir URL de la API
        const apiUrl = this.buildApiUrl('insertar-estado-postulacion');
        console.log('🔗 URL construida:', apiUrl);
        
        // Preparar datos para envío
        const requestData = {
            cotizacion: this.cotizacion,
            company_id: companyId
        };
        
        console.log('📦 Datos de request:', requestData);
        console.log('📡 Enviando solicitud de inserción...');
        
        // Enviar via background script para manejar CORS
        const response = await this.sendMessageToBackground('API_REQUEST', {
            url: apiUrl,
            method: 'POST',
            data: requestData
        });
        
        console.log('📨 Response completa del background:', response);
        
        // ✅ SIMPLIFICADO: Si es exitoso, proceder
        if (response.success && response.data && response.data.success) {
            console.log('✅ Nuevo intento de postulación registrado:', response.data);
            this.updateIndicator('📝 Postulación registrada', 'processing');
            return response.data;
        }
        
        // ✅ CUALQUIER ERROR: Log pero CONTINUAR proceso
        console.warn('⚠️ Error en registro, pero continuando proceso:', response);
        this.updateIndicator('Registro ya ingresado', 'warning');
        
        // ✅ SIEMPRE retornar success para continuar
        return { 
            success: true, 
            message: 'Continuando proceso a pesar del error',
            error: response.error || response.data?.message || 'Error desconocido'
        };
        
    } catch (error) {
        console.error('❌ === ERROR EN INSERCIÓN ESTADO POSTULACIÓN ===');
        console.error('Error details:', error);
        console.error('Stack trace:', error.stack);
        
        // ✅ INCLUSO EN CATCH, continuar proceso
        console.warn('⚠️ Error en inserción, continuando proceso:', error.message);
        this.updateIndicator('⚠️ Error registro, continuando...', 'warning');
        
        // ✅ NUNCA HACER THROW - SIEMPRE continuar
        return { 
            success: true, 
            message: 'Continuando proceso a pesar del error en catch',
            error: error.message 
        };
    }
    }

    
/**
 * ✅ VERSIÓN SIMPLIFICADA: Usar directamente el config
 */
buildApiUrl(endpoint) {
    try {
        if (window.EXTENSION_CONFIG?.URLS?.PHARMATENDER?.API_BASE) {
            return `${window.EXTENSION_CONFIG.URLS.PHARMATENDER.API_BASE}/${endpoint}`;
        }
    } catch (error) {
        console.warn('⚠️ Error accediendo a config:', error);
    }
    
    // Fallback simple
    return `https://prime.pharmatender.cl/api/extension/${endpoint}`;
}
    // ✅ NUEVA FUNCIÓN: Esperar elementos de la página
    async waitForPageElements(selectors, maxWait = 15000) {
        console.log('⏳ Esperando elementos de estado en la página...');
        
        let elapsed = 0;
        const interval = 500;
        
        while (elapsed < maxWait) {
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`✅ Elementos encontrados: ${selector}`);
                    return true;
                }
            }
            
            await this.delay(interval);
            elapsed += interval;
        }
        
        console.warn('⚠️ Timeout esperando elementos de estado');
        return false;
    }
    
    // ✅ NUEVA FUNCIÓN: Guardar estado cancelado en storage
    async guardarEstadoCancelado() {
        try {
            const estadoData = {
                cotizacion: this.cotizacion,
                estado: this.estadoCompraAgil,
                cancelada: true,
                timestamp: Date.now(),
                url: window.location.href
            };
            
            // Guardar en storage para uso posterior
            await chrome.storage.local.set({
                compraAgilEstadoCancelado: estadoData,
                [`compraAgil_${this.cotizacion}_cancelada`]: estadoData
            });
            
            console.log('💾 Estado cancelado guardado en storage:', estadoData);
            
        } catch (error) {
            console.error('❌ Error guardando estado cancelado:', error);
        }
    }
    extractCotizacionId() {
        try {
            const url = window.location.href;
            
            const patterns = [
                /resumen-cotizacion\/([^\/\?#]+)/,
                /cotizacion\/([^\/\?#]+)/,
                /carga-documentos-ca\/([^\/\?#]+)/
            ];
            
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    this.cotizacion = match[1];
                    console.log(`🎯 Cotización detectada: ${this.cotizacion}`);
                    return;
                }
            }
            
            console.log('ℹ️ No se detectó cotización en la URL');
        } catch (error) {
            console.error('❌ Error extrayendo cotización:', error);
        }
    }
    
    registerInWindow() {
        window.compraAgilAutomation = this;
        console.log('✅ Instancia registrada en window');
    }
    
// ✅ 1. CONTENT-COMPRAAGIL.JS - ARREGLAR setupMessageListener 
setupMessageListener() {
    if (this.messageListenerConfigured) {
        console.log('⚠️ Listener ya configurado, saltando...');
        return;
    }
    this.messageListenerConfigured = true;
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 MENSAJE RECIBIDO:', request.action);
        
        if (request.action === 'startCompraAgilAutomation') {
            console.log('🚀 COMANDO AUTORIZADO desde popup');
            this.startedFromPopup = true;
            
            // ✅ LIMPIAR storage ANTES de ejecutar
            chrome.storage.local.remove(['compraAgilCommand']);
            
            this.iniciarProcesoDesdePopup()
                .then(() => {
                    console.log('✅ Proceso completado');
                    sendResponse({ success: true, message: 'Automatización iniciada' });
                })
                .catch((error) => {
                    console.error('❌ Error:', error);
                    sendResponse({ success: false, message: error.message });
                });
            
            return true;
        }
        
        sendResponse({ success: false, message: 'Acción no reconocida' });
        return false;
    });
    
    // ✅ VERIFICAR STORAGE SOLO UNA VEZ al inicio
    setTimeout(() => {
        this.checkStorageOnce();
    }, 2000);
    
    console.log('✅ Listener configurado');
}
// ✅ 3. CONTENT-COMPRAAGIL.JS - USAR updateIndicator CORRECTAMENTE en checkStorageOnce:
async checkStorageOnce() {
    try {
        const result = await chrome.storage.local.get(['compraAgilCommand']);
        const command = result.compraAgilCommand;
        
        if (!command || command.executed) {
            console.log('ℹ️ No hay comandos pendientes en storage');
            this.updateIndicator('ℹ️ Sin comando desde popup', 'default');
            return;
        }
        
        console.log('🚀 COMANDO PENDIENTE encontrado, ejecutando...');
        this.updateIndicator('🚀 Iniciando postulación...', 'processing');
        
        // Marcar como ejecutado INMEDIATAMENTE
        command.executed = true;
        command.executedAt = Date.now();
        await chrome.storage.local.set({ 'compraAgilCommand': command });
        
        this.startedFromPopup = true;
        console.log('🎯 INICIANDO AUTOMATIZACIÓN DESDE STORAGE...');
        
        this.iniciarProcesoDesdePopup()
            .then(() => {
                console.log('✅ Automatización desde storage completada');
                //this.updateIndicator('✅ Postulación completada', 'success');
                // ✅ LIMPIAR comando después de completar
                chrome.storage.local.remove(['compraAgilCommand']);
            })
            .catch((error) => {
                console.error('❌ Error en automatización storage:', error);
                this.updateIndicator(`❌ Error: ${error.message}`, 'error');
            });
            
    } catch (error) {
        console.error('❌ Error verificando storage:', error);
        this.updateIndicator('❌ Error verificando comandos', 'error');
    }
}


// ✅ 3. CONTENT-COMPRAAGIL.JS - MODIFICAR iniciarProcesoDesdePopup para indicadores
async iniciarProcesoDesdePopup() {
    try {
        console.log('🚀 === INICIANDO PROCESO DESDE POPUP ===');
        this.updateIndicator('🔍 Verificando estado...', 'processing');
        
        // Verificar estado antes de continuar
        console.log('🔍 Verificando estado de CA...');
        const estadoValido = await this.verificarEstadoCompraAgil();
        console.log('📊 Estado válido:', estadoValido);
        
        if (!estadoValido) {
            console.log('❌ Estado no válido, proceso detenido');
            // El verificarEstadoCompraAgil ya maneja el indicador
            return;
        }
        
        // Iniciar monitoreo de autorización
        console.log('👁️ Iniciando monitoreo autorización...');
        this.updateIndicator('👁️ Iniciando monitoreo...', 'processing');
        await this.startAuthorizationMonitoring();
        
        console.log('✅ Proceso iniciado correctamente desde popup');
        
    } catch (error) {
        console.error('❌ Error en iniciarProcesoDesdePopup:', error);
        this.updateIndicator(`❌ Error: ${error.message}`, 'error');
        throw error;
    }
}
// ✅ 4. CONTENT-COMPRAAGIL.JS - MODIFICAR fillFormData para indicadores de progreso  
async fillFormData() {
    try {
        console.log('📝 === LLENANDO FORMULARIO COMPLETO ===');
        this.updateIndicator('💰 Ingresando precios...', 'processing');
        
        // ✅ PASO 1: Llenar precios
        console.log('💰 PASO 1: Llenando precios...');
        await this.fillPricesWithoutAutoSubmit();
        await this.delay(1000);

        // ✅ PASO 2: Llenar despacho
        console.log('🚚 PASO 2: Llenando despacho...');
        this.updateIndicator('🚚 Ingresando despacho...', 'processing');
        await this.fillDespacho();
        await this.delay(1000);

        // ✅ PASO 3: Llenar descripción
        console.log('📝 PASO 3: Llenando descripción...');
        this.updateIndicator('📝 Ingresando descripción...', 'processing');
        await this.fillDescripcion();
        await this.delay(1000);

        // ✅ PASO 4: Subir documentos (si los hay)
        if (this.automationData.documentos && this.automationData.documentos.length > 0) {
            console.log('📎 PASO 4: Subiendo documentos...');
            this.updateIndicator('📄 Cargando documentos...', 'processing');
            try {
                await this.uploadDocuments();
            } catch (docError) {
                console.error('❌ Error en documentos, pero continuando:', docError);
                this.updateIndicator('⚠️ Error en documentos', 'warning');
            }
        }

        this.updateIndicator('✅ Formulario completado', 'success');
        console.log('✅ Formulario completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error llenando formulario:', error);
        this.updateIndicator('❌ Error llenando formulario', 'error');
        throw error;
    }
}


// ✅ NUEVA FUNCIÓN: Validar antes de ejecutar automatización existente
async validateAndStartAutomation(data) {
    try {
        console.log('🔒 === VALIDANDO ANTES DE EJECUTAR ===');
        
        // ✅ VALIDACIÓN 1: Verificar autorización del usuario
        const hasAuthorization = await this.checkUserAuthorization();
        if (!hasAuthorization) {
            console.log('🚫 SIN AUTORIZACIÓN DEL USUARIO - No se ejecutará');
            this.updateIndicator('🚫 Sin autorización', 'error');
            return;
        }

        // ✅ VALIDACIÓN 2: Verificar que la cotización coincida
        const cotizationMatches = await this.validateCotizacionMatch();
        if (!cotizationMatches) {
            console.log('❌ COTIZACIÓN NO COINCIDE - No se ejecutará');
            this.updateIndicator('❌ Cotización incorrecta', 'error');
            await this.clearUserAuthorization();
            return;
        }

        console.log('✅ VALIDACIONES PASADAS - Ejecutando automatización original');
        
        // ✅ EJECUTAR FUNCIÓN ORIGINAL si pasa validaciones
        this.startAutomation({ success: true, data: data });
        
    } catch (error) {
        console.error('❌ Error en validaciones:', error);
        this.updateIndicator('❌ Error en validaciones', 'error');
    }
}
     // ✅ NUEVA FUNCIÓN: Manejar ejecución autorizada
    async handleAuthorizedExecution(data) {
        if (!this.userAuthorized) {
            console.log('🚫 Intento de ejecución sin autorización válida');
            return;
        }

        console.log('✅ Ejecución autorizada iniciada');
        await this.startAutomation({ success: true, data: data });
    }
     async checkForAutomationData() {
        if (!this.cotizacion) return;
          // ✅ AGREGAR: Verificar si está cancelada antes de buscar datos
        if (this.procesoDetenido) {
            console.log('🛑 Proceso detenido - no buscar datos de automatización');
            return;
        }
        // ✅ VERIFICACIÓN ADICIONAL antes de buscar datos
        if (!this.extensionActive) {
            console.log('⚠️ Extensión desactivada - No buscar datos de automatización');
            return;
        }
        
        try {
            console.log('📦 Verificando datos de automatización en storage...');
            
            const result = await chrome.storage.local.get(['compraAgilAutomationData', 'mpAutomationData']);
            
            let dataToUse = null;
            
            // Prioridad 1: Datos específicos de Compra Ágil
            if (result.compraAgilAutomationData) {
                const caData = result.compraAgilAutomationData;
                const age = Date.now() - caData.timestamp;
                
                console.log('📊 Datos específicos de CA encontrados:', caData);
                console.log('⏰ Edad de datos CA:', Math.round(age / 1000), 'segundos');
                
                if (age < 10 * 60 * 1000 && caData.cotizacion === this.cotizacion) {
                    console.log('✅ Usando datos específicos de Compra Ágil');
                    dataToUse = {
                        success: true,
                        data: caData.data
                    };
                }
            }
            
            // Prioridad 2: Datos generales de automatización
            if (!dataToUse && result.mpAutomationData) {
                const mpData = result.mpAutomationData;
                const age = Date.now() - mpData.timestamp;
                
                console.log('📊 Datos generales de MP encontrados:', mpData);
                console.log('⏰ Edad de datos MP:', Math.round(age / 1000), 'segundos');
                
                if (age < 10 * 60 * 1000 && mpData.cotizacionData) {
                    console.log('✅ Usando datos de cotización desde MP data');
                    dataToUse = {
                        success: true,
                        data: mpData.cotizacionData
                    };
                }
            }
              // ✅ VERIFICAR si ya se procesaron documentos
 
            if (dataToUse) {
                // ✅ VERIFICACIÓN FINAL antes de ejecutar
                if (this.extensionActive) {
                    console.log('🚀 Iniciando automatización con datos del storage...');
                    setTimeout(() => {
                        this.startAutomation(dataToUse);
                    }, 3000);
                } else {
                    console.log('⚠️ Extensión se desactivó mientras se verificaban datos');
                    this.showDisabledIndicator();
                }
            } else {
                console.log('⚠️ No se encontraron datos válidos en storage');
                this.updateIndicator('⚠️ Sin datos en storage', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error verificando storage:', error);
        }
                   try {
                const result = await chrome.storage.local.get([`documentos_procesados_${this.cotizacion}`]);
                const procesado = result[`documentos_procesados_${this.cotizacion}`];
                
                if (procesado && procesado.completed) {
                    console.log('✅ Documentos ya fueron procesados, saltando automatización');
                    this.updateIndicator('✅ Ya procesado', 'success');
                    return;
                }
            } catch (error) {
                console.error('Error verificando estado:', error);
            }
    }
    
    
     async startAutomation(data = null) {
        // ✅ VERIFICACIÓN OBLIGATORIA antes de iniciar
        if (!this.extensionActive) {
            console.log('❌ AUTOMATIZACIÓN BLOQUEADA - Extensión desactivada');
            this.showDisabledIndicator();
            return;
        }
        
        if (this.isRunning) {
            console.log('⚠️ Automatización ya en curso');
            return;
        }
        
        if (!this.cotizacion) {
            console.error('❌ No hay cotización detectada');
            this.updateIndicator('❌ Sin cotización', 'error');
            return;
        }
        
        if (!data || !data.success || !data.data) {
            console.error('❌ Datos inválidos para automatización');
            this.updateIndicator('❌ Datos inválidos', 'error');
            return;
        }
        
        // ✅ VERIFICACIÓN DOBLE durante ejecución
        const currentState = await this.checkExtensionState();
        if (!currentState) {
            console.log('❌ Extensión se desactivó antes de ejecutar');
            this.showDisabledIndicator();
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 INICIANDO AUTOMATIZACIÓN COMPRA ÁGIL (EXTENSIÓN ACTIVA)');
        console.log('🎯 Cotización:', this.cotizacion);
        console.log('📊 Datos recibidos:', data.data);
        
        try {
            // Extraer datos de automatización
            this.automationData = data.data.automatizacion;
            
            if (!this.automationData) {
                throw new Error('No se encontraron datos de automatización en la respuesta');
            }
            
            console.log('📊 Datos de automatización extraídos:', this.automationData);
            
            this.updateIndicator('⏳ Esperando página...', 'processing');
            
            // Esperar a que la página esté lista
            await this.waitForPageReady();
            
            this.updateIndicator('🔄 Procesando campos...', 'processing');
            
            // ✅ VERIFICACIÓN durante ejecución
            if (!this.extensionActive) {
                throw new Error('Extensión se desactivó durante la ejecución');
            }
            
            // Ejecutar automatización
            await this.executeAutomation();
            
            console.log('✅ AUTOMATIZACIÓN COMPLETADA EXITOSAMENTE');
            this.updateIndicator('✅ ¡Completado!', 'success');
            
        } catch (error) {
            console.error('❌ ERROR EN AUTOMATIZACIÓN:', error);
            this.updateIndicator('❌ Error: ' + error.message, 'error');
            
            // Retry si no hemos superado el máximo y extensión sigue activa
            if (this.retryCount < this.maxRetries && this.extensionActive) {
                this.retryCount++;
                console.log(`🔄 Reintentando (${this.retryCount}/${this.maxRetries})...`);
                this.updateIndicator(`🔄 Reintentando ${this.retryCount}/${this.maxRetries}...`, 'processing');
                
                setTimeout(() => {
                    this.isRunning = false;
                    this.startAutomation(data);
                }, 5000);
            }
        } finally {
            if (this.retryCount >= this.maxRetries || !this.extensionActive) {
                this.isRunning = false;
            }
        }
    }
    // ✅ NUEVA FUNCIÓN: Mostrar indicador de extensión desactivada
    showDisabledIndicator() {
        const existing = document.getElementById('compra-agil-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'compra-agil-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 20px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                user-select: none;
                opacity: 0.7;
            ">
                ⚠️ EXTENSIÓN DESACTIVADA
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.remove();
            }
        }, 5000);
    }

    // ✅ NUEVA FUNCIÓN: Monitorear cambios de estado durante la ejecución
    startStateMonitoring() {
        if (this.stateMonitorInterval) {
            clearInterval(this.stateMonitorInterval);
        }
        
        this.stateMonitorInterval = setInterval(async () => {
            const currentState = await this.checkExtensionState();
            
            if (this.extensionActive && !currentState) {
                console.log('⚠️ EXTENSIÓN SE DESACTIVÓ - Deteniendo proceso');
                this.extensionActive = false;
                
                if (this.isRunning) {
                    this.isRunning = false;
                    this.updateIndicator('⚠️ Proceso detenido - Extensión desactivada', 'error');
                }
                
                this.showDisabledIndicator();
                clearInterval(this.stateMonitorInterval);
            }
        }, 2000); // Verificar cada 2 segundos
    }
    
    async waitForPageReady() {
        console.log('⏳ Esperando a que la página esté lista...');
        
        let attempts = 0;
        const maxAttempts = 60;
        
        while (attempts < maxAttempts) {
            try {
                // Buscar inputs de Material-UI
                const muiInputs = document.querySelectorAll('input.MuiInputBase-input[type="text"]');
                const textarea = document.querySelector('textarea');
                
                console.log(`⏳ Intento ${attempts + 1}/${maxAttempts}: ${muiInputs.length} inputs, textarea: ${textarea ? 'Sí' : 'No'}`);
                
                if (muiInputs.length >= 2 && textarea) {
                    // Verificar que sean visibles
                    let visibleInputs = 0;
                    for (const input of muiInputs) {
                        if (input.offsetParent !== null) {
                            visibleInputs++;
                        }
                    }
                    
                    if (visibleInputs >= 2) {
                        console.log(`✅ Página lista - ${visibleInputs} inputs visibles confirmados`);
                        return;
                    }
                }
                
                attempts++;
                await this.delay(1000);
                
            } catch (error) {
                console.error(`❌ Error en intento ${attempts + 1}:`, error);
                attempts++;
                await this.delay(1000);
            }
        }
        
        throw new Error('La página no se cargó completamente en el tiempo esperado');
    }
    
  async executeAutomation() {
    console.log('🔄 Ejecutando automatización paso a paso...');

    try {
        // ✅ PASO 0: Insertar estado de postulación AL INICIO
        console.log('📝 PASO 0: Registrando postulación...');
        this.updateIndicator('📝 Registrando postulación...', 'processing');
        await this.insertarEstadoPostulacion();
        await this.delay(500);

        // ✅ PASO 1: Llenar valores unitarios
        console.log('💰 PASO 1: Llenando valores unitarios...');
        this.updateIndicator('💰 Llenando valores unitarios...', 'processing');
        await this.fillValorUnitario();
        await this.delay(1000);

        // ✅ PASO 2: Llenar valor de despacho
        console.log('🚚 PASO 2: Llenando valor de despacho...');
        this.updateIndicator('🚚 Llenando valor de despacho...', 'processing');
        await this.fillValorDespacho();
        await this.delay(1000);

        // ✅ PASO 3: Llenar descripción
        console.log('📝 PASO 3: Llenando descripción...');
        this.updateIndicator('📝 Llenando descripción...', 'processing');
        await this.fillDescripcion();
        await this.delay(1000);

        // ✅ PASO 4: Subir documentos (si los hay)
        console.log('📎 PASO 4: Subiendo documentos...');
        this.updateIndicator('📎 Subiendo documentos...', 'processing');
        try {
            await this.uploadDocuments();
        } catch (docError) {
            console.error('❌ Error en documentos, pero continuando:', docError);
            this.updateIndicator('⚠️ Error en documentos, formulario completado', 'warning');
        }

        // ✅ PASO 5: Click en botón "Enviar cotización"
        console.log('📤 PASO 5: Haciendo click en botón de envío...');
        this.updateIndicator('📤 Click en "Enviar cotización"...', 'processing');
        
        const envioExitoso = await clickEnviarCotizacionButton();
        if (!envioExitoso) {
            throw new Error('No se pudo hacer click en enviar cotización');
        }
        
        await this.delay(2000); // Esperar que aparezca el modal

        // ✅ PASO 6: Marcar declaración jurada
        console.log('🖊️ PASO 6: Firmando declaración jurada...');
        this.updateIndicator('🖊️ Firmando declaración jurada...', 'processing');
        
        const checkboxMarcado = await marcarCheckboxDeclaracionJurada();
        if (!checkboxMarcado) {
            console.warn('⚠️ No se pudo marcar checkbox, pero continuando...');
        }
        
        await this.delay(1000);

        // ✅ PASO 7: Esperar acción final del usuario
        console.log('👀 PASO 7: Esperando envío manual del usuario...');
        this.updateIndicator('👀 Esperando que hagas click en "Aceptar y Enviar"...', 'waiting');
        
        mostrarMensajeEsperandoEnvio();

        iniciarVigilanciaEnvioCotizacion(() => {
            ocultarMensajeEsperandoEnvio();
            this.updateIndicator('🚀 Click manual detectado, esperando confirmación...', 'processing');

            observarCambioDeUrlYConfirmarExito(() => {
            // ✅ VERIFICAR FLAG ANTES DE PROCEDER
            if (this.estadoActualizacionEnviado) {
                console.log('⏩ Actualización ya enviada, saltando...');
                return;
            }

            this.updateIndicator('🎉 Cotización enviada correctamente', 'success');
            
            const currentUrl = window.location.href;
            if (currentUrl.includes('cotizacion-publicada') || 
                currentUrl.includes('enviada') ||
                currentUrl.includes('confirmada')) {
                
                console.log('📍 URL exitosa detectada, actualizando estado...');
                
                // ✅ MARCAR COMO ENVIADO INMEDIATAMENTE
                this.estadoActualizacionEnviado = true;

                this.actualizarEstadoPostulacion()
                    .then(res => {
                        console.log('📝 Resultado actualización estado:', res);
                        if (res.success) {
                            this.updateIndicator('✅ Estado actualizado correctamente', 'success');
                        } else {
                            console.warn('⚠️ Error actualizando estado:', res.error);
                            this.updateIndicator('⚠️ Completado (error actualizando estado)', 'warning');
                        }
                    })
                    .catch(err => {
                        console.error('❌ Error al actualizar estado:', err);
                        this.updateIndicator('⚠️ Completado (sin actualización estado)', 'warning');
                    });
            }
        });
        });

        console.log('✅ Todos los pasos completados exitosamente');
        this.updateIndicator('✅ ¡Automatización completada!', 'success');

    } catch (error) {
        console.error('❌ Error ejecutando automatización:', error);
        this.updateIndicator('❌ Error en automatización: ' + error.message, 'error');
        throw error;
    }
}

    
    
    /*async fillValorUnitario() {
        console.log('💰 Iniciando llenado SUAVE de valores unitarios...');
        
        const valorUnitarioInputs = this.findRealValorUnitarioInputsImproved();
        
        if (valorUnitarioInputs.length === 0) {
            throw new Error('No se encontraron inputs de valor unitario');
        }
        
        // Crear mapa de precios
        const preciosPorItemPht = {};
        if (this.automationData.items_precios) {
            this.automationData.items_precios.forEach(item => {
                preciosPorItemPht[item.item_pht] = item.precio;
            });
        }
        
        console.log('📊 Mapa de precios:', preciosPorItemPht);
        console.log('💰 Valor default:', this.automationData.valor_default);
        
        // ✅ DELAY INICIAL para asegurar que la página esté estable
        console.log('⏳ Esperando estabilización de página...');
        await this.delay(1000);
        
        // ✅ Procesar cada input con delays largos
        for (let i = 0; i < valorUnitarioInputs.length; i++) {
            const input = valorUnitarioInputs[i];
            const itemPht = i + 1;
            
            let valor;
            if (preciosPorItemPht.hasOwnProperty(itemPht)) {
                valor = preciosPorItemPht[itemPht];
                console.log(`💰 Item ${itemPht}: Precio específico = $${valor}`);
            } else {
                valor = this.automationData.valor_default || 1;
                console.log(`💰 Item ${itemPht}: Valor default = $${valor}`);
            }
            
            // ✅ USAR MÉTODO SUAVE
            console.log(`📝 Procesando item ${itemPht} de ${valorUnitarioInputs.length}...`);
            
            const success = await this.fillInputWithValue(input, valor, `Item ${itemPht}`);
            
            if (!success) {
                console.error(`❌ Error en item ${itemPht}, intentando método básico...`);
                await this.fillInputBasic(input, valor, `Item ${itemPht} (básico)`);
            }
            
            // ✅ DELAY LARGO entre items para evitar envíos automáticos
            if (i < valorUnitarioInputs.length - 1) {
                console.log(`⏳ Esperando antes del siguiente item... (${i + 1}/${valorUnitarioInputs.length})`);
                await this.delay(1000); // 3 segundos entre items
            }
            
            this.processedItems++;
        }
        
        console.log(`✅ ${this.processedItems} valores procesados SIN envío automático`);
        
        // ✅ PAUSA FINAL antes de continuar
        console.log('⏳ Pausa final para verificar que no se envía automáticamente...');
        await this.delay(1000);
        
        console.log('✅ Llenado completo - verificar que no se haya enviado cotización');
    }*/
async fillValorUnitario() {
    console.log('💰 Iniciando llenado ULTRA RÁPIDO de valores unitarios...');
    
    const valorUnitarioInputs = this.findRealValorUnitarioInputsImproved();
    
    if (valorUnitarioInputs.length === 0) {
        throw new Error('No se encontraron inputs de valor unitario');
    }
    
    // Crear mapa de precios
    const preciosPorItemPht = {};
    if (this.automationData.items_precios) {
        this.automationData.items_precios.forEach(item => {
            preciosPorItemPht[item.item_pht] = item.precio;
        });
    }
    
    console.log('📊 Mapa de precios:', preciosPorItemPht);
    console.log('💰 Valor default:', this.automationData.valor_default);
    
    // ✅ DELAY INICIAL MÍNIMO
    await this.delay(300);
    
    // ✅ PROCESAR SIN DELAYS - MÁXIMA VELOCIDAD
    for (let i = 0; i < valorUnitarioInputs.length; i++) {
        const input = valorUnitarioInputs[i];
        const itemPht = i + 1;
        
        let valor;
        if (preciosPorItemPht.hasOwnProperty(itemPht)) {
            valor = preciosPorItemPht[itemPht];
        } else {
            valor = this.automationData.valor_default || 1;
        }
        
        // ✅ SIN LOGGING EXCESIVO PARA VELOCIDAD
        const success = await this.fillInputWithValue(input, valor, `Item ${itemPht}`);
        
        if (!success) {
            await this.fillInputBasic(input, valor, `Item ${itemPht}`);
        }
        
        // ✅ CERO DELAYS ENTRE ITEMS
        this.processedItems++;
    }
    
    console.log(`✅ ${this.processedItems} valores procesados ULTRA RÁPIDO`);
    
    // ✅ VERIFICACIÓN FINAL MÍNIMA
    await this.delay(200);
    
    console.log('✅ Llenado completo');
}
// ✅ NUEVA FUNCIÓN: Llenado rápido optimizado
// ✅ FUNCIÓN CORREGIDA: Simula interacción humana real
async fillInputWithValueFast(input, value, description = '') {
    try {
        // ✅ VALIDACIONES RÁPIDAS (manteniendo las existentes)
        if (!this.isRealInput(input)) {
            console.log(`🚫 ELEMENTO RECHAZADO: No es un input válido - ${description}`);
            return false;
        }
        
        if (this.isNearDownloadLink(input)) {
            console.log(`🚫 ELEMENTO RECHAZADO: Está cerca de enlace de descarga - ${description}`);
            return false;
        }
        
        // ✅ PREPARACIÓN
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // ✅ SIMULAR INTERACCIÓN HUMANA REAL PARA REACT/VUE
        
        // 1. Focus real
        input.focus();
        
        // 2. Simular click del usuario
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        input.dispatchEvent(clickEvent);
        
        // 3. Simular selección del contenido existente
        input.select();
        
        // 4. Simular borrado del contenido (backspace)
        const backspaceEvent = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            keyCode: 8,
            bubbles: true,
            cancelable: true
        });
        input.dispatchEvent(backspaceEvent);
        
        // 5. Limpiar valor
        input.value = '';
        
        // 6. Disparar input event para el borrado
        input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        
        // 7. Simular escritura carácter por carácter (CLAVE PARA REACT)
        const valueStr = value.toString();
        for (let i = 0; i < valueStr.length; i++) {
            // Simular keydown para cada carácter
            const keydownEvent = new KeyboardEvent('keydown', {
                key: valueStr[i],
                code: `Digit${valueStr[i]}`,
                keyCode: valueStr[i].charCodeAt(0),
                bubbles: true,
                cancelable: true
            });
            input.dispatchEvent(keydownEvent);
            
            // Agregar carácter al valor
            input.value = valueStr.substring(0, i + 1);
            
            // Disparar input event para cada carácter
            input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            
            // Simular keyup
            const keyupEvent = new KeyboardEvent('keyup', {
                key: valueStr[i],
                code: `Digit${valueStr[i]}`,
                keyCode: valueStr[i].charCodeAt(0),
                bubbles: true,
                cancelable: true
            });
            input.dispatchEvent(keyupEvent);
        }
        
        // 8. Eventos finales críticos para React/Vue
        
        // Change event (CRÍTICO)
        input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        
        // Blur event (simular que el usuario sale del campo)
        input.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }));
        
        // 9. Input event final con propiedades React
        const finalInputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: valueStr
        });
        
        // Agregar propiedades que React espera
        Object.defineProperty(finalInputEvent, 'target', {
            value: input,
            configurable: true
        });
        
        Object.defineProperty(finalInputEvent, 'currentTarget', {
            value: input,
            configurable: true
        });
        
        input.dispatchEvent(finalInputEvent);
        
        console.log(`⚡ REAL INTERACTION: ${description} = ${value} (React/Vue compatible)`);
        return true;
        
    } catch (error) {
        console.error(`❌ REAL INTERACTION error en ${description}:`, error);
        return false;
    }
}
// ✅ NUEVO MÉTODO: Método aún más básico para testing
async fillInputBasic(input, value, description = '') {
    try {
        console.log(`📝 BASIC INPUT: ${description} = ${value}`);
        
        // Enfoque ultra simple
        input.focus();
        await this.delay(200);
        
        // Solo cambiar value directamente
        input.value = value.toString();
        
        // Solo el evento input más básico
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        await this.delay(500);
        
        console.log(`✅ BASIC INPUT: ${description} completado`);
        return true;
        
    } catch (error) {
        console.error(`❌ BASIC INPUT error:`, error);
        return false;
    }
}

   // ✅ MEJORAR: findRealValorUnitarioInputsImproved()
findRealValorUnitarioInputsImproved() {
    console.log('🔍 Buscando inputs REALES con validación estricta...');
    
    // ✅ SELECTORES MÁS ESPECÍFICOS
    const specificSelectors = [
        'input.MuiInputBase-input[type="text"]:not([readonly]):not([disabled])',
        'input[type="number"]:not([readonly]):not([disabled])',
        'input[type="tel"]:not([readonly]):not([disabled])'
    ];
    
    const allInputs = [];
    
    // Buscar con selectores específicos
    specificSelectors.forEach(selector => {
        const foundInputs = document.querySelectorAll(selector);
        foundInputs.forEach(input => {
            if (!allInputs.includes(input)) {
                allInputs.push(input);
            }
        });
    });
    
    console.log(`📋 Total inputs encontrados: ${allInputs.length}`);
    
    // ✅ FILTRAR con validaciones estrictas
    const valorUnitarioInputs = [];
    
    for (const input of allInputs) {
        // Verificar que sea input real
        if (!this.isRealInput(input)) {
            continue;
        }
        
        // Verificar que no esté cerca de descargas
        if (this.isNearDownloadLink(input)) {
            continue;
        }
        
        // Verificar que sea de valor unitario
        if (this.isValorUnitarioInputImproved(input)) {
            valorUnitarioInputs.push(input);
        }
    }
    
    console.log(`📋 Inputs de valor unitario válidos: ${valorUnitarioInputs.length}`);
    return valorUnitarioInputs;
}
isValorUnitarioInputImproved(input) {
    try {
        // Verificar que el input esté visible y habilitado
        if (!input.offsetParent || input.disabled || input.readOnly) {
            return false;
        }
        
        // Buscar contexto que indique valor unitario
        let container = input.closest('div');
        let attempts = 0;
        
        while (container && attempts < 10) {
            const textContent = container.textContent?.toLowerCase() || '';
            
            // Indicadores positivos
            if (textContent.includes('valor unitario') || textContent.includes('precio unitario')) {
                // Verificar que NO sea despacho
                if (!textContent.includes('despacho') && !textContent.includes('envío')) {
                    return true;
                }
            }
            
            // Buscar label asociado
            const label = container.querySelector('label');
            if (label) {
                const labelText = label.textContent?.toLowerCase() || '';
                if (labelText.includes('valor unitario') && !labelText.includes('despacho')) {
                    return true;
                }
            }
            
            container = container.parentElement;
            attempts++;
        }
        
        return false;
    } catch (error) {
        console.warn('⚠️ Error verificando input de valor unitario:', error);
        return false;
    }
}   

    // ✅ FUNCIÓN PARA MOSTRAR RESUMEN DE PRECIOS APLICADOS
    logPricingSummary(totalInputs, preciosPorItemPht) {
        console.log('\n📊 RESUMEN DE PRECIOS APLICADOS:');
        console.log('=====================================');
        
        let specificCount = 0;
        let defaultCount = 0;
        
        for (let i = 1; i <= totalInputs; i++) {
            if (preciosPorItemPht.hasOwnProperty(i)) {
                console.log(`✅ Item ${i}: $${preciosPorItemPht[i]} (específico)`);
                specificCount++;
            } else {
                console.log(`📝 Item ${i}: $${this.automationData.valor_default || 1} (default)`);
                defaultCount++;
            }
        }
        
        console.log('=====================================');
        console.log(`📈 Total items: ${totalInputs}`);
        console.log(`🎯 Precios específicos: ${specificCount}`);
        console.log(`📋 Precios default: ${defaultCount}`);
        console.log('=====================================\n');
    }
    // ✅ FUNCIÓN DEBUG SIMPLIFICADA
    debugPriceMapping() {
        console.log('🐛 DEBUG: Análisis de mapeo de precios...');
        
        const allInputs = document.querySelectorAll('input.MuiInputBase-input[type="text"]');
        const valorUnitarioInputs = [];
        
        for (const input of allInputs) {
            if (this.isValorUnitarioInput(input)) {
                valorUnitarioInputs.push(input);
            }
        }
        
        console.log(`🔍 Total inputs de valor unitario: ${valorUnitarioInputs.length}`);
        
        // Mostrar mapeo actual
        console.log('\n🎯 MAPEO ACTUAL (Posición -> Item PHT):');
        valorUnitarioInputs.forEach((input, index) => {
            const itemPht = index + 1;
            const currentValue = input.value || '(vacío)';
            console.log(`  Input ${index + 1} -> Item PHT ${itemPht}: "${currentValue}"`);
        });
        
        // Mostrar precios del endpoint
        if (this.automationData?.items_precios) {
            console.log('\n📊 PRECIOS DESDE ENDPOINT:');
            const preciosPorItemPht = {};
            this.automationData.items_precios.forEach(item => {
                preciosPorItemPht[item.item_pht] = item.precio;
                console.log(`  Item PHT ${item.item_pht}: $${item.precio}`);
            });
            console.log(`  Valor default: $${this.automationData.valor_default}`);
            
            // Mostrar qué precio debería tener cada input
            console.log('\n🎲 PRECIOS QUE SE APLICARÍAN:');
            for (let i = 1; i <= valorUnitarioInputs.length; i++) {
                const precio = preciosPorItemPht.hasOwnProperty(i) 
                    ? `$${preciosPorItemPht[i]} (específico)`
                    : `$${this.automationData.valor_default || 1} (default)`;
                console.log(`  Input ${i} (Item PHT ${i}): ${precio}`);
            }
        }
        
        console.log('\n🐛 DEBUG: Análisis completado');
    }
    // ✅ ESTRATEGIA 1: Buscar por label exacto
    findInputsByLabel() {
        const inputs = [];
        
        // Buscar todos los labels que contienen "Valor unitario"
        const labels = document.querySelectorAll('label');
        
        for (const label of labels) {
            const labelText = label.textContent.trim().toLowerCase();
            
            // Solo labels que digan exactamente "valor unitario" (no despacho, no subtotal)
            if (labelText === 'valor unitario') {
                // Buscar el input asociado a este label
                const input = this.findInputForLabel(label);
                if (input && input.type === 'text' && !input.disabled) {
                    inputs.push(input);
                    console.log(`🎯 Input encontrado por label: ${label.textContent}`);
                }
            }
        }
        
        return inputs;
    }


    // ✅ BUSCAR INPUT ASOCIADO A UN LABEL
findInputForLabel(label) {
    try {
        // Método 1: for attribute
        if (label.getAttribute('for')) {
            const input = document.getElementById(label.getAttribute('for'));
            if (input) return input;
        }
        
        // Método 2: input dentro del label
        const input = label.querySelector('input[type="text"]');
        if (input) return input;
        
        // Método 3: input siguiente al label
        let sibling = label.nextElementSibling;
        let attempts = 0;
        
        while (sibling && attempts < 5) {
            const input = sibling.querySelector('input[type="text"]');
            if (input) return input;
            
            sibling = sibling.nextElementSibling;
            attempts++;
        }
        
        // Método 4: input en contenedor padre
        const container = label.closest('div');
        if (container) {
            const input = container.querySelector('input[type="text"]:not([disabled])');
            if (input) return input;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}
    // ✅ ESTRATEGIA 2: Buscar por estructura HTML
    findInputsByStructure() {
        const inputs = [];
        
        // Buscar todos los inputs de texto no disabled
        const allInputs = document.querySelectorAll('input[type="text"]:not([disabled])');
        
        for (const input of allInputs) {
            // Verificar que esté en una estructura que parece de valor unitario
            if (this.isRealValorUnitarioInput(input)) {
                inputs.push(input);
            }
        }
        
        return inputs;
    }

    // ✅ VERIFICAR SI ESTÁ EN ESTRUCTURA DE PRODUCTO
isInProductStructure(container) {
    try {
        const textContent = container.textContent || '';
        
        // Buscar indicadores de que es un item/producto
        const productIndicators = [
            'unidad',       // "25 Unidad", "100 Unidad"
            'ml',           // "500 ML", "250 ML"
            'cantidad',     // Campo cantidad
            'suero',        // Productos específicos
            'id:',          // "ID: 31798635"
            'electrolitos'  // Categoría
        ];
        
        const hasProductIndicator = productIndicators.some(indicator => 
            textContent.toLowerCase().includes(indicator)
        );
        
        return hasProductIndicator;
    } catch (error) {
        return false;
    }
}

    // ✅ ESTRATEGIA 3: Filtros estrictos
    findInputsWithStrictFiltering() {
        const allInputs = document.querySelectorAll('input.MuiInputBase-input[type="text"]:not([disabled])');
        const filteredInputs = [];
        
        for (const input of allInputs) {
            // Verificaciones estrictas
            if (this.passesStrictFilters(input)) {
                filteredInputs.push(input);
            }
        }
        
        return filteredInputs;
    }
// ✅ FILTROS ESTRICTOS ADICIONALES
passesStrictFilters(input) {
    try {
        // Filter 1: No debe estar en footer, header, o sidebar
        const isInMainContent = !input.closest('footer, header, aside, .sidebar, .footer');
        
        // Filter 2: Debe tener un símbolo de moneda cerca
        const hasCurrencySymbol = this.hasCurrencySymbolNearby(input);
        
        // Filter 3: No debe ser un campo de fecha
        const isNotDateField = !this.isDateField(input);
        
        // Filter 4: Debe estar visible
        const isVisible = input.offsetParent !== null;
        
        return isInMainContent && hasCurrencySymbol && isNotDateField && isVisible;
        
    } catch (error) {
        return false;
    }
}
// ✅ VERIFICAR SÍMBOLO DE MONEDA CERCANO
hasCurrencySymbolNearby(input) {
    try {
        const container = input.closest('div');
        if (!container) return false;
        
        const textContent = container.textContent || '';
        return textContent.includes('$') || textContent.includes('CLP') || textContent.includes('peso');
    } catch (error) {
        return false;
    }
}
// ✅ VERIFICAR SI ES CAMPO DE FECHA
isDateField(input) {
    try {
        const value = input.value || '';
        const placeholder = input.placeholder || '';
        
        // Patrones de fecha comunes
        const datePatterns = [
            /\d{2}\/\d{2}\/\d{4}/,  // 08/07/2025
            /\d{4}-\d{2}-\d{2}/,    // 2025-07-08
            /\d{2}-\d{2}-\d{4}/     // 08-07-2025
        ];
        
        return datePatterns.some(pattern => 
            pattern.test(value) || pattern.test(placeholder)
        );
    } catch (error) {
        return false;
    }
}

    // ✅ FUNCIÓN PARA VALIDAR DATOS ANTES DE PROCESAR
    validateAutomationData() {
        if (!this.automationData) {
            throw new Error('No hay datos de automatización');
        }
        
        if (!this.automationData.items_precios) {
            console.warn('⚠️ No hay items_precios en automatizationData, usando solo valor default');
            this.automationData.items_precios = [];
        }
        
        if (!this.automationData.valor_default) {
            console.warn('⚠️ No hay valor_default, usando 1');
            this.automationData.valor_default = 1;
        }
        
        console.log('✅ Datos de automatización validados:', {
            items_precios: this.automationData.items_precios.length,
            valor_default: this.automationData.valor_default,
            documentos: this.automationData.documentos?.length || 0
        });
    }
    isValorUnitarioInput(input) {
        try {
            let container = input.closest('div');
            let attempts = 0;
            
            while (container && attempts < 10) {
                const textContent = container.textContent || '';
                
                if (textContent.includes('Valor unitario') || textContent.includes('valor unitario')) {
                    if (!textContent.includes('despacho') && !textContent.includes('Despacho')) {
                        return true;
                    }
                }
                
                const label = container.querySelector('label');
                if (label && label.textContent.includes('Valor unitario')) {
                    return true;
                }
                
                container = container.parentElement;
                attempts++;
            }
            
            return false;
        } catch (error) {
            console.warn('⚠️ Error verificando input de valor unitario:', error);
            return false;
        }
    }
    
    async fillValorDespacho() {
        console.log('🚚 Buscando campo de valor de despacho...');
        
        const allInputs = document.querySelectorAll('input.MuiInputBase-input[type="text"]');
        let despachoInput = null;
        
        for (const input of allInputs) {
            if (this.isDespachoInput(input)) {
                despachoInput = input;
                break;
            }
        }
        
        if (despachoInput) {
            const valorDespacho = this.automationData.valor_despacho || 0;
            await this.fillInputWithValue(despachoInput, valorDespacho, 'Despacho');
            console.log(`✅ Valor de despacho establecido: ${valorDespacho}`);
        } else {
            console.warn('⚠️ No se encontró input de despacho');
        }
    }
    
    isDespachoInput(input) {
        try {
            let container = input.closest('div');
            let attempts = 0;
            
            while (container && attempts < 15) {
                const text = container.textContent.toLowerCase();
                
                if (text.includes('despacho') && !text.includes('valor unitario')) {
                    return true;
                }
                
                container = container.parentElement;
                attempts++;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
async detectExistingDocuments() {
    console.log('🔍 Detectando documentos existentes...');
    
    const documents = [];
    
    try {
        await this.delay(1000);
        
        // ✅ MÉTODO CORRECTO: Filtrar con JavaScript
        const allElements = Array.from(document.querySelectorAll('a, button'));
        const eliminarButtons = allElements.filter(el => {
            const text = el.textContent?.toLowerCase().trim();
            return text === 'eliminar' && el.offsetParent !== null;
        });
        
        console.log(`🔍 Botones "Eliminar" encontrados: ${eliminarButtons.length}`);
        
        // Para cada botón eliminar, crear registro del documento
        eliminarButtons.forEach((deleteButton, index) => {
            let fileName = `documento_${index + 1}`;
            
            // Intentar extraer nombre real del archivo
            try {
                const container = deleteButton.closest('div, tr, li');
                if (container) {
                    const textContent = container.textContent || '';
                    
                    // Buscar extensiones de archivo comunes
                    const fileMatch = textContent.match(/([^\s]+\.(pdf|doc|docx|txt|jpg|png|zip|rar|xls|xlsx))/i);
                    if (fileMatch) {
                        fileName = fileMatch[1];
                    }
                }
            } catch (nameError) {
                // Usar nombre por defecto
            }
            
            documents.push({
                name: fileName,
                deleteButton: deleteButton,
                container: deleteButton.closest('div, tr, li'),
                index: index
            });
            
            console.log(`📄 Documento encontrado: "${fileName}"`);
        });
        
        return documents;
        
    } catch (error) {
        console.error('❌ Error en detección:', error);
        return [];
    }
}
/**
 * ✅ FUNCIÓN MEJORADA: Contar ocurrencias de un archivo específico
 */
countFileOccurrences(existingDocuments, fileName) {
    const normalizedFileName = fileName.toLowerCase().trim();
    
    const occurrences = existingDocuments.filter(doc => 
        doc.name.toLowerCase().trim() === normalizedFileName
    );
    
    console.log(`🔢 Archivo "${fileName}": ${occurrences.length} ocurrencias encontradas`);
    
    if (occurrences.length > 0) {
        console.log('📋 Ocurrencias encontradas:');
        occurrences.forEach((occ, index) => {
            console.log(`   ${index + 1}. "${occ.name}" (container ${occ.index})`);
        });
    }
    
    return occurrences;
}

async waitForElementToDisappear(element) {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        if (!element.parentElement || !document.contains(element)) {
            console.log('✅ Elemento desapareció del DOM');
            return true;
        }
        
        // También verificar si se volvió invisible
        if (element.offsetParent === null) {
            console.log('✅ Elemento se volvió invisible');
            return true;
        }
        
        await this.delay(300);
        attempts++;
    }
    
    console.warn('⚠️ Timeout: elemento no desapareció');
    return false;
}
async handleAnyConfirmationModal() {
    console.log('🔍 Buscando modal de confirmación...');
    
    // Esperar por si aparece modal
    await this.delay(300);
    
    // Buscar botones de confirmación más amplio
    const allButtons = document.querySelectorAll('button, a, [role="button"]');
    
    for (const button of allButtons) {
        // Solo botones visibles
        if (!button.offsetParent) continue;
        
        const buttonText = button.textContent?.toLowerCase().trim();
        
        // Palabras clave de confirmación
        const confirmWords = ['aceptar', 'confirmar', 'eliminar', 'sí', 'si', 'ok', 'delete', 'yes'];
        
        if (confirmWords.some(word => buttonText === word || buttonText.includes(word))) {
            console.log(`✅ Botón de confirmación encontrado: "${button.textContent.trim()}"`);
            button.click();
            await this.delay(500);
            return true;
        }
    }
    
    console.log('ℹ️ No se encontró modal de confirmación');
    return false;
}



    async fillDescripcion() {
        console.log('📝 Buscando campo de descripción...');
        
        const textareas = document.querySelectorAll('textarea');
        let descripcionTextarea = null;
        
        for (const textarea of textareas) {
            if (textarea.offsetParent !== null) {
                descripcionTextarea = textarea;
                break;
            }
        }
        
        if (descripcionTextarea) {
            const descripcion = this.automationData.descripcion || '';
            await this.fillTextareaWithValue(descripcionTextarea, descripcion);
            console.log('✅ Descripción establecida');
        } else {
            console.warn('⚠️ No se encontró textarea de descripción');
        }
    }
    


   async downloadAndUploadDocument(documento) {
    try {
        console.log(`🔄 Iniciando descarga de: ${documento.nombre}`);
        
        // 1. Construir URL con debugging
        let downloadUrl;
        try {
            downloadUrl = this.buildDocumentDownloadUrl(documento.nombre);
            console.log(`📍 URL construida: ${downloadUrl}`);
        } catch (urlError) {
            console.error(`❌ Error construyendo URL para ${documento.nombre}:`, urlError);
            throw new Error(`Error construyendo URL: ${urlError.message}`);
        }
        
        // 2. Validar URL antes de enviar
        try {
            new URL(downloadUrl); // Validar que es una URL válida
            console.log(`✅ URL válida: ${downloadUrl}`);
        } catch (urlValidationError) {
            console.error(`❌ URL inválida: ${downloadUrl}`, urlValidationError);
            throw new Error(`URL malformada: ${downloadUrl}`);
        }
        
        // 3. Descargar usando background script con mejor error handling
        console.log(`📡 Enviando solicitud a background script...`);
        let result;
        
        try {
            result = await this.sendMessageToBackground('downloadDocument', { url: downloadUrl });
            console.log(`📨 Respuesta del background script:`, result);
        } catch (backgroundError) {
            console.error(`❌ Error comunicándose con background script:`, backgroundError);
            throw new Error(`Error en background script: ${backgroundError.message}`);
        }
        
        // 4. Validar respuesta del background script
        if (!result) {
            throw new Error('Background script no devolvió respuesta');
        }
        
        if (!result.success) {
            const errorMsg = result.error || 'Error desconocido en background script';
            console.error(`❌ Background script reportó error:`, errorMsg);
            throw new Error(`Error en background script: ${errorMsg}`);
        }
        
        if (!result.data) {
            throw new Error('Background script no devolvió datos');
        }
        
        // 5. Validar estructura de datos
        const data = result.data;
        
        if (!data.success) {
            const errorMsg = data.message || 'Error en respuesta del servidor';
            console.error(`❌ Servidor reportó error:`, errorMsg);
            throw new Error(`Error del servidor: ${errorMsg}`);
        }
        
        if (!data.archivo) {
            throw new Error('Respuesta del servidor no contiene archivo');
        }
        
        if (!data.archivo.contenido_base64) {
            throw new Error('Archivo no contiene contenido base64');
        }
        
        // 6. Convertir Base64 a Blob
        console.log(`🔄 Convirtiendo archivo de base64 a blob...`);
        
        let blob, file;
        try {
            const base64Data = data.archivo.contenido_base64;
            const mimeType = data.archivo.mime_type || 'application/octet-stream';
            
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: mimeType });
            
            // 7. Crear File object
            file = new File([blob], documento.nombre, { type: mimeType });
            
            console.log(`📤 Archivo preparado: ${file.name} (${this.formatFileSize(file.size)}, ${mimeType})`);
            
        } catch (conversionError) {
            console.error(`❌ Error convirtiendo base64:`, conversionError);
            throw new Error(`Error convirtiendo archivo: ${conversionError.message}`);
        }
        
        // 8. Subir a Compra Ágil
        console.log(`📤 Subiendo archivo a Compra Ágil...`);
        try {
            await this.uploadToCompraAgil(file);
            console.log(`✅ ${documento.nombre} subido exitosamente`);
        } catch (uploadError) {
            console.error(`❌ Error subiendo a Compra Ágil:`, uploadError);
            throw new Error(`Error subiendo archivo: ${uploadError.message}`);
        }
        
    } catch (error) {
        console.error(`❌ Error completo con documento ${documento.nombre}:`, error);
        throw error; // Re-lanzar para que uploadDocuments lo maneje
    }
}
async sendMessageToBackgroundCorregido(action, data) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout en comunicación con background script (40s)'));
        }, 40000); // ✅ AUMENTADO: 40 segundos para Laravel
        
        chrome.runtime.sendMessage(
            { action: action, ...data },
            (response) => {
                clearTimeout(timeout);
                
                if (chrome.runtime.lastError) {
                    console.error('❌ Error de runtime:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log('📨 Response del background recibida:', response);
                    resolve(response);
                }
            }
        );
    });
}

/**
 * ✅ FUNCIÓN CORREGIDA: Obtener RUTs de la sesión Laravel
 */
async obtenerDatosDeUsuarioLogueado() {
    try {
        console.log('👤 Obteniendo datos del usuario logueado...');
        
        // ✅ MÉTODO 1: Usar endpoint check-auth que ya funciona
        const apiUrl = this.buildApiUrl('check-auth');
        
        const response = await this.sendMessageToBackgroundCorregido('API_REQUEST', {
            url: apiUrl,
            method: 'GET'
        });
        
        if (response.success && response.data?.authenticated) {
            const userData = response.data;
            
            console.log('✅ Datos de usuario obtenidos:', userData);
            
            return {
                rut_usuario: userData.user?.rut || 'sin-rut-usuario',
                rut_cliente: userData.company?.rut || 'sin-rut-empresa',
                user_id: userData.user?.id,
                company_id: userData.company?.id,
                user_name: userData.user?.name,
                company_name: userData.company?.name
            };
        } else {
            console.warn('⚠️ Usuario no autenticado o respuesta inválida');
            return this.obtenerDatosFallback();
        }
        
    } catch (error) {
        console.error('❌ Error obteniendo datos de usuario:', error);
        return this.obtenerDatosFallback();
    }
}
/**
 * ✅ FUNCIÓN FALLBACK: Usar datos de automationData si están disponibles
 */
obtenerDatosFallback() {
    console.log('🔄 Usando datos fallback de automationData...');
    
    let rutUsuario = 'fallback-usuario';
    let rutCliente = 'fallback-cliente';
    
    if (this.automationData?.usuario?.rut) {
        rutUsuario = this.automationData.usuario.rut;
        console.log('✅ RUT usuario desde automationData:', rutUsuario);
    }
    
    if (this.automationData?.cliente?.rut) {
        rutCliente = this.automationData.cliente.rut;
        console.log('✅ RUT cliente desde automationData:', rutCliente);
    }
    
    return {
        rut_usuario: rutUsuario,
        rut_cliente: rutCliente,
        user_id: this.automationData?.usuario?.id,
        company_id: this.automationData?.cliente?.id || 1,
        user_name: this.automationData?.usuario?.nombre,
        company_name: this.automationData?.cliente?.nombre
    };
}
/**
 * ✅ FUNCIÓN MEJORADA: Actualizar estado con datos de sesión
 */
async actualizarEstadoPostulacionConDatosSesion() {
    try {
        console.log('🔄 === ACTUALIZACIÓN CON DATOS DE SESIÓN ===');

        if (!this.cotizacion) {
            console.warn('⚠️ No hay cotización disponible');
            return { success: true, message: 'Sin cotización, omitiendo actualización' };
        }

        // ✅ OBTENER DATOS REALES DEL USUARIO LOGUEADO
        const datosUsuario = await this.obtenerDatosDeUsuarioLogueado();
        
        console.log('👤 Datos de usuario obtenidos:', datosUsuario);

        const requestData = {
            cotizacion: this.cotizacion,
            company_id: datosUsuario.company_id || 1,
            rut_usuario: datosUsuario.rut_usuario,
            rut_cliente: datosUsuario.rut_cliente
        };

        console.log('📦 Datos CORREGIDOS para actualización:', requestData);

        const apiUrl = this.buildApiUrl('update-estado-postulacion');
        
        const response = await this.sendMessageToBackgroundCorregido('API_REQUEST', {
            url: apiUrl,
            method: 'POST',
            data: requestData
        });

        if (response.success && response.data?.success) {
            console.log('✅ Estado actualizado exitosamente:', response.data);
            return response.data;
        } else {
            console.warn('⚠️ Error en actualización:', response);
            return { 
                success: false, 
                message: 'Error al actualizar estado', 
                error: response.error 
            };
        }

    } catch (error) {
        console.error('❌ Error en actualización con datos de sesión:', error);
        return { 
            success: false, 
            message: 'Error en actualización', 
            error: error.message 
        };
    }
}
// *** NUEVO MÉTODO: Enviar mensaje al background script ***
// *** MÉTODO MEJORADO: Enviar mensaje al background script ***
// ✅ En content-compraagil.js - Extender timeout
async sendMessageToBackground(action, data) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout en comunicación con background script'));
        }, 30000); // ✅ CAMBIAR: de 10000 a 30000 (30 segundos)
        
        chrome.runtime.sendMessage(
            { action: action, ...data },
            (response) => {
                clearTimeout(timeout);
                
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            }
        );
    });
}
// ✅ CORREGIR: buildDocumentDownloadUrl usando config centralizado
buildDocumentDownloadUrl(nombreDocumento) {
    console.log('🔗 Construyendo URL de descarga usando config centralizado...');
    
    if (!this.cotizacion || !nombreDocumento) {
        throw new Error('cotizacion y nombreDocumento son requeridos');
    }
    
    try {
        // ✅ PRIORIDAD 1: Usar config centralizado
        if (typeof window !== 'undefined' && window.ExtensionUtils) {
            const url = window.ExtensionUtils.getDocumentDownloadUrl(this.cotizacion, nombreDocumento);
            console.log(`✅ URL desde config: ${url}`);
            return url;
        }
    } catch (error) {
        console.warn('⚠️ Error usando config para URL:', error);
    }
    
    try {
        // ✅ PRIORIDAD 2: Usar EXTENSION_CONFIG directamente
        if (typeof window !== 'undefined' && window.EXTENSION_CONFIG) {
            const baseUrl = window.EXTENSION_CONFIG.URLS.PHARMATENDER.API_BASE;
            const endpoint = window.EXTENSION_CONFIG.API.ENDPOINTS.GET_DOCUMENT_FILE;
            const url = `${baseUrl}/${endpoint}?cotizacion=${this.cotizacion}&nombre=${encodeURIComponent(nombreDocumento)}`;
            console.log(`✅ URL desde EXTENSION_CONFIG: ${url}`);
            return url;
        }
    } catch (error) {
        console.warn('⚠️ Error usando EXTENSION_CONFIG:', error);
    }
    
    // ✅ FALLBACK MEJORADO: Detectar entorno automáticamente
    let baseUrl;
    
    // Detectar si estamos en desarrollo o producción
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
    const isPharmatenderDomain = hostname.includes('pharmatender.cl');
    
    if (isPharmatenderDomain) {
        baseUrl = 'https://prime.pharmatender.cl';
        console.log(`✅ Detectado dominio PharmaTender: ${baseUrl}`);
    } else if (isLocalhost) {
        baseUrl = 'http://localhost/prime_2020_02_clean/public';
        console.log(`✅ Detectado localhost: ${baseUrl}`);
    } else {
        // Default a producción para seguridad
        baseUrl = 'https://prime.pharmatender.cl';
        console.log(`⚠️ Entorno desconocido, usando producción: ${baseUrl}`);
    }
    
    const url = `${baseUrl}/api/extension/get-document-file?cotizacion=${this.cotizacion}&nombre=${encodeURIComponent(nombreDocumento)}`;
    
    console.log(`📍 URL fallback construida: ${url}`);
    return url;
}
async uploadDocuments() {
    console.log('📎 Iniciando gestión PROTEGIDA de documentos...');
    
    // ✅ USAR SOLO PROTECCIÓN EXISTENTE (que ya funciona)
    fileSecurityManager.preventFileInputAutoClick();
    fileSecurityManager.disableFileInputs();
    
    try {
        if (!this.automationData.documentos || this.automationData.documentos.length === 0) {
            console.log('ℹ️ No hay documentos para subir');
            this.updateIndicator('ℹ️ Sin documentos que subir', 'processing');
            return;
        }

        const documentosValidos = this.automationData.documentos.filter(doc => doc.existe);
        
        // ✅ PASO 1: Subir archivo activador
        console.log('📤 Subiendo archivo activador...');
        this.updateIndicator('📤 Preparando área de documentos...', 'processing');
        await this.subirArchivoActivador();
        
        // ✅ PASO 2: Esperar que aparezcan botones "Eliminar"
        console.log('⏳ Esperando que aparezcan documentos existentes...');
        this.updateIndicator('⏳ Detectando documentos existentes...', 'processing');
        await this.esperarDocumentosExistentes();
        
        // ✅ PASO 3: ELIMINAR TODO (como el Python)
        console.log('🗑️ Eliminando TODOS los documentos existentes...');
        this.updateIndicator('🗑️ Eliminando documentos existentes...', 'processing');
        await this.eliminarTodosLosDocumentos();
        
        // ✅ PASO 4: Subir documentos nuevos
        console.log('📤 Subiendo documentos nuevos...');
        for (let i = 0; i < documentosValidos.length; i++) {
            const documento = documentosValidos[i];
            console.log(`📄 Subiendo: ${documento.nombre}`);
            
            this.updateIndicator(`📄 Subiendo ${documento.nombre} (${i + 1}/${documentosValidos.length})`, 'processing');
            
            await this.downloadAndUploadDocument(documento);
            await this.delay(2000);
        }
        
        console.log('✅ Gestión completada');
        this.updateIndicator('✅ Documentos subidos correctamente', 'success');

    } catch (error) {
        console.error('❌ Error en uploadDocuments:', error);
        this.updateIndicator('❌ Error en documentos', 'error');
        throw error;
    } finally {
        // ✅ SIEMPRE REHABILITAR AL FINAL
        setTimeout(() => {
            fileSecurityManager.enableFileInputs();
        }, 3000);
    }
}
// Esperar que aparezcan botones eliminar (como el WebDriverWait del Python)
async esperarDocumentosExistentes() {
    console.log('⏳ Esperando que aparezcan botones eliminar...');
    
    let attempts = 0;
    const maxAttempts = 20; // 10 segundos
    
    while (attempts < maxAttempts) {
        // ✅ MÉTODO CORRECTO: Buscar todos los elementos y filtrar por texto
        const allElements = Array.from(document.querySelectorAll('a, button'));
        const eliminarElements = allElements.filter(el => {
            const text = el.textContent?.toLowerCase().trim();
            return text === 'eliminar' && el.offsetParent !== null; // Visible
        });
        
        if (eliminarElements.length > 0) {
            console.log(`✅ Encontrados ${eliminarElements.length} botones eliminar`);
            return true;
        }
        
        console.log(`🔍 Intento ${attempts + 1}/${maxAttempts}: No se encontraron botones eliminar`);
        await this.delay(500);
        attempts++;
    }
    
    console.log('⚠️ No aparecieron botones eliminar después del activador');
    return false;
}

// ELIMINAR TODO (como el loop del Python)
async eliminarTodosLosDocumentos() {
    console.log('🗑️ Eliminando TODOS los documentos (método Python)...');
    
    const maxAttempts = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // ✅ MÉTODO CORRECTO: Filtrar con JavaScript
        const allElements = Array.from(document.querySelectorAll('a, button'));
        const eliminarButtons = allElements.filter(el => {
            const text = el.textContent?.toLowerCase().trim();
            return text === 'eliminar' && el.offsetParent !== null; // Solo visibles
        });
        
        if (eliminarButtons.length === 0) {
            console.log('✅ No hay más documentos para eliminar');
            break;
        }
        
        console.log(`🗑️ Intento ${attempt + 1}: Eliminando 1 de ${eliminarButtons.length} documentos...`);
        
        // Tomar el primero (como Python)
        const deleteButton = eliminarButtons[0];
        
        try {
            // Scroll y click
            deleteButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            deleteButton.click();
            await this.delay(1000);
            
            // Manejar confirmación
            await this.handleAnyConfirmationModal();
            
            // Esperar que desaparezca
            await this.delay(2000);
            
        } catch (error) {
            console.error(`❌ Error eliminando documento:`, error);
            break;
        }
    }
    
    console.log('✅ Proceso de eliminación completado');
}
// Función auxiliar para subir archivo activador
async subirArchivoActivador() {
    // Crear archivo dummy pequeño
    const dummyContent = "Archivo temporal para activar vista";
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const dummyFile = new File([blob], 'temp_activador.txt', { type: 'text/plain' });
    
    await this.uploadToCompraAgil(dummyFile);
}

// Función auxiliar para limpiar TODOS los documentos
async limpiarTodosLosDocumentos(existingDocuments) {
    for (const doc of existingDocuments) {
        try {
            doc.deleteButton.click();
            await this.delay(800);
            await this.handleAnyConfirmationModal();
        } catch (error) {
            console.error(`Error eliminando ${doc.name}:`, error);
        }
    }
}
async eliminateSpecificDuplicates(existingDocuments, fileName) {
    console.log(`🔍 Verificando duplicados para: ${fileName}`);
    
    // Buscar duplicados exactos
    const duplicates = existingDocuments.filter(doc => 
        doc.name.toLowerCase().trim() === fileName.toLowerCase().trim()
    );
    
    if (duplicates.length === 0) {
        console.log(`✅ No hay duplicados de "${fileName}"`);
        return;
    }
    
    console.log(`🗑️ Eliminando ${duplicates.length} duplicados de "${fileName}"`);
    
    // Eliminar todos los duplicados
    for (const duplicate of duplicates) {
        try {
            // Scroll al elemento
            duplicate.container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // Click eliminar
            duplicate.deleteButton.click();
            await this.delay(1000);
            
            // Manejar confirmación
            await this.handleAnyConfirmationModal();
            
            // Esperar que desaparezca
            await this.waitForElementToDisappear(duplicate.nameElement);
            
            console.log(`✅ Duplicado eliminado: "${duplicate.name}"`);
            
        } catch (error) {
            console.error(`❌ Error eliminando "${duplicate.name}":`, error);
        }
    }
}


// *** MEJORAR uploadToCompraAgil para usar el botón "Examinar" ***
async uploadToCompraAgil(file) {
    try {
        console.log(`📁 Iniciando carga PROTEGIDA: ${file.name}`);
        
        // 🔐 ACTIVAR PROTECCIÓN AL INICIO
        fileSecurityManager.preventFileInputAutoClick();
        fileSecurityManager.disableFileInputs();
        
        // PASO 1: Activar el área de carga de archivos
        const examinarButton = document.querySelector('button.sc-bdzqNv.gowuLk');
        
        if (!examinarButton) {
            // Fallback: buscar input de archivos tradicional
            const fileInput = document.querySelector('input[type="file"]');
            if (!fileInput) {
                throw new Error('No se encontró botón "Examinar" ni input de archivos');
            }
            
            // 🔐 PROTEGER INPUT ANTES DE USAR
            fileSecurityManager.protectAndPrepareInput(fileInput);
            return await this.uploadToTraditionalInputWithDuplicateCheck(file, fileInput);
        }
        
        console.log('🔘 Botón "Examinar" encontrado, activando área de carga...');
        
        // PASO 2: Click en el botón examinar para activar el área
        examinarButton.click();
        
        // PASO 3: Esperar a que aparezca el input Y los documentos existentes
        await this.delay(800);
        
        // PASO 4: Buscar el input de archivos con protección
        const fileInput = document.querySelector('input[type="file"]');
        
        if (!fileInput) {
            throw new Error('No apareció input de archivos después de click en Examinar');
        }
        
        // 🔐 PROTEGER INPUT ENCONTRADO
        fileSecurityManager.protectAndPrepareInput(fileInput);
        
        // PASO 5: Esperar más tiempo para que aparezcan documentos existentes
        console.log('⏳ Esperando a que aparezcan documentos existentes...');
        await this.delay(1000);
        
        // PASO 6: Detectar y manejar duplicados
        await this.handleDuplicatesAfterActivation(file.name);
        
        // PASO 7: Continuar con carga normal
        return await this.uploadToTraditionalInput(file, fileInput);
        
    } catch (error) {
        console.error('❌ Error en uploadToCompraAgil:', error);
        throw error;
    } finally {
        // 🔐 SIEMPRE REHABILITAR AL FINAL
        setTimeout(() => {
            fileSecurityManager.enableFileInputs();
        }, 2000);
    }
}s
async handleDuplicatesAfterActivation(newFileName) {
    console.log(`🔍 Verificando duplicados para: ${newFileName}`);
    
    await this.delay(500);
    
    // Usar la función principal de detección
    const existingDocs = await this.detectExistingDocuments();
    
    if (existingDocs.length > 0) {
        await this.eliminateSpecificDuplicates(existingDocs, newFileName);
        await this.delay(1000);
    }
}
async uploadToTraditionalInputWithDuplicateCheck(file, fileInput) {
    console.log(`📁 Carga con verificación de duplicados: ${file.name}`);
    
    // Activar el input 
    fileInput.click();
    await this.delay(800);
    
    // Verificar duplicados usando la función principal
    const existingDocs = await this.detectExistingDocuments();
    await this.eliminateSpecificDuplicates(existingDocs, file.name);
    
    // Continuar con carga normal
    return await this.uploadToTraditionalInput(file, fileInput);
}




/**
 * ✅ NUEVA FUNCIÓN: Buscar botón con texto específico
 */
findButtonWithText(container, textOptions) {
    try {
        // Buscar todos los botones y enlaces en el contenedor
        const clickableElements = container.querySelectorAll('button, a, [role="button"]');
        
        for (const element of clickableElements) {
            const text = element.textContent?.toLowerCase().trim();
            
            if (text && textOptions.some(option => text.includes(option.toLowerCase()))) {
                return element;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Extraer nombre de archivo de una fila
 */
extractFileNameFromRow(row) {
    try {
        const text = row.textContent || '';
        
        // ✅ MÉTODO 1: Buscar texto que contenga extensión de archivo
        const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.zip', '.rar'];
        
        for (const ext of fileExtensions) {
            const regex = new RegExp(`([^\\s]+\\${ext})`, 'gi');
            const matches = text.match(regex);
            
            if (matches && matches.length > 0) {
                // Tomar el primer match y limpiarlo
                let fileName = matches[0].trim();
                
                // Limpiar caracteres extraños al inicio/final
                fileName = fileName.replace(/^[^\w]+|[^\w\.]+$/g, '');
                
                if (fileName.length > 0) {
                    console.log(`📄 Archivo extraído (método 1): "${fileName}"`);
                    return fileName;
                }
            }
        }
        
        // ✅ MÉTODO 2: Buscar por selectores específicos dentro de la fila
        const fileNameSelectors = [
            '.filename',
            '.file-name', 
            '.document-name',
            '[class*="name"]',
            'span:first-child',
            'td:first-child'
        ];
        
        for (const selector of fileNameSelectors) {
            const element = row.querySelector(selector);
            if (element) {
                const fileName = element.textContent?.trim();
                if (fileName && this.looksLikeFileName(fileName)) {
                    console.log(`📄 Archivo extraído (método 2): "${fileName}"`);
                    return fileName;
                }
            }
        }
        
        // ✅ MÉTODO 3: Buscar el primer texto que parece nombre de archivo
        const textParts = text.split(/\s+/);
        for (const part of textParts) {
            if (this.looksLikeFileName(part)) {
                console.log(`📄 Archivo extraído (método 3): "${part}"`);
                return part.trim();
            }
        }
        
        return null;
        
    } catch (error) {
        console.warn('⚠️ Error extrayendo nombre de archivo:', error);
        return null;
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Verificar si un texto parece nombre de archivo
 */
looksLikeFileName(text) {
    if (!text || text.length < 4) return false;
    
    const cleanText = text.trim();
    
    // Debe contener un punto para la extensión
    if (!cleanText.includes('.')) return false;
    
    // Extensiones comunes
    const commonExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.zip', '.rar', '.txt'];
    
    const hasCommonExtension = commonExtensions.some(ext => 
        cleanText.toLowerCase().endsWith(ext)
    );
    
    return hasCommonExtension;
}

/**
 * ✅ NUEVA FUNCIÓN: Buscar botón eliminar cerca de un elemento
 */
findDeleteButtonNearElement(element) {
    try {
        let container = element;
        let attempts = 0;
        
        // Buscar en contenedores padre hasta encontrar botón eliminar
        while (container && attempts < 5) {
            const deleteButton = this.findButtonWithText(container, ['eliminar', 'delete', 'remove']);
            
            if (deleteButton) {
                return deleteButton;
            }
            
            container = container.parentElement;
            attempts++;
        }
        
        return null;
        
    } catch (error) {
        return null;
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Extraer nombre de archivo del contenedor
 */
extractFileNameFromContainer(container) {
    try {
        // Métodos ordenados por prioridad
        const extractors = [
            // Selector específico mencionado
            () => container.querySelector('.sc-dCVDEO.kZrFwL')?.textContent?.trim(),
            
            // Selectores comunes de nombres de archivo
            () => container.querySelector('.filename')?.textContent?.trim(),
            () => container.querySelector('.file-name')?.textContent?.trim(),
            () => container.querySelector('.document-name')?.textContent?.trim(),
            
            // Buscar en spans y divs
            () => {
                const spans = container.querySelectorAll('span');
                for (const span of spans) {
                    const text = span.textContent?.trim();
                    if (text && text.includes('.') && text.length > 3) {
                        return text;
                    }
                }
                return null;
            },
            
            // Buscar por atributos
            () => container.getAttribute('data-filename'),
            () => container.getAttribute('title'),
            
            // Buscar en el texto completo
            () => {
                const text = container.textContent?.trim();
                // Buscar algo que parezca nombre de archivo (contiene punto y extensión)
                const fileNameMatch = text?.match(/([^\s]+\.\w{2,4})/);
                return fileNameMatch ? fileNameMatch[1] : null;
            }
        ];
        
        for (const extractor of extractors) {
            try {
                const result = extractor();
                if (result && result.length > 0) {
                    // Limpiar el nombre (remover espacios extra, etc.)
                    const cleanName = result.replace(/\s+/g, ' ').trim();
                    
                    // Verificar que parezca un nombre de archivo válido
                    if (cleanName.includes('.') && cleanName.length > 3) {
                        return cleanName;
                    }
                }
            } catch (extractorError) {
                continue;
            }
        }
        
        return null;
        
    } catch (error) {
        console.warn('⚠️ Error extrayendo nombre de archivo:', error);
        return null;
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Encontrar botón eliminar en contenedor
 */
findDeleteButtonInContainer(container) {
    try {
        // Selectores para botón eliminar
        const deleteSelectors = [
            'a.sc-cInsRk.kLUBqi', // Selector específico mencionado
            'a[class*="eliminar"]',
            'button[class*="eliminar"]',
            'button[class*="delete"]',
            'a[class*="delete"]',
            '.delete-btn',
            '.remove-btn',
            '[data-testid*="delete"]',
            '[data-testid*="remove"]'
        ];
        
        for (const selector of deleteSelectors) {
            const button = container.querySelector(selector);
            if (button && button.offsetParent) { // Verificar que sea visible
                const buttonText = button.textContent?.toLowerCase().trim();
                
                // Verificar que el texto del botón confirme que es para eliminar
                if (buttonText.includes('eliminar') || 
                    buttonText.includes('delete') || 
                    buttonText.includes('remover') ||
                    buttonText.includes('quitar') ||
                    buttonText === '×' ||
                    buttonText === '✕') {
                    
                    return button;
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.warn('⚠️ Error buscando botón eliminar:', error);
        return null;
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Encontrar duplicados específicos de un archivo
 */
findSpecificDuplicates(existingDocuments, newFileName) {
    console.log(`🔍 Buscando duplicados específicos de: "${newFileName}"`);
    
    const normalizedNewName = newFileName.toLowerCase().trim();
    const duplicates = [];
    
    existingDocuments.forEach(existingDoc => {
        const normalizedExistingName = existingDoc.name.toLowerCase().trim();
        
        if (normalizedExistingName === normalizedNewName) {
            duplicates.push(existingDoc);
            console.log(`🔄 Duplicado exacto encontrado: "${existingDoc.name}"`);
        }
    });
    
    return duplicates;
}

/**
 * ✅ NUEVA FUNCIÓN: Eliminar duplicados específicos
 */
async removeSpecificDuplicates(duplicates) {
    if (duplicates.length === 0) {
        return true;
    }
    
    console.log(`🗑️ Eliminando ${duplicates.length} duplicados específicos...`);
    
    for (let i = 0; i < duplicates.length; i++) {
        const duplicate = duplicates[i];
        
        try {
            console.log(`🗑️ Eliminando: "${duplicate.name}"`);
            
            // Asegurar visibilidad
            duplicate.container.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(300);
            
            // Click en eliminar
            duplicate.deleteButton.click();
            await this.delay(500);
            
            // Manejar confirmación si aparece
            await this.handleDeleteConfirmationModal();
            
            // Esperar a que desaparezca
            await this.waitForElementRemoval(duplicate.container);
            
            console.log(`✅ Duplicado eliminado: "${duplicate.name}"`);
            
            // Pausa entre eliminaciones
            if (i < duplicates.length - 1) {
                await this.delay(500);
            }
            
        } catch (error) {
            console.error(`❌ Error eliminando "${duplicate.name}":`, error);
        }
    }
    
    return true;
}

/**
 * ✅ NUEVA FUNCIÓN: Manejar modal de confirmación de eliminación
 */
async handleDeleteConfirmationModal() {
    console.log('🔍 Verificando modal de confirmación...');
    
    // Esperar por si aparece modal
    await this.delay(200);
    
    // Buscar botones de confirmación
    const confirmSelectors = [
        'button:contains("Aceptar")',
        'button:contains("Confirmar")',
        'button:contains("Eliminar")',
        'button:contains("Sí")',
        'button:contains("OK")',
        '.MuiButton-root[color="primary"]',
        '.btn-primary',
        '.confirm-btn'
    ];
    
    // Como :contains no está disponible, usar función personalizada
    const buttons = document.querySelectorAll('button');
    
    for (const button of buttons) {
        if (!button.offsetParent) continue; // Skip invisible buttons
        
        const buttonText = button.textContent?.toLowerCase().trim();
        
        if (buttonText === 'aceptar' || 
            buttonText === 'confirmar' || 
            buttonText === 'eliminar' ||
            buttonText === 'sí' ||
            buttonText === 'ok') {
            
            console.log(`✅ Confirmando eliminación: "${button.textContent}"`);
            button.click();
            await this.delay(300);
            return true;
        }
    }
    
    console.log('ℹ️ No se encontró modal de confirmación');
    return false;
}

/**
 * ✅ NUEVA FUNCIÓN: Esperar a que un elemento desaparezca
 */
async waitForElementRemoval(element) {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        if (!element.parentElement || !element.offsetParent) {
            console.log('✅ Elemento eliminado confirmado');
            return true;
        }
        
        await this.delay(300);
        attempts++;
    }
    
    console.warn('⚠️ Timeout esperando eliminación de elemento');
    return false;
}

    // *** MÉTODO AUXILIAR: Cargar archivo al input tradicional ***
    async uploadToTraditionalInput(file, fileInput) {
    try {
        console.log(`📁 Input tradicional PROTEGIDO - archivo: ${file.name}`);
        
        // 🔐 VERIFICAR QUE EL INPUT ESTÉ PROTEGIDO
        fileSecurityManager.protectAndPrepareInput(fileInput);
        
        // 🔐 DESHABILITAR TEMPORALMENTE OTROS INPUTS
        fileSecurityManager.disableFileInputs();
        
        // Crear DataTransfer para simular selección de archivo
        const dataTransfer = new DataTransfer();
        
        // Si ya hay archivos, mantenerlos (solo si acepta múltiples)
        if (fileInput.multiple) {
            for (let i = 0; i < fileInput.files.length; i++) {
                dataTransfer.items.add(fileInput.files[i]);
            }
        }
        
        // Agregar el nuevo archivo
        dataTransfer.items.add(file);
        
        // 🔐 REHABILITAR SOLO EL INPUT ESPECÍFICO TEMPORALMENTE
        fileInput.disabled = false;
        fileInput.style.pointerEvents = 'auto';
        
        // Asignar archivos al input
        fileInput.files = dataTransfer.files;
        
        // Disparar eventos para que React/Vue detecte el cambio
        const events = ['change', 'input'];
        events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            fileInput.dispatchEvent(event);
        });
        
        // Verificar que se cargó
        await this.delay(500);
        
        if (fileInput.files.length === 0) {
            throw new Error('El archivo no se asignó correctamente al input');
        }
        
        console.log(`📁 Total archivos en input: ${fileInput.files.length}`);
        console.log(`📄 Último archivo: ${fileInput.files[fileInput.files.length - 1].name}`);
        
        // Buscar si aparece el nombre del archivo en la UI
        await this.delay(500);
        const fileNameElement = document.querySelector('.sc-dCVDEO.kZrFwL');
        if (fileNameElement && fileNameElement.textContent.includes(file.name)) {
            console.log(`✅ Archivo confirmado en UI: ${fileNameElement.textContent}`);
        }
        
    } finally {
        // 🔐 SIEMPRE REHABILITAR AL FINAL
        setTimeout(() => {
            fileSecurityManager.enableFileInputs();
        }, 1500);
    }
}
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
   
    
   
   async fillInputWithValue(input, value, description = '') {
    try {
        console.log(`📝 GENTLE INPUT: Llenando ${description}: ${value}`);
        
        // ✅ NUEVA VALIDACIÓN: Verificar que sea realmente un input
        if (!this.isRealInput(input)) {
            console.log(`🚫 ELEMENTO RECHAZADO: No es un input válido - ${description}`);
            return false;
        }
        
        // ✅ NUEVA VALIDACIÓN: No clickear si está cerca de enlaces de descarga
        if (this.isNearDownloadLink(input)) {
            console.log(`🚫 ELEMENTO RECHAZADO: Está cerca de enlace de descarga - ${description}`);
            return false;
        }
        
        // ✅ PASO 1: Preparación mínima
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(200);
        
        // ✅ PASO 2: Focus suave SIN CLICK
        input.focus();
        await this.delay(300);
        
        // ✅ PASO 3: Limpiar contenido existente
        input.select();
        await this.delay(100);
        
        // ✅ PASO 4: Establecer valor
        input.value = value.toString();
        
        // ✅ PASO 5: Eventos de cambio
        const events = ['input', 'change'];
        events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            input.dispatchEvent(event);
        });
        
        await this.delay(200);
        
        console.log(`✅ GENTLE INPUT: ${description} = ${value} (sin envío automático)`);
        return true;
        
    } catch (error) {
        console.error(`❌ GENTLE INPUT error:`, error);
        return false;
    }
}
// ✅ NUEVA FUNCIÓN: Verificar que sea realmente un input
isRealInput(element) {
    try {
        // Debe ser un input o textarea
        const tagName = element.tagName?.toLowerCase();
        if (tagName !== 'input' && tagName !== 'textarea') {
            console.log(`🚫 No es input/textarea: ${tagName}`);
            return false;
        }
        
        // Si es input, debe ser de tipo texto o número
        if (tagName === 'input') {
            const inputType = element.type?.toLowerCase();
            const validTypes = ['text', 'number', 'tel'];
            
            if (!validTypes.includes(inputType)) {
                console.log(`🚫 Tipo de input inválido: ${inputType}`);
                return false;
            }
        }
        
        // No debe ser readonly o disabled
        if (element.readOnly || element.disabled) {
            console.log(`🚫 Input readonly o disabled`);
            return false;
        }
        
        // No debe tener atributos que indiquen descarga
        const downloadAttrs = ['download', 'href'];
        for (const attr of downloadAttrs) {
            if (element.hasAttribute(attr)) {
                console.log(`🚫 Tiene atributo de descarga: ${attr}`);
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error verificando input real:', error);
        return false;
    }
}

// ✅ FUNCIÓN CORREGIDA: Verificar si está cerca de enlaces de descarga
// ✅ FUNCIÓN ROBUSTA: Verificar si está cerca de enlaces de descarga
isNearDownloadLink(element) {
    try {
        let container = element;
        let attempts = 0;
        
        // Verificar contenedores padre hasta 5 niveles
        while (container && attempts < 5) {
            // ✅ MÉTODO 1: Detectar sección "Adjuntos" por texto (más confiable)
            const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
            
            for (const textEl of textElements) {
                const text = textEl.textContent?.toLowerCase().trim() || '';
                
                if (text === 'adjuntos' || text === 'documentos' || text === 'archivos adjuntos') {
                    console.log(`🚫 Sección de adjuntos detectada: "${text}"`);
                    return true;
                }
            }
            
            // ✅ MÉTODO 2: Detectar archivos por extensiones (dinámico)
            const allElements = container.querySelectorAll('a, span, div, p');
            
            for (const elem of allElements) {
                const text = elem.textContent?.toLowerCase().trim() || '';
                
                // Extensiones de archivos comunes
                const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.txt', '.png', '.jpg', '.jpeg'];
                
                // Verificar si el texto termina con alguna extensión
                if (fileExtensions.some(ext => text.endsWith(ext))) {
                    console.log(`🚫 Archivo detectado: "${text}"`);
                    return true;
                }
                
                // Verificar patrones de nombres de archivos típicos
                const filePatterns = [
                    /\w+\s+\d+\.(pdf|doc|docx|xls|xlsx|zip|rar)/i,  // "PO 108.pdf", "MEMO 2613.pdf"
                    /[a-zA-Z]+\d*\.(pdf|doc|docx|xls|xlsx|zip|rar)/i, // "documento123.pdf"
                    /\w+_\w+\.(pdf|doc|docx|xls|xlsx|zip|rar)/i       // "archivo_test.pdf"
                ];
                
                if (filePatterns.some(pattern => pattern.test(text))) {
                    console.log(`🚫 Patrón de archivo detectado: "${text}"`);
                    return true;
                }
            }
            
            // ✅ MÉTODO 3: Detectar enlaces con href de descarga
            const links = container.querySelectorAll('a[href]');
            
            for (const link of links) {
                const href = link.href?.toLowerCase() || '';
                const downloadExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.txt'];
                
                if (downloadExtensions.some(ext => href.includes(ext)) || link.hasAttribute('download')) {
                    console.log(`🚫 Enlace de descarga detectado: ${href.substring(0, 50)}...`);
                    return true;
                }
            }
            
            // ✅ MÉTODO 4: Detectar palabras clave de descarga en el contexto
            const containerText = container.textContent?.toLowerCase() || '';
            const downloadKeywords = [
                'descargar', 'download', 'bajar archivo', 'obtener documento',
                'requisitos técnicos', 'bases técnicas', 'formularios',
                'documentación', 'anexos', 'especificaciones'
            ];
            
            // Solo marcar como descarga si hay múltiples indicadores
            let keywordCount = 0;
            for (const keyword of downloadKeywords) {
                if (containerText.includes(keyword)) {
                    keywordCount++;
                }
            }
            
            if (keywordCount >= 2) {
                console.log(`🚫 Múltiples indicadores de descarga detectados (${keywordCount})`);
                return true;
            }
            
            container = container.parentElement;
            attempts++;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Error verificando enlaces cercanos:', error);
        return false; // En caso de error, permitir continuar
    }
}
simulateKeyEvent(element, type, key) {
    try {
        const event = new KeyboardEvent(type, {
            key: key,
            code: key === 'Tab' ? 'Tab' : key === 'Delete' ? 'Delete' : `Key${key.toUpperCase()}`,
            keyCode: this.getKeyCode(key),
            which: this.getKeyCode(key),
            bubbles: true,
            cancelable: true,
            composed: true
        });
        
        element.dispatchEvent(event);
    } catch (error) {
        console.warn('⚠️ Error simulando evento de teclado:', error);
    }
}

/**
 * ✅ NUEVO: Simular evento input real
 */
simulateInputEvent(element) {
    try {
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true,
            composed: true
        });
        
        // Establecer propiedades adicionales que React espera
        Object.defineProperty(inputEvent, 'target', {
            value: element,
            configurable: true
        });
        
        Object.defineProperty(inputEvent, 'currentTarget', {
            value: element,
            configurable: true
        });
        
        element.dispatchEvent(inputEvent);
        
        // ✅ EVENTO ADICIONAL: Para Material-UI específicamente
        const inputEventMUI = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
            data: element.value
        });
        
        element.dispatchEvent(inputEventMUI);
        
    } catch (error) {
        console.warn('⚠️ Error simulando evento input:', error);
    }
}

/**
 * ✅ NUEVO: Simular evento change real
 */
simulateChangeEvent(element) {
    try {
        const changeEvent = new Event('change', {
            bubbles: true,
            cancelable: true,
            composed: true
        });
        
        Object.defineProperty(changeEvent, 'target', {
            value: element,
            configurable: true
        });
        
        element.dispatchEvent(changeEvent);
    } catch (error) {
        console.warn('⚠️ Error simulando evento change:', error);
    }
}

/**
 * ✅ NUEVO: Simular evento blur real
 */
simulateBlurEvent(element) {
    try {
        const blurEvent = new FocusEvent('blur', {
            bubbles: true,
            cancelable: true,
            composed: true
        });
        
        element.dispatchEvent(blurEvent);
    } catch (error) {
        console.warn('⚠️ Error simulando evento blur:', error);
    }
}

/**
 * ✅ HELPER: Obtener código de tecla
 */
getKeyCode(key) {
    const keyCodes = {
        'Tab': 9,
        'Delete': 46,
        'Backspace': 8,
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52,
        '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
        '.': 190, ',': 188
    };
    
    return keyCodes[key] || key.charCodeAt(0);
}

    async fillTextareaWithValue(textarea, value) {
        try {
            console.log(`📝 Llenando textarea: ${value.substring(0, 50)}...`);
            
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(300);
            
            textarea.focus();
            await this.delay(200);
            
            textarea.select();
            await this.delay(100);
            
            textarea.value = value;
            
            const events = ['input', 'change', 'blur'];
            events.forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                textarea.dispatchEvent(event);
            });
            
            await this.delay(300);
            
            console.log('✅ Textarea llenada exitosamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error llenando textarea:', error);
            return false;
        }
    }
    
    addIndicator() {
        const existing = document.getElementById('compra-agil-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'compra-agil-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, #e83e8c 0%, #20c997 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 20px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                user-select: none;
                cursor: pointer;
            ">
                🎯 COMPRA ÁGIL: ${this.cotizacion}
            </div>
        `;
        
        // Hacer clickeable para debug
        indicator.addEventListener('click', () => {
            console.log('🐛 DEBUG - Estado actual:', {
                isRunning: this.isRunning,
                cotizacion: this.cotizacion,
                automationData: this.automationData,
                processedItems: this.processedItems,
                retryCount: this.retryCount
            });
        });
        
        document.body.appendChild(indicator);
    }
    
    updateIndicator(texto, estado = 'default') {
        const indicator = document.getElementById('compra-agil-indicator');
        //if (!indicator) return;
        if (!indicator) {
        this.addIndicator(); // Crear el indicador base
        indicator = document.getElementById('compra-agil-indicator');
    }
        if (!indicator) return; // Safety check

        const colors = {
        'processing': '#ffc107',
        'success': '#28a745', 
        'error': '#dc3545',
        'warning': '#ff6b35',
        'waiting': '#17a2b8',
        'default': '#e83e8c'
    };
        
        const color = colors[estado] || colors.default;
        
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: ${color};
                color: white;
                padding: 12px 16px;
                border-radius: 20px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                user-select: none;
                cursor: pointer;
            ">
                ${texto}
            </div>
        `;
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicialización simplificada
let compraAgilInstance = null;

// ✅ 1. CONTENT-COMPRAAGIL.JS - RESTAURAR initializeCompraAgilStorageOnly ORIGINAL
function initializeCompraAgilStorageOnly() {
    if (compraAgilInstance) {
        console.log('⚠️ Instancia ya existe, reinicializando...');
        compraAgilInstance = null;
    }
         
    // Verificar que estamos en la página correcta
    const url = window.location.href;
    if (url.includes('compra-agil.mercadopublico.cl')) {
        console.log('✅ URL de Compra Ágil confirmada, inicializando...');
        compraAgilInstance = new CompraAgilStorageOnly();
    } else {
        console.log('ℹ️ No estamos en Compra Ágil, saltando inicialización');
    }
}



// 🔐 PROTECCIÓN CONTINUA PARA ELEMENTOS DINÁMICOS
const observer = new MutationObserver(() => {
    // Aplicar protección a nuevos inputs que aparezcan
    fileSecurityManager.preventFileInputAutoClick();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
console.log('📜 Content script Compra Ágil Storage Only cargado completamente');

async function clickEnviarCotizacionButton() {
    const posiblesBotones = Array.from(document.querySelectorAll('button')).filter(btn => {
        const txt = btn.textContent?.toLowerCase() || '';
        return txt.includes('enviar') && txt.includes('cotización') && btn.offsetParent !== null && !btn.disabled;
    });

    if (posiblesBotones.length > 0) {
        const boton = posiblesBotones[0];
        console.log(`✅ Botón de envío encontrado: "${boton.textContent.trim()}"`);
        boton.click();
        return true;
    } else {
        console.warn('⚠️ No se encontró botón de enviar cotización');
        return false;
    }
}


/**
 * ✅ FUNCIÓN COMPLETAMENTE CORREGIDA: Marcar checkbox declaración jurada
 */
async function marcarCheckboxDeclaracionJurada() {
    console.log('☑️ Buscando checkbox de declaración jurada...');
    
    // ✅ FUNCIÓN HELPER: Delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // ✅ MÉTODO 1: Buscar por texto del label (más preciso)
    const buscarPorTextoLabel = () => {
        const labels = Array.from(document.querySelectorAll('label'));
        
        for (const label of labels) {
            const texto = label.textContent?.toLowerCase() || '';
            
            // Patrones específicos de declaración jurada
            const patronesDeclaracion = [
                'declaro que toda la información',
                'perjurio',
                'falso testimonio',
                'código penal',
                'artículo 210',
                'presidio menor',
                'delito de perjurio',
                'información ingresada en este formulario es veraz'
            ];
            
            const esDeclaracionJurada = patronesDeclaracion.some(patron => texto.includes(patron));
            
            if (esDeclaracionJurada) {
                // Buscar checkbox asociado al label
                const checkbox = label.querySelector('input[type="checkbox"]') || 
                               document.getElementById(label.getAttribute('for')) ||
                               label.closest('.form-control, .checkbox-container')?.querySelector('input[type="checkbox"]');
                
                if (checkbox) {
                    console.log(`✅ Checkbox declaración jurada encontrado por label`);
                    return checkbox;
                }
            }
        }
        
        return null;
    };
    
    // ✅ MÉTODO 2: Buscar por proximidad de texto
    const buscarPorProximidad = () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        for (const checkbox of checkboxes) {
            if (!checkbox.offsetParent) continue; // Skip invisible
            
            // Buscar texto cercano al checkbox
            let container = checkbox.closest('div, label, form');
            let attempts = 0;
            
            while (container && attempts < 5) {
                const texto = container.textContent?.toLowerCase() || '';
                
                if (texto.includes('perjurio') || 
                    texto.includes('declaro que') || 
                    texto.includes('código penal') ||
                    texto.includes('falso testimonio')) {
                    
                    console.log(`✅ Checkbox encontrado por proximidad de texto`);
                    return checkbox;
                }
                
                container = container.parentElement;
                attempts++;
            }
        }
        
        return null;
    };
    
    // ✅ MÉTODO 3: Buscar el último checkbox (a menudo es la declaración jurada)
    const buscarUltimoCheckbox = () => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'))
            .filter(cb => cb.offsetParent !== null); // Solo visibles
        
        if (checkboxes.length > 0) {
            const ultimoCheckbox = checkboxes[checkboxes.length - 1];
            console.log(`✅ Usando último checkbox como declaración jurada`);
            return ultimoCheckbox;
        }
        
        return null;
    };
    
    // ✅ MÉTODO 4: Buscar por atributos específicos
    const buscarPorAtributos = () => {
        const selectores = [
            'input[name*="declaration"]',
            'input[name*="declaracion"]',
            'input[name*="jurada"]',
            'input[id*="declaration"]',
            'input[id*="declaracion"]',
            'input[data-testid*="declaration"]',
            'input[aria-label*="declaro"]'
        ];
        
        for (const selector of selectores) {
            const checkbox = document.querySelector(selector);
            if (checkbox && checkbox.offsetParent) {
                console.log(`✅ Checkbox encontrado por atributo: ${selector}`);
                return checkbox;
            }
        }
        
        return null;
    };
    
    // ✅ EJECUTAR MÉTODOS EN ORDEN DE PRECISIÓN
    const metodos = [
        { nombre: 'Por texto de label', funcion: buscarPorTextoLabel },
        { nombre: 'Por proximidad', funcion: buscarPorProximidad },
        { nombre: 'Por atributos', funcion: buscarPorAtributos },
        { nombre: 'Último checkbox', funcion: buscarUltimoCheckbox }
    ];
    
    let checkbox = null;
    
    for (const metodo of metodos) {
        console.log(`🔍 Intentando método: ${metodo.nombre}`);
        checkbox = metodo.funcion();
        
        if (checkbox) {
            console.log(`✅ Checkbox encontrado con método: ${metodo.nombre}`);
            break;
        }
    }
    
    if (!checkbox) {
        console.error('❌ No se encontró checkbox de declaración jurada');
        
        // ✅ DEBUG: Mostrar todos los checkboxes disponibles
        const todosCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        console.log(`🔍 DEBUG: ${todosCheckboxes.length} checkboxes encontrados:`);
        
        todosCheckboxes.forEach((cb, index) => {
            if (cb.offsetParent) {
                const label = cb.closest('label')?.textContent?.trim().substring(0, 50) || 'Sin label';
                console.log(`  ${index + 1}. Checked: ${cb.checked}, Label: "${label}..."`);
            }
        });
        
        return false;
    }
    
    // ✅ MARCAR EL CHECKBOX SI NO ESTÁ MARCADO
    if (!checkbox.checked) {
        try {
            console.log('☑️ Marcando checkbox de declaración jurada...');
            
            // Scroll al checkbox
            checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await delay(300);
            
            // Focus en el checkbox
            checkbox.focus();
            await delay(200);
            
            // ✅ MÉTODO ROBUSTO: Múltiples formas de marcar
            
            // 1. Click directo
            checkbox.click();
            await delay(100);
            
            // 2. Cambiar propiedad checked
            checkbox.checked = true;
            
            // 3. Disparar eventos necesarios para React/Vue/Angular
            const eventos = ['change', 'input', 'click'];
            for (const tipoEvento of eventos) {
                const evento = new Event(tipoEvento, { 
                    bubbles: true, 
                    cancelable: true 
                });
                checkbox.dispatchEvent(evento);
                await delay(50);
            }
            
            // 4. Si hay label asociado, hacer click también
            const label = checkbox.closest('label') || 
                         document.querySelector(`label[for="${checkbox.id}"]`);
            
            if (label) {
                label.click();
                await delay(100);
            }
            
            // ✅ VERIFICAR que se marcó correctamente
            await delay(300);
            
            if (checkbox.checked) {
                console.log('✅ Checkbox de declaración jurada marcado correctamente');
                return true;
            } else {
                console.warn('⚠️ Checkbox no se marcó - intentando método alternativo');
                
                // ✅ MÉTODO ALTERNATIVO: Simular teclado
                checkbox.focus();
                const spaceEvent = new KeyboardEvent('keydown', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32,
                    bubbles: true
                });
                checkbox.dispatchEvent(spaceEvent);
                
                await delay(200);
                
                if (checkbox.checked) {
                    console.log('✅ Checkbox marcado con método alternativo');
                    return true;
                } else {
                    console.error('❌ No se pudo marcar el checkbox');
                    return false;
                }
            }
            
        } catch (error) {
            console.error('❌ Error marcando checkbox:', error);
            return false;
        }
    } else {
        console.log('✅ Checkbox ya estaba marcado');
        return true;
    }
}

function iniciarVigilanciaEnvioCotizacion(callbackCuandoClickDetectado) {
    const observer = new MutationObserver(() => {
        const botones = Array.from(document.querySelectorAll('button')).filter(btn => {
            const txt = btn.textContent?.toLowerCase() || '';
            return txt.includes('aceptar') && txt.includes('enviar') && btn.offsetParent !== null;
        });

        for (const btn of botones) {
            btn.addEventListener('click', () => {
                console.log('🛎️ Click manual detectado en botón de envío');
                callbackCuandoClickDetectado();
                observer.disconnect();
            }, { once: true });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
function mostrarMensajeEsperandoEnvio() {
    const existing = document.getElementById('esperando-envio-banner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'esperando-envio-banner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 999999;
            background: #ffeeba;
            color: #856404;
            padding: 12px 20px;
            border-radius: 12px;
            font-weight: bold;
            font-family: sans-serif;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        ">
            ⚠️ Falta aceptar y enviar cotización para finalizar.
        </div>
    `;
    document.body.appendChild(banner);
}

function ocultarMensajeEsperandoEnvio() {
    const banner = document.getElementById('esperando-envio-banner');
    if (banner) banner.remove();
}
// ✅ FUNCIÓN MEJORADA observarCambioDeUrlYConfirmarExito
function observarCambioDeUrlYConfirmarExito(callback) {
    console.log('👀 Iniciando observación de cambio de URL...');
    
    let urlActual = window.location.href;
    let intervalId;
    let contador = 0;
    let yaEjecutado = false; // ✅ FLAG LOCAL PARA EVITAR MÚLTIPLE EJECUCIÓN
    const maxIntentos = 240;
    
    const verificarCambioUrl = () => {
        if (yaEjecutado) return; // ✅ SALIR SI YA SE EJECUTÓ
        
        const nuevaUrl = window.location.href;
        contador++;
        
        if (nuevaUrl !== urlActual) {
            console.log('🔄 Cambio de URL detectado:');
            console.log('  📍 Anterior:', urlActual);
            console.log('  📍 Nueva:', nuevaUrl);
            
            const urlsExito = [
                'cotizacion-publicada',
                'enviada', 
                'confirmada',
                'exito',
                'success'
            ];
            
            const esUrlExito = urlsExito.some(palabra => nuevaUrl.toLowerCase().includes(palabra));
            
            if (esUrlExito && !yaEjecutado) {
                console.log('✅ URL de éxito detectada, ejecutando callback...');
                yaEjecutado = true; // ✅ MARCAR COMO EJECUTADO
                clearInterval(intervalId);
                
                setTimeout(() => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('❌ Error ejecutando callback:', error);
                    }
                }, 1000);
                return;
            }
            urlActual = nuevaUrl;
        }
        
        if (contador >= maxIntentos) {
            console.log('⏰ Tiempo de observación agotado (2 minutos)');
            clearInterval(intervalId);
        }
    };
    
    intervalId = setInterval(verificarCambioUrl, 500);
    console.log('👁️ Observación de URL iniciada (máximo 2 minutos)');
    
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            console.log('🛑 Observación de URL detenida manualmente');
        }
    };
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCompraAgilStorageOnly);
} else {
    // Si ya está cargado, esperar un poco más para asegurar que React haya renderizado
    setTimeout(initializeCompraAgilStorageOnly, 1000);
}

// Detectar cambios de página para SPAs
let currentCompraAgilUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentCompraAgilUrl) {
        currentCompraAgilUrl = window.location.href;
        console.log('📍 Cambio de página detectado en Compra Ágil:', currentCompraAgilUrl);
        
        // Reinicializar si es necesario
        setTimeout(initializeCompraAgilStorageOnly, 2000);
    }
}, 2000);

console.log('📜 Content script Compra Ágil Storage Only cargado completamente');
// ✅ AGREGAR ESTO AL FINAL DE content-compraagil.js (después de todas las clases):
// ✅ AGREGAR ESTO AL FINAL DE content-compraagil.js (después de todas las clases):
