# Método para CargaDocumentoController - Laravel 5.5

## IMPORTANTE: Laravel 5.5 usa tablas directamente con prefijo

Agregar AL FINAL de `app/Http/Controllers/CargaDocumentoController.php` (antes del último `}`):

```php
/**
 * Obtener datos completos de licitación para extensión
 * GET /api/extension/licitacion-data-completa
 */
public function getLicitacionDataCompleta(Request $request)
{
    try {
        // Validar parámetros
        $this->validate($request, [
            'id_licitacion' => 'required|string',
            'rut_usuario' => 'required|string',
            'company_id' => 'required|integer'
        ]);

        $idLicitacion = $request->input('id_licitacion');
        $rutUsuario = $request->input('rut_usuario');
        $companyId = $request->input('company_id');

        \Log::info("Extension: getLicitacionDataCompleta", [
            'licitacion' => $idLicitacion,
            'rut' => $rutUsuario,
            'company' => $companyId
        ]);

        // 1. Obtener productos (SIN DB::connection, directo con prefijo de tabla)
        $productos = DB::table('precio_interno.item_producto')
            ->where('Licitacion', $idLicitacion)
            ->where('strRutUsuario', $rutUsuario)
            ->orderBy('Item', 'asc')
            ->get();

        $productosArray = [];
        $montoTotal = 0;

        foreach ($productos as $producto) {
            // Obtener glosa
            $glosa = DB::table('precio_interno.item_glosa')
                ->where('Licitacion', $idLicitacion)
                ->where('strRutUsuario', $rutUsuario)
                ->where('Item', $producto->Item)
                ->first();

            $descripcion = isset($producto->Descripcion) ? $producto->Descripcion : '';
            if ($glosa && !empty($glosa->Glosa)) {
                $descripcion .= ' - ' . $glosa->Glosa;
            }

            $precio = floatval(isset($producto->Precio) ? $producto->Precio : 0);
            $cantidad = intval(isset($producto->Cantidad) ? $producto->Cantidad : 1);
            $subtotal = $precio * $cantidad;
            $montoTotal += $subtotal;

            $productosArray[] = [
                'numero_linea' => intval($producto->Item),
                'codigo_producto' => isset($producto->CodigoProducto) ? $producto->CodigoProducto : '',
                'nombre' => isset($producto->Nombre) ? $producto->Nombre : '',
                'descripcion' => $descripcion,
                'cantidad' => $cantidad,
                'precio_unitario' => $precio,
                'precio_total' => $subtotal
            ];
        }

        // 2. Obtener documentos (directo con prefijo)
        $documentos = DB::table('postulaciones.carga_documentos')
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

        // 3. Obtener info de licitación (directo con prefijo)
        $licitacionInfo = DB::table('licitaciones_diarias_total.Licitaciones_diarias')
            ->where('Licitacion', $idLicitacion)
            ->orderBy('Fecha_Publicacion', 'desc')
            ->first();

        // 4. Obtener empresa (directo con prefijo)
        $empresa = DB::table('pharmatender.company')
            ->where('id', $companyId)
            ->first();

        // 5. Construir respuesta
        $response = [
            'success' => true,
            'data' => [
                'id_licitacion' => $idLicitacion,
                'codigo_postulacion' => $licitacionInfo ? $licitacionInfo->CodigoPostulacion : null,
                'nombre_licitacion' => $licitacionInfo ? $licitacionInfo->Nombre : 'Sin nombre',
                'descripcion' => $licitacionInfo ? $licitacionInfo->Descripcion : '',

                // Productos
                'productos' => $productosArray,
                'total_items' => count($productosArray),

                // Documentos
                'documentos' => $documentosAgrupados,
                'total_documentos' => count($documentos),

                // Totales
                'monto_total' => $montoTotal,
                'moneda' => 'CLP',

                // Empresa
                'empresa' => [
                    'id' => $empresa ? $empresa->id : null,
                    'nombre' => $empresa ? $empresa->name : '',
                    'rut' => $empresa ? $empresa->rut : ''
                ],

                // Fechas
                'fecha_publicacion' => $licitacionInfo ? $licitacionInfo->Fecha_Publicacion : null,
                'fecha_cierre' => $licitacionInfo ? $licitacionInfo->Fecha_Cierre : null,

                'timestamp' => date('c')
            ]
        ];

        \Log::info("Extension: Respuesta exitosa", [
            'items' => count($productosArray),
            'documentos' => count($documentos)
        ]);

        return response()->json($response)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->header('Access-Control-Allow-Credentials', 'true');

    } catch (\Illuminate\Validation\ValidationException $e) {
        \Log::error('Extension: Error de validación', [
            'errors' => $e->errors()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Parámetros inválidos',
            'errors' => $e->errors()
        ], 422)->header('Access-Control-Allow-Origin', '*');

    } catch (\Exception $e) {
        \Log::error('Extension: Error en getLicitacionDataCompleta', [
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Error interno del servidor',
            'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
        ], 500)->header('Access-Control-Allow-Origin', '*');
    }
}
```

---

## Diferencias clave con la versión anterior:

### ❌ NO FUNCIONA en Laravel 5.5:
```php
DB::connection('precio_interno')->table('item_producto')
```

### ✅ SÍ FUNCIONA en Laravel 5.5:
```php
DB::table('precio_interno.item_producto')
```

---

## Checklist de verificación:

1. **El método ya existe en el controller** → Reemplázalo con este código
2. **La ruta ya existe en web.php** → Debería estar en el grupo `api/extension`
3. **Las tablas existen** → Verifica con:
   ```sql
   SELECT * FROM precio_interno.item_producto LIMIT 1;
   SELECT * FROM postulaciones.carga_documentos LIMIT 1;
   SELECT * FROM licitaciones_diarias_total.Licitaciones_diarias LIMIT 1;
   SELECT * FROM pharmatender.company LIMIT 1;
   ```

---

## Cómo probar que funciona:

### Opción 1: Revisar logs de Laravel
```bash
tail -f storage/logs/laravel.log
```

### Opción 2: Probar con Postman/curl
```bash
curl -X GET "https://prime.pharmatender.cl/api/extension/licitacion-data-completa?id_licitacion=621-1159-LR25&rut_usuario=12345678-5&company_id=1" \
  -H "Cookie: laravel_session=TU_SESSION_COOKIE"
```

### Opción 3: Revisar qué query está fallando
Agregar esto ANTES de cada query para debug:
```php
\DB::enableQueryLog();
$productos = DB::table('precio_interno.item_producto')->...
\Log::info('Query ejecutada:', \DB::getQueryLog());
```

---

## Si sigue dando error 500:

1. **Revisar logs**: `storage/logs/laravel.log`
2. **Verificar que las bases de datos están accesibles** desde el mismo servidor
3. **Verificar permisos** del usuario de MySQL
4. **Probar query manual** en MySQL:
   ```sql
   SELECT * FROM precio_interno.item_producto
   WHERE Licitacion = '621-1159-LR25'
   AND strRutUsuario = '12345678-5';
   ```

---

## Ejemplo de respuesta exitosa:

```json
{
  "success": true,
  "data": {
    "id_licitacion": "621-1159-LR25",
    "codigo_postulacion": "123456-789-LP25",
    "productos": [...],
    "total_items": 10,
    "documentos": {
      "administrativos": [...],
      "tecnicos": [...],
      "economicos": [...]
    },
    "total_documentos": 5,
    "monto_total": 1500000
  }
}
```
