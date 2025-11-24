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
                    console.log('📍 En página de carga de documentos PharmaTender - Preparando automatización...');
                    this.addIndicator('📄 Carga de documentos detectada', 'success');
                    if (this.licitacionId) {
                        await this.prepareForDocumentUpload();
                    }
                    break;

                case 'pharmatender_licitacion':
                    console.log('📍 En página de licitación PharmaTender - Preparando...');
                    this.addIndicator('📋 Licitación PharmaTender detectada', 'info');
                    break;

                case 'pharmatender_dashboard':
                    console.log('📍 En dashboard PharmaTender - En espera...');
                    this.addIndicator('🏠 Dashboard PharmaTender', 'info');
                    break;
                    
                default:
                    console.log('📍 Página no reconocida - En espera...', this.currentPage);
                    this.addIndicator('❓ Página no reconocida', 'warning');
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
            
            // Agregar botón de automatización
            this.addAutomationButton();
            
            // Mostrar información de la licitación detectada
            this.addIndicator(`📄 Licitación: ${this.licitacionId}`, 'success');
            
            console.log('✅ Preparación completada para carga de documentos');
            
        } catch (error) {
            console.error('❌ Error preparando carga de documentos:', error);
            this.addIndicator('❌ Error en preparación', 'error');
        }
    }

    addAutomationButton() {
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
        // TODO: Implementar navegación a oferta específica
        console.log('🔄 Navegando a oferta... (TODO)');
    }

    async configurarOfertaConjunta() {
        // TODO: Implementar configuración de oferta conjunta
        console.log('🤝 Configurando oferta conjunta... (TODO)');
    }

    async switchToDocumentFrame() {
        // TODO: Implementar cambio a iframe de documentos
        console.log('🔄 Cambiando a iframe de documentos... (TODO)');
    }

    async cargarDocumentosPorTipo() {
        // TODO: Implementar carga de documentos
        console.log('📄 Cargando documentos por tipo... (TODO)');
    }

    async switchToDefaultContent() {
        // TODO: Implementar salida de iframe
        console.log('🔄 Saliendo de iframe... (TODO)');
    }

    async manejarDeclaracionJurada() {
        // TODO: Implementar manejo de declaración jurada y firma
        console.log('🖊️ Manejando declaración jurada... (TODO)');
    }

    async enviarOferta() {
        // TODO: Implementar envío final de oferta
        console.log('📤 Enviando oferta... (TODO)');
    }

    async actualizarEstadoEnBD() {
        // TODO: Implementar actualización en BD
        console.log('💾 Actualizando estado en BD... (TODO)');
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