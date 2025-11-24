# 🚀 API Endpoints Laravel 5.5 para Extensión Licitaciones

## 📋 Resumen
Este documento especifica los endpoints que debes crear en tu proyecto Laravel 5.5 (PharmaTender) para que la extensión de Chrome funcione correctamente.

---

## 🔐 Configuración CORS (CRÍTICO)

### Archivo: `app/Http/Middleware/CorsMiddleware.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;

class CorsMiddleware
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        // Permitir extensión de Chrome
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}
```

### Registrar en `app/Http/Kernel.php`:
```php
protected $middlewareGroups = [
    'web' => [
        // ... otros middlewares
        \App\Http\Middleware\CorsMiddleware::class,
    ],
];
```

---

## 🛣️ Rutas (routes/web.php o routes/api.php)

```php
<?php

// Grupo de rutas para la extensión
Route::prefix('api/extension')->middleware(['web', 'cors'])->group(function () {

    // 1. Verificar autenticación del usuario
    Route::get('check-auth', 'ExtensionLicitacionController@checkAuth');

    // 2. Obtener datos de la licitación
    Route::get('licitacion-data', 'ExtensionLicitacionController@getLicitacionData');

    // 3. Obtener archivo de documento para upload
    Route::get('get-document-file', 'ExtensionLicitacionController@getDocumentFile');

    // 4. Actualizar estado de postulación
    Route::post('update-estado-postulacion', 'ExtensionLicitacionController@updateEstadoPostulacion');

    // 5. Insertar nuevo estado de postulación
    Route::post('insertar-estado-postulacion', 'ExtensionLicitacionController@insertarEstadoPostulacion');

    // 6. Verificar instalación de extensión
    Route::get('verify-installation', 'ExtensionLicitacionController@verifyInstallation');

    // 7. Heartbeat para mantener sesión activa
    Route::get('heartbeat', 'ExtensionLicitacionController@heartbeat');
});
```

---

## 🎯 Controlador

### Archivo: `app/Http/Controllers/ExtensionLicitacionController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExtensionLicitacionController extends Controller
{
    /**
     * 1. Verificar autenticación del usuario
     * GET /api/extension/check-auth
     */
    public function checkAuth(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json([
                    'authenticated' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            $user = Auth::user();

            return response()->json([
                'authenticated' => true,
                'user' => [
                    'id' => $user->id,
                    'nombre' => $user->nombre,
                    'email' => $user->email,
                    'rut' => $user->rut ?? null,
                    'organizacion' => $user->organizacion ?? null
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en check-auth: ' . $e->getMessage());
            return response()->json([
                'authenticated' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 2. Obtener datos de la licitación
     * GET /api/extension/licitacion-data?codigo_postulacion=XXXX
     */
    public function getLicitacionData(Request $request)
    {
        try {
            $codigoPostulacion = $request->input('codigo_postulacion');

            if (!$codigoPostulacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código de postulación requerido'
                ], 400);
            }

            // Buscar licitación en tu base de datos
            // AJUSTA SEGÚN TU ESTRUCTURA DE BD
            $licitacion = DB::table('licitaciones')
                ->where('codigo_postulacion', $codigoPostulacion)
                ->first();

            if (!$licitacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Licitación no encontrada'
                ], 404);
            }

            // Obtener productos asociados
            $productos = DB::table('licitacion_productos')
                ->where('licitacion_id', $licitacion->id)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'licitacion' => $licitacion,
                    'productos' => $productos,
                    'nombre_oferta' => $licitacion->nombre_oferta ?? '',
                    'descripcion_oferta' => $licitacion->descripcion_oferta ?? '',
                    'oferta_conjunta' => $licitacion->oferta_conjunta ?? false,
                    'rut_mercado_publico' => $licitacion->rut_mp ?? '',
                    'organizacion_id' => $licitacion->organizacion_id ?? null
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en getLicitacionData: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 3. Obtener archivo de documento para upload
     * GET /api/extension/get-document-file?codigo_postulacion=XXXX&tipo_documento=ADMINISTRATIVO&nombre_archivo=doc.pdf
     */
    public function getDocumentFile(Request $request)
    {
        try {
            $codigoPostulacion = $request->input('codigo_postulacion');
            $tipoDocumento = $request->input('tipo_documento'); // ADMINISTRATIVO, TECNICO, ECONOMICO
            $nombreArchivo = $request->input('nombre_archivo');

            if (!$codigoPostulacion || !$tipoDocumento || !$nombreArchivo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros incompletos'
                ], 400);
            }

            // Construir ruta del archivo según tu estructura
            // AJUSTA SEGÚN TU ESTRUCTURA DE ARCHIVOS
            $basePath = "licitaciones/{$codigoPostulacion}/documentos/";

            switch(strtoupper($tipoDocumento)) {
                case 'ADMINISTRATIVO':
                    $filePath = $basePath . 'administrativos/' . $nombreArchivo;
                    break;
                case 'TECNICO':
                    $filePath = $basePath . 'tecnicos/' . $nombreArchivo;
                    break;
                case 'ECONOMICO':
                    $filePath = $basePath . 'economicos/' . $nombreArchivo;
                    break;
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Tipo de documento inválido'
                    ], 400);
            }

            // Verificar si el archivo existe
            if (!Storage::exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado',
                    'path' => $filePath
                ], 404);
            }

            // Obtener contenido del archivo
            $fileContent = Storage::get($filePath);
            $mimeType = Storage::mimeType($filePath);

            // Convertir a base64 para enviar a la extensión
            $base64Content = base64_encode($fileContent);

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $nombreArchivo,
                    'content' => $base64Content,
                    'mime_type' => $mimeType,
                    'size' => strlen($fileContent)
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en getDocumentFile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 4. Actualizar estado de postulación existente
     * POST /api/extension/update-estado-postulacion
     */
    public function updateEstadoPostulacion(Request $request)
    {
        try {
            $codigoPostulacion = $request->input('codigo_postulacion');
            $estado = $request->input('estado');
            $mensaje = $request->input('mensaje', '');
            $paso = $request->input('paso', '');

            if (!$codigoPostulacion || !$estado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros incompletos'
                ], 400);
            }

            // AJUSTA SEGÚN TU ESTRUCTURA DE BD
            $updated = DB::table('licitaciones')
                ->where('codigo_postulacion', $codigoPostulacion)
                ->update([
                    'estado_automatizacion' => $estado,
                    'mensaje_estado' => $mensaje,
                    'paso_actual' => $paso,
                    'updated_at' => now()
                ]);

            // Registrar en log de estados
            DB::table('licitacion_estados_log')->insert([
                'codigo_postulacion' => $codigoPostulacion,
                'estado' => $estado,
                'mensaje' => $mensaje,
                'paso' => $paso,
                'created_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado correctamente',
                'updated' => $updated > 0
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en updateEstadoPostulacion: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 5. Insertar nuevo registro de estado
     * POST /api/extension/insertar-estado-postulacion
     */
    public function insertarEstadoPostulacion(Request $request)
    {
        try {
            $codigoPostulacion = $request->input('codigo_postulacion');
            $estado = $request->input('estado');
            $mensaje = $request->input('mensaje', '');
            $paso = $request->input('paso', '');
            $detalles = $request->input('detalles', '');

            if (!$codigoPostulacion || !$estado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parámetros incompletos'
                ], 400);
            }

            // Insertar en tabla de log
            $id = DB::table('licitacion_estados_log')->insertGetId([
                'codigo_postulacion' => $codigoPostulacion,
                'estado' => $estado,
                'mensaje' => $mensaje,
                'paso' => $paso,
                'detalles' => $detalles,
                'created_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado insertado correctamente',
                'id' => $id
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error en insertarEstadoPostulacion: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 6. Verificar instalación de la extensión
     * GET /api/extension/verify-installation
     */
    public function verifyInstallation(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Extensión verificada correctamente',
            'timestamp' => now()->toIso8601String(),
            'version' => '1.0.0'
        ], 200);
    }

    /**
     * 7. Heartbeat para mantener sesión activa
     * GET /api/extension/heartbeat
     */
    public function heartbeat(Request $request)
    {
        return response()->json([
            'success' => true,
            'authenticated' => Auth::check(),
            'timestamp' => now()->toIso8601String()
        ], 200);
    }
}
```

---

## 📊 Estructura de Base de Datos Sugerida

### Tabla: `licitaciones`
```sql
CREATE TABLE `licitaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_postulacion` varchar(50) NOT NULL,
  `nombre_oferta` varchar(255) DEFAULT NULL,
  `descripcion_oferta` text DEFAULT NULL,
  `oferta_conjunta` tinyint(1) DEFAULT 0,
  `rut_mp` varchar(20) DEFAULT NULL,
  `organizacion_id` int(11) DEFAULT NULL,
  `estado_automatizacion` varchar(50) DEFAULT 'pendiente',
  `mensaje_estado` text DEFAULT NULL,
  `paso_actual` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_postulacion` (`codigo_postulacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Tabla: `licitacion_productos`
```sql
CREATE TABLE `licitacion_productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `licitacion_id` int(11) NOT NULL,
  `codigo_producto` varchar(100) DEFAULT NULL,
  `nombre_producto` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `indice` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `licitacion_id` (`licitacion_id`),
  CONSTRAINT `licitacion_productos_ibfk_1` FOREIGN KEY (`licitacion_id`) REFERENCES `licitaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Tabla: `licitacion_estados_log`
```sql
CREATE TABLE `licitacion_estados_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_postulacion` varchar(50) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `mensaje` text DEFAULT NULL,
  `paso` varchar(100) DEFAULT NULL,
  `detalles` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `codigo_postulacion` (`codigo_postulacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🔍 Estados de Automatización Sugeridos

```php
// Estados posibles para estado_automatizacion
const ESTADOS = [
    'pendiente' => 'Pendiente de iniciar',
    'iniciando' => 'Iniciando automatización',
    'navegando' => 'Navegando a la oferta',
    'info_basica' => 'Completando información básica',
    'productos' => 'Procesando productos y precios',
    'documentos' => 'Cargando documentos',
    'firma' => 'Procesando firma digital',
    'enviando' => 'Enviando oferta',
    'completado' => 'Completado exitosamente',
    'error' => 'Error en la automatización',
    'cancelado' => 'Cancelado por el usuario'
];
```

---

## 🧪 Testing de Endpoints

### Ejemplo con cURL:

```bash
# 1. Check Auth
curl -X GET "https://prime.pharmatender.cl/api/extension/check-auth" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 2. Get Licitacion Data
curl -X GET "https://prime.pharmatender.cl/api/extension/licitacion-data?codigo_postulacion=1234-5678" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 3. Get Document File
curl -X GET "https://prime.pharmatender.cl/api/extension/get-document-file?codigo_postulacion=1234-5678&tipo_documento=ADMINISTRATIVO&nombre_archivo=doc.pdf" \
  -H "Content-Type: application/json" \
  -b cookies.txt

# 4. Update Estado
curl -X POST "https://prime.pharmatender.cl/api/extension/update-estado-postulacion" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo_postulacion": "1234-5678",
    "estado": "productos",
    "mensaje": "Procesando productos",
    "paso": "pagina_2"
  }' \
  -b cookies.txt
```

---

## ⚠️ IMPORTANTE - Seguridad

1. **Autenticación**: Todos los endpoints deben verificar que el usuario esté autenticado
2. **CORS**: Configurar correctamente para permitir la extensión
3. **CSRF**: Laravel 5.5 requiere token CSRF - la extensión debe manejarlo
4. **Rate Limiting**: Considera agregar rate limiting para prevenir abuso
5. **Validación**: Siempre validar todos los inputs
6. **Logs**: Registrar todas las operaciones importantes

---

## 📝 Notas Adicionales

- **Laravel 5.5**: Usa `web` middleware group para sesiones y CSRF
- **Cookies**: La extensión debe enviar cookies con `credentials: 'include'`
- **Base64**: Los archivos se envían en base64 desde Laravel hacia la extensión
- **File Storage**: Ajusta las rutas según tu configuración de Storage en Laravel
- **Error Handling**: Siempre retornar JSON con estructura consistente

---

## ✅ Checklist de Implementación

- [ ] Crear `CorsMiddleware.php`
- [ ] Registrar middleware en `Kernel.php`
- [ ] Crear rutas en `routes/web.php` o `routes/api.php`
- [ ] Crear `ExtensionLicitacionController.php`
- [ ] Crear/verificar tablas de base de datos
- [ ] Ajustar rutas de Storage para documentos
- [ ] Probar cada endpoint con Postman/cURL
- [ ] Verificar CORS desde la extensión
- [ ] Implementar logs de errores
- [ ] Documentar para tu equipo

---

**Creado para**: Extensión Licitaciones PharmaTender
**Versión Laravel**: 5.5
**Fecha**: 2025-11-24
