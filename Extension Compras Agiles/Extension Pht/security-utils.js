// security-utils.js - Cifrado seguro para credenciales
// ✅ Compatible con Chrome Extensions y Web Crypto API

class SecureCredentialManager {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.storagePrefix = 'pharmatender_secure_';
        this.derivedKey = null;
        
        console.log('🔐 SecureCredentialManager inicializado');
    }

    /**
     * Genera una clave de cifrado única para esta extensión
     * @returns {Promise<CryptoKey>} Clave de cifrado
     */
    async getDerivedKey() {
        if (this.derivedKey) {
            return this.derivedKey;
        }

        try {
            // Crear material base único para esta extensión
            const extensionId = chrome.runtime?.id || 'pharmatender-extension-fallback';
            const baseData = `pharmatender-mp-extension-${extensionId}-v1.0.0`;
            
            console.log('🔑 Generando clave de cifrado...');
            
            // Convertir a buffer
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(baseData),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            // Salt único pero determinístico
            const salt = encoder.encode('pharmatender-salt-mp-2024');
            
            this.derivedKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000, // 100k iteraciones para seguridad
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: this.algorithm, length: this.keyLength },
                false,
                ['encrypt', 'decrypt']
            );

            console.log('✅ Clave de cifrado generada exitosamente');
            return this.derivedKey;

        } catch (error) {
            console.error('❌ Error generando clave:', error);
            throw new Error('No se pudo generar clave de cifrado segura');
        }
    }

    /**
     * Cifra texto usando AES-GCM
     * @param {string} plaintext - Texto a cifrar
     * @returns {Promise<string>} Texto cifrado en base64
     */
    async encrypt(plaintext) {
        try {
            if (!plaintext || typeof plaintext !== 'string') {
                throw new Error('Texto inválido para cifrar');
            }

            const key = await this.getDerivedKey();
            
            // Generar IV aleatorio para cada cifrado
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            // Cifrar
            const encoder = new TextEncoder();
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encoder.encode(plaintext)
            );

            // Combinar IV + datos cifrados
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            // Convertir a base64
            const base64Result = this.arrayBufferToBase64(combined);
            
            console.log('🔒 Texto cifrado exitosamente');
            return base64Result;

        } catch (error) {
            console.error('❌ Error cifrando:', error);
            throw new Error('Error en el proceso de cifrado');
        }
    }

    /**
     * Descifra texto cifrado con AES-GCM
     * @param {string} encryptedBase64 - Texto cifrado en base64
     * @returns {Promise<string>} Texto descifrado
     */
    async decrypt(encryptedBase64) {
        try {
            if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
                throw new Error('Datos cifrados inválidos');
            }

            const key = await this.getDerivedKey();
            
            // Convertir de base64
            const combined = this.base64ToArrayBuffer(encryptedBase64);
            
            if (combined.length < this.ivLength) {
                throw new Error('Datos cifrados corruptos: muy cortos');
            }
            
            // Separar IV y datos cifrados
            const iv = combined.slice(0, this.ivLength);
            const encrypted = combined.slice(this.ivLength);

            // Descifrar
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encrypted
            );

            // Convertir a string
            const decoder = new TextDecoder();
            const result = decoder.decode(decrypted);
            
            console.log('🔓 Texto descifrado exitosamente');
            return result;

        } catch (error) {
            console.error('❌ Error descifrando:', error);
            throw new Error('Error descifrando datos - posiblemente corruptos o clave incorrecta');
        }
    }

    /**
     * Guarda credenciales cifradas en chrome.storage
     * @param {string} username - Nombre de usuario/RUT
     * @param {string} password - Contraseña
     * @returns {Promise<boolean>} True si se guardó exitosamente
     */
    async saveSecureCredentials(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Username y password son requeridos');
            }

            console.log('💾 Guardando credenciales de forma segura...');

            // Cifrar por separado
            const encryptedUsername = await this.encrypt(username.trim());
            const encryptedPassword = await this.encrypt(password);

            // Preparar datos para storage
            const credentialData = {
                username: encryptedUsername,
                password: encryptedPassword,
                timestamp: Date.now(),
                version: '1.0.0',
                algorithm: this.algorithm
            };

            // Guardar en chrome.storage.local
            await chrome.storage.local.set({
                [this.storagePrefix + 'credentials']: credentialData
            });

            console.log('✅ Credenciales guardadas de forma segura');
            return true;

        } catch (error) {
            console.error('❌ Error guardando credenciales:', error);
            throw new Error('No se pudieron guardar las credenciales: ' + error.message);
        }
    }

    /**
     * Recupera y descifra credenciales del storage
     * @returns {Promise<object|null>} Credenciales o null si no existen
     */
    async getSecureCredentials() {
        try {
            console.log('🔍 Recuperando credenciales...');

            const stored = await chrome.storage.local.get([this.storagePrefix + 'credentials']);
            const credentialData = stored[this.storagePrefix + 'credentials'];

            if (!credentialData) {
                console.log('ℹ️ No hay credenciales guardadas');
                return null;
            }

            // Verificar estructura de datos
            if (!credentialData.username || !credentialData.password) {
                console.warn('⚠️ Estructura de credenciales inválida');
                await this.clearSecureCredentials();
                return null;
            }

            // Verificar edad de credenciales (30 días)
            const age = Date.now() - (credentialData.timestamp || 0);
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días

            if (age > maxAge) {
                console.warn('⚠️ Credenciales expiradas, eliminando...');
                await this.clearSecureCredentials();
                return null;
            }

            // Descifrar
            const username = await this.decrypt(credentialData.username);
            const password = await this.decrypt(credentialData.password);

            console.log('✅ Credenciales recuperadas exitosamente');

            return {
                username: username,
                password: password,
                timestamp: credentialData.timestamp,
                age: Math.floor(age / (24 * 60 * 60 * 1000)) // días
            };

        } catch (error) {
            console.error('❌ Error recuperando credenciales:', error);
            
            // Si hay error de descifrado, limpiar storage corrupto
            await this.clearSecureCredentials();
            
            return null;
        }
    }

    /**
     * Elimina credenciales del storage
     * @returns {Promise<boolean>} True si se eliminó exitosamente
     */
    async clearSecureCredentials() {
        try {
            await chrome.storage.local.remove([this.storagePrefix + 'credentials']);
            console.log('🗑️ Credenciales eliminadas del storage');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando credenciales:', error);
            return false;
        }
    }

    /**
     * Verifica si existen credenciales guardadas
     * @returns {Promise<boolean>} True si existen credenciales
     */
    async hasSecureCredentials() {
        try {
            const stored = await chrome.storage.local.get([this.storagePrefix + 'credentials']);
            const hasCredentials = !!stored[this.storagePrefix + 'credentials'];
            
            console.log(`🔍 Credenciales existentes: ${hasCredentials ? 'Sí' : 'No'}`);
            return hasCredentials;
        } catch (error) {
            console.error('❌ Error verificando credenciales:', error);
            return false;
        }
    }

    /**
     * Actualiza solo la contraseña (mantiene username)
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<boolean>} True si se actualizó exitosamente
     */
    async updatePassword(newPassword) {
        try {
            const currentCredentials = await this.getSecureCredentials();
            
            if (!currentCredentials) {
                throw new Error('No hay credenciales existentes para actualizar');
            }

            console.log('🔄 Actualizando contraseña...');
            return await this.saveSecureCredentials(currentCredentials.username, newPassword);

        } catch (error) {
            console.error('❌ Error actualizando contraseña:', error);
            throw new Error('No se pudo actualizar la contraseña: ' + error.message);
        }
    }

    /**
     * Convierte ArrayBuffer a base64
     * @param {ArrayBuffer} buffer - Buffer a convertir
     * @returns {string} String en base64
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convierte base64 a ArrayBuffer
     * @param {string} base64 - String en base64
     * @returns {Uint8Array} Array buffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Obtiene información del storage (para debugging)
     * @returns {Promise<object>} Información del storage
     */
    async getStorageInfo() {
        try {
            const stored = await chrome.storage.local.get([this.storagePrefix + 'credentials']);
            const credentialData = stored[this.storagePrefix + 'credentials'];
            
            if (!credentialData) {
                return { exists: false };
            }
            
            const age = Date.now() - (credentialData.timestamp || 0);
            
            return {
                exists: true,
                timestamp: new Date(credentialData.timestamp).toLocaleString(),
                age_days: Math.floor(age / (24 * 60 * 60 * 1000)),
                version: credentialData.version,
                algorithm: credentialData.algorithm
            };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    }
}

// 🏭 INSTANCIA SINGLETON
let secureManagerInstance = null;

function getSecureCredentialManager() {
    if (!secureManagerInstance) {
        secureManagerInstance = new SecureCredentialManager();
    }
    return secureManagerInstance;
}

// 🔧 FUNCIONES DE CONVENIENCIA (API simplificada)

/**
 * Guarda credenciales de forma segura
 * @param {string} username - Usuario/RUT
 * @param {string} password - Contraseña
 * @returns {Promise<boolean>} Resultado
 */
async function saveCredentials(username, password) {
    const manager = getSecureCredentialManager();
    return await manager.saveSecureCredentials(username, password);
}

/**
 * Obtiene credenciales de forma segura
 * @returns {Promise<object|null>} Credenciales o null
 */
async function getCredentials() {
    const manager = getSecureCredentialManager();
    return await manager.getSecureCredentials();
}

/**
 * Limpia credenciales
 * @returns {Promise<boolean>} Resultado
 */
async function clearCredentials() {
    const manager = getSecureCredentialManager();
    return await manager.clearSecureCredentials();
}

/**
 * Verifica si hay credenciales
 * @returns {Promise<boolean>} True si existen
 */
async function hasCredentials() {
    const manager = getSecureCredentialManager();
    return await manager.hasSecureCredentials();
}

/**
 * Actualiza solo la contraseña
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<boolean>} Resultado
 */
async function updatePassword(newPassword) {
    const manager = getSecureCredentialManager();
    return await manager.updatePassword(newPassword);
}

/**
 * Obtiene información del storage (debugging)
 * @returns {Promise<object>} Info del storage
 */
async function getStorageInfo() {
    const manager = getSecureCredentialManager();
    return await manager.getStorageInfo();
}

// 📤 EXPORTAR PARA USO GLOBAL
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        SecureCredentialManager,
        getSecureCredentialManager,
        saveCredentials,
        getCredentials,
        clearCredentials,
        hasCredentials,
        updatePassword,
        getStorageInfo
    };
} else {
    // Browser/Extension environment
    window.SecureCredentialManager = SecureCredentialManager;
    window.SecureCredentials = {
        getManager: getSecureCredentialManager,
        save: saveCredentials,
        get: getCredentials,
        clear: clearCredentials,
        has: hasCredentials,
        updatePassword: updatePassword,
        getStorageInfo: getStorageInfo
    };
    
    console.log('🔐 Security Utils cargado - API disponible en window.SecureCredentials');
}

// 🐛 FUNCIONES DE TEST (solo para desarrollo)
if (typeof window !== 'undefined' && window.EXTENSION_CONFIG?.DEBUG_MODE) {
    window.TestSecurity = {
        async testEncryption() {
            const manager = getSecureCredentialManager();
            const testData = 'test-password-123';
            
            console.log('🧪 Testing cifrado...');
            const encrypted = await manager.encrypt(testData);
            console.log('✅ Cifrado:', encrypted.substring(0, 20) + '...');
            
            const decrypted = await manager.decrypt(encrypted);
            console.log('✅ Descifrado:', decrypted);
            
            console.log('🧪 Test resultado:', testData === decrypted ? 'PASSED' : 'FAILED');
            return testData === decrypted;
        },
        
        async testCredentials() {
            console.log('🧪 Testing credenciales...');
            
            await saveCredentials('12345678-9', 'test-password');
            const retrieved = await getCredentials();
            
            console.log('✅ Credenciales guardadas y recuperadas:', retrieved);
            
            await clearCredentials();
            console.log('✅ Credenciales eliminadas');
            
            return retrieved && retrieved.username === '12345678-9';
        }
    };
    
    console.log('🧪 Test functions available:');
    console.log('  - window.TestSecurity.testEncryption()');
    console.log('  - window.TestSecurity.testCredentials()');
}