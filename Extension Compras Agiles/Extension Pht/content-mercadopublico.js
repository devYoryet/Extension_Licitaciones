// content-mercadopublico.js - Con validación de origen corregida

console.log('🏛️ CONTENT SCRIPT CARGADO EN:', window.location.href);

class MPAutomationClean {
    constructor() {
        this.isRunning = false;
        this.credentials = null;
        this.compraAgilId = null;
        this.shouldGoToCompraAgil = false;
        this.organizationData = null;
        this.initialized = false;
        this.startedFromPopup = false;

        console.log('🤖 MP Automation LIMPIO - Iniciando...');
        
        this.setupMessageListener();
        this.registerInWindow();
        this.checkStorageOnLoad(); // Verificar con validación estricta
        
        console.log('✅ Content script listo');
    }
    
    registerInWindow() {
        window.mpAutomationInstance = this;
        window.mpAutomationControlled = this;
        console.log('✅ Instancia registrada en window');
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('📨 Mensaje recibido:', request);
            
            if (request.action === 'startAutomation') {
                console.log('🚀 COMANDO RECIBIDO: Iniciar automatización DESDE POPUP');
                
                // Marcar que fue iniciado desde popup
                this.startedFromPopup = true;
                console.log('✅ Flag startedFromPopup establecido a TRUE');
                
                if (request.data) {
                    this.loadDataFromMessage(request.data);
                } else {
                    this.loadDataFromStorage();
                }
                
                sendResponse({ success: true, message: 'Automatización iniciada desde popup' });
                return true;
            }
            
            if (request.action === 'checkContentScript') {
                sendResponse({ 
                    success: true, 
                    ready: true,
                    url: window.location.href,
                    startedFromPopup: this.startedFromPopup
                });
                return true;
            }
            
            sendResponse({ success: false, message: 'Acción no reconocida' });
        });
        
        console.log('📡 Message listener configurado');
    }
    
    // *** FUNCIÓN RESTAURADA: Verificar storage automáticamente pero con validación de origen ***
  
  async checkStorageOnLoad() {
    try {
        const result = await chrome.storage.local.get(['mpAutomationData']);
        console.log('📦 Verificando storage al cargar:', result);
        
        if (result && result.mpAutomationData) {
            const data = result.mpAutomationData;
            const age = Date.now() - data.timestamp;
            
            console.log('📊 Datos encontrados en storage:');
            console.log('   - Edad:', Math.round(age / 1000), 'segundos');
            console.log('   - Status:', data.status);
            console.log('   - Source:', data.source);
            
            const validStates = ['ready', 'processing'];
            const isValidAge = age < 5 * 60 * 1000; // 5 minutos
            const isValidState = validStates.includes(data.status);
            
            console.log('🔍 VALIDACIÓN DETALLADA:');
            console.log(`   - Edad válida (< 5 min): ${isValidAge}`);
            console.log(`   - Estado válido: ${isValidState}`);
            
            if (isValidAge && isValidState) {
                // ✅ VALIDACIÓN 1: Verificar que extensión esté habilitada
                const isExtensionActive = await this.checkExtensionState();
                console.log(`   - Extensión activa: ${isExtensionActive}`);
                
                if (!isExtensionActive) {
                    console.log('❌ EXTENSIÓN DESACTIVADA - Automatización bloqueada');
                    return;
                }
                
                // ✅ VALIDACIÓN 2: Verificar autorización del usuario (click del popup)
                const hasUserAuthorization = await this.checkUserAuthorization();
                console.log(`   - Autorización manual: ${hasUserAuthorization}`);
                
                if (!hasUserAuthorization) {
                    console.log('❌ SIN AUTORIZACIÓN MANUAL - Solo se permite desde click del popup');
                    console.log('   Para ejecutar automatización, usa el popup de la extensión');
                    return;
                }
                
                // ✅ VALIDACIÓN 3: Verificar origen autorizado (tu validación existente)
                const isAuthorizedOrigin = this.isAuthorizedOrigin(data);
                console.log(`   - Origen autorizado: ${isAuthorizedOrigin}`);
                
                if (isAuthorizedOrigin) {
                    console.log('✅ TODAS LAS VALIDACIONES PASADAS - iniciando automatización');
                    
                    this.startedFromPopup = true;
                    this.loadDataFromStorage(data);
                    
                    if (data.status === 'ready') {
                        await chrome.storage.local.set({
                            mpAutomationData: { ...data, status: 'processing' }
                        });
                    }
                    
                    setTimeout(() => {
                        this.startAutomationProcess();
                    }, 2000);
                } else {
                    console.log('❌ Origen no autorizado - automatización bloqueada');
                }
            } else {
                console.log('❌ Datos inválidos en storage');
            }
        } else {
            console.log('ℹ️ No hay datos en storage');
        }
    } catch (error) {
        console.error('❌ Error verificando storage:', error);
    }
}

// ✅ NUEVA FUNCIÓN: Verificar autorización manual del usuario
async checkUserAuthorization() {
    try {
        const authData = await chrome.storage.local.get(['userAuthorization']);
        const authorization = authData.userAuthorization;

        if (!authorization) {
            console.log('🚫 No hay autorización manual del usuario');
            return false;
        }

        // Verificar que no haya expirado (5 minutos)
        const now = Date.now();
        const ageMinutes = (now - authorization.timestamp) / (1000 * 60);
        
        if (ageMinutes > 5) {
            console.log('⏰ Autorización manual expirada:', ageMinutes.toFixed(1), 'minutos');
            await this.clearUserAuthorization();
            return false;
        }

        console.log('✅ Autorización manual válida, edad:', ageMinutes.toFixed(1), 'minutos');
        return true;

    } catch (error) {
        console.error('❌ Error verificando autorización manual:', error);
        return false;
    }
}

// ✅ FUNCIÓN PARA LIMPIAR AUTORIZACIÓN
async clearUserAuthorization() {
    try {
        await chrome.storage.local.remove(['userAuthorization']);
        console.log('🗑️ Autorización manual eliminada');
    } catch (error) {
        console.error('❌ Error eliminando autorización:', error);
    }
}

// ✅ COPIA LA FUNCIÓN checkExtensionState DE content-compraagil.js
async checkExtensionState() {
    try {
        console.log('🔍 Verificando estado de extensión...');
        
        const result = await chrome.storage.local.get(['extensionActive']);
        
        const extensionActive = result.extensionActive !== false; // Default true si no existe
        
        console.log('📊 Estado de extensión desde storage:', {
            extensionActive: result.extensionActive,
            interpretado: extensionActive
        });
        
        return extensionActive;
        
    } catch (error) {
        console.error('❌ Error verificando estado de extensión:', error);
        return false; // En caso de error, asumir desactivada (seguro)
    }
}
    
    // *** NUEVA FUNCIÓN: Verificar si el origen está autorizado ***
   isAuthorizedOrigin(data) {
    try {
        // ✅ CORREGIR: Aceptar múltiples fuentes válidas
        const validSources = ['popup', 'smart_popup', 'debug_manual'];
        
        if (!data.source || !validSources.includes(data.source)) {
            console.log('⚠️ Sin información de origen válida');
            console.log(`   - Source actual: "${data.source}"`);
            console.log(`   - Sources válidos: ${validSources.join(', ')}`);
            return false;
        }
        
        // ✅ VALIDACIÓN MEJORADA: Verificar que tiene credenciales válidas
        const hasValidCredentials = data.credentials && 
                                  data.credentials.username && 
                                  data.credentials.password;
        
        if (hasValidCredentials) {
            console.log('✅ Origen autorizado: datos válidos desde', data.source);
            return true;
        }
        
        console.log('❌ Origen no autorizado: faltan credenciales válidas');
        console.log('   - Tiene credentials object:', !!data.credentials);
        console.log('   - Tiene username:', !!(data.credentials?.username));
        console.log('   - Tiene password:', !!(data.credentials?.password));
        return false;
        
    } catch (error) {
        console.error('❌ Error verificando origen:', error);
        return false;
    }
}
    
    loadDataFromMessage(data) {
        console.log('📥 Cargando datos desde mensaje (iniciado desde popup)');
        this.credentials = data.credentials;
        this.compraAgilId = data.compraAgilId;
        this.shouldGoToCompraAgil = data.shouldGoToCompraAgil;
        this.organizationData = data.organizationData;
        
        console.log('📊 Datos cargados:');
        console.log('   - Credenciales:', this.credentials ? 'Sí' : 'No');
        console.log('   - Compra Ágil:', this.compraAgilId || 'No');
        console.log('   - Organization Data:', this.organizationData ? 'Sí' : 'No');
        
        this.addIndicator();
        setTimeout(() => this.startAutomationProcess(), 1000);
    }
    
    async loadDataFromStorage(data = null) {
        try {
            if (!data) {
                const result = await chrome.storage.local.get(['mpAutomationData']);
                data = result.mpAutomationData;
            }
            
            if (data) {
                console.log('📥 Cargando datos desde storage');
                this.credentials = data.credentials;
                this.compraAgilId = data.compraAgilId;
                this.shouldGoToCompraAgil = data.shouldGoToCompraAgil;
                this.organizationData = data.organizationData;
                
                console.log('📊 Datos cargados desde storage:');
                console.log('   - Credenciales:', this.credentials ? 'Sí' : 'No');
                console.log('   - Compra Ágil:', this.compraAgilId || 'No');
                console.log('   - Organization Data:', this.organizationData ? 'Sí' : 'No');
                
                this.addIndicator();
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error cargando storage:', error);
            return false;
        }
    }
    
    async startAutomationProcess() {

        const isExtensionActive = await this.checkExtensionState();
        if (!isExtensionActive) {
            console.log('❌ AUTOMATIZACIÓN BLOQUEADA - Extensión desactivada');
            this.updateIndicator('⚠️ Extensión desactivada', 'error');
            return;
        }
        if (this.isRunning) {
            console.log('⚠️ Ya hay automatización en curso');
            return;
        }
        
        // *** VERIFICACIÓN: Solo ejecutar si está autorizado ***
        if (!this.startedFromPopup) {
            console.log('❌ AUTOMATIZACIÓN BLOQUEADA - No autorizada');
            console.log('   - startedFromPopup:', this.startedFromPopup);
            return;
        }
        
        if (!this.credentials) {
            console.log('❌ No hay credenciales');
            this.updateIndicator('❌ Sin credenciales', 'error');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 INICIANDO AUTOMATIZACIÓN (AUTORIZADA)');
        console.log('🔑 Usuario:', this.credentials.username);
        if (this.compraAgilId) {
            console.log('🎯 Compra Ágil:', this.compraAgilId);
        }
        
        try {
            await this.executeCurrentStep();
        } catch (error) {
            console.error('❌ ERROR:', error);
            this.updateIndicator('❌ Error: ' + error.message, 'error');
        } finally {
            this.isRunning = false;
        }
    }
    
    async executeCurrentStep() {
        const url = window.location.href;
          try {
        const result = await chrome.storage.local.get(['detectedOrganization']);
        if (result.detectedOrganization) {
            console.log('🏢 ORGANIZACIÓN DETECTADA EN STORAGE:', result.detectedOrganization);
            this.showOrganizationPopup(result.detectedOrganization);
            // Limpiar después de mostrar
            await chrome.storage.local.remove(['detectedOrganization']);
        } else {
            console.log('ℹ️ No hay organización en storage');
        }
    } catch (error) {
        console.error('❌ Error verificando organización:', error);
    }
        if (url.includes('accounts.claveunica.gob.cl')) {
            console.log('📍 PASO 3: Clave Única - Llenar credenciales');
            this.updateIndicator('📝 Llenando credenciales...', 'login');
            await this.llenarCredenciales();
            
        } else if (url.includes('www.mercadopublico.cl/Home') && !url.includes('token_type=') && !url.includes('code=')) {
            console.log('📍 PASO 1: Home MP - Buscar "Iniciar Sesión"');
            this.updateIndicator('🔍 Buscando login...', 'auth');
            await this.clickIniciarSesion();
            
        } else if (url.includes('heimdall.mercadopublico.cl')) {
            console.log('📍 PASO 2: Heimdall - Buscar "Clave Única"');
            this.updateIndicator('🗝️ Buscando Clave Única...', 'auth');
            await this.clickClaveUnica();
            
        } else if (url.includes('www.mercadopublico.cl/Home') && url.includes('token_type=Bearer')) {
            console.log('📍 PASO 4: MP con token - Seleccionar organización');
            this.updateIndicator('🏢 Seleccionando organización...', 'organization');
            await this.seleccionarOrganizacion();
            
        } else if (url.includes('www.mercadopublico.cl/Portal')) {
            console.log('📍 PASO 5: Portal MP - Finalizar');
            this.updateIndicator('✅ Login completado', 'success');
            await this.finalizarProceso();
            
        } else if (url.includes('compra-agil.mercadopublico.cl')) {
            console.log('📍 FINAL: En Compra Ágil');
            this.updateIndicator('🎯 ¡En Compra Ágil!', 'final-success');
            this.mostrarExito();
            
        } else {
            console.log('📍 URL NO RECONOCIDA:', url);
            this.updateIndicator('🌐 Redirigiendo...', 'auth');
            window.location.href = 'https://www.mercadopublico.cl/Home';
        }
    }
    
    // *** RESTO DE FUNCIONES SIN CAMBIOS ***
    async clickIniciarSesion() {
        console.log('🔍 Buscando botón "Iniciar Sesión"...');
        await this.delay(3000);
        
        const strategies = [
            () => {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                return buttons.find(btn => {
                    const text = btn.textContent.trim().toLowerCase();
                    return text.includes('iniciar sesión') || text.includes('iniciar sesion');
                });
            },
            () => {
                const links = Array.from(document.querySelectorAll('a'));
                return links.find(link => {
                    const href = link.href || '';
                    return href.includes('auth') || href.includes('heimdall');
                });
            }
        ];
        
        let boton = null;
        for (let i = 0; i < strategies.length; i++) {
            boton = strategies[i]();
            if (boton) {
                console.log(`✅ Botón encontrado con estrategia ${i + 1}`);
                break;
            }
        }
        
        if (boton) {
            console.log('👆 Click en "Iniciar Sesión"...');
            this.updateIndicator('👆 Click login...', 'auth');
            
            boton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            boton.click();
            
            this.waitForRedirection(['heimdall']);
        } else {
            throw new Error('No se encontró botón "Iniciar Sesión"');
        }
    }
    
    async clickClaveUnica() {
        console.log('🔍 Buscando botón "Clave Única"...');
        await this.delay(5000);
        
        const strategies = [
            () => document.getElementById('zocial-oidc'),
            () => document.querySelector('.zocial.oidc'),
            () => {
                const elements = Array.from(document.querySelectorAll('a, button, div'));
                return elements.find(el => {
                    if (!el.offsetParent) return false;
                    const text = el.textContent.toLowerCase();
                    return text.includes('clave única') || text.includes('clave unica') || 
                           text.includes('gobierno de chile');
                });
            },
            () => {
                const links = Array.from(document.querySelectorAll('a'));
                return links.find(link => {
                    const href = link.href || '';
                    return href.includes('claveunica');
                });
            }
        ];
        
        let boton = null;
        for (let i = 0; i < strategies.length; i++) {
            console.log(`🔍 Estrategia ${i + 1}...`);
            boton = strategies[i]();
            if (boton) {
                console.log(`✅ Botón Clave Única encontrado con estrategia ${i + 1}`);
                break;
            }
        }
        
        if (boton) {
            console.log('👆 Click en "Clave Única"...');
            this.updateIndicator('👆 Click Clave Única...', 'auth');
            
            boton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            
            try {
                boton.click();
            } catch (error) {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                boton.dispatchEvent(clickEvent);
                
                if (boton.href) {
                    window.location.href = boton.href;
                }
            }
            
            this.waitForRedirection(['claveunica']);
        } else {
            throw new Error('No se encontró botón "Clave Única"');
        }
    }
    
    async llenarCredenciales() {
        console.log('📝 Llenando credenciales con simulación humana...');
        await this.delay(3000);
        
        const campoUsuario = document.getElementById('uname');
        const campoPassword = document.getElementById('pword');
        
        if (!campoUsuario || !campoPassword) {
            throw new Error('No se encontraron campos de credenciales');
        }
        
        console.log('✅ Campos encontrados - simulando escritura humana...');
        
        // USUARIO - Escritura carácter por carácter
        campoUsuario.focus();
        await this.delay(200);
        
        campoUsuario.value = '';
        const username = this.credentials.username;
        
        for (let i = 0; i < username.length; i++) {
            await this.delay(80); // Pausa realista entre caracteres
            campoUsuario.value = username.substring(0, i + 1);
            campoUsuario.dispatchEvent(new Event('input', { bubbles: true }));
            campoUsuario.dispatchEvent(new Event('keyup', { bubbles: true }));
        }
        
        campoUsuario.dispatchEvent(new Event('change', { bubbles: true }));
        campoUsuario.dispatchEvent(new Event('blur', { bubbles: true }));
        
        console.log('✅ Usuario completado');
        await this.delay(500);
        
        // PASSWORD - Escritura carácter por carácter
        campoPassword.focus();
        await this.delay(200);
        
        campoPassword.value = '';
        const password = this.credentials.password;
        
        for (let i = 0; i < password.length; i++) {
            await this.delay(80);
            campoPassword.value = password.substring(0, i + 1);
            campoPassword.dispatchEvent(new Event('input', { bubbles: true }));
            campoPassword.dispatchEvent(new Event('keyup', { bubbles: true }));
        }
        
        campoPassword.dispatchEvent(new Event('change', { bubbles: true }));
        campoPassword.dispatchEvent(new Event('blur', { bubbles: true }));
        
        console.log('✅ Password completado');
        await this.delay(500);
        
        // SIMULAR TAB para activar validaciones
        console.log('🔄 Simulando TAB para activar validaciones...');
        
        const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            code: 'Tab',
            keyCode: 9,
            bubbles: true
        });
        
        campoUsuario.focus();
        campoUsuario.dispatchEvent(tabEvent);
        await this.delay(300);
        
        campoPassword.focus();
        campoPassword.dispatchEvent(tabEvent);
        await this.delay(300);
        
        campoUsuario.focus();
        await this.delay(1000);
        
        // BUSCAR BOTÓN SUBMIT con reintentos
        let botonSubmit = null;
        let intentos = 0;
        
        while (!botonSubmit && intentos < 5) {
            intentos++;
            console.log(`🔍 Buscando botón submit - intento ${intentos}/5...`);
            
            const selectores = [
                '#login-submit',
                'button[type="submit"]',
                'input[type="submit"]',
                'button[id*="login"]',
                'button[id*="submit"]'
            ];
            
            for (const selector of selectores) {
                const boton = document.querySelector(selector);
                if (boton && boton.offsetParent && !boton.disabled) {
                    botonSubmit = boton;
                    console.log(`✅ Botón submit encontrado: ${selector}`);
                    break;
                }
            }
            
            if (!botonSubmit) {
                console.log('⚠️ Botón no disponible, más interacción...');
                
                campoUsuario.click();
                await this.delay(200);
                campoPassword.click();
                await this.delay(200);
                
                // Simular Enter
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true
                });
                campoPassword.dispatchEvent(enterEvent);
                
                await this.delay(800);
            }
        }
        
        if (botonSubmit) {
            console.log('📤 Enviando formulario...');
            this.updateIndicator('📤 Enviando...', 'login');
            
            try {
                botonSubmit.click();
            } catch (error) {
                const form = document.querySelector('form');
                if (form) {
                    form.submit();
                }
            }
            
            // Verificar errores
            setTimeout(() => {
                const error = document.querySelector('.gob-response-error, .error');
                if (error && error.offsetParent) {
                    console.error('❌ ERROR DE LOGIN:', error.textContent);
                    this.updateIndicator('❌ Credenciales inválidas', 'error');
                } else {
                    this.updateIndicator('✅ Login exitoso...', 'success');
                    this.waitForRedirection(['mercadopublico.cl']);
                }
            }, 3000);
        } else {
            console.error('❌ NO SE ENCONTRÓ BOTÓN SUBMIT');
            
            const form = document.querySelector('form');
            if (form) {
                console.log('📤 Enviando formulario directamente...');
                form.submit();
            } else {
                throw new Error('No se encontró botón submit ni formulario');
            }
        }
    }
    
    async seleccionarOrganizacion() {
        console.log('🏢 Seleccionando organización...');
        await this.delay(4000);
        
        // Buscar radio buttons específicos del modal
        const radios = document.querySelectorAll('input[type="radio"][name="grupoOrg"]');
        console.log(`📋 Encontrados ${radios.length} radio buttons de organización`);
        
        if (radios.length === 0) {
            console.log('ℹ️ No hay modal visible aún');
            setTimeout(() => this.executeCurrentStep(), 2000);
            return;
        }
        
        // Obtener criterio de búsqueda desde organizationData
        let criterioBusqueda = null;
        if (this.organizationData && this.organizationData.nombre_unidad) {
            criterioBusqueda = this.organizationData.nombre_unidad.toLowerCase().trim();
            console.log(`🎯 Criterio de búsqueda desde endpoint: "${criterioBusqueda}"`);
        } else {
            console.error('❌ No hay organizationData o nombre_unidad disponible');
            throw new Error('No se puede determinar organización: falta organizationData');
        }
        
        // Analizar todas las opciones
        const opciones = [];
        console.log('🔍 Analizando opciones disponibles:');
        
        radios.forEach((radio, i) => {
            const label = document.querySelector(`label[for="${radio.id}"]`);
            const texto = label ? label.textContent.trim() : radio.value;
            const textoLower = texto.toLowerCase();
            
            opciones.push({
                radio: radio,
                label: label,
                texto: texto,
                textoLower: textoLower,
                index: i + 1,
                contieneCriterio: textoLower.includes(criterioBusqueda)
            });
            
            console.log(`  ${i + 1}. "${texto}" - Contiene "${criterioBusqueda}": ${textoLower.includes(criterioBusqueda)}`);
        });
        
        // Filtrar opciones que contienen el criterio
        const opcionesCoincidentes = opciones.filter(opcion => opcion.contieneCriterio);
        
        console.log(`🔍 Opciones que contienen "${criterioBusqueda}": ${opcionesCoincidentes.length}`);
        
        let radioSeleccionado = null;
        
        if (opcionesCoincidentes.length === 0) {
            // NO HAY COINCIDENCIAS
            console.error(`❌ NO se encontró ninguna organización que contenga: "${criterioBusqueda}"`);
            console.log('📋 Opciones disponibles:');
            opciones.forEach(opcion => {
                console.log(`   - "${opcion.texto}"`);
            });
            
            // Reportar error específico
            this.updateIndicator(`❌ Sin organización: "${criterioBusqueda}"`, 'error');
            throw new Error(`No se encontró organización con criterio: "${criterioBusqueda}"`);
            
        } else if (opcionesCoincidentes.length === 1) {
            // UNA COINCIDENCIA EXACTA - PERFECTO
            radioSeleccionado = opcionesCoincidentes[0].radio;
            console.log(`✅ COINCIDENCIA ÚNICA encontrada: "${opcionesCoincidentes[0].texto}"`);
            
        } else {
            // MÚLTIPLES COINCIDENCIAS - AMBIGÜEDAD
            console.warn(`⚠️ AMBIGÜEDAD: ${opcionesCoincidentes.length} organizaciones contienen "${criterioBusqueda}"`);
            console.log('📋 Opciones ambiguas:');
            opcionesCoincidentes.forEach((opcion, i) => {
                console.log(`   ${i + 1}. "${opcion.texto}"`);
            });
            
            // ESTRATEGIA DE DESAMBIGUACIÓN: Seleccionar la más específica (más larga)
            let mejorOpcion = opcionesCoincidentes[0];
            let mayorLongitud = mejorOpcion.texto.length;
            
            opcionesCoincidentes.forEach(opcion => {
                if (opcion.texto.length > mayorLongitud) {
                    mayorLongitud = opcion.texto.length;
                    mejorOpcion = opcion;
                }
            });
            
            radioSeleccionado = mejorOpcion.radio;
            console.log(`🎯 Desambiguación: Seleccionando la más específica: "${mejorOpcion.texto}"`);
            
            // Reportar la ambigüedad pero continuar
            this.updateIndicator(`⚠️ Ambigüedad resuelta: ${opcionesCoincidentes.length} opciones`, 'warning');
        }
        
        if (radioSeleccionado) {
            const label = document.querySelector(`label[for="${radioSeleccionado.id}"]`);
            const textoSeleccionado = label ? label.textContent.trim() : radioSeleccionado.value;
            
            console.log(`👆 SELECCIONANDO: "${textoSeleccionado}"`);
            
            radioSeleccionado.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // Marcar radio button
            radioSeleccionado.checked = true;
            radioSeleccionado.dispatchEvent(new Event('change', { bubbles: true }));
            radioSeleccionado.dispatchEvent(new Event('click', { bubbles: true }));
            
            // Click en label también
            if (label) {
                label.click();
            }
            
            console.log('✅ Radio button marcado correctamente');
            await this.delay(1000);
            
            // Buscar botón "Ingresar"
            await this.buscarBotonIngresar();
            
        } else {
            throw new Error('Error interno: no se pudo determinar radio button');
        }
    }
    
    async buscarBotonIngresar() {
        console.log('🔍 Buscando botón "Ingresar"...');
        
        let boton = null;
        
        // ESTRATEGIA 1: Botón específico del modal
        boton = document.querySelector('a.btn.btn-pri[onclick*="SeleccionarPorOrganizacionSSO"]');
        
        if (boton) {
            console.log('✅ Botón específico del modal encontrado');
        } else {
            // ESTRATEGIA 2: Buscar en footer del modal
            const footer = document.querySelector('.modal-footer');
            if (footer) {
                const botones = footer.querySelectorAll('button, a');
                for (const b of botones) {
                    if (b.offsetParent) {
                        const texto = b.textContent.toLowerCase();
                        if (texto.includes('ingresar') || texto.includes('confirmar')) {
                            boton = b;
                            console.log(`✅ Botón encontrado en footer: "${b.textContent.trim()}"`);
                            break;
                        }
                    }
                }
            }
        }
        
        // ESTRATEGIA 3: Buscar por onclick
        if (!boton) {
            const elementos = document.querySelectorAll('[onclick*="Seleccionar"]');
            for (const elemento of elementos) {
                if (elemento.offsetParent) {
                    boton = elemento;
                    console.log(`✅ Botón por onclick: "${elemento.textContent.trim()}"`);
                    break;
                }
            }
        }
        
        if (boton) {
            console.log('✅ Haciendo click en "Ingresar"...');
            this.updateIndicator('✅ Confirmando...', 'organization');
            
            boton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            try {
                boton.click();
            } catch (error) {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                boton.dispatchEvent(clickEvent);
            }
            
            console.log('✅ Click realizado');
            this.updateIndicator('✅ Organización seleccionada', 'success');
            this.waitForRedirection(['Portal', 'Home']);
        } else {
            console.error('❌ No se encontró botón "Ingresar"');
            
            const botones = document.querySelectorAll('button, a, [onclick]');
            console.log(`🔍 DEBUG - ${botones.length} botones disponibles:`);
            botones.forEach((btn, i) => {
                if (btn.offsetParent) {
                    console.log(`  ${i + 1}. "${btn.textContent.trim()}" (${btn.tagName})`);
                }
            });
            
            throw new Error('No se encontró botón "Ingresar"');
        }
    }
    
    async finalizarProceso() {
        console.log('🔄 Finalizando proceso...');
        
        if (this.shouldGoToCompraAgil && this.compraAgilId) {
            const targetUrl = `https://compra-agil.mercadopublico.cl/resumen-cotizacion/${this.compraAgilId}`;
            console.log(`🎯 Navegando a: ${targetUrl}`);
            window.location.href = targetUrl;
        } else {
            console.log('✅ Login completado');
            this.updateIndicator('🎉 Login completado!', 'success');
        }
    }
    
    waitForRedirection(patterns) {
        console.log('⏳ Esperando redirección...');
        let checkCount = 0;
        const currentUrl = window.location.href;
        
        const checkUrl = () => {
            checkCount++;
            const newUrl = window.location.href;
            
            if (newUrl !== currentUrl) {
                for (const pattern of patterns) {
                    if (newUrl.includes(pattern)) {
                        console.log(`✅ Redirección a: ${pattern}`);
                        setTimeout(() => this.executeCurrentStep(), 2000);
                        return;
                    }
                }
            }
            
            if (checkCount < 30) {
                setTimeout(checkUrl, 1000);
            }
        };
        
        setTimeout(checkUrl, 2000);
    }
    
    addIndicator() {
        const existing = document.getElementById('mp-automation-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'mp-automation-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 20px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                user-select: none;
            ">
                🤖 AUTOMATIZACIÓN AUTORIZADA
            </div>
        `;
        
        document.body.appendChild(indicator);
    }
    
    updateIndicator(texto, estado = 'default') {
        const indicator = document.getElementById('mp-automation-indicator');
        if (!indicator) return;
        
        const colors = {
            'auth': '#ffc107',
            'login': '#17a2b8',
            'organization': '#6f42c1',
            'success': '#28a745',
            'compra-agil': '#e83e8c',
            'error': '#dc3545',
            'processing': '#ffc107',
            'success': '#28a745',
            'error': '#dc3545',
            'default': '#e83e8c'
        };
        
        //const color = colors[estado] || '#6c757d';
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
            ">
                ${texto}
            </div>
        `;
    }
    
    mostrarExito() {
        console.log('🎉 Proceso completado');
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicialización
let mpAutomationInstance = null;

function initializeCleanAutomation() {
    if (mpAutomationInstance) return;
    mpAutomationInstance = new MPAutomationClean();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCleanAutomation);
} else {
    initializeCleanAutomation();
}

console.log('📜 Content script cargado');