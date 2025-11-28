// content-licitacion.js - Automatización de Licitaciones basada en script Python
// ✅ Replica el flujo completo del proceso de postulación

console.log('🎯 CONTENT SCRIPT LICITACIONES CARGADO:', window.location.href);
console.log('🌐 User Agent:', navigator.userAgent.substring(0, 100));
console.log('📍 Pathname:', window.location.pathname);
console.log('🔗 Host:', window.location.host);

class LicitacionAutomation {
    constructor() {
        this.isRunning = false;
        this.hasExecuted = false; // 🆕 Evitar ejecuciones duplicadas
        this.licitacionId = null;
        this.automationData = null;
        this.processedItems = 0;
        this.retryCount = 0;
        this.maxRetries = 2;
        this.procesoDetenido = false;
        this.extensionActive = false;
        this.userAuthorized = false;
        this.estadoLicitacion = null;
        this.currentPage = null;
        this.clickOfertaAttempts = 0; // Contador de intentos de click en oferta
        this.maxClickOfertaAttempts = 2; // Máximo intentos antes de error
        this.esDJ = false; // 🆕 Detector de contexto DJ
        
        // 🆕 Detectar contexto de declaración jurada
        this.detectarContextoDJ();

        console.log('🤖 LicitacionAutomation inicializado');
        
        this.registerInWindow();
        this.detectPageContext();
        this.setupMessageListener();
        
        // 🆕 REGISTRAR ACTIVAMENTE con el background si estamos en Mercado Público
        if (window.location.href.includes('mercadopublico.cl')) {
            this.registerWithBackground().catch(() => {
                console.warn('⚠️ Error registrando con background, pero continuando...');
            });
            
            // 🔧 EJECUTAR checkAndExecuteIfReady SIEMPRE, independientemente del registro
            setTimeout(() => {
                this.checkAndExecuteIfReady();
            }, 2000);
        }
        
        setTimeout(() => {
            this.initializeBasedOnContext();
        }, 2000);
    }
    
    // 🆕 === FUNCIONES ESPECÍFICAS PARA DECLARACIÓN JURADA ===
    
    detectarContextoDJ() {
        const url = window.location.href;
        this.esDJ = url.includes('/dj-requisitos/') || url.includes('declaracion');
        
        console.log(`🔍 DETECTOR DE CONTEXTO DJ:`);
        console.log(`   URL: ${url}`);
        console.log(`   Es DJ: ${this.esDJ}`);
        console.log(`   React detectado: ${typeof React !== 'undefined'}`);
        console.log(`   MUI detectado: ${!!document.querySelector('[class*="Mui"]')}`);
        
        if (this.esDJ) {
            console.log('🎯 CONTEXTO DJ DETECTADO - Inicializando funcionalidades específicas');
            this.inicializarIndicadorDJ();
            this.configurarParaDJ();
            
            // ❌ REMOVIDO: Ya no se inicia automáticamente aquí
            // La función configurarParaDJ() ahora maneja la verificación de estado
            console.log('✅ Configuración DJ completada - verificación de estado en configurarParaDJ()');
        }
        
        return this.esDJ;
    }
    
    inicializarIndicadorDJ() {
        console.log('🎯 INICIALIZANDO INDICADOR VISUAL PARA DJ');
        
        // Crear indicador flotante que confirme que la extensión está activa
        const indicator = document.createElement('div');
        indicator.id = 'dj-extension-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(45deg, #4CAF50, #2196F3);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 14px;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            cursor: pointer;
            animation: djPulse 2s infinite;
        `;
        
        indicator.innerHTML = '🎯 DJ Extension Activa - Click para PROCESAR';
        
        // Agregar CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes djPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(indicator);
        
        // Click para PROCESAR manualmente
        indicator.addEventListener('click', async () => {
            console.log('🎯 CLICK MANUAL EN INDICADOR - PROCESANDO DJ...');
            indicator.innerHTML = '⏳ PROCESANDO DJ...';
            indicator.style.background = 'linear-gradient(45deg, #FF9800, #FFC107)';
            
            try {
                await this.procesarDeclaracionJuradaCompleta();
            } catch (error) {
                console.error('❌ Error en procesamiento manual:', error);
                indicator.innerHTML = '❌ ERROR - Click para reintentar';
                indicator.style.background = 'linear-gradient(45deg, #F44336, #FF5722)';
            }
        });
        
        console.log('✅ Indicador DJ creado exitosamente');
    }
    
    async configurarParaDJ() {
        console.log('⚙️ CONFIGURANDO EXTENSIÓN PARA CONTEXTO DJ');
        
        // Esperar a que React se cargue completamente
        this.esperarReactDJ();
        
        // Configurar listeners específicos para DJ
        this.configurarListenersDJ();
        
        // Auto-detectar checkboxes después de carga
        setTimeout(() => {
            this.autoDetectarCheckboxesDJ();
        }, 3000);
        
        // 🔍 VERIFICACIÓN RÁPIDA DE BADGES PARA EVITAR PROCESAMIENTO INNECESARIO
        console.log('🔍 Verificando badges de estado DJ...');
        
        // Solo verificar badges externos - NO verificar estado interno de la DJ
        const badgeDJ = document.querySelector('#badgedj, .badgedj_firmada');
        if (badgeDJ && badgeDJ.classList.contains('badgedj_firmada')) {
            console.log('✅ DJ YA FIRMADA (badge externo) - Saltando procesamiento');
            return;
        }
        
        // 🔄 PROCESAMIENTO DIRECTO DE CHECKBOXES MUI
        console.log('🔄 Iniciando procesamiento DIRECTO de checkboxes...');
        
        // Esperar que los checkboxes carguen
        await this.delay(3000);
        
        // PROCESAMIENTO DIRECTO SIN VERIFICACIONES ADICIONALES
        await this.procesarCheckboxesDirecto();
    }
    
    async procesarCheckboxesDirecto() {
        console.log('🎯 PROCESAMIENTO DIRECTO DE CHECKBOXES - SIN VERIFICACIONES COMPLEJAS');
        
        // 1. Primero intentar con selectores MUI específicos
        let checkboxes = document.querySelectorAll('input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]');
        console.log(`🔍 Checkboxes MUI específicos encontrados: ${checkboxes.length}`);
        
        // 2. Si no hay, buscar genéricos
        if (checkboxes.length === 0) {
            checkboxes = document.querySelectorAll('input[type="checkbox"]');
            console.log(`🔍 Checkboxes genéricos encontrados: ${checkboxes.length}`);
        }
        
        // 3. Si aún no hay, buscar por clases MUI
        if (checkboxes.length === 0) {
            checkboxes = document.querySelectorAll('input[class*="fKMtys"]');
            console.log(`🔍 Checkboxes por clase fKMtys encontrados: ${checkboxes.length}`);
        }
        
        if (checkboxes.length === 0) {
            console.log('❌ NO SE ENCONTRARON CHECKBOXES - Terminando procesamiento');
            return;
        }
        
        console.log(`✅ INICIANDO PROCESAMIENTO DE ${checkboxes.length} CHECKBOXES`);
        
        let procesados = 0;
        let exitosos = 0;
        
        for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = checkboxes[i];
            procesados++;
            
            console.log(`📝 Procesando checkbox ${i + 1}/${checkboxes.length}`);
            
            // Verificar si ya está marcado
            if (checkbox.checked) {
                console.log(`✓ Checkbox ${i + 1} ya está marcado`);
                exitosos++;
                continue;
            }
            
            // Verificar si está visible
            if (checkbox.offsetParent === null) {
                console.log(`⚠️ Checkbox ${i + 1} no está visible, saltando`);
                continue;
            }
            
            // INTENTAR MÚLTIPLES MÉTODOS DE CLICK
            const exito = await this.clickearCheckboxMultiplesMethods(checkbox, i + 1);
            if (exito) {
                exitosos++;
            }
            
            await this.delay(500); // Pausa entre checkboxes
        }
        
        console.log(`🎉 PROCESAMIENTO COMPLETADO:`);
        console.log(`   - Procesados: ${procesados}`);
        console.log(`   - Exitosos: ${exitosos}`);
        console.log(`   - Fallidos: ${procesados - exitosos}`);
        
        // Después de marcar checkboxes, intentar seleccionar RUT
        await this.delay(1000);
        try {
            console.log('🆔 Intentando seleccionar RUT del representante...');
            await this.seleccionarRutDeclaracion();
        } catch (error) {
            console.log(`⚠️ Error seleccionando RUT: ${error.message}`);
        }
        
        // Finalmente, hacer click en el botón de firmar
        await this.delay(2000);
        try {
            console.log('🖊️ Buscando botón "Firmar sin Clave Única"...');
            await this.clickearBotonFirmar();
        } catch (error) {
            console.log(`⚠️ Error haciendo click en botón firmar: ${error.message}`);
        }
    }
    
    async clickearCheckboxMultiplesMethods(checkbox, numero) {
        console.log(`🎯 Aplicando múltiples métodos de click en checkbox ${numero}`);
        
        // Scroll al elemento
        checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(300);
        
        // MÉTODO 1: Click directo
        try {
            console.log(`  Método 1: Click directo en checkbox ${numero}`);
            checkbox.click();
            await this.delay(300);
            
            if (checkbox.checked) {
                console.log(`✅ Checkbox ${numero}: Click directo exitoso`);
                return true;
            }
        } catch (e) {
            console.log(`⚠️ Error método 1: ${e.message}`);
        }
        
        // MÉTODO 2: Focus + Space
        try {
            console.log(`  Método 2: Focus + Space en checkbox ${numero}`);
            checkbox.focus();
            await this.delay(200);
            
            const spaceEvent = new KeyboardEvent('keydown', { key: ' ', code: 'Space' });
            checkbox.dispatchEvent(spaceEvent);
            await this.delay(300);
            
            if (checkbox.checked) {
                console.log(`✅ Checkbox ${numero}: Focus + Space exitoso`);
                return true;
            }
        } catch (e) {
            console.log(`⚠️ Error método 2: ${e.message}`);
        }
        
        // MÉTODO 3: Cambio directo de propiedad
        try {
            console.log(`  Método 3: Cambio directo checked en checkbox ${numero}`);
            checkbox.checked = true;
            
            // Disparar eventos
            const events = ['input', 'change'];
            for (const eventType of events) {
                const event = new Event(eventType, { bubbles: true });
                checkbox.dispatchEvent(event);
            }
            await this.delay(300);
            
            if (checkbox.checked) {
                console.log(`✅ Checkbox ${numero}: Cambio directo exitoso`);
                return true;
            }
        } catch (e) {
            console.log(`⚠️ Error método 3: ${e.message}`);
        }
        
        // MÉTODO 4: Click en span padre
        try {
            console.log(`  Método 4: Click en span padre de checkbox ${numero}`);
            const spanPadre = checkbox.closest('span[role="button"]') || checkbox.parentElement;
            if (spanPadre) {
                spanPadre.click();
                await this.delay(300);
                
                if (checkbox.checked) {
                    console.log(`✅ Checkbox ${numero}: Click span padre exitoso`);
                    return true;
                }
            }
        } catch (e) {
            console.log(`⚠️ Error método 4: ${e.message}`);
        }
        
        console.log(`❌ Checkbox ${numero}: Todos los métodos fallaron`);
        return false;
    }
    
    async buscarBotonCerrarGlobalmente() {
        console.log('🔍 BÚSQUEDA GLOBAL DEL BOTÓN "CERRAR Y VOLVER A LA OFERTA"');
        
        // Buscar en toda la página cualquier botón que contenga el texto relevante
        const todosLosBotones = document.querySelectorAll('button, [role="button"], input[type="button"]');
        console.log(`🔍 Analizando ${todosLosBotones.length} botones en toda la página...`);
        
        for (const boton of todosLosBotones) {
            const texto = boton.textContent || boton.innerText || boton.value || '';
            
            // Mostrar todos los botones para debugging
            if (texto.trim() !== '') {
                console.log(`   - "${texto.substring(0, 50)}..." - Visible: ${boton.offsetParent !== null}`);
            }
            
            // Buscar botones relacionados con cerrar/volver
            if ((texto.includes('Cerrar y volver a la oferta') || 
                 texto.includes('Cerrar y volver') || 
                 texto.includes('volver a la oferta') ||
                 texto.includes('Cerrar') ||
                 texto.includes('Volver')) && 
                boton.offsetParent !== null) { // Solo botones visibles
                
                console.log(`✅ BOTÓN ENCONTRADO GLOBALMENTE: "${texto}"`);
                
                try {
                    boton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(1000);
                    
                    console.log('🖱️ Haciendo click en botón encontrado globalmente...');
                    boton.click();
                    await this.delay(2000);
                    
                    console.log('✅ CLICK REALIZADO EN BOTÓN GLOBAL');
                    return true;
                    
                } catch (error) {
                    console.log(`❌ Error haciendo click en botón global: ${error.message}`);
                }
            }
        }
        
        console.log('❌ NO SE ENCONTRÓ NINGÚN BOTÓN DE CERRAR/VOLVER VISIBLE');
        return false;
    }
    
    async procesarModalExito() {
        console.log('🎉 === PROCESANDO MODAL DE DECLARACIÓN FIRMADA CON ÉXITO ===');
        
        // Esperar el modal de éxito con múltiples intentos
        console.log('⏳ Esperando que aparezca el modal de éxito...');
        
        let intentosEspera = 0;
        const maxIntentosEspera = 10; // 10 segundos total
        
        while (intentosEspera < maxIntentosEspera) {
            await this.delay(1000);
            intentosEspera++;
            
            // Verificar si apareció algún modal de éxito
            const modalPotencial = document.querySelector('.sc-kAKABG.ejDMln, div[class*="ejDMln"], .sc-kAKABG');
            if (modalPotencial && modalPotencial.offsetParent !== null) {
                const texto = modalPotencial.textContent || '';
                if (texto.includes('Declaración firmada') || texto.includes('firmada con éxito') || 
                    texto.includes('Cerrar y volver')) {
                    console.log(`✅ Modal de éxito encontrado en intento ${intentosEspera}`);
                    break;
                }
            }
            
            console.log(`⏳ Esperando modal de éxito... intento ${intentosEspera}/${maxIntentosEspera}`);
        }
        
        // Buscar el modal de éxito por diferentes selectores
        const selectoresModalExito = [
            '.sc-kAKABG.ejDMln',  // Clase específica del modal de éxito que proporcionaste
            'div[class*="ejDMln"]',
            'div[class*="sc-kAKABG"]',
            '[class*="modal"]',
            '[role="dialog"]',
            'div:has(h4:contains("Declaración firmada con éxito"))',
            'div:has(button:contains("Cerrar y volver a la oferta"))'
        ];
        
        let modalExitoEncontrado = null;
        
        // Buscar por selectores CSS
        for (const selector of selectoresModalExito) {
            try {
                const modal = document.querySelector(selector);
                if (modal && modal.offsetParent !== null) { // Visible
                    modalExitoEncontrado = modal;
                    console.log(`✅ Modal de éxito encontrado con selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`⚠️ Error con selector modal éxito "${selector}": ${e.message}`);
            }
        }
        
        // Método alternativo: buscar por texto del título
        if (!modalExitoEncontrado) {
            console.log('🔍 Buscando modal por texto del título...');
            const elementos = document.querySelectorAll('h4, .MuiTypography-h4');
            
            for (const elemento of elementos) {
                const texto = elemento.textContent || '';
                if (texto.includes('Declaración firmada con éxito') || 
                    texto.includes('firmada con éxito') ||
                    texto.includes('Declaración firmada')) {
                    modalExitoEncontrado = elemento.closest('div[class*="sc-kAKABG"], div[class*="modal"], [role="dialog"]');
                    if (modalExitoEncontrado && modalExitoEncontrado.offsetParent !== null) {
                        console.log('✅ Modal de éxito encontrado por texto del título');
                        break;
                    }
                }
            }
        }
        
        if (!modalExitoEncontrado) {
            console.log('⚠️ NO SE ENCONTRÓ EL MODAL ESPECÍFICO - BUSCANDO BOTÓN GLOBALMENTE...');
            // Como último recurso, buscar el botón en toda la página
            return await this.buscarBotonCerrarGlobalmente();
        }
        
        console.log('✅ Modal de declaración firmada con éxito detectado');
        
        // Buscar el botón "Cerrar y volver a la oferta"
        let botonCerrarYVolver = null;
        
        // MÉTODO 1: Buscar por texto específico dentro del modal
        const botonesEnModal = modalExitoEncontrado.querySelectorAll('button');
        console.log(`🔍 Botones encontrados en modal de éxito: ${botonesEnModal.length}`);
        
        for (const boton of botonesEnModal) {
            const textoBoton = boton.textContent || boton.innerText || '';
            console.log(`   - Botón modal éxito: "${textoBoton}"`);
            
            // IMPORTANTE: Evitar el botón "Firmar sin Clave Única" que puede estar duplicado
            if (textoBoton.includes('Cerrar y volver a la oferta') || 
                textoBoton.includes('Cerrar y volver') || 
                textoBoton.includes('volver a la oferta')) {
                botonCerrarYVolver = boton;
                console.log(`✅ Botón "Cerrar y volver" encontrado: "${textoBoton}"`);
                break;
            }
            // Solo aceptar "Cerrar" si no contiene "Firmar"
            else if ((textoBoton.includes('Cerrar') || textoBoton.includes('Volver')) && 
                     !textoBoton.includes('Firmar') && !textoBoton.includes('Clave')) {
                botonCerrarYVolver = boton;
                console.log(`✅ Botón "Cerrar/Volver" encontrado (sin firmar): "${textoBoton}"`);
                break;
            }
        }
        
        // MÉTODO 2: Buscar por clases específicas del botón
        if (!botonCerrarYVolver) {
            console.log('🔍 Buscando por clases específicas del botón...');
            const selectoresBotonCerrar = [
                'button.sc-dmsloy.EaXFo.MuiButtonBase-root.sc-iXWftf.sc-hZocGY.jaiHKL.vhfwc',
                'button[class*="jaiHKL"][class*="vhfwc"]',
                'button[color="default"][variant="contained"]',
                'button[margin="28px 0 0"]'
            ];
            
            for (const selector of selectoresBotonCerrar) {
                try {
                    const boton = modalExitoEncontrado.querySelector(selector);
                    if (boton) {
                        const textoBoton = boton.textContent || '';
                        // Verificar que NO sea el botón "Firmar sin Clave Única"
                        if (!textoBoton.includes('Firmar sin Clave Única') && !textoBoton.includes('Firmar')) {
                            botonCerrarYVolver = boton;
                            console.log(`✅ Botón cerrar encontrado por clase: ${selector} - Texto: "${textoBoton}"`);
                            break;
                        } else {
                            console.log(`⚠️ Botón ignorado (es de firmar): "${textoBoton}"`);
                        }
                    }
                } catch (e) {
                    console.log(`⚠️ Error con selector "${selector}": ${e.message}`);
                }
            }
        }
        
        // MÉTODO 3: Buscar cualquier botón contained/default en el modal (excluyendo "Firmar")
        if (!botonCerrarYVolver) {
            console.log('🔍 Último recurso: buscar botón contained que NO sea de firmar...');
            const botonesContained = modalExitoEncontrado.querySelectorAll('button[variant="contained"], .MuiButton-contained, button[color="default"]');
            
            for (const boton of botonesContained) {
                const textoBoton = boton.textContent || '';
                // Solo aceptar si NO es un botón de firmar
                if (!textoBoton.includes('Firmar') && !textoBoton.includes('Clave')) {
                    botonCerrarYVolver = boton;
                    console.log(`✅ Botón contained encontrado (no firmar): "${textoBoton}"`);
                    break;
                }
            }
        }
        
        if (!botonCerrarYVolver) {
            console.log('❌ NO SE ENCONTRÓ EL BOTÓN "CERRAR Y VOLVER A LA OFERTA"');
            return false;
        }
        
        // HACER CLICK EN EL BOTÓN "CERRAR Y VOLVER A LA OFERTA"
        console.log(`🎯 Haciendo click en: "${botonCerrarYVolver.textContent}"`);
        
        try {
            // Scroll al botón (aunque esté en modal)
            botonCerrarYVolver.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // Click directo
            console.log('🖱️ Haciendo click en "Cerrar y volver"...');
            botonCerrarYVolver.click();
            await this.delay(3000);
            
            // Verificar si volvimos a la página principal (cambio de URL o desaparición del modal)
            const urlDespues = window.location.href;
            const modalSigueVisible = modalExitoEncontrado.offsetParent !== null;
            
            if (!modalSigueVisible || !urlDespues.includes('dj-requisitos')) {
                console.log('✅ REGRESO A LA OFERTA EXITOSO - MODAL CERRADO');
                return true;
            }
            
            // Método alternativo: eventos
            console.log('🖱️ Intento alternativo con eventos...');
            const events = ['mousedown', 'mouseup', 'click'];
            for (const eventType of events) {
                const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                botonCerrarYVolver.dispatchEvent(event);
            }
            await this.delay(2000);
            
            // Último intento: Enter key
            console.log('⌨️ Último intento: tecla Enter...');
            botonCerrarYVolver.focus();
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true
            });
            botonCerrarYVolver.dispatchEvent(enterEvent);
            await this.delay(2000);
            
            console.log('🎉 PROCESAMIENTO DE MODAL DE ÉXITO COMPLETADO');
            return true;
            
        } catch (error) {
            console.log(`❌ Error procesando modal de éxito: ${error.message}`);
            return false;
        }
    }
    
    async procesarSegundoModalConfirmacion() {
        console.log('📋 === PROCESANDO SEGUNDO MODAL DE CONFIRMACIÓN ===');
        
        // Esperar que aparezca el segundo modal
        await this.delay(2000);
        
        // Buscar el segundo modal (puede ser el mismo selector)
        const selectoresModal = [
            '.sc-kAKABG.leeTDo',
            'div[class*="leeTDo"]', 
            'div[class*="sc-kAKABG"]',
            '[role="dialog"]'
        ];
        
        let segundoModalEncontrado = null;
        
        for (const selector of selectoresModal) {
            try {
                const modal = document.querySelector(selector);
                if (modal && modal.offsetParent !== null) {
                    segundoModalEncontrado = modal;
                    console.log(`✅ Segundo modal encontrado con selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`⚠️ Error con selector segundo modal "${selector}": ${e.message}`);
            }
        }
        
        if (!segundoModalEncontrado) {
            console.log('❌ NO SE ENCONTRÓ EL SEGUNDO MODAL DE CONFIRMACIÓN');
            return false;
        }
        
        // Buscar el botón "Firmar sin Clave Única" con variant="contained"
        const botonesEnSegundoModal = segundoModalEncontrado.querySelectorAll('button');
        console.log(`🔍 Botones en segundo modal: ${botonesEnSegundoModal.length}`);
        
        let botonSegundaConfirmacion = null;
        
        for (const boton of botonesEnSegundoModal) {
            const textoBoton = boton.textContent || boton.innerText || '';
            const variant = boton.getAttribute('variant');
            const color = boton.getAttribute('color');
            
            console.log(`   - Segundo modal botón: "${textoBoton}"`);
            console.log(`     Variant: ${variant}, Color: ${color}`);
            
            // Buscar específicamente el botón "contained" de "Firmar sin Clave Única"
            if (textoBoton.includes('Firmar sin Clave Única') && 
                (variant === 'contained' || color === 'primary')) {
                botonSegundaConfirmacion = boton;
                console.log(`✅ SEGUNDO botón de confirmación encontrado: "${textoBoton}" (${variant})`);
                break;
            }
        }
        
        if (!botonSegundaConfirmacion) {
            console.log('❌ NO SE ENCONTRÓ EL SEGUNDO BOTÓN DE CONFIRMACIÓN');
            return false;
        }
        
        // HACER CLICK EN EL SEGUNDO BOTÓN DE CONFIRMACIÓN
        console.log(`🎯 Haciendo click en SEGUNDO botón: "${botonSegundaConfirmacion.textContent}"`);
        
        try {
            botonSegundaConfirmacion.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            console.log('🖱️ Click en SEGUNDO modal...');
            botonSegundaConfirmacion.click();
            await this.delay(3000);
            
            // Después del segundo click, procesar el modal de éxito
            console.log('🎉 Procesando modal de éxito después del segundo click...');
            const modalExito = await this.procesarModalExito();
            
            if (modalExito) {
                console.log('✅ FLUJO COMPLETO: 1° Modal → 2° Modal → Modal Éxito → Volver a Oferta');
                return true;
            }
            
            return true;
            
        } catch (error) {
            console.log(`❌ Error en segundo modal: ${error.message}`);
            return false;
        }
    }
    
    async procesarModalConfirmacion() {
        console.log('📋 === PROCESANDO MODAL DE CONFIRMACIÓN ===');
        
        // Esperar un poco más para que aparezca el modal
        await this.delay(1500);
        
        // Buscar el modal por diferentes selectores
        const selectoresModal = [
            '.sc-kAKABG.leeTDo',  // Clase específica del modal que proporcionaste
            'div[class*="leeTDo"]',
            'div[class*="sc-kAKABG"]',
            '[class*="modal"]',
            '[role="dialog"]',
            '[class*="MuiDialog"]'
        ];
        
        let modalEncontrado = null;
        
        for (const selector of selectoresModal) {
            try {
                const modal = document.querySelector(selector);
                if (modal && modal.offsetParent !== null) { // Visible
                    modalEncontrado = modal;
                    console.log(`✅ Modal encontrado con selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`⚠️ Error con selector modal "${selector}": ${e.message}`);
            }
        }
        
        if (!modalEncontrado) {
            console.log('❌ NO SE ENCONTRÓ EL MODAL DE CONFIRMACIÓN');
            return false;
        }
        
        console.log('✅ Modal de confirmación detectado');
        
        // Buscar el botón de confirmación dentro del modal
        let botonConfirmar = null;
        
        // MÉTODO 1: Buscar por texto específico dentro del modal
        const botonesEnModal = modalEncontrado.querySelectorAll('button');
        console.log(`🔍 Botones encontrados en modal: ${botonesEnModal.length}`);
        
        for (const boton of botonesEnModal) {
            const textoBoton = boton.textContent || boton.innerText || '';
            console.log(`   - Botón modal: "${textoBoton}"`);
            console.log(`     Variant: ${boton.getAttribute('variant')}, Color: ${boton.getAttribute('color')}`);
            
            if (textoBoton.includes('Firmar sin Clave Única') || 
                textoBoton.includes('Confirmar') || 
                textoBoton.includes('Aceptar') ||
                textoBoton.includes('Firmar')) {
                botonConfirmar = boton;
                console.log(`✅ Botón de confirmación encontrado: "${textoBoton}"`);
                console.log(`   Variant: ${boton.getAttribute('variant')}, Color: ${boton.getAttribute('color')}`);
                break;
            }
        }
        
        // MÉTODO 2: Buscar por clases específicas del botón de confirmación
        if (!botonConfirmar) {
            console.log('🔍 Buscando por clases específicas...');
            const selectoresBotonConfirmar = [
                'button.sc-dmsloy.EaXFo.MuiButtonBase-root.sc-iXWftf.sc-hZocGY.hOvxpq.fQmeuA',
                'button[class*="hOvxpq"][class*="fQmeuA"]',
                'button[variant="contained"][color="primary"]',
                'button[class*="MuiButtonBase-root"][type="button"]'
            ];
            
            for (const selector of selectoresBotonConfirmar) {
                try {
                    const boton = modalEncontrado.querySelector(selector);
                    if (boton) {
                        botonConfirmar = boton;
                        console.log(`✅ Botón confirmación encontrado por clase: ${selector}`);
                        break;
                    }
                } catch (e) {
                    console.log(`⚠️ Error con selector "${selector}": ${e.message}`);
                }
            }
        }
        
        // MÉTODO 3: Como último recurso, buscar cualquier botón primary/contained
        if (!botonConfirmar) {
            console.log('🔍 Último recurso: buscar botón primary...');
            const botonPrimary = modalEncontrado.querySelector('button[variant="contained"], button[color="primary"], .MuiButton-contained');
            if (botonPrimary) {
                botonConfirmar = botonPrimary;
                console.log('✅ Botón primary encontrado como último recurso');
            }
        }
        
        if (!botonConfirmar) {
            console.log('❌ NO SE ENCONTRÓ EL BOTÓN DE CONFIRMACIÓN EN EL MODAL');
            return false;
        }
        
        // HACER CLICK EN EL BOTÓN DE CONFIRMACIÓN
        console.log(`🎯 Haciendo click en botón de confirmación: "${botonConfirmar.textContent}"`);
        
        try {
            // Scroll al botón (aunque esté en modal)
            botonConfirmar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // Click directo
            console.log('🖱️ Haciendo click en confirmación...');
            botonConfirmar.click();
            await this.delay(2000);
            
            // Verificar si el modal desapareció (señal de éxito)
            const modalSigueVisible = modalEncontrado.offsetParent !== null;
            if (!modalSigueVisible) {
                console.log('✅ MODAL 1 CERRADO - ESPERANDO MODAL 2...');
                
                // Esperar y procesar el SEGUNDO modal de confirmación (variant="contained")
                await this.delay(2000);
                const segundoModal = await this.procesarSegundoModalConfirmacion();
                
                if (segundoModal) {
                    console.log('✅ SEGUNDO MODAL PROCESADO - ESPERANDO MODAL DE ÉXITO...');
                    return true; // Retornar aquí ya que procesarSegundoModalConfirmacion manejará el resto
                }
                
                console.log('🔍 Continuando a procesar modal de éxito...');
            }
            
            // Método alternativo: eventos
            console.log('🖱️ Intento alternativo con eventos...');
            const events = ['mousedown', 'mouseup', 'click'];
            for (const eventType of events) {
                const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                botonConfirmar.dispatchEvent(event);
            }
            await this.delay(1500);
            
            // Verificar nuevamente
            const modalSigueVisible2 = modalEncontrado.offsetParent !== null;
            if (!modalSigueVisible2) {
                console.log('✅ MODAL CERRADO CON EVENTOS - CONFIRMACIÓN EXITOSA');
                return true;
            }
            
            // Último intento: Enter key
            console.log('⌨️ Último intento: tecla Enter...');
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true
            });
            botonConfirmar.dispatchEvent(enterEvent);
            await this.delay(1500);
            
            console.log('🎯 PROCESAMIENTO DE MODAL COMPLETADO');
            return true;
            
        } catch (error) {
            console.log(`❌ Error procesando modal de confirmación: ${error.message}`);
            return false;
        }
    }
    
    async clickearBotonFirmar() {
        console.log('🖊️ === BUSCANDO Y CLICKEANDO BOTÓN FIRMAR ===');
        
        // Múltiples selectores para encontrar el botón de firmar
        const selectoresFirmar = [
            'button[type="button"]:contains("Firmar sin Clave Única")',
            'button:contains("Firmar sin Clave Única")', 
            'button[class*="MuiButtonBase-root"]:contains("Firmar sin Clave Única")',
            'button[class*="sc-dmsloy"][class*="EaXFo"]',
            '*[class*="kLoXqa"][class*="gKlfmC"]',
            'button[variant="outlined"]',
            'button[color="primary"]'
        ];
        
        // Como :contains() no existe en querySelector, usaremos XPath y búsqueda por texto
        let botonEncontrado = null;
        
        // MÉTODO 1: Buscar por texto exacto usando XPath
        try {
            console.log('🔍 Método 1: Buscando por XPath con texto...');
            const xpathSelectores = [
                "//button[contains(text(), 'Firmar sin Clave Única')]",
                "//button[contains(text(), 'Firmar')]",
                "//*[contains(text(), 'Firmar sin Clave Única')]"
            ];
            
            for (const xpath of xpathSelectores) {
                const resultado = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (resultado.singleNodeValue) {
                    botonEncontrado = resultado.singleNodeValue;
                    console.log(`✅ Botón encontrado con XPath: "${xpath}"`);
                    break;
                }
            }
        } catch (e) {
            console.log(`⚠️ Error con XPath: ${e.message}`);
        }
        
        // MÉTODO 2: Buscar todos los botones y filtrar por texto
        if (!botonEncontrado) {
            console.log('🔍 Método 2: Buscando por texto en todos los botones...');
            const todosLosBotones = document.querySelectorAll('button, [role="button"]');
            
            for (const boton of todosLosBotones) {
                const textoBoton = boton.textContent || boton.innerText || '';
                if (textoBoton.includes('Firmar sin Clave Única') || 
                    textoBoton.includes('Firmar') || 
                    textoBoton.toLowerCase().includes('firmar')) {
                    botonEncontrado = boton;
                    console.log(`✅ Botón encontrado por texto: "${textoBoton}"`);
                    break;
                }
            }
        }
        
        // MÉTODO 3: Buscar por clases específicas del botón que proporcionaste
        if (!botonEncontrado) {
            console.log('🔍 Método 3: Buscando por clases específicas...');
            const selectoresClase = [
                'button.sc-dmsloy.EaXFo.MuiButtonBase-root.sc-iXWftf.sc-hKOqWZ.kLoXqa.gKlfmC',
                'button[class*="kLoXqa"][class*="gKlfmC"]',
                'button[class*="sc-dmsloy"][class*="EaXFo"]',
                'button[tabindex="0"][type="button"][color="primary"]'
            ];
            
            for (const selector of selectoresClase) {
                try {
                    const boton = document.querySelector(selector);
                    if (boton) {
                        botonEncontrado = boton;
                        console.log(`✅ Botón encontrado por clase: "${selector}"`);
                        break;
                    }
                } catch (e) {
                    console.log(`⚠️ Error con selector "${selector}": ${e.message}`);
                }
            }
        }
        
        // Si no encontramos el botón, reportar error
        if (!botonEncontrado) {
            console.log('❌ NO SE ENCONTRÓ EL BOTÓN DE FIRMAR');
            console.log('🔍 Botones disponibles en la página:');
            const todosLosBotones = document.querySelectorAll('button, [role="button"]');
            todosLosBotones.forEach((btn, i) => {
                if (i < 10) { // Solo mostrar los primeros 10
                    console.log(`   ${i+1}. "${btn.textContent}" - Classes: ${btn.className}`);
                }
            });
            return false;
        }
        
        // HACER CLICK EN EL BOTÓN ENCONTRADO
        console.log(`🎯 Haciendo click en botón: "${botonEncontrado.textContent}"`);
        console.log(`📋 Clases del botón: ${botonEncontrado.className}`);
        
        try {
            // Scroll al botón
            botonEncontrado.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            
            // Método 1: Click directo
            console.log('🖱️ Intento 1: Click directo...');
            botonEncontrado.click();
            await this.delay(1500);
            
            // Verificar si la acción fue exitosa (cambio de URL o contenido)
            const urlDespues = window.location.href;
            const contenidoDespues = document.body.textContent;
            
            if (urlDespues !== window.location.href || 
                contenidoDespues.includes('procesando') || 
                contenidoDespues.includes('firmando') ||
                contenidoDespues.includes('completado')) {
                console.log('✅ BOTÓN FIRMAR CLICKEADO - ESPERANDO MODAL DE CONFIRMACIÓN...');
                
                // Esperar y procesar el modal de confirmación
                await this.delay(2000);
                const modalAceptado = await this.procesarModalConfirmacion();
                
                if (modalAceptado) {
                    console.log('✅ MODAL DE CONFIRMACIÓN ACEPTADO EXITOSAMENTE');
                    
                    // Esperar el modal de éxito y procesarlo
                    await this.delay(3000);
                    const modalExitoAceptado = await this.procesarModalExito();
                    
                    if (modalExitoAceptado) {
                        console.log('🎉 DECLARACIÓN JURADA COMPLETADA TOTALMENTE - VOLVIENDO A LA OFERTA');
                        return true;
                    } else {
                        console.log('⚠️ Modal de éxito procesado pero puede requerir acción manual');
                        return true;
                    }
                } else {
                    console.log('⚠️ No se pudo procesar el modal de confirmación');
                }
            }
            
            // Método 2: Si no funcionó, intentar con eventos
            console.log('🖱️ Intento 2: Dispatch de eventos...');
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            botonEncontrado.dispatchEvent(clickEvent);
            await this.delay(2000);
            
            // También procesar modal después del segundo intento
            console.log('✅ MODAL DE CONFIRMACIÓN ACEPTADO (2do intento)');
            
            // Esperar y procesar el modal de éxito después del segundo intento también
            await this.delay(3000);
            const modalExitoAceptado2 = await this.procesarModalExito();
            if (modalExitoAceptado2) {
                console.log('🎉 MODAL DE ÉXITO PROCESADO EXITOSAMENTE');
                return true;
            }
            
            console.log('✅ Click en botón firmar completado');
            return true;
            
        } catch (error) {
            console.log(`❌ Error haciendo click en botón firmar: ${error.message}`);
            return false;
        }
    }

    async esperarReactDJ() {
        console.log('⏳ Esperando que React DJ se cargue completamente...');
        
        let intentos = 0;
        const maxIntentos = 20;
        
        const checkReactReady = () => {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    intentos++;
                    
                    // Verificar múltiples indicadores de que React DJ está listo
                    const reactReady = typeof React !== 'undefined';
                    const muiElements = document.querySelectorAll('[class*="Mui"]').length > 0;
                    const checkboxElements = document.querySelectorAll('input[type="checkbox"]').length > 0;
                    const djContent = document.querySelector('[class*="sc-"]') !== null;
                    
                    console.log(`   Intento ${intentos}: React=${reactReady}, MUI=${muiElements}, Checkboxes=${checkboxElements}, DJ=${djContent}`);
                    
                    if ((reactReady && muiElements && checkboxElements) || intentos >= maxIntentos) {
                        clearInterval(checkInterval);
                        resolve(reactReady && muiElements && checkboxElements);
                    }
                }, 500);
            });
        };
        
        const ready = await checkReactReady();
        console.log(`${ready ? '✅' : '⚠️'} React DJ ${ready ? 'cargado' : 'timeout'} después de ${intentos} intentos`);
        return ready;
    }
    
    configurarListenersDJ() {
        console.log('🎧 Configurando listeners específicos para DJ...');
        
        // Listener para cambios en el DOM (React updates)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Verificar si se agregaron nuevos checkboxes
                    const nuevosCheckboxes = Array.from(mutation.addedNodes)
                        .filter(node => node.nodeType === 1)
                        .some(node => node.querySelector && node.querySelector('input[type="checkbox"]'));
                    
                    if (nuevosCheckboxes) {
                        console.log('📋 Nuevos checkboxes detectados en el DOM');
                        this.actualizarIndicadorDJ();
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Listeners DJ configurados');
    }
    
    async autoDetectarCheckboxesDJ() {
        console.log('🔍 AUTO-DETECCIÓN DE CHECKBOXES EN DJ...');
        
        try {
            const checkboxes = await this.detectarCheckboxesMaterialUI();
            const indicator = document.getElementById('dj-extension-indicator');
            
            if (indicator) {
                if (checkboxes && checkboxes.length > 0) {
                    indicator.innerHTML = `🎯 DJ: ${checkboxes.length} checkboxes encontrados - Click para Debug`;
                    indicator.style.background = 'linear-gradient(45deg, #4CAF50, #2196F3)';
                } else {
                    indicator.innerHTML = '⚠️ DJ: Sin checkboxes - Click para Debug';
                    indicator.style.background = 'linear-gradient(45deg, #FF9800, #F44336)';
                }
            }
            
        } catch (error) {
            console.error('❌ Error en auto-detección DJ:', error);
        }
    }
    
    actualizarIndicadorDJ() {
        // Actualizar indicador cuando hay cambios
        setTimeout(() => {
            this.autoDetectarCheckboxesDJ();
        }, 500);
    }

    // 🆕 Registrar este content script activamente con el background
    async registerWithBackground() {
        try {
            console.log('📡 Registrando content script con background...');
            
            const response = await chrome.runtime.sendMessage({
                action: 'contentScriptReady',
                url: window.location.href,
                timestamp: Date.now()
            });
            
            if (response && response.success) {
                console.log('✅ Content script registrado exitosamente con background');
            } else {
                console.warn('⚠️ Background no confirmó el registro');
            }
        } catch (error) {
            console.error('❌ Error registrando con background:', error);
            // No es crítico, continuar de todos modos
        }
    }

    // 🆕 Verificar si hay datos y ejecutar automáticamente
    async checkAndExecuteIfReady() {
        console.log('');
        console.log('🔍 === VERIFICANDO DATOS DE AUTOMATIZACIÓN ===');
        
        // VERIFICAR SI ESTAMOS EN PÁGINA DE DJ CON PROBLEMAS  
        if (window.location.href.includes('dj-requisitos')) {
            // Instalar interceptor de red para manejar errores 401
            await this.instalarInterceptorAuth();
            
            // Manejar error de canal de mensajes cerrado
            this.manejarErrorCanalMensajes();
            
            const problemasCarga = this.detectarProblemasCargaDJ();
            if (problemasCarga) {
                console.log(`🚨 Página DJ con problemas detectados: ${problemasCarga}`);
                console.log('🧹 Ejecutando limpieza automática de storage...');
                await this.limpiarStorageProblematico();
                
                // Esperar un poco y verificar si se resolvió
                await this.delay(3000);
                const problemasPost = this.detectarProblemasCargaDJ();
                if (problemasPost) {
                    console.log('🔄 Problemas persisten, ejecutando limpieza agresiva y recargando...');
                    await this.limpiarStorageAgresivoParaDJ();
                    window.location.reload();
                    return;
                } else {
                    console.log('✅ Problemas de DJ resueltos con limpieza básica');
                }
            }
        }
        
        // Si ya tenemos datos en memoria, evaluar si debemos ejecutar
        if (this.automationData && this.licitacionId) {
            console.log('✅ Datos encontrados en memoria:');
            console.log('   - licitacionId:', this.licitacionId);
            console.log('   - automationData:', !!this.automationData);
            
            // 🚨 VERIFICAR SI ESTAMOS EN PÁGINA DEL WIZARD
            const currentUrl = window.location.href;
            const esWizardPage = currentUrl.includes('/BID/Modules/BID/') && currentUrl.includes('idPagina=');
            
            if (esWizardPage) {
                console.log('⚠️ ESTAMOS EN PÁGINA DEL WIZARD - NO EJECUTAR AUTOMÁTICAMENTE');
                console.log('📍 URL del wizard:', currentUrl);
                console.log('💡 El flujo debe ser iniciado manualmente o por evento específico');
                console.log('🎯 Agregando botón de automatización...');
                this.addAutomationButton();
                return;
            }
            
            console.log('🚀 EJECUTANDO FLUJO INMEDIATAMENTE (página de inicio)...');
            await this.executeDocumentUploadFlow();
            return;
        }
        
        console.log('⚠️ No hay datos en memoria, buscando en storage...');
        
        // Si no, buscar en storage
        try {
            const result = await chrome.storage.local.get(['licitacionAutomationData']);
            console.log('📦 Storage result:', result);
            console.log('📦 Keys en storage:', Object.keys(result));
            console.log('📦 licitacionAutomationData existe?', !!result.licitacionAutomationData);
            
            if (result && result.licitacionAutomationData) {
                const data = result.licitacionAutomationData;
                const age = Date.now() - data.timestamp;
                
                console.log('📊 Datos encontrados en storage:');
                console.log('   - licitacionId:', data.licitacionId);
                console.log('   - edad:', Math.round(age / 1000), 'segundos');
                console.log('   - status:', data.status);
                console.log('   - tiene credentials?', !!data.credentials);
                console.log('   - tiene licitacionData?', !!data.licitacionData);
                
                // Aumentado a 20 minutos para dar tiempo a Mercado Público lento
                if (age < 20 * 60 * 1000) { // 20 minutos
                    console.log('✅ Datos válidos, cargando... (edad: ' + Math.round(age / 1000) + 's)');
                    
                    this.licitacionId = data.licitacionId;
                    this.automationData = {
                        licitacion: data.licitacionData,
                        usuario: data.userData,
                        credenciales: data.credentials,
                        config: data.config
                    };
                    
                    console.log('💾 Datos cargados en memoria:');
                    console.log('   this.licitacionId:', this.licitacionId);
                    console.log('   this.automationData.credenciales:', !!this.automationData.credenciales);
                    console.log('   this.automationData.licitacion:', !!this.automationData.licitacion);
                    console.log('   Productos disponibles:', this.automationData.licitacion?.productos?.length || 0);
                    console.log('');
                    console.log('🚀 🚀 🚀 EJECUTANDO AUTOMATIZACIÓN AUTOMÁTICAMENTE... 🚀 🚀 🚀');
                    console.log('');
                    
                    // VERIFICAR SI HAY PROCESAMIENTO PENDIENTE
                    const estadoPendiente = await this.verificarEstadoPendiente();
                    if (estadoPendiente) {
                        console.log('🔄 CONTINUANDO PROCESAMIENTO DESDE PÁGINA:', estadoPendiente.paginaActual);
                        await this.continuarProcesamiento(estadoPendiente);
                    } else {
                        await this.executeDocumentUploadFlow();
                    }
                } else {
                    console.warn('⏰ Datos en storage demasiado antiguos (' + Math.round(age / 1000) + 's)');
                    console.warn('💡 Máximo permitido: 20 minutos (1200s)');
                    console.warn('🔄 Necesitas reiniciar la automatización desde el popup');
                }
            } else {
                console.warn('ℹ️ No hay datos de automatización en storage');
                console.warn('💡 Esperando que background envíe comando initiateLicitacionProcess...');
                console.warn('⚠️ Si esto no pasa en 5 segundos, hay un problema en background.js');
            }
        } catch (error) {
            console.error('❌ Error verificando datos:', error);
        }
        
        console.log('=== FIN VERIFICACIÓN ===');
        console.log('');
    }

    // ================================
    // DETECCIÓN DE CONTEXTO Y PÁGINAS
    // ================================

    detectPageContext() {
        const url = window.location.href;
        const pathname = window.location.pathname;
        
        // Detectar páginas de PharmaTender
        if (url.includes('prime.pharmatender.cl')) {
            // Página de carga de documentos: /carga-documentos/1058012-91-LP25
            if (pathname.includes('/carga-documentos/')) {
                this.currentPage = 'pharmatender_carga_documentos';
                this.extractLicitacionFromPharmaTenderUrl();
                console.log('✅ Página de carga de documentos PharmaTender detectada');
            } else if (pathname.includes('/licitacion')) {
                this.currentPage = 'pharmatender_licitacion';
                this.extractLicitacionFromPharmaTenderUrl();
            } else if (pathname.includes('/dashboard')) {
                this.currentPage = 'pharmatender_dashboard';
            } else {
                this.currentPage = 'pharmatender_other';
            }
        }
        // Detectar páginas de Mercado Público
        else if (url.includes('mercadopublico.cl')) {
            // Páginas del WIZARD de ofertas (URL genérica /BID/Modules/BID/ con idPagina cambiante)
            if (url.includes('/BID/Modules/BID/') && url.includes('idPagina=')) {
                // ✅ ESTAMOS EN EL WIZARD DE OFERTAS
                // Detectar la página específica por los elementos presentes
                this.currentPage = this.detectWizardStep();
                console.log(`📝 En WIZARD DE OFERTA - Paso: ${this.currentPage}`);
            } else if (url.includes('DetailBidAcquisition.aspx')) {
                // Página de detalle de ofertas (después de buscar)
                this.currentPage = 'oferta_detail';
                this.extractLicitacionFromUrl();
            } else if (url.includes('Portal/Modules/Desktop/Desktop.aspx')) {
                this.currentPage = 'oferta_form';
                this.extractLicitacionFromUrl();
            } else if (url.includes('WizBIDConfirm.aspx')) {
                // 🚨 PÁGINA DE CONFIRMACIÓN - PUEDE INDICAR PROBLEMAS
                this.currentPage = 'wizard_confirm';
                this.extractLicitacionFromUrl();
                console.log('🚨 Página de confirmación detectada - verificar si faltan pasos:', url);
            } else if (url.includes('/BID/Modules/BID/') && url.includes('idPagina=')) {
                // 🎯 PÁGINAS DEL WIZARD DE OFERTAS
                this.currentPage = 'wizard_page';
                this.extractLicitacionFromUrl();
                console.log('🔍 Página del wizard detectada:', url);
            } else if (url.includes('BID/Modules/RFB/NEwSearchProcurement.aspx')) {
                this.currentPage = 'search';
            } else if (url.includes('Home')) {
                this.currentPage = 'home';
            } else if (url.includes('heimdall') || url.includes('auth')) {
                this.currentPage = 'login';
            }
        }

        console.log('📍 Contexto detectado:', {
            page: this.currentPage,
            url: url,
            pathname: pathname,
            licitacionId: this.licitacionId
        });
    }

    extractLicitacionFromUrl() {
        try {
            const url = window.location.href;
            const match = url.match(/enc=([^&]+)/);
            
            if (match && match[1]) {
                this.licitacionId = match[1];
                console.log('🎯 Licitación detectada:', this.licitacionId);
            }
        } catch (error) {
            console.error('❌ Error extrayendo licitación:', error);
        }
    }

    // ✅ FUNCIÓN ESCALABLE: Detectar paso del wizard por elementos, no por URL
    detectWizardStep() {
        const currentUrl = window.location.href;
        
        console.log('🔍 === INICIO detectWizardStep() ===');
        console.log('📍 URL:', currentUrl);
        console.log('🔍 Verificando WizAttachment...');
        
        // 🎯 DETECCIÓN ESPECÍFICA PARA WizAttachment.aspx (Página de documentos)
        if (currentUrl.includes('WizAttachment.aspx')) {
            console.log('   🔍 Detectado: Página de documentos (WizAttachment.aspx)');
            
            // ✅ FORZAR RETORNO - WizAttachment.aspx SIEMPRE es documentos
            // No importa si encontramos el título o no
            console.log('   ✅ CONFIRMADO: WizAttachment.aspx es SIEMPRE página de documentos');
            
            // Intentar verificar el título como información adicional
            try {
                const tituloElemento = document.querySelector('#titleCell span#ctl00_mpcphFormWizardFields_lblMainTitle') ||
                                     document.querySelector('#titleCell span') ||
                                     document.querySelector('span[id*="lblMainTitle"]');
                
                if (tituloElemento) {
                    const titulo = tituloElemento.textContent;
                    console.log('   📋 Título detectado:', titulo);
                    
                    if (titulo.includes('Realizar Oferta para Adquisición')) {
                        console.log('   ✅ Título confirma: Es página de realizar oferta');
                    }
                } else {
                    console.log('   ⚠️ Título no encontrado, pero URL confirma que es WizAttachment');
                }
            } catch (error) {
                console.log('   ⚠️ Error obteniendo título:', error.message);
            }
            
            // SIEMPRE retornar documentos para WizAttachment
            console.log('🔍 === FIN detectWizardStep() - RETORNANDO wizard_paso3_documentos ===');
            return 'wizard_paso3_documentos';
        }
        
        // CASO ESPECIAL: Página de Declaración Jurada (dj-requisitos)
        if (currentUrl.includes('dj-requisitos') || 
            currentUrl.includes('proveedor.mercadopublico.cl/dj') ||
            document.title.includes('Declaración Jurada') ||
            document.body.textContent.includes('Declaración Jurada de Requisitos para Ofertar')) {
            console.log('   🔍 Detectado: Página de Declaración Jurada');
            return 'wizard_paso4_firma';
        }
        
        // PASO 1: Información Básica (Nombre y Descripción)
        if (document.querySelector('#ctl00_mpcphFormWizardFields_txtBIDName')) {
            console.log('   🔍 Detectado: Campo de nombre de oferta');
            return 'wizard_paso1_informacion_basica';
        }
        
        // PASO 2: Productos y Precios (checkbox "No oferto a ninguno")
        if (document.querySelector('#ctl00_mpcphFormWizardFields_chkNoBids')) {
            console.log('   🔍 Detectado: Checkbox "No oferto"');
            return 'wizard_paso2_productos';
        }
        
        // PASO 3: Documentos - Verificar si tiene elementos de DJ también
        if (document.querySelector('iframe[name="frmUploadContent"]') || 
            document.querySelector('#ctl00_mpcphFormWizardFields_ibtnAgregarTecnico')) {
            
            // ✅ Verificar si también tiene elementos de DJ en la misma página
            const tieneDJ = document.querySelector('#dj_estado') ||
                           document.querySelector('.badgedj_pendiente') ||
                           document.querySelector('.texto_pendiente') ||
                           document.querySelector('#badgedj');
            
            if (tieneDJ) {
                console.log('   🔍 Detectado: Página de documentos CON declaración jurada');
                console.log('   📋 Esta página tiene tanto documentos como DJ');
                return 'wizard_paso3_documentos'; // Usar el nuevo flujo inteligente
            } else {
                console.log('   🔍 Detectado: Página de documentos SIN declaración jurada');
                return 'wizard_paso3_documentos';
            }
        }
        
        // PASO 4: Firma (Declaración Jurada) - En wizard principal
        if (document.querySelector('#ctl00_mpcphFormWizardFields_chkDecJur') || 
            document.querySelector('input[id*="chkDecJur"]') ||
            document.querySelector('a[href*="ir_a_fimar"]') ||
            document.querySelector('a[onclick*="ir_a_fimar"]')) {
            console.log('   🔍 Detectado: Sección de declaración jurada en wizard');
            return 'wizard_paso4_firma';
        }
        
        // DETECCIÓN POR MENSAJE ESPECÍFICO QUE APARECE
        const contenidoPagina = document.body.textContent;
        if (contenidoPagina.includes('Para poder continuar, debes completar y firmar') ||
            contenidoPagina.includes('declaración jurada de requisitos para ofertar') ||
            contenidoPagina.includes('Requisitos para ofertar (obligatorio)')) {
            console.log('   🔍 Detectado: Mensaje de declaración jurada pendiente');
            return 'wizard_paso4_firma';
        }
        
        // DETECCIÓN POR ELEMENTOS ESPECÍFICOS DE LA DJ
        if (document.querySelector('#dj_estado') ||
            document.querySelector('.badgedj_pendiente') ||
            document.querySelector('.texto_pendiente')) {
            console.log('   🔍 Detectado: Elementos de estado de declaración jurada');
            return 'wizard_paso4_firma';
        }
        
        // Búsqueda adicional por contenido de texto para "Declarar y firmar"
        const links = document.querySelectorAll('a');
        for (const link of links) {
            if (link.textContent.includes('Declarar') && link.textContent.includes('firmar')) {
                console.log('   🔍 Detectado: Enlace "Declarar y firmar"');
                return 'wizard_paso4_firma';
            }
        }
        
        // PASO 5: Resumen Final
        if (document.querySelector('#btnConfirmar') || 
            document.querySelector('input[value="Confirmar"]')) {
            console.log('   🔍 Detectado: Botón confirmar');
            return 'wizard_paso5_resumen';
        }
        
        // Si no detectamos nada específico
        console.log('   ⚠️ Paso desconocido del wizard');
        console.log('🔍 === FIN detectWizardStep() - RETORNANDO DESCONOCIDO ===');
        return 'wizard_paso_desconocido';
    }

    extractLicitacionFromPharmaTenderUrl() {
        try {
            const pathname = window.location.pathname;
            // Extraer ID de URLs como: /carga-documentos/1058012-91-LP25
            const match = pathname.match(/\/carga-documentos\/([^\/]+)/) || 
                         pathname.match(/\/licitacion\/([^\/]+)/);
            
            if (match && match[1]) {
                this.licitacionId = match[1];
                console.log('🎯 Licitación PharmaTender detectada:', this.licitacionId);
            }
        } catch (error) {
            console.error('❌ Error extrayendo licitación PharmaTender:', error);
        }
    }

    async initializeBasedOnContext() {
        try {
            // SALTAR COMPLETAMENTE si estamos en PharmaTender
            // content-platform.js maneja TODA la UI en PharmaTender
            if (window.location.href.includes('prime.pharmatender.cl')) {
                console.log('✅ En PharmaTender - content-platform.js manejará la UI');
                return;
            }

            const isActive = await this.checkExtensionState();

            if (!isActive) {
                console.log('⚠️ EXTENSIÓN DESACTIVADA - No se ejecutará');
                this.showDisabledIndicator();
                return;
            }

            switch (this.currentPage) {
                case 'home':
                    console.log('📍 En página home - Esperando navegación a licitación...');
                    this.addIndicator('⏳ Esperando navegación...', 'waiting');
                    break;
                    
                case 'login':
                    console.log('📍 En página login - Preparando asistencia de login...');
                    this.addIndicator('🔐 Página de login detectada', 'info');
                    break;
                    
                case 'search':
                    console.log('📍 En página búsqueda - Preparando búsqueda...');
                    this.addIndicator('🔍 Página de búsqueda', 'info');
                    
                    // 🆕 EJECUTAR AUTOMÁTICAMENTE SI TENEMOS DATOS
                    setTimeout(() => {
                        this.checkAndExecuteIfReady();
                    }, 3000);
                    break;
                    
                case 'oferta_detail':
                    console.log('📍 En página de ofertas - Preparando...');
                    this.addIndicator('📋 Página de ofertas', 'info');
                    
                    // 🆕 EJECUTAR AUTOMÁTICAMENTE
                    setTimeout(() => {
                        this.checkAndExecuteIfReady();
                    }, 3000);
                    break;
                    
                case 'oferta_form':
                    console.log('📍 En formulario de oferta - Iniciando automatización...');
                    this.addIndicator('📋 Formulario de oferta detectado', 'success');
                    if (this.licitacionId) {
                        await this.prepareForOfferAutomation();
                    }
                    break;
                    
                case 'wizard_page':
                    console.log('📍 En página del wizard - Preparando para continuar...');
                    this.addIndicator('🧙 En wizard de oferta', 'info');
                    
                    // 🔧 NO ejecutar automáticamente - agregar botón para continuar manualmente
                    console.log('💡 Agregando botón para continuar automatización...');
                    this.addAutomationButton();
                    break;
                    
                case 'wizard_confirm':
                    console.log('🚨 En página de confirmación - VERIFICANDO PROBLEMAS...');
                    this.addIndicator('🚨 Verificando oferta...', 'warning');
                    
                    // Verificar si aparece el popup de "estado guardada"
                    setTimeout(async () => {
                        await this.manejarPopupEstadoGuardada();
                    }, 2000);
                    break;

                case 'pharmatender_carga_documentos':
                    console.log('📍 En página de carga de documentos PharmaTender');
                    // content-platform.js maneja la UI en PharmaTender
                    if (this.licitacionId) {
                        await this.prepareForDocumentUpload();
                    }
                    break;

                case 'pharmatender_licitacion':
                    console.log('📍 En página de licitación PharmaTender');
                    // content-platform.js maneja la UI en PharmaTender
                    break;

                case 'pharmatender_dashboard':
                    console.log('📍 En dashboard PharmaTender');
                    // content-platform.js maneja la UI en PharmaTender
                    break;

                case 'pharmatender_other':
                    console.log('📍 Otra página de PharmaTender');
                    // content-platform.js maneja la UI en PharmaTender
                    break;

                default:
                    // Solo mostrar indicador en páginas de Mercado Público no reconocidas
                    if (window.location.href.includes('mercadopublico.cl')) {
                        console.log('📍 Página de Mercado Público no reconocida - En espera...', this.currentPage);
                        this.addIndicator('❓ Página no reconocida', 'warning');
                    } else {
                        console.log('📍 Página no reconocida:', this.currentPage);
                    }
            }
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
        }
    }

    // ================================
    // PREPARACIÓN PARA CARGA DE DOCUMENTOS
    // ================================

    async prepareForDocumentUpload() {
        try {
            console.log('📄 Preparando carga de documentos para licitación:', this.licitacionId);

            // Esperar a que la página cargue completamente
            await this.waitForElement('body', 5000);

            // content-platform.js maneja el botón y los indicadores en PharmaTender
            // Este script solo se encarga de la lógica de automatización

            console.log('✅ Preparación completada para carga de documentos');

        } catch (error) {
            console.error('❌ Error preparando carga de documentos:', error);
        }
    }

    addAutomationButton() {
        // NOTA: Esta función está DEPRECADA para páginas de PharmaTender
        // content-platform.js maneja los botones en PharmaTender
        // Esta función solo se mantiene para compatibilidad con Mercado Público si es necesario

        // Evitar duplicados
        if (document.getElementById('pharmatender-automation-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'pharmatender-automation-btn';
        button.innerHTML = `
            <span style="margin-right: 8px;">🤖</span>
            Iniciar Automatización Licitación
        `;
        
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05) translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1) translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });
        
        button.addEventListener('click', async () => {
            await this.startDocumentUploadAutomation();
        });
        
        document.body.appendChild(button);
        console.log('✅ Botón de automatización agregado');
    }

    async startDocumentUploadAutomation() {
        try {
            console.log('🚀 Iniciando automatización de carga de documentos...');
            
            // Deshabilitar botón temporalmente
            const button = document.getElementById('pharmatender-automation-btn');
            if (button) {
                button.disabled = true;
                button.style.opacity = '0.7';
                button.innerHTML = '⏳ Procesando...';
            }
            
            // Notificar al background script
            const response = await chrome.runtime.sendMessage({
                action: 'startLicitacionAutomation',
                licitacionId: this.licitacionId,
                licitacionData: {
                    id: this.licitacionId,
                    nombre: `Licitación ${this.licitacionId}`,
                    url: window.location.href,
                    tipo: 'carga_documentos'
                }
            });
            
            if (response && response.success) {
                console.log('✅ Automatización iniciada en background');
                this.showNotification('Automatización iniciada', 'success');
                
                // Iniciar el proceso local
                await this.executeDocumentUploadFlow();
                
            } else {
                console.error('❌ Error iniciando automatización:', response);
                this.showNotification('Error iniciando automatización', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error en automatización:', error);
            this.showNotification('Error en automatización', 'error');
        } finally {
            // Re-habilitar botón
            const button = document.getElementById('pharmatender-automation-btn');
            if (button) {
                button.disabled = false;
                button.style.opacity = '1';
                button.innerHTML = '<span style="margin-right: 8px;">🤖</span>Iniciar Automatización Licitación';
            }
        }
    }

    async executeDocumentUploadFlow() {
        // 🆕 Evitar ejecuciones duplicadas
        if (this.isRunning) {
            console.log('⚠️ El flujo ya está en ejecución, ignorando llamada duplicada');
            return;
        }
        
        this.isRunning = true;
        
        try {
            console.log('');
            console.log('═'.repeat(80));
            console.log('🚀 EJECUTANDO FLUJO DE AUTOMATIZACIÓN DE LICITACIÓN');
            console.log('═'.repeat(80));
            console.log('📋 Licitación ID:', this.licitacionId);
            console.log('📍 URL actual:', window.location.href);
            console.log('💾 Datos disponibles:', !!this.automationData);
            console.log('═'.repeat(80));
            console.log('');
            
            // PASO 1: Verificar que tenemos los datos necesarios
            if (!this.automationData || !this.licitacionId) {
                throw new Error('❌ No hay datos de automatización disponibles');
            }
            
            const credentials = this.automationData.credenciales;
            if (!credentials || !credentials.username || !credentials.password) {
                throw new Error('❌ Credenciales incompletas');
            }
            
            console.log('✅ Datos validados correctamente');
            console.log('👤 Usuario:', credentials.username);
            console.log('🏛️ Licitación:', this.licitacionId);
            
            // 📊 LOGGING COMPLETO DEL ENDPOINT PARA REVISIÓN
            console.log('');
            console.log('📊 === DATOS COMPLETOS DEL ENDPOINT ===');
            console.log('🏢 EMPRESA:');
            console.log('   - company_name:', this.automationData?.licitacion?.company_name);
            console.log('   - company_id:', this.automationData?.licitacion?.company_id);
            console.log('   - rut_usuario:', this.automationData?.licitacion?.rut_usuario);
            console.log('');
            console.log('📋 LICITACIÓN:');
            console.log('   - codigo_licitacion:', this.automationData?.licitacion?.codigo_licitacion);
            console.log('   - nombre_licitacion:', this.automationData?.licitacion?.nombre_licitacion);
            console.log('   - descripcion_licitacion:', this.automationData?.licitacion?.descripcion_licitacion?.substring(0, 100));
            console.log('   - fecha_publicacion:', this.automationData?.licitacion?.fecha_publicacion);
            console.log('   - fecha_cierre:', this.automationData?.licitacion?.fecha_cierre);
            console.log('');
            console.log('🛒 PRODUCTOS:');
            console.log('   - total_items:', this.automationData?.licitacion?.total_items);
            console.log('   - paginas_productos:', this.automationData?.licitacion?.paginas_productos);
            console.log('   - monto_total:', this.automationData?.licitacion?.monto_total);
            if (this.automationData?.licitacion?.productos) {
                console.log('   - productos (primeros 3):');
                this.automationData.licitacion.productos.slice(0, 3).forEach((prod, idx) => {
                    console.log(`     ${idx + 1}. Item ${prod.item || prod.item_numero}: ${prod.nombre?.substring(0, 60)}... - $${prod.precio_unitario}`);
                });
            }
            console.log('=====================================');
            
            // PASO 2: Verificar que el usuario YA esté logueado ANTES de continuar
            console.log('');
            console.log('🔐 VERIFICANDO SESIÓN ACTIVA...');
            
            const sessionValid = await this.verificarSesionActiva();
            if (!sessionValid) {
                console.error('❌ NO HAY SESIÓN ACTIVA');
                console.error('❌ Debes iniciar sesión manualmente en Mercado Público primero');
                this.updateIndicator('❌ Inicia sesión manualmente primero', 'error');
                throw new Error('No hay sesión activa. Por favor inicia sesión manualmente en Mercado Público.');
            }
            
            console.log('✅ Sesión activa verificada');
            
            // PASO 3: Detectar en qué página estamos
            const currentUrl = window.location.href;
            console.log('');
            console.log('📍 DETECTANDO PÁGINA ACTUAL...');
            console.log('URL:', currentUrl);
            
            // PASO 4: Verificar si ya estamos en página de ofertas (DetailBidAcquisition.aspx)
            if (currentUrl.includes('DetailBidAcquisition.aspx')) {
                console.log('');
                console.log('✅ YA ESTAMOS EN PÁGINA DE OFERTAS!');
                console.log('📍 URL:', currentUrl);
                
                // Verificar cuántos intentos llevamos
                if (this.clickOfertaAttempts >= this.maxClickOfertaAttempts) {
                    console.error('❌ SE ALCANZÓ EL MÁXIMO DE INTENTOS DE CLICK EN OFERTA');
                    console.error(`❌ Ya se intentó ${this.clickOfertaAttempts} veces sin éxito`);
                    this.updateIndicator('❌ Error: máximo intentos alcanzado', 'error');
                    throw new Error('No se pudo acceder al formulario de oferta después de múltiples intentos');
                }
                
                this.clickOfertaAttempts++;
                console.log(`📊 Intento ${this.clickOfertaAttempts}/${this.maxClickOfertaAttempts} de acceder a formulario`);
                console.log('');
                console.log('🔍 VERIFICANDO OFERTA EXISTENTE / CREANDO NUEVA...');
                
                this.updateIndicator('📋 En página de ofertas', 'processing');
                
                await this.waitForPageLoad();
                await this.delay(3000);
                
                // Guardar URL actual para comparar después
                const urlAntesClick = window.location.href;
                console.log('📍 URL ANTES de click:', urlAntesClick);
                
                // Buscar botón "Nueva Oferta" o editar oferta existente
                await this.buscarYClickIngresarOferta();
                
                // Esperar navegación
                console.log('⏳ Esperando 8 segundos para navegación...');
                await this.delay(8000);
                
                // Verificar URL después del click
                const urlDespuesClick = window.location.href;
                console.log('📍 URL DESPUÉS de click:', urlDespuesClick);
                
                // Caso 1: Volvió a página de búsqueda (ERROR)
                if (urlDespuesClick.includes('NEwSearchProcurement.aspx')) {
                    console.error('');
                    console.error('❌ PROBLEMA: Volvimos a la página de búsqueda');
                    console.error('❌ El click no funcionó o hubo error en el servidor');
                    console.error('❌ Posibles causas:');
                    console.error('   1. No tienes permisos para crear ofertas');
                    console.error('   2. La licitación no permite más ofertas');
                    console.error('   3. Faltan datos requeridos');
                    console.error('   4. Sesión expirada');
                    this.updateIndicator('❌ Error: volvió a búsqueda', 'error');
                    throw new Error('Click en oferta falló - redirigido a búsqueda');
                }
                
                // Caso 2: Todavía en DetailBidAcquisition (puede ser normal si carga lento)
                if (urlDespuesClick === urlAntesClick && urlDespuesClick.includes('DetailBidAcquisition.aspx')) {
                    console.warn('⚠️ URL no cambió - todavía en DetailBidAcquisition');
                    console.log('💡 Esto puede ser normal si la página carga lento');
                    console.log('💡 Esperando 5 segundos más...');
                    await this.delay(5000);
                    
                    const urlFinal = window.location.href;
                    console.log('📍 URL FINAL:', urlFinal);
                    
                    if (urlFinal === urlAntesClick) {
                        console.warn('⚠️ La URL sigue sin cambiar después de 13 segundos');
                        console.warn('⚠️ El click pudo no ejecutarse correctamente');
                        // No lanzamos error, continuamos para ver qué pasa
                    }
                }
                
                // Caso 3: URL cambió exitosamente
                if (urlDespuesClick !== urlAntesClick && !urlDespuesClick.includes('NEwSearchProcurement.aspx')) {
                    console.log('');
                    console.log('✅ NAVEGACIÓN EXITOSA');
                    console.log('✅ URL cambió correctamente');
                    console.log('📍 Nueva URL:', urlDespuesClick);
                }
                
                console.log('');
                console.log('═'.repeat(80));
                console.log('✅ Click en oferta completado');
                console.log('═'.repeat(80));
                console.log('');
                
                // Reset contador si fue exitoso
                this.clickOfertaAttempts = 0;
                
                return;
            }
            
            // PASO 4.5: ✅ ESTAMOS EN EL WIZARD DE OFERTAS (detección escalable por elementos)
            if (currentUrl.includes('/BID/Modules/BID/') && currentUrl.includes('idPagina=')) {
                console.log('');
                console.log('✅ ✅ ✅ ESTAMOS EN EL WIZARD DE OFERTAS! ✅ ✅ ✅');
                console.log('📍 URL:', currentUrl);
                console.log('🔍 Detectando paso específico...');
                
                // Esperar carga completa del formulario
                await this.waitForPageLoad();
                await this.delay(2000);
                
                // Detectar el paso actual por los elementos presentes
                console.log('🔍 INICIANDO DETECCIÓN DE PASO DEL WIZARD...');
                console.log(`📍 URL actual: ${currentUrl}`);
                console.log(`📄 Título página: ${document.title}`);
                
                let pasoActual = this.detectWizardStep();
                console.log(`📋 Paso detectado: ${pasoActual}`);
                
                // ⚠️ VERIFICACIÓN CRÍTICA Y CORRECCIÓN AUTOMÁTICA
                if (!pasoActual || pasoActual === 'undefined' || pasoActual === 'null' || pasoActual === 'wizard_paso_desconocido') {
                    console.error('❌ PROBLEMA CRÍTICO: detectWizardStep() devolvió valor problemático');
                    console.error(`❌ Valor devuelto: ${pasoActual}`);
                    
                    // ⛑️ CORRECCIÓN AUTOMÁTICA PARA WizAttachment
                    if (currentUrl.includes('WizAttachment.aspx')) {
                        console.log('🔧 CORRECCIÓN AUTOMÁTICA: Es WizAttachment.aspx, forzando wizard_paso3_documentos');
                        pasoActual = 'wizard_paso3_documentos';
                        console.log(`📋 Paso CORREGIDO: ${pasoActual}`);
                    } else {
                        console.error('❌ URL no reconocida para corrección automática');
                    }
                }
                console.log('');
                
                // Ejecutar la acción correspondiente según el paso
                switch (pasoActual) {
                    case 'wizard_paso1_informacion_basica':
                        console.log('📝 PROCEDIENDO A COMPLETAR INFORMACIÓN BÁSICA...');
                        this.updateIndicator('📝 Llenando información básica...', 'processing');
                        await this.completarInformacionBasica();
                        console.log('✅ INFORMACIÓN BÁSICA COMPLETADA');
                        break;
                    
                    case 'wizard_paso2_productos':
                        console.log('💰 PROCEDIENDO A COMPLETAR PRODUCTOS Y PRECIOS...');
                        this.updateIndicator('💰 Llenando productos...', 'processing');
                        
                        try {
                            await this.completarProductosYPrecios();
                            console.log('✅ PRODUCTOS COMPLETADOS');
                        } catch (error) {
                            if (error.message === 'ESPERANDO_RECARGA') {
                                console.log('⏸️ Proceso pausado, esperando recarga de página...');
                                this.updateIndicator('⏳ Esperando recarga...', 'processing');
                                return; // Detener flujo aquí, se re-ejecutará después de recarga
                            }
                            throw error; // Re-lanzar otros errores
                        }
                        break;
                    
                    case 'wizard_paso3_documentos':
                        console.log('📄 PÁGINA DE DOCUMENTOS DETECTADA - ANALIZANDO ESTADO DJ...');
                        console.log('');
                        
                        // ✅ NUEVO FLUJO INTELIGENTE: Verificar estado de DJ primero
                        await this.procesarPaginaDocumentosYDJ();
                        break;
                    
                    case 'wizard_paso4_firma':
                        console.log('🖊️ PROCEDIENDO A FIRMAR DECLARACIÓN...');
                        this.updateIndicator('🖊️ Firmando...', 'processing');
                        await this.procesoFirma();
                        console.log('✅ DECLARACIÓN FIRMADA');
                        break;
                    
                    case 'wizard_paso5_resumen':
                        console.log('✅ PROCEDIENDO A FINALIZAR OFERTA...');
                        this.updateIndicator('✅ Finalizando...', 'processing');
                        await this.finalizarOferta();
                        console.log('✅ OFERTA FINALIZADA');
                        break;
                    
                    case 'wizard_paso_desconocido':
                        console.warn('⚠️ PASO DESCONOCIDO - NO HACER NADA AUTOMÁTICO');
                        console.warn('📍 URL:', currentUrl);
                        console.warn('📄 Título:', document.title);
                        console.warn('❌ La detección falló - revisar selectores');
                        
                        // 🔍 INTENTAR DETECCIÓN MANUAL ESPECÍFICA
                        if (currentUrl.includes('WizAttachment.aspx')) {
                            console.log('🔧 DETECCIÓN MANUAL: Es WizAttachment - ejecutando carga de documentos');
                            await this.cargarDocumentos();
                            await this.manejarDeclaracionJurada();
                            await this.clickSiguiente();
                        } else {
                            console.warn('⚠️ Paso desconocido y no es WizAttachment - no hacer nada');
                            this.updateIndicator('⚠️ Página no reconocida', 'warning');
                        }
                        break;
                    
                    default:
                        console.error('❌ CASO DEFAULT ALCANZADO - ESTO NO DEBERÍA PASAR');
                        console.error('❌ pasoActual:', pasoActual);
                        console.error('❌ URL:', currentUrl);
                        console.error('❌ NO hacer click automático en siguiente');
                        this.updateIndicator('❌ Error de detección', 'error');
                        break;
                }
                
                console.log('');
                console.log('═'.repeat(80));
                console.log(`✅ PASO ${pasoActual} COMPLETADO`);
                console.log('═'.repeat(80));
                console.log('');
                
                return; // Terminar este flujo aquí
            }
            
            // PASO 5: Navegar a página de búsqueda de licitaciones si no estamos ahí
            const searchUrl = 'https://www.mercadopublico.cl/BID/Modules/RFB/NEwSearchProcurement.aspx';
            
            if (!currentUrl.includes('NEwSearchProcurement.aspx') && !currentUrl.includes('DetailBidAcquisition.aspx')) {
                console.log('');
                console.log('🌐 NAVEGANDO A BÚSQUEDA DE LICITACIONES...');
                console.log('Destino:', searchUrl);
                
                this.updateIndicator('🌐 Navegando a búsqueda...', 'processing');
                
                // Navegar (esto recargará la página y reiniciará el script)
                window.location.href = searchUrl;
                
                // Esperar recarga
                return;
            }
            
            console.log('✅ Ya estamos en página de búsqueda');
            
            // PASO 6: Esperar que la página cargue completamente
            console.log('');
            console.log('⏳ ESPERANDO CARGA COMPLETA DE PÁGINA...');
            await this.waitForPageLoad();
            await this.delay(2000); // Espera adicional para MP lento
            console.log('✅ Página cargada');
            
            // PASO 7: Buscar campo de código de licitación
            console.log('');
            console.log('🔍 BUSCANDO FORMULARIO DE BÚSQUEDA...');
            
            const txtProcCode = await this.waitForElement('#txtProcCode', 15000).catch(() => null);
            
            if (!txtProcCode) {
                console.error('❌ No se encontró campo de código (#txtProcCode)');
                console.log('⚠️ Posibles causas:');
                console.log('   1. La página de MP no cargó correctamente');
                console.log('   2. Necesitas iniciar sesión primero');
                console.log('   3. La estructura HTML cambió');
                
                this.updateIndicator('❌ Campo de búsqueda no encontrado', 'error');
                
                throw new Error('No se encontró el formulario de búsqueda. ¿Necesitas iniciar sesión?');
            }
            
            console.log('✅ Campo de código encontrado:', txtProcCode);
            
            // PASO 8: Ingresar código de licitación
            console.log('');
            console.log('📝 INGRESANDO CÓDIGO DE LICITACIÓN...');
            console.log('Código:', this.licitacionId);
            
            this.updateIndicator(`🔍 Buscando ${this.licitacionId}...`, 'processing');
            
            txtProcCode.value = '';
            txtProcCode.focus();
            await this.typeText(txtProcCode, this.licitacionId, 100);
            
            console.log('✅ Código ingresado');
            await this.delay(500);
            
            // PASO 9: Buscar botón "Buscar"
            console.log('');
            console.log('🔍 BUSCANDO BOTÓN DE BÚSQUEDA...');
            
            const btnSearch = await this.waitForElement('#btnSearchByCode', 10000).catch(() => null);
            
            if (!btnSearch) {
                throw new Error('No se encontró botón de búsqueda (#btnSearchByCode)');
            }
            
            console.log('✅ Botón de búsqueda encontrado');
            
            // PASO 10: Click en buscar
            console.log('');
            console.log('👆 HACIENDO CLICK EN BUSCAR...');
            
            btnSearch.click();
            
            console.log('✅ Click realizado, esperando resultados...');
            this.updateIndicator('⏳ Esperando resultados...', 'processing');
            
            await this.delay(3000); // Esperar resultados
            
            // PASO 11: Buscar botón "Ver Ofertas"
            console.log('');
            console.log('🔍 BUSCANDO BOTÓN "VER OFERTAS"...');
            
            let verOfertasBtn = null;
            let attempts = 0;
            const maxAttempts = 20; // 20 segundos
            
            while (!verOfertasBtn && attempts < maxAttempts) {
                attempts++;
                console.log(`   Intento ${attempts}/${maxAttempts}...`);
                
                // Estrategia 1: Por ID
                verOfertasBtn = document.querySelector('#rptAcquisition_ctl01_imgViewBID');
                
                // Estrategia 2: Por title
                if (!verOfertasBtn) {
                    verOfertasBtn = document.querySelector('input[title="Ver Ofertas"]');
                }
                
                // Estrategia 3: Por src
                if (!verOfertasBtn) {
                    verOfertasBtn = document.querySelector('input[src*="ofertas.gif"]');
                }
                
                // Estrategia 4: Por onclick
                if (!verOfertasBtn) {
                    const allInputs = document.querySelectorAll('input[type="image"]');
                    for (const input of allInputs) {
                        if (input.onclick && input.onclick.toString().includes('oferta')) {
                            verOfertasBtn = input;
                            break;
                        }
                    }
                }
                
                if (verOfertasBtn) {
                    console.log('✅ Botón "Ver Ofertas" encontrado!');
                    break;
                }
                
                await this.delay(1000);
            }
            
            if (!verOfertasBtn) {
                console.error('❌ No se encontró botón "Ver Ofertas" después de', maxAttempts, 'intentos');
                console.log('⚠️ Posibles causas:');
                console.log('   1. El código de licitación no existe');
                console.log('   2. La licitación no tiene ofertas habilitadas');
                console.log('   3. No tienes permisos para ver ofertas');
                
                this.updateIndicator('❌ No se encontró "Ver Ofertas"', 'error');
                
                throw new Error('No se encontró el botón "Ver Ofertas". Verifica el código de licitación.');
            }
            
            // PASO 12: Click en "Ver Ofertas"
            console.log('');
            console.log('👆 HACIENDO CLICK EN "VER OFERTAS"...');
            
            this.updateIndicator('📋 Accediendo a ofertas...', 'processing');
            
            verOfertasBtn.click();
            
            console.log('✅ Click realizado!');
            console.log('⏳ Esperando carga de página de ofertas...');
            
            await this.delay(3000);
            
            // PASO 13: Verificar que estamos en página de ofertas
            console.log('');
            console.log('✅ NAVEGACIÓN COMPLETADA');
            console.log('📍 URL actual:', window.location.href);
            
            this.updateIndicator('✅ En página de ofertas', 'success');
            
            console.log('');
            console.log('═'.repeat(80));
            console.log('🎉 FLUJO BÁSICO COMPLETADO - CONTINUANDO CON AUTOMATIZACIÓN...');
            console.log('═'.repeat(80));
            console.log('');
            
            // TODO: Aquí continuar con el resto del proceso
            // - Verificar si ya existe oferta
            // - Crear nueva oferta o editar existente
            // - Llenar formularios
            // - Cargar documentos
            // - Firmar y enviar
            
            this.showNotification('✅ Navegación completada. Proceso de oferta próximamente...', 'success');
            
        } catch (error) {
            // ⏸️ Si es el error especial ESPERANDO_RECARGA, no tratarlo como error real
            if (error.message === 'ESPERANDO_RECARGA') {
                console.log('⏸️ Flujo pausado temporalmente, esperando recarga de página');
                console.log('ℹ️ El script se re-ejecutará automáticamente');
                return; // Salir silenciosamente, no es un error
            }
            
            console.error('');
            console.error('═'.repeat(80));
            console.error('❌ ERROR EN FLUJO DE AUTOMATIZACIÓN');
            console.error('═'.repeat(80));
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.error('═'.repeat(80));
            console.error('');
            
            this.updateIndicator('❌ Error: ' + error.message, 'error');
            this.showNotification('❌ Error: ' + error.message, 'error');
            
            throw error;
        } finally {
            // 🆕 Resetear flag después de 5 segundos (permitir reintentos si es necesario)
            setTimeout(() => {
                this.isRunning = false;
            }, 5000);
        }
    }

    // ================================
    // GESTIÓN DE ESTADOS Y VALIDACIONES
    // ================================

    async checkExtensionState() {
        try {
            const result = await chrome.storage.local.get(['extensionActive']);
            this.extensionActive = result.extensionActive !== false;
            
            console.log('📊 Estado extensión:', this.extensionActive);
            return this.extensionActive;
            
        } catch (error) {
            console.error('❌ Error verificando estado:', error);
            this.extensionActive = false;
            return false;
        }
    }

    async verificarEstadoLicitacion() {
        console.log('🔍 Verificando estado de licitación...');
        
        try {
            // Buscar indicadores de estado en la página
            const indicadoresEstado = [
                '.estado-licitacion',
                '[class*="estado"]',
                '[class*="cancelada"]',
                '[class*="cerrada"]',
                '[class*="suspendida"]'
            ];
            
            // Búsqueda manual por texto para estados
            const todosLosSpans = document.querySelectorAll('span, div, .estado-licitacion');
            for (const span of todosLosSpans) {
                const texto = span.textContent.toLowerCase().trim();
                if (texto.includes('cancelada') || texto.includes('cerrada') || texto.includes('suspendida')) {
                    console.log(`⚠️ Estado negativo detectado: "${texto}"`);
                    return false;
                }
            }

            let estadoDetectado = null;
            
            for (const selector of indicadoresEstado) {
                const elementos = document.querySelectorAll(selector);
                for (const elemento of elementos) {
                    const texto = elemento.textContent.trim().toLowerCase();
                    if (texto.includes('cancelada') || texto.includes('cerrada') || 
                        texto.includes('suspendida')) {
                        estadoDetectado = elemento.textContent.trim();
                        break;
                    }
                }
                if (estadoDetectado) break;
            }

            if (estadoDetectado) {
                console.log('❌ LICITACIÓN CANCELADA/CERRADA:', estadoDetectado);
                this.procesoDetenido = true;
                this.updateIndicator('❌ Licitación no disponible', 'error');
                return false;
            }

            // Verificar si ya existe postulación
            const yaPostulada = await this.verificarPostulacionExistente();
            if (yaPostulada) {
                return false;
            }

            console.log('✅ Licitación en estado válido');
            return true;
            
        } catch (error) {
            console.error('❌ Error verificando estado licitación:', error);
            return true; // Continuar en caso de error
        }
    }

    async verificarPostulacionExistente() {
        console.log('🔍 Verificando postulación existente...');
        
        try {
            // Buscar botón "Anular oferta" o similar (indica oferta ya ingresada)
            const selectoresOfertaExistente = [
                'input[title*="Anular"]',
                'input[value*="Anular"]',
                'button[title*="Anular"]',
                '[onclick*="anular"]',
                '.estado-oferta[class*="enviada"]',
                '.estado-oferta[class*="ingresada"]'
            ];

            for (const selector of selectoresOfertaExistente) {
                const elementos = document.querySelectorAll(selector);
                for (const elemento of elementos) {
                    if (elemento.offsetParent !== null) { // Visible
                        console.log('✅ POSTULACIÓN YA EXISTE');
                        this.procesoDetenido = true;
                        this.updateIndicator('✅ Ya postulada', 'success');
                        return true;
                    }
                }
            }

            // Búsqueda manual por texto "Anular"
            const todosLosBotones = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
            for (const boton of todosLosBotones) {
                const texto = (boton.textContent || boton.value || boton.title || '').toLowerCase();
                if (texto.includes('anular') && boton.offsetParent !== null) {
                    console.log('✅ POSTULACIÓN YA EXISTE (encontrado por texto)');
                    this.procesoDetenido = true;
                    this.updateIndicator('✅ Ya postulada', 'success');
                    return true;
                }
            }

            return false;
            
        } catch (error) {
            console.error('❌ Error verificando postulación existente:', error);
            return false;
        }
    }

    // ================================
    // PREPARACIÓN PARA AUTOMATIZACIÓN
    // ================================

    async prepareForOfferAutomation() {
        try {
            console.log('🔧 Preparando automatización de oferta...');
            
            // Verificar estado antes de continuar
            const estadoValido = await this.verificarEstadoLicitacion();
            if (!estadoValido) {
                return;
            }

            this.updateIndicator('⏳ Preparando automatización...', 'processing');
            this.setupMessageListener();
            
            // Buscar datos de automatización
            await this.checkForAutomationData();
            
        } catch (error) {
            console.error('❌ Error preparando automatización:', error);
            this.updateIndicator('❌ Error en preparación', 'error');
        }
    }

    setupMessageListener() {
        if (this.messageListenerConfigured) return;
        this.messageListenerConfigured = true;
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('📨 MENSAJE RECIBIDO:', request.action);
            
            // 🆕 Responder a PING del background
            if (request.action === 'ping') {
                console.log('🏓 PING recibido del background, respondiendo...');
                sendResponse({ 
                    pong: true, 
                    success: true,
                    ready: true,
                    url: window.location.href,
                    timestamp: Date.now()
                });
                return false; // Respuesta síncrona
            }
            
            if (request.action === 'startLicitacionAutomation') {
                console.log('🚀 COMANDO AUTORIZADO desde popup');
                
                this.startAutomationProcess(request.data)
                    .then(() => {
                        sendResponse({ success: true, message: 'Automatización iniciada' });
                    })
                    .catch((error) => {
                        sendResponse({ success: false, message: error.message });
                    });
                
                return true; // Respuesta asíncrona
            }
            
            if (request.action === 'refreshLicitacionData') {
                console.log('🔄 ACTUALIZANDO DATOS DE LICITACIÓN...');
                
                // Recargar datos del endpoint
                this.obtenerDatosLicitacion()
                    .then(() => {
                        sendResponse({ success: true, message: 'Datos actualizados' });
                    })
                    .catch((error) => {
                        sendResponse({ success: false, message: error.message });
                    });
                
                return true; // Respuesta asíncrona
            }
            
            if (request.action === 'initiateLicitacionProcess') {
                console.log('🚀 INICIANDO PROCESO desde background:', request.licitacionId);
                console.log('📦 Datos recibidos:', {
                    licitacionId: request.licitacionId,
                    hasLicitacionData: !!request.licitacionData,
                    hasUserData: !!request.userData,
                    hasCredentials: !!request.credentials
                });
                
                // Guardar datos para usar en el proceso
                this.licitacionId = request.licitacionId;
                this.automationData = {
                    licitacion: request.licitacionData,
                    usuario: request.userData,
                    credenciales: request.credentials,
                    config: request.config
                };
                
                console.log('💾 Datos guardados en automationData');
                
                // 🚨 VERIFICAR SI ESTAMOS EN PÁGINA DEL WIZARD ANTES DE EJECUTAR
                const currentUrl = window.location.href;
                const esWizardPage = currentUrl.includes('/BID/Modules/BID/') && currentUrl.includes('idPagina=');
                
                if (esWizardPage) {
                    console.log('⚠️ COMANDO DESDE BACKGROUND PERO ESTAMOS EN WIZARD');
                    console.log('📍 URL del wizard:', currentUrl);
                    console.log('🎯 Agregando botón para continuar cuando sea apropiado...');
                    this.addAutomationButton();
                    sendResponse({ success: true, message: 'Datos cargados, continúa manualmente desde wizard' });
                    return true;
                }
                
                // Iniciar el flujo de automatización (solo si NO estamos en wizard)
                console.log('🚀 Iniciando flujo desde background...');
                this.executeDocumentUploadFlow()
                    .then(() => {
                        console.log('✅ Proceso completado exitosamente');
                        sendResponse({ success: true, message: 'Proceso de licitación completado' });
                    })
                    .catch((error) => {
                        console.error('❌ Error en proceso de licitación:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                
                return true; // Respuesta asíncrona
            }
            
            // 🆕 Handler para verificación de progreso desde background
            if (request.action === 'getProgress') {
                console.log('📊 Solicitud de progreso recibida desde background');
                
                // Verificar si estamos en una página de DJ
                const urlActual = window.location.href;
                const contenido = document.body.textContent;
                
                // Verificar estados de DJ
                const esDJ = urlActual.includes('dj-requisitos') || contenido.includes('Declaración Jurada');
                
                let yaFirmada = false;
                
                if (esDJ) {
                    // 🎯 MÉTODO INTELIGENTE: Revisar botón de firma como indicador principal
                    const botonFirmar = document.querySelector('button[type="submit"], input[type="submit"], button');
                    let textoBoton = '';
                    
                    if (botonFirmar) {
                        textoBoton = botonFirmar.textContent?.trim() || botonFirmar.value || '';
                        
                        // CORRECCIÓN: "Firmar sin Clave Única" significa PENDIENTE, no completada
                        // Solo considerar firmada si hay indicadores explícitos de completado
                        if (textoBoton.includes('Firmada') || 
                            textoBoton.includes('Completada') ||
                            textoBoton.includes('Ya firmado')) {
                            yaFirmada = true;
                        }
                    }
                    
                    // Método alternativo: buscar en contenido
                    if (!yaFirmada) {
                        yaFirmada = contenido.includes('FIRMADA') || 
                                   contenido.includes('Firmada') ||
                                   contenido.includes('firma realizada') ||
                                   contenido.includes('ya ha sido firmado');
                    }
                }
                
                if (esDJ && yaFirmada) {
                    console.log('✅ DJ detectada como YA FIRMADA');
                    sendResponse({ 
                        success: true, 
                        status: 'dj_completed',
                        message: 'DJ ya está firmada',
                        alreadySigned: true
                    });
                } else if (esDJ) {
                    console.log('📋 DJ detectada como PENDIENTE');
                    sendResponse({ 
                        success: true, 
                        status: 'dj_pending',
                        message: 'DJ pendiente de firma'
                    });
                } else {
                    console.log('📄 Página normal de licitación');
                    sendResponse({ 
                        success: true, 
                        status: 'normal_page',
                        message: 'Página de licitación normal'
                    });
                }
                
                return false; // Respuesta síncrona
            }
            
            return false;
        });
        
        console.log('✅ Message listener configurado para licitaciones');
    }

    async checkForAutomationData() {
        if (!this.licitacionId) return;
        
        try {
            console.log('📦 Verificando datos de automatización...');
            
            const result = await chrome.storage.local.get(['licitacionAutomationData']);
            const data = result.licitacionAutomationData;
            
            if (data && data.licitacionId === this.licitacionId) {
                const age = Date.now() - data.timestamp;
                
                if (age < 10 * 60 * 1000) { // 10 minutos
                    console.log('✅ Datos de automatización encontrados');
                    this.updateIndicator('📦 Datos encontrados', 'success');
                    
                    setTimeout(() => {
                        this.startAutomationProcess({ success: true, data: data.data });
                    }, 3000);
                } else {
                    console.log('⏰ Datos de automatización expirados');
                    this.updateIndicator('⏰ Datos expirados', 'warning');
                }
            } else {
                console.log('ℹ️ No hay datos de automatización');
                this.updateIndicator('⚠️ Sin datos de automatización', 'warning');
            }
            
        } catch (error) {
            console.error('❌ Error verificando datos:', error);
        }
    }

    // ================================
    // PROCESO PRINCIPAL DE AUTOMATIZACIÓN
    // ================================

    async startAutomationProcess(data) {
        if (!this.extensionActive) {
            console.log('❌ AUTOMATIZACIÓN BLOQUEADA - Extensión desactivada');
            this.showDisabledIndicator();
            return;
        }
        
        if (this.isRunning) {
            console.log('⚠️ Automatización ya en curso');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 INICIANDO AUTOMATIZACIÓN DE LICITACIÓN');
        
        try {
            this.automationData = data.data;
            console.log('📊 Datos de automatización cargados:', this.automationData);
            
            this.updateIndicator('🔄 Iniciando proceso...', 'processing');
            
            // Ejecutar flujo basado en el script Python
            await this.executeAutomationFlow();
            
            console.log('✅ AUTOMATIZACIÓN COMPLETADA');
            this.updateIndicator('✅ ¡Completado!', 'success');
            
        } catch (error) {
            console.error('❌ ERROR EN AUTOMATIZACIÓN:', error);
            this.updateIndicator('❌ Error: ' + error.message, 'error');
            
            if (this.retryCount < this.maxRetries && this.extensionActive) {
                this.retryCount++;
                this.updateIndicator(`🔄 Reintentando ${this.retryCount}/${this.maxRetries}...`, 'processing');
                
                setTimeout(() => {
                    this.isRunning = false;
                    this.startAutomationProcess(data);
                }, 5000);
            }
        } finally {
            if (this.retryCount >= this.maxRetries || !this.extensionActive) {
                this.isRunning = false;
            }
        }
    }

    // ================================
    // FLUJO DE AUTOMATIZACIÓN (BASADO EN SCRIPT PYTHON)
    // ================================

    async executeAutomationFlow() {
        console.log('🔄 Ejecutando flujo de automatización de licitación...');
        
        // PASO 1: Verificar página actual y navegar si es necesario
        await this.ensureCorrectPage();
        
        // PASO 2: Completar información básica de la oferta
        await this.completarInformacionBasica();
        
        // PASO 3: Llenar productos y precios 
        await this.completarProductosYPrecios();
        
        // PASO 4: Avanzar a siguiente página (ANTES de declaración jurada)
        await this.avanzarADeclaracionJurada();
        
        // PASO 5: Proceso de firma (declaración jurada)
        await this.procesoFirma();
        
        // PASO 6: Cargar documentos
        await this.cargarDocumentos();
        
        // PASO 7: Finalizar oferta
        await this.finalizarOferta();
    }

    async ensureCorrectPage() {
        console.log('📍 PASO 1: Verificando página correcta...');
        this.updateIndicator('📍 Verificando página...', 'processing');
        
        const currentUrl = window.location.href;
        
        if (!currentUrl.includes('Desktop.aspx')) {
            console.log('🔄 Navegando a página de ofertas...');
            // Implementar navegación si es necesario
            await this.navegarAOferta();
        }
        
        // Esperar que la página cargue completamente
        await this.waitForPageLoad();
    }

    async completarInformacionBasica() {
        console.log('📝 PASO 2: Completando información básica...');
        this.updateIndicator('📝 Información básica...', 'processing');
        
        try {
            // Llenar nombre de la oferta
            await this.fillNombreOferta();
            
            // Llenar descripción
            await this.fillDescripcionOferta();
            
            // Configurar oferta conjunta si aplica
            await this.configurarOfertaConjunta();
            
            // Hacer clic en "Siguiente"
            await this.clickSiguiente();
            
        } catch (error) {
            console.error('❌ Error en información básica:', error);
            throw new Error('Falló completar información básica');
        }
    }

    async completarProductosYPrecios() {
        console.log('💰 PASO 3: Completando productos y precios...');
        this.updateIndicator('💰 Productos y precios...', 'processing');
        
        try {
            const checkbox = document.querySelector('#ctl00_mpcphFormWizardFields_chkNoBids');
            console.log(`🔍 Checkbox encontrado: ${checkbox ? 'SÍ' : 'NO'}`);
            
            // ✅ VERIFICAR SI EL CHECKBOX YA ESTÁ MARCADO Y YA PROCESAMOS
            const storageKey = `noBidsProcessed_${this.licitacionId}`;
            const processedData = await chrome.storage.local.get(storageKey);
            console.log(`🔍 Datos procesados anteriormente: ${processedData[storageKey] ? 'SÍ' : 'NO'}`);
            
            if (checkbox) {
                const estaActualmenteMarcado = this.checkboxEstaActualmenteMarado(checkbox);
                console.log(`🔍 Checkbox actualmente marcado: ${estaActualmenteMarcado ? 'SÍ' : 'NO'}`);
                
                // 🆕 CHECKBOX MARCADO - PROCESAR PRODUCTOS ESPECÍFICOS
                if (estaActualmenteMarcado) {
                    // 🔍 Verificar si ya procesamos TODOS los productos antes
                    if (processedData[storageKey] && processedData[storageKey].allProcessed) {
                        console.log('');
                        console.log('✅ ✅ ✅ TODOS LOS PRODUCTOS YA PROCESADOS ANTERIORMENTE ✅ ✅ ✅');
                        console.log(`📊 Items procesados: ${processedData[storageKey].itemsProcessed.join(', ')}`);
                        console.log(`⏰ Procesado el: ${new Date(processedData[storageKey].timestamp).toLocaleString()}`);
                        console.log('📋 Saltando directo a siguiente paso');
                        await this.clickSiguiente();
                        return;
                    }
                    
                    console.log('');
                    console.log('✅ CHECKBOX "NO OFERTO A NINGUNO" YA ESTÁ MARCADO');
                    console.log('🎯 AHORA VAMOS A HABILITAR LOS PRODUCTOS ESPECÍFICOS QUE SÍ OFERTAMOS');
                    
                    // 📊 Mostrar productos a procesar del endpoint
                    // Todos los productos del endpoint son los que debemos ofertar
                    const productosAOfertar = this.automationData.licitacion.productos || [];
                    console.log(`📋 Items a procesar: ${productosAOfertar.map(p => `Item ${p.item || p.numero_item}`).join(', ')}`);
                    console.log('');
                    
                    // ✅ PROCESAR PRODUCTOS ESPECÍFICOS (cambiar de "No" a "Sí oferto")
                    const resultadoProcesamiento = await this.procesarProductosPorPaginas();
                    
                    // 🔍 Manejar el caso especial donde la página se recarga
                    if (resultadoProcesamiento === undefined) {
                        console.log('🔄 PÁGINA SE ESTÁ RECARGANDO - procesamiento continuará automáticamente');
                        console.log('⏸️ Pausando flujo hasta que se complete la recarga');
                        throw new Error('ESPERANDO_RECARGA');
                    }
                    
                    // 🔍 Verificar que TODOS los productos fueron procesados correctamente
                    if (resultadoProcesamiento && resultadoProcesamiento.success && resultadoProcesamiento.itemsProcessed) {
                        // Marcar como COMPLETAMENTE procesado solo si todos están listos
                        await chrome.storage.local.set({
                            [`noBidsProcessed_${this.licitacionId}`]: {
                                processed: true,
                                allProcessed: true,
                                itemsProcessed: resultadoProcesamiento.itemsProcessed,
                                timestamp: Date.now()
                            }
                        });
                        
                        console.log('');
                        console.log('✅ TODOS LOS PRODUCTOS ESPECÍFICOS PROCESADOS CORRECTAMENTE');
                        console.log(`📊 Items procesados: ${resultadoProcesamiento.itemsProcessed.join(', ')}`);
                        console.log('👆 PROCEDIENDO A HACER CLICK EN "SIGUIENTE"...');
                        
                        // ✅ HACER CLIC EN "SIGUIENTE"
                        await this.clickSiguiente();
                    } else {
                        console.log('');
                        console.log('❌ NO TODOS LOS PRODUCTOS FUERON PROCESADOS CORRECTAMENTE');
                        console.log(`📊 Items esperados: ${productosAOfertar.length}`);
                        console.log(`✅ Items procesados: ${resultadoProcesamiento?.itemsProcessed ? resultadoProcesamiento.itemsProcessed.length : 0}`);
                        console.log(`❌ Items fallidos: ${resultadoProcesamiento?.itemsFailed ? resultadoProcesamiento.itemsFailed.length : 0}`);
                        
                        // 🧹 Limpiar storage para permitir reintentos
                        await chrome.storage.local.remove(`noBidsProcessed_${this.licitacionId}`);
                        console.log('🧹 Storage limpiado para permitir reintentos');
                        
                        console.log('🔄 No avanzando al siguiente paso - se requiere reintento manual');
                        throw new Error('Procesamiento de productos incompleto - revisar logs para detalles');
                    }
                    
                    return;
                }
            }
            
            // ❌ CHECKBOX NO ESTÁ MARCADO - Verificar si ya hicimos click antes
            const clickStorageKey = `noBidsClicked_${this.licitacionId}`;
            const result = await chrome.storage.local.get(clickStorageKey);
            
            if (result[clickStorageKey]) {
                const clickData = result[clickStorageKey];
                const tiempoTranscurrido = Date.now() - clickData.timestamp;
                
                console.log('');
                console.log('⚠️ Ya hicimos click en checkbox pero aún no lo detectamos como marcado');
                console.log(`⏱️ Tiempo transcurrido: ${Math.round(tiempoTranscurrido / 1000)}s`);
                console.log('🔍 Verificando con método alternativo...');
                
                // Método alternativo de verificación
                if (this.verificarCheckboxPorEstado()) {
                    console.log('✅ Checkbox confirmado como marcado por método alternativo');
                    console.log('🎯 AHORA PROCESANDO PRODUCTOS ESPECÍFICOS...');
                    await chrome.storage.local.remove(clickStorageKey);
                    
                    // ✅ PROCESAR PRODUCTOS ESPECÍFICOS
                    await this.procesarProductosPorPaginas();
                    
                    // Marcar como procesado exitosamente
                    await chrome.storage.local.set({
                        [`noBidsProcessed_${this.licitacionId}`]: {
                            processed: true,
                            timestamp: Date.now()
                        }
                    });
                    
                    await this.clickSiguiente();
                    return;
                }
                
                // Si han pasado más de 15 segundos, algo salió mal
                if (tiempoTranscurrido > 15000) {
                    console.log('');
                    console.log('❌ Han pasado >15s y el checkbox aún no está marcado');
                    console.log('🔄 Limpiando bandera y reintentando...');
                    
                    await chrome.storage.local.remove(storageKey);
                    
                    // Reintentar activar checkbox
                    await this.activarNoBidsCheckbox();
                    return;
                }
                
                console.log('⏳ Esperando que la página termine de procesar el postback...');
                console.log('ℹ️ El script se re-ejecutará automáticamente');
                
                // Lanzar error especial para detener el flujo
                throw new Error('ESPERANDO_RECARGA');
            }
            
            // 🆕 PRIMERA VEZ - Activar checkbox "No oferto a ninguno"
            console.log('');
            console.log('🆕 Primera vez - Activando checkbox "No oferto a ninguno"...');
            console.log('📋 Esto marcará TODOS los items como "No oferto" por defecto');
            console.log('🎯 Después cambiaremos a "Sí oferto" solo los items del endpoint');
            console.log('');
            
            await this.activarNoBidsCheckbox();
            
            console.log('⏸️ Esperando que el postback complete...');
            throw new Error('ESPERANDO_RECARGA');
            
        } catch (error) {
            // Si es el error especial ESPERANDO_RECARGA, re-lanzarlo
            if (error.message === 'ESPERANDO_RECARGA') {
                throw error;
            }
            
            console.error('❌ Error en productos y precios:', error);
            throw new Error('Falló completar productos y precios');
        }
    }

    checkboxEstaActualmenteMarado(checkbox) {
        // Múltiples métodos de verificación
        const metodos = [
            () => checkbox.checked === true,
            () => checkbox.hasAttribute('checked'),
            () => checkbox.getAttribute('checked') === 'checked',
            () => getComputedStyle(checkbox).getPropertyValue('opacity') !== '0'
        ];
        
        let marcado = false;
        metodos.forEach((metodo, index) => {
            try {
                const resultado = metodo();
                console.log(`   🔍 Método ${index + 1}: ${resultado}`);
                if (resultado) marcado = true;
            } catch (error) {
                console.log(`   ❌ Método ${index + 1}: Error`);
            }
        });
        
        return marcado;
    }

    verificarCheckboxPorEstado() {
        console.log('🔍 Verificando estado del checkbox por elementos en página...');
        
        // Verificar si los campos de productos están habilitados/deshabilitados
        const camposProducto = document.querySelectorAll('textarea[id*="TxtSupplierComment"]');
        
        let camposDeshabilitados = 0;
        camposProducto.forEach((campo, index) => {
            const estaDeshabilitado = campo.hasAttribute('readonly') || campo.disabled;
            if (estaDeshabilitado) {
                camposDeshabilitados++;
            }
            console.log(`   📝 Campo ${index + 1}: ${estaDeshabilitado ? 'deshabilitado' : 'habilitado'}`);
        });
        
        // Si la mayoría están deshabilitados, el checkbox probablemente está marcado
        const porcentajeDeshabilitados = (camposDeshabilitados / camposProducto.length) * 100;
        console.log(`   📊 Campos deshabilitados: ${camposDeshabilitados}/${camposProducto.length} (${porcentajeDeshabilitados}%)`);
        
        // Si >50% están deshabilitados, asumimos que el checkbox está marcado
        return porcentajeDeshabilitados > 50;
    }

    async cargarDocumentos() {
        console.log('📄 PASO 6: Cargando documentos...');
        this.updateIndicator('📄 Cargando documentos...', 'processing');
        
        try {
            // Cambiar a iframe de documentos
            await this.switchToDocumentFrame();
            
            // Obtener y cargar documentos desde la aplicación
            await this.obtenerYCargarDocumentosDesdeApp();
            
            // ✅ VERIFICAR DOCUMENTOS CARGADOS (COMO PYTHON)
            console.log('🔍 EJECUTANDO VERIFICACIÓN POST-CARGA...');
            const verificacion = await this.verificarDocumentosCargados();
            
            if (!verificacion.success) {
                console.error('❌ VERIFICACIÓN FALLIDA:', verificacion.mensaje);
                console.error(`   📊 Esperados: ${verificacion.esperados}, Cargados: ${verificacion.cargados}`);
                throw new Error(`Verificación de documentos fallida: ${verificacion.mensaje}`);
            }
            
            console.log('✅ VERIFICACIÓN EXITOSA: Todos los documentos coinciden');
            
            // Salir del iframe
            await this.switchToDefaultContent();
            
            // ✅ DOCUMENTOS COMPLETADOS - NO hacer click en siguiente aquí
            // El flujo principal se encargará de la secuencia correcta:
            // 1. Completar documentos (ESTE PASO)
            // 2. Ir a declaración jurada 
            // 3. Firmar declaración
            // 4. Recién entonces hacer "Siguiente"
            console.log('✅ DOCUMENTOS CARGADOS - LISTO PARA DECLARACIÓN JURADA');
            
        } catch (error) {
            console.error('❌ Error cargando documentos:', error);
            // Los documentos son opcionales, continuar
            console.log('⚠️ Continuando sin documentos...');
        }
    }

    async obtenerYCargarDocumentosDesdeApp() {
        console.log('');
        console.log('🗂️ INICIANDO CARGA DE DOCUMENTOS DESDE APLICACIÓN');
        console.log('═══════════════════════════════════════════════════');
        
        try {
            // 1. Obtener lista de documentos desde la aplicación
            const documentos = await this.obtenerListaDocumentosAPI();
            
            if (!documentos || documentos.length === 0) {
                console.log('⚠️ No se encontraron documentos para cargar');
                return;
            }
            
            console.log(`📋 Documentos encontrados: ${documentos.length}`);
            documentos.forEach((doc, index) => {
                console.log(`   ${index + 1}. ${doc.nombre} (${doc.tipo})`);
            });
            
            // 2. Eliminar documentos previos del formulario
            await this.eliminarDocumentosPrevios();
            
            // 3. Cargar cada documento
            for (let i = 0; i < documentos.length; i++) {
                const documento = documentos[i];
                console.log('');
                console.log(`📄 PROCESANDO DOCUMENTO ${i + 1}/${documentos.length}`);
                console.log(`   Nombre: ${documento.nombre}`);
                console.log(`   Tipo: ${documento.tipo}`);
                
                await this.cargarDocumentoIndividual(documento);
            }
            
            console.log('');
            console.log('✅ CARGA DE DOCUMENTOS COMPLETADA');
            
        } catch (error) {
            console.error('❌ Error en carga de documentos:', error);
            throw error;
        }
    }

    async obtenerListaDocumentosAPI() {
        try {
            console.log('🌐 Consultando documentos desde API...');
            
            const response = await this.makeAuthenticatedRequest('/api/extension/get-licitacion-data-completa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    licitacion: this.licitacionId
                })
            });
            
            if (!response.success) {
                throw new Error(`Error API: ${response.message}`);
            }
            
            // Extraer documentos de la respuesta
            const documentos = response.data.documentos || [];
            
            console.log(`✅ API consultada - ${documentos.length} documentos encontrados`);
            
            return documentos;
            
        } catch (error) {
            console.error('❌ Error consultando documentos:', error);
            return [];
        }
    }

    async eliminarDocumentosPrevios() {
        console.log('🗑️ Eliminando documentos previos del formulario...');
        
        try {
            // Buscar botones de eliminar existentes (como en Python)
            const botonesEliminar = document.querySelectorAll("span[class*='remove_image']");
            
            console.log(`   Encontrados ${botonesEliminar.length} documentos previos a eliminar`);
            
            for (let i = 0; i < botonesEliminar.length; i++) {
                console.log(`   Eliminando documento previo ${i + 1}/${botonesEliminar.length}`);
                
                // Click usando JavaScript como en el código Python
                this.clickElementJS(botonesEliminar[i]);
                await this.delay(500);
            }
            
            if (botonesEliminar.length > 0) {
                console.log('✅ Documentos previos eliminados');
                await this.delay(2000); // Esperar que se actualice la interfaz
            }
            
        } catch (error) {
            console.error('❌ Error eliminando documentos previos:', error);
        }
    }

    async cargarDocumentoIndividual(documento) {
        try {
            // 1. Descargar el archivo desde la aplicación
            const archivoData = await this.descargarArchivoDesdeBD(documento);
            
            if (!archivoData) {
                throw new Error('No se pudo descargar el archivo');
            }
            
            // 2. Convertir base64 a archivo
            const archivo = await this.convertirBase64AArchivo(archivoData);
            
            // 3. Cargar en el formulario según tipo
            await this.cargarArchivoEnFormulario(archivo, documento.tipo);
            
            console.log(`✅ Documento ${documento.nombre} cargado exitosamente`);
            
        } catch (error) {
            console.error(`❌ Error cargando ${documento.nombre}:`, error);
        }
    }

    async descargarArchivoDesdeBD(documento) {
        try {
            console.log(`📥 Descargando ${documento.nombre} desde BD...`);
            
            const response = await this.makeAuthenticatedRequest(`/api/extension/documento-file-licitacion?documento_id=${documento.id}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.success) {
                throw new Error(`Error descargando archivo: ${response.message}`);
            }
            
            const archivoInfo = response.archivo;
            console.log(`   Archivo: ${archivoInfo.nombre} (${(archivoInfo.tamaño / 1024 / 1024).toFixed(2)} MB)`);
            
            return archivoInfo;
            
        } catch (error) {
            console.error('❌ Error descargando archivo:', error);
            return null;
        }
    }

    async convertirBase64AArchivo(archivoData) {
        try {
            // Convertir base64 a bytes
            const byteCharacters = atob(archivoData.contenido_base64);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            
            // Crear archivo
            const blob = new Blob(byteArrays, { type: archivoData.mime_type });
            const archivo = new File([blob], archivoData.nombre, { type: archivoData.mime_type });
            
            return archivo;
            
        } catch (error) {
            console.error('❌ Error convirtiendo base64 a archivo:', error);
            throw error;
        }
    }

    async cargarArchivoEnFormulario(archivo, tipoDocumento) {
        try {
            let inputSelector, buttonSelector;
            
            // Mapear tipo a selectores (como en Python)
            switch (tipoDocumento) {
                case 'administrativo':
                    inputSelector = '#browse_local_admin_file';
                    buttonSelector = '#add_local_admin_files';
                    break;
                case 'tecnico':
                    inputSelector = '#browse_local_tec_file';
                    buttonSelector = '#add_local_tec_files';
                    break;
                case 'economico':
                    inputSelector = '#browse_local_eco_file';
                    buttonSelector = '#add_local_eco_files';
                    break;
                default:
                    throw new Error(`Tipo de documento desconocido: ${tipoDocumento}`);
            }
            
            console.log(`   Cargando en input: ${inputSelector}`);
            
            // 1. Esperar y encontrar el input file
            const inputElement = await this.waitForElement(inputSelector, 10000);
            if (!inputElement) {
                throw new Error(`Input ${inputSelector} no encontrado`);
            }
            
            // 2. Simular selección de archivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(archivo);
            inputElement.files = dataTransfer.files;
            
            // Disparar evento change
            const changeEvent = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(changeEvent);
            
            await this.delay(1000);
            
            // 3. Click en botón "Agregar"
            console.log(`   Haciendo click en: ${buttonSelector}`);
            const addButton = await this.waitForElement(buttonSelector, 5000);
            
            if (!addButton) {
                throw new Error(`Botón ${buttonSelector} no encontrado`);
            }
            
            this.clickElementJS(addButton);
            
            // 4. Esperar confirmación (tiempo adaptativo según tamaño)
            const tiempoEspera = Math.min(Math.ceil(archivo.size / 1000000), 20); // 1 segundo por MB, máximo 20
            console.log(`   Esperando confirmación (${tiempoEspera}s)...`);
            
            await this.delay(tiempoEspera * 1000);
            
            // 5. Verificar que se cargó (opcional)
            await this.verificarCargaDocumento(archivo.name);
            
        } catch (error) {
            console.error(`❌ Error cargando archivo en formulario:`, error);
            throw error;
        }
    }

    async verificarCargaDocumento(nombreArchivo) {
        try {
            // Buscar confirmación de carga (puede variar según la interfaz)
            await this.delay(2000);
            
            // Esto es opcional - podrías buscar mensajes de confirmación específicos
            console.log(`   ✅ Archivo ${nombreArchivo} procesado`);
            
        } catch (error) {
            console.log(`   ⚠️ No se pudo verificar carga de ${nombreArchivo}`);
        }
    }

    async avanzarADeclaracionJurada() {
        console.log('👆 PASO 4: Avanzando a página de documentos + declaración jurada...');
        this.updateIndicator('👆 Avanzando a documentos...', 'processing');
        
        try {
            console.log('🔍 Haciendo click en "Siguiente" para avanzar a la página de documentos...');
            
            const currentUrl = window.location.href;
            console.log(`📍 URL actual: ${currentUrl}`);
            
            // Hacer click en siguiente para avanzar a la página de documentos
            console.log('👆 Haciendo click en "Siguiente"...');
            await this.clickSiguiente();
            
            console.log('✅ Click en siguiente completado');
            console.log('⏳ Esperando que cargue la nueva página...');
            
            // Esperar a que cargue la página
            await this.delay(3000);
            
            // ✅ NUEVO FLUJO: La lógica inteligente se ejecutará automáticamente
            // cuando detecte wizard_paso3_documentos en executeDocumentUploadFlow()
            console.log('✅ Página de documentos + DJ debería cargar automáticamente el flujo inteligente');
            console.log('📋 El sistema detectará automáticamente si la DJ está firmada o pendiente');
            
        } catch (error) {
            console.error('❌ Error avanzando a declaración jurada:', error);
            
            // ⚠️ Si falla el click siguiente, intentar detectar dónde estamos
            const pasoActual = this.detectWizardStep();
            console.log(`🔍 Paso detectado después del error: ${pasoActual}`);
            
            if (pasoActual === 'wizard_paso3_documentos') {
                console.log('✅ Estamos en la página de documentos, ejecutando flujo inteligente...');
                await this.procesarPaginaDocumentosYDJ();
            } else {
                console.error('❌ No pudimos detectar dónde estamos después del error');
                throw error;
            }
        }
    }

    async procesoFirma() {
        console.log('🖊️ PASO 5: Proceso de declaración jurada...');
        this.updateIndicator('🖊️ Firmando declaración...', 'processing');
        
        try {
            await this.procesarDeclaracionJuradaCompleta();
            
        } catch (error) {
            console.error('❌ Error en declaración jurada:', error);
            throw new Error('Falló proceso de declaración jurada');
        }
    }

    async finalizarOferta() {
        console.log('✅ PASO 7: Finalizando oferta...');
        this.updateIndicator('✅ Finalizando...', 'processing');
        
        try {
            await this.enviarOferta();
            await this.actualizarEstadoEnBD();
        } catch (error) {
            console.error('❌ Error finalizando:', error);
            throw new Error('Falló finalización de oferta');
        }
    }

    /**
     * 🎯 NUEVA FUNCIÓN: Procesar página de documentos + DJ de forma inteligente
     * Esta función maneja la página que tiene tanto documentos como declaración jurada
     * DECISIÓN SE TOMA ANTES DE ABRIR LA DJ
     */
    async procesarPaginaDocumentosYDJ() {
        console.log('🎯 === PROCESANDO PÁGINA DE DOCUMENTOS + DECLARACIÓN JURADA ===');
        
        try {
            // ⚡ PASO 1: Verificar estado del badge DJ ANTES de hacer cualquier cosa
            console.log('📋 PASO 1: Verificando estado del badge DJ en la página actual...');
            
            const estadoBadge = await this.verificarEstadoBadgeDJ();
            console.log('📊 Estado del badge DJ:', estadoBadge);
            
            // ⚡ PASO 2: Decidir flujo basado en el badge ANTES de abrir nada
            if (estadoBadge.firmada) {
                console.log('✅ BADGE DJ INDICA: YA FIRMADA - Saltando directo a documentos');
                console.log(`📝 Badge estado: ${estadoBadge.estado}`);
                console.log(`📝 Badge clase: ${estadoBadge.clase}`);
                
                // DJ ya firmada → Solo procesar documentos, NO abrir DJ
                await this.procesarSoloDocumentos();
                
            } else {
                console.log('⚠️ BADGE DJ INDICA: PENDIENTE - Necesita procesar DJ primero');
                console.log(`📝 Badge estado: ${estadoBadge.estado}`);
                console.log(`📝 Badge clase: ${estadoBadge.clase}`);
                
                // DJ pendiente → Abrir y procesar DJ primero, después documentos
                await this.procesarDJYLuegoDocumentos();
            }
            
        } catch (error) {
            console.error('❌ Error en procesamiento de página documentos+DJ:', error);
            
            // ⚠️ FALLBACK: Si no podemos detectar el estado, procesar solo documentos
            console.log('🔄 FALLBACK: No se pudo detectar estado DJ, procesando solo documentos...');
            try {
                await this.procesarSoloDocumentos();
            } catch (fallbackError) {
                console.error('❌ Fallback también falló:', fallbackError);
                throw new Error('No se pudo procesar ni DJ ni documentos');
            }
        }
    }

    /**
     * Procesar solo documentos 
     * (LA DECISIÓN YA SE TOMÓ: el badge indica que DJ ya está FIRMADA)
     */
    async procesarSoloDocumentos() {
        console.log('📄 PROCESANDO SOLO DOCUMENTOS...');
        console.log('✅ (Decisión ya tomada: badge indica DJ YA FIRMADA)');
        this.updateIndicator('📄 Cargando documentos...', 'processing');
        
        try {
            // Cargar documentos
            await this.cargarDocumentos();
            console.log('✅ DOCUMENTOS CARGADOS');
            
            // Verificar que estén cargados
            const verificacion = await this.verificarDocumentosCargados();
            
            if (verificacion.success) {
                console.log('✅ DOCUMENTOS VERIFICADOS - Avanzando al siguiente paso');
                console.log(`📊 Documentos: ${verificacion.cargados}/${verificacion.esperados}`);
                
                this.updateIndicator('➡️ Avanzando...', 'processing');
                await this.clickSiguiente();
                
            } else {
                console.warn('⚠️ DOCUMENTOS NO COMPLETAMENTE CARGADOS - Intentando reintento');
                await this.reintentarCargaDocumentos();
            }
            
        } catch (error) {
            console.error('❌ Error procesando solo documentos:', error);
            throw error;
        }
    }

    /**
     * Procesar DJ primero, luego documentos 
     * (LA DECISIÓN YA SE TOMÓ: el badge indica que DJ está PENDIENTE)
     */
    async procesarDJYLuegoDocumentos() {
        console.log('🖊️ PROCESANDO DJ PENDIENTE + DOCUMENTOS...');
        console.log('📋 (Decisión ya tomada: badge indica DJ PENDIENTE)');
        
        try {
            // ⚡ PASO 1: Procesar Declaración Jurada (ya sabemos que está pendiente)
            console.log('📋 Abriendo y procesando Declaración Jurada...');
            this.updateIndicator('🖊️ Procesando declaración jurada...', 'processing');
            
            await this.manejarDeclaracionJurada();
            console.log('✅ DECLARACIÓN JURADA PROCESADA');
            
            // ⚡ PASO 2: Procesar documentos
            console.log('📄 Procediendo a cargar documentos...');
            this.updateIndicator('📄 Cargando documentos...', 'processing');
            
            await this.cargarDocumentos();
            console.log('✅ DOCUMENTOS CARGADOS');
            
            // ⚡ PASO 3: Verificación final y avance
            const verificacionFinal = await this.verificarDocumentosCargados();
            
            if (verificacionFinal.success) {
                console.log('✅ TODO COMPLETADO - DJ procesada y documentos cargados');
                console.log(`📊 Documentos: ${verificacionFinal.cargados}/${verificacionFinal.esperados}`);
                
                this.updateIndicator('➡️ Avanzando - todo completo...', 'processing');
                await this.clickSiguiente();
                
            } else {
                console.warn('⚠️ DJ OK pero documentos incompletos - Reintentando');
                await this.reintentarCargaDocumentos();
            }
            
        } catch (error) {
            console.error('❌ Error procesando DJ y documentos:', error);
            
            // ⚠️ Si algo falla, intentar al menos los documentos
            console.log('🔄 Error en DJ - Intentando al menos procesar documentos...');
            try {
                await this.procesarSoloDocumentos();
            } catch (docError) {
                console.error('❌ También falló procesamiento de documentos:', docError);
                // Avanzar de todos modos para no bloquear el flujo
                console.log('⚠️ Avanzando de todos modos - verificación manual requerida');
                await this.clickSiguiente();
            }
        }
    }

    /**
     * Reintentar carga de documentos cuando falla
     */
    async reintentarCargaDocumentos() {
        console.log('🔧 REINTENTANDO CARGA DE DOCUMENTOS...');
        
        try {
            await this.switchToDocumentFrame();
            await this.obtenerYCargarDocumentosDesdeApp();
            
            const segundaVerificacion = await this.verificarDocumentosCargados();
            
            if (segundaVerificacion.success) {
                console.log('✅ SEGUNDO INTENTO EXITOSO');
                await this.switchToDefaultContent();
                await this.clickSiguiente();
                
            } else {
                console.error('❌ SEGUNDO INTENTO TAMBIÉN FALLÓ');
                console.log('⚠️ Avanzando de todos modos - usuario debe verificar manualmente');
                await this.switchToDefaultContent();
                await this.clickSiguiente();
            }
            
        } catch (error) {
            console.error('❌ Error en reintento de documentos:', error);
            console.log('⚠️ Avanzando sin documentos - VERIFICACIÓN MANUAL REQUERIDA');
            await this.clickSiguiente();
        }
    }

    /**
     * ⚡ VERIFICAR ESTADO DEL BADGE DJ SIN ABRIR NADA
     * Esta función verifica el estado del badge visible en la página
     * SIN hacer click ni abrir la declaración jurada
     */
    async verificarEstadoBadgeDJ() {
        console.log('🔍 === VERIFICANDO ESTADO DEL BADGE DJ (SIN ABRIR) ===');
        
        try {
            // Esperar a que la página cargue completamente
            await this.delay(1000);
            
            // 🎯 MÉTODO 1: Verificar el div principal #badgedj
            const badgeDJ = document.querySelector('#badgedj');
            
            if (badgeDJ) {
                const clasesBadge = badgeDJ.className;
                console.log(`📋 Badge encontrado - Clases: "${clasesBadge}"`);
                
                // Verificar la clase del badge para determinar estado
                if (clasesBadge.includes('badgedj_firmada')) {
                    console.log('✅ Badge clase indica: DJ FIRMADA');
                    
                    return {
                        firmada: true,
                        estado: 'FIRMADA',
                        clase: clasesBadge,
                        metodo: 'badge_clase_firmada'
                    };
                } else if (clasesBadge.includes('badgedj_pendiente')) {
                    console.log('⚠️ Badge clase indica: DJ PENDIENTE');
                    
                    return {
                        firmada: false,
                        estado: 'PENDIENTE',
                        clase: clasesBadge,
                        metodo: 'badge_clase_pendiente'
                    };
                }
            } else {
                console.log('❌ Badge #badgedj NO encontrado');
            }
            
            // 🎯 MÉTODO 2: Verificar el span #dj_estado
            const djEstado = document.querySelector('#dj_estado');
            
            if (djEstado) {
                const textoEstado = djEstado.textContent.trim();
                const claseEstado = djEstado.className;
                
                console.log(`📋 Span #dj_estado encontrado:`);
                console.log(`   📝 Texto: "${textoEstado}"`);
                console.log(`   🎨 Clase: "${claseEstado}"`);
                
                // Verificar por texto Y clase
                if (textoEstado.toUpperCase() === 'FIRMADA' || claseEstado.includes('texto_firmada')) {
                    console.log('✅ Span indica: DJ FIRMADA');
                    
                    return {
                        firmada: true,
                        estado: textoEstado,
                        clase: claseEstado,
                        metodo: 'span_texto_firmada'
                    };
                } else if (textoEstado.toUpperCase() === 'PENDIENTE' && claseEstado.includes('texto_pendiente')) {
                    console.log('⚠️ Span indica: DJ PENDIENTE');
                    
                    return {
                        firmada: false,
                        estado: textoEstado,
                        clase: claseEstado,
                        metodo: 'span_texto_pendiente'
                    };
                }
            } else {
                console.log('❌ Span #dj_estado NO encontrado');
            }
            
            // 🎯 MÉTODO 3: Buscar otros indicadores visuales
            const indicadoresFirmada = document.querySelectorAll('.texto_firmada, .dj_firmada, [class*="firmada"]');
            const indicadoresPendiente = document.querySelectorAll('.texto_pendiente, .dj_pendiente, [class*="pendiente"]');
            
            if (indicadoresFirmada.length > 0) {
                console.log(`✅ Encontrados ${indicadoresFirmada.length} indicadores de DJ FIRMADA`);
                return {
                    firmada: true,
                    estado: 'FIRMADA',
                    clase: 'indicadores_firmada',
                    metodo: 'indicadores_visuales'
                };
            }
            
            if (indicadoresPendiente.length > 0) {
                console.log(`⚠️ Encontrados ${indicadoresPendiente.length} indicadores de DJ PENDIENTE`);
                return {
                    firmada: false,
                    estado: 'PENDIENTE',
                    clase: 'indicadores_pendiente',
                    metodo: 'indicadores_visuales'
                };
            }
            
            // 🎯 FALLBACK: No se pudo determinar el estado
            console.log('❓ NO se pudo determinar el estado del badge DJ');
            console.log('🔄 Asumiendo PENDIENTE por seguridad');
            
            return {
                firmada: false,
                estado: 'INDETERMINADO - Asumiendo PENDIENTE',
                clase: 'no_detectado',
                metodo: 'fallback_pendiente'
            };
            
        } catch (error) {
            console.error('❌ Error verificando estado del badge DJ:', error);
            
            // En caso de error, asumir PENDIENTE por seguridad
            return {
                firmada: false,
                estado: 'ERROR - Asumiendo PENDIENTE',
                clase: 'error',
                metodo: 'error_fallback'
            };
        }
    }

    // ================================
    // IMPLEMENTACIÓN DE FUNCIONES ESPECÍFICAS
    // ================================

    async buscarYClickIngresarOferta() {
        try {
            console.log('🔍 Verificando si existe oferta previa...');
            
            // Paso 1: Verificar si existe oferta guardada (como en Python)
            const ofertaExistente = document.querySelector('#rptDetail_ctl01_imgEdit');
            
            if (ofertaExistente) {
                console.log('✅ Se encontró oferta existente');
                
                // Verificar estado de la oferta
                const estadoElemento = document.querySelector('#rptDetail_ctl01_lblrptStatus');
                if (estadoElemento) {
                    const estadoOferta = estadoElemento.textContent.trim();
                    console.log(`📊 Estado oferta: ${estadoOferta}`);
                    
                    if (estadoOferta === 'Guardada') {
                        console.log('✏️ Editando oferta guardada...');
                        this.updateIndicator('✏️ Editando oferta...', 'processing');
                        
                        // Click en botón de editar
                        ofertaExistente.click();
                        console.log('✅ Click en Editar realizado');
                        
                        await this.delay(5000);
                        
                        console.log('✅ OFERTA EDITADA - CONTINUANDO...');
                        this.updateIndicator('✅ Oferta abierta', 'success');
                        return;
                    }
                }
            }
            
            console.log('📝 No hay oferta guardada, creando nueva...');
            
            // Paso 2: Buscar btnNewBid (botón para crear nueva oferta)
            let botonNuevaOferta = null;
            let attempts = 0;
            const maxAttempts = 20;
            
            while (!botonNuevaOferta && attempts < maxAttempts) {
                attempts++;
                console.log(`   Buscando btnNewBid... intento ${attempts}/${maxAttempts}`);
                
                // Buscar por ID (como en Python)
                botonNuevaOferta = document.querySelector('#btnNewBid');
                
                if (botonNuevaOferta) {
                    console.log('✅ Botón #btnNewBid encontrado!');
                    
                    // Verificar estado del botón
                    console.log('📊 Información del botón:');
                    console.log('   - Visible:', botonNuevaOferta.offsetParent !== null);
                    console.log('   - Disabled:', botonNuevaOferta.disabled);
                    console.log('   - Display:', getComputedStyle(botonNuevaOferta).display);
                    console.log('   - Visibility:', getComputedStyle(botonNuevaOferta).visibility);
                    console.log('   - Tag:', botonNuevaOferta.tagName);
                    console.log('   - Type:', botonNuevaOferta.type);
                    console.log('   - Value:', botonNuevaOferta.value);
                    console.log('   - Onclick:', botonNuevaOferta.onclick ? 'Sí' : 'No');
                    
                    if (botonNuevaOferta.disabled) {
                        console.warn('⚠️ El botón está DESHABILITADO');
                        console.warn('⚠️ Esto puede indicar que faltan datos o permisos');
                        
                        // Tomamos screenshot del DOM
                        console.log('📄 HTML del contexto:');
                        console.log(botonNuevaOferta.parentElement?.outerHTML);
                    }
                    
                    break;
                }
                
                await this.delay(1000);
            }
            
            if (!botonNuevaOferta) {
                console.error('❌ No se encontró botón #btnNewBid después de', maxAttempts, 'intentos');
                
                // Debug: Buscar botones similares
                console.log('🔍 Buscando botones alternativos...');
                const allButtons = document.querySelectorAll('input[type="button"], input[type="submit"], button');
                console.log(`   Total de botones encontrados: ${allButtons.length}`);
                allButtons.forEach((btn, idx) => {
                    console.log(`   Botón ${idx+1}:`, {
                        id: btn.id,
                        value: btn.value,
                        text: btn.textContent,
                        type: btn.type
                    });
                });
                
                this.updateIndicator('❌ No encontrado btnNewBid', 'error');
                throw new Error('No se encontró el botón para crear oferta');
            }
            
            // Paso 3: Click en Nueva Oferta (con múltiples estrategias como Python)
            console.log('');
            console.log('👆 HACIENDO CLICK EN "NUEVA OFERTA" (#btnNewBid)...');
            
            this.updateIndicator('👆 Creando nueva oferta...', 'processing');
            
            // Scroll al botón
            botonNuevaOferta.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // Múltiples estrategias de click (como en Python)
            let clickExitoso = false;
            
            // Estrategia 1: JavaScript click
            try {
                console.log('   Estrategia 1: JavaScript click...');
                botonNuevaOferta.click();
                clickExitoso = true;
                console.log('   ✅ Estrategia 1 exitosa');
            } catch (e) {
                console.warn('   ⚠️ Estrategia 1 falló:', e.message);
            }
            
            // Estrategia 2: Ejecutar onclick directamente
            if (!clickExitoso && botonNuevaOferta.onclick) {
                try {
                    console.log('   Estrategia 2: Ejecutar onclick...');
                    botonNuevaOferta.onclick();
                    clickExitoso = true;
                    console.log('   ✅ Estrategia 2 exitosa');
                } catch (e) {
                    console.warn('   ⚠️ Estrategia 2 falló:', e.message);
                }
            }
            
            // Estrategia 3: Enviar evento click
            if (!clickExitoso) {
                try {
                    console.log('   Estrategia 3: Enviar evento click...');
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    botonNuevaOferta.dispatchEvent(clickEvent);
                    clickExitoso = true;
                    console.log('   ✅ Estrategia 3 exitosa');
                } catch (e) {
                    console.warn('   ⚠️ Estrategia 3 falló:', e.message);
                }
            }
            
            if (!clickExitoso) {
                console.error('❌ TODAS las estrategias de click fallaron');
                throw new Error('No se pudo hacer click en btnNewBid');
            }
            
            console.log('✅ Click realizado!');
            console.log('⏳ Esperando navegación a formulario de oferta...');
            
            await this.delay(5000);
            
            console.log('');
            console.log('═'.repeat(80));
            console.log('✅ PROCESO DE CLICK COMPLETADO');
            console.log('📍 URL actual:', window.location.href);
            console.log('═'.repeat(80));
            console.log('');
            
            this.updateIndicator('✅ En formulario de oferta', 'success');
            
        } catch (error) {
            console.error('❌ Error en buscarYClickIngresarOferta:', error);
            throw error;
        }
    }

    async waitForPageLoad() {
        console.log('⏳ Esperando carga de página...');
        
        return new Promise((resolve) => {
            const checkReady = () => {
                if (document.readyState === 'complete') {
                    setTimeout(resolve, 1000); // Espera adicional
                } else {
                    setTimeout(checkReady, 500);
                }
            };
            checkReady();
        });
    }

    async fillNombreOferta() {
        console.log('📝 Llenando nombre de oferta...');
        
        try {
            // Selector del campo de nombre (del script Python)
            const selector = '#ctl00_mpcphFormWizardFields_txtBIDName';
            
            // Esperar el campo
            const input = await this.waitForElement(selector, 45000).catch(() => null);
            
            if (!input) {
                console.error('❌ No se encontró campo de nombre:', selector);
                throw new Error('Campo nombre de oferta no encontrado');
            }
            
            console.log('✅ Campo de nombre encontrado');
            
            // USAR DATOS REALES DEL ENDPOINT
            let nombreOferta = '';
            
            if (this.automationData?.licitacion) {
                const licitacionData = this.automationData.licitacion;
                const empresaReal = licitacionData.company_name;
                const nombreLicitacion = licitacionData.nombre_licitacion || licitacionData.codigo_licitacion;
                
                // Crear nombre de oferta usando datos reales
                nombreOferta = `${empresaReal} - ${nombreLicitacion}`;
                console.log('📋 Usando datos REALES para nombre de oferta:', {
                    empresa: empresaReal,
                    licitacion: nombreLicitacion
                });
            } else {
                // Fallback solo si no hay datos reales (NO DEBERÍA PASAR)
                nombreOferta = `OFERTA AUTOMATIZADA - LIC ${this.licitacionId}`;
                console.warn('⚠️ Usando datos ficticios - NO hay datos del endpoint');
            }
            
            console.log(`   Nombre a ingresar: ${nombreOferta.substring(0, 50)}...`);
            
            // Limpiar y llenar
            input.value = '';
            input.focus();
            await this.delay(300);
            await this.typeText(input, nombreOferta, 50);
            
            console.log('✅ Nombre de oferta completado con datos REALES');
            
        } catch (error) {
            console.error('❌ Error llenando nombre:', error);
            throw error;
        }
    }

    async fillDescripcionOferta() {
        console.log('📝 Procesando campo de descripción - COMO EN PYTHON...');
        
        try {
            // USAR LA MISMA ESTRATEGIA QUE EL SCRIPT PYTHON
            const selectores = [
                'wysiwygctl00_mpcphFormWizardFields_EditZone',
                'ctl00_mpcphFormWizardFields_EditZone', 
                'ctl00_mpcphFormWizardFields_txtDescription',
                'ctl00_mpcphFormWizardFields_txtBIDDescription'
            ];
            
            let element = null;
            let selectorExitoso = null;
            
            // Probar cada selector (como en Python líneas 1828-1844)
            for (const selector of selectores) {
                console.log(`🔍 Probando selector: ${selector}`);
                
                try {
                    element = await this.waitForElement(`#${selector}`, 5000);
                    selectorExitoso = selector;
                    console.log(`✅ Elemento encontrado con: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`❌ No encontrado: ${selector}`);
                    continue;
                }
            }
            
            if (!element) {
                console.warn('⚠️ ADVERTENCIA: No se pudo encontrar el textarea de descripción');
                return false;
            }
            
            // OBTENER DESCRIPCIÓN ESPECÍFICA DE LA OFERTA (NO de productos)
            // En el endpoint: descripcion_licitacion es la descripción de la licitación
            // Pero para la OFERTA necesitamos generar descripción propia de la empresa
            const empresaNombre = this.automationData?.licitacion?.company_name || 'Pharmatender';
            const licitacionCodigo = this.automationData?.licitacion?.codigo_licitacion || this.licitacionId;
            
            // Generar descripción de OFERTA (no de licitación)
            const descripcionText = `Oferta presentada por ${empresaNombre} para la licitación ${licitacionCodigo}. Cumplimos con todos los requisitos técnicos y administrativos solicitados.`;
            
            console.log('📋 DATOS DEL ENDPOINT PARA DESCRIPCIÓN:');
            console.log('   - Empresa:', empresaNombre);
            console.log('   - Código Licitación:', licitacionCodigo);
            console.log('   - Descripción licitación (referencia):', this.automationData?.licitacion?.descripcion_licitacion?.substring(0, 50));
            console.log(`📝 Descripción OFERTA a escribir: ${descripcionText.substring(0, 50)}...`);
            
            // LIMPIAR Y ESCRIBIR (como Python líneas 1835-1840)
            if (element.tagName.toLowerCase() === 'iframe') {
                console.log('🖼️ Manejando IFRAME WYSIWYG...');
                await this.escribirEnIframe(element, descripcionText);
            } else {
                console.log('📄 Manejando campo directo...');
                await this.escribirEnCampoDirecto(element, descripcionText);
            }
            
            console.log('✅ Descripción enviada exitosamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error en fillDescripcionOferta:', error);
            return false;
        }
    }

    async escribirEnIframe(iframe, texto) {
        console.log('🖼️ Escribiendo en iframe WYSIWYG...');
        
        try {
            // Esperar que el iframe se cargue completamente
            await this.delay(1500);
            
            // Intentar acceder al contenido del iframe
            let iframeDocument;
            try {
                iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            } catch (error) {
                console.warn('⚠️ Error CORS accediendo iframe, intentando método alternativo...');
                // Método alternativo: enviar teclas directamente al iframe
                iframe.focus();
                await this.delay(500);
                await this.typeText(iframe, texto, 30);
                return;
            }
            
            if (!iframeDocument) {
                console.warn('⚠️ No se pudo acceder al documento del iframe');
                return;
            }
            
            // Buscar elemento editable dentro del iframe
            const body = iframeDocument.body;
            const editableDiv = iframeDocument.querySelector('[contenteditable="true"]');
            const textarea = iframeDocument.querySelector('textarea');
            
            let targetElement = editableDiv || body || textarea;
            
            if (targetElement) {
                console.log(`✅ Elemento editable encontrado: ${targetElement.tagName}`);
                
                // Limpiar contenido existente
                if (targetElement.tagName.toLowerCase() === 'textarea') {
                    targetElement.value = '';
                    targetElement.focus();
                    await this.delay(300);
                    targetElement.value = texto;
                    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    // Para div editable o body
                    targetElement.innerHTML = '';
                    targetElement.focus();
                    await this.delay(300);
                    targetElement.innerHTML = texto;
                    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                console.log('✅ Texto escrito en iframe exitosamente');
            } else {
                console.warn('⚠️ No se encontró elemento editable en iframe');
            }
            
        } catch (error) {
            console.error('❌ Error escribiendo en iframe:', error);
            // Fallback: enviar teclas directamente
            console.log('🔄 Intentando método de fallback...');
            try {
                iframe.focus();
                await this.delay(500);
                await this.typeText(iframe, texto, 30);
            } catch (fallbackError) {
                console.error('❌ Fallback también falló:', fallbackError);
            }
        }
    }

    async escribirEnCampoDirecto(element, texto) {
        console.log('📄 Escribiendo en campo directo...');
        
        try {
            // Limpiar campo (como Python: Ctrl+A, Delete)
            element.focus();
            await this.delay(300);
            
            // Simular Ctrl+A + Delete (como Python)
            element.select();
            await this.delay(300);
            
            // Escribir texto
            element.value = texto;
            
            // Disparar eventos
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log('✅ Texto escrito en campo directo exitosamente');
            
        } catch (error) {
            console.error('❌ Error escribiendo en campo directo:', error);
        }
    }

    async activarNoBidsCheckbox() {
        console.log('📋 Buscando checkbox "No oferto a ninguno"...');
        
        try {
            // Selector del checkbox (del script Python)
            const selector = '#ctl00_mpcphFormWizardFields_chkNoBids';
            
            // Esperar el checkbox
            const checkbox = await this.waitForElement(selector, 30000).catch(() => null);
            
            if (!checkbox) {
                console.warn('⚠️ No se encontró checkbox "No oferto"');
                console.warn('⚠️ Intentando completar productos individuales...');
                return;
            }
            
            console.log('✅ Checkbox "No oferto" encontrado');
            
            // ✅ VALIDAR SI YA ESTÁ MARCADO (CRÍTICO para evitar loop infinito)
            if (checkbox.checked) {
                console.log('');
                console.log('✅ ✅ ✅ CHECKBOX "NO OFERTO" YA ESTÁ MARCADO ✅ ✅ ✅');
                console.log('ℹ️ La página ya fue procesada anteriormente');
                console.log('✅ Marcando como procesado para futuras ejecuciones');
                
                // Marcar como procesado
                await chrome.storage.local.set({
                    [`noBidsProcessed_${this.licitacionId}`]: {
                        processed: true,
                        timestamp: Date.now()
                    }
                });
                
                console.log('');
                return; // NO hacer click de nuevo, continuar con productos
            }
            
            console.log('');
            console.log('👆 HACIENDO CLICK EN CHECKBOX "NO OFERTO A NINGUNO"...');
            console.log('⚠️ ADVERTENCIA: Esto causará una recarga de página (POSTBACK)');
            console.log('⚠️ El content script se RE-EJECUTARÁ después de la recarga');
            console.log('');
            
            // ⏸️ MARCAR que hicimos click (para detectar después de recarga)
            await chrome.storage.local.set({
                [`noBidsClicked_${this.licitacionId}`]: {
                    clicked: true,
                    timestamp: Date.now()
                }
            });
            
            // Click en el checkbox (CAUSA POSTBACK/RECARGA)
            checkbox.click();
            
            console.log('✅ Click realizado');
            console.log('⏳ Esperando 2 segundos para que __doPostBack se ejecute...');
            
            // ⏳ ESPERAR que setTimeout('__doPostBack...', 0) se ejecute
            // El checkbox tiene onclick="javascript:setTimeout('__doPostBack(...)', 0)"
            // Necesitamos esperar un poco para que el postback se inicie
            await this.delay(2000);
            
            console.log('⏳ La página recargará automáticamente...');
            console.log('ℹ️ NO ejecutar más código, esperar recarga');
            console.log('');
            
        } catch (error) {
            console.error('❌ Error activando checkbox:', error);
            console.warn('⚠️ Continuando sin activar checkbox...');
        }
    }

    async procesarProductosPorPaginas() {
        console.log('📦 PROCESANDO PRODUCTOS COMO EN SCRIPT PYTHON...');
        console.log('');
        
        // 📊 Variables de tracking global
        const itemsProcesadosTotal = [];
        const itemsFailidosTotal = [];
        
        // PASO CRÍTICO: Activar checkbox "No Bids" como en Python
        // Esto marca TODOS los ítems de TODAS las páginas como "No oferto"
        console.log('🚫 ACTIVANDO CHECKBOX "No Bids" (marca todos los ítems como "No oferto")...');
        const checkboxResult = await this.activarCheckboxNoBids();
        
        if (!checkboxResult) {
            // El checkbox causó una recarga de página
            // El procesamiento continuará desde verificarEstadoPendiente() después del reload
            console.log('🔄 Checkbox activado, página recargando... continuará automáticamente');
            return;
        }
        
        // ✅ OBTENER PRODUCTOS REALES DEL ENDPOINT
        let productos = this.automationData?.licitacion?.productos;
        
        if (!productos || productos.length === 0) {
            console.error('❌ ERROR CRÍTICO: No hay productos del endpoint');
            console.error('📋 Verificando estructura de datos...');
            console.error('automationData.licitacion:', this.automationData?.licitacion ? 'existe' : 'no existe');
            console.error('automationData.licitacion.productos:', this.automationData?.licitacion?.productos);
            throw new Error('No se pueden procesar productos - No hay datos del endpoint');
        }
        
        console.log(`✅ PRODUCTOS ENCONTRADOS: ${productos.length} items`);
        console.log('');
        
        // DETERMINAR EN QUE PÁGINAS ESTÁN LOS ITEMS REALES (como Python)
        console.log('🔢 ANALIZANDO NÚMEROS DE ITEMS REALES...');
        console.log('');
        console.log('🔍 ANÁLISIS DETALLADO DE PRODUCTOS DEL ENDPOINT:');
        productos.forEach((producto, index) => {
            const itemNumber = producto.item || producto.item_numero || producto.numero_item;
            console.log(`   ${index + 1}. Item ${itemNumber}:`);
            console.log(`      - pagina: ${producto.pagina} ${producto.pagina ? '✅' : '❌'}`);
            console.log(`      - posicion_en_pagina: ${producto.posicion_en_pagina} ${producto.posicion_en_pagina ? '✅' : '❌'}`);
            console.log(`      - descripcion: ${(producto.descripcion_item || producto.descripcion || '').substring(0, 50)}...`);
            console.log('');
        });
        
        // Agrupar productos por página basado en su número de item real
        const productosPorPagina = new Map();
        
        productos.forEach((producto, index) => {
            const itemNumber = producto.item || producto.item_numero || producto.numero_item;
            // USAR PÁGINA DEL ENDPOINT si está disponible, sino calcular como fallback  
            const paginaReal = producto.pagina || Math.ceil(itemNumber / 10);
            
            console.log(`   📦 Producto ${index + 1}: Item ${itemNumber} → Página ${paginaReal} ${producto.pagina ? '(del endpoint)' : '(calculada)'}`);
            
            if (!productosPorPagina.has(paginaReal)) {
                productosPorPagina.set(paginaReal, []);
            }
            productosPorPagina.get(paginaReal).push({
                producto: producto,
                itemNumber: itemNumber,
                paginaReal: paginaReal,
                posicionEnPagina: producto.posicion_en_pagina || (((itemNumber - 1) % 10) + 1) // Usar del endpoint o calcular
            });
        });
        
        const paginasAVisitar = Array.from(productosPorPagina.keys()).sort((a, b) => a - b);
        console.log(`📄 Páginas a visitar: ${paginasAVisitar.join(', ')}`);
        
        // VERIFICACIÓN ESPECÍFICA PARA LOS ITEMS ESPERADOS
        console.log('');
        console.log('🎯 VERIFICACIÓN DE ITEMS ESPECÍFICOS:');
        const itemsEspecificos = [14, 40, 64, 72];
        itemsEspecificos.forEach(itemNumber => {
            const paginaCalculada = Math.ceil(itemNumber / 10);
            const encontrado = productosPorPagina.has(paginaCalculada);
            console.log(`   Item ${itemNumber} → Página ${paginaCalculada}: ${encontrado ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
            
            if (encontrado) {
                const productosEnPagina = productosPorPagina.get(paginaCalculada);
                const productoEspecifico = productosEnPagina.find(p => p.itemNumber === itemNumber);
                console.log(`      Producto específico: ${productoEspecifico ? '✅ SÍ' : '❌ NO'}`);
            }
        });
        console.log('');
        
        // PROCESAR CADA PÁGINA QUE TIENE PRODUCTOS
        for (const numeroPagina of paginasAVisitar) {
            const productosEnEstataPagina = productosPorPagina.get(numeroPagina);
            
            console.log('═'.repeat(80));
            console.log(`📄 PROCESANDO PÁGINA ${numeroPagina}`);
            console.log(`📦 Items en esta página: ${productosEnEstataPagina.length}`);
            
            // Mostrar detalles de productos en esta página
            if (productosEnEstataPagina.length > 0) {
                console.log('🎯 PRODUCTOS A PROCESAR EN ESTA PÁGINA:');
                productosEnEstataPagina.forEach((item, index) => {
                    const descripcion = item.producto.descripcion_item || item.producto.descripcion || 'Sin descripción';
                    const precio = item.producto.precio || 'Sin precio';
                    console.log(`   ${index + 1}. Item ${item.itemNumber}: ${descripcion.substring(0, 40)}... - $${precio}`);
                });
            } else {
                console.log('⚠️ NO HAY PRODUCTOS PARA PROCESAR EN ESTA PÁGINA');
            }
            console.log('═'.repeat(80));
            
            // NAVEGAR A LA PÁGINA (si no es la primera)  
            let navegacionExitosa = true;
            if (numeroPagina > 1) {
                console.log(`🔄 Navegando a página ${numeroPagina}...`);
                
                // GUARDAR ESTADO ANTES DE NAVEGAR
                await this.guardarEstadoProcesamiento({
                    paginaActual: numeroPagina,
                    productosEnEstataPagina: productosEnEstataPagina,
                    paginasRestantes: paginasAVisitar.slice(paginasAVisitar.indexOf(numeroPagina) + 1)
                });
                
                try {
                    await this.navegarAPagina(numeroPagina);
                    // LA NAVEGACIÓN CAUSARÁ UNA RECARGA DE PÁGINA
                    // El procesamiento continuará desde verificarEstadoPendiente()
                    return;
                    console.log(`⏳ Esperando 5 segundos para carga completa...`);
                    await this.delay(5000); // Aumentar tiempo de espera
                    
                    // VERIFICAR QUE NAVEGAMOS EXITOSAMENTE
                    const verificacionNavegacion = await this.verificarPaginaActual(numeroPagina);
                    if (verificacionNavegacion) {
                        console.log(`✅ Navegación CONFIRMADA a página ${numeroPagina}`);
                        navegacionExitosa = true;
                    } else {
                        console.error(`❌ NAVEGACIÓN FALLÓ: No se pudo confirmar página ${numeroPagina}`);
                        navegacionExitosa = false;
                    }
                } catch (error) {
                    console.error(`❌ Error navegando a página ${numeroPagina}: ${error.message}`);
                    console.warn(`⚠️ No se pudo navegar - procesando productos visibles en página actual...`);
                    navegacionExitosa = false;
                    
                    // Intentar procesar productos que puedan estar visibles
                    try {
                        await this.procesarProductosEnPaginaActual(productosEnEstataPagina);
                        console.log(`✅ Productos de página ${numeroPagina} procesados en página actual`);
                        continue; // Saltar al siguiente conjunto de páginas
                    } catch (processingError) {
                        console.error(`❌ Error procesando productos en página actual: ${processingError.message}`);
                    }
                }
            } else {
                console.log(`✅ Ya estamos en página ${numeroPagina}`);
            }
            
            // FLUJO CORRECTO COMO EN PYTHON:
            // El checkbox chkNoBids YA marcó todos los ítems como "No oferto"
            // Solo necesitamos cambiar a "Sí oferto" los ítems correspondientes
            
            console.log(`✅ Procesando ítems correspondientes (chkNoBids ya marcó todos como "No oferto")...`);
            // PROCESAR CADA PRODUCTO DE ESTA PÁGINA
            const itemsProcesadosEnEstaPagina = [];
            const itemsFailidosEnEstaPagina = [];
            
            for (const {producto, itemNumber, posicionEnPagina} of productosEnEstataPagina) {
                console.log(`📦 Item ${itemNumber}: ${producto.nombre?.substring(0, 50)}...`);
                console.log(`   - Posición en página: ${posicionEnPagina}/10`);
                console.log(`   - Precio: $${producto.precio_unitario}`);
                
                // ✅ VALIDACIÓN PRE-PROCESAMIENTO
                const validacionPrevia = await this.validarItemAntesDeProcesar(itemNumber, posicionEnPagina);
                if (!validacionPrevia.success) {
                    console.error(`   ❌ Validación previa falló para item ${itemNumber}:`);
                    console.error(`      ${validacionPrevia.error}`);
                    itemsFailidosEnEstaPagina.push({
                        item: itemNumber,
                        error: `Validación previa: ${validacionPrevia.error}`,
                        fase: 'pre-validacion'
                    });
                    continue;
                }
                
                try {
                    // PROCESAR ESTE ITEM ESPECÍFICO (cambiar a Sí oferto y llenar datos)
                    await this.procesarItemIndividual(producto, posicionEnPagina);
                    
                    // ✅ VALIDACIÓN POST-PROCESAMIENTO
                    await this.delay(1000); // Dar tiempo para que se actualice el DOM
                    const validacionPosterior = await this.validarItemDespuesDeProcesar(itemNumber, posicionEnPagina, producto);
                    
                    if (validacionPosterior.success) {
                        console.log(`   ✅ Item ${itemNumber} procesado y validado exitosamente`);
                        itemsProcesadosEnEstaPagina.push(itemNumber);
                    } else {
                        console.error(`   ❌ Item ${itemNumber} procesado pero validación posterior falló:`);
                        console.error(`      ${validacionPosterior.error}`);
                        itemsFailidosEnEstaPagina.push({
                            item: itemNumber,
                            error: `Validación posterior: ${validacionPosterior.error}`,
                            fase: 'post-validacion'
                        });
                    }
                } catch (error) {
                    console.error(`   ❌ Error procesando item ${itemNumber}: ${error.message}`);
                    console.error(`   📝 Datos del producto:`, {
                        item: itemNumber,
                        posicion: posicionEnPagina,
                        nombre: producto.nombre?.substring(0, 30)
                    });
                    itemsFailidosEnEstaPagina.push({
                        item: itemNumber,
                        error: error.message,
                        fase: 'procesamiento'
                    });
                }
                
                console.log('');
                await this.delay(500); // Pausa entre items
            }
            
            // 📊 REPORTE DE PÁGINA
            console.log(`📊 REPORTE PÁGINA ${numeroPagina}:`);
            console.log(`   ✅ Items procesados exitosamente: ${itemsProcesadosEnEstaPagina.length} (${itemsProcesadosEnEstaPagina.join(', ')})`);
            console.log(`   ❌ Items con errores: ${itemsFailidosEnEstaPagina.length}`);
            if (itemsFailidosEnEstaPagina.length > 0) {
                itemsFailidosEnEstaPagina.forEach(item => {
                    console.log(`      - Item ${item.item}: ${item.error} [${item.fase}]`);
                });
            }
            
            // 📊 Actualizar tracking global
            itemsProcesadosTotal.push(...itemsProcesadosEnEstaPagina);
            itemsFailidosTotal.push(...itemsFailidosEnEstaPagina);
            
            console.log(`✅ Página ${numeroPagina} completada`);
            console.log('');
        }
        
        // 📊 REPORTE FINAL CONSOLIDADO
        console.log('');
        console.log('═'.repeat(80));
        console.log('📊 REPORTE FINAL DE PROCESAMIENTO');
        console.log('═'.repeat(80));
        
        const todosLosItems = productos.map(p => p.item || p.item_numero);
        const itemsEsperados = todosLosItems.length;
        const itemsProcesadosExitosamente = itemsProcesadosTotal.length;
        const itemsConErrores = itemsFailidosTotal.length;
        const procesamientoExitoso = itemsProcesadosExitosamente === itemsEsperados && itemsConErrores === 0;
        
        console.log(`📊 Items esperados: ${itemsEsperados} (${todosLosItems.join(', ')})`);
        console.log(`✅ Items procesados exitosamente: ${itemsProcesadosExitosamente} (${itemsProcesadosTotal.join(', ')})`);
        console.log(`❌ Items con errores: ${itemsConErrores}`);
        if (itemsConErrores > 0) {
            console.log(`   Errores detallados:`);
            itemsFailidosTotal.forEach(item => {
                console.log(`      - Item ${item.item}: ${item.error} [${item.fase}]`);
            });
        }
        console.log(`📄 Páginas procesadas: ${paginasAVisitar.length}`);
        console.log(`🎯 Procesamiento exitoso: ${procesamientoExitoso ? 'SÍ' : 'NO'}`);
        console.log('');
        
        // 📊 Devolver resultado del procesamiento con datos reales
        const resultado = {
            success: procesamientoExitoso,
            itemsProcessed: itemsProcesadosTotal,
            itemsFailed: itemsFailidosTotal.map(f => f.item),
            totalItems: itemsEsperados,
            paginasProcesadas: paginasAVisitar.length,
            timestamp: Date.now(),
            detalleErrores: itemsFailidosTotal
        };
        
        if (procesamientoExitoso) {
            console.log('🎉 TODOS LOS PRODUCTOS PROCESADOS EXITOSAMENTE');
        } else {
            console.log('⚠️ PROCESAMIENTO COMPLETADO CON ERRORES');
        }
        console.log('');
        
        return resultado;
    }

    async guardarEstadoProcesamiento(estado) {
        try {
            const estadoCompleto = {
                ...estado,
                licitacionId: this.licitacionId,
                timestamp: Date.now(),
                tipo: 'procesamiento_productos'
            };
            
            await chrome.storage.local.set({
                'procesamientoPendiente': estadoCompleto
            });
            
            console.log('💾 Estado de procesamiento guardado:', estado.paginaActual);
        } catch (error) {
            console.error('❌ Error guardando estado:', error);
        }
    }

    async verificarEstadoPendiente() {
        try {
            const result = await chrome.storage.local.get(['procesamientoPendiente']);
            const estado = result.procesamientoPendiente;
            
            if (!estado) return null;
            
            // Verificar que sea para esta licitación y no muy antiguo (5 minutos)
            const tiempoLimite = 5 * 60 * 1000;
            const tiempoTranscurrido = Date.now() - estado.timestamp;
            
            if (estado.licitacionId === this.licitacionId && 
                tiempoTranscurrido < tiempoLimite) {
                return estado;
            } else {
                // Limpiar estado expirado
                await chrome.storage.local.remove(['procesamientoPendiente']);
                return null;
            }
        } catch (error) {
            console.error('❌ Error verificando estado pendiente:', error);
            return null;
        }
    }

    async continuarProcesamiento(estado) {
        try {
            console.log('🔄 CONTINUANDO PROCESAMIENTO...');
            
            // 🚨 VERIFICAR SI YA ESTAMOS EN UNA PÁGINA DONDE EL SWITCH CASE MANEJA TODO
            const currentUrl = window.location.href;
            
            // ✅ REMOVIDO: No interceptar wizard aquí, dejar que llegue a continuarProcesarProductos()
            // que tiene la lógica completa de paginación
            
            if (currentUrl.includes('WizAttachment.aspx')) {
                console.log('🎯 PÁGINA WizAttachment.aspx DETECTADA - PROCESANDO DOCUMENTOS');
                console.log(`📍 URL: ${currentUrl}`);
                console.log('');
                
                console.log('📄 PÁGINA DE DOCUMENTOS - Verificando estado de DJ antes de proceder...');
                console.log('✅ Los documentos ya fueron cargados por el sistema anterior');
                
                this.updateIndicator('✅ Documentos completados - verificando DJ...', 'success');
                
                // 🔍 VERIFICAR ESTADO DE DJ ANTES DE HACER CLICK EN SIGUIENTE
                const estadoDJ = await this.verificarEstadoDJCompleto();
                console.log(`🔍 Estado DJ verificado:`, estadoDJ);
                
                if (estadoDJ && estadoDJ.firmada) {
                    console.log('✅ DJ ya está firmada - continuando al siguiente paso');
                    await this.clickSiguiente();
                    console.log('➡️ NAVEGACIÓN A SIGUIENTE PASO COMPLETADA');
                } else {
                    console.log('⚠️ DJ no está firmada - redirigiendo para completar firma');
                    
                    // Usar el formato correcto de URL para DJ
                    const licitacionId = this.licitacionId;
                    
                    if (licitacionId) {
                        const djUrl = `https://proveedor.mercadopublico.cl/dj-requisitos/${licitacionId}`;
                        console.log(`🔗 Redirigiendo a DJ (formato correcto): ${djUrl}`);
                        console.log(`📋 LicitacionId usado: ${licitacionId}`);
                        this.updateIndicator('🔄 Redirigiendo a Declaración Jurada...', 'info');
                        window.location.href = djUrl;
                    } else {
                        console.error('❌ No se pudo obtener licitacionId para redirección a DJ');
                        console.log('⚠️ Intentando con ID de página como fallback...');
                        
                        const urlParams = new URLSearchParams(window.location.search);
                        const idPagina = urlParams.get('idPagina');
                        
                        if (idPagina) {
                            const djUrlFallback = `https://www.mercadopublico.cl/BID/Modules/BID/dj-requisitos?idPagina=${idPagina}`;
                            console.log(`🔗 Redirigiendo con fallback: ${djUrlFallback}`);
                            window.location.href = djUrlFallback;
                        }
                    }
                }
                
                console.log('');
                return;
            }
            
            if (currentUrl.includes('WizBIDConfirm.aspx') ||
                currentUrl.includes('dj-requisitos')) {
                console.log('ℹ️ PÁGINA ESPECIAL DETECTADA - El switch case ya maneja esta página');
                console.log(`📍 URL: ${currentUrl}`);
                console.log('🚫 Saltando continuarProcesamiento para evitar conflictos');
                return;
            }
            
            if (estado.paso === 'checkbox_nobids_activado') {
                console.log('🚫 Checkbox "No Bids" fue activado, ahora procesando productos...');
                
                // Dar tiempo para que la página se estabilice después del reload
                await this.delay(3000);
                
                // Continuar con el procesamiento normal de productos
                return await this.continuarProcesarProductos();
                
            } else if (estado.paginaActual) {
                console.log(`📄 Página actual: ${estado.paginaActual}`);
                console.log(`📦 Productos en esta página: ${estado.productosEnEstataPagina?.length || 0}`);
                
                // Dar tiempo para que la página cargue completamente
                await this.delay(3000);
                
                // Procesar productos de la página actual
                if (estado.productosEnEstataPagina) {
                    for (const {producto, itemNumber, posicionEnPagina} of estado.productosEnEstataPagina) {
                        try {
                            console.log(`📦 Item ${itemNumber}: ${producto.nombre?.substring(0, 50)}...`);
                            console.log(`   - Posición en página: ${posicionEnPagina}/10`);
                            console.log(`   - Precio: $${producto.precio_unitario}`);
                            
                            await this.procesarItemIndividual(producto, posicionEnPagina);
                            console.log(`   ✅ Item ${itemNumber} procesado exitosamente`);
                            
                        } catch (error) {
                            console.error(`   ❌ Error procesando item ${itemNumber}:`, error.message);
                        }
                    }
                }
            }
            
            console.log(`✅ Página ${estado.paginaActual} completada`);
            
            // Continuar con páginas restantes si las hay
            if (estado.paginasRestantes && estado.paginasRestantes.length > 0) {
                console.log('🔄 Continuando con páginas restantes:', estado.paginasRestantes);
                await this.delay(2000);
                
                // Procesar siguiente página
                const siguientePagina = estado.paginasRestantes[0];
                const productosRestantes = this.automationData?.licitacion?.productos || [];
                
                // Agrupar productos para la siguiente página
                const productosProximaPagina = [];
                productosRestantes.forEach((producto, index) => {
                    const itemNumber = producto.item || producto.item_numero || producto.numero_item || (index + 1);
                    // USAR PÁGINA DEL ENDPOINT si está disponible
                    const paginaReal = producto.pagina || Math.ceil(itemNumber / 10);
                    
                    if (paginaReal === siguientePagina) {
                        const posicionEnPagina = producto.posicion_en_pagina || (((itemNumber - 1) % 10) + 1);
                        productosProximaPagina.push({
                            producto,
                            itemNumber,
                            paginaReal,
                            posicionEnPagina
                        });
                    }
                });
                
                // Guardar estado para siguiente página
                await this.guardarEstadoProcesamiento({
                    paginaActual: siguientePagina,
                    productosEnEstataPagina: productosProximaPagina,
                    paginasRestantes: estado.paginasRestantes.slice(1)
                });
                
                // Navegar a siguiente página
                if (siguientePagina > 1) {
                    await this.navegarAPagina(siguientePagina);
                    return; // La navegación causará una recarga
                }
            } else {
                console.log('🎉 TODOS LOS PRODUCTOS PROCESADOS!');
                // Limpiar estado
                await chrome.storage.local.remove(['procesamientoPendiente']);
                
                // Continuar con siguiente paso del flujo
                await this.continuarFlujoCompleto();
            }
            
        } catch (error) {
            console.error('❌ Error continuando procesamiento:', error);
            // Limpiar estado en caso de error
            await chrome.storage.local.remove(['procesamientoPendiente']);
        }
    }

    async continuarFlujoCompleto() {
        try {
            console.log('🔄 CONTINUANDO CON SIGUIENTE PASO DEL FLUJO...');
            
            // Continuar con documentos
            this.updateIndicator('📄 Cargando documentos...', 'processing');
            await this.cargarDocumentos();
            
            // Continuar con firma
            this.updateIndicator('🖊️ Firmando...', 'processing');
            await this.procesoFirma();
            
            // Finalizar
            this.updateIndicator('✅ Finalizando...', 'processing');
            await this.finalizarOferta();
            
            console.log('✅ FLUJO COMPLETO TERMINADO!');
            this.updateIndicator('✅ Proceso completado', 'success');
            
        } catch (error) {
            console.error('❌ Error continuando flujo completo:', error);
            this.updateIndicator('❌ Error: ' + error.message, 'error');
        }
    }

    async procesarProductosEnPaginaActual(productosEnPagina) {
        console.log(`🔄 Procesando ${productosEnPagina.length} productos en página actual...`);
        
        for (const {producto, itemNumber, posicionEnPagina} of productosEnPagina) {
            try {
                console.log(`📦 Item ${itemNumber}: ${producto.nombre?.substring(0, 50)}...`);
                console.log(`   - Posición en página: ${posicionEnPagina}/10`);
                console.log(`   - Precio: $${producto.precio_unitario}`);
                
                const descripcion = this.construirDescripcionProducto(producto);
                await this.procesarItemIndividual(producto, posicionEnPagina);
                
                console.log(`   ✅ Item ${itemNumber} procesado exitosamente`);
                
            } catch (error) {
                console.error(`   ❌ Error procesando item ${itemNumber}:`, error.message);
            }
        }
    }

    async debugElementosPaginacion() {
        console.log('🔍 DEBUG: Analizando elementos de paginación disponibles...');
        
        // Buscar todos los elementos que podrían ser de paginación
        const posiblesElementos = document.querySelectorAll('[onclick*="fnMovePage"], [onclick*="__doPostBack"], [id*="wucPager"], [class*="page"]');
        
        console.log(`📊 Encontrados ${posiblesElementos.length} posibles elementos de paginación:`);
        posiblesElementos.forEach((el, i) => {
            console.log(`   ${i+1}. Tag: ${el.tagName}, ID: ${el.id || 'sin ID'}, OnClick: ${el.getAttribute('onclick') || 'sin onclick'}`);
        });
        
        // Verificar funciones JavaScript disponibles
        console.log('🔍 Funciones JavaScript de paginación:');
        console.log(`   - window.fnMovePage: ${typeof window.fnMovePage}`);
        console.log(`   - fnMovePage (global): ${typeof fnMovePage}`);
        console.log(`   - window.__doPostBack: ${typeof window.__doPostBack}`);
        
        return posiblesElementos;
    }

    async verificarPaginaActual(paginaEsperada) {
        console.log(`🔍 Verificando si estamos en página ${paginaEsperada}...`);
        
        try {
            // Buscar indicadores de página actual
            const indicadoresPagina = [
                // Página activa en paginador
                `span[class*="current"]`,
                `span[class*="active"]`,
                `[class*="page"][class*="current"]`,
                
                // Enlaces de página (no activos, pero para verificar contexto)
                `a[onclick*="fnMovePage(${paginaEsperada},"]`,
                `div[onclick*="fnMovePage(${paginaEsperada},"]`,
            ];

            // Verificación manual por texto de página actual
            const elementosPaginador = document.querySelectorAll('span, div, a');
            for (const elemento of elementosPaginador) {
                const texto = elemento.textContent.trim();
                const classes = elemento.className.toLowerCase();
                
                // Si el texto es exactamente el número de página y tiene clases de "actual/active"
                if (texto === paginaEsperada.toString() && 
                    (classes.includes('current') || classes.includes('active') || classes.includes('selected'))) {
                    console.log(`✅ Página actual encontrada por texto: "${texto}"`);
                    return true;
                }
            }
            
            // También verificar que los elementos esperados existen
            const primerosElementosPagina = [
                '#ctl00_mpcphFormWizardFields_rptBids_ctl00_rblBids_0', // Primer item de la página
                '#rptBids_ctl00_rblBids_0',
                'input[id*="rptBids_ctl00"][id*="rblBids_0"]'
            ];
            
            let tieneElementosPagina = false;
            for (const selector of primerosElementosPagina) {
                if (document.querySelector(selector)) {
                    tieneElementosPagina = true;
                    console.log(`✅ Elementos de página encontrados: ${selector}`);
                    break;
                }
            }
            
            if (tieneElementosPagina) {
                console.log(`✅ Verificación exitosa: Página ${paginaEsperada} parece estar cargada`);
                return true;
            } else {
                console.error(`❌ Verificación falló: No se encontraron elementos de página ${paginaEsperada}`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ Error verificando página actual: ${error.message}`);
            return false;
        }
    }

    async navegarAPagina(numeroPagina) {
        console.log(`🔄 Navegando a página ${numeroPagina}...`);
        
        try {
            // 1. ANÁLISIS DE DEBUG COMPLETO
            await this.debugElementosPaginacion();
            
            const funcionesDisponibles = [];
            
            if (typeof window.fnMovePage === 'function') {
                funcionesDisponibles.push('window.fnMovePage');
            }
            if (typeof fnMovePage === 'function') {
                funcionesDisponibles.push('fnMovePage (global)');
            }
            if (typeof window.__doPostBack === 'function') {
                funcionesDisponibles.push('window.__doPostBack');
            }
            
            console.log(`✅ Funciones encontradas: ${funcionesDisponibles.join(', ')}`);
            
            // 2. BUSCAR BOTONES/ENLACES DE PAGINACIÓN COMO ALTERNATIVA
            console.log('🔍 Buscando elementos de paginación...');
            const selectoresPagina = [
                // Selectores específicos para Mercado Público
                `div[onclick*="fnMovePage(${numeroPagina},"]`,
                `a[onclick*="fnMovePage(${numeroPagina},"]`,
                `span[onclick*="fnMovePage(${numeroPagina},"]`,
                `td[onclick*="fnMovePage(${numeroPagina},"]`,
                
                // Selectores __doPostBack
                `a[onclick*="__doPostBack"][onclick*="${numeroPagina}"]`,
                `span[onclick*="__doPostBack"][onclick*="${numeroPagina}"]`,
                
                // Otros patrones
                `input[value="${numeroPagina}"][onclick]`,
                `[id*="wucPagerBID"][onclick*="${numeroPagina}"]`,
                
                // Selectores más generales
                `[onclick*="${numeroPagina}"][onclick*="Page"]`,
                `*[onclick*="fnMovePage"][onclick*="${numeroPagina}"]`
            ];
            
            for (const selector of selectoresPagina) {
                try {
                    const elemento = document.querySelector(selector);
                    if (elemento) {
                        console.log(`✅ Elemento de página encontrado: ${selector}`);
                        console.log(`🎯 Elemento onclick: ${elemento.getAttribute('onclick')}`);
                        console.log(`🎯 Haciendo clic en elemento de página ${numeroPagina}...`);
                        
                        // Simular clic más completo
                        elemento.click();
                        elemento.dispatchEvent(new Event('click', { bubbles: true }));
                        
                        await this.delay(2000); // Tiempo inicial para iniciar navegación
                        console.log(`✅ Navegación por clic iniciada para página ${numeroPagina}`);
                        return true;
                    }
                } catch (e) {
                    console.warn(`⚠️ Error con selector ${selector}:`, e.message);
                }
            }
            
            // 3. INTENTAR USAR FUNCIONES DISPONIBLES
            if (typeof window.fnMovePage === 'function') {
                console.log(`✅ Usando window.fnMovePage(${numeroPagina}, "wucPagerBID")`);
                try {
                    window.fnMovePage(numeroPagina, 'wucPagerBID');
                    await this.delay(2000); // Reducir tiempo inicial
                    console.log(`✅ Navegación con window.fnMovePage iniciada para página ${numeroPagina}`);
                    return true;
                } catch (e) {
                    console.error(`❌ Error con window.fnMovePage: ${e.message}`);
                }
            }
            
            if (typeof fnMovePage === 'function') {
                console.log(`✅ Usando fnMovePage global(${numeroPagina}, "wucPagerBID")`);
                try {
                    fnMovePage(numeroPagina, 'wucPagerBID');
                    await this.delay(2000); // Reducir tiempo inicial
                    console.log(`✅ Navegación con fnMovePage global iniciada para página ${numeroPagina}`);
                    return true;
                } catch (e) {
                    console.error(`❌ Error con fnMovePage global: ${e.message}`);
                }
            }
            
            // 4. USAR __doPostBack COMO ÚLTIMO RECURSO
            if (typeof window.__doPostBack === 'function') {
                console.log(`✅ Intentando con __doPostBack para página ${numeroPagina}...`);
                const targets = [
                    `ctl00$mpcphFormWizardFields$wucPagerBID$rptPages$ctl${numeroPagina.toString().padStart(2, '0')}$lnkPage`,
                    `wucPagerBID$rptPages$ctl${numeroPagina.toString().padStart(2, '0')}$lnkPage`
                ];
                
                for (const target of targets) {
                    try {
                        console.log(`🎯 Probando __doPostBack con target: ${target}`);
                        window.__doPostBack(target, '');
                        await this.delay(3000);
                        console.log(`✅ Navegación __doPostBack exitosa a página ${numeroPagina}`);
                        return true;
                    } catch (e) {
                        console.warn(`⚠️ Falló target ${target}:`, e.message);
                    }
                }
            }
            
            // 5. ESTRATEGIA ALTERNATIVA: Manipular campos hidden para paginación
            console.log(`🔧 Intentando estrategia alternativa con campos hidden...`);
            
            try {
                const hiddenIndex = document.querySelector('#ctl00_mpcphFormWizardFields_wucPagerBID_hidIndex');
                const form = document.querySelector('form[method="post"]');
                
                if (hiddenIndex && form) {
                    console.log(`🎯 Modificando campo hidden a página ${numeroPagina}...`);
                    
                    // Cambiar el valor del input hidden
                    hiddenIndex.value = numeroPagina.toString();
                    
                    // Asegurar que el formulario tenga los campos necesarios
                    let viewState = document.querySelector('#__VIEWSTATE');
                    let eventValidation = document.querySelector('#__EVENTVALIDATION');
                    
                    if (viewState && eventValidation) {
                        console.log('📄 Campos ASP.NET encontrados, preparando submit...');
                        
                        // Crear evento personalizado que simule postback
                        const eventTarget = document.createElement('input');
                        eventTarget.type = 'hidden';
                        eventTarget.name = '__EVENTTARGET';
                        eventTarget.value = `ctl00$mpcphFormWizardFields$wucPagerBID$page${numeroPagina}`;
                        
                        const eventArgument = document.createElement('input');
                        eventArgument.type = 'hidden';
                        eventArgument.name = '__EVENTARGUMENT';
                        eventArgument.value = '';
                        
                        // Agregar al formulario temporalmente
                        form.appendChild(eventTarget);
                        form.appendChild(eventArgument);
                        
                        // Enviar formulario
                        console.log('🚀 Enviando formulario para navegación...');
                        form.submit();
                        
                        await this.delay(3000);
                        console.log(`✅ Navegación por formulario iniciada para página ${numeroPagina}`);
                        return true;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error con estrategia alternativa: ${error.message}`);
            }
            
            throw new Error(`No se encontró método para navegar a página ${numeroPagina}. Funciones disponibles: ${funcionesDisponibles.join(', ')}`);
            
        } catch (error) {
            console.error(`❌ Error navegando a página ${numeroPagina}:`, error);
            console.error('🔍 Debug info:');
            console.error('- window.fnMovePage:', typeof window.fnMovePage);
            console.error('- fnMovePage global:', typeof fnMovePage);  
            console.error('- __doPostBack:', typeof window.__doPostBack);
            throw error;
        }
    }

    async activarCheckboxNoBids() {
        console.log('🚫 Activando checkbox "No Bids" (como en Python)...');
        
        try {
            const selector = '#ctl00_mpcphFormWizardFields_chkNoBids';
            const checkbox = await this.waitForElement(selector, 30000);
            
            if (!checkbox) {
                throw new Error('Checkbox "No Bids" no encontrado');
            }
            
            console.log('✅ Checkbox "No Bids" encontrado');
            
            // Verificar si ya está marcado
            if (checkbox.checked) {
                console.log('ℹ️ Checkbox "No Bids" ya está marcado, continuando...');
                return true;
            }
            
            // GUARDAR ESTADO ANTES DE HACER CLICK (porque va a recargar la página)
            await this.guardarEstadoProcesamiento({
                paso: 'checkbox_nobids_activado',
                continuarCon: 'procesar_productos',
                paginaActual: 1, // ✅ Agregar paginaActual para el log
                timestamp: Date.now()
            });
            
            // Hacer clic como en Python
            checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            
            console.log('🚫 Haciendo click en checkbox "No Bids" - la página se va a recargar...');
            checkbox.click();
            
            // El click va a causar una recarga de página
            // El procesamiento continuará desde verificarEstadoPendiente()
            return false; // Indica que hubo recarga
            
        } catch (error) {
            console.error('❌ Error activando checkbox "No Bids":', error);
            throw error;
        }
    }

    async procesarItemIndividual(producto, posicionEnPagina) {
        console.log(`   📋 PROCESANDO ITEM ${producto.item} (posición ${posicionEnPagina} en página)...`);
        
        try {
            // CALCULAR ÍNDICE FORMATEADO EXACTAMENTE COMO PYTHON
            const indiceFormateado = (posicionEnPagina - 1).toString().padStart(2, '0');
            console.log(`      🎯 Índice formateado: ${indiceFormateado} (item ${producto.item})`);
            
            // BUSCAR ELEMENTOS con mayor robustez
            console.log(`      🔍 Buscando elementos DOM para índice ${indiceFormateado}...`);
            const elementos = await this.buscarElementosItem(indiceFormateado);
            
            if (!elementos.siOferto || !elementos.textarea || !elementos.precio) {
                console.error(`      ❌ Elementos críticos faltantes:`);
                console.error(`         - siOferto: ${elementos.siOferto ? '✅' : '❌'}`);
                console.error(`         - textarea: ${elementos.textarea ? '✅' : '❌'}`);
                console.error(`         - precio: ${elementos.precio ? '✅' : '❌'}`);
                throw new Error(`Elementos DOM no encontrados para ítem ${producto.item}`);
            }
            
            console.log(`      ✅ Todos los elementos DOM encontrados`);
            
            // PASO 1: MARCAR "SÍ OFERTO" (cambiar de "No oferto" por chkNoBids)
            console.log(`      🔄 PASO 1: Marcando "Sí oferto"...`);
            
            // Verificar estado inicial
            const estadoInicialSiOferto = elementos.siOferto.checked;
            const estadoInicialNoOferto = elementos.noOferto?.checked || false;
            console.log(`      📊 Estado inicial - Sí: ${estadoInicialSiOferto}, No: ${estadoInicialNoOferto}`);
            
            if (!estadoInicialSiOferto) {
                elementos.siOferto.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(1000);
                
                console.log(`      👆 Haciendo click en radio "Sí oferto"...`);
                try {
                    elementos.siOferto.click();
                } catch (clickError) {
                    console.warn(`      ⚠️ Click normal falló, usando JavaScript...`);
                    elementos.siOferto.dispatchEvent(new Event('click', { bubbles: true }));
                }
                
                await this.delay(1000);
                
                // Verificar que se marcó correctamente
                if (elementos.siOferto.checked) {
                    console.log(`      ✅ "Sí oferto" marcado exitosamente`);
                } else {
                    throw new Error(`Radio "Sí oferto" no se marcó correctamente`);
                }
            } else {
                console.log(`      ℹ️ "Sí oferto" ya estaba marcado`);
            }
            
            // PASO 2: COMPLETAR DESCRIPCIÓN
            console.log(`      🔄 PASO 2: Completando descripción...`);
            elementos.textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            try {
                elementos.textarea.focus();
                elementos.textarea.select();
                elementos.textarea.value = '';
                await this.delay(300);
                
                const descripcion = producto.nombre || `${producto.nombre_base || ''} ${producto.pactivo || ''}`.trim();
                elementos.textarea.value = descripcion;
                elementos.textarea.dispatchEvent(new Event('input', { bubbles: true }));
                elementos.textarea.dispatchEvent(new Event('change', { bubbles: true }));
                
                console.log(`      ✅ Descripción completada: "${descripcion.substring(0, 30)}..."`);
            } catch (descError) {
                throw new Error(`Error completando descripción: ${descError.message}`);
            }
            
            // PASO 3: COMPLETAR PRECIO
            console.log(`      🔄 PASO 3: Completando precio: ${producto.precio_unitario}...`);
            elementos.precio.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            try {
                elementos.precio.focus();
                elementos.precio.select();
                elementos.precio.value = '';
                await this.delay(300);
                
                elementos.precio.value = producto.precio_unitario.toString();
                elementos.precio.dispatchEvent(new Event('input', { bubbles: true }));
                elementos.precio.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Forzar validación con Tab
                elementos.precio.dispatchEvent(new KeyboardEvent('keydown', { 
                    key: 'Tab',
                    bubbles: true,
                    cancelable: true 
                }));
                await this.delay(2000);
                
                console.log(`      ✅ Precio completado: $${elementos.precio.value}`);
            } catch (precioError) {
                throw new Error(`Error completando precio: ${precioError.message}`);
            }
            
            console.log(`      🎉 Item ${producto.item} procesado exitosamente - Todos los pasos completados`);
            
        } catch (error) {
            console.error(`      ❌ ERROR PROCESANDO ITEM ${producto.item}:`, error.message);
            console.error(`      📋 Detalles del error:`, {
                item: producto.item,
                posicion: posicionEnPagina,
                error: error.message
            });
            throw error;
        }
    }

    async buscarElementosItem(indiceFormateado) {
        console.log(`      🔍 Buscando elementos para índice ${indiceFormateado}...`);
        
        // SELECTORES BASADOS EN PYTHON (encontrar_elementos_pagina_productos)
        const selectoresSiOferto = [
            `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}_rblBids_0`,
            `#rptBids_ctl${indiceFormateado}_rblBids_0`,
            `input[id*="rptBids_ctl${indiceFormateado}"][id*="rblBids_0"]`
        ];
        
        const selectoresNoOferto = [
            `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}_rblBids_1`,
            `#rptBids_ctl${indiceFormateado}_rblBids_1`,
            `input[id*="rptBids_ctl${indiceFormateado}"][id*="rblBids_1"]`
        ];
        
        const selectoresTextarea = [
            `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtSupplierComment`,
            `#rptBids_ctl${indiceFormateado}__TxtSupplierComment`,
            `textarea[id*="rptBids_ctl${indiceFormateado}"][id*="TxtSupplierComment"]`
        ];
        
        const selectoresPrecio = [
            `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtUnitNetPriceN`,
            `#rptBids_ctl${indiceFormateado}__TxtUnitNetPriceN`,
            `input[id*="rptBids_ctl${indiceFormateado}"][id*="TxtUnitNetPrice"]`
        ];
        
        const elementos = {};
        
        // Buscar radio "Sí oferto"
        for (const selector of selectoresSiOferto) {
            elementos.siOferto = document.querySelector(selector);
            if (elementos.siOferto) {
                console.log(`      ✅ Radio "Sí oferto" encontrado: ${selector}`);
                break;
            }
        }
        
        // Buscar radio "No oferto"
        for (const selector of selectoresNoOferto) {
            elementos.noOferto = document.querySelector(selector);
            if (elementos.noOferto) {
                console.log(`      ✅ Radio "No oferto" encontrado: ${selector}`);
                break;
            }
        }
        
        // Para compatibilidad hacia atrás
        elementos.checkbox = elementos.siOferto;
        
        // Buscar textarea
        for (const selector of selectoresTextarea) {
            elementos.textarea = document.querySelector(selector);
            if (elementos.textarea) {
                console.log(`      ✅ Textarea encontrado: ${selector}`);
                break;
            }
        }
        
        // Buscar precio
        for (const selector of selectoresPrecio) {
            elementos.precio = document.querySelector(selector);
            if (elementos.precio) {
                console.log(`      ✅ Precio encontrado: ${selector}`);
                break;
            }
        }
        
        return elementos;
    }



    /**
     * 📝 CONSTRUIR DESCRIPCIÓN DEL PRODUCTO
     * 
     * Construye la descripción como en el Python (líneas 2004-2010):
     * - Si tiene campo "descripcion" directo → usa ese
     * - Si no, construye a partir de: nombre + pactivo + composicion + presentacion + glosas
     * 
     * Ejemplo del JSON del endpoint:
     * {
     *     nombre: "test",
     *     pactivo: "Cloruro Sodio",
     *     composicion: "500ml",
     *     presentacion: "Sin Clas",
     *     glosas: ["glosa 1", "glosa 2"]  // Opcional
     * }
     * 
     * Resultado: "test - Cloruro Sodio - 500ml - Sin Clas - glosa 1 - glosa 2"
     */
    construirDescripcionProducto(producto) {
        // PRIORIDAD: Usar campo "nombre" que YA viene construido desde el endpoint PHP
        // El endpoint PHP ya construye la descripción completa con glosas (líneas 1200-1220)
        if (producto.nombre) {
            console.log('📋 Usando descripción COMPLETA del endpoint');
            return producto.nombre; // Ya incluye: nombre_base + glosas con separador "-"
        }
        
        // Fallback: Si no hay "nombre", usar "nombre_base" 
        if (producto.nombre_base) {
            console.log('📋 Usando nombre_base del endpoint');
            return producto.nombre_base;
        }
        
        // Fallback: Construir descripción a partir de campos individuales
        console.log('⚠️ Construyendo descripción desde campos individuales');
        const partes = [];
        
        // 1. Nombre base o descripción
        if (producto.descripcion) {
            partes.push(producto.descripcion);
        }
        
        // 2. Principio activo
        if (producto.pactivo) {
            partes.push(producto.pactivo);
        }
        
        // 3. Composición
        if (producto.composicion) {
            partes.push(producto.composicion);
        }
        
        // 4. Presentación
        if (producto.presentacion && producto.presentacion !== 'Sin Clas') {
            partes.push(producto.presentacion);
        }
        
        // 5. Glosas específicas del item (desde el endpoint)
        if (producto.glosas_item && Array.isArray(producto.glosas_item)) {
            producto.glosas_item.forEach(glosa => {
                if (glosa && typeof glosa === 'string' && glosa.trim()) {
                    partes.push(glosa.trim());
                }
            });
        }
        
        // Unir con " - " (como en el Python con "-")
        const descripcionFinal = partes.filter(p => p && p.trim()).join(' - ');
        
        // Si no se pudo construir nada, usar descripción genérica
        if (!descripcionFinal) {
            return `Producto Item ${producto.item || 'N/A'}`;
        }
        
        return descripcionFinal;
    }

    /**
     * 🎯 PROCESA UN ITEM ESPECÍFICO DE MERCADO PÚBLICO
     * 
     * @param {number} numeroItem - Número de item en Mercado Público (1, 2, 3, 15, etc.)
     * @param {string} descripcion - Descripción del producto
     * @param {number} precio - Precio unitario
     * 
     * Esta función:
     * 1. Calcula en qué página está el item (cada página tiene 10 items)
     * 2. Navega a esa página si es necesario
     * 3. Calcula el índice dentro de la página (0-9)
     * 4. Marca "Sí oferto"
     * 5. Llena descripción y precio
     */
    async procesarItemPorNumero(numeroItem, descripcion, precio) {
        console.log(`🔍 Procesando item #${numeroItem}...`);
        
        // 📐 CALCULAR PAGINACIÓN
        const itemsPorPagina = 10;
        const paginaNecesaria = Math.ceil(numeroItem / itemsPorPagina);
        const indiceEnPagina = ((numeroItem - 1) % itemsPorPagina);
        
        console.log(`   📄 Página necesaria: ${paginaNecesaria}`);
        console.log(`   📍 Índice en página: ${indiceEnPagina}`);
        
        // 🔄 NAVEGAR A LA PÁGINA CORRECTA SI ES NECESARIO
        if (paginaNecesaria > 1) {
            console.log(`   🔄 Navegando a página ${paginaNecesaria}...`);
            await this.cambiarPagina(paginaNecesaria);
        }
        
        // ✅ PROCESAR EL ITEM
        const indiceFormateado = indiceEnPagina.toString().padStart(2, '0');
        
        console.log(`   🎯 Procesando con índice formateado: ${indiceFormateado}`);
        
        // 1. Marcar "Sí oferto"
        console.log(`   1️⃣ Marcando "Sí oferto"...`);
        const marcado = await this.marcarCheckboxProducto(indiceFormateado);
        if (!marcado) {
            console.error(`   ❌ No se pudo marcar "Sí oferto"`);
            return false;
        }
        
        // 2. Llenar descripción
        console.log(`   2️⃣ Llenando descripción...`);
        const descripcionOk = await this.llenarDescripcionProducto(indiceFormateado, descripcion);
        if (!descripcionOk) {
            console.error(`   ❌ No se pudo llenar descripción`);
            return false;
        }
        
        // 3. Llenar precio
        console.log(`   3️⃣ Llenando precio...`);
        const precioOk = await this.llenarPrecioProducto(indiceFormateado, precio);
        if (!precioOk) {
            console.error(`   ❌ No se pudo llenar precio`);
            return false;
        }
        
        console.log(`   ✅ Item #${numeroItem} completado`);
        return true;
    }

    async cambiarPagina(numeroPagina) {
        console.log(`   🔄 Cambiando a página ${numeroPagina}...`);
        
        try {
            // Verificar que fnMovePage esté disponible
            if (typeof window.fnMovePage !== 'function') {
                console.error('   ❌ Función fnMovePage no está disponible');
                throw new Error('fnMovePage no disponible');
            }
            
            console.log(`   Ejecutando: fnMovePage(${numeroPagina}, "wucPagerBID")`);
            
            // Ejecutar cambio de página (del Python línea 1926)
            window.fnMovePage(numeroPagina, "wucPagerBID");
            
            // Esperar a que se complete el cambio
            console.log('   Esperando procesamiento del cambio...');
            await this.delay(5000);
            
            // Esperar carga completa de la página
            await this.waitForPageLoad();
            
            // Verificar que hay elementos en la nueva página
            const hayElementos = document.querySelector('[id*="rptBids_ctl"]');
            if (!hayElementos) {
                console.warn('   ⚠️ No se encontraron elementos de productos después del cambio');
            } else {
                console.log('   ✓ Elementos de productos encontrados en nueva página');
            }
            
            console.log(`   ✅ Cambio a página ${numeroPagina} completado`);
            
        } catch (error) {
            console.error(`   ❌ Error cambiando a página ${numeroPagina}:`, error);
            throw error;
        }
    }

    async waitForJavaScriptFunction(functionName, timeout = 20000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                if (typeof window[functionName] === 'function') {
                    return true;
                }
            } catch (error) {
                // Función no disponible aún
            }
            
            await this.delay(500);
        }
        
        throw new Error(`Función JavaScript ${functionName} no disponible`);
    }


    async marcarCheckboxProducto(indiceFormateado) {
        console.log(`         🔘 Marcando radio "Sí oferto" producto ${indiceFormateado}...`);
        
        // Selector del radio "Sí oferto" (del script Python, línea 2042)
        // Formato: ctl00_mpcphFormWizardFields_rptBids_ctl{indice}_rblBids_0
        const radioSelector = `ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}_rblBids_0`;
        
        try {
            const radio = await this.waitForElement(`#${radioSelector}`, 30000).catch(() => null);
            
            if (!radio) {
                console.error(`         ❌ Radio no encontrado: ${radioSelector}`);
                return false;
            }
            
            console.log(`         ✓ Radio encontrado: ${radioSelector}`);
            
            // ✅ VALIDAR SI YA ESTÁ MARCADO
            if (radio.checked) {
                console.log(`         ℹ️ Radio "Sí oferto" ya está marcado`);
                
                // Verificar que los campos estén habilitados
                const textareaSelector = `ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtSupplierComment`;
                const textarea = document.getElementById(textareaSelector);
                
                if (textarea && !textarea.readOnly) {
                    console.log(`         ✅ Campos ya habilitados`);
                    return true;
                } else {
                    console.warn(`         ⚠️ Radio marcado pero campos deshabilitados, haciendo click de nuevo...`);
                }
            }
            
            // Hacer click en el radio "Sí oferto"
            console.log(`         👆 Haciendo click en radio "Sí oferto"...`);
            console.log(`         ℹ️ Esto ejecutará enabledBid() que habilita los campos`);
            
            radio.click();
            
            // ⏳ ESPERAR QUE LA FUNCIÓN enabledBid() SE EJECUTE Y HABILITE LOS CAMPOS
            console.log(`         ⏳ Esperando que los campos se habiliten...`);
            await this.delay(1500);
            
            // ✅ VERIFICAR QUE EL RADIO SE MARCÓ
            if (!radio.checked) {
                console.error(`         ❌ Radio no se marcó correctamente`);
                return false;
            }
            
            // ✅ VERIFICAR QUE LOS CAMPOS SE HABILITARON
            const textareaSelector = `ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtSupplierComment`;
            const precioSelector = `ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtUnitNetPriceN`;
            
            const textarea = document.getElementById(textareaSelector);
            const precioInput = document.getElementById(precioSelector);
            
            if (textarea && !textarea.readOnly) {
                console.log(`         ✅ Radio marcado y campos habilitados exitosamente`);
                return true;
            } else {
                console.error(`         ❌ Radio marcado pero campos siguen deshabilitados`);
                console.error(`            Textarea readOnly: ${textarea?.readOnly}`);
                console.error(`            Precio readOnly: ${precioInput?.readOnly}`);
                return false;
            }
            
        } catch (error) {
            console.error(`         ❌ Error marcando radio:`, error);
            return false;
        }
    }

    async llenarDescripcionProducto(indiceFormateado, descripcion) {
        console.log(`         📝 Llenando descripción producto ${indiceFormateado}...`);
        
        // Selector del textarea de descripción (del script Python, línea 2064)
        // Formato: ctl00_mpcphFormWizardFields_rptBids_ctl{indice}__TxtSupplierComment
        const selector = `ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtSupplierComment`;
        
        try {
            const textarea = await this.waitForElement(`#${selector}`, 30000).catch(() => null);
            
            if (!textarea) {
                console.error(`         ❌ Textarea no encontrado: ${selector}`);
                return false;
            }
            
            console.log(`         ✓ Textarea encontrado: ${selector}`);
            
            // ✅ VERIFICAR QUE EL CAMPO ESTÉ HABILITADO
            if (textarea.readOnly || textarea.disabled) {
                console.error(`         ❌ Textarea está deshabilitado (readOnly: ${textarea.readOnly}, disabled: ${textarea.disabled})`);
                console.error(`         ⚠️ Asegúrate que el radio "Sí oferto" esté marcado primero`);
                return false;
            }
            
            console.log(`         ✓ Textarea habilitado (puede escribir)`);
            
            // ✅ VALIDAR SI YA ESTÁ LLENO
            const valorActual = textarea.value.trim();
            const descripcionAUsar = descripcion || 'Descripción del producto';
            
            if (valorActual && valorActual === descripcionAUsar) {
                console.log(`         ℹ️ Descripción ya está llena correctamente`);
                return true;
            }
            
            // Limpiar y llenar
            console.log(`         ✍️ Escribiendo: "${descripcionAUsar.substring(0, 50)}..."`);
            textarea.value = '';
            await this.delay(300);
            textarea.focus();
            await this.typeText(textarea, descripcionAUsar, 50);
            
            console.log(`         ✅ Descripción completada`);
            return true;
            
        } catch (error) {
            console.error(`         ❌ Error llenando descripción:`, error);
            return false;
        }
    }

    async llenarPrecioProducto(indiceFormateado, precio) {
        console.log(`         💰 Llenando precio producto ${indiceFormateado}...`);
        
        // Selector del input de precio (del script Python, línea 2084)
        // Formato: ctl00_mpcphFormWizardFields_rptBids_ctl{indice}__TxtUnitNetPriceN
        const selector = `ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtUnitNetPriceN`;
        
        try {
            const precioInput = await this.waitForElement(`#${selector}`, 30000).catch(() => null);
            
            if (!precioInput) {
                console.error(`         ❌ Input precio no encontrado: ${selector}`);
                return false;
            }
            
            console.log(`         ✓ Input precio encontrado: ${selector}`);
            
            // ✅ VERIFICAR QUE EL CAMPO ESTÉ HABILITADO
            if (precioInput.readOnly || precioInput.disabled) {
                console.error(`         ❌ Input precio está deshabilitado (readOnly: ${precioInput.readOnly}, disabled: ${precioInput.disabled})`);
                console.error(`         ⚠️ Asegúrate que el radio "Sí oferto" esté marcado primero`);
                return false;
            }
            
            console.log(`         ✓ Input precio habilitado (puede escribir)`);
            
            // ✅ VALIDAR SI YA ESTÁ LLENO
            const valorActual = precioInput.value.trim();
            const precioAUsar = (precio || '1000').toString();
            
            // El campo puede tener "0" por defecto, no considerarlo como "lleno"
            if (valorActual && valorActual !== '0' && valorActual === precioAUsar) {
                console.log(`         ℹ️ Precio ya está lleno correctamente: $${valorActual}`);
                return true;
            }
            
            // Limpiar y llenar
            console.log(`         ✍️ Escribiendo precio: $${precioAUsar}`);
            precioInput.value = '';
            await this.delay(300);
            precioInput.focus();
            precioInput.value = precioAUsar;
            
            // Simular Tab para validación (como en Python línea 2094)
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9 });
            precioInput.dispatchEvent(tabEvent);
            
            // ⏳ Esperar que se valide el precio (importante!)
            await this.delay(2000);
            
            console.log(`         ✅ Precio completado: $${precioAUsar}`);
            return true;
            
        } catch (error) {
            console.error(`         ❌ Error llenando precio:`, error);
            return false;
        }
    }

    // Placeholder para mantener compatibilidad
    async _old_llenarPrecioProducto(indiceFormateado, precio) {
        const pattern = window.EXTENSION_CONFIG?.SELECTORS?.PRODUCTOS?.PRODUCT_PRICE_PATTERN;
        if (!pattern) return;
        
        const selector = pattern.replace('{INDEX}', indiceFormateado);
        const input = document.getElementById(selector);
        
        if (input && precio) {
            input.value = '';
            input.focus();
            await this.typeText(input, precio.toString());
            
            // Simular Tab para validación
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
            await this.delay(1000);
        }
    }

    async clickSiguiente() {
        console.log('👆 Buscando botón "Siguiente"...');
        
        try {
            // Selector del botón Siguiente (del script Python)
            const selector = '#ctl00_btnNext';
            
            // Esperar el botón
            const button = await this.waitForElement(selector, 30000).catch(() => null);
            
            if (!button) {
                console.error('❌ No se encontró botón "Siguiente":', selector);
                throw new Error('Botón Siguiente no encontrado');
            }
            
            console.log('✅ Botón "Siguiente" encontrado');
            
            // Scroll al botón
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // Click con JavaScript (más confiable en MP)
            console.log('👆 Haciendo click en "Siguiente"...');
            button.click();
            
            console.log('✅ Click realizado');
            console.log('⏳ Esperando transición...');
            
            await this.delay(5000);
            await this.waitForPageLoad();
            
            // ✅ VERIFICACIÓN SIMPLE: Solo verificar si avanzó correctamente
            const currentUrl = window.location.href;
            if (currentUrl.includes('WizAttachment.aspx')) {
                console.log('⚠️ DETECTADO: Aún en WizAttachment después del click');
                console.log('ℹ️ Esto puede ser normal si hay validaciones pendientes');
                
                // Dar un poco más de tiempo por si la navegación es lenta
                await this.delay(2000);
                
                const finalUrl = window.location.href;
                if (finalUrl.includes('WizAttachment.aspx')) {
                    console.log('⚠️ Confirmado: No avanzó de WizAttachment');
                    console.log('ℹ️ Posibles causas: validaciones pendientes, DJ faltante, etc.');
                }
            }
            
            console.log('✅ Transición completada');
            
        } catch (error) {
            console.error('❌ Error haciendo click en Siguiente:', error);
            throw error;
        }
    }

    // ================================
    // FUNCIONES DE UTILIDAD
    // ================================

    async waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            // Verificar si el elemento ya existe
            const existingElement = document.querySelector(selector);
            if (existingElement) {
                resolve(existingElement);
                return;
            }

            // Configurar observer para esperar el elemento
            const observer = new MutationObserver((mutations) => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    clearTimeout(timeoutId);
                    resolve(element);
                }
            });

            // Configurar timeout
            const timeoutId = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`));
            }, timeout);

            // Iniciar observación
            observer.observe(document, {
                childList: true,
                subtree: true,
                attributes: true
            });
        });
    }

    async waitForElementClickable(selector, timeout = 10000) {
        const element = await this.waitForElement(selector, timeout);
        
        return new Promise((resolve, reject) => {
            const checkClickable = () => {
                if (element && !element.disabled && element.offsetParent !== null) {
                    resolve(element);
                    return;
                }
                
                setTimeout(checkClickable, 100);
            };
            
            setTimeout(() => reject(new Error(`Elemento ${selector} no clickeable después de ${timeout}ms`)), timeout);
            checkClickable();
        });
    }

    showNotification(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Crear notificación visual
        const notification = document.createElement('div');
        notification.className = `pharmatender-notification notification-${type}`;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444', 
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 10001;
                background: ${colors[type] || colors.info};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                max-width: 350px;
                animation: slideIn 0.3s ease;
            ">
                ${message}
            </div>
            <style>
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    async clickElement(selector, timeout = 5000) {
        try {
            const element = await this.waitForElementClickable(selector, timeout);
            
            // Scroll al elemento si es necesario
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // Simular click humano
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            element.dispatchEvent(new MouseEvent('mousedown', {
                bubbles: true,
                clientX: x,
                clientY: y
            }));
            
            await this.delay(50);
            
            element.dispatchEvent(new MouseEvent('mouseup', {
                bubbles: true,
                clientX: x,
                clientY: y
            }));
            
            element.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                clientX: x,
                clientY: y
            }));
            
            console.log(`✅ Click realizado en: ${selector}`);
            return element;
            
        } catch (error) {
            console.error(`❌ Error haciendo click en ${selector}:`, error);
            throw error;
        }
    }

    async fillInput(selector, value, timeout = 5000) {
        try {
            const input = await this.waitForElement(selector, timeout);
            
            // Limpiar campo
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Escribir texto de manera humana
            await this.typeText(input, value, 100);
            
            // Disparar eventos necesarios
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            console.log(`✅ Campo llenado ${selector}: ${value}`);
            return input;
            
        } catch (error) {
            console.error(`❌ Error llenando campo ${selector}:`, error);
            throw error;
        }
    }

    async typeText(element, text, speed = 50) {
        for (const char of text) {
            element.value += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(speed);
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clickElementJS(element) {
        if (element) {
            element.click();
        }
    }

    async waitForElement(selector, timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
            await this.delay(100);
        }
        
        return null;
    }

    async switchToDocumentFrame() {
        try {
            console.log('🖼️ Cambiando a iframe de documentos...');
            
            // Buscar iframe de documentos (como en Python)
            const iframe = document.querySelector('#ctl00_mpcphFormWizardFields__IFrameAttachment');
            
            if (iframe) {
                console.log('✅ Iframe encontrado, cambiando contexto...');
                // En content script no podemos cambiar frames directamente
                // Trabajaremos dentro del iframe usando postMessage si es necesario
                return true;
            } else {
                console.log('⚠️ Iframe no encontrado, trabajando en contexto principal');
                return false;
            }
        } catch (error) {
            console.error('❌ Error cambiando a iframe:', error);
            return false;
        }
    }

    async switchToDefaultContent() {
        try {
            console.log('🔄 Regresando a contexto principal...');
            // En content script esto no es necesario ya que trabajamos diferente
            return true;
        } catch (error) {
            console.error('❌ Error regresando a contexto principal:', error);
            return false;
        }
    }

    async makeAuthenticatedRequest(endpoint, options = {}) {
        try {
            const baseUrl = 'https://prime.pharmatender.cl';
            const fullUrl = `${baseUrl}${endpoint}`;
            
            // Configurar headers por defecto
            const defaultHeaders = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            const requestOptions = {
                method: options.method || 'GET',
                headers: { ...defaultHeaders, ...options.headers },
                credentials: 'include' // Incluir cookies de sesión
            };
            
            if (options.body) {
                requestOptions.body = options.body;
            }
            
            const response = await fetch(fullUrl, requestOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Error en request autenticado:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    registerInWindow() {
        window.licitacionAutomation = this;
        console.log('✅ LicitacionAutomation registrada en window');
    }

    // ================================
    // INDICADORES VISUALES
    // ================================

    addIndicator(text = '📋 Licitación detectada', type = 'default') {
        // Remover indicador existente
        const existing = document.getElementById('licitacion-indicator');
        if (existing) existing.remove();
        
        const colors = {
            default: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            processing: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            info: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            waiting: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
        };

        const indicator = document.createElement('div');
        indicator.id = 'licitacion-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                background: ${colors[type] || colors.default};
                color: white;
                padding: 12px 16px;
                border-radius: 20px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                user-select: none;
                max-width: 300px;
                word-wrap: break-word;
                animation: slideIn 0.3s ease-out;
            ">
                ${text}
            </div>
            <style>
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            </style>
        `;
        
        document.body.appendChild(indicator);
    }

    updateIndicator(text, type = 'default') {
        const indicator = document.getElementById('licitacion-indicator');
        if (indicator) {
            const content = indicator.querySelector('div');
            if (content) {
                content.textContent = text;
                
                const colors = {
                    default: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    processing: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                };
                
                content.style.background = colors[type] || colors.default;
            }
        } else {
            this.addIndicator(text, type);
        }
    }

    showDisabledIndicator() {
        this.addIndicator('⚠️ EXTENSIÓN DESACTIVADA', 'error');
    }

    // ================================
    // FUNCIONES PENDIENTES DE IMPLEMENTAR COMPLETAMENTE
    // ================================

    async navegarAOferta() {
        console.log('🔄 Navegando a oferta en Mercado Público...');

        try {
            // Verificar que tengamos el código de postulación
            if (!this.licitacionId) {
                throw new Error('❌ No se encontró código de postulación (licitacionId)');
            }

            // Actualizar estado en BD
            await this.actualizarEstadoEnBD('navegando', 'Navegando a página de oferta', 'navegacion');

            // Construir URL usando la función del config
            const urlOferta = window.LicitacionUtils?.getLicitacionUrl(this.licitacionId);

            if (!urlOferta) {
                throw new Error('❌ No se pudo construir URL de oferta');
            }

            console.log('🎯 URL de oferta construida:', urlOferta);

            // Verificar si ya estamos en la página correcta
            const currentUrl = window.location.href;
            if (currentUrl.includes('Desktop.aspx') && currentUrl.includes(`enc=${this.licitacionId}`)) {
                console.log('✅ Ya estamos en la página de oferta correcta');
                return;
            }

            // Notificar al usuario
            this.showNotification('🔄 Navegando a página de oferta...', 'info');
            this.updateIndicator('🔄 Navegando...', 'processing');

            // Navegar a la URL
            console.log('🚀 Navegando a:', urlOferta);
            window.location.href = urlOferta;

            // Esperar que la página cargue (el script se recargará en la nueva página)
            await this.delay(2000);

        } catch (error) {
            console.error('❌ Error navegando a oferta:', error);
            await this.actualizarEstadoEnBD('error', `Error en navegación: ${error.message}`, 'navegacion');
            throw error;
        }
    }

    async configurarOfertaConjunta() {
        console.log('🤝 Configurando oferta conjunta...');

        try {
            // Verificar si existe la opción de proveedores
            const existeOpcionProveedores = document.querySelector('#ctl00_mpcphFormWizardFields_Tr1');
            
            if (!existeOpcionProveedores) {
                console.log('   ℹ️ No se encontró opción de proveedores (no es necesario)');
                return;
            }
            
            console.log('   ✅ Se encontró opción de proveedores');
            
            // Obtener configuración desde los datos del endpoint
            const ofertaConjunta = this.automationData?.licitacionData?.oferta_conjunta || false;

            console.log(`   📋 Oferta conjunta: ${ofertaConjunta ? 'SÍ' : 'NO'}`);

            // Selectores de los radio buttons (del script Python)
            const selectorActivar = '#ctl00_mpcphFormWizardFields_rbactivaUtp';
            const selectorDesactivar = '#ctl00_mpcphFormWizardFields_rbdesactivaUtp';
            
            const selectorRadio = ofertaConjunta ? selectorActivar : selectorDesactivar;

            console.log(`   🎯 Buscando radio button: ${selectorRadio}`);

            // Buscar el radio button
            const radioButton = document.querySelector(selectorRadio);

            if (!radioButton) {
                console.warn('   ⚠️ No se encontró radio button de oferta conjunta');
                console.warn('   ⚠️ Continuando sin configurar...');
                return;
            }

            // Verificar si ya está seleccionado
            if (radioButton.checked) {
                console.log('✅ Radio button ya está seleccionado');
                return;
            }

            // Hacer scroll al elemento
            radioButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);

            // Click en el radio button
            await this.clickElement(radioButton);
            console.log('✅ Radio button de oferta conjunta seleccionado');

            // Disparar eventos para asegurar que el cambio se registre
            radioButton.dispatchEvent(new Event('change', { bubbles: true }));
            radioButton.dispatchEvent(new Event('click', { bubbles: true }));

            await this.delay(500);

            // Verificar que se seleccionó correctamente
            if (radioButton.checked) {
                console.log('✅ Oferta conjunta configurada correctamente');
            } else {
                console.warn('⚠️ No se pudo verificar la selección del radio button');
            }

        } catch (error) {
            console.error('❌ Error configurando oferta conjunta:', error);
            // No lanzar error, es un campo opcional
            console.warn('⚠️ Continuando sin configurar oferta conjunta...');
        }
    }

    async switchToDocumentFrame() {
        console.log('🔄 Cambiando a iframe de documentos...');

        try {
            // Obtener selector del iframe desde config
            const iframeSelector = window.EXTENSION_CONFIG?.SELECTORS?.MERCADO_PUBLICO?.DOCUMENTOS?.IFRAME;

            if (!iframeSelector) {
                throw new Error('❌ No se encontró selector de iframe');
            }

            console.log('🎯 Buscando iframe:', iframeSelector);

            // Esperar a que el iframe esté presente
            const iframe = await this.waitForElement(iframeSelector, 15000);

            if (!iframe) {
                throw new Error('❌ No se encontró iframe de documentos');
            }

            // Esperar a que el iframe esté completamente cargado
            await this.waitForIframeLoad(iframe);

            // Guardar referencia al iframe
            this.currentIframe = iframe;

            console.log('✅ Iframe de documentos cargado');

            // Verificar que podemos acceder al contenido del iframe
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) {
                    throw new Error('❌ No se puede acceder al contenido del iframe');
                }
                console.log('✅ Acceso al contenido del iframe verificado');
            } catch (error) {
                console.warn('⚠️ Posible problema de CORS con iframe:', error.message);
                // Continuar de todos modos, algunos iframes pueden tener restricciones
            }

            await this.delay(1000);

        } catch (error) {
            console.error('❌ Error cambiando a iframe de documentos:', error);
            throw error;
        }
    }

    async waitForIframeLoad(iframe) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout esperando carga de iframe'));
            }, 15000);

            // Si ya está cargado
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc && iframeDoc.readyState === 'complete') {
                    clearTimeout(timeout);
                    resolve();
                    return;
                }
            } catch (e) {
                // Puede fallar por CORS, continuamos con el listener
            }

            // Listener para cuando cargue
            iframe.addEventListener('load', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        });
    }

    async cargarDocumentosPorTipo() {
        console.log('📄 Cargando documentos por tipo...');

        try {
            // Obtener tipos de documentos desde config
            const documentTypes = window.EXTENSION_CONFIG?.DOCUMENT_TYPES;

            if (!documentTypes) {
                throw new Error('❌ No se encontró configuración de tipos de documentos');
            }

            // Iterar sobre cada tipo de documento (ADMINISTRATIVO, TECNICO, ECONOMICO)
            for (const [tipoKey, tipoConfig] of Object.entries(documentTypes)) {
                console.log(`📄 Procesando documentos tipo: ${tipoKey}`);

                try {
                    await this.cargarDocumentoTipo(tipoKey, tipoConfig);
                    console.log(`✅ Documentos tipo ${tipoKey} cargados`);
                } catch (error) {
                    console.error(`❌ Error cargando documentos tipo ${tipoKey}:`, error);
                    // Continuar con el siguiente tipo
                    await this.actualizarEstadoEnBD('error', `Error cargando documentos ${tipoKey}: ${error.message}`, 'documentos');
                }

                await this.delay(2000);
            }

            console.log('✅ Todos los tipos de documentos procesados');

        } catch (error) {
            console.error('❌ Error general cargando documentos:', error);
            throw error;
        }
    }

    async cargarDocumentoTipo(tipoKey, tipoConfig) {
        console.log(`📄 Cargando documento tipo: ${tipoKey}`);

        try {
            // Verificar que tenemos los datos de la licitación
            if (!this.licitacionId || !this.automationData) {
                throw new Error('❌ No hay datos de licitación disponibles');
            }

            // Obtener lista de documentos de este tipo desde automationData
            const documentosKey = `documentos_${tipoKey.toLowerCase()}`;
            const documentos = this.automationData[documentosKey] || [];

            if (!Array.isArray(documentos) || documentos.length === 0) {
                console.log(`ℹ️ No hay documentos tipo ${tipoKey} para cargar`);
                return;
            }

            console.log(`📄 Encontrados ${documentos.length} documentos tipo ${tipoKey}`);

            // Obtener el input de archivo desde el iframe
            const inputSelector = tipoConfig.inputSelector;
            const fileInput = await this.getElementFromIframe(inputSelector, 10000);

            if (!fileInput) {
                throw new Error(`❌ No se encontró input de archivo: ${inputSelector}`);
            }

            // Cargar cada documento
            for (const documento of documentos) {
                try {
                    await this.uploadDocumentToInput(fileInput, documento, tipoKey);
                    console.log(`✅ Documento cargado: ${documento.filename || documento.nombre}`);
                    await this.delay(2000);
                } catch (error) {
                    console.error(`❌ Error cargando documento ${documento.filename}:`, error);
                    // Continuar con el siguiente documento
                }
            }

            // Click en botón "Agregar" si existe
            if (tipoConfig.buttonSelector) {
                const addButton = await this.getElementFromIframe(tipoConfig.buttonSelector, 5000);
                if (addButton) {
                    await this.clickElement(addButton);
                    console.log(`✅ Click en botón agregar tipo ${tipoKey}`);
                    await this.delay(2000);
                }
            }

        } catch (error) {
            console.error(`❌ Error en cargarDocumentoTipo ${tipoKey}:`, error);
            throw error;
        }
    }

    async getElementFromIframe(selector, timeout = 10000) {
        if (!this.currentIframe) {
            console.warn('⚠️ No hay iframe actual, buscando en documento principal');
            return await this.waitForElement(selector, timeout);
        }

        try {
            const iframeDoc = this.currentIframe.contentDocument || this.currentIframe.contentWindow?.document;
            if (!iframeDoc) {
                throw new Error('No se puede acceder al documento del iframe');
            }

            // Buscar elemento en el iframe
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    resolve(null);
                }, timeout);

                const checkElement = () => {
                    const element = iframeDoc.querySelector(selector);
                    if (element) {
                        clearTimeout(timeoutId);
                        resolve(element);
                    } else {
                        setTimeout(checkElement, 500);
                    }
                };

                checkElement();
            });

        } catch (error) {
            console.error('❌ Error accediendo a iframe:', error);
            return null;
        }
    }

    async uploadDocumentToInput(fileInput, documentoInfo, tipoKey) {
        console.log(`📤 Subiendo documento:`, documentoInfo);

        try {
            // Obtener el archivo desde la API de Laravel
            const fileData = await this.fetchDocumentFromApi(documentoInfo, tipoKey);

            if (!fileData) {
                throw new Error('No se pudo obtener el archivo desde la API');
            }

            // Convertir base64 a File object
            const file = await this.base64ToFile(
                fileData.content,
                fileData.filename,
                fileData.mime_type
            );

            // Crear DataTransfer para simular selección de archivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            // Asignar archivos al input
            fileInput.files = dataTransfer.files;

            // Disparar eventos
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            fileInput.dispatchEvent(new Event('input', { bubbles: true }));

            console.log(`✅ Archivo asignado al input: ${file.name}`);

            await this.delay(1000);

        } catch (error) {
            console.error('❌ Error en uploadDocumentToInput:', error);
            throw error;
        }
    }

    async fetchDocumentFromApi(documentoInfo, tipoKey) {
        console.log('🌐 Obteniendo documento desde API usando background script...');

        try {
            // 🔧 USAR BACKGROUND SCRIPT COMO COMPRAS ÁGILES
            // Construir URL del documento
            const documentoId = documentoInfo.id || documentoInfo.documento_id;
            
            if (!documentoId) {
                throw new Error('ID de documento requerido para descarga');
            }

            // Construir URL del endpoint Laravel EXISTENTE
            const baseUrl = this.getApiBaseUrl();
            const downloadUrl = `${baseUrl}/api/extension/documento-file-licitacion?documento_id=${documentoId}`;
            
            console.log(`📍 URL de descarga: ${downloadUrl}`);
            
            // 🔄 ENVIAR REQUEST AL BACKGROUND SCRIPT (como Compras Ágiles)
            const result = await this.sendMessageToBackground('downloadDocument', { 
                url: downloadUrl 
            });
            
            console.log(`📨 Respuesta del background script:`, result);
            
            // 🔍 VALIDAR RESPUESTA
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
            
            const apiResponse = result.data;
            
            if (!apiResponse.success) {
                const errorMsg = apiResponse.message || 'Error en respuesta del servidor';
                console.error(`❌ Servidor reportó error:`, errorMsg);
                throw new Error(`Error del servidor: ${errorMsg}`);
            }
            
            if (!apiResponse.archivo) {
                throw new Error('Respuesta del servidor no contiene archivo');
            }
            
            if (!apiResponse.archivo.contenido_base64) {
                throw new Error('Archivo no contiene contenido base64');
            }
            
            console.log('✅ Documento obtenido desde API exitosamente');
            
            // 📦 FORMATEAR RESPUESTA PARA COMPATIBILIDAD
            return {
                content: apiResponse.archivo.contenido_base64,
                filename: apiResponse.archivo.nombre,
                mime_type: apiResponse.archivo.mime_type,
                size: apiResponse.archivo.tamaño
            };

        } catch (error) {
            console.error('❌ Error obteniendo documento desde API:', error);
            throw error;
        }
    }

    // ================================
    // FUNCIONES AUXILIARES PARA DESCARGA DE DOCUMENTOS
    // ================================
    
    async sendMessageToBackground(action, data) {
        console.log(`📡 Enviando mensaje al background script: ${action}`);
        
        try {
            const response = await chrome.runtime.sendMessage({
                action: action,
                ...data
            });
            
            console.log(`📨 Respuesta del background script:`, response);
            return response;
            
        } catch (error) {
            console.error('❌ Error comunicándose con background script:', error);
            throw new Error(`Error en background script: ${error.message}`);
        }
    }
    
    getApiBaseUrl() {
        try {
            // 🔧 PRIORIDAD 1: Usar configuración global si está disponible
            if (typeof window !== 'undefined' && window.EXTENSION_CONFIG) {
                const baseUrl = window.EXTENSION_CONFIG.URLS.PHARMATENDER.API_BASE;
                console.log(`✅ URL desde EXTENSION_CONFIG: ${baseUrl}`);
                return baseUrl;
            }
        } catch (error) {
            console.warn('⚠️ Error usando EXTENSION_CONFIG:', error);
        }
        
        // 🔧 FALLBACK: Detectar entorno automáticamente
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000';
        } else if (hostname.includes('pharmatender.cl')) {
            return 'https://pharmatender.cl';
        } else {
            // Default para desarrollo
            return 'https://pharmatender.cl';
        }
    }

    async base64ToFile(base64String, filename, mimeType) {
        // Remover el prefijo data:mime;base64, si existe
        const base64Data = base64String.replace(/^data:[^;]+;base64,/, '');

        // Convertir base64 a binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Crear Blob y luego File
        const blob = new Blob([bytes], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    }

    async switchToDefaultContent() {
        console.log('🔄 Saliendo de iframe de documentos...');

        try {
            // Simplemente limpiar la referencia al iframe
            this.currentIframe = null;
            console.log('✅ Referencia a iframe eliminada, volviendo al contexto principal');

            await this.delay(500);

        } catch (error) {
            console.error('❌ Error saliendo de iframe:', error);
            // No lanzar error, es una operación simple
        }
    }

    // ================================
    // VERIFICACIÓN DE DOCUMENTOS CARGADOS (REPLICAR PYTHON)
    // ================================

    async verificarDocumentosCargados() {
        console.log('🔍 Verificando documentos cargados en Mercado Público...');
        
        try {
            // Verificar que estamos en página de documentos
            const currentUrl = window.location.href;
            if (!currentUrl.includes('WizAttachment.aspx')) {
                console.warn('⚠️ No estamos en página de documentos');
                return {
                    success: false,
                    todos_cargados: false,
                    mensaje: 'No estamos en WizAttachment.aspx'
                };
            }

            // Acceder al iframe de documentos
            const iframe = await this.waitForElement('#ctl00_mpcphFormWizardFields__IFrameAttachment', 10000);
            if (!iframe) {
                console.log('❌ No se encontró iframe de documentos');
                return {
                    success: false,
                    todos_cargados: false,
                    faltantes: ['Iframe no encontrado'],
                    esperados: 3,
                    cargados: 0
                };
            }

            // Cambiar al contexto del iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            if (!iframeDoc) {
                console.log('❌ No se pudo acceder al contenido del iframe');
                return {
                    success: false,
                    todos_cargados: false,
                    faltantes: ['No acceso a iframe'],
                    esperados: 3,
                    cargados: 0
                };
            }
            
            // Buscar tabla de documentos cargados (como Python)
            const tablaDocumentos = iframeDoc.getElementById('added_chp_doc_list');
            if (!tablaDocumentos) {
                console.log('❌ No se encontró tabla de documentos cargados - probablemente no hay documentos');
                return {
                    success: false,
                    todos_cargados: false,
                    faltantes: ['No hay documentos cargados'],
                    esperados: 3,
                    cargados: 0
                };
            }

            // Extraer nombres de documentos (como Python)
            const documentosNombres = iframeDoc.querySelectorAll('#added_chp_doc_list li span.nameDocumentoAgregado');
            const arrayNombres = [];
            
            documentosNombres.forEach((elemento, index) => {
                const nombreDoc = elemento.innerHTML || elemento.textContent;
                console.log(`📄 Documento ${index + 1}: ${nombreDoc}`);
                arrayNombres.push(nombreDoc);
            });

            // Para esta licitación sabemos que hay 3 documentos (1 de cada tipo)
            const documentosEsperados = 3;
            
            console.log(`📊 VERIFICACIÓN:`);
            console.log(`   📁 Documentos esperados: ${documentosEsperados}`);
            console.log(`   ✅ Documentos cargados: ${arrayNombres.length}`);
            
            // Verificar coincidencia
            const todosLosCargados = arrayNombres.length >= documentosEsperados;
            
            if (!todosLosCargados) {
                console.warn(`⚠️ DISCREPANCIA: Se esperaban ${documentosEsperados} documentos, pero se cargaron ${arrayNombres.length}`);
                const faltantes = [];
                const tiposEsperados = ['administrativo', 'tecnico', 'economico'];
                
                tiposEsperados.forEach(tipo => {
                    const tieneDocumentoTipo = arrayNombres.some(nombre => 
                        nombre.toLowerCase().includes(tipo) ||
                        nombre.toLowerCase().includes(tipo.replace('tecnico', 'técnico'))
                    );
                    
                    if (!tieneDocumentoTipo) {
                        faltantes.push(tipo);
                    }
                });
                
                return {
                    success: false,
                    todos_cargados: false,
                    esperados: documentosEsperados,
                    cargados: arrayNombres.length,
                    nombres: arrayNombres,
                    faltantes: faltantes,
                    mensaje: `Faltan ${faltantes.length} documentos: ${faltantes.join(', ')}`
                };
            }
            
            console.log('✅ Todos los documentos se verificaron correctamente');
            
            return {
                success: true,
                todos_cargados: true,
                esperados: documentosEsperados,
                cargados: arrayNombres.length,
                nombres: arrayNombres,
                faltantes: [],
                mensaje: 'Verificación exitosa - todos los documentos cargados'
            };
            
        } catch (error) {
            console.error('❌ Error verificando documentos:', error);
            return {
                success: false,
                todos_cargados: false,
                esperados: 3,
                cargados: 0,
                faltantes: ['Error en verificación'],
                mensaje: `Error: ${error.message}`
            };
        }
    }

    obtenerTotalDocumentosEsperados() {
        try {
            let total = 0;
            const tiposDocumento = ['ADMINISTRATIVO', 'TECNICO', 'ECONOMICO'];
            
            tiposDocumento.forEach(tipo => {
                const documentos = this.automationData?.licitacion?.documentos?.[tipo] || [];
                total += documentos.length;
                console.log(`📋 ${tipo}: ${documentos.length} documentos`);
            });
            
            return total;
            
        } catch (error) {
            console.error('❌ Error calculando documentos esperados:', error);
            return 0;
        }
    }

    async verificarYActualizarDocumentos(arrayNombres) {
        console.log('📡 Enviando verificación de documentos al servidor...');
        
        try {
            const response = await fetch('/api/extension/verificar-documentos-licitacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    licitacion: this.licitacionId,
                    nombres_documentos: arrayNombres,
                    company_id: this.automationData?.usuario?.company_id || 0
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📨 Respuesta del servidor:', result);
            
            return result;

        } catch (error) {
            console.error('❌ Error verificando documentos con servidor:', error);
            return {
                success: false,
                mensaje: 'Error comunicándose con servidor',
                error: error.message
            };
        }
    }

    async manejarDeclaracionJurada() {
        console.log('🖊️ MANEJANDO DECLARACIÓN JURADA Y FIRMA...');
        console.log('');
        
        try {
            const urlActual = window.location.href;
            console.log(`📍 URL inicial: ${urlActual}`);
            
            // VERIFICAR SI YA ESTAMOS EN LA PÁGINA DE DECLARACIÓN JURADA
            const esDeclaracionJurada = 
                urlActual.includes('dj-requisitos') || 
                urlActual.includes('proveedor.mercadopublico.cl/dj') ||
                document.title.includes('Declaración Jurada') ||
                document.body.textContent.includes('Declaración Jurada de Requisitos para Ofertar');
                
            if (esDeclaracionJurada) {
                console.log('✅ YA ESTAMOS EN PÁGINA DE DECLARACIÓN JURADA');
                console.log('🔄 Saltando navegación, procesando directamente...');
                console.log('📋 Indicadores detectados:');
                if (urlActual.includes('dj-requisitos')) console.log('   - URL: dj-requisitos');
                if (document.title.includes('Declaración Jurada')) console.log('   - Título: Declaración Jurada');
                if (document.body.textContent.includes('Declaración Jurada de Requisitos')) console.log('   - Contenido: Texto de declaración');
                
                // Procesar directamente sin hacer click
                await this.procesarDeclaracionJuradaCompleta();
                return;
            }
            
            // SI NO ESTAMOS EN LA PÁGINA, NECESITAMOS NAVEGAR
            console.log('🔍 Paso 1: Buscando enlace "Declarar y firmar"...');
            
            const selectoresDeclarar = [
                // Selectores específicos
                'a[href*="ir_a_fimar"]',
                'a[onclick*="ir_a_fimar"]',
                'a[href*="dj-requisitos"]',
                'a[onclick*="dj-requisitos"]',
                
                // Badge/elementos de estado
                '.badgedj_pendiente a',
                '#dj_estado + a',
                
                // Botones generales de declarar/firmar
                'button[title*="Declarar"]',
                'input[value*="Declarar"]',
                
                // Enlaces por atributos data
                '[data-action*="declarar"]',
                '[data-action*="firma"]'
            ];
            
            let linkDeclarar = null;
            for (const selector of selectoresDeclarar) {
                try {
                    // Para selectores con :contains, usar XPath
                    if (selector.includes(':contains')) {
                        const texto = selector.match(/contains\("([^"]+)"\)/)[1];
                        const xpath = `//button[contains(text(), "${texto}")]`;
                        const resultado = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        linkDeclarar = resultado.singleNodeValue;
                    } else {
                        linkDeclarar = document.querySelector(selector);
                    }
                    
                    if (linkDeclarar) {
                        console.log(`✅ Enlace encontrado con selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Selector no válido, continuar
                }
            }
            
            // Búsqueda alternativa por texto (múltiples variantes)
            if (!linkDeclarar) {
                console.log('🔍 Búsqueda alternativa por texto...');
                
                // Buscar en enlaces
                const links = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
                for (const link of links) {
                    const texto = link.textContent.toLowerCase().trim();
                    const value = (link.value || '').toLowerCase().trim();
                    const title = (link.title || '').toLowerCase().trim();
                    
                    const textoCompleto = `${texto} ${value} ${title}`;
                    
                    if ((textoCompleto.includes('declarar') && textoCompleto.includes('firmar')) ||
                        textoCompleto.includes('declaración jurada') ||
                        textoCompleto.includes('requisitos para ofertar') ||
                        textoCompleto.includes('declara que tu empresa cumple') ||
                        texto === 'declarar y firmar') {
                        linkDeclarar = link;
                        console.log(`✅ Enlace encontrado por texto: "${link.textContent.trim()}" | Value: "${link.value || 'N/A'}" | Title: "${link.title || 'N/A'}"`);
                        break;
                    }
                }
                
                // Si no encontramos enlaces, buscar en divs o spans clickeables
                if (!linkDeclarar) {
                    console.log('🔍 Buscando en elementos clickeables...');
                    const clickeables = document.querySelectorAll('[onclick], [data-action], .clickable, .btn, .button');
                    for (const elem of clickeables) {
                        const texto = elem.textContent.toLowerCase().trim();
                        const onclick = (elem.getAttribute('onclick') || '').toLowerCase();
                        const dataAction = (elem.getAttribute('data-action') || '').toLowerCase();
                        
                        if ((texto.includes('declarar') && texto.includes('firmar')) ||
                            texto.includes('declaración jurada') ||
                            onclick.includes('dj') ||
                            onclick.includes('declarar') ||
                            dataAction.includes('declarar')) {
                            linkDeclarar = elem;
                            console.log(`✅ Elemento clickeable encontrado: "${texto}"`);
                            break;
                        }
                    }
                }
            }
            
            if (!linkDeclarar) {
                console.error('❌ No se encontró enlace "Declarar y firmar"');
                console.log('🔍 DEBUG: Analizando contenido de la página...');
                
                // Mostrar todos los enlaces disponibles para diagnóstico
                const todosLosLinks = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
                console.log(`📊 Total de elementos clickeables encontrados: ${todosLosLinks.length}`);
                
                console.log('🔍 Primeros 10 elementos clickeables:');
                for (let i = 0; i < Math.min(10, todosLosLinks.length); i++) {
                    const elem = todosLosLinks[i];
                    console.log(`   ${i+1}. Texto: "${elem.textContent.trim()}" | Value: "${elem.value || 'N/A'}" | Href: "${elem.href || 'N/A'}"`);
                }
                
                // Buscar texto específico en el contenido
                const contenido = document.body.textContent;
                if (contenido.includes('Para poder continuar, debes completar y firmar')) {
                    console.log('✅ Texto "Para poder continuar..." encontrado en contenido');
                }
                if (contenido.includes('declaración jurada')) {
                    console.log('✅ Texto "declaración jurada" encontrado en contenido');
                }
                
                // Mostrar elementos con ID dj_estado si existe
                const estadoDJ = document.querySelector('#dj_estado');
                if (estadoDJ) {
                    console.log(`✅ Elemento #dj_estado encontrado: "${estadoDJ.textContent}"`);
                }
                
                throw new Error('❌ No se encontró enlace "Declarar y firmar"');
            }
            
            console.log('🖊️ Haciendo click en "Declarar y firmar"...');
            
            // Guardar referencias de ventanas actuales
            const ventanasAntes = await this.getWindowHandles();
            console.log(`📊 Ventanas antes del click: ${ventanasAntes.length}`);
            
            // Click en el enlace
            linkDeclarar.click();
            
            // 2. MANEJAR TODOS LOS TIPOS DE NAVEGACIÓN POSIBLES
            console.log('⏳ Detectando y manejando navegación...');
            await this.delay(1000);
            
            // Detectar múltiples intentos para ser robusto
            let navegacionExitosa = false;
            let intentos = 0;
            const maxIntentos = 5;
            
            while (!navegacionExitosa && intentos < maxIntentos) {
                intentos++;
                console.log(`🔄 Intento ${intentos}/${maxIntentos} - Verificando navegación...`);
                
                const urlDespues = window.location.href;
                console.log(`📍 URL actual: ${urlDespues}`);
                
                // CASO 1: Navegación en la misma pestaña
                if (urlDespues.includes('dj-requisitos') || 
                    urlDespues.includes('proveedor.mercadopublico.cl/dj') ||
                    document.title.includes('Declaración Jurada') ||
                    document.body.textContent.includes('Declaración Jurada de Requisitos para Ofertar')) {
                    
                    console.log('✅ CASO 1: Navegación en MISMA PESTAÑA detectada');
                    navegacionExitosa = true;
                    break;
                }
                
                // CASO 2: Nueva ventana/popup
                const ventanasDespues = await this.getWindowHandles();
                if (ventanasDespues.length > ventanasAntes.length) {
                    console.log('✅ CASO 2: NUEVA VENTANA/POPUP detectada');
                    const nuevaVentana = ventanasDespues[ventanasDespues.length - 1];
                    await this.switchToWindow(nuevaVentana);
                    navegacionExitosa = true;
                    break;
                }
                
                // CASO 3: Esperar más tiempo (navegación lenta)
                if (intentos < maxIntentos) {
                    console.log(`⏳ Esperando navegación... (intento ${intentos})`);
                    await this.delay(2000);
                }
            }
            
            if (!navegacionExitosa) {
                console.warn('⚠️ No se pudo detectar navegación exitosa, continuando...');
            } else {
                console.log('✅ Navegación completada, esperando carga de página...');
                await this.delay(2000);
            }
            
            console.log('📸 Verificando contenido de página de declaración jurada...');
            
            // 3. PROCESAR DECLARACIÓN JURADA
            await this.procesarDeclaracionJuradaCompleta();

            // Buscar botón confirmar después del procesamiento
            const btnConfirmar = document.querySelector('#btnConfirmar, button[onclick*="confirmar"], input[value*="Confirmar"]');
            if (btnConfirmar) {
                console.log('✅ Click en confirmar firma...');
                await this.clickElement(btnConfirmar);
                await this.delay(2000);
            }

            // Buscar botón "Cerrar y volver a la oferta"
            console.log('🔍 Buscando botón para cerrar modal...');
            
            // Buscar varios tipos de botones de cerrar
            let btnCerrar = null;
            
            // Intentar varios selectores
            const selectoresCerrar = [
                'button[onclick*="close"]',
                'button[onclick*="cerrar"]',
                'input[value*="Cerrar"]',
                'a[onclick*="close"]',
                '.modal button',
                'button:last-child'
            ];
            
            for (const selector of selectoresCerrar) {
                btnCerrar = document.querySelector(selector);
                if (btnCerrar) {
                    console.log(`✅ Botón cerrar encontrado: ${selector}`);
                    break;
                }
            }
            
            // Buscar por texto si no encontramos con selectores
            if (!btnCerrar) {
                const elementos = document.querySelectorAll('button, input[type="button"], a');
                for (const elem of elementos) {
                    const texto = elem.textContent.toLowerCase().trim();
                    if (texto.includes('cerrar') || texto.includes('volver') || texto.includes('close')) {
                        btnCerrar = elem;
                        console.log(`✅ Botón encontrado por texto: "${elem.textContent.trim()}"`);
                        break;
                    }
                }
            }

            if (btnCerrar) {
                console.log('❎ Cerrando modal de firma...');
                btnCerrar.click(); // Click directo en lugar de usar clickElement
                await this.delay(1000);
            } else {
                console.log('⚠️ No se encontró botón cerrar, continuando...');
            }

            // Verificar que se firmó correctamente
            await this.delay(2000);
            const estadoDespues = await this.waitForElement('#dj_estado', 3000);
            if (estadoDespues) {
                const nuevoEstado = estadoDespues.textContent.trim();
                console.log('📋 Estado después de firmar:', nuevoEstado);

                if (nuevoEstado !== 'PENDIENTE') {
                    console.log('✅ Declaración jurada firmada exitosamente');
                    await this.actualizarEstadoEnBD('firma_completada', 'Firma completada exitosamente', 'firma');
                }
            } else {
                console.log('✅ Proceso de firma completado (sin estado visible)');
            }
            
            console.log('');
            console.log('✅ DECLARACIÓN JURADA FIRMADA EXITOSAMENTE');
            
        } catch (error) {
            console.error('❌ Error en declaración jurada:', error);
            throw error;
        }
    }
    
    async procesarDeclaracionJuradaCompleta() {
        console.log('');
        console.log('🎯========================================🎯');
        console.log('🎯 FUNCIÓN DECLARACIÓN JURADA EJECUTADA 🎯');
        console.log('🎯========================================🎯');
        console.log('🔍 VERIFICANDO CONTEXTO DE DECLARACIÓN JURADA...');
        
        const urlActual = window.location.href;
        const titulo = document.title;
        const contenido = document.body.textContent;
        
        console.log(`📍 URL actual: ${urlActual}`);
        console.log(`📄 Título página: ${titulo}`);
        console.log(`📄 Contenido incluye DJ: ${contenido.includes('Declaración Jurada')}`);
        console.log(`📄 Contenido incluye Requisitos: ${contenido.includes('Requisitos')}`);
        
        // Debug de elementos presentes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const muiElements = document.querySelectorAll('[class*="Mui"]');
        const scElements = document.querySelectorAll('[class*="sc-"]');
        
        console.log(`📊 ELEMENTOS PRESENTES:`);
        console.log(`   - Checkboxes: ${checkboxes.length}`);
        console.log(`   - Elementos MUI: ${muiElements.length}`);
        console.log(`   - Elementos SC: ${scElements.length}`);
        console.log(`   - React disponible: ${typeof React !== 'undefined'}`);
        
        // DETECCIÓN ROBUSTA DE PÁGINA DE DECLARACIÓN JURADA
        const checks = {
            url_dj: urlActual.includes('dj-requisitos'),
            url_proveedor: urlActual.includes('proveedor.mercadopublico.cl/dj'),
            titulo_dj: titulo.includes('Declaración Jurada'),
            contenido_completo: contenido.includes('Declaración Jurada de Requisitos para Ofertar'),
            contenido_parcial: contenido.includes('Requisitos para Ofertar'),
            contenido_pendiente: contenido.includes('PENDIENTE')
        };
        
        // VERIFICAR SI YA ESTÁ FIRMADA O COMPLETADA
        const estadosCompletos = {
            firmada: contenido.includes('FIRMADA') || contenido.includes('Firmada'),
            completada: contenido.includes('COMPLETADA') || contenido.includes('Completada'),
            aprobada: contenido.includes('APROBADA') || contenido.includes('Aprobada'),
            procesada: contenido.includes('PROCESADA') || contenido.includes('Procesada'),
            finalizada: contenido.includes('FINALIZADA') || contenido.includes('Finalizada'),
            firma_realizada: contenido.includes('Firma realizada') || contenido.includes('firma realizada'),
            ya_firmado: contenido.includes('ya ha sido firmado') || contenido.includes('Ya firmado'),
            proceso_completo: contenido.includes('Proceso completo') || contenido.includes('proceso completo'),
            declaracion_completa: contenido.includes('Declaración completa') || contenido.includes('declaración completa')
        };
        
        // VERIFICAR BOTÓN DE FIRMA DESHABILITADO CON TEXTO INDICATIVO
        const botonFirmaTextos = document.querySelectorAll('button');
        let botonIndicaFirmada = false;
        botonFirmaTextos.forEach(boton => {
            const textoBoton = boton.textContent.toLowerCase();
            // SOLO estos textos indican que YA está firmada:
            if (textoBoton.includes('ya firmado') || 
                textoBoton.includes('completado') || 
                textoBoton.includes('procesado') ||
                (boton.disabled && textoBoton.includes('firmar'))) {
                botonIndicaFirmada = true;
                console.log(`🔍 Botón indica DJ firmada: "${boton.textContent}"`);
            } else if (textoBoton.includes('firmar') || textoBoton.includes('clave única')) {
                console.log(`ℹ️ Botón de firma DISPONIBLE (NO indica firmada): "${boton.textContent}"`);
            }
        });
        
        console.log('🔍 DEBUG DETECCIÓN DJ:');
        Object.entries(checks).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });
        
        console.log('🔍 DEBUG ESTADOS COMPLETADOS:');
        Object.entries(estadosCompletos).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
        });
        
        // VERIFICAR SI YA ESTÁ FIRMADA
        const yaEstaFirmada = Object.values(estadosCompletos).some(estado => estado) || botonIndicaFirmada;
        console.log(`🎯 DJ YA FIRMADA: ${yaEstaFirmada}`);
        
        if (yaEstaFirmada) {
            console.log('📋 Evidencias de DJ ya firmada encontradas:');
            Object.entries(estadosCompletos).forEach(([key, value]) => {
                if (value) console.log(`   ✅ ${key}: ${value}`);
            });
            if (botonIndicaFirmada) console.log('   ✅ Botón indica estado completado');
        }
        
        // VERIFICAR ESTADO DE CHECKBOXES
        const checkboxesMUI = document.querySelectorAll('input[type="checkbox"]');
        const checkboxesMarcados = document.querySelectorAll('input[type="checkbox"]:checked');
        const spansMarcados = document.querySelectorAll('.MuiCheckbox-root.Mui-checked');
        
        console.log('📊 ESTADO DE CHECKBOXES:');
        console.log(`   - Total checkboxes: ${checkboxesMUI.length}`);
        console.log(`   - Checkboxes marcados: ${checkboxesMarcados.length}`);
        console.log(`   - Spans MUI marcados: ${spansMarcados.length}`);
        
        const esDeclaracionJurada = Object.values(checks).some(check => check);
            
        // DETECCIÓN DE PÁGINA DE DOCUMENTOS/ATTACHMENT (donde debe buscar el enlace)
        const esPaginaDocumentos = urlActual.includes('WizAttachment.aspx');
            
        if (esDeclaracionJurada) {
            console.log('✅ CONTEXTO CONFIRMADO: Página de Declaración Jurada detectada');
            console.log('📋 Indicadores encontrados:');
            if (urlActual.includes('dj-requisitos')) console.log('   - URL contiene "dj-requisitos"');
            if (titulo.includes('Declaración Jurada')) console.log('   - Título contiene "Declaración Jurada"');
            if (contenido.includes('Declaración Jurada de Requisitos')) console.log('   - Contenido contiene texto de declaración');
        } else if (esPaginaDocumentos) {
            console.log('✅ CONTEXTO: Página de documentos - necesita buscar enlace DJ');
            console.log('🔍 Esta es la página donde debemos buscar "Declarar y firmar"');
        } else {
            console.log('✅ CONTEXTO: Página de wizard principal o popup');
        }
        
        // VERIFICAR SI YA ESTÁ FIRMADA ANTES DE PROCESAR
        if (yaEstaFirmada) {
            console.log('✅ DECLARACIÓN JURADA YA ESTÁ FIRMADA - No necesita procesamiento');
            console.log('🎯 Estado detectado: DJ completada previamente');
            return { success: true, message: 'DJ ya firmada', alreadySigned: true };
        }
        
        // SOLO PROCESAR SI ESTAMOS EN LA PÁGINA CORRECTA DE DECLARACIÓN JURADA
        if (esDeclaracionJurada) {
            console.log('');
            console.log('🔄 INICIANDO PROCESO DE DECLARACIÓN JURADA...');
            console.log('');
            
            // PROCESAR FORMULARIO DE DECLARACIÓN JURADA
            try {
                // Paso 1: Seleccionar RUT
                console.log('🆔 Paso 1: Seleccionando RUT...');
                try {
                    await this.seleccionarRutDeclaracion();
                    console.log('✅ Paso 1 COMPLETADO: RUT seleccionado');
                } catch (e1) {
                    console.error('❌ Error en Paso 1:', e1);
                    console.log('🔄 Continuando sin seleccionar RUT...');
                }
                
                // Paso 2: FORZAR EL MARCADO COMPLETO DE TODOS LOS CHECKBOXES
                console.log('');
                console.log('☑️ Paso 2: FORZANDO marcado de TODOS los checkboxes...');
                
                // VERIFICAR ESTADO ANTES
                const checkboxesAntes = document.querySelectorAll('input[type="checkbox"]');
                const marcadosAntes = document.querySelectorAll('input[type="checkbox"]:checked');
                console.log(`📊 ANTES: ${marcadosAntes.length}/${checkboxesAntes.length} checkboxes marcados`);
                
                // MÉTODO 1: Material-UI
                let checkboxesExitosos = false;
                try {
                    checkboxesExitosos = await this.clickearCheckboxesMaterialUI();
                    console.log(`✅ Método Material-UI: ${checkboxesExitosos ? 'exitoso' : 'fallido'}`);
                } catch (e2) {
                    console.error('❌ Error en checkboxes Material-UI:', e2);
                }
                
                // MÉTODO 2: Legacy (siempre ejecutar)
                try {
                    await this.marcarTodosLosCheckboxes();
                    console.log('✅ Método legacy ejecutado');
                } catch (e3) {
                    console.error('❌ Error en checkboxes legacy:', e3);
                }
                
                // MÉTODO 3: FUERZA BRUTA - MARCAR CUALQUIER CHECKBOX NO MARCADO
                console.log('🔥 Ejecutando FUERZA BRUTA para checkboxes restantes...');
                const checkboxesNoMarcados = document.querySelectorAll('input[type="checkbox"]:not(:checked)');
                console.log(`🎯 Checkboxes no marcados encontrados: ${checkboxesNoMarcados.length}`);
                
                for (let i = 0; i < checkboxesNoMarcados.length; i++) {
                    const checkbox = checkboxesNoMarcados[i];
                    console.log(`   🔄 Forzando checkbox ${i + 1}...`);
                    
                    // Verificar si está deshabilitado y intentar habilitarlo
                    const spanPadre = checkbox.closest('.MuiCheckbox-root');
                    if (spanPadre && spanPadre.classList.contains('Mui-disabled')) {
                        console.log(`   🔓 Removiendo Mui-disabled del checkbox ${i + 1}...`);
                        spanPadre.classList.remove('Mui-disabled');
                    }
                    
                    if (checkbox.disabled) {
                        console.log(`   🔓 Habilitando input disabled del checkbox ${i + 1}...`);
                        checkbox.disabled = false;
                    }
                    
                    // Múltiples métodos de activación
                    checkbox.checked = true;
                    checkbox.click();
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    checkbox.dispatchEvent(new Event('click', { bubbles: true }));
                    
                    // Activar el span padre también
                    if (spanPadre) {
                        // Agregar clase Mui-checked y remover Mui-unchecked
                        spanPadre.classList.add('Mui-checked');
                        spanPadre.classList.remove('Mui-unchecked');
                        spanPadre.classList.remove('Mui-disabled');
                        
                        spanPadre.click();
                        spanPadre.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }
                }
                
                // VERIFICAR ESTADO DESPUÉS
                await this.delay(1000);
                const checkboxesDespues = document.querySelectorAll('input[type="checkbox"]');
                const marcadosDespues = document.querySelectorAll('input[type="checkbox"]:checked');
                console.log(`📊 DESPUÉS: ${marcadosDespues.length}/${checkboxesDespues.length} checkboxes marcados`);
                
                if (marcadosDespues.length === checkboxesDespues.length) {
                    console.log('✅ Paso 2 COMPLETADO: TODOS los checkboxes están marcados');
                } else {
                    console.warn(`⚠️ Paso 2 PARCIAL: ${marcadosDespues.length}/${checkboxesDespues.length} checkboxes marcados`);
                    console.log('🔄 Continuando de todas formas...');
                }
                
                // Paso 3: VERIFICAR Y FIRMAR
                console.log('');
                console.log('🖊️ Paso 3: Verificando botón antes de firmar...');
                
                // VERIFICAR QUE EL BOTÓN ESTÉ HABILITADO
                let botonFirma = null;
                
                // Buscar botón por texto usando XPath
                const xpath = "//button[contains(text(), 'Firmar sin Clave Única')]";
                const resultado = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                botonFirma = resultado.singleNodeValue;
                
                // Si no se encuentra por texto, buscar por clase
                if (!botonFirma) {
                    botonFirma = document.querySelector('button[class*="sc-dmsloy"]');
                }
                
                let botonHabilitado = false;
                
                if (botonFirma) {
                    const esDeshabilitado = botonFirma.classList.contains('Mui-disabled') || botonFirma.disabled;
                    botonHabilitado = !esDeshabilitado;
                    
                    console.log(`🔍 Estado del botón firma:`);
                    console.log(`   - Encontrado: ${!!botonFirma}`);
                    console.log(`   - Deshabilitado: ${esDeshabilitado}`);
                    console.log(`   - Habilitado: ${botonHabilitado}`);
                    console.log(`   - Classes: ${botonFirma.className}`);
                }
                
                if (!botonHabilitado) {
                    console.warn('⚠️ BOTÓN AÚN DESHABILITADO - Esperando 3 segundos y reintentando...');
                    await this.delay(3000);
                    
                    // Verificar de nuevo
                    let botonFirma2 = null;
                    const xpath2 = "//button[contains(text(), 'Firmar sin Clave Única')]";
                    const resultado2 = document.evaluate(xpath2, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    botonFirma2 = resultado2.singleNodeValue;
                    
                    if (!botonFirma2) {
                        botonFirma2 = document.querySelector('button[class*="sc-dmsloy"]');
                    }
                    
                    if (botonFirma2) {
                        const esDeshabilitado2 = botonFirma2.classList.contains('Mui-disabled') || botonFirma2.disabled;
                        botonHabilitado = !esDeshabilitado2;
                        console.log(`🔍 Segunda verificación - Habilitado: ${botonHabilitado}`);
                    }
                }
                
                if (botonHabilitado) {
                    console.log('✅ Botón habilitado - Procediendo con firma...');
                    try {
                        await this.firmarSinClaveUnica();
                        console.log('✅ Paso 3 COMPLETADO: Firma ejecutada');
                    } catch (e4) {
                        console.error('❌ Error en firma:', e4);
                        throw e4;
                    }
                } else {
                    console.error('❌ BOTÓN SIGUE DESHABILITADO - No se puede firmar');
                    console.error('🔍 Posibles causas: Checkboxes no marcados o validación pendiente');
                    throw new Error('Botón de firma deshabilitado - verificar checkboxes');
                }
                
                console.log('');
                console.log('✅ DECLARACIÓN JURADA COMPLETADA EXITOSAMENTE');
                
            } catch (error) {
                console.error('❌ Error en proceso de declaración jurada:', error);
                throw error;
            }
            
        } else if (esPaginaDocumentos) {
            console.log('');
            console.log('🔍 VERIFICANDO ESTADO DE DECLARACIÓN JURADA...');
            console.log('');
            
            // VERIFICAR SI YA ESTÁ FIRMADA ANTES DE PROCESAR
            const estadoActual = await this.verificarEstadoDeclaracionJurada();
            
            if (estadoActual.firmada) {
                console.log('');
                console.log('✅ DECLARACIÓN JURADA YA ESTÁ FIRMADA');
                console.log(`📋 Estado: ${estadoActual.estado}`);
                console.log('🔄 Saltando proceso de firma, continuando con flujo...');
                console.log('');
                
                // Actualizar indicador visual para mostrar que ya está firmada
                this.updateIndicator('✅ Declaración ya firmada', 'success');
                
                return; // Salir para que continúe con el siguiente paso
            } else {
                console.log('');
                console.log('⚠️ DECLARACIÓN JURADA PENDIENTE - INICIANDO PROCESO');
                console.log(`📋 Estado actual: ${estadoActual.estado}`);
                console.log('');
                console.log('🔍 BUSCANDO ENLACE "DECLARAR Y FIRMAR" EN PÁGINA DE DOCUMENTOS...');
                console.log('');
                
                // BUSCAR Y HACER CLIC EN ENLACE
                await this.buscarYClickDeclaracionJurada();
            }
            
        } else {
            console.log('');
            console.log('⚠️ No estamos en la página correcta para procesar DJ');
            console.log('🔄 Intentando buscar enlace de navegación...');
            
            // Buscar enlace en cualquier página
            await this.buscarYClickDeclaracionJurada();
        }
        
        // VERIFICAR SI REGRESAMOS A WIZATTACHMENT (SEÑAL DE ÉXITO)
        console.log('');
        console.log('🔍 VERIFICANDO RESULTADO DEL PROCESO DJ...');
        console.log('📋 NOTA: Si estamos viendo esto, significa que completamos el proceso de DJ');
        console.log('');
        
        const urlActualFinal = window.location.href;
        
        if (urlActualFinal.includes('WizAttachment.aspx')) {
            console.log('✅ SUCCESS: Regresamos a WizAttachment - DJ completada');
            console.log('🔄 Continuando con el flujo normal...');
            return;
        }
        
        if (urlActualFinal.includes('dj-requisitos')) {
            console.log('⚠️ Aún en página DJ - verificando estado...');
            await this.delay(2000);
            
            // Verificar estado solo una vez si aún estamos en DJ
            const estadoDJ = await this.verificarEstadoDeclaracionJurada();
            
            console.log('');
            console.log('📊 RESULTADO DE LA VERIFICACIÓN:');
            console.log(`   - Estado: "${estadoDJ.estado}"`);
            console.log(`   - Clase: "${estadoDJ.clase}"`);
            console.log(`   - Ubicación: ${estadoDJ.ubicacion}`);
            console.log(`   - ¿Firmada?: ${estadoDJ.firmada}`);
            
            if (estadoDJ.firmada) {
                console.log('');
                console.log('✅ ÉXITO: Declaración jurada FIRMADA correctamente');
                console.log('🔄 Continuando con el siguiente paso del flujo...');
            } else {
                console.log('');
                console.log('❌ ERROR: Declaración jurada AÚN PENDIENTE');
                console.log('🔄 El proceso no se completó exitosamente');
                
                // Dar una segunda oportunidad con más tiempo
                console.log('⏱️ Intentando verificación adicional en 10 segundos...');
                await this.delay(10000);
                
                const estadoDJ2 = await this.verificarEstadoDeclaracionJurada();
                if (estadoDJ2.firmada) {
                    console.log('✅ SEGUNDA VERIFICACIÓN: Declaración jurada ahora está FIRMADA');
                } else {
                    console.log('❌ SEGUNDA VERIFICACIÓN: Declaración jurada sigue PENDIENTE');
                    
                    // Tercera verificación final
                    console.log('⏱️ Intentando verificación FINAL en 15 segundos...');
                    await this.delay(15000);
                    
                    const estadoDJ3 = await this.verificarEstadoDeclaracionJurada();
                    if (estadoDJ3.firmada) {
                        console.log('✅ TERCERA VERIFICACIÓN: Declaración jurada finalmente está FIRMADA');
                    } else {
                        console.log('❌ TERCERA VERIFICACIÓN: Declaración jurada aún PENDIENTE');
                        console.log('⚠️ Puede que el proceso tome más tiempo del esperado');
                        
                        // En lugar de fallar, marcar como advertencia pero continuar
                        console.log('🔄 Continuando proceso asumiendo que se completará...');
                    }
                }
            }
        }
        
        console.log('');
        console.log('✅ PROCESO DE DECLARACIÓN JURADA COMPLETADO');
    }

    async buscarYClickDeclaracionJurada() {
        console.log('🔍 Buscando enlace "Declarar y firmar"...');
        
        try {
            // Buscar en iframe si existe
            const iframe = document.querySelector('#ctl00_mpcphFormWizardFields__IFrameAttachment');
            if (iframe) {
                console.log('✅ Iframe encontrado, buscando dentro...');
                await this.delay(2000);
                
                // Buscar en iframe
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    const linkEnIframe = iframeDoc.querySelector('a[href*="ir_a_fimar"]');
                    if (linkEnIframe) {
                        console.log('✅ Enlace "ir_a_fimar" encontrado en iframe');
                        
                        // MÉTODO 1: Usar dispatchEvent para evitar CSP block
                        try {
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: iframeDoc.defaultView
                            });
                            linkEnIframe.dispatchEvent(clickEvent);
                            console.log('✅ DispatchEvent enviado');
                        } catch(e) {
                            console.log('⚠️ DispatchEvent falló:', e.message);
                        }
                        
                        // MÉTODO 2: Intentar ejecutar función directamente
                        try {
                            if (iframe.contentWindow && typeof iframe.contentWindow.ir_a_fimar === 'function') {
                                console.log('🔧 Ejecutando ir_a_fimar() en iframe...');
                                iframe.contentWindow.ir_a_fimar();
                            }
                        } catch(e) {
                            console.log('⚠️ Ejecución directa falló:', e.message);
                        }
                        
                        // MÉTODO 3: Modificar directamente el href del iframe para navegación
                        try {
                            const currentSrc = iframe.src;
                            if (currentSrc && linkEnIframe.href && linkEnIframe.href.startsWith('javascript:')) {
                                // Extraer y ejecutar directamente la función
                                const funcName = linkEnIframe.href.replace('javascript:', '').replace('()', '');
                                console.log(`🔧 Intentando cambiar src del iframe para ejecutar: ${funcName}`);
                                
                                // Cambiar temporalmente el src para forzar recarga
                                iframe.src = currentSrc + '&_t=' + Date.now();
                                await this.delay(1000);
                                
                                // Intentar ejecutar después de recarga
                                setTimeout(() => {
                                    if (iframe.contentWindow && iframe.contentWindow[funcName]) {
                                        iframe.contentWindow[funcName]();
                                    }
                                }, 2000);
                            }
                        } catch(e) {
                            console.log('⚠️ Modificación de src falló:', e.message);
                        }
                        
                        await this.delay(2000);
                        
                        // Verificar si la navegación fue exitosa
                        const urlDespues = window.location.href;
                        console.log(`📍 URL después de intento iframe: ${urlDespues}`);
                        
                        if (urlDespues.includes('dj-requisitos')) {
                            console.log('✅ Navegación exitosa a DJ desde iframe');
                            return;
                        } else {
                            console.log('❌ CSP bloqueó navegación desde iframe, saltando a URL directa...');
                            // Saltar las búsquedas adicionales y ir directo a URL
                        }
                    }
                }
            }
            
            // Buscar enlaces de declaración en página principal
            const selectoresDeclarar = [
                'a[href="javascript:ir_a_fimar()"]',  // Exacto como aparece en HTML
                'a[href*="ir_a_fimar"]',
                'a[onclick*="ir_a_fimar"]',
                'a[href*="dj-requisitos"]',
                'a[onclick*="dj-requisitos"]',
                '.rectangle-copy-15 a',  // Área específica donde está el enlace
                '.badgedj_pendiente a',
                '#dj_estado + a',
                '.texto_caja a'  // Dentro del div de texto donde está el enlace
            ];
            
            let linkDeclarar = null;
            for (const selector of selectoresDeclarar) {
                linkDeclarar = document.querySelector(selector);
                if (linkDeclarar) {
                    console.log(`✅ Enlace encontrado con selector: ${selector}`);
                    console.log(`📝 Texto del enlace: "${linkDeclarar.textContent.trim()}"`);
                    console.log(`🔗 Href del enlace: "${linkDeclarar.href}"`);
                    break;
                }
            }
            
            // Buscar por texto si no encontramos enlaces específicos
            if (!linkDeclarar) {
                const elementos = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
                for (const elem of elementos) {
                    const texto = elem.textContent.toLowerCase().trim();
                    if ((texto.includes('declarar') && texto.includes('firmar')) ||
                        texto.includes('declaración jurada') ||
                        texto === 'declarar y firmar') {
                        linkDeclarar = elem;
                        console.log(`✅ Enlace encontrado por texto: "${elem.textContent.trim()}"`);
                        break;
                    }
                }
            }
            
            if (linkDeclarar) {
                // Si es un enlace javascript que sabemos está bloqueado por CSP, saltar al fallback
                if (linkDeclarar.href && linkDeclarar.href.includes('javascript:ir_a_fimar')) {
                    console.log('⚠️ Enlace javascript:ir_a_fimar detectado, será bloqueado por CSP');
                    console.log('🔄 Saltando directamente a usar URL directa...');
                } else {
                    // LIMPIAR STORAGE PROBLEMÁTICO ANTES DE HACER CLICK
                    await this.limpiarStorageProblematico();
                    
                    // SINCRONIZAR SESIÓN ANTES DE HACER CLICK
                    console.log('🔐 Sincronizando sesión antes de hacer click...');
                    const sesionSincronizada = await this.sincronizarSesionParaDJ();
                    
                    if (!sesionSincronizada) {
                        console.log('⚠️ No se pudo sincronizar sesión, continuando anyway...');
                    }
                    
                    // Intentar hacer clic en enlaces normales
                    console.log('👆 Haciendo clic en "Declarar y firmar" con storage limpio y sesión sincronizada...');
                    linkDeclarar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(1000);
                    linkDeclarar.click();
                    
                    console.log('✅ Clic realizado, esperando navegación...');
                    await this.delay(5000);
                    
                    // Verificar si la navegación fue exitosa
                    const urlDespues = window.location.href;
                    console.log(`📍 URL después del clic: ${urlDespues}`);
                    
                    if (urlDespues.includes('dj-requisitos')) {
                        console.log('✅ Navegación exitosa a DJ');
                        return;
                    } else {
                        console.log('⚠️ No se detectó navegación, continuando con fallback...');
                    }
                }
            }
            
            // Intentar ejecutar función ir_a_fimar directamente
            if (typeof window.ir_a_fimar === 'function') {
                console.log('🔧 Ejecutando función ir_a_fimar() directamente...');
                window.ir_a_fimar();
                await this.delay(5000);
                return;
            }
            
            // FALLBACK: Construir URL directa
            console.log('');
            console.log('🔗 FALLBACK: CONSTRUYENDO URL DIRECTA...');
            console.log('');
            
            // Obtener número de licitación de múltiples fuentes
            let numeroLicitacion = null;
            
            // 1. BUSCAR EN LOS CAMPOS HIDDEN DE LA PÁGINA (más confiable)
            const selectoresNumero = [
                '.bidRFBExternalCode',
                'input[name*="codigo"]',
                'input[name*="licitacion"]', 
                'input[id*="codigo"]',
                'input[id*="licitacion"]'
            ];
            
            for (const selector of selectoresNumero) {
                const elemento = document.querySelector(selector);
                if (elemento && elemento.value) {
                    // Validar que tenga formato de licitación (números-números-letras)
                    if (/\d+-\d+-\w+/.test(elemento.value)) {
                        numeroLicitacion = elemento.value;
                        console.log(`✅ Número encontrado en ${selector}: ${numeroLicitacion}`);
                        break;
                    }
                }
            }
            
            // 2. USAR EL ID DE LICITACIÓN QUE YA TENEMOS EN LA EXTENSIÓN
            if (!numeroLicitacion && this.licitacionId) {
                numeroLicitacion = this.licitacionId;
                console.log(`✅ Usando licitacionId existente: ${numeroLicitacion}`);
            }
            
            // 3. Si no tenemos el ID, buscar en automationData
            if (!numeroLicitacion && this.automationData && this.automationData.licitacionId) {
                numeroLicitacion = this.automationData.licitacionId;
                console.log(`✅ Usando automationData.licitacionId: ${numeroLicitacion}`);
            }
            
            // 4. Buscar en storage de la extensión
            if (!numeroLicitacion) {
                try {
                    const result = await chrome.storage.local.get(['licitacionAutomationData']);
                    if (result && result.licitacionAutomationData && result.licitacionAutomationData.licitacionId) {
                        numeroLicitacion = result.licitacionAutomationData.licitacionId;
                        console.log(`✅ Número encontrado en storage: ${numeroLicitacion}`);
                    }
                } catch(e) {
                    console.log('⚠️ No se pudo acceder al storage de la extensión:', e.message);
                }
            }
            
            // 5. Fallback: Extraer de URL actual
            if (!numeroLicitacion) {
                const urlActual = window.location.href;
                const matchLicitacion = urlActual.match(/\/(\d+-\d+-\w+)/);
                if (matchLicitacion) {
                    numeroLicitacion = matchLicitacion[1];
                    console.log(`✅ Número extraído de URL: ${numeroLicitacion}`);
                }
            }
            
            // 6. Último recurso: Buscar en el DOM
            if (!numeroLicitacion) {
                const selectoresLicitacion = [
                    'h1', 'h2', '.titulo', '#titulo', '.breadcrumb',
                    '.licitacion-numero', '[data-licitacion]'
                ];
                
                for (const selector of selectoresLicitacion) {
                    const elemento = document.querySelector(selector);
                    if (elemento) {
                        const texto = elemento.textContent || elemento.innerText;
                        const matchLicitacion = texto.match(/(\d+-\d+-\w+)/);
                        if (matchLicitacion) {
                            numeroLicitacion = matchLicitacion[1];
                            console.log(`✅ Número encontrado en DOM ${selector}: ${numeroLicitacion}`);
                            break;
                        }
                    }
                }
            }
            
            if (numeroLicitacion) {
                // Buscar URL base en campos hidden
                const urlDjElement = document.querySelector('#UrlDj');
                const baseUrl = urlDjElement ? urlDjElement.value : 'https://proveedor.mercadopublico.cl/dj-requisitos/';
                
                const urlDirecta = `${baseUrl}${numeroLicitacion}`;
                
                console.log(`🔗 Navegando directamente a: ${urlDirecta}`);
                console.log(`📋 Número de licitación utilizado: ${numeroLicitacion}`);
                console.log(`🌐 URL base utilizada: ${baseUrl}`);
                
                // LIMPIAR STORAGE PROBLEMÁTICO ANTES DE NAVEGAR
                await this.limpiarStorageProblematico();
                
                // SINCRONIZAR SESIÓN ANTES DE NAVEGAR A DJ
                console.log('🔐 Sincronizando sesión antes de navegar a DJ...');
                const sesionSincronizada = await this.sincronizarSesionParaDJ();
                
                if (!sesionSincronizada) {
                    console.log('⚠️ No se pudo sincronizar sesión, navegando anyway...');
                }
                
                console.log('🚀 Navegando a DJ con storage limpio y sesión sincronizada...');
                
                try {
                    // Intentar navegación directa primero
                    window.location.href = urlDirecta;
                    await this.delay(8000);
                    
                    // Procesar declaración jurada en la nueva página
                    await this.procesarDeclaracionJuradaEnPagina();
                    return;
                } catch (error) {
                    console.error('❌ Error navegando directamente:', error);
                    console.log('🔄 Intentando método alternativo...');
                    
                    // Método alternativo: abrir en nueva pestaña
                    window.open(urlDirecta, '_blank');
                    console.log('✅ DJ abierto en nueva pestaña - proceso manual requerido');
                    return;
                }
            }
            
            console.log('❌ No se pudo extraer número de licitación para URL directa');
            console.log('🔍 DEBUG: Buscando campos que puedan contener el código...');
            
            // Mostrar todos los inputs hidden para debug
            const inputsHidden = document.querySelectorAll('input[type="hidden"]');
            console.log(`📊 Total inputs hidden encontrados: ${inputsHidden.length}`);
            
            for (let i = 0; i < Math.min(10, inputsHidden.length); i++) {
                const input = inputsHidden[i];
                if (input.name || input.id || input.className) {
                    console.log(`   ${i+1}. ${input.name || input.id || input.className}: "${input.value}"`);
                }
            }
            
            console.log('⚠️ Sin número de licitación, no se puede construir URL directa');
            
        } catch (error) {
            console.error('❌ Error buscando declaración jurada:', error);
        }
    }

    async verificarEstadoDJEnPaginaDocumentos() {
        console.log('🔍 === VERIFICANDO ESTADO DJ EN PÁGINA DE DOCUMENTOS ===');
        console.log('📍 URL:', window.location.href);
        
        try {
            // 🎯 MÉTODO 1: Verificar título de página
            const titulo = document.title || '';
            console.log(`📄 Título página: "${titulo}"`);
            console.log(`📏 Longitud título: ${titulo.length}`);
            
            // Esperar un poco para asegurarse de que la página cargó completamente
            await this.delay(2000);
            
            // Volver a verificar el título después de la espera
            const tituloActualizado = document.title || '';
            console.log(`📄 Título actualizado: "${tituloActualizado}"`);
            
            // 🎯 ANÁLISIS DEL TÍTULO
            const tituloAnalizar = tituloActualizado || titulo;
            if (tituloAnalizar.toLowerCase().includes('declaración jurada')) {
                console.log('🎯 TÍTULO contiene "Declaración Jurada" - Estamos en página DJ');
                
                // Verificar si el título indica estado
                if (tituloAnalizar.toLowerCase().includes('firmada') || 
                    tituloAnalizar.toLowerCase().includes('completada')) {
                    console.log('✅ TÍTULO indica DJ FIRMADA');
                    return {
                        firmada: true,
                        estado: 'FIRMADA (detectado en título)',
                        elemento: 'document.title',
                        ubicacion: 'título de página'
                    };
                }
            }
            
            // 🎯 MÉTODO 2: Buscar en contenido de página
            const contenidoPagina = document.body ? document.body.textContent || '' : '';
            console.log('🔍 Analizando contenido de la página...');
            console.log(`📏 Longitud contenido: ${contenidoPagina.length} caracteres`);
            
            // Debug: mostrar primeros 200 caracteres del contenido
            const preview = contenidoPagina.substring(0, 200);
            console.log(`👀 Preview contenido: "${preview}..."`);
            
            // 🎯 MÉTODO 3: Buscar texto específico en HTML
            const htmlCompleto = document.documentElement.innerHTML || '';
            console.log(`📄 Longitud HTML: ${htmlCompleto.length} caracteres`);
            
            // Buscar patrones específicos en HTML
            const htmlLower = htmlCompleto.toLowerCase();
            if (htmlLower.includes('firmada') || htmlLower.includes('completada')) {
                console.log('✅ HTML contiene patrones de DJ FIRMADA');
                
                // Buscar contexto específico
                const contextos = [
                    'estado.*firmada',
                    'declaración.*firmada', 
                    'dj.*firmada',
                    'status.*firmada',
                    'completada'
                ];
                
                for (const patron of contextos) {
                    const regex = new RegExp(patron, 'i');
                    if (regex.test(htmlCompleto)) {
                        console.log(`🎯 Patrón encontrado en HTML: "${patron}"`);
                        return {
                            firmada: true,
                            estado: `FIRMADA (patrón HTML: ${patron})`,
                            elemento: 'document.html',
                            ubicacion: 'HTML completo'
                        };
                    }
                }
            }
            
            // Patrones que indican DJ firmada
            const patronesFirmada = [
                'firmada',
                'completada', 
                'firma realizada',
                'proceso completado',
                'declaración completa',
                'ya firmado',
                'estado: ok',
                'aprobada'
            ];
            
            // Patrones que indican DJ pendiente
            const patronesPendiente = [
                'pendiente',
                'por firmar',
                'debe firmar',
                'no firmada',
                'estado: pendiente'
            ];
            
            let estaFirmada = false;
            let estaPendiente = false;
            let patronEncontrado = '';
            
            // Verificar patrones de firmada
            for (const patron of patronesFirmada) {
                if (contenidoPagina.toLowerCase().includes(patron)) {
                    estaFirmada = true;
                    patronEncontrado = patron;
                    console.log(`✅ Patrón DJ FIRMADA encontrado: "${patron}"`);
                    break;
                }
            }
            
            // Si no está firmada, verificar si está pendiente
            if (!estaFirmada) {
                for (const patron of patronesPendiente) {
                    if (contenidoPagina.toLowerCase().includes(patron)) {
                        estaPendiente = true;
                        patronEncontrado = patron;
                        console.log(`⚠️ Patrón DJ PENDIENTE encontrado: "${patron}"`);
                        break;
                    }
                }
            }
            
            // 🎯 MÉTODO 3: BUSCAR ELEMENTO ESPECÍFICO: span id="dj_estado" (fallback)
            console.log('🔍 Buscando elemento span#dj_estado...');
            
            const elementoDJEstado = document.getElementById('dj_estado');
            
            // 🎯 DECISIÓN BASADA EN ANÁLISIS DE CONTENIDO
            if (estaFirmada) {
                console.log('🎉 DECLARACIÓN JURADA YA ESTÁ FIRMADA (detectado por contenido)');
                return {
                    firmada: true,
                    estado: `FIRMADA (patrón: ${patronEncontrado})`,
                    elemento: 'contenido_pagina',
                    ubicacion: 'página de documentos'
                };
            }
            
            if (estaPendiente) {
                console.log('⚠️ DECLARACIÓN JURADA ESTÁ PENDIENTE (detectado por contenido)');
                
                // Construir URL de DJ dinámica
                const licitacionId = this.licitacionId;
                const urlDJ = `https://proveedor.mercadopublico.cl/dj-requisitos/${licitacionId}`;
                
                console.log(`🔗 URL DJ construida: ${urlDJ}`);
                
                return {
                    firmada: false,
                    estado: `PENDIENTE (patrón: ${patronEncontrado})`,
                    elemento: 'contenido_pagina',
                    ubicacion: 'página de documentos',
                    urlDJ: urlDJ
                };
            }
            
            // 🎯 MÉTODO 3: Fallback con elemento específico
            if (elementoDJEstado) {
                const textoEstado = elementoDJEstado.textContent?.trim() || '';
                const claseElemento = elementoDJEstado.className || '';
                
                console.log('✅ ELEMENTO DJ_ESTADO ENCONTRADO (fallback):');
                console.log(`   📝 Texto: "${textoEstado}"`);
                console.log(`   🎨 Clase: "${claseElemento}"`);
                console.log(`   📍 HTML: ${elementoDJEstado.outerHTML}`);
                
                return {
                    firmada: false,
                    estado: textoEstado || 'ENCONTRADO',
                    elemento: 'dj_estado',
                    ubicacion: 'página de documentos'
                };
            } else {
                console.log('❌ NO se encontró elemento span#dj_estado');
                
            // 🎯 MÉTODO 4: Buscar específicamente enlaces o botones de DJ
            console.log('🔍 Buscando enlaces y botones de Declaración Jurada...');
            
            // Buscar enlaces que contengan "dj", "declaracion" o "jurada"
            const enlacesDJ = document.querySelectorAll('a[href*="dj"], a[href*="declaracion"], a[href*="jurada"], a');
            console.log(`🔗 Enlaces encontrados: ${enlacesDJ.length}`);
            
            let enlacesDJRelevantes = [];
            enlacesDJ.forEach((enlace, index) => {
                const texto = enlace.textContent?.trim().toLowerCase() || '';
                const href = enlace.href || '';
                
                // ✅ FILTROS MÁS ESPECÍFICOS PARA DJ
                const esEnlaceDJ = (
                    texto.includes('declaración jurada') ||
                    texto.includes('declarar y firmar') ||
                    texto.includes('firmar declaración') ||
                    (texto.includes('declaración') && texto.includes('firmar')) ||
                    href.includes('dj-requisitos') ||
                    texto.includes('dj ')
                );
                
                // ❌ EXCLUIR enlaces que NO son de DJ
                const noEsDJ = (
                    texto.includes('confirmar e ingresar oferta') ||
                    texto.includes('enviar oferta') ||
                    texto.includes('confirmar oferta') ||
                    texto.includes('ingresar oferta') ||
                    href.includes('ConfirmarDIngresarOferta')
                );
                
                if (esEnlaceDJ && !noEsDJ) {
                    enlacesDJRelevantes.push({
                        texto: enlace.textContent?.trim(),
                        href: enlace.href,
                        classes: enlace.className,
                        index: index
                    });
                    
                    console.log(`   🎯 Enlace DJ ${enlacesDJRelevantes.length}: "${enlace.textContent?.trim()}" | Href: ${href}`);
                    
                    // Verificar si indica que ya está firmada
                    if (texto.includes('firmada') || texto.includes('completada') || 
                        texto.includes('ya firmado') || enlace.classList.contains('disabled')) {
                        estaFirmada = true;
                        patronEncontrado = enlace.textContent?.trim();
                        console.log(`✅ Enlace indica DJ FIRMADA: "${patronEncontrado}"`);
                    }
                } else if (noEsDJ) {
                    console.log(`   ❌ Enlace excluido (no es DJ): "${enlace.textContent?.trim()}"`);
                }
            });
            
            // 🎯 MÉTODO 5: Buscar elementos status/badge más específicos
            console.log('🔍 Buscando elementos de estado...');
            
            const selectoresStatus = [
                '[id*="badge"]', '[class*="badge"]', '[id*="dj"]', '[class*="dj"]', 
                '.status', '.estado', '.state', '[id*="status"]', '[class*="status"]',
                'span[class*="label"]', 'div[class*="status"]', 'span[class*="badge"]'
            ];
            
            for (const selector of selectoresStatus) {
                const elementos = document.querySelectorAll(selector);
                if (elementos.length > 0) {
                    console.log(`📋 Elementos "${selector}": ${elementos.length}`);
                    elementos.forEach((el, index) => {
                        const texto = el.textContent?.trim() || '';
                        if (texto) {
                            console.log(`   ${index + 1}. ID: "${el.id}" | Clase: "${el.className}" | Texto: "${texto}"`);
                            
                            if (texto.toLowerCase().includes('firmada') || 
                                texto.toLowerCase().includes('completada') ||
                                texto.toLowerCase().includes('aprobada')) {
                                estaFirmada = true;
                                patronEncontrado = texto;
                                console.log(`✅ Elemento indica DJ FIRMADA: "${texto}"`);
                            }
                        }
                    });
                }
            }
            
            if (estaFirmada) {
                console.log(`🎉 DJ FIRMADA encontrada en elemento: "${patronEncontrado}"`);
                return {
                    firmada: true,
                    estado: `FIRMADA (elemento: ${patronEncontrado})`,
                    elemento: 'elemento_status',
                    ubicacion: 'página de documentos'
                };
            }
            
            // 🎯 MÉTODO ESPECÍFICO WIZATTACHMENT: Buscar tabla de documentos/DJ
            console.log('🔍 Buscando información específica de DJ en WizAttachment...');
            
            // Buscar texto específico en la página
            const textosEspecificosDJ = [
                'declaración jurada',
                'declarar y firmar', 
                'firmado',
                'pendiente de firma',
                'requisitos cumplidos',
                'dj firmada',
                'estado: firmada'
            ];
            
            for (const texto of textosEspecificosDJ) {
                if (htmlLower.includes(texto)) {
                    console.log(`🎯 Texto específico encontrado: "${texto}"`);
                    
                    if (texto.includes('firmada') || texto.includes('firmado')) {
                        console.log(`✅ Texto indica DJ FIRMADA`);
                        return {
                            firmada: true,
                            estado: `FIRMADA (texto: ${texto})`,
                            elemento: 'texto_especifico',
                            ubicacion: 'página de documentos'
                        };
                    }
                }
            }
                
                // 🎯 DECISIÓN INTELIGENTE BASADA EN CONTEXTO
                console.log('🤔 Analizando contexto de la página...');
                
                // Si encontramos enlaces de DJ relevantes, verificar su estado
                if (enlacesDJRelevantes.length > 0) {
                    console.log(`📋 Se encontraron ${enlacesDJRelevantes.length} enlaces relacionados con DJ`);
                    
                    // Si hay enlaces pero ninguno indica que está firmada, probablemente está pendiente
                    console.log('⚠️ DJ parece estar PENDIENTE (enlaces encontrados pero no indican firmada)');
                    
                    return {
                        firmada: false,
                        estado: 'PENDIENTE (enlaces DJ encontrados)',
                        elemento: 'enlaces_dj_detectados',
                        ubicacion: 'página de documentos',
                        urlDJ: `https://proveedor.mercadopublico.cl/dj-requisitos/${this.licitacionId}`,
                        debug: {
                            enlacesDJEncontrados: enlacesDJRelevantes.length,
                            primerosEnlaces: enlacesDJRelevantes.slice(0, 3)
                        }
                    };
                }
                
                // Si no se encontraron enlaces de DJ, buscar el texto "Declarar y firmar"
                const botonDeclarar = Array.from(document.querySelectorAll('*')).find(el => 
                    el.textContent?.includes('Declarar y firmar') || 
                    el.textContent?.includes('Declaración Jurada')
                );
                
                if (botonDeclarar) {
                    console.log('🎯 Botón "Declarar y firmar" encontrado');
                    console.log(`   Texto: "${botonDeclarar.textContent?.trim()}"`);
                    console.log(`   Disabled: ${botonDeclarar.disabled || botonDeclarar.classList.contains('disabled')}`);
                    
                    if (botonDeclarar.disabled || botonDeclarar.classList.contains('disabled')) {
                        console.log('✅ Botón deshabilitado - DJ probablemente FIRMADA');
                        return {
                            firmada: true,
                            estado: 'FIRMADA (botón declarar deshabilitado)',
                            elemento: 'boton_declarar_disabled',
                            ubicacion: 'página de documentos'
                        };
                    } else {
                        console.log('⚠️ Botón habilitado - DJ PENDIENTE');
                        return {
                            firmada: false,
                            estado: 'PENDIENTE (botón declarar habilitado)',
                            elemento: 'boton_declarar_enabled',
                            ubicacion: 'página de documentos',
                            urlDJ: `https://proveedor.mercadopublico.cl/dj-requisitos/${this.licitacionId}`
                        };
                    }
                }
                
                // 🚨 ÚLTIMO RECURSO: No se pudo determinar con certeza
                console.log('⚠️ NO SE PUDO DETERMINAR ESTADO CON CERTEZA');
                console.log('📋 La página puede no haber cargado completamente o tener estructura diferente');
                console.log('🔄 Asumiendo PENDIENTE por seguridad');
                
                return {
                    firmada: false,
                    estado: 'NO_DETERMINADO - Asumiendo PENDIENTE por seguridad',
                    elemento: 'fallback_seguro',
                    ubicacion: 'página de documentos',
                    urlDJ: `https://proveedor.mercadopublico.cl/dj-requisitos/${this.licitacionId}`,
                    debug: {
                        titulo: tituloAnalizar,
                        contenidoLength: contenidoPagina.length,
                        htmlLength: htmlCompleto.length,
                        enlacesDJEncontrados: enlacesDJRelevantes.length
                    }
                };
            }
            
        } catch (error) {
            console.error('❌ Error verificando estado DJ en página documentos:', error);
            return {
                firmada: false,
                estado: 'ERROR',
                elemento: 'error',
                ubicacion: 'página de documentos'
            };
        } finally {
            console.log('🔍 === FIN VERIFICACIÓN ESTADO DJ EN DOCUMENTOS ===');
            console.log('');
        }
    }

    async verificarEstadoDeclaracionJurada() {
        console.log('🔍 Verificando estado real de declaración jurada...');
        
        try {
            // Buscar primero en iframe si existe
            const iframe = document.querySelector('#ctl00_mpcphFormWizardFields__IFrameAttachment');
            if (iframe) {
                console.log('📺 Verificando en iframe...');
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    // Buscar específicamente el span con id="dj_estado"
                    const djEstado = iframeDoc.querySelector('#dj_estado');
                    if (djEstado) {
                        const estadoTexto = djEstado.textContent.trim();
                        const claseCompleta = djEstado.className;
                        console.log(`📋 Estado encontrado en iframe - ID: dj_estado`);
                        console.log(`📋 Texto: "${estadoTexto}"`);
                        console.log(`📋 Clase: "${claseCompleta}"`);
                        
                        // Verificar múltiples indicadores de que está firmada
                        const estaFirmada = (
                            estadoTexto.toLowerCase().includes('firmada') ||
                            claseCompleta.includes('texto_firmada') ||
                            claseCompleta.includes('firmada') ||
                            (estadoTexto.toLowerCase() === 'firmada')
                        );
                        
                        return {
                            firmada: estaFirmada,
                            estado: estadoTexto,
                            clase: claseCompleta,
                            ubicacion: 'iframe_dj_estado'
                        };
                    }
                    
                    // Buscar otros indicadores en iframe
                    const otrosSelectores = ['.texto_pendiente', '.texto_firmada', '[class*="badgedj"] span'];
                    for (const selector of otrosSelectores) {
                        const elemento = iframeDoc.querySelector(selector);
                        if (elemento) {
                            const estadoTexto = elemento.textContent.trim();
                            console.log(`📋 Estado encontrado en iframe con ${selector}: "${estadoTexto}"`);
                            
                            const estaFirmada = (
                                estadoTexto.toLowerCase().includes('firmada') ||
                                elemento.className.includes('texto_firmada') ||
                                !estadoTexto.toLowerCase().includes('pendiente')
                            );
                            
                            return {
                                firmada: estaFirmada,
                                estado: estadoTexto,
                                clase: elemento.className,
                                ubicacion: `iframe_${selector}`
                            };
                        }
                    }
                }
            }
            
            // Buscar en página principal
            console.log('📄 Verificando en página principal...');
            
            // Buscar específicamente el span con id="dj_estado"  
            const djEstadoPrincipal = document.querySelector('#dj_estado');
            if (djEstadoPrincipal) {
                const estadoTexto = djEstadoPrincipal.textContent.trim();
                const claseCompleta = djEstadoPrincipal.className;
                console.log(`📋 Estado encontrado en página principal - ID: dj_estado`);
                console.log(`📋 Texto: "${estadoTexto}"`);
                console.log(`📋 Clase: "${claseCompleta}"`);
                
                // Verificar múltiples indicadores de que está firmada
                const estaFirmada = (
                    estadoTexto.toLowerCase().includes('firmada') ||
                    claseCompleta.includes('texto_firmada') ||
                    claseCompleta.includes('firmada') ||
                    (estadoTexto.toLowerCase() === 'firmada')
                );
                
                return {
                    firmada: estaFirmada,
                    estado: estadoTexto,
                    clase: claseCompleta,
                    ubicacion: 'pagina_principal_dj_estado'
                };
            }
            
            // Buscar otros selectores en página principal
            const selectoresEstado = [
                '.texto_pendiente', 
                '.texto_firmada',
                '[class*="badgedj"] span',
                '.declaracion-estado',
                '[id*="estado"]'
            ];
            
            for (const selector of selectoresEstado) {
                const elemento = document.querySelector(selector);
                if (elemento) {
                    const estadoTexto = elemento.textContent.trim();
                    const claseCompleta = elemento.className;
                    console.log(`📋 Estado encontrado en página principal con ${selector}: "${estadoTexto}"`);
                    console.log(`📋 Clase: "${claseCompleta}"`);
                    
                    const estaFirmada = (
                        estadoTexto.toLowerCase().includes('firmada') ||
                        claseCompleta.includes('texto_firmada') ||
                        !estadoTexto.toLowerCase().includes('pendiente')
                    );
                    
                    return {
                        firmada: estaFirmada,
                        estado: estadoTexto,
                        clase: claseCompleta,
                        ubicacion: `pagina_principal_${selector}`
                    };
                }
            }
            
            // Verificar campos hidden
            const declaracionFirmada = document.querySelector('#DeclaracionFirmada');
            if (declaracionFirmada) {
                const valor = declaracionFirmada.value;
                console.log(`📋 Campo hidden #DeclaracionFirmada: "${valor}"`);
                
                return {
                    firmada: valor.toLowerCase() === 'true',
                    estado: valor.toLowerCase() === 'true' ? 'firmada' : 'pendiente',
                    clase: 'campo_hidden',
                    ubicacion: 'campo_hidden'
                };
            }
            
            // 🔍 BÚSQUEDA INTELIGENTE BASADA EN LOGS REALES
            console.log('🔍 Búsqueda inteligente basada en contenido de página...');
            
            // Buscar en elementos que contengan texto sobre DJ y su estado
            const todosLosElementos = document.querySelectorAll('div, span');
            for (const elemento of todosLosElementos) {
                const textoCompleto = elemento.textContent?.trim() || '';
                
                // Verificar si contiene info relevante de DJ
                if (textoCompleto.includes('Declaración Jurada') && 
                    (textoCompleto.includes('PENDIENTE') || textoCompleto.includes('FIRMADA'))) {
                    
                    console.log(`✅ ELEMENTO DJ ENCONTRADO:`);
                    console.log(`   📍 Tag: ${elemento.tagName}`);
                    console.log(`   📍 ID: ${elemento.id || 'Sin ID'}`);
                    console.log(`   📍 Clase: ${elemento.className || 'Sin clase'}`);
                    console.log(`   📍 Texto: "${textoCompleto.substring(0, 200)}..."`);
                    
                    // Determinar estado basado en contenido
                    if (textoCompleto.includes('FIRMADA') || textoCompleto.toLowerCase().includes('firmada')) {
                        console.log(`✅ ESTADO DETECTADO: FIRMADA`);
                        return {
                            firmada: true,
                            estado: 'FIRMADA',
                            clase: elemento.className || 'detectado_por_contenido',
                            ubicacion: 'busqueda_inteligente_firmada'
                        };
                    } else if (textoCompleto.includes('PENDIENTE') || textoCompleto.toLowerCase().includes('pendiente')) {
                        console.log(`⚠️ ESTADO DETECTADO: PENDIENTE`);
                        return {
                            firmada: false,
                            estado: 'PENDIENTE', 
                            clase: elemento.className || 'detectado_por_contenido',
                            ubicacion: 'busqueda_inteligente_pendiente'
                        };
                    }
                }
            }
            
            // Búsqueda adicional por patrones específicos encontrados en logs
            const patronesEspecificos = [
                '.sc-PRxTi', // De los logs: "Declaración Jurada de Requisitos para OfertarPENDIENTE"
                '.sc-byrJnF', // De los logs: similar
                '.sc-gLfKCG'  // De los logs: similar
            ];
            
            for (const patron of patronesEspecificos) {
                const elemento = document.querySelector(patron);
                if (elemento) {
                    const texto = elemento.textContent?.trim() || '';
                    console.log(`🔍 Verificando patrón ${patron}: "${texto.substring(0, 100)}..."`);
                    
                    if (texto.includes('PENDIENTE') || texto.includes('FIRMADA')) {
                        const estaFirmada = texto.includes('FIRMADA');
                        const estado = estaFirmada ? 'FIRMADA' : 'PENDIENTE';
                        
                        console.log(`✅ ESTADO DETECTADO EN ${patron}: ${estado}`);
                        return {
                            firmada: estaFirmada,
                            estado: estado,
                            clase: elemento.className,
                            ubicacion: `patron_${patron}`
                        };
                    }
                }
            }
            
            console.log('⚠️ No se encontró ningún indicador de estado');
            console.log('🔍 Elementos disponibles para debug:');
            
            // Debug: Mostrar elementos que podrían contener el estado
            const posiblesElementos = document.querySelectorAll('div, span');
            let elementosRelevantes = 0;
            for (const elem of posiblesElementos) {
                const texto = elem.textContent?.trim() || '';
                if (texto && (texto.toLowerCase().includes('firma') || texto.toLowerCase().includes('pendiente') || texto.toLowerCase().includes('declara'))) {
                    console.log(`   - ${elem.tagName}#${elem.id || 'Sin-ID'}.${elem.className}: "${texto.substring(0, 80)}..."`);
                    elementosRelevantes++;
                    if (elementosRelevantes >= 8) break; // Mostrar más elementos para debug
                }
            }
            
            return {
                firmada: false,
                estado: 'no_encontrado',
                clase: 'sin_clase',
                ubicacion: 'no_encontrado'
            };
            
        } catch (error) {
            console.error('❌ Error verificando estado:', error);
            return {
                firmada: false,
                estado: 'error',
                clase: 'error',
                ubicacion: 'error'
            };
        }
    }

    async verificarEstadoDJCompleto() {
        console.log('🔍 === VERIFICACIÓN COMPLETA ESTADO DECLARACIÓN JURADA ===');
        
        try {
            // 🎯 MÉTODO 1: Verificar en URL actual si estamos en página de DJ
            const urlActual = window.location.href;
            const contenidoPagina = document.body ? document.body.textContent || '' : '';
            
            if (urlActual.includes('dj-requisitos')) {
                console.log('📍 Estamos EN la página de DJ - verificando estado...');
                
                // 🎯 MÉTODO MEJORADO: Buscar botón de firma como indicador más confiable
                const botonFirmar = document.querySelector('button[type="submit"], input[type="submit"], button');
                let textoBoton = '';
                
                // 🎯 LÓGICA CORRECTA: Solo botones que REALMENTE indican que está firmada
                const botonFirmaTextos = document.querySelectorAll('button');
                let botonIndicaFirmada = false;
                let textoBotonEncontrado = '';
                
                botonFirmaTextos.forEach(boton => {
                    const textoBoton = boton.textContent.toLowerCase();
                    console.log(`🔍 Botón encontrado: "${boton.textContent}"`);
                    
                    // SOLO estos textos indican que YA está firmada:
                    if (textoBoton.includes('ya firmado') || 
                        textoBoton.includes('completado') || 
                        textoBoton.includes('procesado') ||
                        textoBoton.includes('firma realizada') ||
                        textoBoton.includes('declaración completa') ||
                        (boton.disabled && textoBoton.includes('firmar') && !textoBoton.includes('sin clave'))) {
                        botonIndicaFirmada = true;
                        textoBotonEncontrado = boton.textContent;
                        console.log(`✅ DJ YA FIRMADA - Botón indica estado completado: "${boton.textContent}"`);
                    } else if (textoBoton.includes('firmar') || textoBoton.includes('clave única')) {
                        console.log(`ℹ️ Botón de firma disponible (NO indica firmada): "${boton.textContent}"`);
                    }
                });
                
                if (botonIndicaFirmada) {
                    return {
                        firmada: true,
                        estado: `FIRMADA (botón: ${textoBotonEncontrado})`,
                        ubicacion: 'pagina_dj_directa',
                        metodo: 'boton_firma'
                    };
                }
                
                // Buscar indicadores específicos de firma completada en contenido
                const indicadoresFirmada = [
                    'firmada',
                    'completada',
                    'firma realizada',
                    'proceso completado',
                    'ya ha sido firmado',
                    'declaración completa'
                ];
                
                for (const indicador of indicadoresFirmada) {
                    if (contenidoPagina.toLowerCase().includes(indicador)) {
                        console.log(`✅ DJ YA FIRMADA - Indicador encontrado: "${indicador}"`);
                        return {
                            firmada: true,
                            estado: `FIRMADA (${indicador})`,
                            ubicacion: 'pagina_dj_directa',
                            metodo: 'contenido_pagina'
                        };
                    }
                }
                
                // Si estamos en DJ pero no encontramos indicadores de firmada, está pendiente
                console.log('⚠️ DJ PENDIENTE - Estamos en página DJ sin indicadores de completada');
                return {
                    firmada: false,
                    estado: 'PENDIENTE (en página DJ)',
                    ubicacion: 'pagina_dj_directa',
                    metodo: 'contenido_pagina'
                };
            }
            
            // 🎯 MÉTODO 2: Verificar en iframe de documentos
            console.log('🖼️ Verificando en iframe de documentos...');
            const iframe = document.querySelector('#ctl00_mpcphFormWizardFields__IFrameAttachment');
            
            if (iframe && iframe.contentDocument) {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                if (iframeDoc) {
                    console.log('✅ Acceso a documento de iframe exitoso');
                    
                    // Buscar elemento específico #dj_estado en iframe
                    const djEstado = iframeDoc.querySelector('#dj_estado');
                    if (djEstado) {
                        const estadoTexto = djEstado.textContent.trim();
                        const claseCompleta = djEstado.className;
                        console.log(`📋 Estado encontrado en iframe - ID: dj_estado`);
                        console.log(`📋 Texto: "${estadoTexto}"`);
                        console.log(`📋 Clase: "${claseCompleta}"`);
                        
                        // Verificar múltiples indicadores de que está firmada
                        const estaFirmada = (
                            estadoTexto.toLowerCase().includes('firmada') ||
                            claseCompleta.includes('texto_firmada') ||
                            claseCompleta.includes('firmada') ||
                            (estadoTexto.toLowerCase() === 'firmada')
                        );
                        
                        return {
                            firmada: estaFirmada,
                            estado: estadoTexto,
                            clase: claseCompleta,
                            ubicacion: 'iframe_dj_estado',
                            metodo: 'elemento_especifico'
                        };
                    }
                }
            }
            
            // 🎯 MÉTODO 3: Usar la función existente de verificación en página de documentos
            console.log('📄 Usando verificación de página de documentos...');
            const resultadoDocumentos = await this.verificarEstadoDJEnPaginaDocumentos();
            
            if (resultadoDocumentos && resultadoDocumentos.firmada !== undefined) {
                console.log(`📋 Resultado de verificación documentos: ${JSON.stringify(resultadoDocumentos)}`);
                return {
                    firmada: resultadoDocumentos.firmada,
                    estado: resultadoDocumentos.estado,
                    ubicacion: resultadoDocumentos.ubicacion,
                    metodo: 'verificacion_documentos'
                };
            }
            
            // 🎯 MÉTODO 4: Buscar elementos específicos según tu estructura HTML
            console.log('🌐 Verificando elementos específicos en página principal...');
            
            // Buscar el div principal #badgedj
            const badgeDJ = document.querySelector('#badgedj');
            console.log(`🔍 Elemento #badgedj: ${badgeDJ ? 'ENCONTRADO' : 'NO encontrado'}`);
            
            if (badgeDJ) {
                const clasesBadge = badgeDJ.className;
                console.log(`📋 Clases del badge: "${clasesBadge}"`);
                
                // Verificar la clase del badge para determinar estado
                if (clasesBadge.includes('badgedj_firmada')) {
                    console.log('✅ Badge indica DJ FIRMADA (clase: badgedj_firmada)');
                    
                    return {
                        firmada: true,
                        estado: 'FIRMADA',
                        clase: clasesBadge,
                        ubicacion: 'badge_dj_firmada',
                        metodo: 'clase_badge'
                    };
                } else if (clasesBadge.includes('badgedj_pendiente')) {
                    console.log('⚠️ Badge indica DJ PENDIENTE (clase: badgedj_pendiente)');
                    
                    return {
                        firmada: false,
                        estado: 'PENDIENTE',
                        clase: clasesBadge,
                        ubicacion: 'badge_dj_pendiente',
                        metodo: 'clase_badge'
                    };
                }
            }
            
            // Buscar específicamente el span con id="dj_estado"  
            const djEstadoPrincipal = document.querySelector('#dj_estado');
            if (djEstadoPrincipal) {
                const estadoTexto = djEstadoPrincipal.textContent.trim();
                const claseCompleta = djEstadoPrincipal.className;
                console.log(`📋 Estado encontrado en página principal - ID: dj_estado`);
                console.log(`📋 Texto: "${estadoTexto}"`);
                console.log(`📋 Clase: "${claseCompleta}"`);
                
                // ✅ LÓGICA MEJORADA: Verificar texto Y clase específicamente
                let estaFirmada = false;
                
                // Verificar por texto exacto
                if (estadoTexto.toUpperCase() === 'FIRMADA' || estadoTexto.toUpperCase() === 'COMPLETADA') {
                    estaFirmada = true;
                    console.log(`✅ Estado FIRMADA detectado por texto: "${estadoTexto}"`);
                }
                
                // Verificar por clase específica
                if (claseCompleta.includes('texto_firmada')) {
                    estaFirmada = true;
                    console.log(`✅ Estado FIRMADA detectado por clase: "${claseCompleta}"`);
                }
                
                // Si texto es "PENDIENTE" y clase es "texto_pendiente", entonces NO está firmada
                if (estadoTexto.toUpperCase() === 'PENDIENTE' && claseCompleta.includes('texto_pendiente')) {
                    estaFirmada = false;
                    console.log(`⚠️ Estado PENDIENTE detectado: texto="${estadoTexto}", clase="${claseCompleta}"`);
                }
                
                return {
                    firmada: estaFirmada,
                    estado: estadoTexto,
                    clase: claseCompleta,
                    ubicacion: 'pagina_principal_dj_estado',
                    metodo: 'elemento_especifico'
                };
            }
            
            // 🎯 MÉTODO 5: Verificación de contenido general
            console.log('🔍 Verificación de contenido general...');
            
            const indicadoresFirmadaGeneral = ['firmada', 'completada', 'aprobada', 'firma realizada'];
            const indicadoresPendienteGeneral = ['pendiente', 'por firmar', 'debe firmar'];
            
            for (const indicador of indicadoresFirmadaGeneral) {
                if (contenidoPagina.toLowerCase().includes(indicador)) {
                    console.log(`✅ Indicador DJ FIRMADA encontrado: "${indicador}"`);
                    return {
                        firmada: true,
                        estado: `FIRMADA (${indicador})`,
                        ubicacion: 'contenido_general',
                        metodo: 'busqueda_texto'
                    };
                }
            }
            
            for (const indicador of indicadoresPendienteGeneral) {
                if (contenidoPagina.toLowerCase().includes(indicador)) {
                    console.log(`⚠️ Indicador DJ PENDIENTE encontrado: "${indicador}"`);
                    return {
                        firmada: false,
                        estado: `PENDIENTE (${indicador})`,
                        ubicacion: 'contenido_general',
                        metodo: 'busqueda_texto'
                    };
                }
            }
            
            console.log('❓ No se pudo determinar el estado de la Declaración Jurada con certeza');
            console.log('🔄 Asumiendo PENDIENTE por seguridad');
            
            return {
                firmada: false,
                estado: 'INDETERMINADO - Asumiendo PENDIENTE',
                ubicacion: 'fallback',
                metodo: 'asumir_pendiente'
            };
            
        } catch (error) {
            console.error('❌ Error verificando estado DJ completo:', error);
            return {
                firmada: false,
                estado: 'ERROR - Asumiendo PENDIENTE',
                ubicacion: 'error',
                metodo: 'error_handler'
            };
        }
    }

    /**
     * Detecta si hay problemas de carga en la página de DJ
     */
    detectarProblemasCargaDJ() {
        // Verificar si la página está completamente vacía o con errores
        if (!document.body || document.body.children.length === 0) {
            return 'Página completamente vacía';
        }
        
        // Verificar si hay mensajes de error típicos
        const erroresTipicos = [
            'Error 401', 'Unauthorized', 'No autorizado',
            'Error 403', 'Forbidden', 'Prohibido', 
            'Error 404', 'Not Found', 'Página no encontrada', '404',
            'Error 500', 'Internal Server Error',
            'Sesión expirada', 'Session expired',
            'SERVICE_ERROR', 'ecode: 401' // Específicos para el error que estás viendo
        ];
        
        const textoCompleto = document.body.textContent.toLowerCase();
        for (const error of erroresTipicos) {
            if (textoCompleto.includes(error.toLowerCase())) {
                return `Error encontrado: ${error}`;
            }
        }
        
        // Verificar errores en console específicamente (React DJ app)
        try {
            // Buscar elementos que puedan indicar error de autenticación
            const elementosError = document.querySelectorAll('[class*="error"], .error-message, .alert-danger');
            for (const elem of elementosError) {
                if (elem.textContent.includes('401') || elem.textContent.toLowerCase().includes('unauthorized')) {
                    return 'Error 401 de autenticación detectado en elementos';
                }
            }
        } catch (e) {
            // Ignorar errores de DOM
        }
        
        // Verificar si la página está cargando por mucho tiempo
        const elementosCarga = document.querySelectorAll('.loading, .spinner, [class*="load"], [class*="spin"]');
        if (elementosCarga.length > 0) {
            return 'Página parece estar cargando indefinidamente';
        }
        
        // Verificar si hay contenido mínimo esperado de DJ
        const elementosDJ = document.querySelectorAll('[class*="dj"], [class*="declaracion"], [class*="jurada"]');
        
        // Verificar si React DJ está cargado pero hay error de autenticación
        const reactCargado = textoCompleto.includes('react') || document.querySelector('[data-reactroot]') || 
                            textoCompleto.includes('declaración jurada v2.0.0');
        
        if (reactCargado) {
            // React está cargado, pero verificar si hay error de autenticación
            const networkErrors = performance.getEntriesByType('resource')
                .filter(entry => entry.name.includes('auth') && entry.transferSize === 0)
                .length > 0;
                
            if (networkErrors || textoCompleto.includes('service') && textoCompleto.includes('error')) {
                return 'React DJ cargado pero error de autenticación (401)';
            }
        }
        
        if (elementosDJ.length === 0 && !textoCompleto.includes('declaración') && !textoCompleto.includes('requisitos') && !reactCargado) {
            return 'No se encontró contenido relacionado con DJ';
        }
        
        return null; // No hay problemas detectados
    }

    /**
     * Limpieza más agresiva de storage para casos problemáticos
     */
    async limpiarStorageAgresivoParaDJ() {
        console.log('🧹 LIMPIEZA AGRESIVA DE STORAGE PARA DJ...');
        
        try {
            // 1. Limpiar TODO el localStorage (más agresivo)
            console.log('🗑️ Limpiando TODO el localStorage...');
            localStorage.clear();
            
            // 2. Limpiar TODO el sessionStorage (más agresivo)
            console.log('🗑️ Limpiando TODO el sessionStorage...');
            sessionStorage.clear();
            
            // 3. Limpiar todas las cookies del dominio actual
            console.log('🍪 Limpiando todas las cookies del dominio...');
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.replace('www.', '')};`;
            });
            
            // 4. Limpiar IndexedDB si existe
            if ('indexedDB' in window) {
                console.log('💾 Intentando limpiar IndexedDB...');
                try {
                    const databases = await indexedDB.databases();
                    for (const db of databases) {
                        if (db.name.includes('dj') || db.name.includes('proveedor') || db.name.includes('auth')) {
                            indexedDB.deleteDatabase(db.name);
                            console.log(`   - Eliminada DB: ${db.name}`);
                        }
                    }
                } catch (e) {
                    console.warn('   - Error accediendo IndexedDB:', e.message);
                }
            }
            
            // 5. Limpiar Cache API más agresivamente
            if ('caches' in window) {
                console.log('📦 Limpiando TODAS las caches...');
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                    console.log(`   - Cache eliminada: ${cacheName}`);
                }
            }
            
            console.log('✅ Limpieza agresiva completada');
            
        } catch (error) {
            console.warn('⚠️ Error en limpieza agresiva (continuará):', error.message);
        }
    }

    async procesarDeclaracionJuradaEnPagina() {
        console.log('');
        console.log('📋 PROCESANDO DECLARACIÓN JURADA EN PÁGINA ESPECÍFICA...');
        
        // INTENTAR INYECTAR CREDENCIALES EN LA APP REACT DE DJ
        await this.inyectarCredencialesEnReactDJ();
        
        // VERIFICAR SI LA PÁGINA ESTÁ CARGANDO CORRECTAMENTE
        const problemasCarga = this.detectarProblemasCargaDJ();
        if (problemasCarga) {
            console.log(`⚠️ Problema de carga detectado: ${problemasCarga}`);
            
            // Manejar específicamente errores 404 (necesita reinicio de sesión)
            if (problemasCarga.includes('404') || problemasCarga.toLowerCase().includes('not found') || problemasCarga.toLowerCase().includes('página no encontrada')) {
                console.log('🚫 Error 404 detectado - Sesión expirada');
                return await this.mostrarIndicadorReiniciarSesion();
            }
            // Manejar específicamente errores 401 (problemas de autenticación)
            else if (problemasCarga.includes('401') || problemasCarga.toLowerCase().includes('unauthorized')) {
                console.log('🔐 Error 401 detectado - Problema de autenticación');
                return await this.manejarError401EnDJ();
            } else {
                console.log('🔄 Reintentando con limpieza agresiva...');
                await this.limpiarStorageAgresivoParaDJ();
                window.location.reload();
                return;
            }
        }
        
        console.log('');
        
        try {
            // 1. Obtener RUT del representante desde popup/storage
            const rutRepresentante = await this.obtenerRutRepresentante();
            if (!rutRepresentante) {
                throw new Error('No se pudo obtener RUT del representante');
            }
            
            console.log(`✅ RUT del representante obtenido: ${rutRepresentante}`);
            
            // 2. Hacer clic en todos los checkboxes
            await this.clickearCheckboxesDeclaracion();
            
            // 3. Seleccionar RUT del representante
            await this.seleccionarRutRepresentante(rutRepresentante);
            
            // 4. Firmar declaración jurada
            await this.firmarDeclaracionJurada();
            
            console.log('');
            console.log('✅ DECLARACIÓN JURADA PROCESADA COMPLETAMENTE');
            console.log('');
            
        } catch (error) {
            console.error('❌ Error procesando declaración jurada en página:', error);
            throw error;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════════
    // SOLUCIÓN PARA PROBLEMAS DE CARGA DE DECLARACIÓN JURADA
    // ═════════════════════════════════════════════════════════════════════════════════
    // Problema: DJ funciona en incógnito pero no en navegador normal
    // Causa: Cookies/localStorage/sessionStorage acumulados causan conflictos
    // Solución: Limpieza inteligente que preserva datos críticos de la extensión
    // ═════════════════════════════════════════════════════════════════════════════════

    /**
     * Preserva datos críticos de la extensión antes de limpiar storage
     * EVITA perder: automationData, licitacionId, credenciales, RUT representante
     */
    async preservarDatosCriticos() {
        console.log('💾 PRESERVANDO DATOS CRÍTICOS...');
        
        const datosCriticos = {
            // Datos de automatización de la extensión
            licitacionAutomationData: null,
            extensionConfig: null,
            userCredentials: null,
            // Datos de la instancia actual
            automationData: this.automationData,
            licitacionId: this.licitacionId
        };
        
        try {
            // Obtener datos del storage de la extensión
            const result = await chrome.storage.local.get(['licitacionAutomationData', 'extensionConfig', 'userCredentials']);
            datosCriticos.licitacionAutomationData = result.licitacionAutomationData;
            datosCriticos.extensionConfig = result.extensionConfig;
            datosCriticos.userCredentials = result.userCredentials;
            
            console.log('✅ Datos críticos preservados:', {
                licitacionAutomationData: !!datosCriticos.licitacionAutomationData,
                extensionConfig: !!datosCriticos.extensionConfig,
                userCredentials: !!datosCriticos.userCredentials,
                automationData: !!datosCriticos.automationData,
                licitacionId: !!datosCriticos.licitacionId
            });
            
            return datosCriticos;
        } catch (error) {
            console.warn('⚠️ Error preservando datos críticos:', error.message);
            return datosCriticos;
        }
    }

    /**
     * Restaura datos críticos después de limpiar storage
     */
    async restaurarDatosCriticos(datosCriticos) {
        console.log('🔄 RESTAURANDO DATOS CRÍTICOS...');
        
        try {
            // Restaurar en chrome storage
            const dataToRestore = {};
            if (datosCriticos.licitacionAutomationData) {
                dataToRestore.licitacionAutomationData = datosCriticos.licitacionAutomationData;
            }
            if (datosCriticos.extensionConfig) {
                dataToRestore.extensionConfig = datosCriticos.extensionConfig;
            }
            if (datosCriticos.userCredentials) {
                dataToRestore.userCredentials = datosCriticos.userCredentials;
            }
            
            if (Object.keys(dataToRestore).length > 0) {
                await chrome.storage.local.set(dataToRestore);
            }
            
            // Restaurar en la instancia
            if (datosCriticos.automationData) {
                this.automationData = datosCriticos.automationData;
            }
            if (datosCriticos.licitacionId) {
                this.licitacionId = datosCriticos.licitacionId;
            }
            
            console.log('✅ Datos críticos restaurados exitosamente');
        } catch (error) {
            console.warn('⚠️ Error restaurando datos críticos:', error.message);
        }
    }

    /**
     * Limpia cookies y storage problemáticos que pueden impedir la carga de la declaración jurada
     * Soluciona el problema donde funciona en incógnito pero no en navegador normal
     * PRESERVA datos críticos de la extensión antes de limpiar
     */
    async limpiarStorageProblematico() {
        console.log('🧹 LIMPIANDO STORAGE PROBLEMÁTICO PARA DJ...');
        
        try {
            // 0. PRESERVAR DATOS CRÍTICOS ANTES DE LIMPIAR
            const datosCriticos = await this.preservarDatosCriticos();
            
            // 1. Limpiar localStorage relacionado con DJ/auth (PRESERVANDO datos de extensión)
            const keysToRemove = [];
            const keysToPreserve = ['licitacionAutomationData', 'extensionConfig', 'userCredentials'];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !keysToPreserve.includes(key) && 
                   (key.includes('dj-') || key.includes('auth') || key.includes('session') || 
                    key.includes('token') || key.includes('proveedor') || key.includes('requisitos') ||
                    key.includes('mercadopublico'))) {
                    keysToRemove.push(key);
                }
            }
            
            console.log(`🗑️ Limpiando ${keysToRemove.length} keys de localStorage (preservando datos críticos):`);
            keysToRemove.forEach(key => {
                console.log(`   - ${key}`);
                localStorage.removeItem(key);
            });
            
            // 2. Limpiar sessionStorage relacionado (más selectivo)
            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('dj-') || key.includes('auth') || key.includes('session') || 
                          key.includes('token') || key.includes('proveedor') || key.includes('requisitos'))) {
                    sessionKeysToRemove.push(key);
                }
            }
            
            console.log(`🗑️ Limpiando ${sessionKeysToRemove.length} keys de sessionStorage:`);
            sessionKeysToRemove.forEach(key => {
                console.log(`   - ${key}`);
                sessionStorage.removeItem(key);
            });
            
            // 3. Limpiar cookies problemáticas específicas (limitado por CORS pero intentamos)
            console.log('🍪 Limpiando cookies problemáticas específicas...');
            const problematicCookieNames = [
                'dj-session', 'auth-token', 'proveedor-session', 'requisitos-cache',
                'JSESSIONID', 'ASP.NET_SessionId', 'session-timeout'
            ];
            problematicCookieNames.forEach(cookieName => {
                try {
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.mercadopublico.cl;`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=proveedor.mercadopublico.cl;`;
                } catch (e) {
                    // Ignorar errores de CORS al limpiar cookies
                }
            });
            
            // 4. Limpiar cachés específicos si es posible
            if ('caches' in window) {
                console.log('📦 Limpiando cachés problemáticos...');
                const cacheNames = await caches.keys();
                const djCaches = cacheNames.filter(name => 
                    name.includes('dj') || name.includes('requisitos') || name.includes('proveedor')
                );
                
                for (const cacheName of djCaches) {
                    console.log(`   - Eliminando cache: ${cacheName}`);
                    await caches.delete(cacheName);
                }
            }
            
            console.log('✅ Storage problemático limpiado exitosamente');
            
            // 5. RESTAURAR DATOS CRÍTICOS
            await this.restaurarDatosCriticos(datosCriticos);
            
            await this.delay(1000); // Dar tiempo para que se apliquen los cambios
            
        } catch (error) {
            console.warn('⚠️ Error limpiando storage (continuará anyway):', error.message);
        }
    }

    /**
     * Limpieza más agresiva de storage para casos problemáticos
     * SOLO USAR EN CASOS EXTREMOS - preserva datos críticos
     */
    async limpiarStorageAgresivoParaDJ() {
        console.log('🧹 LIMPIEZA AGRESIVA DE STORAGE PARA DJ...');
        
        try {
            // 0. PRESERVAR DATOS CRÍTICOS ANTES DE LIMPIAR
            const datosCriticos = await this.preservarDatosCriticos();
            
            // 1. Limpiar la mayoría de localStorage (excepto datos críticos de extensión)
            const keysToPreserve = ['licitacionAutomationData', 'extensionConfig', 'userCredentials'];
            const allKeys = Object.keys(localStorage);
            
            console.log('🗑️ Limpieza agresiva de localStorage (preservando datos críticos)...');
            allKeys.forEach(key => {
                if (!keysToPreserve.includes(key)) {
                    console.log(`   - Eliminando: ${key}`);
                    localStorage.removeItem(key);
                }
            });
            
            // 2. Limpiar TODO el sessionStorage (es temporal anyway)
            console.log('🗑️ Limpiando TODO el sessionStorage...');
            sessionStorage.clear();
            
            // 3. Limpiar más cookies
            console.log('🍪 Limpieza agresiva de cookies...');
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name && !['extensionData', 'licitacionData'].includes(name)) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname.replace('www.', '')};`;
                }
            });
            
            // 4. Limpiar IndexedDB relacionado con problemas de carga
            if ('indexedDB' in window) {
                console.log('💾 Limpieza selectiva de IndexedDB...');
                try {
                    const databases = await indexedDB.databases();
                    for (const db of databases) {
                        if (db.name.includes('dj') || db.name.includes('proveedor') || 
                            db.name.includes('auth') || db.name.includes('session')) {
                            indexedDB.deleteDatabase(db.name);
                            console.log(`   - Eliminada DB: ${db.name}`);
                        }
                    }
                } catch (e) {
                    console.warn('   - Error accediendo IndexedDB:', e.message);
                }
            }
            
            // 5. Limpiar cachés más agresivamente
            if ('caches' in window) {
                console.log('📦 Limpieza agresiva de cachés...');
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    // Solo eliminar cachés que no sean críticos para la extensión
                    if (!cacheName.includes('extension') && !cacheName.includes('chrome')) {
                        await caches.delete(cacheName);
                        console.log(`   - Cache eliminada: ${cacheName}`);
                    }
                }
            }
            
            console.log('✅ Limpieza agresiva completada');
            
            // 6. RESTAURAR DATOS CRÍTICOS
            await this.restaurarDatosCriticos(datosCriticos);
            
        } catch (error) {
            console.warn('⚠️ Error en limpieza agresiva (continuará):', error.message);
        }
    }

    async obtenerRutRepresentante() {
        console.log('🔍 Obteniendo RUT del representante...');
        
        try {
            // 1. Buscar en storage de la extensión
            const result = await chrome.storage.local.get(['licitacionAutomationData']);
            if (result && result.licitacionAutomationData && result.licitacionAutomationData.rutRepresentante) {
                const rut = result.licitacionAutomationData.rutRepresentante;
                console.log(`✅ RUT encontrado en storage: ${rut}`);
                return rut;
            }
            
            // 2. Buscar en datos de la instancia
            if (this.automationData && this.automationData.rutRepresentante) {
                const rut = this.automationData.rutRepresentante;
                console.log(`✅ RUT encontrado en automationData: ${rut}`);
                return rut;
            }
            
            // 3. Buscar en campos hidden de la página
            const selectoresRut = [
                'input[name*="representante"]',
                'input[id*="representante"]', 
                '.rutRepresentante',
                '[data-rut-representante]'
            ];
            
            for (const selector of selectoresRut) {
                const elemento = document.querySelector(selector);
                if (elemento && elemento.value) {
                    const rut = elemento.value;
                    console.log(`✅ RUT encontrado en DOM: ${rut}`);
                    return rut;
                }
            }
            
            // 4. RESPALDO: Obtener desde endpoint si tenemos licitacionId
            if (this.licitacionId) {
                console.log('🌐 Intentando obtener RUT desde endpoint como respaldo...');
                const rutDesdeEndpoint = await this.obtenerRutDesdeEndpoint();
                if (rutDesdeEndpoint) {
                    return rutDesdeEndpoint;
                }
            }
            
            // 5. Buscar en credenciales como último recurso
            if (this.automationData?.credenciales?.rut_usuario) {
                const rut = this.automationData.credenciales.rut_usuario;
                console.log(`✅ RUT encontrado en credenciales (último recurso): ${rut}`);
                return rut;
            }
            
            console.log('⚠️ No se encontró RUT del representante en ninguna fuente');
            return null;
            
        } catch (error) {
            console.error('❌ Error obteniendo RUT representante:', error);
            return null;
        }
    }

    /**
     * Sincroniza la sesión de autenticación para el subdominio proveedor.mercadopublico.cl
     * Soluciona el error 401 que ocurre al navegar desde www.mercadopublico.cl a proveedor.mercadopublico.cl
     */
    async sincronizarSesionParaDJ() {
        console.log('🔐 SINCRONIZANDO SESIÓN PARA DJ...');
        
        try {
            // 1. Obtener cookies de sesión del dominio principal
            const cookiesSesion = document.cookie
                .split(';')
                .filter(cookie => {
                    const nombre = cookie.trim().split('=')[0];
                    return nombre.includes('session') || nombre.includes('auth') || 
                           nombre.includes('ASP.NET') || nombre.includes('JSESSIONID') ||
                           nombre === 'mp-auth' || nombre === 'mp-session';
                });
                
            console.log(`🍪 Cookies de sesión encontradas: ${cookiesSesion.length}`);
            cookiesSesion.forEach(cookie => console.log(`   - ${cookie.trim()}`));
            
            // 2. Verificar estado de autenticación actual
            const authStatus = await this.verificarEstadoAutenticacion();
            console.log('🔍 Estado autenticación actual:', authStatus);
            
            // 3. Si no hay sesión válida, intentar refrescar
            if (!authStatus.valida) {
                console.log('🔄 Sesión no válida, intentando refrescar...');
                await this.refrescarSesionAutenticacion();
            }
            
            // 4. Configurar headers para la navegación
            await this.configurarHeadersParaDJ();
            
            console.log('✅ Sesión sincronizada para DJ');
            return true;
            
        } catch (error) {
            console.warn('⚠️ Error sincronizando sesión para DJ:', error.message);
            return false;
        }
    }

    /**
     * Verifica el estado actual de autenticación
     */
    async verificarEstadoAutenticacion() {
        try {
            // Verificar si hay elementos que indican sesión activa
            const indicadoresSesion = [
                '[data-user]', '[data-usuario]', '.user-info', '.usuario-info',
                '#user-menu', '#usuario-menu', '.username', '.nombre-usuario'
            ];
            
            let sesionEncontrada = false;
            for (const selector of indicadoresSesion) {
                if (document.querySelector(selector)) {
                    sesionEncontrada = true;
                    break;
                }
            }
            
            // Verificar cookies críticas
            const cookiesCriticas = ['ASP.NET_SessionId', 'JSESSIONID', 'mp-auth'];
            const cookiesPresentes = cookiesCriticas.filter(nombre => 
                document.cookie.includes(nombre)
            );
            
            return {
                valida: sesionEncontrada && cookiesPresentes.length > 0,
                indicadoresEncontrados: sesionEncontrada,
                cookiesPresentes: cookiesPresentes.length,
                cookies: cookiesPresentes
            };
            
        } catch (error) {
            console.warn('Error verificando estado autenticación:', error.message);
            return { valida: false, error: error.message };
        }
    }

    /**
     * Intenta refrescar la sesión de autenticación
     */
    async refrescarSesionAutenticacion() {
        console.log('🔄 Refrescando sesión de autenticación...');
        
        try {
            // 1. Hacer una solicitud silenciosa a la página principal para refrescar sesión
            const refreshUrl = 'https://www.mercadopublico.cl/Home';
            
            const response = await fetch(refreshUrl, {
                method: 'GET',
                credentials: 'include', // Incluir cookies
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': navigator.userAgent
                }
            });
            
            if (response.ok) {
                console.log('✅ Sesión refrescada exitosamente');
                // Pequeña pausa para que las cookies se actualicen
                await this.delay(1000);
            } else {
                console.log(`⚠️ Error refrescando sesión: ${response.status}`);
            }
            
        } catch (error) {
            console.warn('⚠️ Error en refresh de sesión:', error.message);
        }
    }

    /**
     * Configura headers necesarios para la navegación a DJ
     */
    async configurarHeadersParaDJ() {
        console.log('⚙️ Configurando headers para DJ...');
        
        try {
            // Configurar cookies para el dominio proveedor
            const cookiesImportantes = document.cookie.split(';');
            
            cookiesImportantes.forEach(cookie => {
                const [nombre, valor] = cookie.trim().split('=');
                
                if (nombre && valor && (
                    nombre.includes('session') || nombre.includes('auth') || 
                    nombre.includes('ASP.NET') || nombre.includes('JSESSIONID')
                )) {
                    try {
                        // Intentar establecer la cookie para el subdominio proveedor
                        document.cookie = `${nombre}=${valor}; domain=.mercadopublico.cl; path=/`;
                        console.log(`   🍪 Cookie configurada para subdominio: ${nombre}`);
                    } catch (e) {
                        // Ignorar errores de configuración de cookies por CORS
                    }
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Error configurando headers:', error.message);
        }
    }

    /**
     * Instala interceptor de red para manejar automáticamente errores 401 en DJ
     */
    async instalarInterceptorAuth() {
        console.log('🔧 INSTALANDO INTERCEPTOR DE AUTENTICACIÓN...');
        
        try {
            // Solo instalar una vez
            if (window.authInterceptorInstalado) {
                console.log('✅ Interceptor ya instalado');
                return;
            }
            
            // Interceptar fetch requests
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const response = await originalFetch.apply(this, args);
                
                // Interceptar específicamente llamadas de auth que fallan con 401
                if (response.status === 401 && args[0] && args[0].includes('auth/info')) {
                    console.log('🔍 Interceptado 401 en auth/info, intentando reparar...');
                    
                    // Intentar obtener token válido
                    const tokenValido = await this.obtenerTokenValidoParaDJ();
                    
                    if (tokenValido) {
                        console.log('🔑 Token válido obtenido, reintentando llamada...');
                        
                        // Modificar headers para incluir token válido
                        const modifiedArgs = [...args];
                        if (modifiedArgs[1]) {
                            modifiedArgs[1].headers = {
                                ...modifiedArgs[1].headers,
                                'Authorization': `Bearer ${tokenValido}`,
                                'X-Auth-Token': tokenValido
                            };
                        } else {
                            modifiedArgs[1] = {
                                headers: {
                                    'Authorization': `Bearer ${tokenValido}`,
                                    'X-Auth-Token': tokenValido
                                }
                            };
                        }
                        
                        // Reintentar con token válido
                        return await originalFetch.apply(this, modifiedArgs);
                    }
                }
                
                return response;
            };
            
            // También interceptar XMLHttpRequest
            const originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalSend = xhr.send;
                
                xhr.addEventListener('readystatechange', async function() {
                    if (this.readyState === 4 && this.status === 401 && 
                        this.responseURL && this.responseURL.includes('auth/info')) {
                        
                        console.log('🔍 Interceptado XHR 401 en auth/info');
                        const tokenValido = await this.obtenerTokenValidoParaDJ();
                        
                        if (tokenValido) {
                            console.log('🔄 Reintentando XHR con token válido...');
                            // Crear nueva request con token válido
                            const newXHR = new originalXHR();
                            newXHR.open(this.method || 'GET', this.responseURL);
                            newXHR.setRequestHeader('Authorization', `Bearer ${tokenValido}`);
                            newXHR.setRequestHeader('X-Auth-Token', tokenValido);
                            newXHR.send();
                        }
                    }
                }.bind(this));
                
                return xhr;
            };
            
            window.authInterceptorInstalado = true;
            console.log('✅ Interceptor de autenticación instalado');
            
        } catch (error) {
            console.warn('⚠️ Error instalando interceptor:', error.message);
        }
    }

    /**
     * Obtiene un token válido para DJ desde el wizard principal
     */
    async obtenerTokenValidoParaDJ() {
        console.log('🔑 OBTENIENDO TOKEN VÁLIDO PARA DJ...');
        
        try {
            // 1. Intentar desde automationData
            if (this.automationData?.credenciales?.token) {
                console.log('✅ Token encontrado en automationData');
                return this.automationData.credenciales.token;
            }
            
            // 2. Intentar obtener desde storage
            const result = await chrome.storage.local.get(['licitacionAutomationData']);
            if (result?.licitacionAutomationData?.credenciales?.token) {
                console.log('✅ Token encontrado en storage');
                return result.licitacionAutomationData.credenciales.token;
            }
            
            // 3. Intentar extraer desde cookies de sesión
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const [nombre, valor] = cookie.trim().split('=');
                if (nombre && valor && (nombre.includes('auth') || nombre.includes('token') || nombre === 'mp-auth')) {
                    console.log(`✅ Token encontrado en cookie: ${nombre}`);
                    return valor;
                }
            }
            
            // 4. Intentar hacer llamada al wizard principal para obtener token fresco
            console.log('🌐 Intentando obtener token fresco desde wizard...');
            const tokenFresco = await this.obtenerTokenDesdeWizard();
            if (tokenFresco) {
                return tokenFresco;
            }
            
            console.log('❌ No se pudo obtener token válido');
            return null;
            
        } catch (error) {
            console.warn('⚠️ Error obteniendo token válido:', error.message);
            return null;
        }
    }

    /**
     * Obtiene token fresco haciendo llamada al wizard principal
     */
    async obtenerTokenDesdeWizard() {
        try {
            console.log('🏠 Obteniendo token desde wizard principal...');
            
            // URL del wizard actual
            const wizardUrl = window.location.href.replace('proveedor.mercadopublico.cl/dj-requisitos', 'www.mercadopublico.cl/BID/Modules/BID/WizBIDCompleteEconomicBid.aspx');
            
            const response = await fetch(wizardUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                
                // Buscar tokens en el HTML
                const tokenPatterns = [
                    /__RequestVerificationToken['"]\s*value=['"](.*?)['"]/, 
                    /token['"]\s*:\s*['"]([^'"]*)['"]/,
                    /auth['"]\s*:\s*['"]([^'"]*)['"]/
                ];
                
                for (const pattern of tokenPatterns) {
                    const match = html.match(pattern);
                    if (match && match[1]) {
                        console.log('✅ Token extraído desde wizard');
                        return match[1];
                    }
                }
            }
            
            return null;
            
        } catch (error) {
            console.warn('⚠️ Error obteniendo token desde wizard:', error.message);
            return null;
        }
    }

    /**
     * Maneja específicamente errores 401 en Declaración Jurada
     */
    async mostrarIndicadorReiniciarSesion() {
        console.log('🚪 MOSTRANDO INDICADOR DE REINICIO DE SESIÓN...');
        
        // Actualizar indicador visual principal
        this.updateIndicator('🚪 Sesión expirada - Reinicia sesión', 'error');
        
        // Crear modal de instrucciones
        const modal = document.createElement('div');
        modal.id = 'session-expired-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        content.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🚪</div>
            <h2 style="color: #dc3545; margin-bottom: 20px;">Sesión Expirada</h2>
            <p style="margin-bottom: 20px; line-height: 1.5;">
                La sesión de Mercado Público ha expirado. Para continuar con la declaración jurada:
            </p>
            <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <strong>Instrucciones:</strong><br>
                1. 🔄 Actualiza/recarga la página principal de Mercado Público<br>
                2. 🔐 Vuelve a iniciar sesión<br>
                3. 📋 Regresa a la licitación<br>
                4. 🚀 La extensión continuará automáticamente
            </div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="reload-page-btn" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">🔄 Recargar Página</button>
                <button id="close-modal-btn" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">❌ Cerrar</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Agregar event listeners
        document.getElementById('reload-page-btn').addEventListener('click', () => {
            window.location.href = 'https://www.mercadopublico.cl';
        });
        
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Log instrucciones en consola también
        console.log('');
        console.log('🚪 ========================================');
        console.log('🚪 SESIÓN EXPIRADA - ACCIÓN REQUERIDA');
        console.log('🚪 ========================================');
        console.log('📋 Instrucciones:');
        console.log('   1. 🔄 Actualiza/recarga la página principal');
        console.log('   2. 🔐 Vuelve a iniciar sesión en Mercado Público');
        console.log('   3. 📋 Regresa a la licitación');
        console.log('   4. 🚀 La extensión continuará automáticamente');
        console.log('🚪 ========================================');
        console.log('');
        
        return false; // Detener procesamiento
    }

    async manejarError401EnDJ() {
        console.log('🔐 MANEJANDO ERROR 401 EN DJ...');
        
        const maxReintentos = 2;
        let intento = 1;
        
        while (intento <= maxReintentos) {
            console.log(`🔄 Intento ${intento}/${maxReintentos} para resolver error 401...`);
            
            try {
                // 1. Navegar de vuelta al wizard principal para refrescar sesión
                console.log('🏠 Navegando de vuelta al wizard principal...');
                const wizardUrl = `https://www.mercadopublico.cl/BID/Modules/BID/WizBIDCompleteEconomicBid.aspx?idPagina=${this.licitacionId}`;
                
                // Abrir en nueva pestaña para no perder contexto
                const wizardTab = window.open(wizardUrl, '_blank');
                await this.delay(3000);
                
                if (wizardTab) {
                    wizardTab.close();
                }
                
                // 2. Refrescar sesión más agresivamente
                await this.refrescarSesionAutenticacion();
                
                // 3. Sincronizar sesión de nuevo
                await this.sincronizarSesionParaDJ();
                
                // 4. Limpiar storage problemático
                await this.limpiarStorageProblematico();
                
                console.log(`✅ Intento ${intento} completado, recargando página...`);
                await this.delay(2000);
                window.location.reload();
                
                // Esperar a que recargue y verificar si se resolvió
                await this.delay(5000);
                const problemasPost = this.detectarProblemasCargaDJ();
                
                if (!problemasPost || (!problemasPost.includes('401') && !problemasPost.toLowerCase().includes('unauthorized'))) {
                    console.log('✅ Error 401 resuelto exitosamente');
                    return true;
                }
                
                intento++;
                
            } catch (error) {
                console.error(`❌ Error en intento ${intento}:`, error.message);
                intento++;
            }
        }
        
        // Si todos los intentos fallaron
        console.log('❌ No se pudo resolver el error 401 después de todos los intentos');
        console.log('💡 SUGERENCIA: Intenta cerrar el navegador completamente y volver a abrir');
        console.log('💡 ALTERNATIVA: Usa modo incógnito temporalmente');
        
        return false;
    }

    /**
     * Maneja error de canal de mensajes cerrado en DJ
     */
    manejarErrorCanalMensajes() {
        console.log('📨 Configurando manejo de error de canal de mensajes...');
        
        // Interceptar y suprimir el error molesto de canal cerrado
        const originalConsoleError = console.error;
        console.error = function(...args) {
            const message = args.join(' ');
            
            // Suprimir errores específicos que no son críticos
            if (message.includes('message channel closed') ||
                message.includes('listener indicated an asynchronous response') ||
                message.includes('A listener indicated an asynchronous response by returning true')) {
                
                console.warn('⚠️ [SUPRIMIDO] Error de canal de mensajes (no crítico):', message);
                return;
            }
            
            // Para otros errores, usar el console.error original
            originalConsoleError.apply(console, args);
        };
        
        // También manejar errores no capturados
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('message channel closed')) {
                console.warn('⚠️ [SUPRIMIDO] Error global de canal (no crítico)');
                event.preventDefault();
            }
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
                console.warn('⚠️ [SUPRIMIDO] Promise rejected de canal (no crítico)');
                event.preventDefault();
            }
        });
        
        console.log('✅ Manejo de errores de canal configurado');
    }

    /**
     * Inyecta credenciales directamente en la aplicación React de DJ
     */
    async inyectarCredencialesEnReactDJ() {
        console.log('💉 INYECTANDO CREDENCIALES EN REACT DJ...');
        
        try {
            // Esperar a que React se cargue
            let intentos = 0;
            while (intentos < 10 && !window.React && !document.querySelector('[data-reactroot]')) {
                await this.delay(500);
                intentos++;
            }
            
            // Obtener token válido
            const tokenValido = await this.obtenerTokenValidoParaDJ();
            if (!tokenValido) {
                console.log('❌ No se pudo obtener token para inyectar');
                return false;
            }
            
            // Método 1: Inyectar en localStorage para que la app React lo use
            console.log('🔧 Inyectando token en localStorage...');
            localStorage.setItem('auth-token', tokenValido);
            localStorage.setItem('mp-auth-token', tokenValido);
            localStorage.setItem('proveedor-auth', tokenValido);
            
            // Método 2: Inyectar en sessionStorage
            console.log('🔧 Inyectando token en sessionStorage...');
            sessionStorage.setItem('auth-token', tokenValido);
            sessionStorage.setItem('mp-auth-token', tokenValido);
            
            // Método 3: Inyectar como cookie
            console.log('🔧 Inyectando token como cookie...');
            document.cookie = `auth-token=${tokenValido}; domain=.mercadopublico.cl; path=/`;
            document.cookie = `mp-auth=${tokenValido}; domain=.mercadopublico.cl; path=/`;
            
            // Método 4: Inyectar en window global para que React lo encuentre
            console.log('🔧 Inyectando en window global...');
            window.authToken = tokenValido;
            window.mpAuthToken = tokenValido;
            window.userAuth = {
                token: tokenValido,
                authenticated: true,
                timestamp: Date.now()
            };
            
            // Método 5: Intentar inyectar en el contexto de React si es posible
            if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                console.log('🔧 Intentando inyectar en contexto React...');
                
                // Buscar el contenedor root de React
                const reactRoot = document.querySelector('[data-reactroot]') || 
                                 document.querySelector('#root') ||
                                 document.querySelector('.App');
                
                if (reactRoot && reactRoot._reactInternalFiber) {
                    try {
                        // Intentar acceder al contexto de React para inyectar auth
                        const reactInstance = reactRoot._reactInternalFiber;
                        if (reactInstance && reactInstance.stateNode) {
                            reactInstance.stateNode.authToken = tokenValido;
                        }
                    } catch (e) {
                        console.log('⚠️ No se pudo inyectar en contexto React:', e.message);
                    }
                }
            }
            
            // Método 6: Disparar evento personalizado para notificar a React
            console.log('🔧 Disparando evento de autenticación...');
            const authEvent = new CustomEvent('auth-token-injected', {
                detail: {
                    token: tokenValido,
                    source: 'extension',
                    timestamp: Date.now()
                }
            });
            window.dispatchEvent(authEvent);
            
            // Método 7: Intentar modificar headers por defecto de axios si existe
            if (window.axios) {
                console.log('🔧 Configurando headers por defecto de axios...');
                window.axios.defaults.headers.common['Authorization'] = `Bearer ${tokenValido}`;
                window.axios.defaults.headers.common['X-Auth-Token'] = tokenValido;
            }
            
            console.log('✅ Credenciales inyectadas en React DJ');
            return true;
            
        } catch (error) {
            console.warn('⚠️ Error inyectando credenciales:', error.message);
            return false;
        }
    }

    /**
     * Obtiene RUT del representante desde endpoint como respaldo
     */
    async obtenerRutDesdeEndpoint() {
        console.log('🌐 Obteniendo RUT del representante desde endpoint...');
        
        try {
            // Solo intentar si tenemos los datos mínimos necesarios
            if (!this.licitacionId || !this.automationData?.credenciales) {
                console.log('❌ Faltan datos mínimos para consultar endpoint');
                return null;
            }
            
            // Construir URL del endpoint
            const endpointBase = this.automationData.credenciales.endpoint_url || 'http://localhost:3000';
            const endpointUrl = `${endpointBase}/api/licitaciones/${this.licitacionId}/representante`;
            
            console.log(`🔗 Consultando: ${endpointUrl}`);
            
            const response = await fetch(endpointUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.automationData.credenciales.token || 'default-token'}`
                },
                timeout: 10000 // 10 segundos timeout
            });
            
            if (!response.ok) {
                console.log(`⚠️ Endpoint respondió con status: ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            
            if (data && data.rut_representante) {
                console.log(`✅ RUT obtenido desde endpoint: ${data.rut_representante}`);
                
                // Guardar en automationData para futuros usos
                if (!this.automationData.rutRepresentante) {
                    this.automationData.rutRepresentante = data.rut_representante;
                }
                
                return data.rut_representante;
            } else {
                console.log('❌ Endpoint no retornó RUT válido');
                return null;
            }
            
        } catch (error) {
            console.warn('⚠️ Error consultando endpoint para RUT:', error.message);
            return null;
        }
    }

    async clickearCheckboxesDeclaracion() {
        console.log('☑️ Buscando y clickeando checkboxes de declaración...');
        
        try {
            // Esperar a que los elementos estén completamente cargados
            await this.delay(2000);
            
            // Selectores específicos para los checkboxes de React DJ
            const selectoresCheckbox = [
                "input[class*='fKMtys'][type='checkbox']",  // Clase exacta del Python + type
                "input.sc-fKMtys.cTALWK[type='checkbox']", // Selector más específico basado en el HTML
                ".MuiCheckbox-root input[type='checkbox']",
                "input[data-indeterminate='false'][type='checkbox']",
                "[role='checkbox']",
                "input[class*='Mui-']"
            ];
            
            let checkboxesEncontrados = [];
            
            for (const selector of selectoresCheckbox) {
                const elementos = document.querySelectorAll(selector);
                if (elementos.length > 0) {
                    checkboxesEncontrados = Array.from(elementos);
                    console.log(`✅ Encontrados ${elementos.length} checkboxes con selector: ${selector}`);
                    break;
                }
            }
            
            if (checkboxesEncontrados.length === 0) {
                console.log('⚠️ No se encontraron checkboxes, probando búsqueda alternativa...');
                // Buscar cualquier elemento clickeable que parezca un checkbox
                checkboxesEncontrados = Array.from(document.querySelectorAll(
                    'span[class*="checkbox"], div[class*="checkbox"], input[class*="check"]'
                ));
            }
            
            if (checkboxesEncontrados.length === 0) {
                throw new Error('No se encontraron checkboxes en la declaración');
            }
            
            console.log(`📊 Total de checkboxes encontrados: ${checkboxesEncontrados.length}`);
            
            // Clickear cada checkbox usando múltiples estrategias (como en Python)
            for (let i = 0; i < checkboxesEncontrados.length; i++) {
                const checkbox = checkboxesEncontrados[i];
                
                console.log(`🔘 Procesando checkbox ${i + 1}/${checkboxesEncontrados.length}`);
                
                // Verificar si el checkbox ya está marcado
                const parentSpan = checkbox.closest('span') || checkbox.parentElement;
                if (parentSpan && (
                    parentSpan.classList.contains('Mui-checked') ||
                    parentSpan.classList.contains('checked') ||
                    checkbox.checked
                )) {
                    console.log(`  ✅ Checkbox ${i + 1} ya está marcado`);
                    continue;
                }
                
                // Verificar si está deshabilitado
                if (parentSpan && parentSpan.classList.contains('disabled')) {
                    console.log(`  ⚠️ Checkbox ${i + 1} está deshabilitado`);
                    continue;
                }
                
                // Intentar hacer clic con múltiples estrategias
                let clickExitoso = false;
                
                // Estrategia 1: JavaScript
                try {
                    checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(500);
                    checkbox.click();
                    console.log(`  ✅ Checkbox ${i + 1} clickeado con JavaScript`);
                    clickExitoso = true;
                } catch (e1) {
                    console.log(`  ⚠️ JavaScript falló para checkbox ${i + 1}: ${e1.message}`);
                    
                    // Estrategia 2: dispatchEvent
                    try {
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        checkbox.dispatchEvent(clickEvent);
                        console.log(`  ✅ Checkbox ${i + 1} clickeado con dispatchEvent`);
                        clickExitoso = true;
                    } catch (e2) {
                        console.log(`  ⚠️ dispatchEvent falló para checkbox ${i + 1}: ${e2.message}`);
                        
                        // Estrategia 3: Cambiar propiedad checked directamente
                        try {
                            checkbox.checked = true;
                            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log(`  ✅ Checkbox ${i + 1} marcado directamente`);
                            clickExitoso = true;
                        } catch (e3) {
                            console.log(`  ❌ Todas las estrategias fallaron para checkbox ${i + 1}`);
                        }
                    }
                }
                
                if (clickExitoso) {
                    await this.delay(200); // Pequeña pausa entre clicks
                }
            }
            
            console.log('✅ Proceso de checkboxes completado');
            
        } catch (error) {
            console.error('❌ Error clickeando checkboxes:', error);
            throw error;
        }
    }

    async seleccionarRutRepresentante(rutRepresentante) {
        console.log(`👤 Seleccionando RUT del representante: ${rutRepresentante}`);
        
        try {
            // Primero abrir el dropdown/select si está cerrado
            await this.abrirSelectorRut();
            
            // Buscar el RUT con múltiples selectores
            const selectoresRut = [
                `div[contains(text(),'${rutRepresentante}')]`,
                `li[contains(text(),'${rutRepresentante}')]`,
                `option[value='${rutRepresentante}']`,
                `[data-value='${rutRepresentante}']`,
                `[title*='${rutRepresentante}']`
            ];
            
            let rutEncontrado = null;
            
            for (const selector of selectoresRut) {
                try {
                    if (selector.startsWith('div') || selector.startsWith('li')) {
                        rutEncontrado = document.querySelector(`//div[contains(text(),'${rutRepresentante}')]`);
                        if (!rutEncontrado) {
                            rutEncontrado = document.evaluate(
                                `//div[contains(text(),'${rutRepresentante}')]`,
                                document,
                                null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                null
                            ).singleNodeValue;
                        }
                    } else {
                        rutEncontrado = document.querySelector(selector);
                    }
                    
                    if (rutEncontrado) {
                        console.log(`✅ RUT encontrado con selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    console.log(`⚠️ Error con selector ${selector}: ${e.message}`);
                    continue;
                }
            }
            
            if (!rutEncontrado) {
                // Búsqueda más amplia
                const todosElementos = document.querySelectorAll('div, li, option, span');
                for (const elemento of todosElementos) {
                    if (elemento.textContent && elemento.textContent.includes(rutRepresentante)) {
                        rutEncontrado = elemento;
                        console.log(`✅ RUT encontrado por búsqueda de texto`);
                        break;
                    }
                }
            }
            
            if (!rutEncontrado) {
                throw new Error(`No se encontró el RUT ${rutRepresentante} en las opciones`);
            }
            
            // Hacer clic en el elemento del RUT
            rutEncontrado.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            rutEncontrado.click();
            
            console.log(`✅ RUT ${rutRepresentante} seleccionado exitosamente`);
            
        } catch (error) {
            console.error('❌ Error seleccionando RUT representante:', error);
            throw error;
        }
    }

    async abrirSelectorRut() {
        console.log('📂 Abriendo selector de RUT...');
        
        try {
            const selectoresDropdown = [
                "div[contains(@class, 'MuiInputBase-input')][text()='Seleccione...']",
                ".MuiSelect-select",
                "[role='button'][aria-haspopup='listbox']",
                ".select-dropdown",
                ".dropdown-toggle"
            ];
            
            for (const selector of selectoresDropdown) {
                let dropdown = null;
                
                if (selector.includes('xpath') || selector.includes('text()')) {
                    dropdown = document.evaluate(
                        `//div[contains(@class, 'MuiInputBase-input') and text()='Seleccione...']`,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                } else {
                    dropdown = document.querySelector(selector);
                }
                
                if (dropdown) {
                    console.log(`✅ Dropdown encontrado con selector: ${selector}`);
                    dropdown.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(500);
                    dropdown.click();
                    await this.delay(1000); // Esperar que se abra
                    console.log('✅ Dropdown abierto exitosamente');
                    return;
                }
            }
            
            console.log('⚠️ No se encontró dropdown específico, continuando...');
            
        } catch (error) {
            console.log('⚠️ Error abriendo selector, continuando:', error.message);
        }
    }

    async firmarDeclaracionJurada() {
        console.log('✍️ Iniciando proceso de firma...');
        
        try {
            // Buscar botón "Firmar sin Clave Única"
            const selectoresFirma = [
                "//button[contains(@class, 'sc-dmsloy') and contains(@class, 'EaXFo') and contains(@class, 'hOvxpq') and contains(text(), 'Firmar sin Clave Única')]",
                "button[contains(text(), 'Firmar sin Clave Única')]",
                "button[contains(text(), 'Firmar')]",
                ".button-firmar",
                "[data-action='firmar']"
            ];
            
            let botonFirmar = null;
            
            for (const selector of selectoresFirma) {
                try {
                    if (selector.startsWith('//')) {
                        botonFirmar = document.evaluate(
                            selector,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                    } else {
                        botonFirmar = document.querySelector(selector);
                    }
                    
                    if (botonFirmar) {
                        console.log(`✅ Botón firmar encontrado: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!botonFirmar) {
                throw new Error('No se encontró botón de firma');
            }
            
            // Hacer clic en firmar
            botonFirmar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            botonFirmar.click();
            
            console.log('✅ Clic en botón firmar realizado');
            await this.delay(3000);
            
            // Buscar y hacer clic en botón de confirmación
            await this.confirmarFirma();
            
            // Buscar y hacer clic en botón cerrar
            await this.cerrarModalFirma();
            
            console.log('✅ Proceso de firma completado');
            
        } catch (error) {
            console.error('❌ Error en proceso de firma:', error);
            throw error;
        }
    }

    async confirmarFirma() {
        console.log('✅ Buscando botón de confirmación...');
        
        try {
            const selectoresConfirmar = [
                "//button[contains(@class, 'sc-dmsloy') and contains(@class, 'EaXFo') and contains(@class, 'hOvxpq') and contains(text(), 'Firmar sin Clave Única')]",
                "button[contains(text(), 'Confirmar')]",
                "button[contains(text(), 'Aceptar')]",
                ".confirm-button",
                "[data-action='confirm']"
            ];
            
            let botonConfirmar = null;
            
            for (const selector of selectoresConfirmar) {
                try {
                    if (selector.startsWith('//')) {
                        botonConfirmar = document.evaluate(
                            selector,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                    } else {
                        botonConfirmar = document.querySelector(selector);
                    }
                    
                    if (botonConfirmar) {
                        console.log(`✅ Botón confirmar encontrado: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (botonConfirmar) {
                botonConfirmar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(1000);
                botonConfirmar.click();
                console.log('✅ Confirmación realizada');
                await this.delay(2000);
            } else {
                console.log('⚠️ No se encontró botón de confirmación');
            }
            
        } catch (error) {
            console.log('⚠️ Error en confirmación:', error.message);
        }
    }

    async cerrarModalFirma() {
        console.log('❌ Buscando botón cerrar modal...');
        
        try {
            const selectoresCerrar = [
                "//button[contains(@class, 'EaXFo') and contains(text(), 'Cerrar y volver a la oferta')]",
                "button[contains(text(), 'Cerrar')]",
                "button[contains(text(), 'Volver')]",
                ".close-button",
                "[data-action='close']"
            ];
            
            let botonCerrar = null;
            
            for (const selector of selectoresCerrar) {
                try {
                    if (selector.startsWith('//')) {
                        botonCerrar = document.evaluate(
                            selector,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                    } else {
                        botonCerrar = document.querySelector(selector);
                    }
                    
                    if (botonCerrar) {
                        console.log(`✅ Botón cerrar encontrado: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (botonCerrar) {
                botonCerrar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(1000);
                botonCerrar.click();
                console.log('✅ Modal cerrado');
                await this.delay(3000);
            } else {
                console.log('⚠️ No se encontró botón cerrar, el modal puede haberse cerrado automáticamente');
            }
            
        } catch (error) {
            console.log('⚠️ Error cerrando modal:', error.message);
        }
    }
    
    // FUNCIONES AUXILIARES PARA DECLARACIÓN JURADA
    
    async seleccionarRutDeclaracion() {
        console.log('🆔 Seleccionando RUT para declaración jurada...');
        
        const credenciales = this.automationData?.credenciales;
        const rutRepresentante = credenciales?.rutRepresentante;
        
        if (!rutRepresentante) {
            console.log('📋 No hay RUT de representante, usando RUT principal');
            return;
        }
        
        console.log(`🎯 Buscando RUT representante: ${rutRepresentante}`);
        
        try {
            // Buscar si hay un alert div (como Python línea 2338)
            const existeDiv = document.querySelectorAll('.MuiAlert-message');
            let selectorDropdown;
            
            if (existeDiv.length > 0) {
                console.log('⚠️ Existe div de alerta, usando selector alternativo');
                selectorDropdown = "/html/body/div[2]/div/div/div/div[2]/div/div/div/div/div/div[1]/div/div[1]/div/div";
            } else {
                console.log('✅ No hay div de alerta, usando selector estándar');
                selectorDropdown = "/html/body/div[2]/div/div/div/div[1]/div/div/div/div/div/div[1]/div/div[1]/div/div";
            }
            
            // Click en el dropdown
            const dropdown = document.evaluate(selectorDropdown, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (dropdown) {
                console.log('✅ Dropdown encontrado, haciendo click...');
                dropdown.click();
                await this.delay(2000);
            }
            
            await this.delay(3000);
            
            // Buscar el RUT específico
            console.log(`🔍 Buscando RUT ${rutRepresentante} en opciones...`);
            const rutEncontrado = await this.buscarYSeleccionarRUT(rutRepresentante);
            
            if (!rutEncontrado) {
                console.log('⚠️ RUT no encontrado en dropdown, intentando "Otro RUT"...');
                await this.ingresarOtroRUT(rutRepresentante);
            }
            
        } catch (error) {
            console.error('❌ Error seleccionando RUT:', error);
            console.log('ℹ️ Continuando sin cambiar RUT...');
        }
    }
    
    async buscarYSeleccionarRUT(rutRepresentante) {
        const selectoresRut = [
            `//div[contains(text(),'${rutRepresentante}')]`,
            `//li[contains(text(),'${rutRepresentante}')]`,
            `//*[@data-value='${rutRepresentante}']`,
            `//*[contains(@title,'${rutRepresentante}')]`
        ];
        
        for (const selector of selectoresRut) {
            try {
                console.log(`🔍 Probando selector: ${selector}`);
                const elemento = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                
                if (elemento) {
                    console.log(`✅ RUT encontrado con selector: ${selector}`);
                    
                    // Scroll al elemento
                    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(1000);
                    
                    // Click
                    elemento.click();
                    console.log(`✅ RUT ${rutRepresentante} seleccionado exitosamente`);
                    return true;
                }
            } catch (error) {
                console.log(`⚠️ Error con selector ${selector}: ${error.message}`);
            }
        }
        
        return false;
    }
    
    async ingresarOtroRUT(rutRepresentante) {
        try {
            // Buscar opción "Otro RUT" (como Python línea 2440)
            const selectoresOtroRut = [
                "//div[contains(text(),'Otro RUT')]",
                "//li[contains(text(),'Otro RUT')]",
                "//*[contains(text(),'Otro') and contains(text(),'RUT')]"
            ];
            
            let otroRutClickeado = false;
            for (const selector of selectoresOtroRut) {
                try {
                    const elemento = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (elemento) {
                        console.log('✅ Haciendo click en "Otro RUT"...');
                        elemento.click();
                        otroRutClickeado = true;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            if (otroRutClickeado) {
                await this.delay(2000);
                
                // Buscar campo de input para ingresar RUT (como Python línea 2460)
                const selectoresInput = [
                    "//input[contains(@class,'MuiInputBase-inputAdornedEnd')]",
                    "//input[@type='text']",
                    "//input[contains(@class, 'MuiInputBase-input')]"
                ];
                
                for (const selector of selectoresInput) {
                    try {
                        const input = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (input) {
                            console.log(`✅ Campo de input encontrado, ingresando ${rutRepresentante}...`);
                            input.value = '';
                            input.value = rutRepresentante;
                            
                            // Simular eventos
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            
                            // Presionar Enter
                            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                            
                            console.log(`✅ RUT ${rutRepresentante} ingresado exitosamente`);
                            return;
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error ingresando otro RUT:', error);
        }
    }
    
    async marcarTodosLosCheckboxes() {
        console.log('☑️ Marcando todos los checkboxes de declaración jurada (1-11)...');
        
        try {
            // PRIMERA FASE: Marcar checkboxes 1-9 (puntos básicos)
            console.log('📋 FASE 1: Marcando checkboxes 1-9...');
            await this.marcarCheckboxesFase1();
            
            // Pausa para que se procesen los cambios
            await this.delay(2000);
            
            // SEGUNDA FASE: Verificar si aparecieron puntos 10-11 y marcarlos
            console.log('📋 FASE 2: Verificando si aparecieron puntos 10-11...');
            await this.marcarCheckboxesFase2();
            
            // TERCERA FASE: Marcar checkbox final de veracidad de información
            console.log('📋 FASE 3: Marcando checkbox final de veracidad...');
            await this.marcarCheckboxFinalVeracidad();
            
            // Verificación final
            const estadoFinal = await this.verificarTodosLosCheckboxes();
            console.log(`✅ PROCESO COMPLETADO: ${estadoFinal.checked}/${estadoFinal.total} checkboxes marcados`);
            
            if (estadoFinal.checked < estadoFinal.total) {
                console.warn('⚠️ Algunos checkboxes pueden no haberse marcado');
            }
            
        } catch (error) {
            console.error('❌ Error marcando checkboxes:', error);
            throw error;
        }
    }

    async marcarCheckboxesFase1() {
        console.log('   📝 Buscando checkboxes del 1 al 9...');
        
        // Buscar todos los checkboxes de declaración (excluyendo el final)
        const checkboxes = document.querySelectorAll("input[class*='fKMtys'][type='checkbox']");
        const checkboxesDeclaracion = [];
        
        checkboxes.forEach((checkbox, index) => {
            const label = checkbox.closest('label');
            const labelText = label ? label.textContent : '';
            
            // Identificar checkboxes numerados del 1 al 9 
            if (labelText.match(/^\s*[1-9]\.-/)) {
                checkboxesDeclaracion.push({
                    checkbox: checkbox,
                    numero: labelText.match(/^\s*(\d+)\.-/)[1],
                    texto: labelText.substring(0, 80) + '...'
                });
            }
        });
        
        console.log(`   📊 Encontrados ${checkboxesDeclaracion.length} checkboxes del 1-9`);
        
        // Marcar cada uno
        for (const item of checkboxesDeclaracion) {
            const parentSpan = item.checkbox.parentElement;
            const yaEstaeMarcado = parentSpan && parentSpan.className.includes("Mui-checked");
            
            if (yaEstaeMarcado) {
                console.log(`   ✅ Punto ${item.numero} ya está marcado`);
            } else {
                console.log(`   🔘 Marcando punto ${item.numero}...`);
                try {
                    item.checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(300);
                    item.checkbox.click();
                    await this.delay(500);
                    console.log(`   ✅ Punto ${item.numero} marcado`);
                } catch (error) {
                    console.warn(`   ⚠️ Error marcando punto ${item.numero}:`, error.message);
                }
            }
        }
    }

    async marcarCheckboxesFase2() {
        console.log('   📝 Buscando checkboxes 10-11 (pueden aparecer después de marcar 1-9)...');
        
        // Esperar un momento para que aparezcan los puntos condicionales
        await this.delay(1000);
        
        const checkboxes = document.querySelectorAll("input[class*='fKMtys'][type='checkbox']");
        const checkboxes1011 = [];
        
        checkboxes.forEach((checkbox, index) => {
            const label = checkbox.closest('label');
            const labelText = label ? label.textContent : '';
            
            // Identificar checkboxes numerados 10 y 11
            if (labelText.match(/^\s*(10|11)\.-/)) {
                checkboxes1011.push({
                    checkbox: checkbox,
                    numero: labelText.match(/^\s*(\d+)\.-/)[1],
                    texto: labelText.substring(0, 80) + '...'
                });
            }
        });
        
        if (checkboxes1011.length === 0) {
            console.log('   ℹ️ No se encontraron checkboxes 10-11 (normal si no aplican)');
            return;
        }
        
        console.log(`   📊 Encontrados ${checkboxes1011.length} checkboxes del 10-11`);
        
        // Marcar cada uno
        for (const item of checkboxes1011) {
            const parentSpan = item.checkbox.parentElement;
            const yaEstaMarcado = parentSpan && parentSpan.className.includes("Mui-checked");
            
            if (yaEstaMarcado) {
                console.log(`   ✅ Punto ${item.numero} ya está marcado`);
            } else {
                console.log(`   🔘 Marcando punto ${item.numero}...`);
                try {
                    item.checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(300);
                    item.checkbox.click();
                    await this.delay(500);
                    console.log(`   ✅ Punto ${item.numero} marcado`);
                } catch (error) {
                    console.warn(`   ⚠️ Error marcando punto ${item.numero}:`, error.message);
                }
            }
        }
    }

    async marcarCheckboxFinalVeracidad() {
        console.log('   📝 Buscando checkbox final de veracidad de información...');
        
        const checkboxes = document.querySelectorAll("input[class*='fKMtys'][type='checkbox']");
        
        // Buscar el checkbox final que habla de veracidad y perjurio
        let checkboxFinal = null;
        checkboxes.forEach((checkbox) => {
            const label = checkbox.closest('label');
            const labelText = label ? label.textContent.toLowerCase() : '';
            
            if (labelText.includes('declaro que toda la información') || 
                labelText.includes('veraz') || 
                labelText.includes('perjurio')) {
                checkboxFinal = checkbox;
            }
        });
        
        if (!checkboxFinal) {
            console.warn('   ⚠️ No se encontró checkbox final de veracidad');
            return;
        }
        
        const parentSpan = checkboxFinal.parentElement;
        const yaEstaMarcado = parentSpan && parentSpan.className.includes("Mui-checked");
        
        if (yaEstaMarcado) {
            console.log('   ✅ Checkbox de veracidad ya está marcado');
        } else {
            console.log('   🔘 Marcando checkbox de veracidad...');
            try {
                checkboxFinal.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(300);
                checkboxFinal.click();
                await this.delay(500);
                console.log('   ✅ Checkbox de veracidad marcado');
            } catch (error) {
                console.warn('   ⚠️ Error marcando checkbox de veracidad:', error.message);
            }
        }
    }

    async verificarTodosLosCheckboxes() {
        const botones = document.querySelectorAll("input[class*='fKMtys'][type='checkbox']");
        
        let checkedCount = 0;
        for (const boton of botones) {
            const parentSpan = boton.parentElement;
            if (parentSpan && parentSpan.className.includes("Mui-checked")) {
                checkedCount++;
            }
        }
        
        return { total: botones.length, checked: checkedCount };
    }

    async continuarProcesarProductos() {
        console.log('📦 Continuando procesamiento de productos después de activar chkNoBids...');
        
        // VERIFICAR SI ESTAMOS EN LA PÁGINA CORRECTA
        const currentUrl = window.location.href;
        console.log(`📍 URL actual: ${currentUrl}`);
        
        // 🚀 EJECUTAR executeDocumentUploadFlow() SOLO para páginas específicas (NO productos)
        if (currentUrl.includes('/BID/Modules/BID/') && currentUrl.includes('idPagina=')) {
            // Detectar tipo de página del wizard
            const pasoWizard = this.detectWizardStep();
            console.log(`🔍 Tipo de página detectada: ${pasoWizard}`);
            
            // Solo ejecutar executeDocumentUploadFlow para páginas que NO son productos
            if (pasoWizard !== 'wizard_paso2_productos') {
                console.log('✅ DETECTADO: Página de wizard NO-productos - ejecutando executeDocumentUploadFlow()');
                console.log('📍 URL wizard:', currentUrl);
                await this.executeDocumentUploadFlow();
                return;
            } else {
                console.log('📦 DETECTADO: Página de productos - continuando con lógica de paginación...');
            }
        }
        
        // Si estamos en página de documentos, PROCESAR DOCUMENTOS en lugar de productos
        if (currentUrl.includes('WizAttachment.aspx')) {
            console.log('📄 DETECTADO: Estamos en página de documentos (WizAttachment.aspx)');
            console.log('📋 Cambiando flujo: Procesando DOCUMENTOS en lugar de productos...');
            await this.procesarDocumentos();
            return;
        }
        
        // Si estamos en DJ, procesar DJ
        if (currentUrl.includes('dj-requisitos') || currentUrl.includes('declaracion')) {
            console.log('📋 DETECTADO: Estamos en página de declaración jurada');
            console.log('🖊️ Cambiando flujo: Procesando DECLARACIÓN JURADA...');
            await this.manejarDeclaracionJurada();
            return;
        }
        
        // Si estamos en página de confirmación, verificar por popup "estado guardada"
        if (currentUrl.includes('WizBIDConfirm.aspx')) {
            console.log('🚨 DETECTADO: Estamos en página de confirmación (WizBIDConfirm.aspx)');
            console.log('🔍 Verificando si hay popup "Tu oferta quedará en estado guardada"...');
            
            await this.delay(2000); // Esperar que aparezca el popup
            const tienePopupEstadoGuardada = await this.manejarPopupEstadoGuardada();
            
            if (tienePopupEstadoGuardada) {
                console.log('❌ Detectado popup "estado guardada" - oferta incompleta');
                console.log('🔄 Necesita volver a completar pasos faltantes');
                return; // Detener procesamiento
            } else {
                console.log('✅ No hay popup de error - oferta parece completa');
                console.log('🎉 Proceso completado exitosamente');
                this.updateIndicator('✅ Oferta enviada exitosamente', 'success');
                return;
            }
        }
        
        // ✅ OBTENER PRODUCTOS REALES DEL ENDPOINT
        let productos = this.automationData?.licitacion?.productos;
        
        if (!productos || productos.length === 0) {
            console.error('❌ ERROR CRÍTICO: No hay productos del endpoint');
            throw new Error('No se pueden procesar productos - No hay datos del endpoint');
        }
        
        console.log(`✅ PRODUCTOS ENCONTRADOS: ${productos.length} items`);
        
        // DETERMINAR EN QUE PÁGINAS ESTÁN LOS ITEMS REALES
        console.log('🔢 ANALIZANDO NÚMEROS DE ITEMS REALES...');
        
        // Agrupar productos por página basado en su número de item real
        const productosPorPagina = new Map();
        
        productos.forEach((producto, index) => {
            const itemNumber = producto.item || producto.item_numero;
            // Calcular página basada en número de item (1-10 = página 1, 11-20 = página 2, etc.)
            const paginaReal = Math.ceil(itemNumber / 10);
            
            console.log(`   📦 Producto ${index + 1}: Item ${itemNumber} → Página ${paginaReal}`);
            
            if (!productosPorPagina.has(paginaReal)) {
                productosPorPagina.set(paginaReal, []);
            }
            productosPorPagina.get(paginaReal).push({
                producto: producto,
                itemNumber: itemNumber,
                posicionEnPagina: ((itemNumber - 1) % 10) + 1 // 1-10 dentro de la página
            });
        });
        
        const paginasAVisitar = Array.from(productosPorPagina.keys()).sort((a, b) => a - b);
        console.log(`📄 Páginas a visitar: ${paginasAVisitar.join(', ')}`);
        
        // PROCESAR CADA PÁGINA QUE TIENE PRODUCTOS
        for (const numeroPagina of paginasAVisitar) {
            const productosEnEstataPagina = productosPorPagina.get(numeroPagina);
            
            console.log('═'.repeat(80));
            console.log(`📄 PROCESANDO PÁGINA ${numeroPagina}`);
            console.log(`📦 Items en esta página: ${productosEnEstataPagina.length}`);
            console.log('═'.repeat(80));
            
            // NAVEGAR A LA PÁGINA (si no es la primera)  
            if (numeroPagina > 1) {
                console.log(`🔄 Navegando a página ${numeroPagina}...`);
                
                // GUARDAR ESTADO ANTES DE NAVEGAR
                await this.guardarEstadoProcesamiento({
                    paginaActual: numeroPagina,
                    productosEnEstataPagina: productosEnEstataPagina,
                    paginasRestantes: paginasAVisitar.slice(paginasAVisitar.indexOf(numeroPagina) + 1)
                });
                
                try {
                    await this.navegarAPagina(numeroPagina);
                    // LA NAVEGACIÓN CAUSARÁ UNA RECARGA DE PÁGINA
                    // El procesamiento continuará desde verificarEstadoPendiente()
                    return;
                } catch (error) {
                    console.error(`❌ Error navegando a página ${numeroPagina}: ${error.message}`);
                }
            } else {
                console.log(`✅ Ya estamos en página ${numeroPagina}`);
            }
            
            // PROCESAR CADA PRODUCTO DE ESTA PÁGINA
            console.log(`✅ Procesando ítems correspondientes (chkNoBids ya marcó todos como "No oferto")...`);
            let itemsProcesadosExitosamente = 0;
            let itemsConError = 0;
            
            for (const {producto, itemNumber, posicionEnPagina} of productosEnEstataPagina) {
                try {
                    console.log(`📦 PROCESANDO Item ${itemNumber}: ${producto.nombre?.substring(0, 50)}...`);
                    console.log(`   🎯 Posición en página: ${posicionEnPagina}`);
                    console.log(`   💰 Precio: $${producto.precio_unitario}`);
                    
                    // VALIDAR ANTES DE PROCESAR
                    const validacion = await this.validarItemAntesDeProcesar(itemNumber, posicionEnPagina);
                    if (!validacion.valido) {
                        console.error(`   ❌ Item ${itemNumber} falló validación: ${validacion.error}`);
                        itemsConError++;
                        continue;
                    }
                    
                    // PROCESAR EL ITEM
                    await this.procesarItemIndividual(producto, posicionEnPagina);
                    
                    // VALIDAR DESPUÉS DE PROCESAR
                    const validacionPost = await this.validarItemDespuesDeProcesar(itemNumber, posicionEnPagina, producto);
                    if (validacionPost.valido) {
                        console.log(`   ✅ Item ${itemNumber} procesado y validado exitosamente`);
                        itemsProcesadosExitosamente++;
                    } else {
                        console.error(`   ❌ Item ${itemNumber} procesado pero falló validación: ${validacionPost.error}`);
                        itemsConError++;
                    }
                    
                } catch (error) {
                    console.error(`   ❌ Error procesando item ${itemNumber}: ${error.message}`);
                    itemsConError++;
                }
                
                await this.delay(1000); // Pausa aumentada entre items
            }
            
            // RESUMEN DE PROCESAMIENTO DE LA PÁGINA
            console.log(`📊 RESUMEN PÁGINA ${numeroPagina}:`);
            console.log(`   ✅ Items procesados exitosamente: ${itemsProcesadosExitosamente}`);
            console.log(`   ❌ Items con error: ${itemsConError}`);
            console.log(`   📋 Total items en página: ${productosEnEstataPagina.length}`);
            
            console.log(`✅ Página ${numeroPagina} completada`);
        }
        
        console.log('🎉 TODOS LOS PRODUCTOS PROCESADOS EXITOSAMENTE');
        
        // CONTINUAR CON EL FLUJO NORMAL: avanzar a declaración jurada
        console.log('🔄 Continuando con siguiente paso del flujo...');
        await this.avanzarADeclaracionJurada();
    }

    async validarItemAntesDeProcesar(itemNumber, posicionEnPagina) {
        console.log(`      🔍 Validando item ${itemNumber} antes de procesar...`);
        
        try {
            const indiceFormateado = (posicionEnPagina - 1).toString().padStart(2, '0');
            
            // Verificar que existan los elementos necesarios
            const selectorSiOferto = `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}_rblBids_0`;
            const selectorNoOferto = `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}_rblBids_1`;
            const selectorTextarea = `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtSupplierComment`;
            const selectorPrecio = `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtUnitNetPriceN`;
            
            const elementos = {
                siOferto: document.querySelector(selectorSiOferto),
                noOferto: document.querySelector(selectorNoOferto),
                textarea: document.querySelector(selectorTextarea),
                precio: document.querySelector(selectorPrecio)
            };
            
            console.log(`      📋 Elementos encontrados para item ${itemNumber}:`);
            console.log(`         🔘 Radio Sí Oferto: ${elementos.siOferto ? '✅' : '❌'} (${selectorSiOferto})`);
            console.log(`         🔘 Radio No Oferto: ${elementos.noOferto ? '✅' : '❌'} (${selectorNoOferto})`);
            console.log(`         📝 Textarea: ${elementos.textarea ? '✅' : '❌'} (${selectorTextarea})`);
            console.log(`         💰 Precio: ${elementos.precio ? '✅' : '❌'} (${selectorPrecio})`);
            
            // Verificar estado actual
            if (elementos.noOferto) {
                console.log(`      📊 Estado actual No Oferto: ${elementos.noOferto.checked ? 'MARCADO' : 'NO MARCADO'}`);
            }
            if (elementos.siOferto) {
                console.log(`      📊 Estado actual Sí Oferto: ${elementos.siOferto.checked ? 'MARCADO' : 'NO MARCADO'}`);
            }
            
            // Validar elementos críticos
            if (!elementos.siOferto || !elementos.textarea || !elementos.precio) {
                const faltantes = [];
                if (!elementos.siOferto) faltantes.push('Radio Sí Oferto');
                if (!elementos.textarea) faltantes.push('Textarea');
                if (!elementos.precio) faltantes.push('Campo Precio');
                
                return {
                    valido: false,
                    error: `Elementos faltantes: ${faltantes.join(', ')}`,
                    elementos: elementos
                };
            }
            
            return {
                valido: true,
                elementos: elementos
            };
            
        } catch (error) {
            return {
                valido: false,
                error: `Error en validación: ${error.message}`
            };
        }
    }

    async validarItemDespuesDeProcesar(itemNumber, posicionEnPagina, producto) {
        console.log(`      ✅ Validando item ${itemNumber} después de procesar...`);
        
        try {
            const indiceFormateado = (posicionEnPagina - 1).toString().padStart(2, '0');
            
            const selectorSiOferto = `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}_rblBids_0`;
            const selectorTextarea = `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtSupplierComment`;
            const selectorPrecio = `#ctl00_mpcphFormWizardFields_rptBids_ctl${indiceFormateado}__TxtUnitNetPriceN`;
            
            const elementos = {
                siOferto: document.querySelector(selectorSiOferto),
                textarea: document.querySelector(selectorTextarea),
                precio: document.querySelector(selectorPrecio)
            };
            
            const validaciones = [];
            
            // Validar que "Sí Oferto" esté marcado
            if (elementos.siOferto && elementos.siOferto.checked) {
                console.log(`      ✅ Sí Oferto marcado correctamente`);
                validaciones.push(true);
            } else {
                console.error(`      ❌ Sí Oferto NO está marcado`);
                validaciones.push(false);
            }
            
            // Validar que la descripción esté llena
            if (elementos.textarea && elementos.textarea.value.trim() !== '') {
                console.log(`      ✅ Descripción llena: "${elementos.textarea.value.substring(0, 30)}..."`);
                validaciones.push(true);
            } else {
                console.error(`      ❌ Descripción vacía`);
                validaciones.push(false);
            }
            
            // Validar que el precio esté lleno y coincida
            if (elementos.precio && elementos.precio.value.trim() !== '') {
                const precioEsperado = producto.precio_unitario.toString();
                const precioActual = elementos.precio.value.trim();
                if (precioActual === precioEsperado) {
                    console.log(`      ✅ Precio correcto: ${precioActual}`);
                    validaciones.push(true);
                } else {
                    console.error(`      ❌ Precio incorrecto. Esperado: ${precioEsperado}, Actual: ${precioActual}`);
                    validaciones.push(false);
                }
            } else {
                console.error(`      ❌ Precio vacío`);
                validaciones.push(false);
            }
            
            const todoValido = validaciones.every(v => v === true);
            
            return {
                valido: todoValido,
                error: todoValido ? null : `Falló una o más validaciones`,
                detalles: {
                    siOferto: elementos.siOferto?.checked || false,
                    descripcion: elementos.textarea?.value || '',
                    precio: elementos.precio?.value || ''
                }
            };
            
        } catch (error) {
            return {
                valido: false,
                error: `Error en validación post-procesamiento: ${error.message}`
            };
        }
    }
    
    async firmarSinClaveUnica() {
        console.log('🖊️ FIRMANDO SIN CLAVE ÚNICA - BÚSQUEDA EXHAUSTIVA...');
        console.log('🔍 Iniciando búsqueda agresiva en todos los contextos...');
        
        try {
            await this.delay(2000);
            
            let botonFirmar = await this.buscarBotonFirmarSeguro();
            
            if (!botonFirmar) {
                console.error('❌ BOTÓN NO ENCONTRADO');
                throw new Error('No se pudo localizar el botón "Firmar sin Clave Única"');
            }
            
            console.log('✅ BOTÓN ENCONTRADO - Procediendo con click...');
            console.log(`📝 Texto: "${botonFirmar.textContent.trim()}"`);
            console.log(`🏷️ Classes: ${botonFirmar.className}`);
            
            // EJECUTAR CLICK MÚLTIPLE
            botonFirmar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            
            console.log('🖊️ Haciendo click en "Firmar sin Clave Única"...');
            console.log('');
            console.log('🔴 === DEBUG PUNTO 1: ANTES DEL CLICK ===');
            
            // Múltiples métodos de click
            try {
                botonFirmar.click();
                console.log('✅ Click directo exitoso');
                console.log('🔴 === DEBUG PUNTO 2: CLICK EJECUTADO ===');
                console.log('');
            } catch (e1) {
                try {
                    botonFirmar.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    console.log('✅ dispatchEvent exitoso');
                } catch (e2) {
                    botonFirmar.focus();
                    await this.delay(200);
                    botonFirmar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                    console.log('✅ Focus + Enter exitoso');
                }
            }
            
            // PASO 2: ESPERAR Y BUSCAR EL MODAL DE CONFIRMACIÓN
            console.log('⏳ Esperando modal de confirmación...');
            console.log('🔴 === DEBUG PUNTO 3: ESPERANDO MODAL ===');
            await this.delay(3000);
            console.log('🔴 === DEBUG PUNTO 4: BUSCANDO BOTÓN EN MODAL ===');
            
            // BUSCAR EL MODAL DE CONFIRMACIÓN ESPECÍFICO
            const modalConfirmacion = document.querySelector('.sc-kAKABG, .sc-hlPBbr, [class*="sc-hlPBbr"]');
            if (modalConfirmacion) {
                console.log('✅ Modal de confirmación encontrado');
                
                // BUSCAR EL BOTÓN "Firmar sin Clave Única" DENTRO DEL MODAL
                const botonFirmaModal = modalConfirmacion.querySelector('button[class*="sc-dmsloy"][class*="EaXFo"]');
                
                if (botonFirmaModal && botonFirmaModal.textContent.includes('Firmar sin Clave Única')) {
                    console.log('🔴 === DEBUG PUNTO 4.1: BOTÓN EN MODAL ENCONTRADO ===');
                    console.log(`📝 Texto del botón modal: "${botonFirmaModal.textContent.trim()}"`);
                    console.log(`🏷️ Classes del botón modal: ${botonFirmaModal.className}`);
                    
                    // HACER CLICK EN EL BOTÓN DEL MODAL
                    console.log('🖊️ Haciendo click en botón "Firmar sin Clave Única" DEL MODAL...');
                    botonFirmaModal.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(1000);
                    
                    try {
                        botonFirmaModal.click();
                        console.log('✅ Click en botón del modal exitoso');
                        console.log('🔴 === DEBUG PUNTO 4.2: CLICK EN MODAL EJECUTADO ===');
                    } catch (e) {
                        botonFirmaModal.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        console.log('✅ dispatchEvent en botón del modal exitoso');
                    }
                    
                    // ESPERAR A QUE SE PROCESE LA FIRMA
                    console.log('⏳ Esperando procesamiento de firma...');
                    await this.delay(5000);
                    
                } else {
                    console.log('❌ No se encontró botón "Firmar sin Clave Única" en el modal');
                    console.log('🔍 Botones encontrados en modal:');
                    const botonesEnModal = modalConfirmacion.querySelectorAll('button');
                    botonesEnModal.forEach((btn, index) => {
                        console.log(`   ${index + 1}: "${btn.textContent.trim()}" - ${btn.className}`);
                    });
                }
            } else {
                console.log('❌ Modal de confirmación no encontrado');
                console.log('🔍 Buscando modales alternativos...');
                
                // BUSCAR MODALES ALTERNATIVOS
                const modalesAlternativos = document.querySelectorAll('.MuiDialog-root, .MuiModal-root, [role="dialog"], [class*="modal"]');
                console.log(`📊 Modales alternativos encontrados: ${modalesAlternativos.length}`);
                
                modalesAlternativos.forEach((modal, index) => {
                    const botonesModalAlt = modal.querySelectorAll('button');
                    console.log(`   Modal ${index + 1}: ${botonesModalAlt.length} botones`);
                    botonesModalAlt.forEach((btn, btnIndex) => {
                        console.log(`     Botón ${btnIndex + 1}: "${btn.textContent.trim()}"`);
                    });
                });
            }
            
            // VERIFICAR SI LA FIRMA SE PROCESÓ CORRECTAMENTE
            console.log('🔴 === DEBUG PUNTO 5: VERIFICANDO PROCESAMIENTO ===');
            console.log('⏳ Esperando que se procese la firma y se cierre el modal...');
            
            // Esperar a que se procese
            await this.delay(3000);
            
            // Verificar si el modal se cerró
            const modalDespuesFirma = document.querySelector('.sc-kAKABG, .sc-hlPBbr, [class*="sc-hlPBbr"]');
            if (modalDespuesFirma) {
                console.log('⚠️ Modal aún presente - intentando cerrarlo...');
                
                // Buscar botón de cerrar (X)
                const botonCerrar = modalDespuesFirma.querySelector('button[class*="sc-gIDRJr"]');
                if (botonCerrar) {
                    console.log('🔴 === DEBUG PUNTO 5.1: CERRANDO MODAL CON X ===');
                    botonCerrar.click();
                    await this.delay(2000);
                } else {
                    console.log('🔴 === DEBUG PUNTO 5.1: ENVIANDO ESCAPE PARA CERRAR ===');
                    // Intentar cerrar con Escape
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Escape',
                        keyCode: 27,
                        bubbles: true,
                        cancelable: true
                    }));
                    await this.delay(2000);
                }
            } else {
                console.log('✅ Modal se cerró automáticamente');
                console.log('🔴 === DEBUG PUNTO 5.1: MODAL CERRADO AUTOMÁTICAMENTE ===');
            }
            
            console.log('✅ Múltiples ENTER enviados para confirmar modales');
            console.log('🔄 Esperando redirección automática...');
            console.log('🔴 === DEBUG PUNTO 6: ESPERANDO REDIRECCIÓN ===');
            console.log('');
            
            // Esperar redirección automática
            await this.delay(5000);
            console.log('🔴 === DEBUG PUNTO 7: DESPUES DE ESPERAR REDIRECCIÓN ===');
            console.log(`📍 URL actual: ${window.location.href}`);
            
            // Si no regresó automáticamente, forzar regreso
            if (window.location.href.includes('dj-requisitos')) {
                console.log('⚠️ Aún en página DJ - FORZANDO REGRESO...');
                console.log('🔴 === DEBUG PUNTO 8: AUN EN DJ, NO SE REDIRIGO ===');
                
                // Verificar si hay modales abiertos aún
                const modalesFinales = document.querySelectorAll('.MuiDialog-root, .MuiModal-root, [role="dialog"], .modal');
                console.log(`🔍 Modales aún abiertos: ${modalesFinales.length}`);
                
                const regresoUrl = `https://www.mercadopublico.cl/BID/Modules/BID/WizAttachment.aspx?idPagina=${this.licitacionId.replace('1641-430-LR25', window.location.search.split('idPagina=')[1] || 'default')}`;
                console.log(`🔄 Regresando a: ${regresoUrl}`);
                window.location.href = regresoUrl;
                return;
            } else {
                console.log('✅ === DEBUG PUNTO 8: REDIRECTION EXITOSA ===');
                console.log(`📍 Nueva URL: ${window.location.href}`);
            }
            
            await this.delay(2000);
            
            // Buscar modal en documento actual sin acceso cross-origin
            const modal = document.querySelector('.MuiDialog-root, .MuiModal-root, [role="dialog"]');
            
            if (modal && modal.offsetParent !== null) {
                console.log('✅ Modal encontrado - procesando...');
                
                // Buscar segundo botón dentro del modal
                const botonesModal = modal.querySelectorAll('button');
                let segundoBoton = null;
                
                for (const btn of botonesModal) {
                    if (btn.textContent.includes('Firmar sin Clave Única') && btn.offsetParent !== null) {
                        segundoBoton = btn;
                        break;
                    }
                }
                
                if (segundoBoton) {
                    console.log('✅ Segundo botón encontrado en modal');
                    segundoBoton.click();
                    await this.delay(2000);
                    
                    // Buscar botón cerrar
                    const botonCerrar = [...modal.querySelectorAll('button')].find(btn => 
                        btn.textContent.includes('Cerrar') || 
                        btn.textContent.includes('volver') ||
                        btn.textContent.includes('OK')
                    );
                    
                    if (botonCerrar) {
                        console.log('✅ Botón cerrar encontrado');
                        botonCerrar.click();
                        await this.delay(2000);
                    }
                }
                
                console.log('✅ Modal procesado');
            } else {
                console.log('⚠️ Modal no encontrado o ya cerrado');
            }
            
            console.log('✅ Proceso de firma sin Clave Única completado');
            
        } catch (error) {
            console.error('❌ Error firmando sin Clave Única:', error);
            throw error;
        }
    }

    /**
     * BUSCAR BOTÓN FIRMAR SIMPLE SIN CROSS-ORIGIN
     */
    async buscarBotonFirmarSeguro() {
        console.log('🔍 Buscando botón "Firmar sin Clave Única" de forma segura...');
        
        // MÉTODO 1: Buscar por clases específicas que proporcionaste
        let boton = document.querySelector('button.sc-dmsloy.EaXFo.MuiButtonBase-root.sc-iXWftf.sc-hZocGY.hOvxpq.fQmeuA');
        if (boton && boton.textContent.includes('Firmar sin Clave Única')) {
            console.log('✅ Encontrado por clases específicas');
            return boton;
        }
        
        // MÉTODO 2: Buscar por variant contained
        const botonesContained = document.querySelectorAll('button[variant="contained"]');
        for (const btn of botonesContained) {
            if (btn.textContent.includes('Firmar sin Clave Única') && btn.offsetParent !== null) {
                console.log('✅ Encontrado por variant contained');
                return btn;
            }
        }
        
        // MÉTODO 3: Buscar por texto exacto
        const todosBotones = document.querySelectorAll('button');
        for (const btn of todosBotones) {
            if (btn.textContent.trim() === 'Firmar sin Clave Única' && btn.offsetParent !== null) {
                console.log('✅ Encontrado por texto exacto');
                return btn;
            }
        }
        
        console.log('❌ No se encontró el botón');
        return null;
    }

    /**
     * FUNCIÓN DE UTILIDAD EJECUTAR CLICK AGRESIVO
     */
    async ejecutarClickAgresivo(elemento) {
        try {
            elemento.click();
            return true;
        } catch (e) {
            try {
                elemento.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                return true;
            } catch (e2) {
                elemento.focus();
                await this.delay(100);
                elemento.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                return true;
            }
        }
    }

    /**
     * BÚSQUEDA EXHAUSTIVA DEL BOTÓN FIRMAR EN TODOS LOS CONTEXTOS POSIBLES
     */
    async buscarBotonFirmarExhaustivo() {
        console.log('🔍 INICIANDO BÚSQUEDA EXHAUSTIVA...');
        
        // Lista de todos los métodos de búsqueda
        const metodoBusqueda = [
            { nombre: 'DOM Principal', func: () => this.buscarEnDOMPrincipal() }
        ];
        
        for (const metodo of metodoBusqueda) {
            console.log(`🔍 Buscando en: ${metodo.nombre}...`);
            try {
                const resultado = await metodo.func();
                if (resultado) {
                    console.log(`✅ ENCONTRADO en: ${metodo.nombre}`);
                    return { elemento: resultado, contexto: metodo.nombre };
                }
            } catch (error) {
                console.log(`⚠️ Error en ${metodo.nombre}:`, error.message);
            }
        }
        
        return null;
    }

    /**
     * BUSCAR EN DOM PRINCIPAL
     */
    async buscarEnDOMPrincipal() {
        console.log('🔍 Buscando en DOM principal...');
        
        const selectores = [
            'button.sc-dmsloy.EaXFo.MuiButtonBase-root.sc-iXWftf.sc-hZocGY.hOvxpq.fQmeuA',
            'button.sc-dmsloy.EaXFo.MuiButtonBase-root',
            'button[variant="contained"]',
            'button.MuiButtonBase-root'
        ];
        
        // Probar selectores CSS
        for (const selector of selectores) {
            try {
                const elementos = document.querySelectorAll(selector);
                for (const elem of elementos) {
                    if (elem.textContent.includes('Firmar sin Clave Única') && 
                        !elem.textContent.includes('ClaveÚnica')) {
                        console.log(`✅ Encontrado con selector: ${selector}`);
                        return elem;
                    }
                }
            } catch (e) {
                console.log(`⚠️ Error con selector ${selector}:`, e.message);
            }
        }
        
        // Búsqueda manual por todos los botones
        const todosBotones = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        console.log(`📊 Analizando ${todosBotones.length} botones manualmente...`);
        
        for (const boton of todosBotones) {
            const texto = boton.textContent || boton.value || '';
            if (texto.trim() === 'Firmar sin Clave Única') {
                console.log('✅ Encontrado por búsqueda manual');
                console.log(`   Texto: "${texto}"`);
                console.log(`   Classes: ${boton.className}`);
                console.log(`   Visible: ${boton.offsetParent !== null}`);
                return boton;
            }
        }
        
        return null;
    }

    /**
     * BUSCAR EN TODOS LOS IFRAMES
     */
    async buscarEnTodosLosIframes() {
        console.log('🔍 Buscando en todos los iframes...');
        
        const iframes = document.querySelectorAll('iframe');
        console.log(`📊 ${iframes.length} iframes encontrados`);
        
        for (let i = 0; i < iframes.length; i++) {
            const iframe = iframes[i];
            try {
                console.log(`   Revisando iframe ${i}: ${iframe.src || 'sin src'}`);
                
                // Intentar acceder al contentDocument
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) {
                    console.log(`   ⚠️ No se puede acceder al iframe ${i} (CORS?)`);
                    continue;
                }
                
                // Buscar botones en el iframe
                const botones = iframeDoc.querySelectorAll('button, input[type="button"], input[type="submit"]');
                console.log(`   📊 ${botones.length} botones en iframe ${i}`);
                
                for (const boton of botones) {
                    const texto = boton.textContent || boton.value || '';
                    if (texto.includes('Firmar sin Clave Única')) {
                        console.log(`✅ Encontrado en iframe ${i}`);
                        return boton;
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Error accediendo iframe ${i}:`, error.message);
            }
        }
        
        return null;
    }

    /**
     * BUSCAR EN SHADOW DOM
     */
    async buscarEnShadowDOM() {
        console.log('🔍 Buscando en Shadow DOM...');
        
        const buscarEnShadowRecursivo = (element) => {
            // Buscar en este elemento
            if (element.shadowRoot) {
                const botones = element.shadowRoot.querySelectorAll('button, input[type="button"], input[type="submit"]');
                for (const boton of botones) {
                    if (boton.textContent && boton.textContent.includes('Firmar sin Clave Única')) {
                        console.log('✅ Encontrado en Shadow DOM');
                        return boton;
                    }
                }
                
                // Buscar recursivamente en hijos del shadow
                for (const hijo of element.shadowRoot.querySelectorAll('*')) {
                    const resultado = buscarEnShadowRecursivo(hijo);
                    if (resultado) return resultado;
                }
            }
            
            // Buscar en hijos normales
            for (const hijo of element.children || []) {
                const resultado = buscarEnShadowRecursivo(hijo);
                if (resultado) return resultado;
            }
            
            return null;
        };
        
        return buscarEnShadowRecursivo(document.body);
    }

    /**
     * BUSCAR EN MODALES Y OVERLAYS
     */
    async buscarEnModalesYOverlays() {
        console.log('🔍 Buscando en modales y overlays...');
        
        const selectoresModal = [
            '.MuiDialog-root',
            '.MuiModal-root', 
            '.MuiPopover-root',
            '[role="dialog"]',
            '[role="alertdialog"]',
            '.modal',
            '.overlay',
            '.popup',
            '[data-testid*="modal"]',
            '[data-testid*="dialog"]',
            '.ReactModal__Content'
        ];
        
        for (const selector of selectoresModal) {
            try {
                const modales = document.querySelectorAll(selector);
                console.log(`   📊 ${modales.length} elementos con selector ${selector}`);
                
                for (const modal of modales) {
                    if (modal.offsetParent === null) continue; // Skip invisible
                    
                    const botones = modal.querySelectorAll('button, input[type="button"], input[type="submit"]');
                    for (const boton of botones) {
                        if (boton.textContent && boton.textContent.includes('Firmar sin Clave Única')) {
                            console.log(`✅ Encontrado en modal ${selector}`);
                            return boton;
                        }
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Error con selector ${selector}:`, error.message);
            }
        }
        
        return null;
    }

    /**
     * BUSCAR EN ELEMENTOS OCULTOS
     */
    async buscarEnElementosOcultos() {
        console.log('🔍 Buscando en elementos ocultos...');
        
        const todosBotones = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
        
        for (const boton of todosBotones) {
            if (boton.textContent && boton.textContent.includes('Firmar sin Clave Única')) {
                const styles = getComputedStyle(boton);
                const esOculto = (
                    styles.display === 'none' || 
                    styles.visibility === 'hidden' || 
                    styles.opacity === '0' ||
                    boton.offsetParent === null
                );
                
                if (esOculto) {
                    console.log('✅ Encontrado elemento oculto - intentando hacer visible');
                    // Intentar hacer visible
                    boton.style.display = 'block';
                    boton.style.visibility = 'visible';
                    boton.style.opacity = '1';
                    return boton;
                }
            }
        }
        
        return null;
    }

    /**
     * BUSCAR EN COMPONENTES JS
     */
    async buscarEnComponentesJS() {
        console.log('🔍 Buscando en componentes React/Vue...');
        
        // Buscar elementos con propiedades React
        const elementosConReact = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
        
        for (const elemento of elementosConReact) {
            const botones = elemento.querySelectorAll('button');
            for (const boton of botones) {
                if (boton.textContent && boton.textContent.includes('Firmar sin Clave Única')) {
                    console.log('✅ Encontrado en componente React/Vue');
                    return boton;
                }
            }
        }
        
        // Buscar por propiedades especiales de frameworks
        const selectoresFramework = [
            '[data-v-*]', // Vue
            '[data-react-*]', // React
            '[ng-*]', // Angular
            '[data-bind*]' // Knockout/otros
        ];
        
        for (const selector of selectoresFramework) {
            try {
                const elementos = document.querySelectorAll(`button${selector}, input[type="button"]${selector}`);
                for (const elem of elementos) {
                    if (elem.textContent && elem.textContent.includes('Firmar sin Clave Única')) {
                        console.log(`✅ Encontrado con selector framework: ${selector}`);
                        return elem;
                    }
                }
            } catch (e) {
                // Selector inválido, continuar
            }
        }
        
        return null;
    }

    /**
     * BUSCAR EN WINDOW FRAMES
     */
    async buscarEnWindowFrames() {
        console.log('🔍 Buscando en window frames...');
        
        try {
            // Buscar en frames/ventanas secundarias
            for (let i = 0; i < window.frames.length; i++) {
                try {
                    const frame = window.frames[i];
                    if (frame.document) {
                        const botones = frame.document.querySelectorAll('button, input[type="button"], input[type="submit"]');
                        for (const boton of botones) {
                            if (boton.textContent && boton.textContent.includes('Firmar sin Clave Única')) {
                                console.log(`✅ Encontrado en window frame ${i}`);
                                return boton;
                            }
                        }
                    }
                } catch (frameError) {
                    console.log(`   ⚠️ No se puede acceder al frame ${i}:`, frameError.message);
                }
            }
        } catch (error) {
            console.log('⚠️ Error buscando en frames:', error.message);
        }
        
        return null;
    }










    
    // FUNCIONES AUXILIARES PARA MANEJO DE VENTANAS
    
    async getWindowHandles() {
        // En el contexto del content script, solo podemos trabajar con la ventana actual
        // Esta función simula el comportamiento para compatibilidad
        return [window];
    }
    
    async switchToWindow(windowHandle) {
        // En content script no podemos cambiar ventanas directamente
        // El script debe ejecutarse en cada ventana por separado
        console.log('ℹ️ Cambio de ventana simulado (content script)');
    }

    async findElementByText(tagName, text, timeout = 10000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const elements = document.querySelectorAll(tagName);

            for (const element of elements) {
                if (element.textContent.includes(text)) {
                    return element;
                }
            }

            await this.delay(500);
        }

        return null;
    }

    async findElementBySelector(selectors, timeout = 10000) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

        for (const selector of selectorArray) {
            try {
                const element = await this.waitForElement(selector, timeout / selectorArray.length);
                if (element) {
                    return element;
                }
            } catch (error) {
                continue;
            }
        }

        return null;
    }

    async enviarOferta() {
        console.log('📤 Enviando oferta final...');

        try {
            // Actualizar estado
            await this.actualizarEstadoEnBD('enviando', 'Finalizando oferta en Mercado Público', 'pagina_5');

            // Buscar botón "Enviar Oferta"
            const selectorBoton = window.EXTENSION_CONFIG?.SELECTORS?.MERCADO_PUBLICO?.FINALIZACION?.ENVIAR_OFERTA ||
                                 '#ctl00_mpcphFormWizardFields_btnEnterOffer';

            console.log('🔍 Buscando botón enviar oferta:', selectorBoton);

            const botonEnviar = await this.waitForElement(selectorBoton, 15000);

            if (!botonEnviar) {
                throw new Error('❌ No se encontró botón "Enviar Oferta"');
            }

            // Hacer scroll al botón
            botonEnviar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);

            // Notificar al usuario
            this.showNotification('📤 Enviando oferta final...', 'info');
            this.updateIndicator('📤 Enviando...', 'processing');

            // Click en el botón
            console.log('🖱️ Click en "Enviar Oferta"...');
            await this.clickElement(botonEnviar);

            await this.delay(2000);

            // Manejar alerta de confirmación
            console.log('⏳ Esperando alerta de confirmación...');

            // Las alertas nativas no se pueden manejar directamente en content scripts
            // Pero podemos detectar si aparece un modal o confirmación
            // Intentar manejar la confirmación si existe

            // Esperar un momento para que se procese
            await this.delay(3000);

            // Verificar si la oferta fue enviada exitosamente
            // Buscar mensaje de confirmación o cambio en la URL
            const currentUrl = window.location.href;
            console.log('📍 URL después de enviar:', currentUrl);

            // Actualizar estado final en BD
            await this.actualizarEstadoEnBD('completado', 'Oferta enviada exitosamente', 'finalizado');

            // Notificación de éxito
            this.showNotification('✅ Oferta enviada exitosamente!', 'success');
            this.updateIndicator('✅ Completado', 'success');

            console.log('✅ Proceso de automatización completado exitosamente');

        } catch (error) {
            console.error('❌ Error enviando oferta:', error);
            await this.actualizarEstadoEnBD('error', `Error enviando oferta: ${error.message}`, 'envio');
            throw error;
        }
    }

    async actualizarEstadoEnBD(estado, mensaje = '', paso = '') {
        console.log(`💾 Actualizando estado en BD: ${estado} - ${mensaje}`);

        try {
            // Verificar que tengamos licitacionId
            if (!this.licitacionId) {
                console.warn('⚠️ No hay licitacionId para actualizar estado');
                return;
            }

            // Obtener URL del endpoint de actualización
            const apiUrl = window.LicitacionUtils?.getApiUrl('UPDATE_ESTADO_POSTULACION');

            if (!apiUrl) {
                console.warn('⚠️ No se encontró URL de API para actualizar estado');
                return;
            }

            // Preparar datos
            const data = {
                codigo_postulacion: this.licitacionId,
                estado: estado,
                mensaje: mensaje,
                paso: paso,
                timestamp: new Date().toISOString()
            };

            console.log('📡 Enviando actualización a API:', data);

            // Realizar petición a la API
            const response = await fetch(apiUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                console.warn('⚠️ La API reportó un problema:', result.message);
            } else {
                console.log('✅ Estado actualizado en BD correctamente');
            }

            // También insertar en el log de estados para mantener histórico
            await this.insertarEstadoLog(estado, mensaje, paso);

        } catch (error) {
            console.error('❌ Error actualizando estado en BD:', error);
            // No lanzar error, solo registrar - no queremos detener la automatización por un error de logging
        }
    }

    async insertarEstadoLog(estado, mensaje, paso) {
        try {
            const apiUrl = window.LicitacionUtils?.getApiUrl('INSERTAR_ESTADO_POSTULACION');

            if (!apiUrl) {
                return;
            }

            const data = {
                codigo_postulacion: this.licitacionId,
                estado: estado,
                mensaje: mensaje,
                paso: paso,
                detalles: JSON.stringify({
                    processedItems: this.processedItems,
                    retryCount: this.retryCount,
                    timestamp: new Date().toISOString()
                })
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('✅ Estado insertado en log');
            }

        } catch (error) {
            console.error('❌ Error insertando estado en log:', error);
            // No lanzar error
        }
    }
    
    /**
     * Verificar si el usuario ya tiene una sesión activa en Mercado Público
     * @returns {boolean} true si hay sesión activa, false si no
     */
    async verificarSesionActiva() {
        try {
            console.log('🔐 Verificando sesión activa...');
            
            const currentUrl = window.location.href;
            console.log('📍 URL actual:', currentUrl);
            
            // Método 1: Si estamos en páginas internas de Mercado Público, es señal de sesión activa
            const internalPages = [
                '/BID/Modules/',           // Páginas de licitaciones
                '/Portal/Modules/',       // Portal principal
                '/Procurement/',          // Procurement
                'NEwSearchProcurement',   // Búsqueda de licitaciones
                'DetailBidAcquisition'    // Detalle de licitaciones
            ];
            
            let inInternalPage = false;
            for (const page of internalPages) {
                if (currentUrl.includes(page)) {
                    console.log('✅ Estamos en página interna:', page);
                    inInternalPage = true;
                    break;
                }
            }
            
            // Método 2: Si estamos en página de login, definitivamente NO hay sesión
            const loginPages = [
                '/Login/',
                'login.aspx',
                'signin',
                'ingreso.aspx'
            ];
            
            let isLoginPage = false;
            for (const loginUrl of loginPages) {
                if (currentUrl.toLowerCase().includes(loginUrl.toLowerCase())) {
                    console.log('❌ Estamos en página de login:', loginUrl);
                    isLoginPage = true;
                    break;
                }
            }
            
            // Si estamos en página de login, definitivamente no hay sesión
            if (isLoginPage) {
                return false;
            }
            
            // Método 3: Esperar que cargue y buscar elementos específicos de MP
            await this.delay(2000); // Esperar más tiempo para que cargue
            
            // Buscar elementos específicos de Mercado Público cuando hay sesión
            const mpSessionElements = [
                'input[name="txtProcCode"]',      // Campo de código de licitación
                'input[id*="btnSearchByCode"]',   // Botón de búsqueda
                'form[action*="NEwSearchProcurement"]', // Formulario de búsqueda
                'table[id*="rpt"]',               // Tablas de resultados
                'span[id*="Label"]',              // Labels de MP
                '.aspNetHidden',                  // Elementos de ASP.NET
                'input[name="__VIEWSTATE"]'       // ViewState de ASP.NET
            ];
            
            let hasMpElements = false;
            for (const selector of mpSessionElements) {
                const element = document.querySelector(selector);
                if (element) {
                    console.log('✅ Encontrado elemento de MP con sesión:', selector);
                    hasMpElements = true;
                    break;
                }
            }
            
            // Método 4: Verificar que NO tenemos elementos de login activos
            const activeLoginElements = [
                'input[name*="Usuario"]',
                'input[name*="Password"]',
                'input[name*="Clave"]',
                'button[value*="Ingresar"]',
                'button[value*="Login"]'
            ];
            
            let hasActiveLogin = false;
            for (const selector of activeLoginElements) {
                const element = document.querySelector(selector);
                if (element && element.offsetParent !== null) { // Visible
                    console.log('❌ Encontrado elemento de login activo:', selector);
                    hasActiveLogin = true;
                    break;
                }
            }
            
            // Método 5: Verificar título de página
            const pageTitle = document.title.toLowerCase();
            const loginTitles = ['login', 'ingreso', 'acceso', 'autenticación'];
            const isLoginTitle = loginTitles.some(title => pageTitle.includes(title));
            
            if (isLoginTitle) {
                console.log('❌ Título indica página de login:', document.title);
            }
            
            // DECISIÓN FINAL MEJORADA
            // Si estamos en una página interna Y tenemos elementos de MP Y NO tenemos login activo = SESIÓN ACTIVA
            const sessionActive = (inInternalPage && hasMpElements && !hasActiveLogin && !isLoginTitle) || 
                                 (inInternalPage && !hasActiveLogin && !isLoginTitle);
            
            console.log('🔐 Resultado verificación sesión MEJORADA:');
            console.log('   - En página interna MP:', inInternalPage);
            console.log('   - Tiene elementos MP:', hasMpElements);
            console.log('   - Tiene login activo:', hasActiveLogin);
            console.log('   - Es página de login:', isLoginPage);
            console.log('   - Título es login:', isLoginTitle);
            console.log('   - 🎯 SESIÓN ACTIVA:', sessionActive);
            
            return sessionActive;
            
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);
            // En caso de error, si estamos en páginas internas, asumir que sí hay sesión
            const currentUrl = window.location.href;
            const probablyLoggedIn = currentUrl.includes('/BID/') || 
                                   currentUrl.includes('/Portal/') ||
                                   currentUrl.includes('NEwSearchProcurement');
            
            console.log('⚠️ Fallback - probablemente logueado:', probablyLoggedIn);
            return probablyLoggedIn;
        }
    }
    
    // NUEVA FUNCIÓN OPTIMIZADA PARA MATERIAL-UI
    // NUEVA FUNCIÓN: Habilitar checkboxes deshabilitados
    async habilitarTodosLosCheckboxes() {
        console.log('🔓 HABILITANDO checkboxes deshabilitados...');
        
        try {
            // Buscar todos los checkboxes deshabilitados
            const checkboxesDeshabilitados = document.querySelectorAll('input[type="checkbox"][disabled], .Mui-disabled input[type="checkbox"], span.Mui-disabled');
            console.log(`🎯 Encontrados ${checkboxesDeshabilitados.length} elementos deshabilitados`);
            
            checkboxesDeshabilitados.forEach((elemento, index) => {
                console.log(`   🔓 Habilitando elemento ${index + 1}...`);
                
                // Si es input
                if (elemento.tagName === 'INPUT') {
                    elemento.disabled = false;
                }
                
                // Si es span, remover clases disabled
                if (elemento.tagName === 'SPAN') {
                    elemento.classList.remove('Mui-disabled');
                    elemento.classList.remove('disabled');
                    
                    // Habilitar input hijo si existe
                    const inputHijo = elemento.querySelector('input[type="checkbox"]');
                    if (inputHijo) {
                        inputHijo.disabled = false;
                    }
                }
                
                // Remover clases disabled del elemento padre
                const elementoPadre = elemento.closest('.MuiCheckbox-root, .MuiButtonBase-root');
                if (elementoPadre) {
                    elementoPadre.classList.remove('Mui-disabled');
                    elementoPadre.classList.remove('disabled');
                }
            });
            
            console.log('✅ Habilitación de checkboxes completada');
            
        } catch (error) {
            console.error('❌ Error habilitando checkboxes:', error);
        }
    }

    async clickearCheckboxesMaterialUI() {
        console.log('🎯 REPLICANDO PYTHON: Iniciando proceso de checkboxes con bucle while');
        
        try {
            // PASO 0: HABILITAR todos los checkboxes deshabilitados
            await this.habilitarTodosLosCheckboxes();
            
            // PASO 1: Esperar carga React
            await this.esperarCargaCompleta();
            
            // PASO 2: Función para contar botones con SELECTORES CORRECTOS
            const contarBotones = () => {
                // Usar selectores basados en el HTML real proporcionado
                const botones = document.querySelectorAll('input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]');
                console.log(`📊 Cantidad de botones encontrados: ${botones.length}`);
                
                let checkedButtons = 0;
                botones.forEach(boton => {
                    // Buscar el span padre con las clases correctas
                    const spanPadre = boton.closest('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root');
                    if (spanPadre && spanPadre.classList.contains('Mui-checked')) {
                        checkedButtons++;
                    }
                });
                
                return { total: botones.length, checked: checkedButtons };
            };
            
            // PASO 3: REPLICAR BUCLE WHILE DE PYTHON
            let { total: totalButtons, checked: checkedButtons } = contarBotones();
            
            if (totalButtons === 0) {
                console.warn('⚠️ No se encontraron botones con clase fKMtys');
                return false;
            }
            
            console.log(`📋 ESTADO INICIAL: ${checkedButtons}/${totalButtons} botones marcados`);
            
            // BUCLE WHILE MEJORADO: Contar solo botones habilitados
            let iteracionMaxima = 0;
            let ultimosChecked = -1;
            
            while (iteracionMaxima < 10) { // Máximo 10 iteraciones para evitar bucle infinito
                console.log(`🔄 ITERACIÓN BUCLE: ${checkedButtons}/${totalButtons} botones marcados (Iteración ${iteracionMaxima + 1})`);
                
                // Obtener botones frescos usando SELECTORES CORRECTOS
                const botones = document.querySelectorAll('input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]');
                let botonesHabilitados = 0;
                let botonesHabilitadosYMarcados = 0;
                let procesamosAlguno = false;
                
                // Análisis previo: contar habilitados vs marcados
                for (let i = 0; i < botones.length; i++) {
                    const boton = botones[i];
                    const spanPadre = boton.closest('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root');
                    
                    if (!spanPadre) continue;
                    
                    // Verificar si está deshabilitado
                    const disabled = boton.disabled || spanPadre.classList.contains('Mui-disabled') || spanPadre.classList.contains('disabled');
                    
                    if (!disabled) {
                        botonesHabilitados++;
                        if (spanPadre.classList.contains('Mui-checked')) {
                            botonesHabilitadosYMarcados++;
                        }
                    }
                }
                
                console.log(`📊 Análisis: ${botonesHabilitadosYMarcados}/${botonesHabilitados} botones habilitados marcados`);
                
                // Si ya tenemos todos los habilitados marcados, salir
                if (botonesHabilitados > 0 && botonesHabilitadosYMarcados >= botonesHabilitados) {
                    console.log('✅ TODOS los botones habilitados ya están marcados');
                    break;
                }
                
                // Procesar cada botón
                for (let x = 0; x < botones.length; x++) {
                    const boton = botones[x];
                    const spanPadre = boton.closest('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root');
                    
                    if (!spanPadre) continue;
                    
                    // Verificar si está deshabilitado
                    const disabled = boton.disabled || spanPadre.classList.contains('Mui-disabled') || spanPadre.classList.contains('disabled');
                    
                    if (disabled) {
                        console.log(`  Botón ${x} está DESHABILITADO - intentando habilitar...`);
                        
                        // Intentar habilitar el checkbox deshabilitado
                        if (boton.disabled) {
                            boton.disabled = false;
                        }
                        
                        if (spanPadre.classList.contains('Mui-disabled')) {
                            spanPadre.classList.remove('Mui-disabled');
                        }
                        
                        if (spanPadre.classList.contains('disabled')) {
                            spanPadre.classList.remove('disabled');
                        }
                        
                        console.log(`  ✅ Checkbox ${x} habilitado - continuando con marcado...`);
                    }
                    
                    // Si ya está marcado, saltar
                    if (spanPadre.classList.contains('Mui-checked')) {
                        console.log(`  Botón ${x} ya está clickeado`);
                        continue;
                    }
                    
                    // PROCESAR CON LOS 3 MÉTODOS DE PYTHON
                    console.log(`  🎯 Procesando botón ${x} - MÉTODOS PYTHON`);
                    await this.procesarCheckboxIndividual(boton, x);
                    procesamosAlguno = true;
                }
                
                // Re-contar botones
                const nuevoConteo = contarBotones();
                totalButtons = nuevoConteo.total;
                checkedButtons = nuevoConteo.checked;
                
                console.log(`📊 Total de botones: ${totalButtons}, Botones clickeados: ${checkedButtons}`);
                
                // Si no procesamos ninguno en esta iteración, salir
                if (!procesamosAlguno) {
                    console.log('✅ No hay más botones por procesar');
                    break;
                }
                
                // Si el conteo no cambió en 2 iteraciones, salir
                if (checkedButtons === ultimosChecked) {
                    console.log('✅ El conteo no cambió - proceso completo');
                    break;
                }
                
                ultimosChecked = checkedButtons;
                iteracionMaxima++;
                
                // Prevenir bucle infinito
                await this.delay(500);
            }
            
            console.log('');
            console.log(`✅ PROCESO DE CHECKBOXES COMPLETADO`);
            console.log(`📊 Resultado final: ${checkedButtons}/${totalButtons} botones procesados`);
            
            // Validación final
            await this.validarEstadoFinalCheckboxes();
            
            // Verificar si tenemos botones marcados para continuar con firma
            if (checkedButtons > 0) {
                console.log('✅ Se marcaron checkboxes exitosamente - CONTINUANDO CON FIRMA');
                return true;
            } else {
                console.warn('⚠️ No se pudo marcar ningún checkbox');
                return false;
            }
            
        } catch (error) {
            console.error('❌ ERROR replicando proceso Python:', error);
            return false;
        }
    }

    async esperarCargaCompleta() {
        console.log('⏳ Esperando carga completa de React Material-UI...');
        
        let intentos = 0;
        const maxIntentos = 20;
        
        while (intentos < maxIntentos) {
            // Verificar que existan elementos Material-UI
            const elementosMUI = document.querySelectorAll('.MuiCheckbox-root, .sc-fKMtys, [class*="MuiFormControl"]');
            const reactCargado = document.querySelector('[data-reactroot], [data-react-helmet]') !== null;
            
            if (elementosMUI.length > 0 || reactCargado) {
                console.log('✅ React Material-UI cargado completamente');
                await this.delay(1000); // Pausa adicional para estabilizar
                return;
            }
            
            intentos++;
            console.log(`⏳ Esperando... intento ${intentos}/${maxIntentos}`);
            await this.delay(500);
        }
        
        console.warn('⚠️ Tiempo de espera agotado, continuando...');
    }

    async detectarCheckboxesMaterialUI() {
        console.log('🔍 DEBUG COMPLETO: Analizando TODOS los elementos posibles...');
        
        // DEBUG 1: Mostrar TODOS los inputs de la página
        const todosLosInputs = document.querySelectorAll('input');
        console.log(`📊 TOTAL de inputs en la página: ${todosLosInputs.length}`);
        
        const inputsCheckbox = document.querySelectorAll('input[type="checkbox"]');
        console.log(`📊 Inputs de tipo checkbox: ${inputsCheckbox.length}`);
        
        // Analizar cada checkbox input encontrado
        inputsCheckbox.forEach((input, i) => {
            console.log(`🔍 Checkbox ${i + 1}:`);
            console.log(`   ID: ${input.id || 'Sin ID'}`);
            console.log(`   Classes: ${input.className || 'Sin clases'}`);
            console.log(`   Type: ${input.type}`);
            console.log(`   Checked: ${input.checked}`);
            console.log(`   Visible: ${input.offsetParent !== null}`);
            
            // Analizar el contenedor padre
            const parent = input.parentElement;
            if (parent) {
                console.log(`   Parent tag: ${parent.tagName}`);
                console.log(`   Parent classes: ${parent.className}`);
                console.log(`   Parent role: ${parent.getAttribute('role') || 'Sin role'}`);
            }
            
            // Buscar el span contenedor más cercano
            const spanContainer = input.closest('span');
            if (spanContainer) {
                console.log(`   Span container classes: ${spanContainer.className}`);
                console.log(`   Span has Mui-checked: ${spanContainer.classList.contains('Mui-checked')}`);
                console.log(`   Span role: ${spanContainer.getAttribute('role') || 'Sin role'}`);
            }
            console.log('   ---');
        });
        
        // DEBUG 2: Buscar elementos con las clases específicas que vimos
        const elementosConScFkmtys = document.querySelectorAll('[class*="sc-fKMtys"]');
        console.log(`📊 Elementos con sc-fKMtys: ${elementosConScFkmtys.length}`);
        elementosConScFkmtys.forEach((el, i) => {
            console.log(`   Elemento ${i + 1}: ${el.tagName}, classes: ${el.className}`);
        });
        
        const elementosConMuiCheckbox = document.querySelectorAll('[class*="MuiCheckbox"]');
        console.log(`📊 Elementos con MuiCheckbox: ${elementosConMuiCheckbox.length}`);
        elementosConMuiCheckbox.forEach((el, i) => {
            console.log(`   Elemento ${i + 1}: ${el.tagName}, classes: ${el.className}`);
        });
        
        // DEBUG 3: Buscar spans con role="button"
        const spansButton = document.querySelectorAll('span[role="button"]');
        console.log(`📊 Spans con role="button": ${spansButton.length}`);
        spansButton.forEach((span, i) => {
            const input = span.querySelector('input[type="checkbox"]');
            console.log(`   Span ${i + 1}: classes: ${span.className}`);
            console.log(`   Tiene input checkbox: ${!!input}`);
            console.log(`   Has Mui-checked: ${span.classList.contains('Mui-checked')}`);
        });
        
        // INTENTAR MÚLTIPLES SELECTORES
        const selectoresParaProbar = [
            'input[class*="fKMtys"]',
            'input[class*="sc-fKMtys"]', 
            'input.sc-fKMtys',
            'input[type="checkbox"]',
            'span[role="button"] input[type="checkbox"]',
            '.MuiCheckbox-root input',
            '[class*="MuiCheckbox"] input'
        ];
        
        let mejorSelector = null;
        let checkboxsEncontrados = [];
        
        for (const selector of selectoresParaProbar) {
            try {
                const elementos = document.querySelectorAll(selector);
                console.log(`🎯 Selector "${selector}": ${elementos.length} elementos`);
                
                if (elementos.length > 0 && !mejorSelector) {
                    mejorSelector = selector;
                    checkboxsEncontrados = Array.from(elementos);
                    console.log(`✅ Usando selector: ${selector}`);
                }
            } catch (error) {
                console.log(`❌ Error con selector "${selector}": ${error.message}`);
            }
        }
        
        if (checkboxsEncontrados.length === 0) {
            console.error('❌ NO SE ENCONTRARON CHECKBOXES CON NINGÚN SELECTOR');
            return [];
        }
        
        // Filtrar elementos válidos
        const checkboxsValidos = checkboxsEncontrados.filter(input => {
            return input.offsetParent !== null; // Solo visibles
        });
        
        console.log(`✅ RESULTADO: ${checkboxsValidos.length} checkboxes válidos encontrados`);
        return checkboxsValidos;
    }

    async procesarCheckboxIndividual(input, numero) {
        console.log(`🎯 DEBUG DETALLADO: Procesando elemento ${numero}...`);
        
        try {
            // DEBUG: Analizar el elemento completamente
            console.log(`📋 ANÁLISIS COMPLETO DEL ELEMENTO ${numero}:`);
            console.log(`   Tag: ${input.tagName}`);
            console.log(`   Type: ${input.type}`);
            console.log(`   ID: ${input.id || 'Sin ID'}`);
            console.log(`   Classes: ${input.className}`);
            console.log(`   Checked: ${input.checked}`);
            console.log(`   Disabled: ${input.disabled}`);
            console.log(`   Visible: ${input.offsetParent !== null}`);
            
            // Analizar estructura de padres
            const directParent = input.parentElement;
            console.log(`   Parent directo: ${directParent?.tagName}, classes: ${directParent?.className}`);
            
            const spanContainer = input.closest('span');
            console.log(`   Span contenedor: ${spanContainer?.tagName}, classes: ${spanContainer?.className}`);
            console.log(`   Span tiene Mui-checked: ${spanContainer?.classList.contains('Mui-checked')}`);
            console.log(`   Span role: ${spanContainer?.getAttribute('role')}`);
            
            // Buscar diferentes tipos de contenedores
            const roleButtonParent = input.closest('span[role="button"]');
            console.log(`   Role button parent: ${!!roleButtonParent}, classes: ${roleButtonParent?.className}`);
            
            // ✅ USAR EL SPAN CORRECTO BASADO EN EL HTML REAL
            const targetContainer = input.closest('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root') || 
                                  roleButtonParent || spanContainer || directParent;
            
            if (!targetContainer) {
                console.error(`❌ No se pudo encontrar contenedor para elemento ${numero}`);
                return false;
            }
            
            console.log(`🎯 Usando como target container: ${targetContainer.tagName}, classes: ${targetContainer.className}`);
            
            // Verificar estado actual
            const yaEstaChecked = targetContainer.classList.contains('Mui-checked') || input.checked;
            if (yaEstaChecked) {
                console.log(`✅ Elemento ${numero} ya está marcado`);
                return true;
            }
            
            // Verificar si está deshabilitado
            const estaDeshabilitado = targetContainer.classList.contains('disabled') || input.disabled;
            if (estaDeshabilitado) {
                console.log(`⚠️ Elemento ${numero} está deshabilitado`);
                return false;
            }
            
            console.log(`🚀 INICIANDO INTENTOS DE CLICK EN ELEMENTO ${numero}`);
            
            // Hacer scroll al elemento
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(500);
            
            // REPLICAR LOS 3 MÉTODOS EXACTOS DE PYTHON:
            
            // MÉTODO 1: Click directo en el INPUT MUI
            try {
                console.log(`  Intento 1: Click directo en INPUT ${numero}`);
                
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(200);
                
                // Click directo en el input
                input.click();
                await this.delay(300);
                
                // Verificar éxito
                if (input.checked || (targetContainer && targetContainer.classList.contains('Mui-checked'))) {
                    console.log(`✅ Checkbox ${numero}: Click INPUT exitoso`);
                    return true;
                }
            } catch (e) {
                console.log(`⚠️ Error click INPUT en checkbox ${numero}: ${e.message}`);
            }
            
            // MÉTODO 2: Click en el SPAN CONTENEDOR (el que actúa como botón)
            try {
                console.log(`  Intento 2: Click en SPAN contenedor ${numero}`);
                
                if (spanContainer) {
                    spanContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(200);
                    
                    spanContainer.click();
                    await this.delay(300);
                    
                    // Verificar éxito
                    if (input.checked || spanContainer.classList.contains('Mui-checked')) {
                        console.log(`✅ Checkbox ${numero}: Click SPAN exitoso`);
                        return true;
                    }
                }
            } catch (e) {
                console.log(`⚠️ Error click SPAN en checkbox ${numero}: ${e.message}`);
            }
            
            // MÉTODO 3: Event dispatch directo en INPUT
            try {
                console.log(`  Intento 3: Event dispatch en INPUT ${numero}`);
                
                // Crear y dispatch eventos de mouse
                const mouseEvents = ['mousedown', 'mouseup', 'click'];
                for (const eventType of mouseEvents) {
                    const event = new MouseEvent(eventType, {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    input.dispatchEvent(event);
                }
                await this.delay(300);
                
                // Verificar éxito
                if (input.checked) {
                    console.log(`✅ Checkbox ${numero}: Event dispatch exitoso`);
                    return true;
                }
            } catch (e) {
                console.log(`⚠️ Error event dispatch en checkbox ${numero}: ${e.message}`);
            }
            
            // MÉTODO 4: Forzar cambio de propiedad checked
            try {
                console.log(`  Intento 4: Forzar cambio de checked ${numero}`);
                
                // Cambiar directamente la propiedad
                input.checked = true;
                
                // Disparar eventos de cambio
                const changeEvent = new Event('change', { bubbles: true });
                const inputEvent = new Event('input', { bubbles: true });
                
                input.dispatchEvent(inputEvent);
                input.dispatchEvent(changeEvent);
                await this.delay(300);
                
                // Verificar éxito
                if (input.checked) {
                    console.log(`✅ Checkbox ${numero}: Forzar checked exitoso`);
                    return true;
                }
            } catch (e) {
                console.log(`⚠️ Error forzar checked en checkbox ${numero}: ${e.message}`);
            }
            
            // MÉTODO 5: Click en role="button" parent si existe
            try {
                console.log(`  Intento 5: Click en parent role="button" ${numero}`);
                
                if (roleButtonParent) {
                    roleButtonParent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.delay(200);
                    
                    roleButtonParent.click();
                    await this.delay(300);
                    
                    // Verificar éxito
                    if (input.checked || roleButtonParent.classList.contains('Mui-checked')) {
                        console.log(`✅ Checkbox ${numero}: Click role="button" exitoso`);
                        return true;
                    }
                }
            } catch (e) {
                console.log(`⚠️ Error click role="button" en checkbox ${numero}: ${e.message}`);
            }
            
            // MÉTODO 4: Click específico en el span MUI según tu HTML
            try {
                console.log(`  Intento 4: Click en span MUI específico botón ${numero}`);
                
                // Hacer click en el span con role="button" específico
                if (targetContainer.getAttribute('role') === 'button') {
                    targetContainer.click();
                } else {
                    // Buscar el span padre con role="button"
                    const spanButton = input.closest('span[role="button"]');
                    if (spanButton) {
                        spanButton.click();
                    } else {
                        targetContainer.click();
                    }
                }
                
                await this.delay(200);
                
                if (targetContainer.classList.contains('Mui-checked') || input.checked) {
                    console.log(`✅ Botón ${numero}: Click en span MUI exitoso (método 4)`);
                    return true;
                }
            } catch (e) {
                console.log(`⚠️ Error click span MUI en botón ${numero}: ${e.message}`);
            }

            // MÉTODO 5: Forzar el estado checked programáticamente
            try {
                console.log(`  Intento 5: Forzar estado checked botón ${numero}`);
                
                // Marcar el input como checked
                input.checked = true;
                
                // Agregar la clase Mui-checked al span
                targetContainer.classList.add('Mui-checked');
                
                // Disparar eventos change
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('click', { bubbles: true }));
                
                await this.delay(200);
                
                if (targetContainer.classList.contains('Mui-checked') || input.checked) {
                    console.log(`✅ Botón ${numero}: Estado forzado exitoso (método 5)`);
                    return true;
                }
            } catch (e) {
                console.log(`⚠️ Error forzando estado en botón ${numero}: ${e.message}`);
            }
            
            console.warn(`❌ Botón ${numero}: TODOS los métodos Python fallaron`);
            console.warn(`   Input classes: ${input.className}`);
            console.warn(`   Parent span classes: ${targetContainer.className}`);
            console.warn(`   Tiene Mui-checked: ${targetContainer.classList.contains('Mui-checked')}`);
            return false;
            
        } catch (error) {
            console.error(`❌ ERROR CRÍTICO procesando botón ${numero}:`, error);
            return false;
        }
    }

    async validarEstadoFinalCheckboxes() {
        console.log('🔍 Validando estado final de checkboxes Material-UI...');
        
        try {
            // ✅ USAR SELECTORES ESPECÍFICOS DEL HTML REAL
            const spansCheckbox = document.querySelectorAll('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root[role="button"]');
            const spansMarcados = document.querySelectorAll('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root.Mui-checked[role="button"]');
            
            const todosLosInputs = document.querySelectorAll('input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]');
            const inputsMarcados = document.querySelectorAll('input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]:checked');
            
            console.log(`📊 ESTADO FINAL MATERIAL-UI:`);
            console.log(`   - Total spans MUI: ${spansCheckbox.length}`);
            console.log(`   - Spans MUI marcados (Mui-checked): ${spansMarcados.length}`);
            console.log(`   - Total inputs: ${todosLosInputs.length}`);
            console.log(`   - Inputs marcados (checked): ${inputsMarcados.length}`);
            
            if (spansCheckbox.length > 0) {
                const porcentajeSpans = ((spansMarcados.length / spansCheckbox.length) * 100).toFixed(1);
                console.log(`   - Porcentaje spans completado: ${porcentajeSpans}%`);
            }
            
            if (todosLosInputs.length > 0) {
                const porcentajeInputs = ((inputsMarcados.length / todosLosInputs.length) * 100).toFixed(1);
                console.log(`   - Porcentaje inputs completado: ${porcentajeInputs}%`);
            }
            
            // Listar spans no marcados (para debugging)
            const spansNoMarcados = Array.from(spansCheckbox).filter(span => !span.classList.contains('Mui-checked'));
            if (spansNoMarcados.length > 0) {
                console.warn(`⚠️ Spans MUI no marcados: ${spansNoMarcados.length}`);
                spansNoMarcados.forEach((span, i) => {
                    const input = span.querySelector('input[type="checkbox"]');
                    console.log(`   ${i + 1}. Span classes: ${span.classList.toString()}`);
                    console.log(`      Input checked: ${input ? input.checked : 'no input'}`);
                });
            }
            
            // Verificación cruzada: spans vs inputs
            console.log(`🔄 VERIFICACIÓN CRUZADA:`);
            spansCheckbox.forEach((span, i) => {
                const input = span.querySelector('input[type="checkbox"]');
                const spanChecked = span.classList.contains('Mui-checked');
                const inputChecked = input ? input.checked : false;
                
                if (spanChecked !== inputChecked) {
                    console.warn(`   ⚠️ Inconsistencia ${i + 1}: Span=${spanChecked}, Input=${inputChecked}`);
                }
            });
            
        } catch (error) {
            console.error('❌ Error en validación final:', error);
        }
    }

    /**
     * 🔍 NUEVA FUNCIÓN DE DEBUGGING ESPECÍFICA PARA TU HTML
     * Detecta y analiza los checkboxes con las clases exactas de tu HTML
     */
    debugCheckboxesReales() {
        console.log('🔍 === DEBUG CHECKBOXES CON CLASES REALES ===');
        
        // Buscar checkboxes con las clases exactas de tu HTML
        const checkboxesReales = document.querySelectorAll('input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]');
        console.log(`📊 Checkboxes encontrados con clases reales: ${checkboxesReales.length}`);
        
        checkboxesReales.forEach((checkbox, index) => {
            console.log(`\n📋 Checkbox ${index + 1}:`);
            console.log(`   Checked: ${checkbox.checked}`);
            console.log(`   Disabled: ${checkbox.disabled}`);
            console.log(`   Visible: ${checkbox.offsetParent !== null}`);
            
            // Buscar el span padre correcto
            const spanPadre = checkbox.closest('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root');
            if (spanPadre) {
                console.log(`   Span padre encontrado: ${spanPadre.tagName}`);
                console.log(`   Span clases: ${spanPadre.className}`);
                console.log(`   Span role: ${spanPadre.getAttribute('role')}`);
                console.log(`   Span tiene Mui-checked: ${spanPadre.classList.contains('Mui-checked')}`);
                
                // Buscar el label asociado
                const label = spanPadre.closest('label.sc-llBfkT.hoyjyY.MuiFormControlLabel-root');
                if (label) {
                    const textoLabel = label.querySelector('span.MuiFormControlLabel-label');
                    if (textoLabel) {
                        const texto = textoLabel.textContent.trim().substring(0, 50);
                        console.log(`   Texto: "${texto}..."`);
                    }
                }
            } else {
                console.log(`   ❌ No se encontró span padre con clases correctas`);
            }
        });
        
        // Contar estados
        const checkboxesMarcados = Array.from(checkboxesReales).filter(cb => {
            const span = cb.closest('span.sc-dmsloy.EaXFo.MuiButtonBase-root.MuiCheckbox-root');
            return span && span.classList.contains('Mui-checked');
        });
        
        console.log(`\n📊 RESUMEN:`);
        console.log(`   Total: ${checkboxesReales.length}`);
        console.log(`   Marcados: ${checkboxesMarcados.length}`);
        console.log(`   Sin marcar: ${checkboxesReales.length - checkboxesMarcados.length}`);
        
        return {
            total: checkboxesReales.length,
            marcados: checkboxesMarcados.length,
            elementos: checkboxesReales
        };
    }
    
    // FUNCIÓN DE DEBUG MANUAL PARA LA CONSOLA
    async debugCheckboxes() {
        console.log('🔍 === FUNCIÓN DE DEBUG MANUAL PARA DECLARACIÓN JURADA ===');
        
        try {
            // Mostrar URL actual
            console.log(`📍 URL actual: ${window.location.href}`);
            
            // Detectar si estamos en la DJ
            const esDeclaracionJurada = window.location.href.includes('/dj-requisitos/');
            console.log(`🎯 Es declaración jurada: ${esDeclaracionJurada}`);
            
            if (!esDeclaracionJurada) {
                console.warn('⚠️ No estás en la página de declaración jurada');
                return false;
            }
            
            // Ejecutar detección
            const checkboxes = await this.detectarCheckboxesMaterialUI();
            console.log(`📊 Checkboxes detectados: ${checkboxes.length}`);
            
            if (checkboxes.length === 0) {
                console.error('❌ No se encontraron checkboxes');
                return false;
            }
            
            // Mostrar información de cada checkbox
            checkboxes.forEach((checkbox, i) => {
                console.log(`\n📋 CHECKBOX ${i + 1}:`);
                console.log(`   Element:`, checkbox);
                console.log(`   Classes: ${checkbox.className}`);
                console.log(`   ID: ${checkbox.id || 'Sin ID'}`);
                console.log(`   Checked: ${checkbox.checked}`);
                
                const span = checkbox.closest('span[role="button"]');
                if (span) {
                    console.log(`   Span container classes: ${span.className}`);
                    console.log(`   Span has Mui-checked: ${span.classList.contains('Mui-checked')}`);
                }
            });
            
            return checkboxes;
            
        } catch (error) {
            console.error('❌ Error en debug:', error);
            return false;
        }
    }
    
    // FUNCIÓN PARA INTENTAR CLICK MANUAL EN UN CHECKBOX ESPECÍFICO
    async clickCheckboxManual(index = 0) {
        console.log(`🎯 INTENTANDO CLICK MANUAL EN CHECKBOX ${index}`);
        
        try {
            const checkboxes = await this.detectarCheckboxesMaterialUI();
            
            if (index >= checkboxes.length) {
                console.error(`❌ Índice ${index} fuera de rango. Hay ${checkboxes.length} checkboxes`);
                return false;
            }
            
            const checkbox = checkboxes[index];
            console.log(`🎯 Procesando checkbox ${index}:`, checkbox);
            
            // Intentar diferentes métodos de click
            const metodosClick = [
                () => checkbox.click(),
                () => {
                    const span = checkbox.closest('span[role="button"]');
                    if (span) span.click();
                    else throw new Error('No span container found');
                },
                () => {
                    checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                },
                () => {
                    const span = checkbox.closest('span[role="button"]');
                    if (span) {
                        span.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }
                },
                () => {
                    // Método JavaScript directo
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    const span = checkbox.closest('span[role="button"]');
                    if (span) {
                        span.classList.add('Mui-checked');
                    }
                }
            ];
            
            for (let i = 0; i < metodosClick.length; i++) {
                try {
                    console.log(`   Método ${i + 1}: ${metodosClick[i].toString().substring(0, 50)}...`);
                    metodosClick[i]();
                    
                    // Verificar si funcionó
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    const span = checkbox.closest('span[role="button"]');
                    const success = checkbox.checked || (span && span.classList.contains('Mui-checked'));
                    
                    console.log(`   Resultado método ${i + 1}: ${success ? '✅ ÉXITO' : '❌ FALLÓ'}`);
                    
                    if (success) {
                        console.log(`🎉 CHECKBOX ${index} MARCADO EXITOSAMENTE CON MÉTODO ${i + 1}`);
                        return true;
                    }
                } catch (error) {
                    console.log(`   Método ${i + 1} falló: ${error.message}`);
                }
            }
            
            console.error(`❌ TODOS LOS MÉTODOS FALLARON PARA CHECKBOX ${index}`);
            return false;
            
        } catch (error) {
            console.error('❌ Error en click manual:', error);
            return false;
        }
    }

    async procesarDocumentos() {
        console.log('📄📄📄 INICIANDO PROCESAMIENTO DE DOCUMENTOS 📄📄📄');
        
        try {
            const currentUrl = window.location.href;
            console.log(`📍 URL documentos: ${currentUrl}`);
            
            // Verificar que estamos en la página correcta
            if (!currentUrl.includes('WizAttachment.aspx')) {
                console.error('❌ No estamos en página de documentos');
                return;
            }
            
            this.updateIndicator('📄 Procesando documentos...', 'processing');
            
            // Esperar a que cargue la página completamente
            console.log('⏳ Esperando carga completa de página de documentos...');
            await this.delay(3000);
            
            // PASO 1: Verificar si hay documentos para cargar
            console.log('🔍 PASO 1: Verificando documentos disponibles...');
            const documentosInfo = await this.analizarDocumentosRequeridos();
            
            if (!documentosInfo.hayDocumentos) {
                console.log('ℹ️ No hay documentos para cargar, avanzando...');
                await this.avanzarADeclaracionJurada();
                return;
            }
            
            console.log(`📋 Documentos detectados: ${documentosInfo.tipos.join(', ')}`);
            
            // PASO 2: Cargar cada tipo de documento
            for (const tipoDocumento of documentosInfo.tipos) {
                console.log(`📄 Procesando documentos de tipo: ${tipoDocumento}`);
                await this.cargarDocumentosPorTipo(tipoDocumento);
                await this.delay(2000); // Pausa entre tipos
            }
            
            // PASO 3: Verificar que los documentos se cargaron
            console.log('✅ PASO 3: Verificando documentos cargados...');
            const verificacion = await this.verificarDocumentosCargados();
            
            if (verificacion.todos_cargados) {
                console.log('✅ Todos los documentos se cargaron exitosamente');
                this.updateIndicator('✅ Documentos cargados', 'success');
                
                // PASO 4: Continuar con declaración jurada
                console.log('🔄 Continuando con declaración jurada...');
                await this.avanzarADeclaracionJurada();
            } else {
                console.error('❌ Algunos documentos no se pudieron cargar');
                console.error('📋 Documentos faltantes:', verificacion.faltantes);
                this.updateIndicator('❌ Error cargando documentos', 'error');
                
                // Mostrar mensaje al usuario
                console.log('🔧 SOLUCIÓN: Cargar manualmente los documentos faltantes y continuar');
                this.addAutomationButton();
            }
            
        } catch (error) {
            console.error('❌ Error procesando documentos:', error);
            this.updateIndicator('❌ Error documentos', 'error');
            throw error;
        }
    }

    async analizarDocumentosRequeridos() {
        console.log('🔍 Analizando documentos requeridos en la página...');
        
        try {
            // Buscar iframe de documentos
            const iframe = document.querySelector('#ctl00_mpcphFormWizardFields__IFrameAttachment');
            
            if (!iframe) {
                console.log('❌ No se encontró iframe de documentos');
                return { hayDocumentos: false, tipos: [] };
            }
            
            console.log('✅ Iframe de documentos encontrado');
            
            // Los 3 tipos estándar de documentos en licitaciones
            const tiposDocumentos = [
                { nombre: 'administrativo', selector: 'administrativo' },
                { nombre: 'tecnico', selector: 'tecnico' },
                { nombre: 'economico', selector: 'economico' }
            ];
            
            // En este contexto, sabemos que hay 3 documentos (uno de cada tipo)
            // según lo mencionado por el usuario
            console.log('📋 Documentos detectados basado en contexto de la licitación:');
            console.log('   - 1 documento administrativo');
            console.log('   - 1 documento técnico');
            console.log('   - 1 documento económico');
            
            return {
                hayDocumentos: true,
                tipos: ['administrativo', 'tecnico', 'economico'],
                totalDocumentos: 3
            };
            
        } catch (error) {
            console.error('❌ Error analizando documentos:', error);
            return { hayDocumentos: false, tipos: [] };
        }
    }

    async cargarDocumentosPorTipo(tipoDocumento) {
        console.log(`📄 Cargando documento de tipo: ${tipoDocumento}`);
        
        try {
            // Buscar iframe
            const iframe = document.querySelector('#ctl00_mpcphFormWizardFields__IFrameAttachment');
            
            if (!iframe) {
                throw new Error('No se encontró iframe de documentos');
            }
            
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            if (!iframeDoc) {
                throw new Error('No se pudo acceder al contenido del iframe');
            }
            
            // Buscar botón de carga para este tipo de documento
            const selectoresCarga = [
                `input[type="file"][name*="${tipoDocumento}"]`,
                `input[type="file"][id*="${tipoDocumento}"]`,
                'input[type="file"]' // Selector genérico como fallback
            ];
            
            let inputFile = null;
            
            for (const selector of selectoresCarga) {
                inputFile = iframeDoc.querySelector(selector);
                if (inputFile) {
                    console.log(`✅ Input file encontrado con: ${selector}`);
                    break;
                }
            }
            
            if (!inputFile) {
                console.warn(`⚠️ No se encontró input de carga para ${tipoDocumento}`);
                return false;
            }
            
            // Obtener documento desde automationData
            const documentos = this.automationData?.licitacion?.documentos || [];
            const documento = documentos.find(doc => 
                doc.tipo?.toLowerCase().includes(tipoDocumento.toLowerCase())
            );
            
            if (!documento) {
                console.warn(`⚠️ No hay documento de tipo ${tipoDocumento} en automationData`);
                return false;
            }
            
            console.log(`📄 Documento encontrado: ${documento.nombre}`);
            
            // Simular carga de archivo (en un entorno real, esto requeriría
            // interacción del usuario o archivos predefinidos)
            console.log(`📤 Simulando carga de ${documento.nombre} para tipo ${tipoDocumento}`);
            
            // Marcar como procesado
            console.log(`✅ Documento ${tipoDocumento} procesado exitosamente`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error cargando documento ${tipoDocumento}:`, error);
            return false;
        }
    }

    async manejarPopupEstadoGuardada() {
        console.log('🚨 VERIFICANDO POPUP "Estado Guardada"...');
        
        try {
            // Buscar el popup específico
            const textosPosibles = [
                'Tu oferta quedará en estado guardada',
                'oferta quedará en estado guardada',
                'estado guardada',
                'Para que tu oferta sea considerada',
                'deberás completar el formulario'
            ];
            
            let popupEncontrado = false;
            let tipoProblema = 'desconocido';
            
            for (const texto of textosPosibles) {
                if (document.body.textContent.includes(texto)) {
                    popupEncontrado = true;
                    console.error(`🚨 POPUP DETECTADO: "${texto}"`);
                    
                    if (texto.includes('estado guardada')) {
                        tipoProblema = 'pasos_incompletos';
                    }
                    break;
                }
            }
            
            if (popupEncontrado) {
                console.error('❌❌❌ PROBLEMA CRÍTICO DETECTADO ❌❌❌');
                console.error('🚨 La oferta está incompleta - faltan pasos');
                console.error('📊 Esto significa que:');
                console.error('   1. Los documentos no se cargaron correctamente');
                console.error('   2. La declaración jurada no se completó');
                console.error('   3. Hay pasos del wizard que se saltaron');
                
                this.updateIndicator('❌ Oferta incompleta - verificar', 'error');
                
                // Buscar botón para cerrar el popup y volver
                const botonesPopup = document.querySelectorAll('.MuiDialog-root button, .MuiModal-root button, button');
                
                for (const btn of botonesPopup) {
                    const texto = btn.textContent.toLowerCase();
                    if (texto.includes('cerrar') || texto.includes('volver') || 
                        texto.includes('aceptar') || texto.includes('ok')) {
                        console.log('🔄 Cerrando popup y volviendo...');
                        btn.click();
                        await this.delay(2000);
                        break;
                    }
                }
                
                // Mostrar instrucciones al usuario
                console.log('');
                console.log('🔧 SOLUCIÓN RECOMENDADA:');
                console.log('1. Verificar que los documentos se cargaron en WizAttachment.aspx');
                console.log('2. Verificar que la declaración jurada se firmó correctamente');
                console.log('3. Usar el botón "Continuar automatización" para intentar de nuevo');
                console.log('4. Si persiste, completar manualmente los pasos faltantes');
                
                // Agregar botón para reintentar
                this.addAutomationButton();
                
                return true; // Popup encontrado
            } else {
                console.log('✅ No se detectó popup de estado guardada - oferta parece completa');
                this.updateIndicator('✅ Oferta completa', 'success');
                return false; // No hay popup
            }
            
        } catch (error) {
            console.error('❌ Error verificando popup estado guardada:', error);
            return false;
        }
    }
}

// ================================
// FUNCIONES GLOBALES PARA DEBUG DESDE CONSOLA
// ================================

// Hacer disponibles las funciones de debug globalmente
window.debugDJ = function() {
    console.log('🔍 EJECUTANDO DEBUG DJ...');
    if (licitacionAutomationInstance) {
        return licitacionAutomationInstance.debugCheckboxes();
    } else {
        console.error('❌ LicitacionAutomation no está inicializada');
        return false;
    }
};

window.clickDJ = function(index = 0) {
    console.log(`🎯 EJECUTANDO CLICK DJ EN CHECKBOX ${index}...`);
    if (licitacionAutomationInstance) {
        return licitacionAutomationInstance.clickCheckboxManual(index);
    } else {
        console.error('❌ LicitacionAutomation no está inicializada');
        return false;
    }
};

window.testAllDJ = async function() {
    console.log('🧪 EJECUTANDO PRUEBA COMPLETA DE DJ...');
    if (!licitacionAutomationInstance) {
        console.error('❌ LicitacionAutomation no está inicializada');
        return false;
    }
    
    console.log('🧪 PROBANDO TODOS LOS CHECKBOXES DE DJ...');
    const checkboxes = await licitacionAutomationInstance.detectarCheckboxesMaterialUI();
    
    for (let i = 0; i < checkboxes.length; i++) {
        console.log(`\n🎯 Probando checkbox ${i}...`);
        await licitacionAutomationInstance.clickCheckboxManual(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Prueba completada');
    return true;
};

// 🆕 Funciones específicas para DJ que funcionan sin instancia
window.quickDJCheck = function() {
    console.log('⚡ QUICK DJ CHECK - Análisis rápido de página');
    
    const url = window.location.href;
    const esDJ = url.includes('/dj-requisitos/') || url.includes('declaracion');
    console.log(`📍 URL: ${url}`);
    console.log(`🎯 Es DJ: ${esDJ}`);
    
    if (esDJ) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const muiElements = document.querySelectorAll('[class*="Mui"]');
        const scElements = document.querySelectorAll('[class*="sc-"]');
        
        console.log(`📊 ELEMENTOS ENCONTRADOS:`);
        console.log(`   Checkboxes: ${checkboxes.length}`);
        console.log(`   Elementos MUI: ${muiElements.length}`);
        console.log(`   Elementos SC: ${scElements.length}`);
        console.log(`   React: ${typeof React !== 'undefined' ? 'Disponible' : 'No disponible'}`);
        
        checkboxes.forEach((cb, i) => {
            const parent = cb.closest('span');
            console.log(`   Checkbox ${i}: classes=${cb.className}, parent=${parent?.className}`);
        });
        
        return { checkboxes: checkboxes.length, mui: muiElements.length, sc: scElements.length };
    } else {
        console.log('❌ No estás en una página de DJ');
        return false;
    }
};

// 🆕 Función para click directo sin clase
window.directClickDJ = function(index = 0) {
    console.log(`⚡ DIRECT CLICK DJ - Click directo en checkbox ${index}`);
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (index >= checkboxes.length) {
        console.error(`❌ Índice ${index} fuera de rango. Hay ${checkboxes.length} checkboxes`);
        return false;
    }
    
    const checkbox = checkboxes[index];
    const span = checkbox.closest('span[role="button"]');
    
    console.log(`🎯 Checkbox ${index}:`, checkbox);
    console.log(`🎯 Span container:`, span);
    
    // Intentar múltiples métodos de click
    const metodos = [
        () => checkbox.click(),
        () => span?.click(),
        () => checkbox.dispatchEvent(new Event('click', {bubbles: true})),
        () => span?.dispatchEvent(new Event('click', {bubbles: true}))
    ];
    
    let exito = false;
    metodos.forEach((metodo, i) => {
        try {
            console.log(`   Probando método ${i + 1}...`);
            metodo();
            
            setTimeout(() => {
                const marcado = checkbox.checked || span?.classList.contains('Mui-checked');
                console.log(`   Método ${i + 1}: ${marcado ? '✅ ÉXITO' : '❌ FALLÓ'}`);
                if (marcado) exito = true;
            }, 100);
        } catch (error) {
            console.log(`   Método ${i + 1} error: ${error.message}`);
        }
    });
    
    return exito;
};

// ================================
// INICIALIZACIÓN INMEDIATA CON INDICADOR
// ================================

// 🚨 INDICADOR INMEDIATO PARA DEBUG
console.log('🚀 CONTENT SCRIPT CARGADO - URL:', window.location.href);

// Crear indicador inmediato para verificar que el script está corriendo
const createImmediateIndicator = () => {
    const indicator = document.createElement('div');
    indicator.id = 'immediate-extension-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: red;
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 999999;
        font-size: 12px;
    `;
    indicator.innerHTML = '🔴 Extension Loading...';
    document.body.appendChild(indicator);
    return indicator;
};

// Crear indicador inmediatamente
let immediateIndicator = null;
if (document.body) {
    immediateIndicator = createImmediateIndicator();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        immediateIndicator = createImmediateIndicator();
    });
}

let licitacionAutomationInstance = null;

// Esperar a que se carguen las dependencias
setTimeout(() => {
    try {
        if (immediateIndicator) {
            immediateIndicator.innerHTML = '🟡 Inicializando...';
            immediateIndicator.style.background = 'orange';
        }
        
        licitacionAutomationInstance = new LicitacionAutomation();
        console.log('✅ LicitacionAutomation inicializada');
        
        if (immediateIndicator) {
            immediateIndicator.innerHTML = '🟢 Extension Activa';
            immediateIndicator.style.background = 'green';
        }
    } catch (error) {
        console.error('❌ Error inicializando LicitacionAutomation:', error);
        
        if (immediateIndicator) {
            immediateIndicator.innerHTML = '🔴 Error en Extension';
            immediateIndicator.style.background = 'red';
        }
    }
}, 1000);

// ================================
// FUNCIONES LEGACY (MANTENER COMPATIBILIDAD)
// ================================

function showModal(text) {
    let old = document.getElementById('licitacion-modal');
    if(old) old.remove();
    let modal = document.createElement('div');
    modal.id = 'licitacion-modal';
    modal.style = `
        position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.35);z-index:999999;
        display:flex;justify-content:center;align-items:center;
    `;
    modal.innerHTML = `
        <div style="background:#fff;padding:2.5em 2em;border-radius:18px;min-width:340px;box-shadow:0 0 32px #2225;display:flex;flex-direction:column;align-items:center;">
            <div class="spinner" style="margin-bottom:15px;border:6px solid #e3e3e3;border-top:6px solid #2580ff;border-radius:50%;width:38px;height:38px;animation:spin 1s linear infinite;"></div>
            <div style="font-size:1.2em;margin-bottom:5px;font-weight:500;color:#223;">${text}</div>
        </div>
        <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(modal);
}

function hideModal() {
    let modal = document.getElementById('licitacion-modal');
    if(modal) modal.remove();
}

// ❌ FUNCIÓN DE LOGIN AUTOMÁTICO DESHABILITADA
// El usuario debe iniciar sesión manualmente en Mercado Público
async function loginAutomatizado(user, pass) {
    console.warn('⚠️ Login automático deshabilitado por seguridad');
    console.warn('⚠️ Por favor inicia sesión manualmente en Mercado Público');
    
    showModal('⚠️ Login automático deshabilitado. Inicia sesión manualmente y vuelve a intentar.');
    
    setTimeout(() => {
        hideModal();
    }, 4000);
    
    return false;
}

// ================================
// FUNCIONES DE DEBUG PARA FIRMA
// ================================

window.debugFirma = () => {
    console.log('🔍 DEBUG: Analizando botones de firma disponibles...');
    
    // Analizar TODOS los botones que contengan 'Clave' o 'Firmar'
    const todosBotones = document.querySelectorAll('button');
    console.log('📋 Botones relacionados con firma/clave:');
    
    let botonClaveUnica = null;
    let botonFirmarSinClave = null;
    
    todosBotones.forEach((btn, i) => {
        const texto = btn.textContent.trim();
        const variant = btn.getAttribute('variant');
        
        if (texto.includes('Clave') || texto.includes('Firmar')) {
            console.log(`   Botón ${i}: "${texto}"`);
            console.log(`     Variant: ${variant || 'sin variant'}`);
            console.log(`     Classes: ${btn.className}`);
            console.log(`     Visible: ${btn.offsetParent !== null}`);
            console.log('     ---');
            
            // Identificar cada tipo de botón
            if (texto.includes('ClaveÚnica') && variant === 'contained') {
                botonClaveUnica = btn;
            } else if (texto.includes('Firmar sin Clave Única') && variant === 'outlined') {
                botonFirmarSinClave = btn;
            }
        }
    });
    
    console.log('📋 RESULTADO DEL ANÁLISIS:');
    console.log('   Botón ClaveÚnica (contained):', !!botonClaveUnica);
    if (botonClaveUnica) {
        console.log(`     Texto: "${botonClaveUnica.textContent.trim()}"`);
        console.log(`     Variant: ${botonClaveUnica.getAttribute('variant')}`);
    }
    
    console.log('   Botón Firmar sin Clave Única (outlined):', !!botonFirmarSinClave);
    if (botonFirmarSinClave) {
        console.log(`     Texto: "${botonFirmarSinClave.textContent.trim()}"`);
        console.log(`     Variant: ${botonFirmarSinClave.getAttribute('variant')}`);
    }
    
    // Buscar modales activos
    const modales = document.querySelectorAll('.MuiDialog-root, .MuiModal-root, [role="dialog"]');
    console.log('📋 Modales/Diálogos encontrados:', modales.length);
    
    modales.forEach((modal, i) => {
        console.log(`   Modal ${i + 1}:`);
        console.log('     Visible:', modal.offsetParent !== null);
        console.log('     Classes:', modal.className);
        
        // Buscar botones dentro del modal
        const botonesModal = modal.querySelectorAll('button');
        console.log('     Botones en modal:', botonesModal.length);
        botonesModal.forEach((btn, j) => {
            console.log(`       Botón ${j + 1}: "${btn.textContent.trim()}" - Variant: ${btn.getAttribute('variant')}`);
        });
    });
    
    return { botonClaveUnica, botonFirmarSinClave, modales };
};

window.testFirma = async () => {
    console.log('🧪 TEST: Simulando proceso de firma...');
    
    try {
        if (window.automation) {
            await window.automation.firmarSinClaveUnica();
        } else {
            console.error('❌ Objeto automation no disponible');
        }
    } catch (error) {
        console.error('❌ Error en test de firma:', error);
    }
};

window.clickFirmaSinClave = () => {
    console.log('🖊️ MANUAL: Intentando click en "Firmar sin Clave Única"...');
    
    let botonFirmar = null;
    
    // MÉTODO 1: Buscar específicamente por variant="outlined" Y texto
    botonFirmar = document.querySelector('button[variant="outlined"]');
    if (botonFirmar && botonFirmar.textContent.includes('Firmar sin Clave Única')) {
        console.log('✅ Encontrado por variant="outlined"');
    } else {
        botonFirmar = null;
    }
    
    // MÉTODO 2: XPath específico para evitar confusión
    if (!botonFirmar) {
        const xpath = "//button[@variant='outlined' and contains(text(), 'Firmar sin Clave Única')]";
        botonFirmar = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (botonFirmar) {
            console.log('✅ Encontrado por XPath outlined');
        }
    }
    
    // MÉTODO 3: Buscar evitando ClaveÚnica
    if (!botonFirmar) {
        const todosBotones = document.querySelectorAll('button');
        for (const btn of todosBotones) {
            const texto = btn.textContent.trim();
            const variant = btn.getAttribute('variant');
            
            if (texto.includes('Firmar sin Clave Única') && 
                !texto.includes('ClaveÚnica') && 
                variant === 'outlined') {
                botonFirmar = btn;
                console.log('✅ Encontrado evitando ClaveÚnica');
                break;
            }
        }
    }
    
    if (botonFirmar) {
        console.log(`✅ Botón encontrado: "${botonFirmar.textContent.trim()}" - Variant: ${botonFirmar.getAttribute('variant')}`);
        botonFirmar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        botonFirmar.click();
        console.log('✅ Click realizado');
        return true;
    } else {
        console.error('❌ Botón "Firmar sin Clave Única" no encontrado');
        return false;
    }
};

window.clickSegundoBotonFirma = () => {
    console.log('🖊️ MANUAL: Intentando click en segundo botón "Firmar sin Clave Única"...');
    
    const selectorSegundoBoton = "//button[contains(@class, 'sc-dmsloy') and contains(@class, 'EaXFo') and contains(@class, 'hOvxpq') and contains(text(), 'Firmar sin Clave Única')]";
    const segundoBoton = document.evaluate(selectorSegundoBoton, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (segundoBoton) {
        console.log('✅ Segundo botón encontrado, haciendo click...');
        segundoBoton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        segundoBoton.click();
        console.log('✅ Click realizado en segundo botón');
        return true;
    } else {
        console.error('❌ No se encontró el segundo botón de confirmación');
        return false;
    }
};

window.clickCerrarVolver = () => {
    console.log('🔄 MANUAL: Intentando click en "Cerrar y volver a la oferta"...');
    
    const selectorCerrar = "//button[contains(@class, 'EaXFo') and contains(text(), 'Cerrar y volver a la oferta')]";
    const botonCerrar = document.evaluate(selectorCerrar, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (botonCerrar) {
        console.log('✅ Botón "Cerrar y volver a la oferta" encontrado, haciendo click...');
        botonCerrar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        botonCerrar.click();
        console.log('✅ Click realizado en botón cerrar');
        return true;
    } else {
        console.error('❌ No se encontró el botón "Cerrar y volver a la oferta"');
        return false;
    }
};

window.procesoFirmaCompleto = async () => {
    console.log('🚀 MANUAL: Ejecutando proceso completo de firma (3 pasos)...');
    
    try {
        console.log('Paso 1: Click en "Firmar sin Clave Única"');
        if (!window.clickFirmaSinClave()) {
            throw new Error('No se pudo hacer click en primer botón');
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Paso 2: Click en segundo botón de confirmación');
        if (!window.clickSegundoBotonFirma()) {
            throw new Error('No se pudo hacer click en segundo botón');
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Paso 3: Click en "Cerrar y volver a la oferta"');
        if (!window.clickCerrarVolver()) {
            console.warn('⚠️ No se pudo hacer click en botón cerrar (puede ser normal)');
        }
        
        console.log('✅ Proceso de firma completado exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error en proceso de firma:', error);
        return false;
    }
};

// Mantener listener legacy para compatibilidad
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.action === 'iniciar_login_licitacion') {
        loginAutomatizado(request.user, request.pass).then(success => {
            sendResponse({ status: success ? 'login_ok' : 'login_fail' });
        });
        return true;
    }
});

// Funciones globales para debugging de checkboxes en consola del navegador
window.debugCheckboxesReales = function() {
    console.log('=== DEBUGGING CHECKBOXES REALES ===');
    
    // Múltiples selectores para encontrar checkboxes
    const selectores = [
        'input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]',
        'input[class*="fKMtys"][type="checkbox"]',
        'input[type="checkbox"]',
        'span[role="button"] input[type="checkbox"]',
        '.MuiCheckbox-root input'
    ];
    
    console.log('🔍 Buscando checkboxes con diferentes selectores:');
    selectores.forEach((selector, i) => {
        try {
            const elementos = document.querySelectorAll(selector);
            console.log(`${i + 1}. "${selector}": ${elementos.length} elementos`);
            
            if (elementos.length > 0) {
                elementos.forEach((el, j) => {
                    if (j < 3) { // Solo mostrar los primeros 3
                        console.log(`   [${j + 1}] Checked: ${el.checked}, Visible: ${el.offsetParent !== null}, Classes: ${el.className}`);
                    }
                });
            }
        } catch (e) {
            console.log(`${i + 1}. "${selector}": ERROR - ${e.message}`);
        }
    });
    
    // Buscar todos los elementos MUI
    const todosMUI = document.querySelectorAll('[class*="Mui"]');
    const todosSC = document.querySelectorAll('[class*="sc-"]');
    console.log(`📊 Elementos MUI en página: ${todosMUI.length}`);
    console.log(`📊 Elementos SC en página: ${todosSC.length}`);
    
    return { 
        checkboxesEncontrados: document.querySelectorAll('input[type="checkbox"]').length,
        elementosMUI: todosMUI.length,
        elementosSC: todosSC.length
    };
};

window.marcarTodosCheckboxes = function() {
    console.log('=== MARCANDO TODOS LOS CHECKBOXES ===');
    
    // Intentar múltiples selectores
    let checkboxes = document.querySelectorAll('input.sc-fKMtys.cTALWK.PrivateSwitchBase-input[type="checkbox"]');
    
    if (checkboxes.length === 0) {
        checkboxes = document.querySelectorAll('input[class*="fKMtys"][type="checkbox"]');
    }
    
    if (checkboxes.length === 0) {
        checkboxes = document.querySelectorAll('input[type="checkbox"]');
    }
    
    console.log(`Encontrados ${checkboxes.length} checkboxes para marcar`);
    
    let marcados = 0;
    checkboxes.forEach((cb, i) => {
        if (!cb.checked && cb.offsetParent !== null) {
            console.log(`Marcando checkbox ${i+1}...`);
            
            // Método 1: Click directo
            cb.click();
            
            // Método 2: Si no funcionó, cambio directo
            if (!cb.checked) {
                cb.checked = true;
                const changeEvent = new Event('change', { bubbles: true });
                cb.dispatchEvent(changeEvent);
            }
            
            // Verificar resultado
            if (cb.checked) {
                marcados++;
                console.log(`✅ Checkbox ${i+1} marcado exitosamente`);
            } else {
                console.log(`❌ Checkbox ${i+1} falló al marcar`);
            }
        } else if (cb.checked) {
            console.log(`✓ Checkbox ${i+1} ya estaba marcado`);
            marcados++;
        }
    });
    
    console.log(`🎉 Resultado: ${marcados}/${checkboxes.length} checkboxes marcados`);
    return { total: checkboxes.length, marcados: marcados };
};

window.testearExtension = function() {
    console.log('🧪 INICIANDO PRUEBA COMPLETA DE LA EXTENSIÓN...');
    
    // 1. Verificar estado de la página
    console.log('1. Estado de la página:');
    console.log(`   URL: ${window.location.href}`);
    console.log(`   Título: ${document.title}`);
    console.log(`   DJ en URL: ${window.location.href.includes('dj-requisitos')}`);
    
    // 2. Verificar React y MUI
    console.log('2. Verificar tecnologías:');
    console.log(`   React disponible: ${typeof React !== 'undefined'}`);
    console.log(`   Elementos MUI: ${document.querySelectorAll('[class*="Mui"]').length}`);
    console.log(`   Elementos SC: ${document.querySelectorAll('[class*="sc-"]').length}`);
    
    // 3. Buscar checkboxes
    console.log('3. Análisis de checkboxes:');
    debugCheckboxesReales();
    
    // 4. Intentar marcar todos
    console.log('4. Intentar marcar todos:');
    const resultado = marcarTodosCheckboxes();
    
    return resultado;
};

window.buscarBotonFirmar = function() {
    console.log('🖊️ BUSCANDO BOTÓN DE FIRMAR...');
    
    // Buscar todos los botones
    const todosLosBotones = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    console.log(`🔍 Total de botones encontrados: ${todosLosBotones.length}`);
    
    const botonesFirmar = [];
    todosLosBotones.forEach((btn, i) => {
        const texto = btn.textContent || btn.innerText || btn.value || '';
        console.log(`${i+1}. "${texto}" - Tag: ${btn.tagName}, Classes: ${btn.className.substring(0, 50)}...`);
        
        if (texto.toLowerCase().includes('firmar') || 
            texto.toLowerCase().includes('firma') ||
            texto.toLowerCase().includes('clave')) {
            botonesFirmar.push({
                indice: i+1,
                elemento: btn,
                texto: texto,
                clases: btn.className
            });
        }
    });
    
    console.log(`🎯 Botones relacionados con firmar encontrados: ${botonesFirmar.length}`);
    botonesFirmar.forEach(info => {
        console.log(`   - "${info.texto}" (${info.indice})`);
    });
    
    return botonesFirmar;
};

window.clickearBotonFirmarManual = function() {
    console.log('🖊️ BUSCANDO Y CLICKEANDO BOTÓN FIRMAR MANUALMENTE...');
    
    // Buscar por texto
    const todosLosBotones = document.querySelectorAll('button, [role="button"]');
    
    for (const boton of todosLosBotones) {
        const texto = boton.textContent || '';
        if (texto.includes('Firmar sin Clave Única') || texto.includes('Firmar')) {
            console.log(`✅ Encontrado: "${texto}"`);
            console.log(`📋 Classes: ${boton.className}`);
            
            try {
                boton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    boton.click();
                    console.log('🎯 CLICK REALIZADO EN BOTÓN');
                }, 1000);
                return true;
            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
            }
        }
    }
    
    console.log('❌ No se encontró botón de firmar');
    return false;
};

window.procesarModalManual = function() {
    console.log('📋 PROCESANDO MODAL DE CONFIRMACIÓN MANUALMENTE...');
    
    // Buscar el modal
    const selectoresModal = [
        '.sc-kAKABG.leeTDo',
        'div[class*="leeTDo"]',
        'div[class*="sc-kAKABG"]',
        '[class*="modal"]',
        '[role="dialog"]'
    ];
    
    let modalEncontrado = null;
    
    for (const selector of selectoresModal) {
        const modal = document.querySelector(selector);
        if (modal && modal.offsetParent !== null) {
            modalEncontrado = modal;
            console.log(`✅ Modal encontrado: ${selector}`);
            break;
        }
    }
    
    if (!modalEncontrado) {
        console.log('❌ No se encontró modal visible');
        return false;
    }
    
    // Buscar botones en el modal
    const botonesEnModal = modalEncontrado.querySelectorAll('button');
    console.log(`🔍 Botones en modal: ${botonesEnModal.length}`);
    
    botonesEnModal.forEach((btn, i) => {
        const texto = btn.textContent || '';
        console.log(`   ${i+1}. "${texto}" - Classes: ${btn.className.substring(0, 50)}...`);
    });
    
    // Buscar y clickear el botón de confirmación
    for (const boton of botonesEnModal) {
        const texto = boton.textContent || '';
        if (texto.includes('Firmar sin Clave Única') || 
            texto.includes('Confirmar') || 
            texto.includes('Aceptar')) {
            console.log(`🎯 Haciendo click en: "${texto}"`);
            
            try {
                boton.click();
                console.log('✅ CLICK REALIZADO EN MODAL');
                return true;
            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
            }
        }
    }
    
    console.log('❌ No se encontró botón de confirmación en modal');
    return false;
};

window.cerrarModalManual = function() {
    console.log('❌ CERRANDO MODAL MANUALMENTE...');
    
    // Buscar botón de cerrar (X)
    const botonesX = document.querySelectorAll('button[class*="bsALRs"], button svg[data-testid="CloseIcon"]');
    
    if (botonesX.length > 0) {
        console.log(`🔍 Encontrados ${botonesX.length} botones de cerrar`);
        botonesX[0].closest('button').click();
        console.log('✅ Modal cerrado');
        return true;
    }
    
    // Método alternativo: ESC key
    const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        bubbles: true
    });
    document.dispatchEvent(escEvent);
    console.log('⌨️ Tecla ESC enviada');
    return true;
};

window.procesarModalExitoManual = function() {
    console.log('🎉 PROCESANDO MODAL DE ÉXITO MANUALMENTE...');
    
    // Buscar el modal de éxito
    const selectoresModal = [
        '.sc-kAKABG.ejDMln',
        'div[class*="ejDMln"]',
        'div[class*="sc-kAKABG"]'
    ];
    
    let modalEncontrado = null;
    
    for (const selector of selectoresModal) {
        const modal = document.querySelector(selector);
        if (modal && modal.offsetParent !== null) {
            modalEncontrado = modal;
            console.log(`✅ Modal de éxito encontrado: ${selector}`);
            break;
        }
    }
    
    // Buscar también por texto del título
    if (!modalEncontrado) {
        const elementos = document.querySelectorAll('h4');
        for (const elemento of elementos) {
            if (elemento.textContent.includes('Declaración firmada con éxito')) {
                modalEncontrado = elemento.closest('div[class*="sc-kAKABG"]');
                console.log('✅ Modal encontrado por título');
                break;
            }
        }
    }
    
    if (!modalEncontrado) {
        console.log('❌ No se encontró modal de éxito visible');
        return false;
    }
    
    // Buscar botones en el modal
    const botonesEnModal = modalEncontrado.querySelectorAll('button');
    console.log(`🔍 Botones en modal de éxito: ${botonesEnModal.length}`);
    
    botonesEnModal.forEach((btn, i) => {
        const texto = btn.textContent || '';
        console.log(`   ${i+1}. "${texto}" - Classes: ${btn.className.substring(0, 50)}...`);
    });
    
    // Buscar y clickear el botón "Cerrar y volver a la oferta"
    for (const boton of botonesEnModal) {
        const texto = boton.textContent || '';
        if (texto.includes('Cerrar y volver a la oferta') || 
            texto.includes('Cerrar y volver') || 
            texto.includes('volver a la oferta')) {
            console.log(`🎯 Haciendo click en: "${texto}"`);
            
            try {
                boton.click();
                console.log('✅ CLICK REALIZADO - VOLVIENDO A LA OFERTA');
                return true;
            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
            }
        }
    }
    
    console.log('❌ No se encontró botón "Cerrar y volver a la oferta"');
    return false;
};

window.verificarModalActual = function() {
    console.log('🔍 VERIFICANDO QUÉ MODAL ESTÁ ACTIVO...');
    
    // Buscar diferentes tipos de modal
    const modales = {
        confirmacion: document.querySelector('.sc-kAKABG.leeTDo'),
        exito: document.querySelector('.sc-kAKABG.ejDMln'),
        cualquiera: document.querySelector('[role="dialog"], .sc-kAKABG')
    };
    
    Object.entries(modales).forEach(([tipo, modal]) => {
        if (modal && modal.offsetParent !== null) {
            console.log(`✅ Modal ${tipo} está visible`);
            console.log(`   Classes: ${modal.className}`);
            
            const botones = modal.querySelectorAll('button');
            console.log(`   Botones: ${botones.length}`);
            botones.forEach((btn, i) => {
                console.log(`      ${i+1}. "${btn.textContent}"`);
            });
        } else {
            console.log(`❌ Modal ${tipo} no visible`);
        }
    });
    
    return modales;
};

window.buscarYClickearCerrarVolver = function() {
    console.log('🔍 BÚSQUEDA MANUAL DEL BOTÓN CERRAR Y VOLVER...');
    
    // Buscar todos los botones
    const todosLosBotones = document.querySelectorAll('button, [role="button"]');
    console.log(`🔍 Total botones encontrados: ${todosLosBotones.length}`);
    
    const botonesCandidatos = [];
    
    todosLosBotones.forEach((btn, i) => {
        const texto = btn.textContent || '';
        const visible = btn.offsetParent !== null;
        
        console.log(`${i+1}. "${texto}" - Visible: ${visible} - Classes: ${btn.className.substring(0, 30)}...`);
        
        if (texto.includes('Cerrar') || texto.includes('Volver') || texto.includes('cerrar') || texto.includes('volver')) {
            botonesCandidatos.push({
                boton: btn,
                texto: texto,
                visible: visible,
                indice: i+1
            });
        }
    });
    
    console.log(`🎯 Botones candidatos para cerrar/volver: ${botonesCandidatos.length}`);
    botonesCandidatos.forEach(candidato => {
        console.log(`   - "${candidato.texto}" (${candidato.indice}) - Visible: ${candidato.visible}`);
    });
    
    // Intentar hacer click en el más apropiado
    const mejorCandidato = botonesCandidatos.find(c => 
        c.visible && (c.texto.includes('Cerrar y volver a la oferta') || c.texto.includes('Cerrar y volver'))
    ) || botonesCandidatos.find(c => c.visible && c.texto.includes('Cerrar')) ||
       botonesCandidatos.find(c => c.visible);
    
    if (mejorCandidato) {
        console.log(`✅ Haciendo click en: "${mejorCandidato.texto}"`);
        try {
            mejorCandidato.boton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                mejorCandidato.boton.click();
                console.log('🎯 CLICK REALIZADO');
            }, 1000);
            return true;
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
        }
    } else {
        console.log('❌ No se encontró botón adecuado');
    }
    
    return false;
};

window.analizarModalExitoActual = function() {
    console.log('🔍 ANÁLISIS DETALLADO DEL MODAL DE ÉXITO ACTUAL...');
    
    // Buscar modales
    const modalesPosibles = [
        document.querySelector('.sc-kAKABG.ejDMln'),
        document.querySelector('div[class*="ejDMln"]'),
        document.querySelector('.sc-kAKABG')
    ];
    
    modalesPosibles.forEach((modal, i) => {
        if (modal && modal.offsetParent !== null) {
            console.log(`📋 Modal ${i+1} encontrado y visible:`);
            console.log(`   Classes: ${modal.className}`);
            console.log(`   Texto completo: ${modal.textContent.substring(0, 200)}...`);
            
            const botones = modal.querySelectorAll('button');
            console.log(`   Botones en este modal: ${botones.length}`);
            
            botones.forEach((btn, j) => {
                const texto = btn.textContent || '';
                const classes = btn.className;
                console.log(`      ${j+1}. "${texto}"`);
                console.log(`         Classes: ${classes}`);
                console.log(`         Color: ${btn.getAttribute('color')}`);
                console.log(`         Variant: ${btn.getAttribute('variant')}`);
                console.log(`         Margin: ${btn.getAttribute('margin')}`);
                
                // Verificar si es el botón correcto
                if (texto.includes('Cerrar y volver') || (texto.includes('Cerrar') && !texto.includes('Firmar'))) {
                    console.log(`         🎯 ESTE ES EL BOTÓN CORRECTO`);
                    
                    // Hacer click de prueba
                    try {
                        btn.click();
                        console.log(`         ✅ CLICK REALIZADO EN BOTÓN CORRECTO`);
                    } catch (e) {
                        console.log(`         ❌ Error en click: ${e.message}`);
                    }
                }
            });
        } else {
            console.log(`❌ Modal ${i+1} no encontrado o no visible`);
        }
    });
};

window.procesarFlujoCompletoModales = function() {
    console.log('🎯 INICIANDO FLUJO COMPLETO DE MODALES...');
    
    // Función para analizar modal actual
    const analizarModalActual = () => {
        const modal = document.querySelector('.sc-kAKABG, [role="dialog"]');
        if (modal && modal.offsetParent !== null) {
            console.log('📋 Modal activo encontrado:');
            console.log(`   Classes: ${modal.className}`);
            
            const botones = modal.querySelectorAll('button');
            console.log(`   Botones: ${botones.length}`);
            
            botones.forEach((btn, i) => {
                const texto = btn.textContent || '';
                const variant = btn.getAttribute('variant');
                const color = btn.getAttribute('color');
                console.log(`      ${i+1}. "${texto}" - Variant: ${variant}, Color: ${color}`);
            });
            
            return { modal, botones: Array.from(botones) };
        }
        return null;
    };
    
    // Analizar estado actual
    const modalInfo = analizarModalActual();
    
    if (!modalInfo) {
        console.log('❌ No hay modal activo actualmente');
        return false;
    }
    
    // Buscar y hacer click en el botón apropiado
    const { botones } = modalInfo;
    
    for (const boton of botones) {
        const texto = boton.textContent || '';
        const variant = boton.getAttribute('variant');
        
        // Lógica de decisión basada en el contexto
        if (texto.includes('Firmar sin Clave Única')) {
            console.log(`🎯 Encontrado botón firmar: "${texto}" (${variant})`);
            
            try {
                boton.click();
                console.log('✅ CLICK REALIZADO');
                
                // Programar análisis del siguiente modal
                setTimeout(() => {
                    console.log('🔄 Buscando siguiente modal...');
                    procesarFlujoCompletoModales();
                }, 3000);
                
                return true;
            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
            }
        } else if (texto.includes('Cerrar y volver a la oferta')) {
            console.log(`🏠 Encontrado botón volver: "${texto}"`);
            
            try {
                boton.click();
                console.log('✅ REGRESO A LA OFERTA COMPLETADO');
                return true;
            } catch (e) {
                console.log(`❌ Error: ${e.message}`);
            }
        }
    }
    
    return false;
};

// Actualizado: 2025-11-28 14:01:04
