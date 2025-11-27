// popup.js - Interfaz de usuario para extensión de licitaciones

class PopupManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.automations = [];
        this.config = null;
        this.credentials = null;
        
        console.log('🎛️ Popup Manager iniciado');
        this.init();
    }
    
    async init() {
        try {
            await this.setupEventListeners();
            await this.loadInitialData();
            await this.updateUI();
            
            console.log('✅ Popup configurado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando popup:', error);
            this.showNotification('Error inicializando popup', 'error');
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Dashboard actions
        document.getElementById('openPharmaTender')?.addEventListener('click', () => {
            this.openPharmaTender();
        });
        
        document.getElementById('refreshStatus')?.addEventListener('click', () => {
            this.refreshStatus();
        });
        
        // Automation actions
        document.getElementById('startCurrentLicitacion')?.addEventListener('click', () => {
            this.startCurrentLicitacion();
        });
        
        document.getElementById('refreshLicitacionData')?.addEventListener('click', () => {
            this.refreshLicitacionData();
        });
        
        // Credentials form
        document.getElementById('credentialsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCredentials();
        });
        
        document.getElementById('testCredentials')?.addEventListener('click', () => {
            this.testCredentials();
        });
        
        document.getElementById('passwordToggle')?.addEventListener('click', () => {
            this.togglePassword();
        });
        
        // Settings
        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        document.getElementById('resetSettings')?.addEventListener('click', () => {
            this.resetSettings();
        });
        
        // Footer
        document.getElementById('showLogs')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLogs();
        });
        
        // Auto-refresh automations every 5 seconds
        setInterval(() => {
            this.refreshAutomations();
        }, 5000);
    }
    
    async loadInitialData() {
        try {
            // Cargar configuración
            const configResponse = await chrome.runtime.sendMessage({
                action: 'getConfiguration'
            });
            
            if (configResponse && configResponse.success) {
                this.config = configResponse.config;
                this.populateSettings();
            }
            
            // Verificar credenciales
            await this.checkCredentialStatus();
            
            // Cargar automatizaciones activas
            await this.refreshAutomations();
            
            // Verificar estado de conexión
            await this.checkConnectionStatus();
            
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
        }
    }
    
    switchTab(tabName) {
        // Actualizar botones
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Cargar datos específicos del tab
        this.loadTabData(tabName);
    }
    
    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.refreshAutomations();
                break;
            case 'credentials':
                await this.checkCredentialStatus();
                await this.loadExistingCredentials();
                break;
            case 'settings':
                this.populateSettings();
                break;
        }
    }
    
    async refreshAutomations() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getAutomationStatus'
            });
            
            if (response && response.success) {
                this.automations = response.automations || [];
                this.updateDashboardStats();
                this.updateAutomationsList();
            }
            
        } catch (error) {
            console.error('❌ Error refrescando automatizaciones:', error);
        }
    }
    
    updateDashboardStats() {
        const activeCount = this.automations.filter(a => a.status === 'running').length;
        const completedCount = this.automations.filter(a => a.status === 'completed').length;
        const errorCount = this.automations.filter(a => a.status === 'error').length;
        
        document.getElementById('activeAutomations').textContent = activeCount;
        document.getElementById('completedToday').textContent = completedCount;
        document.getElementById('errorCount').textContent = errorCount;
    }
    
    updateAutomationsList() {
        const container = document.getElementById('automationsList');
        
        if (this.automations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🤖</span>
                    <p>No hay automatizaciones activas</p>
                    <small>Visita prime.pharmatender.cl para iniciar</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.automations.map(automation => `
            <div class="automation-item">
                <div class="automation-info">
                    <h4>${automation.licitacionData?.nombre || automation.id}</h4>
                    <p>Estado: ${this.getStatusText(automation.status)} - ${automation.currentStep || 'Iniciando'}</p>
                </div>
                <div class="automation-progress">
                    <div class="progress-text">${automation.progress || 0}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${automation.progress || 0}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getStatusText(status) {
        const statusMap = {
            'running': 'Ejecutando',
            'completed': 'Completado',
            'error': 'Error',
            'stopped': 'Detenido',
            'cancelled': 'Cancelado',
            'timeout': 'Tiempo agotado'
        };
        
        return statusMap[status] || status;
    }
    
    async checkConnectionStatus() {
        try {
            // Verificar si hay tabs de PharmaTender activos
            const tabs = await chrome.tabs.query({
                url: ["*://prime.pharmatender.cl/*", "*://www.mercadopublico.cl/*"]
            });
            
            const statusIndicator = document.getElementById('statusIndicator');
            const statusDot = statusIndicator.querySelector('.status-dot');
            const statusText = statusIndicator.querySelector('.status-text');
            
            if (tabs && tabs.length > 0) {
                statusDot.classList.add('connected');
                statusText.textContent = 'Conectado';
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = 'Desconectado';
            }
            
        } catch (error) {
            console.error('❌ Error verificando conexión:', error);
        }
    }
    
    async checkCredentialStatus() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'testCredentials'
            });
            
            const statusContainer = document.getElementById('credentialStatus');
            const statusIcon = statusContainer.querySelector('.status-icon');
            const statusMessage = statusContainer.querySelector('.status-message');
            
            if (response && response.success) {
                statusContainer.className = 'credential-status success';
                statusIcon.textContent = '✅';
                statusMessage.textContent = 'Credenciales configuradas y válidas';
            } else {
                statusContainer.className = 'credential-status error';
                statusIcon.textContent = '❌';
                statusMessage.textContent = response?.error || 'No se encontraron credenciales';
            }
            
        } catch (error) {
            console.error('❌ Error verificando credenciales:', error);
            
            const statusContainer = document.getElementById('credentialStatus');
            statusContainer.className = 'credential-status error';
            statusContainer.querySelector('.status-icon').textContent = '❌';
            statusContainer.querySelector('.status-message').textContent = 'Error verificando credenciales';
        }
    }
    
    async loadExistingCredentials() {
        try {
            const stored = await chrome.storage.local.get(['encryptedCredentials']);
            
            if (stored.encryptedCredentials) {
                const credentials = stored.encryptedCredentials;
                
                // Cargar credenciales en el formulario (mapear username a rut)
                if (credentials.username) {
                    document.getElementById('rut').value = credentials.username;
                }
                
                if (credentials.rutRepresentante) {
                    document.getElementById('rutRepresentante').value = credentials.rutRepresentante;
                }
                
                // No cargar la contraseña por seguridad
                // document.getElementById('password').placeholder = 'Contraseña guardada (oculta)';
            }
            
        } catch (error) {
            console.error('❌ Error cargando credenciales existentes:', error);
        }
    }
    
    async saveCredentials() {
        try {
            this.showLoading('Guardando credenciales...');
            
            const rut = document.getElementById('rut').value.trim();
            const password = document.getElementById('password').value;
            const rutRepresentante = document.getElementById('rutRepresentante').value.trim();
            
            // Validar RUT Usuario
            if (!this.validateRUT(rut)) {
                this.showNotification('RUT Usuario inválido', 'error');
                this.hideLoading();
                return;
            }
            
            // Validar contraseña
            if (!password) {
                this.showNotification('La contraseña es requerida', 'error');
                this.hideLoading();
                return;
            }
            
            // Validar RUT Representante
            if (!this.validateRUT(rutRepresentante)) {
                this.showNotification('RUT Representante inválido', 'error');
                this.hideLoading();
                return;
            }
            
            // Cargar el módulo de seguridad y guardar credenciales encriptadas
            // Por simplicidad, guardamos directamente (en producción usar SecureCredentialManager)
            await chrome.storage.local.set({
                encryptedCredentials: {
                    username: rut, // Mapear rut a username para compatibilidad con background.js
                    password: password, // En producción esto debe estar encriptado
                    rutRepresentante: rutRepresentante,
                    timestamp: Date.now()
                }
            });
            
            this.showNotification('Credenciales guardadas correctamente', 'success');
            await this.checkCredentialStatus();
            
            // Limpiar formulario
            document.getElementById('credentialsForm').reset();
            
        } catch (error) {
            console.error('❌ Error guardando credenciales:', error);
            this.showNotification('Error guardando credenciales', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async testCredentials() {
        try {
            this.showLoading('Probando credenciales...');
            
            const response = await chrome.runtime.sendMessage({
                action: 'testCredentials'
            });
            
            if (response && response.success) {
                this.showNotification('Credenciales válidas', 'success');
            } else {
                this.showNotification(response?.error || 'Error en las credenciales', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error probando credenciales:', error);
            this.showNotification('Error probando credenciales', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleButton = document.getElementById('passwordToggle');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleButton.textContent = '👁️';
        }
    }
    
    validateRUT(rut) {
        // Validación básica de RUT chileno
        const rutPattern = /^[0-9]+-[0-9kK]{1}$/;
        return rutPattern.test(rut);
    }
    
    populateSettings() {
        if (!this.config) return;
        
        document.getElementById('autoLogin').checked = this.config.autoLogin || false;
        document.getElementById('timeout').value = (this.config.timeout || 30000) / 1000;
        document.getElementById('retryAttempts').value = this.config.retryAttempts || 3;
        document.getElementById('notificaciones').checked = this.config.notificaciones !== false;
        document.getElementById('debugMode').checked = this.config.debugMode || false;
    }
    
    async saveSettings() {
        try {
            this.showLoading('Guardando configuración...');
            
            const newConfig = {
                autoLogin: document.getElementById('autoLogin').checked,
                timeout: parseInt(document.getElementById('timeout').value) * 1000,
                retryAttempts: parseInt(document.getElementById('retryAttempts').value),
                notificaciones: document.getElementById('notificaciones').checked,
                debugMode: document.getElementById('debugMode').checked
            };
            
            const response = await chrome.runtime.sendMessage({
                action: 'updateConfiguration',
                config: newConfig
            });
            
            if (response && response.success) {
                this.config = response.config;
                this.showNotification('Configuración guardada', 'success');
            } else {
                this.showNotification('Error guardando configuración', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error guardando configuración:', error);
            this.showNotification('Error guardando configuración', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async resetSettings() {
        if (!confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
            return;
        }
        
        try {
            const defaultConfig = {
                autoLogin: true,
                timeout: 30000,
                retryAttempts: 3,
                notificaciones: true,
                debugMode: false
            };
            
            const response = await chrome.runtime.sendMessage({
                action: 'updateConfiguration',
                config: defaultConfig
            });
            
            if (response && response.success) {
                this.config = response.config;
                this.populateSettings();
                this.showNotification('Configuración restaurada', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error restaurando configuración:', error);
            this.showNotification('Error restaurando configuración', 'error');
        }
    }
    
    async openPharmaTender() {
        try {
            await chrome.tabs.create({
                url: 'https://prime.pharmatender.cl',
                active: true
            });
            
            // Cerrar popup después de abrir
            window.close();
            
        } catch (error) {
            console.error('❌ Error abriendo PharmaTender:', error);
            this.showNotification('Error abriendo PharmaTender', 'error');
        }
    }
    
    async refreshStatus() {
        try {
            this.showLoading('Actualizando estado...');
            
            await this.loadInitialData();
            await this.updateUI();
            
            this.showNotification('Estado actualizado', 'success');
            
        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            this.showNotification('Error actualizando estado', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async startCurrentLicitacion() {
        try {
            console.log('🚀 INICIANDO AUTOMATIZACIÓN DE LICITACIÓN...');
            
            // Verificar que tenemos credenciales
            const credentials = await this.credentialManager.getCredentials();
            if (!credentials || !credentials.username || !credentials.password) {
                this.showNotification('⚠️ Configure las credenciales primero', 'warning');
                this.switchTab('credentials');
                return;
            }
            
            // Obtener pestaña activa
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab) {
                this.showNotification('❌ No hay pestaña activa', 'error');
                return;
            }
            
            console.log('🌐 Pestaña actual:', tab.url);
            
            // Verificar que estamos en Mercado Público
            if (!tab.url.includes('mercadopublico.cl')) {
                this.showNotification('⚠️ Debe estar en una página de Mercado Público', 'warning');
                return;
            }
            
            this.showLoading('Iniciando automatización...');
            
            // Enviar mensaje al content script de licitación
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'startLicitacionAutomation',
                data: {
                    username: credentials.username,
                    password: credentials.password,
                    rutRepresentante: credentials.rutRepresentante
                }
            });
            
            if (response?.success) {
                this.showNotification('✅ Automatización iniciada', 'success');
                console.log('✅ Respuesta del content script:', response);
            } else {
                this.showNotification('❌ Error iniciando automatización', 'error');
                console.error('❌ Error del content script:', response);
            }
            
        } catch (error) {
            console.error('❌ Error iniciando automatización:', error);
            this.showNotification('❌ Error: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async refreshLicitacionData() {
        try {
            this.showLoading('Actualizando datos de licitación...');
            
            // Obtener pestaña activa
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab) {
                this.showNotification('❌ No hay pestaña activa', 'error');
                return;
            }
            
            // Solicitar actualización de datos al content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'refreshLicitacionData'
            });
            
            if (response?.success) {
                await this.loadInitialData();
                await this.updateUI();
                this.showNotification('✅ Datos actualizados', 'success');
            } else {
                this.showNotification('❌ Error actualizando datos', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error actualizando datos:', error);
            this.showNotification('❌ Error: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    showLogs() {
        // TODO: Implementar visualización de logs
        this.showNotification('Función de logs en desarrollo', 'info');
    }
    
    async updateUI() {
        await this.checkConnectionStatus();
        
        if (this.currentTab === 'dashboard') {
            this.updateDashboardStats();
            this.updateAutomationsList();
        }
    }
    
    showLoading(message = 'Cargando...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = document.getElementById('loadingMessage');
        
        messageElement.textContent = message;
        overlay.classList.remove('hidden');
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto-remove después de 4 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
}

// ================================
// INICIALIZACIÓN
// ================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        const popupManager = new PopupManager();
        console.log('✅ Popup Manager inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando Popup Manager:', error);
    }
});
