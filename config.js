// config.js - Configuración centralizada para LICITACIONES - Basada en script Python
// ✅ URLs y configuraciones específicas para el proceso de licitaciones

console.log('🔧 CONFIG.JS LICITACIONES: Iniciando carga...');

const EXTENSION_CONFIG = {
    // 🌍 CONFIGURACIÓN DE ENTORNO
    ENVIRONMENT: 'production',
    VERSION: '1.0.0',
    DEBUG_MODE: false,
    
    // 🏢 URLS CENTRALIZADAS (basadas en el script Python)
    URLS: {
        PHARMATENDER: {
            BASE: 'https://prime.pharmatender.cl',
            API_BASE: 'https://prime.pharmatender.cl/api/extension',
            LOGIN: 'https://prime.pharmatender.cl/login',
            INSTALAR_EXTENSION: 'https://prime.pharmatender.cl/instalar-extension?setup=complete'
        },
        MERCADO_PUBLICO: {
            HOME: 'https://www.mercadopublico.cl',
            PORTAL: 'https://www.mercadopublico.cl/Portal',
            HEIMDALL: 'https://heimdall.mercadopublico.cl',
            // ✅ URLs específicas para licitaciones (del script Python)
            SEARCH_PROCUREMENT: 'https://www.mercadopublico.cl/BID/Modules/RFB/NEwSearchProcurement.aspx',
            DESKTOP: 'https://www.mercadopublico.cl/Portal/Modules/Desktop/Desktop.aspx'
        },
        CLAVE_UNICA: {
            AUTH: 'https://accounts.claveunica.gob.cl',
            LOGIN_URL: 'https://auth.mercadopublico.cl'
        }
    },
    
    // 🔒 DOMINIOS PERMITIDOS (validación de origen)
    ALLOWED_ORIGINS: [
        'https://prime.pharmatender.cl',
        'https://www.mercadopublico.cl',
        'https://heimdall.mercadopublico.cl',
        'https://accounts.claveunica.gob.cl',
        'https://auth.mercadopublico.cl'
    ],
    
    // ⚙️ CONFIGURACIÓN DE API
    API: {
        TIMEOUT: 15000, // Más tiempo para licitaciones complejas
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000,
        ENDPOINTS: {
            CHECK_AUTH: 'check-auth',
            LICITACION_DATA: 'licitacion-data',
            GET_DOCUMENT_FILE: 'get-document-file',
            UPDATE_ESTADO_POSTULACION: 'update-estado-postulacion',
            INSERTAR_ESTADO_POSTULACION: 'insertar-estado-postulacion',
            VERIFY_INSTALLATION: 'verify-installation',
            HEARTBEAT: 'heartbeat'
        }
    },
    
    // 🔐 CONFIGURACIÓN DE SEGURIDAD
    SECURITY: {
        ENCRYPTION_ALGORITHM: 'AES-GCM',
        KEY_LENGTH: 256,
        IV_LENGTH: 12,
        STORAGE_KEY_PREFIX: 'pharmatender_lic_',
        SESSION_TIMEOUT: 45 * 60 * 1000, // 45 minutos para licitaciones
        CREDENTIALS_KEY: 'pharmatender_lic_credentials',
        MAX_CREDENTIAL_AGE: 7 * 24 * 60 * 60 * 1000 // 7 días
    },
    
    // 📱 CONFIGURACIÓN DE EXTENSIÓN
    EXTENSION: {
        POPUP_WIDTH: 480,
        POPUP_HEIGHT: 700,
        NOTIFICATION_DURATION: 7000,
        AUTO_RETRY_MAX: 3,
        DELAY_BETWEEN_ACTIONS: 500, // Más lento para licitaciones
        AUTOMATION: {
            MAX_WAIT_TIME: 60000, // 1 minuto de espera máxima
            INPUT_DELAY: 200,
            TYPING_SPEED: 100,
            HUMAN_DELAY_MIN: 300,
            HUMAN_DELAY_MAX: 800,
            PAGE_LOAD_WAIT: 5000,
            FORM_SUBMIT_WAIT: 3000
        }
    },

    // 🔗 PATRONES DE URL PARA IDENTIFICAR PÁGINAS
    URL_PATTERNS: {
        PHARMATENDER: {
            LOGIN: /\/login/i,
            DASHBOARD: /\/dashboard|\/inicio/i,
            LICITACIONES: /\/licitaciones|\/licitacion/i,
            OFERTA: /\/oferta|\/postular/i,
            DOCUMENTOS: /\/documentos/i,
            CARGA_DOCUMENTOS: /\/carga-documentos\/[\w\-]+/i,
            DETALLE_LICITACION: /\/detalle-licitacion\/[\w\-]+/i,
            CREAR_OFERTA: /\/crear-oferta\/[\w\-]+/i
        },
        MERCADO_PUBLICO: {
            LOGIN: /\/Login\.aspx/i,
            BUSCAR_LICITACION: /\/BuscarLicitacion/i,
            CREAR_OFERTA: /\/CrearOferta/i,
            SUBIR_DOCUMENTOS: /\/AgregarArchivos/i,
            FIRMAR: /\/Firmar/i,
            ENVIAR_OFERTA: /\/EnviarOferta/i
        }
    },
    
    // 🏷️ SELECTORES CSS ESPECÍFICOS PARA LICITACIONES (basados en el script Python)
    SELECTORS: {
        LOGIN: {
            // Login inicial en Mercado Público
            INICIAR_SESION: 'button:contains("Iniciar Sesión"), [onclick*="Iniciar"], a[href*="auth"]',
            CLAVE_UNICA_BUTTON: '#zocial-oidc, .zocial-oidc'
        },
        CLAVE_UNICA: {
            USERNAME: '#uname',
            PASSWORD: '#pword',
            LOGIN_BUTTON: '#login-submit, button[type="submit"]',
            SUBMIT_FORM: 'form[action*="login"], form[action*="authenticate"]'
        },
        ORGANIZATION: {
            // Selección de unidad organizacional
            UNIT_CONTAINER: '.unit-container',
            UNIDAD_TEXT: '.unidad',
            ORGANISMO_TABLE: '#tblOrganismos, table[id*="organismos"]',
            FARMA_UNIT_PATTERN: '*farma*', // Para buscar unidades farmacéuticas
            SELECT_BUTTON: 'svg, button[onclick*="seleccionar"], a[onclick*="seleccionar"]'
        },
        SEARCH: {
            // Búsqueda de licitaciones
            SEARCH_INPUT: '#txtProcCode',
            SEARCH_BUTTON: '#btnSearchByCode',
            VER_OFERTAS: 'input[title="Ver Ofertas"], button[title="Ver Ofertas"]',
            MODAL_OFERTAS: '#modalOfertasNoEnviadas',
            MODAL_CLOSE: 'button.close, .close'
        },
        OFERTAS: {
            // Estado de ofertas existentes
            ESTADO_OFERTA: '#rptDetail_ctl01_lblrptStatus',
            EDIT_OFERTA: '#rptDetail_ctl01_imgEdit',
            NEW_BID_BUTTON: '#btnNewBid'
        },
        FORM: {
            // Formulario de oferta (páginas 2-5 del script Python)
            NOMBRE_OFERTA: '#ctl00_mpcphFormWizardFields_txtBIDName',
            DESCRIPCION_OFERTA: [
                '#wysiwygctl00_mpcphFormWizardFields_EditZone',
                '#ctl00_mpcphFormWizardFields_EditZone',
                '#ctl00_mpcphFormWizardFields_txtDescription'
            ],
            OFERTA_CONJUNTA_SI: '#ctl00_mpcphFormWizardFields_rbactivaUtp',
            OFERTA_CONJUNTA_NO: '#ctl00_mpcphFormWizardFields_rbdesactivaUtp',
            NEXT_BUTTON: '#ctl00_btnNext'
        },
        PRODUCTOS: {
            // Página de productos (tercera página del script Python)
            NO_BIDS_CHECKBOX: '#ctl00_mpcphFormWizardFields_chkNoBids',
            PRODUCT_CHECKBOX_PATTERN: 'ctl00_mpcphFormWizardFields_rptBids_ctl{INDEX}_rblBids_0',
            PRODUCT_TEXTAREA_PATTERN: 'ctl00_mpcphFormWizardFields_rptBids_ctl{INDEX}__TxtSupplierComment',
            PRODUCT_PRICE_PATTERN: 'ctl00_mpcphFormWizardFields_rptBids_ctl{INDEX}__TxtUnitNetPriceN',
            PAGINATION_FUNCTION: 'fnMovePage',
            PAGER_BASE: 'wucPagerBID'
        },
        DOCUMENTOS: {
            // Carga de documentos (basado en el script Python)
            IFRAME: '#ctl00_mpcphFormWizardFields__IFrameAttachment',
            ADMIN_FILE: '#browse_local_admin_file',
            ADMIN_ADD: '#add_local_admin_files',
            TECH_FILE: '#browse_local_tec_file',
            TECH_ADD: '#add_local_tec_files',
            ECO_FILE: '#browse_local_eco_file',
            ECO_ADD: '#add_local_eco_files',
            CONFIRMATION_MESSAGE: '.mensaje_info_agregar',
            DOCUMENT_LIST: '#added_chp_doc_list',
            DOCUMENT_NAME: '.nameDocumentoAgregado'
        },
        FIRMA: {
            // Declaración jurada y firma (del script Python)
            DJ_ESTADO: '#dj_estado',
            DECLARAR_FIRMAR: 'a:contains("Declarar y firmar")',
            FIRMAR_SIN_CLAVE: 'button:contains("Firmar sin Clave Única")',
            CONFIRMAR_FIRMA: 'button:contains("Firmar sin Clave Única").hOvxpq',
            CERRAR_FIRMA: 'button:contains("Cerrar y volver a la oferta")',
            CHECKBOX_FIRMA: 'input.fKMtys'
        },
        FINALIZACION: {
            // Finalización de oferta (quinta página del script Python)
            ENVIAR_OFERTA: '#ctl00_mpcphFormWizardFields_btnEnterOffer',
            CONFIRMACION_ALERT: 'alert'
        }
    },
    
    // 🗂️ CONFIGURACIÓN ESPECÍFICA PARA TIPOS DE DOCUMENTOS
    DOCUMENT_TYPES: {
        ADMINISTRATIVO: {
            key: 'administrativo',
            inputSelector: '#browse_local_admin_file',
            buttonSelector: '#add_local_admin_files',
            folderPath: '/administrativos/'
        },
        TECNICO: {
            key: 'tecnico',
            inputSelector: '#browse_local_tec_file',
            buttonSelector: '#add_local_tec_files',
            folderPath: '/tecnicos/'
        },
        ECONOMICO: {
            key: 'economico',
            inputSelector: '#browse_local_eco_file',
            buttonSelector: '#add_local_eco_files',
            folderPath: '/economicos/'
        }
    },
    
    // ⏰ TIMEOUTS ESPECÍFICOS PARA LICITACIONES
    TIMEOUTS: {
        PAGE_LOAD: 60000,          // 1 minuto para cargar páginas
        ELEMENT_WAIT: 30000,       // 30 segundos para encontrar elementos
        FORM_SUBMIT: 10000,        // 10 segundos para submit de formularios
        FILE_UPLOAD: 120000,       // 2 minutos para subida de archivos
        SIGNATURE: 180000,         // 3 minutos para proceso de firma
        ORGANIZATION_SELECT: 15000, // 15 segundos para selección de organización
        JAVASCRIPT_FUNCTION: 20000  // 20 segundos para funciones JS
    }
};

console.log('🔧 CONFIG.JS LICITACIONES: Objeto EXTENSION_CONFIG creado');

// 🛠️ FUNCIONES UTILITARIAS ESPECÍFICAS PARA LICITACIONES

/**
 * ✅ Construcción de URL de Desktop con código de postulación
 */
function getLicitacionUrl(codigoPostulacion) {
    if (!codigoPostulacion) {
        throw new Error('Código de postulación requerido');
    }
    return `${EXTENSION_CONFIG.URLS.MERCADO_PUBLICO.DESKTOP}?enc=${codigoPostulacion}`;
}

/**
 * ✅ Generar selectores de producto con índice formateado
 */
function getProductSelector(basePattern, indiceFormateado) {
    return basePattern.replace('{INDEX}', indiceFormateado);
}

/**
 * ✅ Obtener configuración de tipo de documento
 */
function getDocumentConfig(tipo) {
    const tipoUpper = tipo.toUpperCase();
    return EXTENSION_CONFIG.DOCUMENT_TYPES[tipoUpper] || null;
}

/**
 * ✅ Construir ruta completa de documento
 */
function getDocumentPath(nombreCliente, idLicitacion, tipoDocumento, nombreArchivo) {
    const docConfig = getDocumentConfig(tipoDocumento);
    if (!docConfig) {
        throw new Error(`Tipo de documento no válido: ${tipoDocumento}`);
    }
    
    const ruta = `/imagenes/carga_documentos/${nombreCliente}/${idLicitacion}${docConfig.folderPath}${nombreArchivo}`;
    return ruta;
}

/**
 * ✅ Obtener timeout específico por contexto
 */
function getTimeout(context) {
    const contextUpper = context.toUpperCase();
    return EXTENSION_CONFIG.TIMEOUTS[contextUpper] || EXTENSION_CONFIG.API.TIMEOUT;
}

/**
 * ✅ Formatear índice para selectores (del script Python)
 */
function formatearIndice(numero) {
    return numero.toString().padStart(2, '0');
}

/**
 * ✅ Validar estado de licitación
 */
function isEstadoValido(estado) {
    if (!estado) return false;
    
    const estadoLower = estado.toLowerCase();
    const estadosInvalidos = ['cancelada', 'cerrada', 'suspendida', 'anulada'];
    
    return !estadosInvalidos.some(invalid => estadoLower.includes(invalid));
}

/**
 * ✅ Construcción de URLs de API específicas para licitaciones
 */
function getLicitacionApiUrl(endpoint, params = {}) {
    const base = EXTENSION_CONFIG.URLS.PHARMATENDER.API_BASE;
    let url = `${base}/${endpoint}`;
    
    if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
    }
    
    return url;
}

/**
 * ✅ Configuración para requests específicos de licitaciones
 */
function getLicitacionRequestConfig(method = 'GET', data = null) {
    const config = {
        method: method,
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Extension-Version': EXTENSION_CONFIG.VERSION,
            'X-Extension-Type': 'licitaciones'
        },
        timeout: EXTENSION_CONFIG.API.TIMEOUT
    };
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    return config;
}

// 🔍 VALIDACIÓN ESPECÍFICA PARA LICITACIONES
function validateLicitacionConfig() {
    const required = [
        'URLS.MERCADO_PUBLICO.SEARCH_PROCUREMENT',
        'URLS.MERCADO_PUBLICO.DESKTOP',
        'SELECTORS.SEARCH.SEARCH_INPUT',
        'SELECTORS.PRODUCTOS.NO_BIDS_CHECKBOX',
        'SELECTORS.DOCUMENTOS.IFRAME',
        'DOCUMENT_TYPES.ADMINISTRATIVO'
    ];
    
    const errors = [];
    
    for (const path of required) {
        const value = getNestedValue(EXTENSION_CONFIG, path);
        if (!value) {
            errors.push(`Configuración licitación faltante: ${path}`);
        }
    }
    
    if (errors.length > 0) {
        console.error('❌ Errores configuración licitaciones:', errors);
        return false;
    }
    
    return true;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 🔍 VALIDACIÓN INICIAL
console.log('🔧 CONFIG.JS LICITACIONES: Validando configuración...');
if (!validateLicitacionConfig()) {
    console.error('❌ CONFIGURACIÓN LICITACIONES INVÁLIDA');
} else {
    console.log('✅ Configuración licitaciones validada');
}

// 📤 EXPORTAR AL WINDOW
try {
    window.EXTENSION_CONFIG = EXTENSION_CONFIG;
    window.LicitacionUtils = {
        // Funciones básicas
        getBaseUrl: (service) => {
            const serviceKey = service.toUpperCase().replace(/[-\s]/g, '_');
            return EXTENSION_CONFIG.URLS[serviceKey]?.BASE || EXTENSION_CONFIG.URLS[serviceKey];
        },
        getApiUrl: (endpoint) => getLicitacionApiUrl(endpoint),
        getRequestConfig: getLicitacionRequestConfig,
        
        // Funciones específicas para licitaciones
        getLicitacionUrl,
        getProductSelector,
        getDocumentConfig,
        getDocumentPath,
        getTimeout,
        formatearIndice,
        isEstadoValido,
        getLicitacionApiUrl,
        
        // Validaciones
        validateConfig: validateLicitacionConfig
    };
    
    console.log('✅ CONFIG.JS LICITACIONES: Exportado a window');
    
} catch (error) {
    console.error('❌ CONFIG.JS LICITACIONES: Error exportando:', error);
}

console.log('🔧 CONFIG.JS LICITACIONES: ¡CARGA COMPLETA!');