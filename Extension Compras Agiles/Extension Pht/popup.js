class ProfessionalMPAutomation {
    constructor() {
        this.platformUrl = '';
        this.isAuthenticated = false;
        this.userInfo = null;
        this.hasCredentials = false;
        this.isLoading = false;
        this.compraAgilId = null;
        this.organizationData = null;
        this.cotizacionData = null;
        this.isExtensionActive = true;
        this.estadoCompraAgil = null; // ✅ NUEVO
        this.compraAgilCancelada = false; // ✅ NUEVO
        this.smartFlow = new SmartAutomationFlow(this);
        window.debugUtils = DebugUtilities;
        this.init();
    }
    
    // Función para formatear números como moneda chilena
    formatCurrency(amount) {
        const number = parseFloat(amount) || 0;
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    }
    
    // Función para formatear números con separador de miles
    formatNumber(number) {
        return new Intl.NumberFormat('es-CL').format(parseFloat(number) || 0);
    }
    
    async init() {
        console.log('🎨 Inicializando popup profesional...');
        
        try {
            this.setupEventListeners();
            await this.detectPlatformUrl();
            await this.extractCompraAgilId();
            // ✅ NUEVO: Verificar si hay estado cancelado guardado
            await this.checkEstadoCancelado();
            await this.checkPlatformAuth();
           
            await this.checkPlatformAuth();
            // *** CAMBIO: Solo obtener cotización si hay ID Y está autenticado ***
             if (this.compraAgilId && this.isAuthenticated && !this.compraAgilCancelada) {
                await this.fetchCotizacionData(this.compraAgilId);
            }
            await this.checkSavedCredentials();
            await this.loadExtensionState();
            this.updateUI();
            
            console.log('✅ Popup profesional listo');
        } catch (error) {
            console.error('❌ Error inicializando popup:', error);
            this.showError('Error de inicialización');
        }
    }
    // ✅ NUEVA FUNCIÓN: Verificar estado cancelado
    async checkEstadoCancelado() {
        if (!this.compraAgilId) return;
        
        try {
            const result = await chrome.storage.local.get([
                'compraAgilEstadoCancelado',
                `compraAgil_${this.compraAgilId}_cancelada`
            ]);
            
            // Verificar estado específico de esta cotización
            const estadoEspecifico = result[`compraAgil_${this.compraAgilId}_cancelada`];
            
            if (estadoEspecifico && estadoEspecifico.cancelada) {
                const age = Date.now() - estadoEspecifico.timestamp;
                
                // Si es reciente (menos de 1 hora), considerarlo válido
                if (age < 60 * 60 * 1000) {
                    this.compraAgilCancelada = true;
                    this.estadoCompraAgil = estadoEspecifico.estado;
                    
                    console.log('❌ Compra Ágil detectada como cancelada:', estadoEspecifico);
                    this.mostrarEstadoCancelado();
                    return;
                }
            }
            
            // Verificar estado general reciente
            if (result.compraAgilEstadoCancelado) {
                const estadoGeneral = result.compraAgilEstadoCancelado;
                const age = Date.now() - estadoGeneral.timestamp;
                
                if (age < 10 * 60 * 1000 && estadoGeneral.cotizacion === this.compraAgilId) {
                    this.compraAgilCancelada = true;
                    this.estadoCompraAgil = estadoGeneral.estado;
                    
                    console.log('❌ Compra Ágil cancelada (reciente):', estadoGeneral);
                    this.mostrarEstadoCancelado();
                }
            }
            
        } catch (error) {
            console.error('❌ Error verificando estado cancelado:', error);
        }
    }
    
    // ✅ NUEVA FUNCIÓN: Mostrar estado cancelado en UI
    mostrarEstadoCancelado() {
        // Ocultar secciones normales
        document.getElementById('itemsSection').style.display = 'none';
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('manualInputSection').style.display = 'none';
        document.getElementById('noDataState').style.display = 'none';
        
        // Mostrar tarjeta de cotización con estado cancelado
        const cotizationCard = document.getElementById('cotizationCard');
        cotizationCard.style.display = 'block';
        
        // Cambiar color del header a gris/rojo para indicar cancelación
        cotizationCard.style.background = 'linear-gradient(135deg, #6c757d, #495057)';
        
        // Llenar datos básicos
        document.getElementById('cotizationId').textContent = this.compraAgilId;
        document.getElementById('cotizationTotal').textContent = 'CANCELADA';
        
        // Mostrar estado en los detalles
        document.getElementById('clientName').textContent = 'Estado Cancelado';
        document.getElementById('userName').textContent = this.estadoCompraAgil || 'Cancelada';
        document.getElementById('orgName').textContent = 'No Disponible';
        document.getElementById('dueDate').textContent = 'N/A';
        
        // Mostrar mensaje de estado cancelado
        this.mostrarMensajeCancelado();
        
        // Actualizar credenciales section
        this.updateCredentialsSection();
    }

    
    async detectPlatformUrl() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.url) {
                const url = new URL(tab.url);
                
                if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
                    this.platformUrl = `http://${url.hostname}${url.port ? ':' + url.port : ''}/prime_2020_02_clean/public`;
                } else if (url.hostname.includes('pharmatender.cl')) {
                    this.platformUrl = 'https://prime.pharmatender.cl';
                } else {
                    this.platformUrl = 'https://prime.pharmatender.cl';
                }
            }
            
        } catch (error) {
            console.error('❌ Error detectando plataforma:', error);
            this.platformUrl = 'https://prime.pharmatender.cl';
        }
    }
    // ✅ NUEVA FUNCIÓN: Mostrar mensaje de cancelación
    mostrarMensajeCancelado() {
        const estadoCanceladoSection = document.createElement('div');
        estadoCanceladoSection.id = 'estadoCanceladoSection';
        estadoCanceladoSection.innerHTML = `
            <div style="
                padding: 20px 16px;
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 8px;
                margin: 16px;
                text-align: center;
            ">
                <div style="
                    font-size: 48px;
                    margin-bottom: 12px;
                    opacity: 0.7;
                ">❌</div>
                <div style="
                    font-size: 16px;
                    font-weight: 700;
                    color: #721c24;
                    margin-bottom: 8px;
                ">Compra Ágil Cancelada</div>
                <div style="
                    font-size: 13px;
                    color: #721c24;
                    line-height: 1.5;
                    margin-bottom: 16px;
                ">
                    Estado detectado: <strong>${this.estadoCompraAgil || 'Cancelada'}</strong><br>
                    La automatización no puede continuar
                </div>
                <button id="limpiarEstadoBtn" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    🗑️ Limpiar Estado
                </button>
            </div>
        `;
        
        // Insertar después de la cotization card
        const cotizationCard = document.getElementById('cotizationCard');
        cotizationCard.parentNode.insertBefore(estadoCanceladoSection, cotizationCard.nextSibling);
        
        // Event listener para limpiar estado
        document.getElementById('limpiarEstadoBtn').addEventListener('click', () => {
            this.limpiarEstadoCancelado();
        });
    }

    // ✅ NUEVA FUNCIÓN: Limpiar estado cancelado
    async limpiarEstadoCancelado() {
        try {
            // Limpiar storage
            await chrome.storage.local.remove([
                'compraAgilEstadoCancelado',
                `compraAgil_${this.compraAgilId}_cancelada`
            ]);
            
            // Reset flags
            this.compraAgilCancelada = false;
            this.estadoCompraAgil = null;
            
            // Remover sección de cancelado
            const estadoCanceladoSection = document.getElementById('estadoCanceladoSection');
            if (estadoCanceladoSection) {
                estadoCanceladoSection.remove();
            }
            
            // Reinicializar popup
            console.log('🔄 Reinicializando popup después de limpiar estado...');
            
            // Recargar datos si es necesario
            if (this.compraAgilId && this.isAuthenticated) {
                await this.fetchCotizacionData(this.compraAgilId);
            } else {
                this.showNoData();
            }
            
            this.updateUI();
            
            console.log('✅ Estado cancelado limpiado');
            
        } catch (error) {
            console.error('❌ Error limpiando estado cancelado:', error);
            this.showError('Error limpiando estado cancelado');
        }
    }
    async extractCompraAgilId() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.url) {
                const url = tab.url;
                
                const patterns = [
                    /carga-documentos-ca\/([^\/\?#]+)/,
                    /resumen-cotizacion\/([^\/\?#]+)/,
                    /cotizacion\/([^\/\?#]+)/
                ];
                
                for (const pattern of patterns) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        this.compraAgilId = match[1];
                        console.log(`🎯 Cotización detectada con patrón ${pattern}: ${this.compraAgilId}`);
                        
                        await this.fetchCotizacionData(this.compraAgilId);
                        return;
                    }
                }
                
                this.compraAgilId = null;
                console.log('ℹ️ No se detectó cotización en la URL actual');
                this.showNoData();
            }
            
        } catch (error) {
            console.error('❌ Error extrayendo Compra Ágil:', error);
            this.compraAgilId = null;
            this.showNoData();
        }
    }
    
    async checkPlatformAuth() {
        try {
            const response = await fetch(`${this.platformUrl}/api/extension/check-auth`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.authenticated) {
                    this.isAuthenticated = true;
                    this.userInfo = data.user;
                    await this.fetchOrganizationData();
                    this.updateAuthStatus(true);
                } else {
                    this.isAuthenticated = false;
                    this.updateAuthStatus(false);
                }
            } else {
                this.isAuthenticated = false;
                this.updateAuthStatus(false);
            }
            
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            this.isAuthenticated = false;
            this.updateAuthStatus(false);
        }
    }
    // *** MODIFICAR checkPlatformAuth para obtener organización primero ***
    async checkPlatformAuth() {
        try {
            const response = await fetch(`${this.platformUrl}/api/extension/check-auth`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.authenticated) {
                    this.isAuthenticated = true;
                    this.userInfo = data.user;
                    
                    // *** CAMBIO: Obtener datos de organización INMEDIATAMENTE ***
                    await this.fetchOrganizationData();
                    
                    this.updateAuthStatus(true);
                } else {
                    this.isAuthenticated = false;
                    this.updateAuthStatus(false);
                }
            } else {
                this.isAuthenticated = false;
                this.updateAuthStatus(false);
            }
            
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            this.isAuthenticated = false;
            this.updateAuthStatus(false);
        }
    }
    // *** MODIFICAR fetchOrganizationData para actualizar UI automáticamente ***
    async fetchOrganizationData() {
        try {
            console.log('🔍 Obteniendo organization data desde:', `${this.platformUrl}/api/extension/organization-data`);
            
            const response = await fetch(`${this.platformUrl}/api/extension/organization-data`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            console.log('📡 Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Organization response completa:', data);
                
                if (data.success) {
                    this.organizationData = data.organization;
                    console.log('✅ Organization data guardada:', this.organizationData);
                    
                    // *** NUEVO: Actualizar UI automáticamente cuando llegan los datos ***
                    this.refreshDisplayWithOrganizationData();
                } else {
                    console.warn('⚠️ API retornó success=false:', data);
                }
            } else {
                console.error('❌ Error en response:', response.status, response.statusText);
            }
            
        } catch (error) {
            console.error('❌ Error obteniendo organización:', error);
        }
    }

        
    async fetchCotizacionData(cotizacionId) {
        if (!cotizacionId) return null;
        
        try {
            console.log(`📊 Obteniendo datos de cotización: ${cotizacionId}...`);
            
            const response = await fetch(`${this.platformUrl}/api/extension/cotizacion-data/${cotizacionId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.cotizacionData = data.data;
                    this.displayCotizationData();
                    return data.data;
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Error obteniendo datos de cotización:', error);
            this.showError('Error obteniendo datos de cotización');
            return null;
        }
    }
    
    async checkSavedCredentials() {
        try {
            const stored = await chrome.storage.local.get(['mpUsername', 'mpPassword']);
            
            if (stored.mpUsername && stored.mpPassword) {
                this.hasCredentials = true;
            } else {
                this.hasCredentials = false;
            }
            
            // Actualizar display de credenciales
            this.updateCredentialsDisplay();
            
        } catch (error) {
            console.error('❌ Error verificando credenciales:', error);
            this.hasCredentials = false;
        }
    }
    
    async loadExtensionState() {
        try {
            const stored = await chrome.storage.local.get(['extensionActive']);
            this.isExtensionActive = stored.extensionActive !== false;
            
            const toggle = document.getElementById('powerToggle');
            const statusBadge = document.querySelector('.status-badge');
            
            if (this.isExtensionActive) {
                toggle.classList.add('active');
                statusBadge.innerHTML = '<div class="status-indicator"></div>Sistema Activo';
                statusBadge.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            } else {
                toggle.classList.remove('active');
                statusBadge.innerHTML = '<div class="status-indicator"></div>Sistema Desactivado';
                statusBadge.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            }
        } catch (error) {
            this.isExtensionActive = true;
        }
    }
    
    displayCotizationData() {
        if (!this.cotizacionData) {
            this.showNoData();
            return;
        }
        if (this.compraAgilCancelada) {
            this.mostrarEstadoCancelado();
            return;
        }
        const data = this.cotizacionData;
        
        // Ocultar estado sin datos
        document.getElementById('noDataState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('manualInputSection').style.display = 'none';
        
        // Mostrar tarjeta de cotización
        const cotizationCard = document.getElementById('cotizationCard');
        cotizationCard.style.display = 'block';
        
        // Llenar datos básicos
        document.getElementById('cotizationId').textContent = data.cotizacion;
        
        const totalAmount = data.totales?.total || 0;
        document.getElementById('cotizationTotal').textContent = this.formatCurrency(totalAmount);
        
        document.getElementById('clientName').textContent = data.cliente?.nombre || 'N/A';
        document.getElementById('userName').textContent = data.usuario?.nombre || 'N/A';
        // *** DEBUG: Agregar logs para diagnosticar ***
        console.log('🔍 DEBUG - Organization Data:', this.organizationData);
        console.log('🔍 DEBUG - Cliente nombre:', data.cliente?.nombre);
        console.log('🔍 DEBUG - Organization nombre_unidad:', this.organizationData?.nombre_unidad);
        // *** CORRECCIÓN: Lógica más estricta para organización ***
        let orgName = 'N/A';
        
        if (this.organizationData && this.organizationData.nombre_unidad) {
            orgName = this.organizationData.nombre_unidad;
            console.log('✅ Usando nombre_unidad:', orgName);
        } else {
            console.warn('⚠️ organizationData no disponible o sin nombre_unidad');
            console.log('   - organizationData existe:', !!this.organizationData);
            console.log('   - tiene nombre_unidad:', !!this.organizationData?.nombre_unidad);
            
            // Solo como último recurso usar cliente
            orgName = data.cliente?.nombre || 'N/A';
            console.log('⚠️ Usando fallback cliente.nombre:', orgName);
        }
    
        document.getElementById('orgName').textContent = orgName;
        
        if (data.postulacion?.fecha_vencimiento) {
            const dueDate = new Date(data.postulacion.fecha_vencimiento);
            document.getElementById('dueDate').textContent = dueDate.toLocaleDateString('es-CL');
        }
        
        // *** MOSTRAR RESUMEN DE ITEMS EN EL HEADER ***
        if (data.stats) {
            document.getElementById('totalItemsCount').textContent = this.formatNumber(data.stats.total_items_licitacion || 0);
            document.getElementById('specificItemsCount').textContent = this.formatNumber(data.stats.specific_items || 0);
            document.getElementById('defaultItemsCount').textContent = this.formatNumber(data.automatizacion.valor_default || 0);
            
            // Mostrar el badge
            document.getElementById('itemsSummaryBadge').style.display = 'flex';
        }
        
        // Mostrar items si hay datos
        if (data.automatizacion?.items_precios?.length > 0) {
            this.displayItemsProfessional(data.automatizacion.items_precios, data.automatizacion.valor_default, data.stats);
        }
        
        // Mostrar sección de botón
        document.getElementById('summarySection').style.display = 'block';
    }

    displayItemsProfessional(items, defaultValue = 1, stats) {
        const itemsSection = document.getElementById('itemsSection');
        const itemsGrid = document.getElementById('itemsGrid');
        
        itemsSection.style.display = 'block';
        itemsGrid.innerHTML = '';
        
        // Mostrar items con precios específicos
        items.forEach((item, index) => {
            const subtotal = parseFloat(item.precio || 0) * parseFloat(item.cantidad || 1);
            
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card-professional';
            itemCard.innerHTML = `
                <div class="item-header-professional">
                    <div class="item-number-badge">#${item.item_pht}</div>
                    <div class="item-status-badge">Específico</div>
                </div>
                <div class="item-details-grid">
                    <div class="item-detail">
                        <span class="detail-label-pro">Cant.</span>
                        <span class="detail-value-pro">${this.formatNumber(item.cantidad || 1)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="detail-label-pro">Unit.</span>
                        <span class="detail-value-currency">${this.formatCurrency(item.precio || 0)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="detail-label-pro">Total</span>
                        <span class="detail-value-total">${this.formatCurrency(subtotal)}</span>
                    </div>
                </div>
                <div class="item-description-professional">
                    ${item.descripcion || 'Sin descripción disponible'}
                </div>
            `;
            itemsGrid.appendChild(itemCard);
        });
        
        // Mostrar items con valor por defecto si hay
        if (stats && stats.default_items > 0) {
            const defaultCard = document.createElement('div');
            defaultCard.className = 'item-card-default';
            defaultCard.innerHTML = `
                <div class="item-header-default">
                    <div class="default-badge">Restantes</div>
                    <div class="item-status-badge default-status">Default</div>
                </div>
                <div class="item-details-grid">
                    <div class="item-detail">
                        <span class="detail-label-pro">Items</span>
                        <span class="detail-value-pro">${this.formatNumber(stats.default_items)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="detail-label-pro">Unit.</span>
                        <span class="detail-value-currency">${this.formatCurrency(defaultValue)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="detail-label-pro">Subtotal</span>
                        <span class="detail-value-total">${this.formatCurrency(stats.default_items * defaultValue)}</span>
                    </div>
                </div>
                <div class="item-description-professional">
                    ${this.formatNumber(stats.default_items)} items restantes se cotizarán automáticamente con valor unitario de ${this.formatCurrency(defaultValue)}
                </div>
            `;
            itemsGrid.appendChild(defaultCard);
        }
    }

    toggleExtension() {
        this.isExtensionActive = !this.isExtensionActive;
        const toggle = document.getElementById('powerToggle');
        const statusBadge = document.querySelector('.status-badge');
        
        if (this.isExtensionActive) {
            toggle.classList.add('active');
            statusBadge.innerHTML = '<div class="status-indicator"></div>Sistema Activo';
            statusBadge.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
        } else {
            toggle.classList.remove('active');
            statusBadge.innerHTML = '<div class="status-indicator"></div>Sistema Desactivado';
            statusBadge.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        }
        
        chrome.storage.local.set({ extensionActive: this.isExtensionActive });
        this.updateUI();
    }
// ✅ REEMPLAZAR tu handleAction() completo con esto:
async handleAction() {
   if (!this.isExtensionActive) {
       this.showError('La extensión está desactivada. Actívala usando el toggle superior.');
       return;
   }
   if (this.compraAgilCancelada) {
       this.showError(`Compra Ágil cancelada: ${this.estadoCompraAgil || 'Estado no disponible'}`);
       return;
   }
   
   if (this.isLoading) return;
   
   const button = document.getElementById('actionButton');
   const buttonManual = document.getElementById('actionButtonManual');
   const originalText = button ? button.innerHTML : '';
   const originalTextManual = buttonManual ? buttonManual.innerHTML : '';
   
   try {
       this.isLoading = true;
       if (button) button.disabled = true;
       if (buttonManual) buttonManual.disabled = true;
       
       if (!this.isAuthenticated) {
           this.updateButtonText('🔄 Abriendo PharmaTender...');
           await chrome.tabs.create({ url: `${this.platformUrl}/login` });
           return;
       }
       
       if (!this.hasCredentials) {
           this.showCredentialsModal();
           return;
       }
       
       const credentials = await this.getCredentials();
       if (!credentials) {
           this.showCredentialsModal();
           return;
       }
       
       this.updateButtonText('🚀 Iniciando automatización...');
       
       const finalCompraAgilId = this.getFinalCompraAgilId();
       
       // *** NUEVA LÓGICA: Usar Smart Flow ***
       this.updateButtonText('🧠 Analizando estrategia...');
       
       const strategy = await this.smartFlow.determineOptimalStrategy(finalCompraAgilId);
       
       console.log('📋 ESTRATEGIA DETERMINADA:', strategy);
     
       let cotizacionDataCompleta = this.cotizacionData;
       if (finalCompraAgilId && !cotizacionDataCompleta) {
           this.updateButtonText('🔄 Obteniendo datos cotización...');
           cotizacionDataCompleta = await this.fetchCotizacionData(finalCompraAgilId);
           
           if (!cotizacionDataCompleta) {
               throw new Error('No se pudieron obtener datos de la cotización');
           }
       }
       
       const automationData = {
           credentials: credentials,
           compraAgilId: finalCompraAgilId,
           shouldGoToCompraAgil: !!finalCompraAgilId,
           organizationData: this.organizationData,
           cotizacionData: cotizacionDataCompleta
       };

       // ✅ NUEVO: Crear autorización temporal ANTES de ejecutar estrategia
       await this.crearAutorizacionTemporal(finalCompraAgilId);
       this.updateButtonText('🚀 Ejecutando Postulacion...');

       // ✅ EJECUTAR ESTRATEGIA (esto ya maneja todo)
       const result = await this.smartFlow.executeStrategy(strategy, automationData);
       console.log('✅ SMART FLOW RESULT:', result);
       
       this.updateButtonText('✅ ¡Automatización iniciada!');
       
       // ✅ ELIMINAR toda la "PRUEBA DIRECTA" - Ya no es necesaria
       // ❌ COMENTAR/ELIMINAR estas líneas (54-67 de tu código):
       /*
       console.log('🧪 PRUEBA DIRECTA: Enviando mensaje...');
       const tabs = await chrome.tabs.query({ url: "https://compra-agil.mercadopublico.cl/*" });
       console.log('🔍 Pestañas de CA encontradas:', tabs.length);
       if (tabs.length > 0) {
           const targetTab = tabs[tabs.length - 1];
           console.log('🎯 Enviando a tab:', targetTab.id, targetTab.url);
           setTimeout(() => {
               chrome.tabs.sendMessage(targetTab.id, {
                   action: 'startCompraAgilAutomation',
                   data: cotizacionDataCompleta
               }, (response) => {
                   console.log('📨 RESPUESTA DIRECTA:', response);
                   if (chrome.runtime.lastError) {
                       console.error('❌ ERROR DIRECTO:', chrome.runtime.lastError.message);
                   }
               });
           }, 3000);
       }
       */
       
       // ✅ CERRAR POPUP RÁPIDAMENTE
       setTimeout(() => {
           window.close();
       }, 1500);
       
   } catch (error) {
       console.error('❌ Error:', error);
       this.showError(`Error: ${error.message}`);
       this.updateButtonText(originalText, originalTextManual);
   } finally {
       this.isLoading = false;
       if (button) button.disabled = false;
       if (buttonManual) buttonManual.disabled = false;
   }
}
    
    getFinalCompraAgilId() {
        const manualInput = document.getElementById('manualCompraAgilId');
        if (manualInput && manualInput.value.trim()) {
            return manualInput.value.trim();
        }
        return this.compraAgilId;
    }
    
    updateButtonText(text, textManual = null) {
        const button = document.getElementById('actionButton');
        const buttonManual = document.getElementById('actionButtonManual');
        
        if (button) button.innerHTML = text;
        if (buttonManual) buttonManual.innerHTML = textManual || text;
    }
    
    async prepareAndSaveCompleteAutomationData(credentials, compraAgilId, cotizacionData) {
        const automationData = {
            credentials: credentials,
            compraAgilId: compraAgilId,
            shouldGoToCompraAgil: !!compraAgilId,
            organizationData: this.organizationData,
            cotizacionData: cotizacionData,
            timestamp: Date.now(),
            status: 'ready',
            source: 'popup'
        };
        
        await chrome.storage.local.set({ 
            mpAutomationData: automationData 
        });
        
        if (compraAgilId && cotizacionData) {
            await chrome.storage.local.set({
                compraAgilAutomationData: {
                    cotizacion: compraAgilId,
                    data: cotizacionData,
                    timestamp: Date.now(),
                    source: 'popup'
                }
            });
        }
    }
    
    async openMercadoPublicoTab() {
        const mpTab = await chrome.tabs.create({ 
            url: 'https://www.mercadopublico.cl/Home',
            active: true 
        });
        
        setTimeout(() => {
            chrome.tabs.sendMessage(mpTab.id, {
                action: 'startAutomation',
                data: null
            }, (response) => {
                // Silent fallback
            });
        }, 3000);
    }
    // ✅ NUEVA FUNCIÓN: Crear autorización temporal
async crearAutorizacionTemporal(cotizacionId) {
    try {
        const authorization = {
            cotizacion: cotizacionId,  // ✅ ESTO es lo que faltaba
            timestamp: Date.now(),
            authorized: true,
            expiresInMinutes: 5
        };
        
        await chrome.storage.local.set({ userAuthorization: authorization });
        console.log('✅ Autorización temporal creada para:', cotizacionId);
        
        // Auto-limpiar después de 5 minutos
        setTimeout(async () => {
            await chrome.storage.local.remove(['userAuthorization']);
            console.log('🗑️ Autorización expirada automáticamente');
        }, 5 * 60 * 1000);
        
    } catch (error) {
        console.error('❌ Error creando autorización:', error);
        throw new Error('No se pudo crear autorización temporal');
    }
}
    async getCredentials() {
        const stored = await chrome.storage.local.get(['mpUsername', 'mpPassword']);
        
        if (stored.mpUsername && stored.mpPassword) {
            return {
                username: stored.mpUsername,
                password: stored.mpPassword
            };
        }
        
        return null;
    }

    showCredentialsModal() {
        document.getElementById('credentialsModal').style.display = 'flex';
        
        chrome.storage.local.get(['mpUsername']).then(stored => {
            if (stored.mpUsername) {
                document.getElementById('mpUsername').value = stored.mpUsername;
            }
        });
    }

    hideCredentialsModal() {
        document.getElementById('credentialsModal').style.display = 'none';
    }

    async saveCredentials() {
        const username = document.getElementById('mpUsername').value.trim();
        const password = document.getElementById('mpPassword').value.trim();
        
        if (!username) {
            this.showError('El RUT es obligatorio');
            return;
        }
        
        try {
            let finalPassword = password;
            
            if (!password) {
                const stored = await chrome.storage.local.get(['mpPassword']);
                if (stored.mpPassword) {
                    finalPassword = stored.mpPassword;
                } else {
                    this.showError('La contraseña es obligatoria');
                    return;
                }
            }
            
            await chrome.storage.local.set({ 
                mpUsername: username, 
                mpPassword: finalPassword 
            });
            
            this.hasCredentials = true;
            this.hideCredentialsModal();
            this.updateUI();
            this.updateCredentialsDisplay();
            
            document.getElementById('mpPassword').value = '';
            document.getElementById('mpPassword').placeholder = 'Tu contraseña de MP';
            
            console.log('✅ Credenciales guardadas/actualizadas correctamente');
            
        } catch (error) {
            console.error('Error guardando credenciales:', error);
            this.showError('Error guardando credenciales');
        }
    }

    updateAuthStatus(authenticated) {
        const statusBadge = document.querySelector('.status-badge');
        
        if (authenticated && this.userInfo) {
            const brandInfo = document.querySelector('.brand-info span');
            brandInfo.textContent = `Conectado como ${this.userInfo.name}`;
        }
        
        this.updateCredentialsSection();
    }
    
    updateCredentialsSection() {
        const credentialsSection = document.getElementById('credentialsManagement');
        
        if (this.isAuthenticated && credentialsSection) {
            credentialsSection.style.display = 'block';
            this.updateCredentialsDisplay();
        } else if (credentialsSection) {
            credentialsSection.style.display = 'none';
        }
    }
    
    showNoData() {

        if (this.compraAgilCancelada) {
            this.mostrarEstadoCancelado();
            return;
        }
        // Ocultar secciones de datos
        document.getElementById('cotizationCard').style.display = 'none';
        document.getElementById('itemsSection').style.display = 'none';
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        
        // Mostrar estado sin datos y input manual
        document.getElementById('manualInputSection').style.display = 'block';
        document.getElementById('noDataState').style.display = 'block';
        
        this.updateCredentialsSection();
    }

    updateUI() {
        const button = document.getElementById('actionButton');
        const buttonManual = document.getElementById('actionButtonManual');
        
        const updateButton = (btn) => {
            if (!btn) return;
            // ✅ NUEVO: Verificar si está cancelada
            if (this.compraAgilCancelada) {
                btn.innerHTML = '❌ Compra Ágil Cancelada';
                btn.disabled = true;
                btn.style.background = '#6c757d';
                btn.title = `Estado: ${this.estadoCompraAgil || 'Cancelada'}`;
                return;
            }
            if (!this.isExtensionActive) {
                btn.innerHTML = '⚠️ Extensión Desactivada';
                btn.disabled = true;
                btn.style.background = '#95a5a6';
                return;
            }
            
            btn.disabled = false;
            btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            
            if (!this.isAuthenticated) {
                btn.innerHTML = '🔑 Iniciar Sesión en PharmaTender';
            } else if (!this.hasCredentials) {
                btn.innerHTML = '🗝️ Configurar Credenciales MP';
            } else {
                let actionText = '🚀 Iniciar Login MP';
                
                if (btn.id === 'actionButton' && this.compraAgilId && this.cotizacionData) {
                    const itemCount = this.cotizacionData.automatizacion?.items_precios?.length || 0;
                    actionText += ` + CA (${itemCount} precios)`;
                } else if (btn.id === 'actionButton' && this.compraAgilId) {
                    actionText += ' + Compra Ágil';
                }
                
                if (btn.id === 'actionButtonManual') {
                    const manualInput = document.getElementById('manualCompraAgilId');
                    if (manualInput && manualInput.value.trim()) {
                        actionText += ' + CA Manual';
                    }
                }
                
                btn.innerHTML = actionText;
            }
        };
        
        if (button) updateButton(button);
        if (buttonManual) updateButton(buttonManual);
    }

    showError(message) {
        const errorState = document.getElementById('errorState');
        errorState.innerHTML = `<strong>⚠️ ${message}</strong>`;
        errorState.style.display = 'block';
        
        setTimeout(() => {
            errorState.style.display = 'none';
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async editCredentials() {
        try {
            const stored = await chrome.storage.local.get(['mpUsername', 'mpPassword']);
            
            if (stored.mpUsername) {
                document.getElementById('mpUsername').value = stored.mpUsername;
            }
            
            document.getElementById('mpPassword').placeholder = stored.mpPassword ? 'Mantener contraseña actual' : 'Nueva contraseña';
            
            this.showCredentialsModal();
            
        } catch (error) {
            console.error('Error cargando credenciales para edición:', error);
            this.showCredentialsModal();
        }
    }
    
    async deleteCredentials() {
        if (confirm('¿Estás seguro de que quieres eliminar las credenciales guardadas?')) {
            try {
                await chrome.storage.local.remove(['mpUsername', 'mpPassword']);
                
                this.hasCredentials = false;
                this.updateUI();
                this.updateCredentialsDisplay();
                
                console.log('✅ Credenciales eliminadas correctamente');
                
            } catch (error) {
                console.error('Error eliminando credenciales:', error);
                this.showError('Error eliminando credenciales');
            }
        }
    }
    
    async updateCredentialsDisplay() {
        try {
            const stored = await chrome.storage.local.get(['mpUsername']);
            const currentUsernameElement = document.getElementById('currentUsername');
            
            if (currentUsernameElement) {
                if (stored.mpUsername) {
                    currentUsernameElement.textContent = stored.mpUsername;
                } else {
                    currentUsernameElement.textContent = 'No configurado';
                }
            }
            
        } catch (error) {
            console.error('Error actualizando display de credenciales:', error);
        }
    }
    // ✅ AGREGAR al final de la clase ProfessionalMPAutomation en popup.js
    refreshDisplayWithOrganizationData() {
        console.log('🔄 Refrescando display con datos de organización...');
        
        if (this.cotizacionData) {
            this.displayCotizationData();
        }
        
        this.updateUI();
    }
    setupEventListeners() {
        document.getElementById('powerToggle').addEventListener('click', () => {
            this.toggleExtension();
        });

        document.getElementById('actionButton').addEventListener('click', () => {
            this.handleAction();
        });

        const actionButtonManual = document.getElementById('actionButtonManual');
        if (actionButtonManual) {
            actionButtonManual.addEventListener('click', () => {
                this.handleAction();
            });
        }

        document.getElementById('saveCredentials').addEventListener('click', () => {
            this.saveCredentials();
        });

        document.getElementById('cancelCredentials').addEventListener('click', () => {
            this.hideCredentialsModal();
        });

        const editBtn = document.getElementById('editCredentialsBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editCredentials();
            });
        }

        const deleteBtn = document.getElementById('deleteCredentialsBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteCredentials();
            });
        }

        document.getElementById('credentialsModal').addEventListener('click', (e) => {
            if (e.target.id === 'credentialsModal') {
                this.hideCredentialsModal();
            }
        });

        const manualInput = document.getElementById('manualCompraAgilId');
        if (manualInput) {
            manualInput.addEventListener('input', () => {
                this.updateUI();
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.professionalMPAutomation = new ProfessionalMPAutomation();
        console.log('✅ Professional MP Automation initialized');
    } catch (error) {
        console.error('❌ Error initializing Professional MP Automation:', error);
    }
});

// *** NUEVA CLASE: SmartAutomationFlow en popup.js ***

class SmartAutomationFlow {
    constructor(automationInstance) {
        this.automation = automationInstance;
        this.testResults = {
            canAccessCompraAgil: false,
            needsLogin: false,
            finalStrategy: null
        };
    }
    
    /**
     * Función principal que determina la estrategia óptima
     */
   // ✅ BUSCAR EN popup.js y MODIFICAR determineOptimalStrategy:
    async determineOptimalStrategy(compraAgilId) {
    console.log('🧠 SMART FLOW: Comenzando Postulación...');
    
    if (!compraAgilId) {
        return {
            strategy: 'LOGIN_ONLY',
            url: 'https://www.mercadopublico.cl/Home',
            reason: 'No hay ID de Compra Ágil'
        };
    }
    
    // ✅ NUEVO: Test rápido del Portal ANTES de ir directo a CA
    try {
        console.log('🏢 INICIANDO quickPortalTest...');

        const portalTest = await this.quickPortalTest();

        const strategy = {
            strategy: 'DIRECT_CA',
            url: `https://compra-agil.mercadopublico.cl/resumen-cotizacion/${compraAgilId}`,
            reason: 'Acceso directo a Compra Ágil',
            organizationName: portalTest.organizationName || null
        };
        
        console.log('📋 ESTRATEGIA DETERMINADA:', strategy);
        return strategy;
        
    } catch (error) {
        console.error('❌ Error en test portal:', error);
        // Fallback: estrategia original
        const strategy = {
            strategy: 'DIRECT_CA',
            url: `https://compra-agil.mercadopublico.cl/resumen-cotizacion/${compraAgilId}`,
            reason: 'Acceso directo a Compra Ágil (test bypaseado)'
        };
        return strategy;
    }
}
    
    /**
     * Probar si puede acceder directamente a Compra Ágil
     */
    async testCompraAgilAccess(compraAgilId) {
        try {
            const testUrl = `https://compra-agil.mercadopublico.cl/resumen-cotizacion/${compraAgilId}`;
            console.log(`🔍 SMART FLOW: Probando acceso a ${testUrl}`);
            
            // Crear tab temporal para probar
            const testTab = await chrome.tabs.create({
                url: testUrl,
                active: false // No cambiar focus
            });
            
            // Esperar a que cargue
            await this.waitForTabLoad(testTab.id);
            
            // Verificar la URL final después de redirects
            const finalTab = await chrome.tabs.get(testTab.id);
            const finalUrl = finalTab.url;
            
            console.log(`📍 SMART FLOW: URL final después de test: ${finalUrl}`);
            
            // Cerrar tab de prueba
            await chrome.tabs.remove(testTab.id);
            
            // Analizar resultado
            if (finalUrl.includes('compra-agil.mercadopublico.cl') && 
                finalUrl.includes(compraAgilId)) {
                return {
                    success: true,
                    url: finalUrl,
                    authenticated: true
                };
            }
            
            if (finalUrl.includes('www.mercadopublico.cl/Home') ||
                finalUrl.includes('heimdall.mercadopublico.cl') ||
                finalUrl.includes('accounts.claveunica.gob.cl')) {
                return {
                    success: false,
                    redirectedTo: finalUrl,
                    needsLogin: true
                };
            }
            
            return {
                success: false,
                redirectedTo: finalUrl,
                needsLogin: true
            };
            
        } catch (error) {
            console.error('❌ SMART FLOW: Error probando CA:', error);
            return {
                success: false,
                error: error.message,
                needsLogin: true
            };
        }
    }
    
    /**
     * Verificar estado de login en MP
     */
    async checkMPLoginStatus() {
        try {
            console.log('🔍 SMART FLOW: Verificando estado de login MP...');
            
            const testTab = await chrome.tabs.create({
                url: 'https://www.mercadopublico.cl/Home',
                active: false
            });
            
            await this.waitForTabLoad(testTab.id);
            
            const finalTab = await chrome.tabs.get(testTab.id);
            const finalUrl = finalTab.url;
            
            await chrome.tabs.remove(testTab.id);
            
            console.log(`📍 SMART FLOW: Estado MP - URL final: ${finalUrl}`);
            
            if (finalUrl.includes('/Portal')) {
                return {
                    authenticated: true,
                    needsLogin: false
                };
            }
            
            return {
                authenticated: false,
                needsLogin: true
            };
            
        } catch (error) {
            console.error('❌ SMART FLOW: Error verificando MP:', error);
            return {
                authenticated: false,
                needsLogin: true
            };
        }
    }
    
    /**
     * Esperar a que un tab termine de cargar
     */
    async waitForTabLoad(tabId, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkStatus = async () => {
                try {
                    const tab = await chrome.tabs.get(tabId);
                    
                    if (tab.status === 'complete') {
                        resolve(tab);
                        return;
                    }
                    
                    if (Date.now() - startTime > timeout) {
                        reject(new Error('Timeout esperando carga de tab'));
                        return;
                    }
                    
                    setTimeout(checkStatus, 500);
                } catch (error) {
                    reject(error);
                }
            };
            
            checkStatus();
        });
    }
async quickPortalTest() {
    try {
        console.log('🏢 INICIANDO TEST RÁPIDO DEL PORTAL...');
        
        const portalTab = await chrome.tabs.create({
            url: 'https://www.mercadopublico.cl/Portal/Modules/Menu/Menu.aspx',
            active: false
        });
        
        console.log('📱 Tab del Portal creado:', portalTab.id);
        await this.waitForTabLoad(portalTab.id);
        console.log('✅ Tab del Portal cargado');
        
        let organizationName = null;
        try {
            // ✅ CAMBIAR A chrome.scripting.executeScript (Manifest V3)
            const results = await chrome.scripting.executeScript({
                target: { tabId: portalTab.id },
                func: () => {
                    // Buscar todos los elementos _LblOrganization
                    const orgElements = document.querySelectorAll('#_LblOrganization');
                    console.log('🔍 Elementos _LblOrganization encontrados:', orgElements.length);
                    
                    // Si hay múltiples, buscar el que esté visible/activo
                    for (let i = 0; i < orgElements.length; i++) {
                        const element = orgElements[i];
                        
                        // Verificar si está visible
                        if (element.offsetParent !== null && element.textContent.trim()) {
                            console.log('✅ Elemento activo encontrado:', element.textContent.trim());
                            return element.textContent.trim();
                        }
                    }
                    
                    // Si no encuentra uno activo, usar el primero que tenga contenido
                    if (orgElements.length > 0) {
                        const firstElement = orgElements[0];
                        const text = firstElement.textContent.trim();
                        console.log('📋 Usando primer elemento:', text);
                        return text;
                    }
                    
                    console.log('❌ No se encontró _LblOrganization');
                    return null;
                }
            });
            
            organizationName = results && results[0] && results[0].result ? results[0].result : null;
            console.log('🏢 ORGANIZACIÓN EXTRAÍDA:', organizationName);
        } catch (e) {
            console.warn('⚠️ No se pudo extraer organización:', e);
        }
        
        await chrome.tabs.remove(portalTab.id);
        console.log('🗑️ Tab del Portal cerrado');
        
        return { organizationName };
        
    } catch (error) {
        console.error('❌ Error en quickPortalTest:', error);
        return { organizationName: null };
    }
}
// ✅ 1. POPUP.JS - En executeStrategy (SmartAutomationFlow class), AGREGAR al inicio:
async executeStrategy(strategy, automationData) {
    // ✅ LIMPIAR DATOS ANTIGUOS ANTES DE CREAR NUEVOS
    await chrome.storage.local.remove(['compraAgilCommand', 'compraAgilAutomationData']);
    console.log('🧹 Comandos antiguos limpiados');
    
    console.log(`🚀 SMART FLOW: Ejecutando estrategia ${strategy.strategy}`);
    console.log(`📍 URL objetivo: ${strategy.url}`);
    console.log(`💡 Razón: ${strategy.reason}`);
    
    // Guardar datos de automatización
    await this.saveAutomationData(automationData, strategy);
    
    if (strategy.strategy === 'DIRECT_CA') {
        console.log('🚀 ESTRATEGIA DIRECTA CA - USANDO STORAGE INMEDIATAMENTE');
        
        // ✅ NUEVO: Test del portal solo si no hay organización en strategy
        if (!strategy.organizationName) {
            console.log('🏢 EJECUTANDO TEST PORTAL...');
            try {
                const portalTest = await this.quickPortalTest();
                console.log('🏢 RESULTADO TEST PORTAL:', portalTest);
                
                if (portalTest.organizationName) {
                    await chrome.storage.local.set({ 
                        detectedOrganization: portalTest.organizationName 
                    });
                    console.log(`💾 ORGANIZACIÓN GUARDADA: ${portalTest.organizationName}`);
                }
            } catch (error) {
                console.error('❌ Error en test portal:', error);
            }
        } else {
            // ✅ MANTENER CÓDIGO EXISTENTE: Si ya hay organización, usar esa
            await chrome.storage.local.set({ 
                detectedOrganization: strategy.organizationName 
            });
            console.log(`💾 ORGANIZACIÓN GUARDADA EN STORAGE: ${strategy.organizationName}`);
        }
        
        // ✅ COMANDO FRESCO CON TIMESTAMP ACTUAL
        const command = {
            action: 'startCompraAgilAutomation',
            data: automationData.cotizacionData,
            timestamp: Date.now(), // ✅ TIMESTAMP ACTUAL
            executed: false,
            source: 'smartflow_direct'
        };
        
        await chrome.storage.local.set({ 'compraAgilCommand': command });
        console.log('💾 COMANDO FRESCO GUARDADO:', command);
        
        // Abrir tab
        const tab = await chrome.tabs.create({
            url: strategy.url,
            active: true
        });
        
        console.log('✅ TAB ABIERTO, comando será recogido por content script');
        
        return {
            success: true,
            strategy: strategy.strategy,
            tabId: tab.id,
            method: 'storage'
        };
    } else {
        // Para login...
        const tab = await chrome.tabs.create({
            url: strategy.url,
            active: true
        });
        
        setTimeout(() => {
            this.sendMPLoginCommand(tab.id, automationData);
        }, 2000);
        
        return {
            success: true,
            strategy: strategy.strategy,
            tabId: tab.id,
            method: 'message'
        };
    }
}

    
    /**
     * Guardar datos con información de estrategia
     */
    async saveAutomationData(automationData, strategy) {
        const enhancedData = {
        ...automationData,
        strategy: strategy.strategy,
        targetCA: strategy.targetCA || null,
        timestamp: Date.now(),
        status: 'ready', // ✅ AGREGAR ESTA LÍNEA - Era lo que faltaba
        source: 'smart_popup'
    };
    
    await chrome.storage.local.set({
        mpAutomationData: enhancedData
    });
    
    // Si hay datos de CA, guardarlos también
    if (automationData.cotizacionData && automationData.compraAgilId) {
        await chrome.storage.local.set({
            compraAgilAutomationData: {
                cotizacion: automationData.compraAgilId,
                data: automationData.cotizacionData,
                strategy: strategy.strategy,
                timestamp: Date.now(),
                status: 'ready', // ✅ TAMBIÉN AQUÍ
                source: 'smart_popup'
            }
        });
    }
        console.log('✅ SMART FLOW: Datos de automatización guardados:', enhancedData);
    }   

    /**
     * Enviar comando para automatización de MP (login)
     */
    async sendMPLoginCommand(tabId, data) {
        try {
            chrome.tabs.sendMessage(tabId, {
                action: 'startAutomation',
                data: data
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('⚠️ SMART FLOW: Error enviando comando MP:', chrome.runtime.lastError);
                } else {
                    console.log('✅ SMART FLOW: Comando MP enviado');
                }
            });
        } catch (error) {
            console.error('❌ SMART FLOW: Error enviando comando MP:', error);
        }
    }
    
// ✅ 1. POPUP.JS - REEMPLAZAR sendCompraAgilCommand COMPLETO
// ✅ 4. POPUP.JS - MÉTODO DUAL: Intentar mensaje directo Y storage
async sendCompraAgilCommand(tabId, data) {
    try {
        console.log('📤 ENVIANDO MENSAJE DUAL A TAB:', tabId);
        console.log('📤 DATOS ENVIADOS:', data);
        
        // ✅ MÉTODO 1: Intentar mensaje directo (como antes)
        const tab = await chrome.tabs.get(tabId);
        console.log('📍 TAB VERIFICADO:', tab.url);
        
        chrome.tabs.sendMessage(tabId, {
            action: 'startCompraAgilAutomation',
            data: data.cotizacionData
        }, (response) => {
            console.log('📨 RESPONSE MENSAJE DIRECTO:', response);
            if (chrome.runtime.lastError) {
                console.warn('⚠️ MENSAJE DIRECTO FALLÓ:', chrome.runtime.lastError);
            } else {
                console.log('✅ MENSAJE DIRECTO EXITOSO');
            }
        });
        
        // ✅ MÉTODO 2: TAMBIÉN guardar en storage como backup
        await this.delay(1000);
        
        const command = {
            action: 'startCompraAgilAutomation',
            data: data.cotizacionData,
            tabId: tabId,
            timestamp: Date.now(),
            executed: false
        };
        
        await chrome.storage.local.set({ 'compraAgilCommand': command });
        console.log('💾 BACKUP EN STORAGE GUARDADO:', command);
        
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}


// ✅ SIMPLIFICAR waitForTabComplete
async waitForTabComplete(tabId) {
    for (let i = 0; i < 20; i++) {
        try {
            const tab = await chrome.tabs.get(tabId);
            console.log(`⏳ Intento ${i+1}/20 - Status: ${tab.status}`);
            
            if (tab.status === 'complete') {
                console.log('✅ Tab completamente cargado');
                return true;
            }
        } catch (error) {
            console.error('Error verificando tab:', error);
        }
        await this.delay(500);
    }
    
    console.warn('⚠️ Timeout esperando carga de tab');
    return false;
}

// ✅ FUNCIÓN DELAY SIMPLE
delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


    // ✅ AGREGAR estas 3 funciones auxiliares a popup.js
    async waitForTabComplete(tabId) {
        for (let i = 0; i < 20; i++) {
            const tab = await chrome.tabs.get(tabId);
            if (tab.status === 'complete') {
                console.log('✅ Tab completamente cargado');
                return;
            }
            await this.delay(500);
        }
        console.warn('⚠️ Timeout esperando carga de tab');
    }

    async pingContentScript(tabId) {
        for (let i = 0; i < 10; i++) {
            try {
                const response = await new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });
                
                if (response && response.ready) {
                    console.log('✅ Content script responde');
                    return;
                }
            } catch (error) {
                // Continuar intentando
            }
            await this.delay(500);
        }
        console.warn('⚠️ Content script no responde, enviando mensaje de todas formas');
    }

delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// ✅ FUNCIONES AUXILIARES MEJORADAS CON LOGS
async waitForTabComplete(tabId) {
    for (let i = 0; i < 20; i++) {
        const tab = await chrome.tabs.get(tabId);
        await PopupLogger.log(`⏳ Intento ${i+1}/20 - Status: ${tab.status}`);
        
        if (tab.status === 'complete') {
            console.log('✅ Tab completamente cargado');
            return true;
        }
        await this.delay(500);
    }
    await PopupLogger.log('⚠️ Timeout esperando carga de tab');
    console.warn('⚠️ Timeout esperando carga de tab');
    return false;
}// Agregar estas funciones de debugging al final de popup.js

async pingContentScript(tabId) {
    for (let i = 0; i < 10; i++) {
        try {
            await PopupLogger.log(`🏓 Ping intento ${i+1}/10`);
            
            const response = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Ping timeout')), 2000);
                
                chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
                    clearTimeout(timeout);
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            if (response && response.ready) {
                await PopupLogger.log('✅ Content script responde', response);
                console.log('✅ Content script responde');
                return true;
            }
        } catch (error) {
            await PopupLogger.log(`❌ Ping falló intento ${i+1}`, { error: error.message });
        }
        await this.delay(500);
    }
    
    await PopupLogger.log('⚠️ Content script no responde, enviando mensaje de todas formas');
    console.warn('⚠️ Content script no responde, enviando mensaje de todas formas');
    return false;
}

delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
}
class DebugUtilities {
    static async clearAllAutomationData() {
        try {
            await chrome.storage.local.remove([
                'mpAutomationData',
                'compraAgilAutomationData',
                'compraAgilEstadoCancelado'
            ]);
            console.log('✅ Todos los datos de automatización limpiados');
            return true;
        } catch (error) {
            console.error('❌ Error limpiando datos:', error);
            return false;
        }
    }
    
    static async inspectStorageData() {
        try {
            const all = await chrome.storage.local.get();
            console.log('📊 TODOS LOS DATOS EN STORAGE:');
            Object.keys(all).forEach(key => {
                if (key.includes('automation') || key.includes('Agil') || key.includes('mp')) {
                    console.log(`${key}:`, all[key]);
                }
            });
            return all;
        } catch (error) {
            console.error('❌ Error inspeccionando storage:', error);
            return null;
        }
    }
    
    static async forceValidAutomationData(credentials, compraAgilId = null) {
        const validData = {
            credentials: credentials,
            compraAgilId: compraAgilId,
            shouldGoToCompraAgil: !!compraAgilId,
            organizationData: null,
            cotizacionData: null,
            strategy: 'LOGIN_THEN_CA',
            timestamp: Date.now(),
            status: 'ready', // ✅ CRÍTICO
            source: 'debug_manual'
        };
        
        try {
            await chrome.storage.local.set({ mpAutomationData: validData });
            console.log('✅ Datos de automatización válidos forzados:', validData);
            return true;
        } catch (error) {
            console.error('❌ Error forzando datos:', error);
            return false;
        }
    }
}
class PopupLogger {
    static async log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            data: data ? JSON.stringify(data) : null,
            url: window.location.href
        };
        
        console.log(`📝 POPUP LOG: ${message}`, data);
        
        try {
            // Guardar en storage para revisar después
            const existingLogs = await chrome.storage.local.get(['popupDebugLogs']);
            const logs = existingLogs.popupDebugLogs || [];
            
            logs.push(logEntry);
            
            // Mantener solo los últimos 50 logs
            if (logs.length > 50) {
                logs.splice(0, logs.length - 50);
            }
            
            await chrome.storage.local.set({ popupDebugLogs: logs });
        } catch (error) {
            console.error('Error guardando log:', error);
        }
    }
    
    static async getLogs() {
        try {
            const result = await chrome.storage.local.get(['popupDebugLogs']);
            return result.popupDebugLogs || [];
        } catch (error) {
            console.error('Error obteniendo logs:', error);
            return [];
        }
    }
    
    static async clearLogs() {
        try {
            await chrome.storage.local.remove(['popupDebugLogs']);
            console.log('✅ Logs limpiados');
        } catch (error) {
            console.error('Error limpiando logs:', error);
        }
    }
}




// ✅ AGREGAR al final de popup.js - Hacer logger disponible globalmente
window.PopupLogger = PopupLogger;

// ✅ COMANDO PARA CONSOLA: Ver logs en cualquier momento
window.verLogs = async () => {
    const logs = await PopupLogger.getLogs();
    console.log('📋 POPUP LOGS:', logs);
    return logs;
};

window.limpiarLogs = () => PopupLogger.clearLogs();
// Agregar al constructor de ProfessionalMPAutomation para debugging
// window.debugUtils = DebugUtilities;

// COMANDOS PARA CONSOLA DE CHROME:
// 
// Limpiar todos los datos:
// await window.debugUtils.clearAllAutomationData()
//
// Inspeccionar storage:
// await window.debugUtils.inspectStorageData()
//
// Forzar datos válidos:
// await window.debugUtils.forceValidAutomationData({username: 'tu_rut', password: 'tu_pass'}, 'ID_COTIZACION')