# Rutas API para Extensión de Licitaciones

## Archivo: routes/api.php

Agregar DESPUÉS de las rutas de Compras Ágiles:

```php
// ===============================================
// 🆕 RUTAS DE EXTENSIÓN - LICITACIONES
// ===============================================

Route::group([
    'prefix' => 'api/extension',
    'middleware' => 'simple.cors'
], function () {

    // ===============================================
    // RUTAS PROTEGIDAS - LICITACIONES (requieren autenticación)
    // ===============================================

    Route::group(['middleware' => 'auth'], function () {

        /**
         * Obtener datos completos de licitación
         * GET /api/extension/licitacion-data-completa
         * Params: id_licitacion, rut_usuario, company_id
         */
        Route::get('licitacion-data-completa', 'CargaDocumentoController@getLicitacionDataCompleta');

        /**
         * Obtener archivo de documento por ID
         * GET /api/extension/documento-file-licitacion
         * Params: documento_id
         */
        Route::get('documento-file-licitacion', 'CargaDocumentoController@getDocumentoFileLicitacion');

        /**
         * Actualizar estado de postulación
         * POST /api/extension/update-estado-licitacion
         * Body: { "codigo_postulacion", "estado", "mensaje", "paso" }
         */
        Route::post('update-estado-licitacion', 'CargaDocumentoController@updateEstadoLicitacion');

        /**
         * Insertar estado inicial de postulación
         * POST /api/extension/insertar-estado-licitacion
         * Body: { "codigo_postulacion", "company_id" }
         */
        Route::post('insertar-estado-licitacion', 'CargaDocumentoController@insertarEstadoLicitacion');

    });

});
```

---

## Métodos a agregar en CargaDocumentoController.php

Agregar estos métodos AL FINAL del controlador (antes del último `}`):

```php
/**
 * ================================================================
 * MÉTODOS PARA LA EXTENSIÓN DE CHROME
 * ================================================================
 */

/**
 * Obtener datos completos de licitación para extensión
 * GET /api/extension/licitacion-data-completa
 */
public function getLicitacionDataCompleta(Request $request)
{
    try {
        // Validar autenticación
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'error' => 'Usuario no autenticado'
            ], 401)->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                    ->header('Access-Control-Allow-Credentials', 'true');
        }

        // Validar parámetros
        $this->validate($request, [
            'id_licitacion' => 'required|string',
            'rut_usuario' => 'required|string',
            'company_id' => 'required|integer'
        ]);

        $idLicitacion = $request->input('id_licitacion');
        $rutUsuario = $request->input('rut_usuario');
        $companyId = $request->input('company_id');

        \Log::info("Extension Licitaciones: Obteniendo datos", [
            'licitacion' => $idLicitacion,
            'rut' => $rutUsuario,
            'company' => $companyId
        ]);

        // 1. Obtener información de la licitación desde licitaciones_diarias_total
        $licitacionInfo = DB::connection('licitaciones_diarias_total')
            ->table('Licitaciones_diarias')
            ->where('Licitacion', $idLicitacion)
            ->orderBy('Fecha_Publicacion', 'desc')
            ->first();

        if (!$licitacionInfo) {
            return response()->json([
                'success' => false,
                'message' => 'Licitación no encontrada'
            ], 404);
        }

        // 2. Obtener productos desde precio_interno
        $productos = DB::connection('precio_interno')
            ->table('item_producto')
            ->where('Licitacion', $idLicitacion)
            ->where('strRutUsuario', $rutUsuario)
            ->orderBy('Item', 'asc')
            ->get();

        $productosArray = [];
        $montoTotal = 0;

        foreach ($productos as $producto) {
            // Obtener glosa si existe
            $glosa = DB::connection('precio_interno')
                ->table('item_glosa')
                ->where('Licitacion', $idLicitacion)
                ->where('strRutUsuario', $rutUsuario)
                ->where('Item', $producto->Item)
                ->first();

            $descripcion = $producto->Descripcion ?? '';
            if ($glosa && !empty($glosa->Glosa)) {
                $descripcion .= ' - ' . $glosa->Glosa;
            }

            $precio = floatval($producto->Precio ?? 0);
            $cantidad = intval($producto->Cantidad ?? 1);
            $subtotal = $precio * $cantidad;
            $montoTotal += $subtotal;

            $productosArray[] = [
                'numero_linea' => intval($producto->Item),
                'codigo_producto' => $producto->CodigoProducto ?? '',
                'nombre' => $producto->Nombre ?? '',
                'descripcion' => $descripcion,
                'cantidad' => $cantidad,
                'precio_unitario' => $precio,
                'precio_total' => $subtotal
            ];
        }

        // 3. Obtener documentos desde postulaciones.carga_documentos
        $documentos = DB::connection('postulaciones')
            ->table('carga_documentos')
            ->where('company_id', $companyId)
            ->where('licitacion', $idLicitacion)
            ->where('estado', 0)
            ->orderBy('tipo', 'desc')
            ->get();

        $documentosAgrupados = [
            'administrativos' => [],
            'tecnicos' => [],
            'economicos' => []
        ];

        foreach ($documentos as $doc) {
            $tipo = strtolower($doc->tipo);

            $docData = [
                'id' => $doc->id,
                'nombre' => $doc->nombre,
                'tipo' => $doc->tipo,
                'filename' => $doc->nombre,
                'created_at' => $doc->created_at
            ];

            if ($tipo === 'administrativo') {
                $documentosAgrupados['administrativos'][] = $docData;
            } elseif ($tipo === 'tecnico') {
                $documentosAgrupados['tecnicos'][] = $docData;
            } elseif ($tipo === 'economico') {
                $documentosAgrupados['economicos'][] = $docData;
            }
        }

        // 4. Obtener datos de la empresa
        $empresa = DB::connection('pharmatender')
            ->table('company')
            ->where('id', $companyId)
            ->first();

        // 5. Construir respuesta
        $response = [
            'success' => true,
            'data' => [
                'id_licitacion' => $idLicitacion,
                'codigo_postulacion' => $licitacionInfo->CodigoPostulacion ?? null,
                'nombre_licitacion' => $licitacionInfo->Nombre ?? 'Sin nombre',
                'descripcion' => $licitacionInfo->Descripcion ?? '',
                'url_mercado_publico' => 'https://www.mercadopublico.cl/Portal/Modules/Desktop/Desktop.aspx?enc=' . urlencode($licitacionInfo->CodigoPostulacion ?? ''),

                // Configuración
                'oferta_conjunta' => false,
                'monto_total' => $montoTotal,
                'moneda' => 'CLP',

                // Productos
                'productos' => $productosArray,
                'total_items' => count($productosArray),

                // Documentos
                'documentos' => $documentosAgrupados,
                'total_documentos' => count($documentos),

                // Empresa
                'empresa' => [
                    'id' => $empresa->id ?? null,
                    'nombre' => $empresa->name ?? '',
                    'rut' => $empresa->rut ?? ''
                ],

                // Usuario
                'usuario' => [
                    'rut' => $rutUsuario
                ],

                // Fechas
                'fecha_publicacion' => $licitacionInfo->Fecha_Publicacion ?? null,
                'fecha_cierre' => $licitacionInfo->Fecha_Cierre ?? null,

                // Timestamp
                'timestamp' => now()->toIso8601String()
            ]
        ];

        \Log::info("Extension Licitaciones: Datos obtenidos exitosamente", [
            'items' => count($productosArray),
            'documentos' => count($documentos)
        ]);

        return response()->json($response)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->header('Access-Control-Allow-Credentials', 'true');

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Parámetros inválidos',
            'errors' => $e->errors()
        ], 422);

    } catch (\Exception $e) {
        \Log::error('Extension Licitaciones: Error en getLicitacionDataCompleta', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Error obteniendo datos',
            'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
        ], 500);
    }
}

/**
 * Obtener archivo de documento
 * GET /api/extension/documento-file-licitacion
 */
public function getDocumentoFileLicitacion(Request $request)
{
    try {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        $this->validate($request, [
            'documento_id' => 'required|integer'
        ]);

        $documentoId = $request->input('documento_id');

        $documento = CargaDocumento::find($documentoId);

        if (!$documento) {
            return response()->json([
                'success' => false,
                'message' => 'Documento no encontrado'
            ], 404);
        }

        // Verificar que el documento pertenece a la empresa del usuario
        if ($documento->company_id !== Auth::user()->company_id) {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado'
            ], 403);
        }

        $company = Auth::user()->company;

        // Construir ruta del archivo
        $ruta = Storage::disk('carga_documentos')->getAdapter()->getPathPrefix() . $company->name;
        $ruta_licitacion = $ruta . '/' . $documento->licitacion;

        $tipo_carpeta = $documento->tipo . 's';
        $rutaArchivo = "{$ruta_licitacion}/{$tipo_carpeta}/{$documento->nombre}";

        if (!file_exists($rutaArchivo)) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado',
                'ruta_buscada' => $rutaArchivo
            ], 404);
        }

        // Verificar tamaño
        $tamaño = filesize($rutaArchivo);
        if ($tamaño > 15 * 1024 * 1024) { // 15MB límite
            return response()->json([
                'success' => false,
                'message' => 'Archivo demasiado grande',
                'tamaño' => $tamaño
            ], 413);
        }

        // Leer y convertir a base64
        $contenido = file_get_contents($rutaArchivo);
        $mimeType = mime_content_type($rutaArchivo);
        $base64 = base64_encode($contenido);

        return response()->json([
            'success' => true,
            'archivo' => [
                'id' => $documento->id,
                'nombre' => $documento->nombre,
                'tipo' => $documento->tipo,
                'mime_type' => $mimeType,
                'contenido_base64' => $base64,
                'tamaño' => $tamaño
            ]
        ]);

    } catch (\Exception $e) {
        \Log::error('Error en getDocumentoFileLicitacion: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'Error obteniendo archivo'
        ], 500);
    }
}

/**
 * Actualizar estado de postulación
 * POST /api/extension/update-estado-licitacion
 */
public function updateEstadoLicitacion(Request $request)
{
    try {
        $this->validate($request, [
            'codigo_postulacion' => 'required|string',
            'estado' => 'required|string',
            'mensaje' => 'nullable|string',
            'paso' => 'nullable|string'
        ]);

        $codigoPostulacion = $request->input('codigo_postulacion');
        $estado = $request->input('estado');
        $mensaje = $request->input('mensaje', '');
        $paso = $request->input('paso', '');

        \Log::info('Extension Licitaciones: Estado actualizado', [
            'codigo' => $codigoPostulacion,
            'estado' => $estado,
            'mensaje' => $mensaje,
            'paso' => $paso
        ]);

        // Aquí puedes insertar en una tabla de logs si la tienes
        // Por ahora solo logueamos

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado'
        ]);

    } catch (\Exception $e) {
        \Log::error('Error en updateEstadoLicitacion: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'Error actualizando estado'
        ], 500);
    }
}

/**
 * Insertar estado inicial
 * POST /api/extension/insertar-estado-licitacion
 */
public function insertarEstadoLicitacion(Request $request)
{
    try {
        $this->validate($request, [
            'codigo_postulacion' => 'required|string',
            'company_id' => 'required|integer'
        ]);

        $codigoPostulacion = $request->input('codigo_postulacion');
        $companyId = $request->input('company_id');

        \Log::info('Extension Licitaciones: Estado inicial insertado', [
            'codigo' => $codigoPostulacion,
            'company' => $companyId
        ]);

        // Aquí puedes insertar en una tabla de registro si la tienes

        return response()->json([
            'success' => true,
            'message' => 'Estado inicial registrado'
        ]);

    } catch (\Exception $e) {
        \Log::error('Error en insertarEstadoLicitacion: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'Error insertando estado'
        ], 500);
    }
}
```

---

## Pasos para implementar:

### 1. Agregar las rutas en `routes/api.php`
Copia el bloque de rutas DESPUÉS de las rutas de Compras Ágiles.

### 2. Agregar los métodos en `CargaDocumentoController.php`
Copia los 4 métodos AL FINAL del controlador (antes del último `}`).

### 3. Verificar las conexiones en `config/database.php`
Asegúrate de tener las conexiones:
- `licitaciones_diarias_total`
- `precio_interno`
- `postulaciones`
- `pharmatender`

### 4. Probar el endpoint
```bash
# Con Postman o curl:
GET https://tu-dominio.com/api/extension/licitacion-data-completa?id_licitacion=621-1159-LR25&rut_usuario=12345678-9&company_id=1
```

---

## Diferencias con Compras Ágiles

| Compras Ágiles | Licitaciones |
|----------------|--------------|
| `getCotizacionData($cotizacion)` | `getLicitacionDataCompleta(Request)` |
| `item_producto_cotizacion` | `item_producto` |
| `carga_documentos_ca` | `carga_documentos` |
| URL: `/cotizacion-data/{id}` | URL: `/licitacion-data-completa?id=...` |

---

## Respuesta esperada del endpoint:

```json
{
  "success": true,
  "data": {
    "id_licitacion": "621-1159-LR25",
    "codigo_postulacion": "123456-789-LP25",
    "productos": [
      {
        "numero_linea": 1,
        "descripcion": "Paracetamol 500mg",
        "precio_unitario": 500,
        "cantidad": 100,
        "precio_total": 50000
      }
    ],
    "documentos": {
      "administrativos": [...],
      "tecnicos": [...],
      "economicos": [...]
    },
    "total_items": 10,
    "total_documentos": 5,
    "monto_total": 1500000
  }
}
```

## Tabla de Conexiones Requeridas (config/database.php)

```php
'connections' => [

    // ... conexiones existentes ...

    'licitaciones_diarias_total' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => 'licitaciones_diarias_total',
        'username' => env('DB_USERNAME', 'forge'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    'precio_interno' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => 'precio_interno',
        'username' => env('DB_USERNAME', 'forge'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    'postulaciones' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => 'postulaciones',
        'username' => env('DB_USERNAME', 'forge'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],
],
```
