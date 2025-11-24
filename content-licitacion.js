// content-licitacion.js - Automatización de Licitaciones basada en script Python
// ✅ Replica el flujo completo del proceso de postulación

console.log('🎯 CONTENT SCRIPT LICITACIONES CARGADO:', window.location.href);

class LicitacionAutomation {
    constructor() {
        this.isRunning = false;
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

        console.log('🤖 LicitacionAutomation inicializado');
        
        this.registerInWindow();
        this.detectPageContext();
        
        setTimeout(() => {
            this.initializeBasedOnContext();
        }, 2000);
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
            if (url.includes('Portal/Modules/Desktop/Desktop.aspx')) {
                this.currentPage = 'oferta_form';
                this.extractLicitacionFromUrl();
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
                    break;
                    
                case 'oferta_form':
                    console.log('📍 En formulario de oferta - Iniciando automatización...');
                    this.addIndicator('📋 Formulario de oferta detectado', 'success');
                    if (this.licitacionId) {
                        await this.prepareForOfferAutomation();
                    }
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
        try {
            console.log('📄 Ejecutando flujo de carga de documentos...');
            
            // TODO: Implementar el flujo específico basado en el script Python
            // 1. Verificar datos de la licitación en PharmaTender
            // 2. Navegar a Mercado Público
            // 3. Login con credenciales
            // 4. Buscar la licitación
            // 5. Crear/editar oferta
            // 6. Cargar documentos
            // 7. Completar formularios
            // 8. Firmar y enviar
            
            this.showNotification('Flujo de documentos iniciado - En desarrollo', 'info');
            
            // Por ahora, mostrar información de debug
            console.log('📋 Datos de licitación:', {
                id: this.licitacionId,
                url: window.location.href,
                tipo: 'carga_documentos'
            });
            
        } catch (error) {
            console.error('❌ Error en flujo de documentos:', error);
            throw error;
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
                'span:contains("Cancelada")',
                'span:contains("Cerrada")', 
                'span:contains("Suspendida")',
                '.estado-licitacion',
                '[class*="estado"]'
            ];

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
                'button:contains("Anular")',
                'a:contains("Anular")',
                '[onclick*="anular"]',
                '.estado-oferta:contains("Enviada")',
                '.estado-oferta:contains("Ingresada")'
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
            
            if (request.action === 'startLicitacionAutomation') {
                console.log('🚀 COMANDO AUTORIZADO desde popup');
                
                this.startAutomationProcess(request.data)
                    .then(() => {
                        sendResponse({ success: true, message: 'Automatización iniciada' });
                    })
                    .catch((error) => {
                        sendResponse({ success: false, message: error.message });
                    });
                
                return true;
            }
            
            if (request.action === 'initiateLicitacionProcess') {
                console.log('🚀 INICIANDO PROCESO desde background:', request.licitacionId);
                
                this.executeDocumentUploadFlow()
                    .then(() => {
                        sendResponse({ success: true, message: 'Proceso de licitación completado' });
                    })
                    .catch((error) => {
                        console.error('❌ Error en proceso de licitación:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                
                return true;
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
        
        // PASO 4: Cargar documentos
        await this.cargarDocumentos();
        
        // PASO 5: Proceso de firma
        await this.procesoFirma();
        
        // PASO 6: Finalizar oferta
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
            // Activar checkbox "No Bids"
            await this.activarNoBidsCheckbox();
            
            // Procesar productos por páginas
            await this.procesarProductosPorPaginas();
            
            // Hacer clic en "Siguiente"
            await this.clickSiguiente();
            
        } catch (error) {
            console.error('❌ Error en productos y precios:', error);
            throw new Error('Falló completar productos y precios');
        }
    }

    async cargarDocumentos() {
        console.log('📄 PASO 4: Cargando documentos...');
        this.updateIndicator('📄 Cargando documentos...', 'processing');
        
        try {
            // Cambiar a iframe de documentos
            await this.switchToDocumentFrame();
            
            // Cargar documentos por tipo
            await this.cargarDocumentosPorTipo();
            
            // Salir del iframe
            await this.switchToDefaultContent();
            
            // Hacer clic en "Siguiente"
            await this.clickSiguiente();
            
        } catch (error) {
            console.error('❌ Error cargando documentos:', error);
            // Los documentos son opcionales, continuar
            console.log('⚠️ Continuando sin documentos...');
        }
    }

    async procesoFirma() {
        console.log('🖊️ PASO 5: Proceso de firma...');
        this.updateIndicator('🖊️ Firmando declaración...', 'processing');
        
        try {
            await this.manejarDeclaracionJurada();
        } catch (error) {
            console.error('❌ Error en firma:', error);
            throw new Error('Falló proceso de firma');
        }
    }

    async finalizarOferta() {
        console.log('✅ PASO 6: Finalizando oferta...');
        this.updateIndicator('✅ Finalizando...', 'processing');
        
        try {
            await this.enviarOferta();
            await this.actualizarEstadoEnBD();
        } catch (error) {
            console.error('❌ Error finalizando:', error);
            throw new Error('Falló finalización de oferta');
        }
    }

    // ================================
    // IMPLEMENTACIÓN DE FUNCIONES ESPECÍFICAS
    // ================================

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
        const selector = window.EXTENSION_CONFIG?.SELECTORS?.FORM?.NOMBRE_OFERTA;
        if (!selector) return;
        
        const input = document.querySelector(selector);
        if (input && this.automationData?.nombre) {
            input.value = '';
            input.focus();
            await this.typeText(input, this.automationData.nombre);
            console.log('✅ Nombre de oferta completado');
        }
    }

    async fillDescripcionOferta() {
        const selectors = window.EXTENSION_CONFIG?.SELECTORS?.FORM?.DESCRIPCION_OFERTA || [];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && this.automationData?.descripcion) {
                element.value = '';
                element.focus();
                await this.typeText(element, this.automationData.descripcion);
                console.log('✅ Descripción completada');
                break;
            }
        }
    }

    async activarNoBidsCheckbox() {
        const selector = window.EXTENSION_CONFIG?.SELECTORS?.PRODUCTOS?.NO_BIDS_CHECKBOX;
        if (!selector) return;
        
        const checkbox = document.querySelector(selector);
        if (checkbox && !checkbox.checked) {
            checkbox.click();
            await this.delay(2000);
            console.log('✅ Checkbox No Bids activado');
        }
    }

    async procesarProductosPorPaginas() {
        if (!this.automationData?.productos) return;
        
        console.log('🔄 Procesando productos por páginas...');
        
        const productos = this.automationData.productos;
        const productosPorPagina = 10;
        const totalPaginas = Math.ceil(productos.length / productosPorPagina);
        
        for (let pagina = 1; pagina <= totalPaginas; pagina++) {
            console.log(`📄 Procesando página ${pagina}/${totalPaginas}`);
            
            // Cambiar a la página si es necesario
            if (pagina > 1) {
                await this.cambiarPagina(pagina);
            }
            
            // Procesar productos de esta página
            const inicioIndice = (pagina - 1) * productosPorPagina;
            const finIndice = Math.min(inicioIndice + productosPorPagina, productos.length);
            
            for (let i = inicioIndice; i < finIndice; i++) {
                const producto = productos[i];
                const indiceEnPagina = i - inicioIndice;
                await this.procesarProductoIndividual(producto, indiceEnPagina);
            }
        }
    }

    async cambiarPagina(numeroPagina) {
        console.log(`🔄 Cambiando a página ${numeroPagina}...`);
        
        try {
            // Esperar que la función JavaScript esté disponible
            await this.waitForJavaScriptFunction('fnMovePage');
            
            // Ejecutar cambio de página
            const comando = `fnMovePage(${numeroPagina},"wucPagerBID");`;
            await new Promise((resolve, reject) => {
                try {
                    eval(comando);
                    setTimeout(resolve, 3000);
                } catch (error) {
                    reject(error);
                }
            });
            
            // Esperar que la página se cargue
            await this.waitForPageLoad();
            
            console.log(`✅ Cambio a página ${numeroPagina} completado`);
            
        } catch (error) {
            console.error(`❌ Error cambiando a página ${numeroPagina}:`, error);
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

    async procesarProductoIndividual(producto, indiceEnPagina) {
        const indiceFormateado = (indiceEnPagina + 1).toString().padStart(2, '0');
        
        try {
            // Marcar checkbox del producto
            await this.marcarCheckboxProducto(indiceFormateado);
            
            // Llenar descripción
            await this.llenarDescripcionProducto(indiceFormateado, producto.descripcion);
            
            // Llenar precio
            await this.llenarPrecioProducto(indiceFormateado, producto.precio);
            
            console.log(`✅ Producto procesado: índice ${indiceFormateado}`);
            
        } catch (error) {
            console.error(`❌ Error procesando producto ${indiceFormateado}:`, error);
        }
    }

    async marcarCheckboxProducto(indiceFormateado) {
        const pattern = window.EXTENSION_CONFIG?.SELECTORS?.PRODUCTOS?.PRODUCT_CHECKBOX_PATTERN;
        if (!pattern) return;
        
        const selector = pattern.replace('{INDEX}', indiceFormateado);
        const checkbox = document.getElementById(selector);
        
        if (checkbox) {
            checkbox.click();
            await this.delay(500);
        }
    }

    async llenarDescripcionProducto(indiceFormateado, descripcion) {
        const pattern = window.EXTENSION_CONFIG?.SELECTORS?.PRODUCTOS?.PRODUCT_TEXTAREA_PATTERN;
        if (!pattern) return;
        
        const selector = pattern.replace('{INDEX}', indiceFormateado);
        const textarea = document.getElementById(selector);
        
        if (textarea && descripcion) {
            textarea.value = '';
            textarea.focus();
            await this.typeText(textarea, descripcion);
        }
    }

    async llenarPrecioProducto(indiceFormateado, precio) {
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
        const selector = window.EXTENSION_CONFIG?.SELECTORS?.FORM?.NEXT_BUTTON;
        if (!selector) return;
        
        const button = document.querySelector(selector);
        if (button) {
            button.click();
            await this.delay(3000);
            console.log('✅ Click en Siguiente realizado');
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
            // Obtener configuración de oferta conjunta desde los datos de automatización
            // Por defecto es 'no' si no está especificado
            const ofertaConjunta = this.automationData?.oferta_conjunta ||
                                   this.automationData?.licitacion?.oferta_conjunta ||
                                   false;

            console.log('🤝 Oferta conjunta:', ofertaConjunta ? 'SÍ' : 'NO');

            // Obtener selectores desde config
            const selectors = window.EXTENSION_CONFIG?.SELECTORS?.MERCADO_PUBLICO?.PAGINA_1;

            if (!selectors) {
                throw new Error('❌ No se encontraron selectores de oferta conjunta');
            }

            const selectorRadio = ofertaConjunta ?
                selectors.OFERTA_CONJUNTA_SI :
                selectors.OFERTA_CONJUNTA_NO;

            console.log('🎯 Buscando radio button:', selectorRadio);

            // Esperar y obtener el radio button
            const radioButton = await this.waitForElement(selectorRadio, 10000);

            if (!radioButton) {
                console.warn('⚠️ No se encontró radio button de oferta conjunta, continuando...');
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
        console.log('🌐 Obteniendo documento desde API...');

        try {
            const apiUrl = window.LicitacionUtils?.getApiUrl('GET_DOCUMENT_FILE');
            const params = new URLSearchParams({
                codigo_postulacion: this.licitacionId,
                tipo_documento: tipoKey,
                nombre_archivo: documentoInfo.filename || documentoInfo.nombre
            });

            const response = await fetch(`${apiUrl}?${params}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Error desconocido de la API');
            }

            console.log('✅ Documento obtenido desde API');
            return result.data;

        } catch (error) {
            console.error('❌ Error obteniendo documento desde API:', error);
            throw error;
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

    async manejarDeclaracionJurada() {
        console.log('🖊️ Manejando declaración jurada y firma...');

        try {
            // Actualizar estado
            await this.actualizarEstadoEnBD('firma', 'Procesando declaración jurada y firma', 'pagina_4');

            // Verificar si hay estado de firma pendiente
            const djEstado = await this.waitForElement('#dj_estado', 5000);

            if (djEstado) {
                const estadoTexto = djEstado.textContent.trim();
                console.log('📋 Estado de firma encontrado:', estadoTexto);

                if (estadoTexto === 'PENDIENTE') {
                    console.warn('⚠️ Firma en estado PENDIENTE - requiere acción manual');
                    await this.actualizarEstadoEnBD('pendiente', 'Firma requiere acción manual (estado PENDIENTE)', 'firma');
                    throw new Error('Firma en estado PENDIENTE - requiere intervención manual');
                }
            }

            // Buscar enlace "Declarar y firmar"
            console.log('🔍 Buscando enlace "Declarar y firmar"...');
            const linkDeclarar = await this.findElementByText('a', 'Declarar y firmar', 10000);

            if (!linkDeclarar) {
                console.warn('⚠️ No se encontró enlace "Declarar y firmar"');
                // Intentar con XPath alternativo
                const links = document.querySelectorAll('a');
                let found = false;
                for (const link of links) {
                    if (link.textContent.includes('Declarar') && link.textContent.includes('firmar')) {
                        console.log('✅ Enlace encontrado con búsqueda alternativa');
                        await this.clickElement(link);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw new Error('❌ No se encontró enlace "Declarar y firmar"');
                }
            } else {
                // Click en "Declarar y firmar"
                console.log('🖊️ Click en "Declarar y firmar"...');
                await this.clickElement(linkDeclarar);
            }

            await this.delay(2000);

            // Esperar modal/popup de firma
            console.log('⏳ Esperando modal de firma...');

            // Buscar checkbox de declaración jurada
            const checkboxDJ = await this.findElementBySelector([
                'input.fKMtys',
                'input[type="checkbox"]',
                'input.checkbox-firma'
            ], 10000);

            if (checkboxDJ && !checkboxDJ.checked) {
                console.log('☑️ Marcando checkbox de declaración jurada...');
                await this.clickElement(checkboxDJ);
                await this.delay(1000);
            }

            // Buscar botón "Firmar sin Clave Única"
            console.log('🔍 Buscando botón "Firmar sin Clave Única"...');
            const btnFirmar = await this.findElementByText('button', 'Firmar sin Clave Única', 10000);

            if (!btnFirmar) {
                // Búsqueda alternativa
                const buttons = document.querySelectorAll('button');
                let found = false;
                for (const button of buttons) {
                    const texto = button.textContent.trim();
                    if (texto.includes('Firmar') && texto.includes('sin') && texto.includes('Clave')) {
                        console.log('✅ Botón encontrado con búsqueda alternativa');
                        await this.clickElement(button);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw new Error('❌ No se encontró botón "Firmar sin Clave Única"');
                }
            } else {
                // Click en "Firmar sin Clave Única"
                console.log('🖊️ Click en "Firmar sin Clave Única"...');
                await this.clickElement(btnFirmar);
            }

            await this.delay(2000);

            // Confirmar firma (puede haber un segundo botón de confirmación)
            console.log('✅ Buscando confirmación de firma...');
            const btnConfirmar = await this.findElementBySelector([
                'button.hOvxpq',
                'button:contains("Confirmar")',
                'button[type="submit"]'
            ], 5000);

            if (btnConfirmar) {
                console.log('✅ Click en confirmar firma...');
                await this.clickElement(btnConfirmar);
                await this.delay(2000);
            }

            // Buscar botón "Cerrar y volver a la oferta"
            console.log('🔍 Buscando botón para cerrar modal...');
            const btnCerrar = await this.findElementByText('button', 'Cerrar', 8000);

            if (btnCerrar) {
                console.log('❎ Cerrando modal de firma...');
                await this.clickElement(btnCerrar);
                await this.delay(1000);
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

        } catch (error) {
            console.error('❌ Error en declaración jurada:', error);
            await this.actualizarEstadoEnBD('error', `Error en firma: ${error.message}`, 'firma');
            throw error;
        }
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
}

// ================================
// INICIALIZACIÓN
// ================================

let licitacionAutomationInstance = null;

// Esperar a que se carguen las dependencias
setTimeout(() => {
    try {
        licitacionAutomationInstance = new LicitacionAutomation();
        console.log('✅ LicitacionAutomation inicializada');
    } catch (error) {
        console.error('❌ Error inicializando LicitacionAutomation:', error);
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

async function loginAutomatizado(user, pass) {
    showModal('Validando login...');
    let inputUser = document.querySelector('input[type="text"][name*="usuario"],input[type="email"]');
    let inputPass = document.querySelector('input[type="password"]');
    let btnLogin = document.querySelector('button[type="submit"],input[type="submit"]');
    
    if(inputUser && inputPass && btnLogin) {
        inputUser.value = user;
        inputUser.dispatchEvent(new Event('input', { bubbles: true }));
        inputPass.value = pass;
        inputPass.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 700));
        btnLogin.click();
        showModal('Login enviado, esperando validación...');
    } else {
        showModal('No se encontró formulario de login. ¿Ya está logueado?');
        await new Promise(r => setTimeout(r, 2000));
        hideModal();
        return false;
    }
    
    let exitoso = false;
    for(let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        if(document.body.innerText.includes('Panel Principal')) {
            exitoso = true;
            break;
        }
    }
    
    hideModal();
    return exitoso;
}

// Mantener listener legacy para compatibilidad
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.action === 'iniciar_login_licitacion') {
        loginAutomatizado(request.user, request.pass).then(success => {
            sendResponse({ status: success ? 'login_ok' : 'login_fail' });
        });
        return true;
    }
});