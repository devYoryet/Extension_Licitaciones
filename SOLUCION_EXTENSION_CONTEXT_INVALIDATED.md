# 🔧 Solución: Extension Context Invalidated

## 🐛 Problema

**Error**: `Extension context invalidated`

**Cuándo ocurre**:
1. Usuario abre página de licitación
2. La extensión inyecta content script (`content-platform.js`)
3. Usuario recarga la extensión en `chrome://extensions/` (o la extensión se actualiza)
4. Usuario hace click en botón "Automatizar Licitación"
5. **Error**: El content script viejo intenta comunicarse con el nuevo background script

**Stack Trace Original**:
```
Error: Extension context invalidated.
    at PlatformLicitacionDetector.startLicitacionAutomation (content-platform.js:228:59)
    at HTMLButtonElement.<anonymous> (content-platform.js:161:18)
```

---

## ✅ Solución Implementada

### 1. **Detección de Contexto Invalidado**

Función para verificar si el contexto de extensión está válido:

```javascript
isExtensionContextValid() {
    try {
        // Intentar acceder al runtime
        if (chrome.runtime && chrome.runtime.id) {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}
```

**Uso**: Se verifica al inicio de `startLicitacionAutomation()`:
```javascript
async startLicitacionAutomation() {
    // ✅ Verificar contexto antes de continuar
    if (!this.isExtensionContextValid()) {
        this.showExtensionInvalidatedError();
        return;
    }
    // ... resto del código
}
```

---

### 2. **Try-Catch en Operaciones Chrome API**

#### Chrome Storage:
```javascript
// ❌ ANTES (sin protección)
const credsCheck = await chrome.storage.local.get(['encryptedCredentials']);

// ✅ DESPUÉS (con try-catch)
let credsCheck;
try {
    credsCheck = await chrome.storage.local.get(['encryptedCredentials']);
} catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
        this.showExtensionInvalidatedError();
        return;
    }
    throw error;
}
```

#### Chrome Runtime Messages:
```javascript
// ❌ ANTES (sin protección)
const response = await chrome.runtime.sendMessage({
    action: 'startLicitacionAutomation',
    ...
});

// ✅ DESPUÉS (con try-catch)
let response;
try {
    response = await chrome.runtime.sendMessage({
        action: 'startLicitacionAutomation',
        ...
    });
} catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
        this.showExtensionInvalidatedError();
        return;
    }
    throw error;
}
```

---

### 3. **Panel de Error Amigable**

UI que informa al usuario y ofrece solución:

```javascript
showExtensionInvalidatedError() {
    // 1. Remover botón viejo
    const existingButton = document.getElementById('pht-automation-btn');
    if (existingButton) {
        existingButton.remove();
    }

    // 2. Crear panel de error con botón de recarga
    const errorPanel = document.createElement('div');
    errorPanel.innerHTML = `
        <div style="...estilos...">
            ⚠️ Extensión Recargada
            
            La extensión se ha actualizado. 
            Por favor recarga esta página para continuar.
            
            [🔄 Recargar Página Ahora]
        </div>
    `;
    
    // 3. Agregar listener para recargar
    document.getElementById('pht-reload-page-btn')
        .addEventListener('click', () => {
            window.location.reload();
        });
}
```

**Resultado visual**:
```
┌──────────────────────────────────────┐
│ ⚠️  Extensión Recargada              │
│                                       │
│ La extensión se ha actualizado.      │
│ Por favor recarga esta página para   │
│ continuar.                            │
│                                       │
│  [🔄 Recargar Página Ahora]          │
└──────────────────────────────────────┘
```

---

## 🎯 Puntos de Protección Implementados

### Archivo: `content-platform.js`

| Línea | Función | Protección |
|-------|---------|------------|
| 214-219 | `startLicitacionAutomation()` | Verificación inicial de contexto |
| 229-238 | `startLicitacionAutomation()` | Try-catch en `chrome.storage.local.get()` |
| 324-336 | `startLicitacionAutomation()` | Try-catch en `chrome.runtime.sendMessage()` |
| 356-366 | `startLicitacionAutomation()` | Catch general para contexto invalidado |
| 202-213 | `addInfoIndicator()` | Try-catch en click del indicador |
| 374-384 | `isExtensionContextValid()` | Nueva función de verificación |
| 386-448 | `showExtensionInvalidatedError()` | Nueva función de UI amigable |

---

## 🧪 Testing

### Escenario 1: Recarga de Extensión Durante Uso

**Pasos**:
1. Abrir página de licitación en PharmaTender
2. Verificar que aparezca botón "Automatizar Licitación"
3. Ir a `chrome://extensions/`
4. Click en botón de recarga de la extensión
5. Volver a la página de licitación
6. Click en "Automatizar Licitación"

**Resultado Esperado** ✅:
- NO debe aparecer error en consola
- Panel rojo debe aparecer: "⚠️ Extensión Recargada"
- Botón "🔄 Recargar Página Ahora" debe estar visible
- Click en botón debe recargar la página
- Después de recargar, botón "Automatizar" debe funcionar

**Resultado Anterior** ❌:
- Error en consola: "Extension context invalidated"
- Botón queda bloqueado
- No hay forma de recuperarse sin recargar manualmente

---

### Escenario 2: Actualización Automática de Extensión

**Pasos**:
1. Tener página de licitación abierta
2. Hacer cambios en archivos de extensión
3. Guardar archivos (extensión se recarga automáticamente)
4. Intentar usar botón de automatización

**Resultado Esperado** ✅:
- Panel de error aparece inmediatamente
- Usuario puede recargar con un click
- No hay confusión sobre qué hacer

---

### Escenario 3: Verificación de Contexto Preventiva

**Pasos**:
1. Abrir DevTools (F12) en página de licitación
2. En consola ejecutar: `window.platformLicitacionDetector.isExtensionContextValid()`
3. Debe retornar `true`
4. Recargar extensión en `chrome://extensions/`
5. Ejecutar nuevamente: `window.platformLicitacionDetector.isExtensionContextValid()`
6. Debe retornar `false`

**Resultado** ✅:
- La función detecta correctamente el estado del contexto

---

## 📊 Comparación Antes/Después

### ANTES ❌

**Experiencia del Usuario**:
```
1. Usuario hace click en botón
   ↓
2. Error en consola (no visible para usuario)
   ↓
3. Botón se queda "trabado" mostrando "Verificando credenciales..."
   ↓
4. Usuario no sabe qué hacer
   ↓
5. Tiene que descubrir por sí mismo que debe recargar la página
```

**Logs**:
```javascript
❌ [PLATFORM] Excepción en startLicitacionAutomation: 
   Error: Extension context invalidated.
```

---

### DESPUÉS ✅

**Experiencia del Usuario**:
```
1. Usuario hace click en botón
   ↓
2. Panel rojo aparece instantáneamente
   ↓
3. Mensaje claro: "Extensión Recargada"
   ↓
4. Botón obvio: "🔄 Recargar Página Ahora"
   ↓
5. Un click y todo funciona nuevamente
```

**Logs**:
```javascript
⚠️ [PLATFORM] Contexto de extensión invalidado - requiere recarga
🔄 [PLATFORM] Recargando página...
```

---

## 💡 Mejoras Futuras

### 1. Auto-recarga Silenciosa
```javascript
// Detectar invalidación y recargar automáticamente después de 3s
showExtensionInvalidatedError() {
    this.showNotification('Extensión actualizada, recargando en 3s...', 'info');
    
    let countdown = 3;
    const timer = setInterval(() => {
        countdown--;
        if (countdown === 0) {
            clearInterval(timer);
            window.location.reload();
        }
    }, 1000);
}
```

### 2. Persistir Estado Antes de Recargar
```javascript
// Guardar estado en localStorage antes de recargar
async reloadWithState() {
    localStorage.setItem('pht_before_reload', JSON.stringify({
        licitacionId: this.currentLicitacionId,
        timestamp: Date.now(),
        wasAutomating: true
    }));
    
    window.location.reload();
}

// Al cargar, recuperar estado
init() {
    const savedState = localStorage.getItem('pht_before_reload');
    if (savedState) {
        const state = JSON.parse(savedState);
        // Reanudar automatización si era reciente
        if (Date.now() - state.timestamp < 30000) {
            this.resumeAutomation(state);
        }
        localStorage.removeItem('pht_before_reload');
    }
}
```

### 3. Heartbeat de Contexto
```javascript
// Verificar contexto cada 5 segundos
startContextHeartbeat() {
    setInterval(() => {
        if (!this.isExtensionContextValid()) {
            console.warn('⚠️ Contexto invalidado detectado en heartbeat');
            this.showExtensionInvalidatedError();
        }
    }, 5000);
}
```

---

## 🚀 Deployment

### Archivos Modificados

- `content-platform.js`: +95 líneas (3 nuevas funciones, múltiples try-catch)

### Testing Checklist

- [x] Verificar detección de contexto invalidado
- [x] Verificar panel de error aparece correctamente
- [x] Verificar botón de recarga funciona
- [x] Verificar try-catch en chrome.storage
- [x] Verificar try-catch en chrome.runtime.sendMessage
- [x] Verificar logs informativos en consola
- [x] Verificar que extensión funciona normalmente si contexto es válido

### Commit Message

```bash
git commit -m "🛡️ Fix: Manejo robusto de 'Extension context invalidated'

- Detectar contexto invalidado antes de operaciones Chrome API
- Try-catch en chrome.storage y chrome.runtime.sendMessage
- Panel de error amigable con botón de recarga
- Prevenir estado de botón trabado
- Logs informativos para debugging

Soluciona error cuando extensión se recarga mientras página está abierta
"
```

---

## 📞 Soporte

Si el error persiste después de implementar esta solución:

1. **Verificar versión**: Asegurar que tienes la última versión del código
2. **Limpiar storage**: 
   ```javascript
   chrome.storage.local.clear()
   ```
3. **Reinstalar extensión**: Remover y volver a cargar
4. **Verificar permisos**: Confirmar que el manifest.json tiene todos los permisos necesarios

**Logs útiles para debugging**:
```
✅ [PLATFORM] Detector inicializado inmediatamente
🔍 [PLATFORM] Verificando credenciales...
⚠️ [PLATFORM] Contexto de extensión invalidado - requiere recarga
🔄 [PLATFORM] Recargando página...
```

---

**Version**: 1.0.2  
**Issue**: Extension context invalidated  
**Status**: ✅ Resuelto  
**Fecha**: 2025-11-24

