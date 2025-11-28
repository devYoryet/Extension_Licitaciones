<?php
/**
 * ENDPOINTS FALTANTES PARA EXTENSIÓN - AGREGAR A CargaDocumentoController.php
 * 
 * Estos métodos deben agregarse al controlador existente para completar
 * la funcionalidad requerida por la extensión JavaScript
 */

/**
 * ENDPOINT: /api/extension/documento-file-licitacion
 * Descarga archivo específico de documento por ID
 */
public function documentoFileLicitacion(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'documento_id' => 'required|integer|exists:postulaciones.carga_documentos,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $documento_id = $request->get('documento_id');
        $company_id = Auth::user()->company_id;
        
        // Verificar que el documento pertenece a la empresa del usuario
        $documento = CargaDocumento::where('id', $documento_id)
                                   ->where('company_id', $company_id)
                                   ->first();
        
        if (!$documento) {
            return response()->json([
                'success' => false,
                'message' => 'Documento no encontrado o sin permisos'
            ], 404);
        }
        
        // Construir path del archivo
        $filePath = storage_path('app/public/documentos/' . $documento->archivo);
        
        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo físico no encontrado: ' . $documento->archivo
            ], 404);
        }
        
        // Leer archivo y convertir a base64
        $contenido = file_get_contents($filePath);
        $contenido_base64 = base64_encode($contenido);
        $tamaño = filesize($filePath);
        
        return response()->json([
            'success' => true,
            'archivo' => [
                'id' => $documento->id,
                'nombre' => $documento->nombre,
                'nombre_archivo' => $documento->archivo,
                'tipo' => $documento->tipo,
                'tamaño' => $tamaño,
                'contenido_base64' => $contenido_base64,
                'mime_type' => mime_content_type($filePath)
            ]
        ]);
        
    } catch (Exception $e) {
        Log::error('Error en documentoFileLicitacion: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Error interno del servidor',
            'error' => config('app.debug') ? $e->getMessage() : 'Error procesando solicitud'
        ], 500);
    }
}

/**
 * ENDPOINT: /api/extension/actualizar-estado
 * Actualiza estado del proceso de automatización
 */
public function actualizarEstado(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'licitacion' => 'required|string',
            'estado' => 'required|string',
            'mensaje' => 'nullable|string',
            'paso' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user_id = Auth::id();
        $company_id = Auth::user()->company_id;
        
        // Insertar log de estado
        DB::table('estado_extension_logs')->insert([
            'user_id' => $user_id,
            'company_id' => $company_id,
            'licitacion' => $request->licitacion,
            'estado' => $request->estado,
            'mensaje' => $request->mensaje,
            'paso' => $request->paso,
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado correctamente',
            'timestamp' => now()->toISOString()
        ]);
        
    } catch (Exception $e) {
        Log::error('Error actualizando estado extensión: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Error actualizando estado',
            'error' => config('app.debug') ? $e->getMessage() : 'Error procesando solicitud'
        ], 500);
    }
}

/**
 * ENDPOINT: /api/extension/enviar-email-confirmacion
 * Envía email de confirmación desde la extensión
 */
public function enviarEmailExtension(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'licitacion' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $licitacion = $request->licitacion;
        $user = Auth::user();
        $email = $user->email;
        
        // Determinar emails de copia según empresa
        $company = Company::find($user->company_id);
        $emails_copia = ['g.mellado@pharmatender.cl'];
        
        if ($company && $company->rut === '96963440-7') { // Merck
            $emails_copia[] = 'pedro.bustos@merck.com';
        }
        
        // Enviar email
        Mail::to($email)->cc($emails_copia)->send(new PostulacionLicitacion($licitacion));
        
        // Registrar envío exitoso
        DB::table('email_extension_logs')->insert([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'licitacion' => $licitacion,
            'email_destino' => $email,
            'emails_copia' => json_encode($emails_copia),
            'estado' => 'enviado',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Email enviado exitosamente',
            'email_destino' => $email,
            'emails_copia' => $emails_copia,
            'timestamp' => now()->toISOString()
        ]);
        
    } catch (Exception $e) {
        Log::error('Error enviando email desde extensión: ' . $e->getMessage());
        
        // Registrar error de envío
        try {
            DB::table('email_extension_logs')->insert([
                'user_id' => Auth::id(),
                'company_id' => Auth::user()->company_id,
                'licitacion' => $request->licitacion ?? 'unknown',
                'email_destino' => Auth::user()->email,
                'estado' => 'error',
                'error_message' => $e->getMessage(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } catch (Exception $logError) {
            Log::error('Error registrando fallo de email: ' . $logError->getMessage());
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Error enviando email',
            'error' => config('app.debug') ? $e->getMessage() : 'Error en el servicio de email'
        ], 500);
    }
}

/**
 * ENDPOINT: /api/extension/registrar-log
 * Registra logs detallados del proceso de extensión
 */
public function registrarLog(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'nivel' => 'required|in:info,warning,error,debug',
            'mensaje' => 'required|string',
            'contexto' => 'nullable|string',
            'licitacion' => 'nullable|string',
            'paso' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        // Insertar log
        DB::table('extension_logs')->insert([
            'user_id' => Auth::id(),
            'company_id' => Auth::user()->company_id,
            'nivel' => $request->nivel,
            'mensaje' => $request->mensaje,
            'contexto' => $request->contexto,
            'licitacion' => $request->licitacion,
            'paso' => $request->paso,
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'url' => $request->header('Referer'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Log registrado correctamente'
        ]);
        
    } catch (Exception $e) {
        Log::error('Error registrando log de extensión: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Error registrando log'
        ], 500);
    }
}

/**
 * ENDPOINT: /api/extension/confirmar-finalizacion
 * Confirma finalización exitosa del proceso completo
 */
public function confirmarFinalizacion(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'licitacion' => 'required|string',
            'pasos_completados' => 'required|array',
            'tiempo_total_segundos' => 'nullable|integer',
            'productos_procesados' => 'nullable|integer',
            'documentos_cargados' => 'nullable|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        $user = Auth::user();
        
        // Registrar finalización exitosa
        DB::table('finalizaciones_extension')->insert([
            'user_id' => $user->id,
            'company_id' => $user->company_id,
            'licitacion' => $request->licitacion,
            'pasos_completados' => json_encode($request->pasos_completados),
            'tiempo_total_segundos' => $request->tiempo_total_segundos,
            'productos_procesados' => $request->productos_procesados,
            'documentos_cargados' => $request->documentos_cargados,
            'estado' => 'completado',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        // Actualizar estado en tabla principal si existe
        try {
            DB::table('postulaciones.carga_documentos')
              ->where('licitacion', $request->licitacion)
              ->where('company_id', $user->company_id)
              ->update([
                  'estado_extension' => 'completado',
                  'completado_at' => now()
              ]);
        } catch (Exception $updateError) {
            Log::warning('No se pudo actualizar estado en carga_documentos: ' . $updateError->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Finalización confirmada exitosamente',
            'licitacion' => $request->licitacion,
            'timestamp' => now()->toISOString()
        ]);
        
    } catch (Exception $e) {
        Log::error('Error confirmando finalización: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Error confirmando finalización',
            'error' => config('app.debug') ? $e->getMessage() : 'Error procesando solicitud'
        ], 500);
    }
}