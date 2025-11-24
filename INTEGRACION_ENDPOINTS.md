# Integración de Endpoints - Extensión Licitaciones

## 🎯 Objetivo

Integrar la extensión con los endpoints de Laravel para:
1. ✅ Obtener `company_id` del usuario logueado (endpoint existente)
2. ✅ Obtener datos completos de la licitación
3. ✅ Mostrar info en el popup
4. ✅ Iniciar automatización con todos los datos

---

## 1. Endpoint Existente: `/api/extension/check-auth`

**Este endpoint YA EXISTE en el sistema** (usado por extensión Compras Ágiles).

### URL
```
GET https://prime.pharmatender.cl/api/extension/check-auth
```

### Respuesta
```json
{
  "authenticated": true,
  "user": {
    "id": 456,
    "rut": "12345678-9",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "company": {
    "id": 123,
    "rut": "76285229-2",
    "name": "Farmacia SpA"
  }
}
```

**Este endpoint nos da:**
- ✅ `user.rut` → rut_usuario para consultas
- ✅ `company.id` → company_id para consultas
- ✅ `company.rut` → rut de la empresa

---

## 2. Modificar `content-platform.js`

Agregar función para obtener datos del usuario:

```javascript
class PlatformLicitacionDetector {
    constructor() {
        this.currentLicitacionId = null;
        this.userData = null;  // ← NUEVO: guardar datos del usuario
        this.licitacionData = null;  // ← NUEVO: guardar datos de licitación

        this.init();
    }

    async init() {
        console.log('🚀 [PLATFORM] Inicializando detector de licitaciones');

        // Obtener datos del usuario logueado
        await this.fetchUserData();

        // Detectar página de licitación
        this.detectLicitacionPage();
    }

    /**
     * Obtener datos del usuario logueado desde check-auth
     */
    async fetchUserData() {
        try {
            console.log('👤 [PLATFORM] Obteniendo datos del usuario...');

            const apiUrl = 'https://prime.pharmatender.cl/api/extension/check-auth';

            const response = await fetch(apiUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.authenticated) {
                this.userData = result;
                console.log('✅ [PLATFORM] Datos de usuario obtenidos:', {
                    user: result.user?.rut,
                    company: result.company?.id
                });
            } else {
                console.warn('⚠️ [PLATFORM] Usuario no autenticado');
                this.userData = null;
            }

        } catch (error) {
            console.error('❌ [PLATFORM] Error obteniendo datos de usuario:', error);
            this.userData = null;
        }
    }

    /**
     * Obtener datos completos de la licitación
     */
    async fetchLicitacionData() {
        try {
            if (!this.currentLicitacionId) {
                console.warn('⚠️ [PLATFORM] No hay licitación detectada');
                return null;
            }

            if (!this.userData) {
                console.warn('⚠️ [PLATFORM] Usuario no autenticado, obteniendo datos...');
                await this.fetchUserData();

                if (!this.userData) {
                    throw new Error('No se pudo autenticar usuario');
                }
            }

            console.log('📊 [PLATFORM] Obteniendo datos de licitación:', this.currentLicitacionId);

            const apiUrl = 'https://prime.pharmatender.cl/api/extension/licitacion-data-completa';
            const params = new URLSearchParams({
                id_licitacion: this.currentLicitacionId,
                rut_usuario: this.userData.user.rut,
                company_id: this.userData.company.id
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
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.licitacionData = result.data;
                console.log('✅ [PLATFORM] Datos de licitación obtenidos:', {
                    codigo: result.data.codigo_postulacion,
                    items: result.data.total_items,
                    documentos: result.data.total_documentos,
                    monto: result.data.monto_total
                });

                // Actualizar UI del popup si está abierto
                await this.updatePopupLicitacionInfo();

                return this.licitacionData;
            } else {
                throw new Error(result.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('❌ [PLATFORM] Error obteniendo datos de licitación:', error);
            this.showNotification('Error cargando datos de licitación', 'error');
            return null;
        }
    }

    /**
     * Actualizar información en el popup
     */
    async updatePopupLicitacionInfo() {
        try {
            if (!this.licitacionData) return;

            // Enviar datos al popup mediante storage
            await chrome.storage.local.set({
                currentLicitacionInfo: {
                    id_licitacion: this.currentLicitacionId,
                    codigo_postulacion: this.licitacionData.codigo_postulacion,
                    total_items: this.licitacionData.total_items,
                    total_documentos: this.licitacionData.total_documentos,
                    monto_total: this.licitacionData.monto_total,
                    timestamp: Date.now()
                }
            });

            console.log('✅ [PLATFORM] Info de licitación guardada en storage');

        } catch (error) {
            console.error('❌ [PLATFORM] Error guardando info en storage:', error);
        }
    }

    detectLicitacionPage() {
        const currentPath = window.location.pathname;
        console.log('🔍 [PLATFORM] Detectando página:', currentPath);

        const isCargaDocumentosPage = currentPath.includes('/carga-documentos/');

        if (isCargaDocumentosPage) {
            const match = currentPath.match(/\/carga-documentos\/([^\/]+)/);
            if (match && match[1]) {
                this.currentLicitacionId = match[1];
                console.log('✅ [PLATFORM] Licitación detectada:', this.currentLicitacionId);

                this.addAutomationButton();
                this.addInfoIndicator();

                // Obtener datos de la licitación automáticamente
                setTimeout(() => {
                    this.fetchLicitacionData();
                }, 1000);
            }
        } else {
            console.log('ℹ️ [PLATFORM] No es página de carga de documentos');
        }
    }

    async startLicitacionAutomation() {
        try {
            console.log('🚀 [PLATFORM] Iniciando automatización de licitación...');

            // Verificar que tenemos datos
            if (!this.licitacionData) {
                console.log('📊 [PLATFORM] Datos no cargados, obteniendo...');
                await this.fetchLicitacionData();

                if (!this.licitacionData) {
                    throw new Error('No se pudieron cargar los datos de la licitación');
                }
            }

            // Verificar credenciales
            const credsCheck = await chrome.storage.local.get(['encryptedCredentials']);

            if (!credsCheck.encryptedCredentials) {
                this.showNotification('⚠️ Debes guardar credenciales primero en el popup', 'warning');
                return;
            }

            this.showNotification('🚀 Iniciando automatización...', 'info');

            // Enviar mensaje al background con TODOS los datos
            console.log('📡 [PLATFORM] Enviando mensaje al background...');

            const response = await chrome.runtime.sendMessage({
                action: 'startLicitacionAutomation',
                licitacionId: this.currentLicitacionId,
                licitacionData: this.licitacionData,
                userData: this.userData
            });

            if (response && response.success) {
                console.log('✅ [PLATFORM] Automatización iniciada exitosamente');
                this.showNotification('✅ Automatización iniciada', 'success');
            } else {
                console.error('❌ [PLATFORM] Error en respuesta:', response);
                this.showNotification('❌ Error: ' + (response?.error || 'Desconocido'), 'error');
            }

        } catch (error) {
            console.error('❌ [PLATFORM] Excepción en startLicitacionAutomation:', error);
            console.error('❌ [PLATFORM] Detalles del error:', {
                message: error.message,
                stack: error.stack
            });
            this.showNotification('❌ Error iniciando automatización', 'error');
        }
    }

    // ... resto de funciones existentes
}
```

---

## 3. Modificar `popup.js`

Agregar función para mostrar datos de licitación actual:

```javascript
class PopupManager {
    constructor() {
        this.platformUrl = 'https://prime.pharmatender.cl';
        this.currentLicitacionInfo = null;

        this.init();
    }

    async init() {
        console.log('🚀 Inicializando popup...');

        this.setupEventListeners();
        await this.loadCredentials();
        await this.loadLicitacionInfo();  // ← NUEVO
        this.startPeriodicUpdate();
    }

    /**
     * Cargar información de licitación actual desde storage
     */
    async loadLicitacionInfo() {
        try {
            const result = await chrome.storage.local.get(['currentLicitacionInfo']);

            if (result.currentLicitacionInfo) {
                const info = result.currentLicitacionInfo;

                // Verificar que no sea muy antigua (más de 5 minutos)
                const age = Date.now() - info.timestamp;
                if (age < 5 * 60 * 1000) {
                    this.currentLicitacionInfo = info;
                    this.displayLicitacionInfo(info);
                } else {
                    console.log('ℹ️ Info de licitación expirada, limpiando...');
                    await chrome.storage.local.remove(['currentLicitacionInfo']);
                }
            } else {
                this.hideLicitacionInfo();
            }

        } catch (error) {
            console.error('❌ Error cargando info de licitación:', error);
        }
    }

    /**
     * Mostrar información de licitación en el popup
     */
    displayLicitacionInfo(info) {
        const container = document.getElementById('currentLicitacionInfo');

        if (!container) {
            console.warn('⚠️ Container de licitación no encontrado');
            return;
        }

        // Mostrar container
        container.style.display = 'block';

        // Actualizar valores
        document.getElementById('licitacionCode').textContent = info.id_licitacion;
        document.getElementById('codigoPostulacion').textContent = info.codigo_postulacion;
        document.getElementById('totalItems').textContent = info.total_items;
        document.getElementById('totalDocumentos').textContent = info.total_documentos;

        // Formatear monto
        const montoFormateado = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(info.monto_total);
        document.getElementById('montoTotal').textContent = montoFormateado;

        console.log('✅ Info de licitación mostrada en popup');
    }

    /**
     * Ocultar información de licitación
     */
    hideLicitacionInfo() {
        const container = document.getElementById('currentLicitacionInfo');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Refrescar datos de licitación
     */
    async refreshLicitacionData() {
        try {
            console.log('🔄 Refrescando datos de licitación...');

            // Enviar mensaje al content script para que recargue
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab && tab.url?.includes('prime.pharmatender.cl/carga-documentos/')) {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'refreshLicitacionData'
                });

                this.showNotification('🔄 Actualizando datos...', 'info');

                // Recargar después de 2 segundos
                setTimeout(() => {
                    this.loadLicitacionInfo();
                }, 2000);
            } else {
                this.showNotification('⚠️ Debes estar en una página de licitación', 'warning');
            }

        } catch (error) {
            console.error('❌ Error refrescando datos:', error);
            this.showNotification('❌ Error actualizando datos', 'error');
        }
    }

    setupEventListeners() {
        // ... listeners existentes ...

        // NUEVO: Botón para actualizar datos de licitación
        const refreshBtn = document.getElementById('refreshLicitacionData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshLicitacionData();
            });
        }

        // NUEVO: Botón para iniciar automatización desde popup
        const startBtn = document.getElementById('startCurrentLicitacion');
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.url?.includes('prime.pharmatender.cl/carga-documentos/')) {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'startLicitacionFromPopup'
                    });
                } else {
                    this.showNotification('⚠️ Debes estar en una página de licitación', 'warning');
                }
            });
        }

        // NUEVO: Actualizar info periódicamente
        setInterval(() => {
            this.loadLicitacionInfo();
        }, 10000); // Cada 10 segundos
    }

    /**
     * Guardar credenciales (MODIFICADO para incluir rutRepresentante)
     */
    async saveCredentials(event) {
        event.preventDefault();

        try {
            const rut = document.getElementById('rut').value.trim();
            const password = document.getElementById('password').value;
            const rutRepresentante = document.getElementById('rutRepresentante').value.trim();

            if (!rut || !password || !rutRepresentante) {
                this.showNotification('⚠️ Completa todos los campos', 'warning');
                return;
            }

            // Validar formato de RUTs
            if (!this.validateRut(rut) || !this.validateRut(rutRepresentante)) {
                this.showNotification('⚠️ Formato de RUT inválido', 'warning');
                return;
            }

            // Cifrar credenciales
            const credentials = {
                rut: rut,
                password: password,
                rutRepresentante: rutRepresentante,
                timestamp: Date.now()
            };

            const encrypted = await window.SecurityUtils.encryptCredentials(credentials);

            await chrome.storage.local.set({
                encryptedCredentials: encrypted
            });

            this.showNotification('✅ Credenciales guardadas correctamente', 'success');

            // Actualizar UI
            this.updateCredentialStatus(true);

        } catch (error) {
            console.error('❌ Error guardando credenciales:', error);
            this.showNotification('❌ Error guardando credenciales', 'error');
        }
    }

    /**
     * Validar formato de RUT chileno
     */
    validateRut(rut) {
        const rutPattern = /^[0-9]+-[0-9kK]{1}$/;
        return rutPattern.test(rut);
    }

    // ... resto de funciones existentes ...
}
```

---

## 4. Listener en `content-platform.js` para mensajes del popup

Agregar al final de `content-platform.js`:

```javascript
// Listener para mensajes desde el popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 [PLATFORM] Mensaje recibido:', request.action);

    if (request.action === 'refreshLicitacionData') {
        // Refrescar datos de licitación
        if (window.platformLicitacionDetector) {
            window.platformLicitacionDetector.fetchLicitacionData()
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
        } else {
            sendResponse({ success: false, error: 'Detector no inicializado' });
        }
        return true; // Mantener canal abierto
    }

    if (request.action === 'startLicitacionFromPopup') {
        // Iniciar automatización desde popup
        if (window.platformLicitacionDetector) {
            window.platformLicitacionDetector.startLicitacionAutomation()
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
        } else {
            sendResponse({ success: false, error: 'Detector no inicializado' });
        }
        return true;
    }

    return false;
});
```

---

## 5. Agregar estilos CSS para la tarjeta de licitación

En `popup-styles.css`:

```css
/* Licitación Actual */
.current-licitacion-info {
    margin-bottom: 20px;
}

.licitacion-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 16px;
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.licitacion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.licitacion-code {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.licitacion-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.licitacion-body {
    margin-bottom: 12px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row:last-child {
    border-bottom: none;
}

.info-label {
    font-size: 13px;
    opacity: 0.9;
}

.info-value {
    font-size: 14px;
    font-weight: 600;
}

.licitacion-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.btn-small {
    flex: 1;
    padding: 8px 12px;
    font-size: 12px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s;
    font-weight: 500;
}

.btn-small.primary {
    background: white;
    color: #667eea;
}

.btn-small.primary:hover {
    background: #f0f0f0;
    transform: translateY(-1px);
}

.btn-small.secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.btn-small.secondary:hover {
    background: rgba(255, 255, 255, 0.3);
}

.btn-icon {
    font-size: 14px;
}
```

---

## 6. Flujo Completo de Integración

```
┌──────────────────────────────────────────┐
│ 1. Usuario abre /carga-documentos/...   │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 2. content-platform.js init()            │
│    ├─ fetchUserData()                    │
│    │  └─ GET /check-auth                 │
│    │     → userData (rut, company_id)    │
│    ├─ detectLicitacionPage()             │
│    └─ fetchLicitacionData()              │
│       └─ GET /licitacion-data-completa   │
│          → licitacionData (productos, etc)│
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 3. Guardar en chrome.storage.local       │
│    currentLicitacionInfo: {              │
│      codigo_postulacion, items,          │
│      documentos, monto                   │
│    }                                     │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 4. popup.js lee storage cada 10s         │
│    └─ displayLicitacionInfo()            │
│       └─ Muestra tarjeta con datos       │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 5. Usuario click "Iniciar Automatización"│
│    ├─ Verifica credenciales guardadas    │
│    └─ Envía a background.js:             │
│       {                                  │
│         action: 'startLicitacionAutomation',│
│         licitacionData: {...},           │
│         userData: {...}                  │
│       }                                  │
└──────────────────────────────────────────┘
```

---

## Resumen

✅ **Reutiliza endpoint existente** `/check-auth` para obtener company_id
✅ **Nuevo endpoint** `/licitacion-data-completa` usando tablas existentes
✅ **Popup muestra info** automáticamente cuando detecta licitación
✅ **Botón refrescar** para actualizar datos
✅ **Botón iniciar** para comenzar automatización
✅ **RUT representante** incluido en credenciales

**Próximo paso**: Implementar estos cambios en los archivos y probar el flujo completo.
