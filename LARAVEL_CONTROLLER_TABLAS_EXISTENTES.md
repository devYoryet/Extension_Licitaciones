# Controller Laravel - Usando Tablas Existentes del Sistema

## Objetivo
Este controller usa las **MISMAS tablas que el script Python** para obtener los datos de licitaciones.

---

## Tablas que se usan (existentes en el sistema)

1. **`licitaciones_diarias_total.Licitaciones_diarias`**
   - Para obtener el `CodigoPostulacion`

2. **`pharmatender.users`**
   - Para datos del usuario (lugar_unidad, nombre_unidad)

3. **`pharmatender.company`**
   - Para datos del cliente

4. **`precio_interno.item_producto`**
   - Para productos/items con precios
   - Campos: Licitacion, strRutUsuario, Item, precio, etc.

5. **`precio_interno.item_glosa`**
   - Para descripciones/glosas de items
   - Campos: Licitacion, strRutUsuario, Item, glosa

6. **`postulaciones.carga_documentos`**
   - Para documentos a cargar
   - Campos: company_id, licitacion, nombre, tipo, estado

---

## Código del Controller

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LicitacionAutomationController extends Controller
{
    /**
     * Endpoint principal: Obtener datos completos de licitación
     *
     * GET /api/extension/licitacion-data-completa
     * Parámetros: id_licitacion, rut_usuario, company_id
     */
    public function getLicitacionDataCompleta(Request $request)
    {
        try {
            // Validar parámetros requeridos
            $request->validate([
                'id_licitacion' => 'required|string',
                'rut_usuario' => 'required|string',
                'company_id' => 'required|integer'
            ]);

            $idLicitacion = $request->input('id_licitacion');
            $rutUsuario = $request->input('rut_usuario');
            $companyId = $request->input('company_id');

            Log::info("Obteniendo datos de licitación", [
                'licitacion' => $idLicitacion,
                'rut' => $rutUsuario,
                'company' => $companyId
            ]);

            // 1. Obtener CodigoPostulacion desde licitaciones_diarias
            $licitacionDiaria = DB::connection('licitaciones_diarias_total')
                ->table('Licitaciones_diarias')
                ->where('Licitacion', $idLicitacion)
                ->orderBy('Fecha_Publicacion', 'desc')
                ->first();

            if (!$licitacionDiaria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Licitación no encontrada en licitaciones diarias'
                ], 404);
            }

            $codigoPostulacion = $licitacionDiaria->CodigoPostulacion;

            // 2. Obtener información del usuario
            $usuario = DB::connection('pharmatender')
                ->table('users')
                ->where('rut', $rutUsuario)
                ->first();

            // 3. Obtener información del cliente/empresa
            $empresa = DB::connection('pharmatender')
                ->table('company')
                ->where('id', $companyId)
                ->first();

            if (!$empresa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empresa no encontrada'
                ], 404);
            }

            // 4. Obtener productos/items desde precio_interno
            $productos = DB::connection('precio_interno')
                ->table('item_producto')
                ->where('Licitacion', $idLicitacion)
                ->where('strRutUsuario', $rutUsuario)
                ->orderBy('Item', 'asc')
                ->get();

            // 5. Para cada producto, obtener su glosa
            $productosConGlosa = [];
            foreach ($productos as $producto) {
                $glosa = DB::connection('precio_interno')
                    ->table('item_glosa')
                    ->where('Licitacion', $idLicitacion)
                    ->where('strRutUsuario', $rutUsuario)
                    ->where('Item', $producto->Item)
                    ->first();

                $descripcionCompleta = $producto->Descripcion ?? '';
                if ($glosa && !empty($glosa->Glosa)) {
                    $descripcionCompleta .= ' - ' . $glosa->Glosa;
                }

                $productosConGlosa[] = [
                    'numero_linea' => $producto->Item,
                    'codigo_producto' => $producto->CodigoProducto ?? '',
                    'nombre' => $producto->Nombre ?? '',
                    'descripcion' => $descripcionCompleta,
                    'cantidad' => $producto->Cantidad ?? 0,
                    'precio_unitario' => (float)($producto->PrecioUnitario ?? 0),
                    'precio_total' => (float)($producto->PrecioTotal ?? 0),
                ];
            }

            // 6. Obtener documentos desde postulaciones.carga_documentos
            $documentos = DB::connection('postulaciones')
                ->table('carga_documentos')
                ->where('company_id', $companyId)
                ->where('licitacion', $idLicitacion)
                ->where('estado', 0)
                ->orderBy('tipo', 'desc')
                ->get();

            // Agrupar documentos por tipo
            $documentosAgrupados = [
                'administrativos' => [],
                'tecnicos' => [],
                'economicos' => []
            ];

            foreach ($documentos as $doc) {
                $tipoLower = strtolower($doc->tipo);

                $docData = [
                    'id' => $doc->id,
                    'nombre' => $doc->nombre,
                    'tipo' => $doc->tipo,
                    'filename' => $doc->nombre,
                    'ruta' => $doc->ruta ?? null
                ];

                // Agrupar según tipo
                if (strpos($tipoLower, 'admin') !== false) {
                    $documentosAgrupados['administrativos'][] = $docData;
                } elseif (strpos($tipoLower, 'tecn') !== false || strpos($tipoLower, 'técn') !== false) {
                    $documentosAgrupados['tecnicos'][] = $docData;
                } elseif (strpos($tipoLower, 'econ') !== false) {
                    $documentosAgrupados['economicos'][] = $docData;
                } else {
                    // Por defecto en administrativos
                    $documentosAgrupados['administrativos'][] = $docData;
                }
            }

            // 7. Calcular totales
            $totalItems = count($productosConGlosa);
            $montoTotal = array_sum(array_column($productosConGlosa, 'precio_total'));
            $totalDocumentos = count($documentos);

            // 8. Construir respuesta completa
            $response = [
                'success' => true,
                'data' => [
                    // Identificadores
                    'id_licitacion' => $idLicitacion,
                    'codigo_postulacion' => $codigoPostulacion,
                    'nombre_licitacion' => $licitacionDiaria->Nombre ?? 'Sin nombre',
                    'descripcion' => $licitacionDiaria->Descripcion ?? '',

                    // URL de Mercado Público
                    'url_mercado_publico' => $this->construirUrlMercadoPublico($codigoPostulacion),

                    // Configuración
                    'oferta_conjunta' => false, // Por defecto, ajustar según lógica
                    'monto_total' => $montoTotal,
                    'moneda' => 'CLP',

                    // Productos
                    'productos' => $productosConGlosa,
                    'total_items' => $totalItems,

                    // Documentos
                    'documentos' => $documentosAgrupados,
                    'total_documentos' => $totalDocumentos,

                    // Empresa
                    'empresa' => [
                        'id' => $empresa->id,
                        'nombre' => $empresa->name,
                        'rut' => $empresa->rut ?? '',
                    ],

                    // Usuario
                    'usuario' => [
                        'rut' => $rutUsuario,
                        'lugar_unidad' => $usuario->lugar_unidad ?? null,
                        'nombre_unidad' => $usuario->nombre_unidad ?? null,
                    ],

                    // Fechas
                    'fecha_publicacion' => $licitacionDiaria->Fecha_Publicacion ?? null,
                    'fecha_cierre' => $licitacionDiaria->Fecha_Cierre ?? null,

                    // Metadatos
                    'timestamp' => now()->toIso8601String(),
                ]
            ];

            Log::info("Datos de licitación obtenidos exitosamente", [
                'licitacion' => $idLicitacion,
                'productos' => $totalItems,
                'documentos' => $totalDocumentos
            ]);

            return response()->json($response, 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Parámetros inválidos',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error obteniendo datos de licitación: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Obtener archivo de documento por ID (para cuando se necesite el archivo real)
     *
     * GET /api/extension/documento-file
     * Parámetros: documento_id
     */
    public function getDocumentoFile(Request $request)
    {
        try {
            $request->validate([
                'documento_id' => 'required|integer'
            ]);

            $documentoId = $request->input('documento_id');

            $documento = DB::connection('postulaciones')
                ->table('carga_documentos')
                ->where('id', $documentoId)
                ->first();

            if (!$documento) {
                return response()->json([
                    'success' => false,
                    'message' => 'Documento no encontrado'
                ], 404);
            }

            // Si tiene ruta de archivo, leerlo y convertir a base64
            if (!empty($documento->ruta)) {
                $rutaCompleta = storage_path('app/' . $documento->ruta);

                if (file_exists($rutaCompleta)) {
                    $contenido = file_get_contents($rutaCompleta);
                    $base64 = base64_encode($contenido);

                    // Detectar mime type
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mimeType = finfo_file($finfo, $rutaCompleta);
                    finfo_close($finfo);

                    return response()->json([
                        'success' => true,
                        'data' => [
                            'id' => $documento->id,
                            'nombre' => $documento->nombre,
                            'tipo' => $documento->tipo,
                            'mime_type' => $mimeType,
                            'filename' => basename($documento->ruta),
                            'archivo_base64' => $base64,
                            'size' => strlen($contenido)
                        ]
                    ], 200);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado en el sistema'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error obteniendo archivo de documento: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener archivo'
            ], 500);
        }
    }

    /**
     * Construir URL de Mercado Público
     */
    private function construirUrlMercadoPublico($codigoPostulacion)
    {
        return 'https://www.mercadopublico.cl/Portal/Modules/Desktop/Desktop.aspx?enc=' . urlencode($codigoPostulacion);
    }

    /**
     * Actualizar estado de postulación
     */
    public function updateEstadoPostulacion(Request $request)
    {
        try {
            $request->validate([
                'codigo_postulacion' => 'required|string',
                'estado' => 'required|string',
                'mensaje' => 'nullable|string',
                'paso' => 'nullable|string'
            ]);

            // Aquí puedes insertar en una tabla de logs/estados si existe
            // O actualizar el estado en licitaciones_diarias

            Log::info('Estado de postulación actualizado', [
                'codigo' => $request->codigo_postulacion,
                'estado' => $request->estado,
                'mensaje' => $request->mensaje
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error actualizando estado: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar estado'
            ], 500);
        }
    }
}
```

---

## Configuración de Conexiones en Laravel (config/database.php)

Asegúrate de tener las conexiones configuradas:

```php
'connections' => [

    // Conexión principal
    'mysql' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => env('DB_DATABASE', 'forge'),
        'username' => env('DB_USERNAME', 'forge'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    // Conexión para pharmatender
    'pharmatender' => [
        'driver' => 'mysql',
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => env('DB_PORT', '3306'),
        'database' => 'pharmatender',
        'username' => env('DB_USERNAME', 'forge'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    // Conexión para precio_interno
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

    // Conexión para licitaciones_diarias_total
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

    // Conexión para postulaciones
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

---

## Rutas (routes/api.php)

```php
use App\Http\Controllers\Api\LicitacionAutomationController;

Route::middleware(['cors'])->group(function () {

    // Endpoint principal - datos completos
    Route::get('/extension/licitacion-data-completa', [
        LicitacionAutomationController::class,
        'getLicitacionDataCompleta'
    ]);

    // Endpoint para obtener archivo de documento
    Route::get('/extension/documento-file', [
        LicitacionAutomationController::class,
        'getDocumentoFile'
    ]);

    // Endpoint para actualizar estado
    Route::post('/extension/update-estado-postulacion', [
        LicitacionAutomationController::class,
        'updateEstadoPostulacion'
    ]);
});
```

---

## Uso desde la Extensión

```javascript
// Ejemplo de llamada desde la extensión
const apiUrl = 'https://tu-backend.com/api/extension/licitacion-data-completa';

const params = new URLSearchParams({
    id_licitacion: '1058012-91-LP25',
    rut_usuario: '12345678-9',
    company_id: 123
});

const response = await fetch(`${apiUrl}?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

const result = await response.json();

if (result.success) {
    console.log('Productos:', result.data.productos);
    console.log('Documentos:', result.data.documentos);
    console.log('Monto total:', result.data.monto_total);
}
```

---

## Notas Importantes

1. **Sin crear nuevas tablas** - usa las existentes del sistema
2. **Múltiples conexiones de BD** - configuradas en database.php
3. **Los documentos NO se convierten a base64 aquí** - usa el endpoint separado `/documento-file` cuando necesites el archivo
4. **El company_id lo obtiene la extensión** desde PharmaTender (del usuario logueado)
5. **El rut_usuario viene de las credenciales** guardadas en la extensión
