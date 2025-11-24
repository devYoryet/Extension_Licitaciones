# PharmaTender - Extensión de Licitaciones

Una extensión de Chrome para automatizar el proceso completo de postulación a licitaciones desde PharmaTender hacia Mercado Público.

## 🎯 Funcionalidades

### ✅ **COMPLETADAS - Version 1.0.0** 🎉

#### Infraestructura Core
- ✅ **Configuración Centralizada**: Sistema modular de configuración con URLs, selectores y timeouts
- ✅ **Gestión Segura de Credenciales**: Encriptación AES-256 con PBKDF2 (100k iteraciones)
- ✅ **Background Service**: Coordinación centralizada de automatizaciones múltiples
- ✅ **Interfaz de Usuario Completa**: Popup con 3 tabs (Dashboard, Credentials, Settings)
- ✅ **Sistema de Notificaciones**: Retroalimentación visual del progreso en tiempo real

#### Detección y Navegación
- ✅ **Detección de Plataforma**: Reconocimiento automático de licitaciones en PharmaTender
- ✅ **Navegación a Ofertas**: Construcción y navegación automática a página de oferta
- ✅ **Extracción de IDs**: De URLs de PharmaTender y Mercado Público

#### Flujo de Automatización Completo (5 Páginas)
- ✅ **Página 1 - Información Básica**:
  - Nombre de oferta
  - Descripción de oferta
  - Configuración de oferta conjunta (Sí/No)
- ✅ **Página 2 - Productos y Precios**:
  - Activación de "No Bids"
  - Procesamiento por paginación
  - Llenado de precios unitarios
- ✅ **Página 3 - Documentos**:
  - Switch a iframe de documentos
  - Carga por tipo (Administrativo, Técnico, Económico)
  - Integración con API Laravel para obtener archivos
  - Conversión base64 a File objects
  - Upload automático a inputs
- ✅ **Página 4 - Firma Digital**:
  - Verificación de estado de firma
  - Click en "Declarar y firmar"
  - Manejo de checkbox
  - "Firmar sin Clave Única"
  - Confirmación y cierre de modal
- ✅ **Página 5 - Envío Final**:
  - Click en "Enviar Oferta"
  - Manejo de confirmaciones
  - Actualización de estado final

#### Integración con Backend
- ✅ **API Laravel**: Endpoints documentados completos
- ✅ **Actualización de Estados**: En tiempo real a base de datos
- ✅ **Log de Eventos**: Histórico de automatización
- ✅ **Fetch de Documentos**: Via API con autenticación

#### Funciones Auxiliares
- ✅ **waitForElement()**: Con MutationObserver
- ✅ **waitForIframeLoad()**: Manejo de carga de iframes
- ✅ **getElementFromIframe()**: Búsqueda en iframes
- ✅ **findElementByText()**: Búsqueda por contenido de texto
- ✅ **findElementBySelector()**: Búsqueda con múltiples fallbacks
- ✅ **base64ToFile()**: Conversión para uploads
- ✅ **uploadDocumentToInput()**: Upload completo con eventos

### 📋 Pendientes (Opcional)
- ⏳ **Sistema de Reintentos Avanzado**: Recuperación granular por paso
- ⏳ **Screenshots de Debugging**: Captura automática en errores
- ⏳ **Modo Offline**: Queue de operaciones pendientes

## 📁 Estructura del Proyecto

```
Licitaciones-Extension v1/
├── manifest.json                 # Configuración de la extensión
├── background.js                 # Service worker para coordinación
├── popup.html                    # Interfaz de usuario principal
├── popup.js                      # Lógica de la interfaz
├── popup-styles.css              # Estilos de la interfaz
├── config.js                     # Configuración centralizada
├── security-utils.js             # Gestión segura de credenciales
├── content-licitacion.js         # Automatización principal
├── content-platform.js           # Detección de plataforma
└── icons/                        # Iconos de la extensión
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 🚀 Instalación

### Paso 1: Instalar Extensión en Chrome

1. **Abrir Chrome** y navegar a `chrome://extensions/`
2. **Habilitar "Modo de desarrollador"** en la esquina superior derecha
3. **Hacer clic en "Cargar extensión sin empaquetar"**
4. **Seleccionar la carpeta** del proyecto `Extension_Licitaciones`
5. **La extensión aparecerá** en la lista y en la barra de herramientas ✅

### Paso 2: Configurar Backend Laravel 5.5

> ⚠️ **CRÍTICO**: La extensión requiere endpoints de API en tu proyecto Laravel. Consulta `LARAVEL_API_ENDPOINTS.md` para la guía completa.

#### A. Crear Rutas API

Agregar a `routes/web.php` o `routes/api.php`:

```php
Route::prefix('api/extension')->middleware(['web', 'cors'])->group(function () {
    Route::get('check-auth', 'ExtensionLicitacionController@checkAuth');
    Route::get('licitacion-data', 'ExtensionLicitacionController@getLicitacionData');
    Route::get('get-document-file', 'ExtensionLicitacionController@getDocumentFile');
    Route::post('update-estado-postulacion', 'ExtensionLicitacionController@updateEstadoPostulacion');
    Route::post('insertar-estado-postulacion', 'ExtensionLicitacionController@insertarEstadoPostulacion');
    Route::get('verify-installation', 'ExtensionLicitacionController@verifyInstallation');
    Route::get('heartbeat', 'ExtensionLicitacionController@heartbeat');
});
```

#### B. Configurar CORS

Crear `app/Http/Middleware/CorsMiddleware.php`:

```php
<?php
namespace App\Http\Middleware;
use Closure;

class CorsMiddleware {
    public function handle($request, Closure $next) {
        $response = $next($request);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, X-CSRF-TOKEN');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        return $response;
    }
}
```

Registrar en `app/Http/Kernel.php`:
```php
protected $middlewareGroups = [
    'web' => [
        // ... otros middlewares
        \App\Http\Middleware\CorsMiddleware::class,
    ],
];
```

#### C. Crear Controlador

Crear `app/Http/Controllers/ExtensionLicitacionController.php`

**Ver archivo `LARAVEL_API_ENDPOINTS.md` para el código completo del controlador**

#### D. Crear Tablas de BD

```sql
-- Tabla principal
CREATE TABLE `licitaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_postulacion` varchar(50) NOT NULL UNIQUE,
  `nombre_oferta` varchar(255) DEFAULT NULL,
  `descripcion_oferta` text,
  `oferta_conjunta` tinyint(1) DEFAULT 0,
  `estado_automatizacion` varchar(50) DEFAULT 'pendiente',
  `mensaje_estado` text,
  `paso_actual` varchar(100),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de productos
CREATE TABLE `licitacion_productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `licitacion_id` int(11) NOT NULL,
  `nombre_producto` varchar(255) NOT NULL,
  `descripcion` text,
  `precio_unitario` decimal(10,2),
  `cantidad` int(11),
  `indice` int(11),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`licitacion_id`) REFERENCES `licitaciones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de log
CREATE TABLE `licitacion_estados_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_postulacion` varchar(50) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `mensaje` text,
  `paso` varchar(100),
  `detalles` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### E. Verificar Instalación

```bash
# Test desde terminal
curl -X GET "https://prime.pharmatender.cl/api/extension/verify-installation"

# Respuesta esperada:
# {"success":true,"message":"Extensión verificada correctamente","version":"1.0.0"}
```

## ⚙️ Configuración Inicial

### 1. Configurar Credenciales

1. **Hacer clic en el icono** de la extensión en Chrome
2. **Ir a la pestaña "Credenciales"**
3. **Ingresar RUT y clave** de Clave Única
4. **Hacer clic en "Guardar"**

> 🔒 **Seguridad**: Las credenciales se encriptan localmente y nunca se envían a servidores externos.

### 2. Ajustar Configuración

1. **Ir a la pestaña "Config"** en el popup
2. **Configurar opciones**:
   - Login Automático: ✅ Recomendado
   - Timeout: 30 segundos (por defecto)
   - Reintentos: 3 (por defecto)
   - Notificaciones: ✅ Recomendado
3. **Guardar configuración**

## 🔧 Uso

### Automatización Básica

1. **Abrir PharmaTender** (prime.pharmatender.cl)
2. **Navegar a una licitación**
3. **La extensión detectará automáticamente** las licitaciones disponibles
4. **Hacer clic en "🤖 Automatizar"** en cualquier licitación
5. **El proceso se ejecutará automáticamente**

### Monitoreo del Progreso

- **Abrir el popup** para ver automatizaciones activas
- **Verificar estado** en tiempo real
- **Recibir notificaciones** cuando se complete

## 🏗️ Arquitectura Técnica

### Componentes Principales

#### 1. **Background Service Worker** (`background.js`)
- Coordina todas las automatizaciones
- Gestiona múltiples procesos simultáneos
- Mantiene estado persistente
- Programa verificaciones periódicas

#### 2. **Content Scripts**
- **`content-licitacion.js`**: Automatización principal del flujo
- **`content-platform.js`**: Detección de licitaciones en PharmaTender

#### 3. **Configuración y Seguridad**
- **`config.js`**: URLs, selectores y parámetros centralizados
- **`security-utils.js`**: Encriptación AES-256 para credenciales

#### 4. **Interfaz de Usuario**
- **`popup.html/js/css`**: Panel de control completo
- Gestión de credenciales, configuración y monitoreo

### Flujo de Automatización

```mermaid
graph TD
    A[Usuario en PharmaTender] --> B[Detectar Licitaciones]
    B --> C[Mostrar Botón Automatizar]
    C --> D[Clic en Automatizar]
    D --> E[Background Service]
    E --> F[Verificar Credenciales]
    F --> G[Iniciar Automatización]
    G --> H[Login Mercado Público]
    H --> I[Buscar Licitación]
    I --> J[Llenar Formularios]
    J --> K[Subir Documentos]
    K --> L[Firmar Digitalmente]
    L --> M[Enviar Postulación]
    M --> N[Notificar Completado]
```

## 🔍 Funciones Avanzadas

### Sistema de Configuración

```javascript
// Configuración modular en config.js
const EXTENSION_CONFIG = {
    URLS: {
        PHARMATENDER_BASE: 'https://prime.pharmatender.cl',
        MERCADO_PUBLICO_BASE: 'https://www.mercadopublico.cl',
        LOGIN_CLAVE_UNICA: 'https://accounts.claveunica.gob.cl'
    },
    
    SELECTORS: {
        LOGIN: {
            RUT_INPUT: '#rut',
            PASSWORD_INPUT: '#password',
            LOGIN_BUTTON: '#login-submit'
        },
        
        LICITACION: {
            SEARCH_INPUT: '#codigo-licitacion',
            SEARCH_BUTTON: '.btn-buscar',
            RESULT_LINK: '.licitacion-link'
        }
    },
    
    TIMEOUTS: {
        PAGE_LOAD: 15000,
        ELEMENT_WAIT: 10000,
        FORM_SUBMIT: 5000
    }
};
```

### Gestión Segura de Credenciales

```javascript
// Encriptación AES-256 en security-utils.js
class SecureCredentialManager {
    async saveCredentials(credentials) {
        const encrypted = await this.encrypt(JSON.stringify(credentials));
        await chrome.storage.local.set({ encryptedCredentials: encrypted });
    }
    
    async getCredentials() {
        const stored = await chrome.storage.local.get(['encryptedCredentials']);
        if (stored.encryptedCredentials) {
            const decrypted = await this.decrypt(stored.encryptedCredentials);
            return JSON.parse(decrypted);
        }
        return null;
    }
}
```

## 🛠️ Desarrollo y Personalización

### Agregar Nuevos Selectores

```javascript
// En config.js
SELECTORS: {
    NUEVO_MODULO: {
        SELECTOR_1: '#mi-selector',
        SELECTOR_2: '.mi-clase'
    }
}
```

### Extender Automatización

```javascript
// En content-licitacion.js
async function nuevaFuncionAutomatizacion() {
    const config = window.EXTENSION_CONFIG;
    
    // Usar configuración centralizada
    const selector = config.SELECTORS.NUEVO_MODULO.SELECTOR_1;
    const timeout = config.TIMEOUTS.ELEMENT_WAIT;
    
    // Implementar lógica
    await this.waitForElement(selector, timeout);
    // ... resto de la lógica
}
```

## 📊 Monitoreo y Logs

### Estados de Automatización

- **`running`**: Proceso en ejecución
- **`completed`**: Completado exitosamente  
- **`error`**: Error durante el proceso
- **`stopped`**: Detenido manualmente
- **`cancelled`**: Cancelado por cierre de tab
- **`timeout`**: Tiempo agotado

### Debugging

```javascript
// Habilitar modo debug en configuración
debugMode: true

// Los logs aparecerán en:
// 1. Consola del background script
// 2. Consola de content scripts
// 3. Panel de la extensión (próximamente)
```

## 🚨 Resolución de Problemas

### Problemas Comunes

#### 1. **Credenciales no guardadas**
- Verificar que el RUT tenga formato válido: `12345678-9`
- Revisar que la clave sea correcta
- Comprobar permisos de storage de la extensión

#### 2. **Automatización no inicia**
- Verificar que la página sea PharmaTender o Mercado Público
- Comprobar que los content scripts estén cargados
- Revisar consola por errores de JavaScript

#### 3. **Proceso se detiene**
- Verificar conexión a Internet
- Comprobar que los selectores no hayan cambiado
- Revisar timeouts en configuración

### Logs de Debugging

```bash
# Abrir DevTools en:
# 1. Popup de la extensión: F12
# 2. Background script: chrome://extensions/ > "service worker"
# 3. Content scripts: F12 en la página web
```

## 📋 TODO - Próximas Funciones

### Alta Prioridad
- [ ] **Completar funciones TODO** en `content-licitacion.js`
- [ ] **Implementar subida de documentos** por tipo
- [ ] **Integrar firma digital** 
- [ ] **Validación completa de formularios**
- [ ] **Manejo robusto de errores**

### Media Prioridad
- [ ] **Sistema de logs detallado**
- [ ] **Recuperación automática de fallos**
- [ ] **Soporte para múltiples licitaciones simultáneas**
- [ ] **Configuración avanzada de selectores**
- [ ] **Exportar/importar configuración**

### Baja Prioridad
- [ ] **Integración con API de PharmaTender**
- [ ] **Reportes de actividad**
- [ ] **Programación de automatizaciones**
- [ ] **Soporte para otros portales de licitaciones**

## 👥 Contribución

### Para Desarrolladores

1. **Fork del repositorio**
2. **Crear branch para features**: `git checkout -b feature/nueva-funcionalidad`
3. **Seguir convenciones de código**:
   - Usar ES6+ JavaScript
   - Comentarios descriptivos
   - Manejo de errores try/catch
   - Console.log con emojis para debugging
4. **Probar extensivamente**
5. **Submit Pull Request**

### Convenciones de Código

```javascript
// ✅ Buena práctica
try {
    console.log('🔄 Iniciando proceso...');
    const result = await procesarDatos();
    console.log('✅ Proceso completado:', result);
    return result;
} catch (error) {
    console.error('❌ Error en proceso:', error);
    throw error;
}

// ❌ Evitar
processData(); // Sin manejo de errores
console.log('data'); // Sin contexto
```

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🆘 Soporte

### Contacto
- **Issues**: Usar GitHub Issues para reportar bugs
- **Features**: Solicitar nuevas funcionalidades vía Issues
- **Documentación**: Contribuir a mejorar este README

### Información del Sistema
- **Chrome**: Versión mínima 88+
- **Manifest**: Version 3
- **Permisos**: activeTab, storage, notifications, alarms, tabs

---

**Desarrollado con ❤️ para automatizar licitaciones en PharmaTender**