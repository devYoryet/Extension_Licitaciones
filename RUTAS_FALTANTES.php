// ======================================================================
// RUTAS FALTANTES PARA EXTENSIÓN - AGREGAR A routes/web.php
// ======================================================================
// Estas rutas deben agregarse al archivo routes/web.php existente
// dentro del grupo 'prefix' => 'api/extension'

// GRUPO EXISTENTE (línea 1539 en routes/web.php):
Route::group([
    'prefix' => 'api/extension',
    'middleware' => ['web', 'auth']
], function() {

    // ✅ RUTAS EXISTENTES (ya implementadas):
    Route::get('licitacion-data-completa', 'CargaDocumentoController@getLicitacionDataCompleta');
    Route::post('get-parametros-postulacion', 'CargaDocumentoController@getParametrosPostulacion');
    Route::post('validar-datos-postulacion', 'CargaDocumentoController@validarDatosPostulacion');
    Route::post('store-credenciales-extension', 'CargaDocumentoController@storeCredencialesExtension');

    // 🆕 RUTAS NUEVAS (AGREGAR ESTAS):
    
    /**
     * Descarga archivo específico de documento
     * Usado por: descargarArchivoDesdeBD() en content-licitacion.js línea 2642
     */
    Route::get('documento-file-licitacion', 'CargaDocumentoController@documentoFileLicitacion');
    
    /**
     * Actualiza estado del proceso de automatización
     * Usado por: actualizarEstadoEnBD() en content-licitacion.js línea 9795
     */
    Route::post('actualizar-estado', 'CargaDocumentoController@actualizarEstado');
    
    /**
     * Envía email de confirmación desde la extensión
     * Usado por: enviarEmail() - nuevo método a implementar en JS
     */
    Route::post('enviar-email-confirmacion', 'CargaDocumentoController@enviarEmailExtension');
    
    /**
     * Registra logs detallados del proceso
     * Usado por: logger - nuevo sistema de logging a implementar
     */
    Route::post('registrar-log', 'CargaDocumentoController@registrarLog');
    
    /**
     * Confirma finalización exitosa del proceso completo
     * Usado por: finalizarOferta() en content-licitacion.js línea 2852
     */
    Route::post('confirmar-finalizacion', 'CargaDocumentoController@confirmarFinalizacion');

    // RUTA DE TEST (opcional - para debug)
    Route::get('test-connection', function() {
        return response()->json([
            'success' => true,
            'message' => 'Conexión exitosa con API Extension',
            'timestamp' => now()->toISOString(),
            'user' => Auth::user()->name,
            'company' => Auth::user()->company->name ?? 'N/A'
        ]);
    });
});

// ======================================================================
// MIGRACIONES DE BASE DE DATOS NECESARIAS
// ======================================================================

/*
CREAR ESTAS TABLAS EN LA BASE DE DATOS:

1. Tabla para logs de estados:
CREATE TABLE estado_extension_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    licitacion VARCHAR(255) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    mensaje TEXT NULL,
    paso VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_licitacion (licitacion),
    INDEX idx_user_company (user_id, company_id),
    INDEX idx_created_at (created_at)
);

2. Tabla para logs de emails:
CREATE TABLE email_extension_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    licitacion VARCHAR(255) NOT NULL,
    email_destino VARCHAR(255) NOT NULL,
    emails_copia JSON NULL,
    estado ENUM('enviado', 'error') NOT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_licitacion (licitacion),
    INDEX idx_estado (estado),
    INDEX idx_created_at (created_at)
);

3. Tabla para logs generales:
CREATE TABLE extension_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    nivel ENUM('info', 'warning', 'error', 'debug') NOT NULL,
    mensaje TEXT NOT NULL,
    contexto TEXT NULL,
    licitacion VARCHAR(255) NULL,
    paso VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    url TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nivel (nivel),
    INDEX idx_licitacion (licitacion),
    INDEX idx_created_at (created_at)
);

4. Tabla para finalizaciones:
CREATE TABLE finalizaciones_extension (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    licitacion VARCHAR(255) NOT NULL,
    pasos_completados JSON NOT NULL,
    tiempo_total_segundos INT NULL,
    productos_procesados INT NULL,
    documentos_cargados INT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'completado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_licitacion (licitacion),
    INDEX idx_estado (estado),
    INDEX idx_created_at (created_at)
);

5. Agregar columnas a tabla existente (opcional):
ALTER TABLE postulaciones.carga_documentos 
ADD COLUMN estado_extension VARCHAR(50) NULL,
ADD COLUMN completado_at TIMESTAMP NULL;
*/