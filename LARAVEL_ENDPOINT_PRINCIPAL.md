# Endpoint Principal - Datos de Licitación para Automatización

## Objetivo
Este endpoint debe devolver **TODOS** los datos necesarios para automatizar una licitación, reemplazando lo que hacía el script Python.

---

## Endpoint: GET /api/extension/licitacion-data-completa

### Descripción
Obtiene todos los datos de una licitación necesarios para la automatización completa en Mercado Público.

### URL
```
GET /api/extension/licitacion-data-completa?codigo_postulacion={codigo}
```

### Parámetros
- `codigo_postulacion` (requerido): Código de la licitación (ej: "1058012-91-LP25")

---

## Respuesta Esperada

```json
{
    "success": true,
    "data": {
        // ========================================
        // 1. INFORMACIÓN BÁSICA DE LA LICITACIÓN
        // ========================================
        "codigo_postulacion": "1058012-91-LP25",
        "codigo_licitacion_mp": "1234-56-LP20",
        "nombre_licitacion": "Suministro de medicamentos para hospital",
        "descripcion": "Descripción detallada de la oferta",
        "url_mercado_publico": "https://www.mercadopublico.cl/Portal/Modules/Desktop/Desktop.aspx?enc=xxxxx",

        // ========================================
        // 2. CONFIGURACIÓN DE OFERTA
        // ========================================
        "oferta_conjunta": false,  // true o false
        "monto_total": 15000000,
        "moneda": "CLP",

        // ========================================
        // 3. PRODUCTOS Y PRECIOS
        // ========================================
        "productos": [
            {
                "numero_linea": 1,
                "codigo_producto": "PROD001",
                "nombre": "Paracetamol 500mg",
                "descripcion": "Caja con 20 comprimidos",
                "cantidad": 1000,
                "unidad_medida": "UNIDAD",
                "precio_unitario": 500,
                "precio_total": 500000,
                "especificaciones_tecnicas": "Cumple con norma ISO..."
            },
            {
                "numero_linea": 2,
                "codigo_producto": "PROD002",
                "nombre": "Ibuprofeno 400mg",
                "descripcion": "Caja con 30 comprimidos",
                "cantidad": 500,
                "unidad_medida": "UNIDAD",
                "precio_unitario": 800,
                "precio_total": 400000,
                "especificaciones_tecnicas": "Cumple con norma ISO..."
            }
        ],

        // ========================================
        // 4. DOCUMENTOS A CARGAR
        // ========================================
        "documentos": {
            "administrativos": [
                {
                    "id": 1,
                    "nombre": "Declaracion_Jurada.pdf",
                    "tipo": "ADMINISTRATIVO",
                    "filename": "Declaracion_Jurada.pdf",
                    "mime_type": "application/pdf",
                    "archivo_base64": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC...",
                    "descripcion": "Declaración jurada simple"
                },
                {
                    "id": 2,
                    "nombre": "Certificado_Empresa.pdf",
                    "tipo": "ADMINISTRATIVO",
                    "filename": "Certificado_Empresa.pdf",
                    "mime_type": "application/pdf",
                    "archivo_base64": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC..."
                }
            ],
            "tecnicos": [
                {
                    "id": 3,
                    "nombre": "Especificaciones_Tecnicas.pdf",
                    "tipo": "TECNICO",
                    "filename": "Especificaciones_Tecnicas.pdf",
                    "mime_type": "application/pdf",
                    "archivo_base64": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC..."
                }
            ],
            "economicos": [
                {
                    "id": 4,
                    "nombre": "Oferta_Economica.xlsx",
                    "tipo": "ECONOMICO",
                    "filename": "Oferta_Economica.xlsx",
                    "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "archivo_base64": "UEsDBBQABgAIAAAAIQBi7p1oXgEAAJAEAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbJSRwU..."
                }
            ]
        },

        // ========================================
        // 5. INFORMACIÓN ADICIONAL
        // ========================================
        "empresa": {
            "rut": "12345678-9",
            "razon_social": "Farmacia SpA",
            "direccion": "Av. Principal 123",
            "ciudad": "Santiago",
            "region": "Metropolitana",
            "telefono": "+56912345678",
            "email": "contacto@farmacia.cl"
        },

        // ========================================
        // 6. FECHAS Y PLAZOS
        // ========================================
        "fechas": {
            "fecha_apertura": "2025-01-15 10:00:00",
            "fecha_cierre": "2025-01-30 18:00:00",
            "fecha_adjudicacion_estimada": "2025-02-15",
            "plazo_entrega_dias": 30
        },

        // ========================================
        // 7. ESTADO Y TRACKING
        // ========================================
        "estado_postulacion": {
            "estado_actual": "pendiente",  // pendiente, en_proceso, completado, error
            "ultimo_paso": null,
            "mensaje": null,
            "intentos": 0,
            "fecha_creacion": "2025-01-10 15:30:00",
            "fecha_actualizacion": "2025-01-10 15:30:00"
        }
    }
}
```

---

## Código del Controller Laravel

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LicitacionAutomationController extends Controller
{
    /**
     * Obtener datos completos de licitación para automatización
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLicitacionDataCompleta(Request $request)
    {
        try {
            // Validar parámetros
            $request->validate([
                'codigo_postulacion' => 'required|string'
            ]);

            $codigoPostulacion = $request->input('codigo_postulacion');

            // 1. Obtener información básica de la licitación
            $licitacion = DB::table('licitaciones')
                ->where('codigo_postulacion', $codigoPostulacion)
                ->first();

            if (!$licitacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Licitación no encontrada'
                ], 404);
            }

            // 2. Obtener productos de la licitación
            $productos = DB::table('licitacion_productos')
                ->where('codigo_postulacion', $codigoPostulacion)
                ->orderBy('numero_linea')
                ->get()
                ->map(function ($producto) {
                    return [
                        'numero_linea' => $producto->numero_linea,
                        'codigo_producto' => $producto->codigo_producto,
                        'nombre' => $producto->nombre,
                        'descripcion' => $producto->descripcion,
                        'cantidad' => $producto->cantidad,
                        'unidad_medida' => $producto->unidad_medida,
                        'precio_unitario' => $producto->precio_unitario,
                        'precio_total' => $producto->precio_total,
                        'especificaciones_tecnicas' => $producto->especificaciones_tecnicas
                    ];
                });

            // 3. Obtener documentos (con archivos en base64)
            $documentosAdmin = $this->getDocumentosByTipo($codigoPostulacion, 'ADMINISTRATIVO');
            $documentosTec = $this->getDocumentosByTipo($codigoPostulacion, 'TECNICO');
            $documentosEcon = $this->getDocumentosByTipo($codigoPostulacion, 'ECONOMICO');

            // 4. Obtener información de la empresa
            $empresa = DB::table('empresas')
                ->where('id', $licitacion->empresa_id)
                ->first();

            // 5. Obtener estado actual
            $estado = DB::table('licitacion_estados')
                ->where('codigo_postulacion', $codigoPostulacion)
                ->orderBy('created_at', 'desc')
                ->first();

            // 6. Construir respuesta completa
            $response = [
                'success' => true,
                'data' => [
                    // Información básica
                    'codigo_postulacion' => $licitacion->codigo_postulacion,
                    'codigo_licitacion_mp' => $licitacion->codigo_licitacion_mp,
                    'nombre_licitacion' => $licitacion->nombre,
                    'descripcion' => $licitacion->descripcion,
                    'url_mercado_publico' => $licitacion->url_mercado_publico,

                    // Configuración
                    'oferta_conjunta' => (bool)$licitacion->oferta_conjunta,
                    'monto_total' => (float)$licitacion->monto_total,
                    'moneda' => $licitacion->moneda ?? 'CLP',

                    // Productos
                    'productos' => $productos,

                    // Documentos
                    'documentos' => [
                        'administrativos' => $documentosAdmin,
                        'tecnicos' => $documentosTec,
                        'economicos' => $documentosEcon
                    ],

                    // Empresa
                    'empresa' => [
                        'rut' => $empresa->rut,
                        'razon_social' => $empresa->razon_social,
                        'direccion' => $empresa->direccion,
                        'ciudad' => $empresa->ciudad,
                        'region' => $empresa->region,
                        'telefono' => $empresa->telefono,
                        'email' => $empresa->email
                    ],

                    // Fechas
                    'fechas' => [
                        'fecha_apertura' => $licitacion->fecha_apertura,
                        'fecha_cierre' => $licitacion->fecha_cierre,
                        'fecha_adjudicacion_estimada' => $licitacion->fecha_adjudicacion_estimada,
                        'plazo_entrega_dias' => $licitacion->plazo_entrega_dias
                    ],

                    // Estado
                    'estado_postulacion' => [
                        'estado_actual' => $estado->estado ?? 'pendiente',
                        'ultimo_paso' => $estado->paso ?? null,
                        'mensaje' => $estado->mensaje ?? null,
                        'intentos' => $estado->intentos ?? 0,
                        'fecha_creacion' => $licitacion->created_at,
                        'fecha_actualizacion' => $estado->updated_at ?? $licitacion->updated_at
                    ]
                ]
            ];

            return response()->json($response, 200);

        } catch (\Exception $e) {
            \Log::error('Error obteniendo datos de licitación: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Obtener documentos por tipo con contenido en base64
     */
    private function getDocumentosByTipo($codigoPostulacion, $tipo)
    {
        $documentos = DB::table('licitacion_documentos')
            ->where('codigo_postulacion', $codigoPostulacion)
            ->where('tipo', $tipo)
            ->get();

        return $documentos->map(function ($doc) {
            // Leer archivo desde storage y convertir a base64
            $path = $doc->ruta_archivo; // ej: "licitaciones/1234/admin/documento.pdf"

            if (Storage::disk('local')->exists($path)) {
                $fileContent = Storage::disk('local')->get($path);
                $base64 = base64_encode($fileContent);
            } else {
                $base64 = null;
                \Log::warning("Archivo no encontrado: {$path}");
            }

            return [
                'id' => $doc->id,
                'nombre' => $doc->nombre,
                'tipo' => $doc->tipo,
                'filename' => basename($doc->ruta_archivo),
                'mime_type' => $doc->mime_type,
                'archivo_base64' => $base64,
                'descripcion' => $doc->descripcion
            ];
        })->toArray();
    }
}
```

---

## Ruta en Laravel (routes/api.php)

```php
Route::middleware(['cors'])->group(function () {

    // Endpoint principal para obtener datos completos
    Route::get('/extension/licitacion-data-completa', [
        LicitacionAutomationController::class,
        'getLicitacionDataCompleta'
    ]);

    // Otros endpoints (ya documentados)
    Route::get('/extension/check-auth', [LicitacionAutomationController::class, 'checkAuth']);
    Route::post('/extension/update-estado-postulacion', [LicitacionAutomationController::class, 'updateEstado']);
    // ... etc
});
```

---

## Uso desde la Extensión

```javascript
// En content-platform.js o background.js
async function obtenerDatosLicitacion(codigoPostulacion) {
    try {
        const apiUrl = `https://tu-backend.com/api/extension/licitacion-data-completa`;
        const params = new URLSearchParams({
            codigo_postulacion: codigoPostulacion
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

        if (!result.success) {
            throw new Error(result.message);
        }

        console.log('✅ Datos de licitación obtenidos:', result.data);
        return result.data;

    } catch (error) {
        console.error('❌ Error obteniendo datos:', error);
        throw error;
    }
}
```

---

## Notas Importantes

1. **Todos los archivos deben estar en base64** para que la extensión pueda leerlos
2. **Los productos deben venir ordenados** por número de línea
3. **Las fechas en formato ISO 8601** o formato compatible con JavaScript
4. **El endpoint debe ser rápido** - considera cachear datos si es necesario
5. **Validar permisos** - solo usuarios autorizados pueden acceder a sus licitaciones

---

## Migración desde Python

Este endpoint reemplaza:
- ✅ Lectura de Excel con datos de licitación
- ✅ Búsqueda de documentos en carpetas
- ✅ Preparación de datos para automatización
- ✅ Validación de datos antes de enviar

Todo centralizado en UN SOLO ENDPOINT que la extensión consulta una vez al inicio.
