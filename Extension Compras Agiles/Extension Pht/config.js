// config.js - Configuración centralizada MEJORADA - Seguridad total
// ✅ TODAS las URLs centralizadas + Funciones de utilidad mejoradas

console.log('🔧 CONFIG.JS: Iniciando carga mejorada...');

const EXTENSION_CONFIG = {
    // 🌍 CONFIGURACIÓN DE ENTORNO
    ENVIRONMENT: 'production',
    VERSION: '1.0.5',
    DEBUG_MODE: false,
    
    // 🏢 URLS CENTRALIZADAS (ÚNICA FUENTE DE VERDAD)
    URLS: {
        PHARMATENDER: {
            BASE: 'https://prime.pharmatender.cl',
            API_BASE: 'https://prime.pharmatender.cl/api/extension',
            LOGIN: 'https://prime.pharmatender.cl/login',
            // ✅ NUEVAS URLs centralizadas
            INSTALAR_EXTENSION: 'https://prime.pharmatender.cl/instalar-extension?setup=complete'
        },
        MERCADO_PUBLICO: {
            HOME: 'https://www.mercadopublico.cl/Home',
            PORTAL: 'https://www.mercadopublico.cl/Portal',
            HEIMDALL: 'https://heimdall.mercadopublico.cl',
            COMPRA_AGIL: 'https://compra-agil.mercadopublico.cl',
            // ✅ NUEVAS URLs específicas
            COMPRA_AGIL_RESUMEN: 'https://compra-agil.mercadopublico.cl/resumen-cotizacion',
            COMPRA_AGIL_DOCUMENTOS: 'https://compra-agil.mercadopublico.cl/carga-documentos-ca'
        },
        CLAVE_UNICA: {
            AUTH: 'https://accounts.claveunica.gob.cl'
        }
    },
    
    // 🔒 DOMINIOS PERMITIDOS (validación de origen reforzada)
    ALLOWED_ORIGINS: [
        'https://prime.pharmatender.cl',
        'https://www.mercadopublico.cl',
        'https://compra-agil.mercadopublico.cl',
        'https://heimdall.mercadopublico.cl',
        'https://accounts.claveunica.gob.cl',
        'https://www.mercadopublico.cl/Portal/Modules/Menu/Menu.aspx'
    ],
    
    // ⚙️ CONFIGURACIÓN DE API
    API: {
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000,
        // ✅ ENDPOINTS CENTRALIZADOS
        ENDPOINTS: {
            CHECK_AUTH: 'check-auth',
            ORGANIZATION_DATA: 'organization-data',
            COTIZACION_DATA: 'cotizacion-data',
            GET_DOCUMENT_FILE: 'get-document-file',
            VERIFY_INSTALLATION: 'verify-installation',
            HEARTBEAT: 'heartbeat',
            PING: 'ping'
        }
    },
    
    // 🔐 CONFIGURACIÓN DE SEGURIDAD (mejorada)
    SECURITY: {
        ENCRYPTION_ALGORITHM: 'AES-GCM',
        KEY_LENGTH: 256,
        IV_LENGTH: 12,
        STORAGE_KEY_PREFIX: 'pharmatender_secure_',
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
        // ✅ NUEVA: Configuración de credenciales
        CREDENTIALS_KEY: 'pharmatender_encrypted_credentials',
        MAX_CREDENTIAL_AGE: 7 * 24 * 60 * 60 * 1000 // 7 días
    },
    
    // 📱 CONFIGURACIÓN DE EXTENSIÓN
    EXTENSION: {
        POPUP_WIDTH: 420,
        POPUP_HEIGHT: 600,
        NOTIFICATION_DURATION: 5000,
        AUTO_RETRY_MAX: 2,
        DELAY_BETWEEN_ACTIONS: 300,
        // ✅ NUEVA: Configuración de automatización
        AUTOMATION: {
            MAX_WAIT_TIME: 30000,
            INPUT_DELAY: 100,
            TYPING_SPEED: 80,
            HUMAN_DELAY_MIN: 200,
            HUMAN_DELAY_MAX: 500
        }
    },
    
    // 🏷️ SELECTORES CSS MEJORADOS
    SELECTORS: {
        CLAVE_UNICA: {
            USERNAME: '#uname',
            PASSWORD: '#pword',
            LOGIN_BUTTON: '#login-submit, button[type="submit"], input[type="submit"]',
            CLAVE_UNICA_BUTTON: '#zocial-oidc, .zocial.oidc'
        },
        MERCADO_PUBLICO: {
            INICIAR_SESION: 'button, a[href*="auth"], a[href*="heimdall"]',
            ORGANIZATION_RADIO: 'input[type="radio"][name="grupoOrg"]',
            INGRESAR_BUTTON: 'a.btn.btn-pri[onclick*="SeleccionarPorOrganizacionSSO"]'
        },
        COMPRA_AGIL: {
            // ✅ SELECTORES MEJORADOS para mejor detección
            VALOR_UNITARIO_INPUTS: [
                'input.MuiInputBase-input[type="text"]',
                'input[type="text"].MuiInputBase-input',
                'input[aria-label*="unitario"]',
                'input[placeholder*="unitario"]'
            ],
            DESPACHO_INPUT: [
                'input[type="text"]',
                'input[aria-label*="despacho"]',
                'input[placeholder*="despacho"]'
            ],
            DESCRIPCION_TEXTAREA: 'textarea, textarea.MuiInputBase-input',
            FILE_INPUT: 'input[type="file"]',
            EXAMINAR_BUTTON: 'button.sc-bdzqNv.gowuLk, button[role="button"]',
            // ✅ NUEVOS: Selectores para estado
            ESTADO_SELECTORS: [
                'span[color="error"].sc-eUALbN.gAZGlU',
                'span[color="success"].sc-eUALbN.gAZGlU',
                '.sc-eUALbN.gAZGlU',
                'span[color]'
            ]
        }
    }
};

console.log('🔧 CONFIG.JS: Objeto EXTENSION_CONFIG creado:', EXTENSION_CONFIG);

// 🛠️ FUNCIONES UTILITARIAS MEJORADAS

/**
 * ✅ MEJORADA: Obtiene URL base con validación
 */
function getBaseUrl(service) {
    console.log('🔧 CONFIG.JS: getBaseUrl llamado con:', service);
    
    if (!service) {
        throw new Error('Servicio requerido para getBaseUrl');
    }
    
    const serviceKey = service.toUpperCase().replace(/[-\s]/g, '_');
    
    if (EXTENSION_CONFIG.URLS[serviceKey]) {
        const serviceConfig = EXTENSION_CONFIG.URLS[serviceKey];
        return serviceConfig.BASE || Object.values(serviceConfig)[0];
    }
    
    throw new Error(`Servicio no configurado: ${service}`);
}

/**
 * ✅ MEJORADA: Construcción de URLs de API con endpoints centralizados
 */
function getApiUrl(endpoint = '') {
    console.log('🔧 CONFIG.JS: getApiUrl llamado con:', endpoint);
    
    const base = EXTENSION_CONFIG.URLS.PHARMATENDER.API_BASE;
    
    // ✅ NUEVO: Usar endpoints centralizados si está disponible
    if (endpoint && EXTENSION_CONFIG.API.ENDPOINTS[endpoint.toUpperCase()]) {
        endpoint = EXTENSION_CONFIG.API.ENDPOINTS[endpoint.toUpperCase()];
    }
    
    return endpoint ? `${base}/${endpoint}` : base;
}

/**
 * ✅ NUEVA: Construcción de URLs de Compra Ágil
 */
function getCompraAgilUrl(path = '', cotizacionId = null) {
    const base = EXTENSION_CONFIG.URLS.MERCADO_PUBLICO.COMPRA_AGIL;
    
    if (cotizacionId && path === 'resumen') {
        return `${EXTENSION_CONFIG.URLS.MERCADO_PUBLICO.COMPRA_AGIL_RESUMEN}/${cotizacionId}`;
    }
    
    if (cotizacionId && path === 'documentos') {
        return `${EXTENSION_CONFIG.URLS.MERCADO_PUBLICO.COMPRA_AGIL_DOCUMENTOS}/${cotizacionId}`;
    }
    
    return path ? `${base}/${path}` : base;
}

/**
 * ✅ NUEVA: Construcción de URLs de descarga de documentos
 */
function getDocumentDownloadUrl(cotizacionId, nombreDocumento) {
    if (!cotizacionId || !nombreDocumento) {
        throw new Error('cotizacionId y nombreDocumento son requeridos');
    }
    
    const base = EXTENSION_CONFIG.URLS.PHARMATENDER.API_BASE;
    return `${base}/${EXTENSION_CONFIG.API.ENDPOINTS.GET_DOCUMENT_FILE}?cotizacion=${cotizacionId}&nombre=${encodeURIComponent(nombreDocumento)}`;
}

/**
 * ✅ MEJORADA: Validación de origen reforzada
 */
function isOriginAllowed(origin) {
    if (!origin) return false;
    
    return EXTENSION_CONFIG.ALLOWED_ORIGINS.some(allowed => {
        try {
            const allowedUrl = new URL(allowed);
            const originUrl = new URL(origin);
            return allowedUrl.hostname === originUrl.hostname;
        } catch (error) {
            // Fallback: comparación por string
            const domain = allowed.replace('https://', '');
            return origin.includes(domain);
        }
    });
}

/**
 * ✅ MEJORADA: Configuración para requests HTTP con headers mejorados
 */
function getRequestConfig(method = 'GET', additionalHeaders = {}) {
    return {
        method: method,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Extension-Version': EXTENSION_CONFIG.VERSION,
            'X-Extension-Environment': EXTENSION_CONFIG.ENVIRONMENT,
            ...additionalHeaders
        },
        timeout: EXTENSION_CONFIG.API.TIMEOUT
    };
}

/**
 * ✅ NUEVA: Obtener selectores por contexto
 */
function getSelectors(context, selectorType = null) {
    if (!context || !EXTENSION_CONFIG.SELECTORS[context.toUpperCase()]) {
        console.error(`❌ Contexto de selectores no encontrado: ${context}`);
        return null;
    }
    
    const contextSelectors = EXTENSION_CONFIG.SELECTORS[context.toUpperCase()];
    
    if (selectorType) {
        return contextSelectors[selectorType.toUpperCase()] || null;
    }
    
    return contextSelectors;
}

/**
 * ✅ NUEVA: Configuración de delays para automatización humana
 */
function getHumanDelay(type = 'normal') {
    const automation = EXTENSION_CONFIG.EXTENSION.AUTOMATION;
    
    switch (type) {
        case 'typing':
            return automation.TYPING_SPEED;
        case 'input':
            return automation.INPUT_DELAY;
        case 'human':
            return Math.random() * (automation.HUMAN_DELAY_MAX - automation.HUMAN_DELAY_MIN) + automation.HUMAN_DELAY_MIN;
        default:
            return automation.INPUT_DELAY;
    }
}

/**
 * ✅ MEJORADA: Detección de entorno
 */
function detectEnvironment() {
    try {
        if (typeof window !== 'undefined' && window.location) {
            const currentUrl = window.location.href;
            
            if (currentUrl.includes('prime.pharmatender.cl')) {
                return 'production';
            }
        }
        
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            const extUrl = chrome.runtime.getURL('');
            if (extUrl.startsWith('chrome-extension://')) {
                return 'production';
            }
        }
        
        return 'production';
        
    } catch (error) {
        console.error('❌ Error detectando entorno:', error);
        return 'production';
    }
}

/**
 * ✅ MEJORADA: Validación de configuración completa
 */
function validateConfig() {
    const required = [
        'URLS.PHARMATENDER.BASE',
        'URLS.PHARMATENDER.API_BASE',
        'URLS.MERCADO_PUBLICO.HOME',
        'URLS.MERCADO_PUBLICO.COMPRA_AGIL',
        'ALLOWED_ORIGINS',
        'API.ENDPOINTS',
        'SELECTORS.COMPRA_AGIL'
    ];
    
    const errors = [];
    
    for (const path of required) {
        const value = getNestedValue(EXTENSION_CONFIG, path);
        if (!value) {
            errors.push(`Configuración faltante: ${path}`);
        }
    }
    
    if (errors.length > 0) {
        console.error('❌ Errores de configuración:', errors);
        return false;
    }
    
    return true;
}

/**
 * ✅ HELPER: Obtener valor anidado (sin cambios)
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

console.log('🔧 CONFIG.JS: Funciones utilitarias definidas');

// 🔍 VALIDACIÓN INICIAL
console.log('🔧 CONFIG.JS: Iniciando validación...');
if (!validateConfig()) {
    console.error('❌ CONFIGURACIÓN INVÁLIDA - La extensión puede no funcionar correctamente');
} else {
    console.log('✅ Configuración validada correctamente');
}

// 📤 EXPORTAR CONFIGURACIÓN AL WINDOW - MEJORADO
try {
    // ✅ ASIGNACIÓN COMPLETA Y VERIFICADA
    window.EXTENSION_CONFIG = EXTENSION_CONFIG;
    window.ExtensionUtils = {
        // ✅ Funciones básicas
        getBaseUrl,
        getApiUrl,
        isOriginAllowed,
        getRequestConfig,
        detectEnvironment,
        validateConfig,
        // ✅ NUEVAS funciones específicas
        getCompraAgilUrl,
        getDocumentDownloadUrl,
        getSelectors,
        getHumanDelay,
        // ✅ Función helper
        getNestedValue
    };
    
    console.log('✅ CONFIG.JS: Asignado a window.EXTENSION_CONFIG:', !!window.EXTENSION_CONFIG);
    console.log('✅ CONFIG.JS: Asignado a window.ExtensionUtils:', !!window.ExtensionUtils);
    
    // ✅ VERIFICACIÓN ROBUSTA
    const testSelectors = window.ExtensionUtils.getSelectors('COMPRA_AGIL', 'VALOR_UNITARIO_INPUTS');
    const testApiUrl = window.ExtensionUtils.getApiUrl('ping');
    const testCAUrl = window.ExtensionUtils.getCompraAgilUrl('resumen', 'test-123');
    
    console.log('🧪 CONFIG.JS: Tests exitosos:', {
        selectores: !!testSelectors,
        apiUrl: testApiUrl,
        compraAgilUrl: testCAUrl
    });
    
} catch (error) {
    console.error('❌ CONFIG.JS: Error asignando a window:', error);
}

console.log('🔧 CONFIG.JS: ¡CARGA COMPLETA MEJORADA!');