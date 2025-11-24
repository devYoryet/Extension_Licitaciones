// security-utils.js - Cifrado seguro para credenciales de licitaciones
// ✅ Compatible con Chrome Extensions y Web Crypto API - Versión para Licitaciones

class SecureCredentialManager {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.storagePrefix = 'pharmatender_lic_secure_';
        this.derivedKey = null;
        
        console.log('🔐 SecureCredentialManager LICITACIONES inicializado');
    }

    /**
     * Genera una clave de cifrado única para la extensión de licitaciones
     */
    async getDerivedKey() {
        if (this.derivedKey) {
            return this.derivedKey;
        }

        try {
            const extensionId = chrome.runtime?.id || 'pharmatender-licitaciones-fallback';
            const baseData = `pharmatender-licitaciones-extension-${extensionId}-v1.0.0`;
            
            console.log('🔑 Generando clave de cifrado para licitaciones...');
            
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(baseData),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            const salt = encoder.encode('pharmatender-licitaciones-salt-2024');
            
            this.derivedKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: this.algorithm, length: this.keyLength },
                false,
                ['encrypt', 'decrypt']
            );

            console.log('✅ Clave de cifrado licitaciones generada');
            return this.derivedKey;

        } catch (error) {
            console.error('❌ Error generando clave licitaciones:', error);
            throw new Error('No se pudo generar clave de cifrado para licitaciones');
        }
    }

    /**
     * Cifra credenciales específicas de licitaciones
     */
    async encrypt(plaintext) {
        try {
            if (!plaintext || typeof plaintext !== 'string') {
                throw new Error('Datos inválidos para cifrar');
            }

            const key = await this.getDerivedKey();
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            const encoder = new TextEncoder();
            const encrypted = await crypto.subtle.encrypt(
                { name: this.algorithm, iv: iv },
                key,
                encoder.encode(plaintext)
            );

            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            const base64Result = this.arrayBufferToBase64(combined);
            console.log('🔒 Credenciales licitaciones cifradas');
            return base64Result;

        } catch (error) {
            console.error('❌ Error cifrando credenciales licitaciones:', error);
            throw new Error('Falló cifrado de credenciales licitaciones');
        }
    }

    /**
     * Descifra credenciales de licitaciones
     */
    async decrypt(encryptedBase64) {
        try {
            if (!encryptedBase64) {
                throw new Error('Datos cifrados inválidos');
            }

            const key = await this.getDerivedKey();
            const combined = this.base64ToArrayBuffer(encryptedBase64);
            
            const iv = combined.slice(0, this.ivLength);
            const data = combined.slice(this.ivLength);

            const decrypted = await crypto.subtle.decrypt(
                { name: this.algorithm, iv: iv },
                key,
                data
            );

            const decoder = new TextDecoder();
            const result = decoder.decode(decrypted);
            
            console.log('🔓 Credenciales licitaciones descifradas');
            return result;

        } catch (error) {
            console.error('❌ Error descifrando credenciales licitaciones:', error);
            throw new Error('Falló descifrado de credenciales licitaciones');
        }
    }

    /**
     * Almacena credenciales de licitación de forma segura
     */
    async storeCredentials(licitacionId, credentials) {
        try {
            const credentialsData = {
                licitacionId: licitacionId,
                usuario: credentials.usuario || '',
                password: credentials.password || '',
                claveUnicaUser: credentials.claveUnicaUser || '',
                claveUnicaPassword: credentials.claveUnicaPassword || '',
                rutRepresentante: credentials.rutRepresentante || '',
                tipoRut: credentials.tipoRut || 'representante',
                conFirma: credentials.conFirma || 'no',
                timestamp: Date.now()
            };

            const encrypted = await this.encrypt(JSON.stringify(credentialsData));
            const storageKey = `${this.storagePrefix}credentials_${licitacionId}`;
            
            await chrome.storage.local.set({ [storageKey]: encrypted });
            
            console.log('💾 Credenciales licitación almacenadas:', licitacionId);
            return true;

        } catch (error) {
            console.error('❌ Error almacenando credenciales licitación:', error);
            return false;
        }
    }

    /**
     * Recupera credenciales de licitación
     */
    async getCredentials(licitacionId) {
        try {
            const storageKey = `${this.storagePrefix}credentials_${licitacionId}`;
            const result = await chrome.storage.local.get([storageKey]);
            
            if (!result[storageKey]) {
                console.log('ℹ️ No hay credenciales almacenadas para:', licitacionId);
                return null;
            }

            const decrypted = await this.decrypt(result[storageKey]);
            const credentials = JSON.parse(decrypted);
            
            // Verificar que no estén expiradas (7 días)
            const age = Date.now() - credentials.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            
            if (age > maxAge) {
                console.log('⏰ Credenciales expiradas para:', licitacionId);
                await this.clearCredentials(licitacionId);
                return null;
            }

            console.log('✅ Credenciales licitación recuperadas:', licitacionId);
            return credentials;

        } catch (error) {
            console.error('❌ Error recuperando credenciales licitación:', error);
            return null;
        }
    }

    /**
     * Elimina credenciales de licitación
     */
    async clearCredentials(licitacionId) {
        try {
            const storageKey = `${this.storagePrefix}credentials_${licitacionId}`;
            await chrome.storage.local.remove([storageKey]);
            
            console.log('🗑️ Credenciales licitación eliminadas:', licitacionId);
            return true;

        } catch (error) {
            console.error('❌ Error eliminando credenciales licitación:', error);
            return false;
        }
    }

    /**
     * Almacena datos de automatización de licitación
     */
    async storeAutomationData(licitacionId, automationData) {
        try {
            const dataToStore = {
                licitacionId: licitacionId,
                data: automationData,
                timestamp: Date.now()
            };

            const encrypted = await this.encrypt(JSON.stringify(dataToStore));
            const storageKey = `${this.storagePrefix}automation_${licitacionId}`;
            
            await chrome.storage.local.set({ [storageKey]: encrypted });
            
            console.log('💾 Datos automatización licitación almacenados:', licitacionId);
            return true;

        } catch (error) {
            console.error('❌ Error almacenando datos automatización:', error);
            return false;
        }
    }

    /**
     * Recupera datos de automatización de licitación
     */
    async getAutomationData(licitacionId) {
        try {
            const storageKey = `${this.storagePrefix}automation_${licitacionId}`;
            const result = await chrome.storage.local.get([storageKey]);
            
            if (!result[storageKey]) {
                return null;
            }

            const decrypted = await this.decrypt(result[storageKey]);
            const data = JSON.parse(decrypted);
            
            // Verificar edad (1 hora)
            const age = Date.now() - data.timestamp;
            const maxAge = 60 * 60 * 1000;
            
            if (age > maxAge) {
                await this.clearAutomationData(licitacionId);
                return null;
            }

            return data;

        } catch (error) {
            console.error('❌ Error recuperando datos automatización:', error);
            return null;
        }
    }

    /**
     * Elimina datos de automatización
     */
    async clearAutomationData(licitacionId) {
        try {
            const storageKey = `${this.storagePrefix}automation_${licitacionId}`;
            await chrome.storage.local.remove([storageKey]);
            return true;
        } catch (error) {
            console.error('❌ Error eliminando datos automatización:', error);
            return false;
        }
    }

    // Métodos auxiliares
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Limpia todas las credenciales expiradas
     */
    async cleanExpiredCredentials() {
        try {
            console.log('🧹 Limpiando credenciales expiradas...');
            
            const allData = await chrome.storage.local.get(null);
            const keysToRemove = [];
            
            for (const [key, value] of Object.entries(allData)) {
                if (key.startsWith(this.storagePrefix)) {
                    try {
                        const decrypted = await this.decrypt(value);
                        const data = JSON.parse(decrypted);
                        
                        const age = Date.now() - data.timestamp;
                        const maxAge = 7 * 24 * 60 * 60 * 1000;
                        
                        if (age > maxAge) {
                            keysToRemove.push(key);
                        }
                    } catch (error) {
                        // Si no se puede descifrar, también eliminar
                        keysToRemove.push(key);
                    }
                }
            }
            
            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
                console.log(`🗑️ Eliminadas ${keysToRemove.length} credenciales expiradas`);
            }
            
        } catch (error) {
            console.error('❌ Error limpiando credenciales expiradas:', error);
        }
    }
}

// Crear instancia global para licitaciones
let secureManagerLicitaciones = null;

try {
    secureManagerLicitaciones = new SecureCredentialManager();
    window.SecureCredentialManagerLicitaciones = secureManagerLicitaciones;
    console.log('✅ SecureCredentialManager Licitaciones disponible globalmente');
} catch (error) {
    console.error('❌ Error inicializando SecureCredentialManager Licitaciones:', error);
}

// Limpiar credenciales expiradas al cargar
if (secureManagerLicitaciones) {
    setTimeout(() => {
        secureManagerLicitaciones.cleanExpiredCredentials();
    }, 2000);
}