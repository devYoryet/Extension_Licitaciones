# encoding: utf-8
import sys
import mysql.connector
import time
import json
import math
import os
import io
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import UnexpectedAlertPresentException
import requests
import logging
import sys
sys.path.append('/root')
from simple_vault_helper import get_prime_mysql_connection


nueva_cod ='latin-1'
sys.stdout = io.TextIOWrapper(sys.stdout.detach(),encoding=nueva_cod)

# === FUNCIONES DE LOGGING Y MANEJO DE ALERTAS ===

def configurar_logger_principal(id_licitacion, rut_usuario=''):
    """
    Configura el logger principal del proceso de postulación
    """
    # Determinar la ruta de guardado según el RUT
    if rut_usuario == '76285229-2':
        base_ruta = '/home/coordinador/galenicum/'
    elif rut_usuario == '80621200-8':
        base_ruta = '/home/coordinador/merck/'
    else:
        base_ruta = '/home/coordinador/'
    
    # Crear directorio si no existe
    if not os.path.exists(base_ruta):
        os.makedirs(base_ruta, exist_ok=True)
    
    # Crear el nombre del archivo log con timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_filename = f"postulacion_{id_licitacion}_{timestamp}.log"
    log_path = os.path.join(base_ruta, log_filename)
    
    # Configurar el logger
    logger = logging.getLogger('postulacion_main')
    logger.setLevel(logging.INFO)
    
    # Eliminar handlers existentes para evitar duplicados
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Handler para archivo
    file_handler = logging.FileHandler(log_path, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # Handler para consola
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Formato mejorado
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Agregar handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Log de inicio
    logger.info("="*80)
    logger.info(f"INICIO DE PROCESO DE POSTULACIÓN")
    logger.info(f"Licitación: {id_licitacion}")
    logger.info(f"RUT Usuario: {rut_usuario}")
    logger.info(f"Archivo de log: {log_filename}")
    logger.info(f"Ruta de guardado: {base_ruta}")
    logger.info("="*80)
    
    return logger

def debug_print(mensaje, logger=None, nivel='info'):
    """
    Función para imprimir mensajes tanto en consola como en log
    """
    print(f"[DEBUG] {mensaje}")
    if logger:
        if nivel == 'error':
            logger.error(mensaje)
        elif nivel == 'warning':
            logger.warning(mensaje)
        elif nivel == 'debug':
            logger.debug(mensaje)
        else:
            logger.info(mensaje)

def manejar_alertas_emergentes(driver, logger=None, timeout=5):
    """
    Función robusta para manejar alertas emergentes
    """
    try:
        debug_print(f"Verificando alertas emergentes...", logger)
        alert = WebDriverWait(driver, timeout).until(EC.alert_is_present())
        alert_text = alert.text
        debug_print(f"¡ALERTA DETECTADA! Texto: '{alert_text}'", logger, 'warning')
        
        # Lista de mensajes que indican errores críticos
        mensajes_criticos = [
            "error",
            "intente nuevamente", 
            "credenciales",
            "usuario o contraseña",
            "acceso denegado",
            "ha ocurrido un error"
        ]
        
        # Verificar si es un error crítico
        es_error_critico = any(msg in alert_text.lower() for msg in mensajes_criticos)
        
        if es_error_critico:
            debug_print(f"ALERTA CRÍTICA DETECTADA: {alert_text}", logger, 'error')
        
        # Aceptar la alerta
        alert.accept()
        debug_print(f"Alerta aceptada exitosamente", logger)
        
        return {
            'hay_alerta': True,
            'texto_alerta': alert_text,
            'es_critico': es_error_critico
        }
        
    except TimeoutException:
        debug_print("No se detectaron alertas", logger, 'debug')
        return {
            'hay_alerta': False,
            'texto_alerta': None,
            'es_critico': False
        }
    except Exception as e:
        debug_print(f"Error procesando alerta: {e}", logger, 'error')
        return {
            'hay_alerta': False,
            'texto_alerta': None,
            'es_critico': True  # Marcar como crítico por seguridad
        }

def get_mysql_connection_with_fallback():
    """
    Función para obtener conexión MySQL con fallback a contraseña directa
    Si Vault falla, usa la contraseña hardcodeada para testing
    """
    try:
        # Intentar primero con Vault
        print("Intentando conexion con Vault...")
        mydb = get_prime_mysql_connection()
        print("Conexion exitosa con Vault")
        return mydb
    except Exception as vault_error:
        print(f"Error conectando con Vault: {vault_error}")
        print("Intentando conexion directa con contrasena hardcodeada...")
        
        try:
            # Fallback con contraseña directa
            mydb = mysql.connector.connect(
                host="prime.pharmatender.cl",
                port=3306,
                user="root",
                password="@_SecureRoot2025DB_M8qP3nX7o",  # Contraseña del .env
                autocommit=True,
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            print("Conexion exitosa con contrasena directa")
            return mydb
        except Exception as direct_error:
            print(f"Error conectando directamente: {direct_error}")
            print("ERROR CRITICO: No se pudo establecer conexion a la base de datos")
            raise Exception(f"Fallo conexion Vault: {vault_error} | Fallo conexion directa: {direct_error}")

#Eventos Script anterior
#Parámetros necesarios recibidos desde consola
rut_usuario = sys.argv[1]
rut_cliente = sys.argv[2]
id_licitacion = sys.argv[3]
fecha_publicacion = sys.argv[4]
usuario_mp = sys.argv[5]
clave_mp = sys.argv[6]
nombre_lic_sin_formatear = sys.argv[7]
desc_lic_sin_formatear = sys.argv[8]
acceso_mp = sys.argv[9]
oferta_conjunta = sys.argv[10]
rutRepresentante = sys.argv[11]
claveUnica = sys.argv[12]
passwordClaveUnica = sys.argv[13]
conFirma = sys.argv[14]
tipoRut = sys.argv[15]
permisoPendiente = sys.argv[16]

# CONFIGURAR LOGGER PRINCIPAL
main_logger = configurar_logger_principal(id_licitacion, rut_usuario)

def actualizar_estado(estado, id_licitacion):
    """Función para actualizar el estado de ejecución en un archivo de texto específico para cada licitación."""
    # Definir el nombre del archivo usando el id_licitacion
    status_filename = f"/var/www/html/CRONJOBS/status_{id_licitacion}.txt"

    # Guardar el estado en el archivo correspondiente a la licitación
    with open(status_filename, "w") as status_file:
        status_file.write(estado)

def actualizar_estado_con_log(estado, id_licitacion, logger=None):
    """
    Función mejorada para actualizar estado con logging
    """
    actualizar_estado(estado, id_licitacion)
    if logger:
        logger.info(f"Estado actualizado: {estado}")

actualizar_estado_con_log("Iniciando Proceso...", id_licitacion, main_logger)

# CONFIGURAR LOGGER PRINCIPAL
#rut_usuario = '12345678-5'
#rut_cliente = '16383552-5'
#id_licitacion = '621-236-LR21'
#fecha_publicacion = '2021-04-06'
#usuario_mp = "proymar"
#clave_mp = "Pharma0208"
#usuario_mp = '8.499.134-1'
#clave_mp =	'Pht020831'
#nombre_lic_sin_formatear = 'Test'
#desc_lic_sin_formatear = 'Descripcion test'
#acceso_mp = "usuario"
#print(permisoPendiente = sys.argv[16])
actualizar_estado("Iniciando Proceso...", id_licitacion)
#Formatear para reemplazar  guion por espacio en blanco
nombre_lic = nombre_lic_sin_formatear.replace('_', ' ')
desc_lic = desc_lic_sin_formatear.replace('_', ' ')

debug_print(f"Parámetros recibidos - Usuario: {rut_usuario}, Cliente: {rut_cliente}, Licitación: {id_licitacion}", main_logger)

#Campos de hora y fecha
fecha_hoy = datetime.now()
timestamp = fecha_hoy.strftime('%Y-%m-%d %H:%M:%S')

debug_print(f"Timestamp generado: {timestamp}", main_logger)

#crear conexion
#host="prime.pharmatender.cl"
mydb = get_mysql_connection_with_fallback()

debug_print("Conexión a base de datos establecida exitosamente", main_logger)

#Declaramos el cursor
mycursorselect = mydb.cursor(buffered=True)
mycursor = mydb.cursor()

#Iniciamos la consulta para buscar el codigo de postulacion
debug_print(f"Buscando código de postulación para licitación: {id_licitacion}", main_logger)
mycursorselect.execute("SELECT CodigoPostulacion  FROM licitaciones_diarias_total.Licitaciones_diarias where `Licitacion` = '" + id_licitacion + "' and `Fecha_Publicacion` like '%" + fecha_publicacion + "%' limit 1")
mydb.commit()
# Al inicio del script, después de obtener los parámetros
if rut_usuario == '76285229-2':
    ruta_guardado = '/home/coordinador/galenicum/'
elif rut_usuario == '80621200-8':
    ruta_guardado = '/home/coordinador/merck/'
else:
    ruta_guardado = '/home/coordinador/'

# Crear directorio de logs si no existe
if not os.path.exists(ruta_guardado):
    os.makedirs(ruta_guardado, exist_ok=True)

debug_print(f"Ruta de guardado configurada: {ruta_guardado}", main_logger)
import logging
import os
from datetime import datetime

def configurar_logger_unidad_farma(id_licitacion, rut_usuario=''):
    """
    Configura un logger específico para el proceso de selección de unidad farmacéutica
    Guarda logs en ruta específica según el RUT del usuario
    """
    # Determinar la ruta de guardado según el RUT
    if rut_usuario == '80621200-8':
        base_ruta = '/home/coordinador/merck/'
    else:
        base_ruta = '/home/coordinador/'
    
    # Crear directorio si no existe
    if not os.path.exists(base_ruta):
        os.makedirs(base_ruta, exist_ok=True)
    
    # Crear el nombre del archivo log
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_filename = f"unidad_farma_{id_licitacion}_{timestamp}.log"
    log_path = os.path.join(base_ruta, log_filename)
    
    # Configurar el logger
    logger_name = f'unidad_farma_logger_{id_licitacion}_{timestamp}'
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    
    # Eliminar handlers existentes para evitar duplicados
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Crear handler para archivo
    file_handler = logging.FileHandler(log_path, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    # Crear formato personalizado
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    
    # Agregar handler al logger
    logger.addHandler(file_handler)
    
    # Log inicial
    logger.info("="*60)
    logger.info(f"INICIO DE PROCESO SELECCIÓN UNIDAD FARMACÉUTICA")
    logger.info(f"Licitación: {id_licitacion}")
    logger.info(f"RUT Usuario: {rut_usuario}")
    logger.info(f"Ruta de guardado: {base_ruta}")
    logger.info(f"Archivo de log: {log_filename}")
    logger.info("="*60)
    
    return logger

def configurar_logger_general(id_licitacion, rut_usuario='', proceso='postulacion'):
    """
    Configura un logger general para todo el proceso de postulación
    """
    # Determinar la ruta de guardado según el RUT
    if rut_usuario == '76285229-2':
        base_ruta = '/home/coordinador/galenicum/'
    else:
        base_ruta = '/home/coordinador/'
    
    # Crear directorio si no existe
    if not os.path.exists(base_ruta):
        os.makedirs(base_ruta, exist_ok=True)
    
    # Crear el nombre del archivo log
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_filename = f"{proceso}_{id_licitacion}_{timestamp}.log"
    log_path = os.path.join(base_ruta, log_filename)
    
    # Configurar el logger
    logger_name = f'{proceso}_logger_{id_licitacion}_{timestamp}'
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)
    
    # Eliminar handlers existentes
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Handler para archivo
    file_handler = logging.FileHandler(log_path, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # Handler para consola (opcional)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    
    # Formato
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Agregar handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Log inicial
    logger.info("="*60)
    logger.info(f"INICIO DE PROCESO: {proceso.upper()}")
    logger.info(f"Licitación: {id_licitacion}")
    logger.info(f"RUT Usuario: {rut_usuario}")
    logger.info(f"Ruta de logs: {base_ruta}")
    logger.info(f"Archivo: {log_filename}")
    logger.info("="*60)
    
    return logger

def actualizar_estado_con_log(estado, id_licitacion, logger=None):
    """
    Función mejorada para actualizar estado que también registra en logs
    """
    # Actualizar archivo de estado
    status_filename = f"/var/www/html/CRONJOBS/status_{id_licitacion}.txt"
    
    try:
        with open(status_filename, "w") as status_file:
            status_file.write(estado)
        
        # Log del cambio de estado
        if logger:
            logger.info(f"Estado actualizado: {estado}")
            logger.debug(f"Archivo de estado: {status_filename}")
    except Exception as e:
        if logger:
            logger.error(f"Error actualizando estado: {e}")
        print(f"Error actualizando estado: {e}")
# Modificar la función actualizar_estado para usar el logger
def actualizar_estado_con_logging(estado, id_licitacion, logger=None):
    """Función mejorada para actualizar estado con logging específico para Galenicum."""
    status_filename = f"/var/www/html/CRONJOBS/status_{id_licitacion}.txt"
    
    try:
        with open(status_filename, "w") as status_file:
            status_file.write(estado)
        
        # Log específico para Galenicum
        if logger and rut_usuario == '76285229-2':
            logger.info(f"[GALENICUM] Estado actualizado: {estado}")
            logger.debug(f"[GALENICUM] Archivo de estado: {status_filename}")
        elif logger:
            logger.info(f"Estado actualizado: {estado}")
            
    except Exception as e:
        if logger:
            logger.error(f"Error actualizando estado: {e}")
        print(f"Error actualizando estado: {e}")
class LoggerContextManager:
    """
    Context manager para manejar loggers de forma limpia
    """
    def __init__(self, id_licitacion, rut_usuario='', proceso='postulacion'):
        self.id_licitacion = id_licitacion
        self.rut_usuario = rut_usuario
        self.proceso = proceso
        self.logger = None
        
    def __enter__(self):
        self.logger = configurar_logger_general(
            self.id_licitacion, 
            self.rut_usuario, 
            self.proceso
        )
        return self.logger
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.logger:
            if exc_type:
                self.logger.error(f"Proceso terminado con error: {exc_type.__name__}: {exc_val}")
            else:
                self.logger.info("Proceso completado exitosamente")
            
            # Cerrar todos los handlers
            for handler in self.logger.handlers[:]:
                handler.close()
                self.logger.removeHandler(handler)

# Configurar logger principal
main_logger = configurar_logger_general(id_licitacion, rut_usuario, 'postulacion')
#Recorremos la consulta para encontrar la url
for row in mycursorselect:
    url_postulacion = 'https://www.mercadopublico.cl/Portal/Modules/Desktop/Desktop.aspx?enc='+str(row[0])
    debug_print(f"URL de postulación obtenida: {url_postulacion}", main_logger)
    print(url_postulacion)

#Realizamos una consulta para encontrar el número total de items
mycursorselect.execute("SELECT Count(*)  FROM licitaciones_diarias_total.Licitaciones_diarias where `Licitacion` = '" + id_licitacion + "' and `Fecha_Publicacion` like '%" + fecha_publicacion + "%' limit 1")
mydb.commit()

#Recorremos la consulta para definir el total de items
for r in mycursorselect:
    cantidad_item = r[0]
    debug_print(f"Cantidad de Items encontrados: {cantidad_item}", main_logger)
    print("Cantidad de Items: {}".format(cantidad_item))

#Definimos el total de las paginas
paginas = math.ceil(cantidad_item/10)

def rint(num):
  return round(num +(num%2 -1 if(num%1 ==0.5)else 0))

pag = rint(paginas)

debug_print(f"Páginas calculadas: {pag}", main_logger)
print("rint de Paginas: {}".format(pag))
print("Cantidad de Paginas a revisar con format: {}".format(pag))

#Eventos nuevo script
#Creamos el driver
debug_print("Configurando WebDriver Chrome...", main_logger)
options = Options()
options.add_argument("--headless")
options.add_argument('--disable-gpu')
options.add_argument("--no-sandbox")
options.add_experimental_option('excludeSwitches', ['enable-logging'])
options.add_argument("--incognito")
options.add_argument("--start-maximized")
options.add_argument("--disable-dev-shm-usage")  # <-- agrega esto

options.add_argument("user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/59.0.3071.115 Safari/537.36")
driver = webdriver.Chrome('/usr/local/bin/chromedriver', options=options)
#driver = webdriver.Chrome(options=options)
driver.set_window_size(1920, 1080)
wait = WebDriverWait(driver, 500)

debug_print("WebDriver configurado exitosamente", main_logger)
'''
unidad_consulta = """SELECT lugar_unidad, nombre_unidad FROM pharmatender.users 
                          WHERE rut = %s AND deleted_at IS NULL
                      """
unidad_consulta_valores = (rut_cliente,)
mycursor.execute(unidad_consulta, unidad_consulta_valores)
posicion = mycursor.fetchone()
'''

print("########### LOGIN ####################")
debug_print("########### INICIANDO LOGIN ####################", main_logger)
#Condicion para iniciar login por usuario o rut
def click_when_ready(driver, locator, timeout=10):
    element = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable(locator)
    )
    element.click()

def espera_inteligente_elemento(driver, locator, timeout=30, poll_frequency=0.5):
    """
    Espera inteligente que adapta el tiempo según la carga del sitio
    """
    try:
        # Primero esperar que el elemento esté presente
        elemento = WebDriverWait(driver, timeout, poll_frequency=poll_frequency).until(
            EC.presence_of_element_located(locator)
        )
        
        # Luego esperar que sea visible
        WebDriverWait(driver, 10, poll_frequency=poll_frequency).until(
            EC.visibility_of(elemento)
        )
        
        # Finalmente esperar que sea clickeable si es necesario
        if elemento.tag_name in ['button', 'a', 'input']:
            WebDriverWait(driver, 10, poll_frequency=poll_frequency).until(
                EC.element_to_be_clickable(locator)
            )
        
        return elemento
        
    except TimeoutException as e:
        debug_print(f"Timeout esperando elemento: {locator}", None, 'error')
        raise e

def click_inteligente(driver, locator, timeout=30, logger=None):
    """
    Click más robusto con múltiples estrategias
    """
    debug_print(f"Intentando click en elemento: {locator}", logger)
    
    try:
        # Estrategia 1: Espera estándar + click
        elemento = espera_inteligente_elemento(driver, locator, timeout)
        
        # Scroll al elemento para asegurar visibilidad
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
        time.sleep(0.5)
        
        # Intentar click normal primero
        try:
            elemento.click()
            debug_print("Click normal exitoso", logger)
            return True
        except Exception as e:
            debug_print(f"Click normal falló: {e}, intentando JavaScript", logger, 'warning')
            
            # Estrategia 2: Click con JavaScript
            try:
                driver.execute_script("arguments[0].click();", elemento)
                debug_print("Click con JavaScript exitoso", logger)
                return True
            except Exception as e2:
                debug_print(f"Click JavaScript falló: {e2}, intentando ActionChains", logger, 'warning')
                
                # Estrategia 3: ActionChains
                try:
                    from selenium.webdriver.common.action_chains import ActionChains
                    actions = ActionChains(driver)
                    actions.move_to_element(elemento).click().perform()
                    debug_print("Click con ActionChains exitoso", logger)
                    return True
                except Exception as e3:
                    debug_print(f"Todos los métodos de click fallaron: {e3}", logger, 'error')
                    return False
                    
    except TimeoutException:
        debug_print(f"Elemento no encontrado en {timeout} segundos: {locator}", logger, 'error')
        return False

def esperar_carga_pagina(driver, timeout=60, logger=None):
    """
    Espera inteligente para que la página se cargue completamente
    """
    debug_print("Esperando carga completa de página...", logger)
    
    try:
        # Esperar que document.readyState sea 'complete'
        WebDriverWait(driver, timeout).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        
        # Esperar que jQuery termine de cargar (si existe)
        try:
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script("return typeof jQuery !== 'undefined' ? jQuery.active == 0 : true")
            )
        except:
            pass  # jQuery podría no estar presente
            
        # Esperar que las funciones JavaScript específicas estén disponibles
        try:
            WebDriverWait(driver, 15).until(
                lambda d: d.execute_script("return typeof fnMovePage === 'function'")
            )
            debug_print("Función fnMovePage verificada como disponible", logger)
        except TimeoutException:
            debug_print("Función fnMovePage no está disponible aún", logger, 'warning')
        
        debug_print("Página cargada completamente", logger)
        return True
        
    except TimeoutException:
        debug_print(f"Timeout esperando carga de página ({timeout}s)", logger, 'warning')
        return False

def verificar_funciones_javascript(driver, logger=None):
    """
    Verifica que las funciones JavaScript necesarias estén disponibles
    """
    funciones_requeridas = ['fnMovePage', '__doPostBack']
    funciones_disponibles = []
    
    for funcion in funciones_requeridas:
        try:
            disponible = driver.execute_script(f"return typeof {funcion} === 'function'")
            if disponible:
                funciones_disponibles.append(funcion)
                debug_print(f"Función {funcion} disponible", logger, 'debug')
            else:
                debug_print(f"Función {funcion} NO disponible", logger, 'warning')
        except Exception as e:
            debug_print(f"Error verificando función {funcion}: {e}", logger, 'warning')
    
    debug_print(f"Funciones JS disponibles: {funciones_disponibles}", logger)
    return funciones_disponibles

def esperar_funcion_javascript(driver, nombre_funcion, timeout=30, logger=None):
    """
    Espera específicamente a que una función JavaScript esté disponible
    """
    debug_print(f"Esperando función JavaScript: {nombre_funcion}", logger)
    
    try:
        WebDriverWait(driver, timeout).until(
            lambda d: d.execute_script(f"return typeof {nombre_funcion} === 'function'")
        )
        debug_print(f"Función {nombre_funcion} está lista", logger)
        return True
    except TimeoutException:
        debug_print(f"Timeout esperando función {nombre_funcion} ({timeout}s)", logger, 'error')
        return False

def verificar_cambio_pagina_exitoso(driver, numero_pagina, logger=None, timeout=30):
    """
    Verifica que el cambio de página se haya completado exitosamente
    """
    debug_print(f"Verificando que el cambio a página {numero_pagina} fue exitoso...", logger)
    
    try:
        # Verificar múltiples indicadores de que la página cambió
        indicadores_exitosos = []
        
        # Indicador 1: Verificar elementos específicos de la página de productos
        try:
            WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, "//input[contains(@id, 'rptBids_ctl')]"))
            )
            indicadores_exitosos.append("Elementos de productos encontrados")
            debug_print("✓ Elementos de productos detectados", logger)
        except TimeoutException:
            debug_print("✗ No se detectaron elementos de productos", logger, 'warning')
        
        # Indicador 2: Verificar que el paginador muestre la página correcta
        try:
            pagina_activa = driver.find_element(By.XPATH, f"//span[contains(@class, 'pager') and text()='{numero_pagina}']")
            if pagina_activa:
                indicadores_exitosos.append("Paginador muestra página correcta")
                debug_print(f"✓ Paginador muestra página {numero_pagina}", logger)
        except:
            debug_print("✗ No se pudo verificar paginador", logger, 'warning')
        
        # Indicador 3: Verificar URL o estado de la página
        try:
            # Verificar que la página contiene elementos de la tabla de productos
            tabla_productos = driver.find_elements(By.XPATH, "//table[contains(@id, 'rptBids')]")
            if tabla_productos:
                indicadores_exitosos.append("Tabla de productos presente")
                debug_print("✓ Tabla de productos encontrada", logger)
        except:
            debug_print("✗ No se encontró tabla de productos", logger, 'warning')
        
        # Verificar si al menos 1 indicador fue exitoso
        if len(indicadores_exitosos) >= 1:
            debug_print(f"Cambio de página verificado: {indicadores_exitosos}", logger)
            return True
        else:
            debug_print("No se pudo verificar el cambio de página", logger, 'error')
            return False
            
    except Exception as e:
        debug_print(f"Error verificando cambio de página: {e}", logger, 'error')
        return False

def encontrar_elementos_pagina_productos(driver, indice_formateado, logger=None, timeout=45):
    """
    Busca los elementos de la página de productos con múltiples estrategias
    """
    debug_print(f"Buscando elementos para índice {indice_formateado}...", logger)
    
    # Estrategias múltiples para encontrar checkbox
    selectores_checkbox = [
        f"ctl00_mpcphFormWizardFields_rptBids_ctl{indice_formateado}_rblBids_0",
        f"rptBids_ctl{indice_formateado}_rblBids_0",
        f"//input[contains(@id, 'rptBids_ctl{indice_formateado}') and contains(@id, 'rblBids_0')]",
        f"//input[@type='radio' and contains(@id, 'ctl{indice_formateado}')]"
    ]
    
    # Estrategias para textarea
    selectores_textarea = [
        f"ctl00_mpcphFormWizardFields_rptBids_ctl{indice_formateado}__TxtSupplierComment",
        f"rptBids_ctl{indice_formateado}__TxtSupplierComment",
        f"//textarea[contains(@id, 'rptBids_ctl{indice_formateado}') and contains(@id, 'TxtSupplierComment')]"
    ]
    
    # Estrategias para campo precio
    selectores_precio = [
        f"ctl00_mpcphFormWizardFields_rptBids_ctl{indice_formateado}__TxtUnitNetPriceN",
        f"rptBids_ctl{indice_formateado}__TxtUnitNetPriceN",
        f"//input[contains(@id, 'rptBids_ctl{indice_formateado}') and contains(@id, 'TxtUnitNetPrice')]"
    ]
    
    elementos_encontrados = {}
    
    # Buscar checkbox
    for selector in selectores_checkbox:
        try:
            if selector.startswith("//"):
                elemento = WebDriverWait(driver, timeout//3).until(
                    EC.presence_of_element_located((By.XPATH, selector))
                )
            else:
                elemento = WebDriverWait(driver, timeout//3).until(
                    EC.presence_of_element_located((By.ID, selector))
                )
            elementos_encontrados['checkbox'] = (elemento, selector)
            debug_print(f"✓ Checkbox encontrado con: {selector}", logger)
            break
        except TimeoutException:
            debug_print(f"✗ Checkbox no encontrado con: {selector}", logger, 'debug')
            continue
    
    # Buscar textarea
    for selector in selectores_textarea:
        try:
            if selector.startswith("//"):
                elemento = WebDriverWait(driver, timeout//3).until(
                    EC.presence_of_element_located((By.XPATH, selector))
                )
            else:
                elemento = WebDriverWait(driver, timeout//3).until(
                    EC.presence_of_element_located((By.ID, selector))
                )
            elementos_encontrados['textarea'] = (elemento, selector)
            debug_print(f"✓ Textarea encontrado con: {selector}", logger)
            break
        except TimeoutException:
            debug_print(f"✗ Textarea no encontrado con: {selector}", logger, 'debug')
            continue
    
    # Buscar campo precio
    for selector in selectores_precio:
        try:
            if selector.startswith("//"):
                elemento = WebDriverWait(driver, timeout//3).until(
                    EC.presence_of_element_located((By.XPATH, selector))
                )
            else:
                elemento = WebDriverWait(driver, timeout//3).until(
                    EC.presence_of_element_located((By.ID, selector))
                )
            elementos_encontrados['precio'] = (elemento, selector)
            debug_print(f"✓ Campo precio encontrado con: {selector}", logger)
            break
        except TimeoutException:
            debug_print(f"✗ Campo precio no encontrado con: {selector}", logger, 'debug')
            continue
    
    debug_print(f"Elementos encontrados: {list(elementos_encontrados.keys())}", logger)
    return elementos_encontrados

def tomar_screenshot_debug(driver, ruta_guardado, nombre, logger=None):
    """
    Toma screenshot para debugging con logging
    """
    try:
        screenshot_path = ruta_guardado + nombre
        driver.save_screenshot(screenshot_path)
        debug_print(f"Screenshot debug guardado: {screenshot_path}", logger, 'debug')
        return True
    except Exception as e:
        debug_print(f"Error guardando screenshot: {e}", logger, 'warning')
        return False

def manejar_error_javascript_y_continuar(driver, error, numero_pagina, logger=None):
    """
    Maneja errores de JavaScript y ofrece métodos alternativos para continuar
    """
    debug_print(f"Error JavaScript detectado: {error}", logger, 'error')
    
    # Método 1: Intentar recargar la página y reactivar estado
    debug_print("Método 1: Recargando página para restablecer JavaScript...", logger)
    try:
        driver.refresh()
        time.sleep(10)
        esperar_carga_pagina(driver, timeout=60, logger=logger)
        
        # Reactivar checkbox
        if click_inteligente(driver, (By.ID, "ctl00_mpcphFormWizardFields_chkNoBids"), timeout=20, logger=logger):
            time.sleep(5)
            esperar_carga_pagina(driver, timeout=45, logger=logger)
            
            # Verificar si ahora funciona
            if esperar_funcion_javascript(driver, 'fnMovePage', timeout=20, logger=logger):
                debug_print("JavaScript restaurado después de refresh", logger)
                return True
                
    except Exception as e:
        debug_print(f"Error en método 1: {e}", logger, 'warning')
    
    # Método 2: Intentar inyectar la función JavaScript manualmente
    debug_print("Método 2: Intentando inyectar función JavaScript...", logger)
    try:
        script_injection = """
        if (typeof fnMovePage === 'undefined') {
            function fnMovePage(pageNumber, pagerName) {
                __doPostBack(pagerName + '$ctl' + pageNumber.toString().padStart(2, '0'), '');
            }
            window.fnMovePage = fnMovePage;
        }
        """
        driver.execute_script(script_injection)
        
        if esperar_funcion_javascript(driver, 'fnMovePage', timeout=5, logger=logger):
            debug_print("Función JavaScript inyectada exitosamente", logger)
            return True
            
    except Exception as e:
        debug_print(f"Error en método 2: {e}", logger, 'warning')
    
    # Método 3: Usar __doPostBack directamente
    debug_print("Método 3: Intentando usar __doPostBack directamente...", logger)
    try:
        if esperar_funcion_javascript(driver, '__doPostBack', timeout=10, logger=logger):
            postback_command = f"__doPostBack('wucPagerBID$ctl{numero_pagina:02d}', '');"
            debug_print(f"Ejecutando: {postback_command}", logger)
            driver.execute_script(postback_command)
            time.sleep(3)
            esperar_carga_pagina(driver, timeout=45, logger=logger)
            debug_print("Navegación con __doPostBack exitosa", logger)
            return True
            
    except Exception as e:
        debug_print(f"Error en método 3: {e}", logger, 'warning')
    
    debug_print("Todos los métodos de recuperación fallaron", logger, 'error')
    return False

def cambiar_pagina_con_verificacion(driver, numero_pagina, logger=None, max_intentos=3):
    """
    Cambia de página con verificación completa de que la navegación fue exitosa
    """
    debug_print(f"Intentando cambiar a página {numero_pagina}", logger)
    
    for intento in range(max_intentos):
        try:
            # Tomar screenshot antes del cambio
            tomar_screenshot_debug(driver, "/tmp/", f"antes_cambio_pagina_{numero_pagina}_intento_{intento+1}.png", logger)
            
            # Verificar que la función fnMovePage esté disponible
            if not esperar_funcion_javascript(driver, 'fnMovePage', timeout=20, logger=logger):
                debug_print(f"Función fnMovePage no disponible en intento {intento + 1}", logger, 'warning')
                
                # Intentar métodos de recuperación
                if manejar_error_javascript_y_continuar(driver, "fnMovePage not defined", numero_pagina, logger):
                    debug_print("Recuperación exitosa, continuando...", logger)
                else:
                    if intento < max_intentos - 1:
                        time.sleep(5)
                        continue
                    else:
                        debug_print("No se pudo recuperar JavaScript después de todos los intentos", logger, 'error')
                        return False
            
            # Ejecutar el cambio de página
            cambio_pagina = f'fnMovePage({numero_pagina},"wucPagerBID");'
            debug_print(f"Ejecutando: {cambio_pagina}", logger)
            driver.execute_script(cambio_pagina)
            
            # Esperar que se complete el cambio con más tiempo
            debug_print("Esperando procesamiento del cambio de página...", logger)
            time.sleep(5)  # Aumentar tiempo inicial
            
            # Esperar carga completa
            esperar_carga_pagina(driver, timeout=60, logger=logger)
            
            # Verificar que el cambio fue exitoso
            if verificar_cambio_pagina_exitoso(driver, numero_pagina, logger, timeout=30):
                debug_print(f"Cambio a página {numero_pagina} completado y verificado exitosamente", logger)
                tomar_screenshot_debug(driver, "/tmp/", f"despues_cambio_pagina_{numero_pagina}_exitoso.png", logger)
                return True
            else:
                debug_print(f"Cambio de página no se pudo verificar en intento {intento + 1}", logger, 'warning')
                tomar_screenshot_debug(driver, "/tmp/", f"despues_cambio_pagina_{numero_pagina}_fallido_{intento+1}.png", logger)
                
                if intento < max_intentos - 1:
                    debug_print("Esperando antes del siguiente intento...", logger)
                    time.sleep(8)
                    continue
            
        except Exception as e:
            debug_print(f"Error en intento {intento + 1} cambiando página: {e}", logger, 'error')
            tomar_screenshot_debug(driver, "/tmp/", f"error_cambio_pagina_{numero_pagina}_intento_{intento+1}.png", logger)
            
            # Si es un error de JavaScript, intentar recuperación
            if "javascript error" in str(e).lower() or "not defined" in str(e).lower():
                if manejar_error_javascript_y_continuar(driver, str(e), numero_pagina, logger):
                    continue  # Reintentar con JavaScript restaurado
            
            if intento < max_intentos - 1:
                time.sleep(8)
                continue
            else:
                debug_print(f"Falló cambio de página después de {max_intentos} intentos", logger, 'error')
                return False
    
    debug_print(f"No se pudo cambiar a página {numero_pagina} después de todos los intentos", logger, 'error')
    return False

def manejar_alertas_con_retry(driver, logger=None, max_intentos=3, timeout=5):
    """
    Manejo de alertas con reintentos automáticos
    """
    for intento in range(max_intentos):
        try:
            debug_print(f"Verificando alertas (intento {intento + 1}/{max_intentos})...", logger)
            
            # Esperar con timeout más largo en el primer intento
            timeout_actual = timeout * (intento + 1)
            alert = WebDriverWait(driver, timeout_actual).until(EC.alert_is_present())
            
            alert_text = alert.text
            debug_print(f"¡ALERTA DETECTADA! Texto: '{alert_text}'", logger, 'warning')
            
            # Lista expandida de mensajes críticos
            mensajes_criticos = [
                "error", "intente nuevamente", "credenciales", "usuario o contraseña",
                "acceso denegado", "ha ocurrido un error", "sesión expirada",
                "tiempo agotado", "connection", "network", "servidor no disponible"
            ]
            
            es_error_critico = any(msg in alert_text.lower() for msg in mensajes_criticos)
            
            if es_error_critico:
                debug_print(f"ALERTA CRÍTICA DETECTADA: {alert_text}", logger, 'error')
            
            # Intentar aceptar la alerta con retry
            for retry_accept in range(3):
                try:
                    alert.accept()
                    debug_print(f"Alerta aceptada exitosamente", logger)
                    break
                except Exception as e:
                    if retry_accept < 2:
                        debug_print(f"Error aceptando alerta (intento {retry_accept + 1}): {e}", logger, 'warning')
                        time.sleep(1)
                    else:
                        debug_print(f"No se pudo aceptar alerta después de 3 intentos", logger, 'error')
            
            return {
                'hay_alerta': True,
                'texto_alerta': alert_text,
                'es_critico': es_error_critico,
                'intento': intento + 1
            }
            
        except TimeoutException:
            if intento == 0:
                debug_print("No se detectaron alertas inmediatas", logger, 'debug')
            continue
        except Exception as e:
            debug_print(f"Error procesando alerta en intento {intento + 1}: {e}", logger, 'error')
            if intento < max_intentos - 1:
                time.sleep(2)  # Esperar antes del siguiente intento
            continue
    
    debug_print("No se detectaron alertas después de todos los intentos", logger, 'debug')
    return {
        'hay_alerta': False,
        'texto_alerta': None,
        'es_critico': False,
        'intento': max_intentos
    }
actualizar_estado_con_log("Iniciando el proceso de postulación...", id_licitacion, main_logger)
# Función para interactuar con la base de datos
def fetch_user_position(rut_cliente):
    mydb = get_mysql_connection_with_fallback()

    mycursor = mydb.cursor()
    query = """SELECT lugar_unidad, nombre_unidad FROM pharmatender.users WHERE rut = %s"""
    mycursor.execute(query, (rut_cliente,))
    position = mycursor.fetchone()
    mycursor.close()
    mydb.close()
    return position

def handle_business_logic(driver, user_position):
    try:
        #modal_element = WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, 'myModalxxx')))#similar error
        modal_element = WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.ID, 'myModal')))

        driver.save_screenshot('Modal_status.png')

        if modal_element:
            filas = driver.find_elements(By.XPATH, "//table[@id='tabla']/tbody/tr/td/div/label[@class='wrap-td']")
            for fila in filas:
                nombre_company = user_position[1]
                nombre_formateado = fila.text.lower()
                existe_nombre = nombre_company.lower() in nombre_formateado

                if existe_nombre:
                    
                    fila.click()                    
                    click_when_ready(driver, (By.XPATH, '//*[@id="myModal"]/div/div/div[3]/a'), timeout=60)
                    break
    except TimeoutException:
        #print("Error: Modal o elemento no encontrado en el tiempo especificado..deberia volver a intentar.")
        driver.save_screenshot('Modal_Except.png')
        return False
    
result = 'login_failed'  # Inicializar el resultado como 'login_failed'
attempts = 0  # Contador para saber cuántos intentos hemos hecho
#print("Iniciando el WebDriver...")
#driver = configure_webdriver()
start_time = time.time()  # Capturar el tiempo de inicio
end_time = None  # Inicializar end_time aquí
login_to_zocial_successful = False  # variable para rastrear el éxito hasta el punto 'zocial-oidc'que es boton clave unica
def configurar_logger_unidad_farma(id_licitacion):
    """
    Configura un logger específico para el proceso de selección de unidad farmacéutica
    """
    # Crear el nombre del archivo log
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_filename = f"unidad_farma_{id_licitacion}_{timestamp}.log"
    
    # Obtener la ruta del script actual
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_path = os.path.join(script_dir, log_filename)
    
    # Configurar el logger
    logger = logging.getLogger('unidad_farma_logger')
    logger.setLevel(logging.DEBUG)
    
    # Eliminar handlers existentes para evitar duplicados
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Crear handler para archivo
    file_handler = logging.FileHandler(log_path, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    # Crear formato personalizado
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    
    # Agregar handler al logger
    logger.addHandler(file_handler)
    
    # Log inicial
    logger.info("="*60)
    logger.info(f"INICIO DE PROCESO SELECCIÓN UNIDAD FARMACÉUTICA")
    logger.info(f"Licitación: {id_licitacion}")
    logger.info(f"Archivo de log: {log_filename}")
    logger.info("="*60)
    
    return logger

import logging
from datetime import datetime

def configurar_logger_unidad_farma(id_licitacion):
    """
    Configura un logger específico para el proceso de selección de unidad farmacéutica
    """
    # Crear el nombre del archivo log
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_filename = f"unidad_farma_{id_licitacion}_{timestamp}.log"
    
    # Obtener la ruta del script actual
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_path = os.path.join(script_dir, log_filename)
    
    # Configurar el logger
    logger = logging.getLogger('unidad_farma_logger')
    logger.setLevel(logging.DEBUG)
    
    # Eliminar handlers existentes para evitar duplicados
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Crear handler para archivo
    file_handler = logging.FileHandler(log_path, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    # Crear formato personalizado
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    
    # Agregar handler al logger
    logger.addHandler(file_handler)
    
    # Log inicial
    logger.info("="*60)
    logger.info(f"INICIO DE PROCESO SELECCIÓN UNIDAD FARMACÉUTICA")
    logger.info(f"Licitación: {id_licitacion}")
    logger.info(f"Archivo de log: {log_filename}")
    logger.info("="*60)
    
    return logger

def seleccionar_unidad_farmaceutica(driver, wait, id_licitacion):
    """
    Función específica para seleccionar la unidad que contenga 'farma' en su nombre
    para usuarios que requieren cambio de unidad organizacional
    """
    # Configurar logger específico
    logger = configurar_logger_unidad_farma(id_licitacion)
    
    try:
        logger.info("Iniciando proceso de selección de unidad farmacéutica...")
        logger.info(f"URL actual: {driver.current_url}")
        logger.info(f"Título de página: {driver.title}")
        
        # 1. Hacer click en el contenedor de unidad para abrir el diálogo
        logger.info("Paso 1: Buscando contenedor de unidad...")
        unit_container = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "unit-container")))
        logger.info("Contenedor de unidad encontrado")
        
        # Obtener texto actual de la unidad antes del cambio
        try:
            unidad_inicial = driver.find_element(By.CLASS_NAME, "unidad").text
            logger.info(f"Unidad inicial: {unidad_inicial}")
        except:
            logger.warning("No se pudo obtener la unidad inicial")
        
        driver.execute_script("arguments[0].click();", unit_container)
        logger.info("Click en contenedor de unidad realizado exitosamente")
        
        time.sleep(3)  # Esperar a que se abra el modal
        driver.save_screenshot(ruta_guardado + 'modal_unidades_abierto.png')
        logger.info("Screenshot del modal tomada")
        
        # 2. Esperar a que aparezca la tabla de organismos
        logger.info("Paso 2: Esperando tabla de organismos...")
        tabla_organismos = wait.until(EC.presence_of_element_located((By.ID, "tblOrganismos")))
        logger.info("Tabla de organismos encontrada exitosamente")
        
        # 3. Buscar todas las filas de la tabla
        logger.info("Paso 3: Obteniendo filas de unidades...")
        filas_unidades = driver.find_elements(By.XPATH, "//table[@id='tblOrganismos']/tbody/tr")
        logger.info(f"Se encontraron {len(filas_unidades)} unidades disponibles")
        
        # Log de todas las unidades disponibles
        logger.info("--- LISTA DE UNIDADES DISPONIBLES ---")
        for i, fila in enumerate(filas_unidades):
            try:
                nombre_unidad = fila.find_element(By.TAG_NAME, "td").text
                logger.info(f"Unidad {i+1}: {nombre_unidad}")
            except Exception as e:
                logger.error(f"Error al obtener nombre de unidad {i+1}: {e}")
        logger.info("--- FIN LISTA DE UNIDADES ---")
        
        # 4. Buscar la unidad que contenga 'farma' (case insensitive)
        logger.info("Paso 4: Buscando unidad que contenga 'farma'...")
        unidad_seleccionada = False
        unidad_farmaceutica_encontrada = None
        
        for i, fila in enumerate(filas_unidades):
            try:
                # Obtener el texto de la primera celda (nombre de la unidad)
                nombre_unidad = fila.find_element(By.TAG_NAME, "td").text
                nombre_unidad_lower = nombre_unidad.lower()
                logger.debug(f"Evaluando unidad {i+1}: '{nombre_unidad}' (lowercase: '{nombre_unidad_lower}')")
                
                # Verificar si contiene 'farma'
                if 'farma' in nombre_unidad_lower:
                    logger.info(f"¡UNIDAD FARMACÉUTICA ENCONTRADA!")
                    logger.info(f"Nombre completo: {nombre_unidad}")
                    logger.info(f"Posición en tabla: {i+1}")
                    unidad_farmaceutica_encontrada = nombre_unidad
                    
                    # Buscar el botón de selección (SVG) con múltiples estrategias
                    logger.info("Buscando botón de selección...")
                    
                    # Estrategia 1: Buscar SVG directamente en la segunda celda
                    boton_seleccion = None
                    selectores_boton = [
                        ".//td[2]/svg",  # Selector original
                        ".//td[2]//svg",  # SVG en cualquier nivel dentro de la segunda celda
                        ".//svg",  # Cualquier SVG en la fila
                        ".//td[2]//*[name()='svg']",  # SVG usando xpath con namespace
                        ".//td[2]//button",  # Si es un botón en lugar de SVG
                        ".//td[2]//a",  # Si es un enlace
                        ".//td[2]//*[@onclick]",  # Cualquier elemento con onclick
                        ".//td[last()]//svg",  # SVG en la última celda
                        ".//td[last()]//*[@onclick]"  # Elemento con onclick en la última celda
                    ]
                    
                    for selector in selectores_boton:
                        try:
                            logger.debug(f"Probando selector: {selector}")
                            boton_seleccion = fila.find_element(By.XPATH, selector)
                            logger.info(f"Botón encontrado con selector: {selector}")
                            break
                        except Exception as e:
                            logger.debug(f"Selector {selector} falló: {e}")
                            continue
                    
                    if boton_seleccion:
                        try:
                            # Obtener la función onclick para debug
                            onclick_function = boton_seleccion.get_attribute("onclick")
                            logger.info(f"Función onclick encontrada: {onclick_function}")
                        except:
                            logger.warning("No se pudo obtener función onclick")
                        
                        # Hacer click en el botón de selección con múltiples estrategias
                        logger.info("Ejecutando click en botón de selección...")
                        
                        click_exitoso = False
                        estrategias_click = [
                            lambda: driver.execute_script("arguments[0].click();", boton_seleccion),
                            lambda: boton_seleccion.click(),
                            lambda: ActionChains(driver).move_to_element(boton_seleccion).click().perform(),
                            # Si hay función onclick, ejecutarla directamente
                            lambda: driver.execute_script(onclick_function) if onclick_function else None
                        ]
                        
                        for idx, estrategia in enumerate(estrategias_click):
                            try:
                                if estrategia:  # Verificar que la estrategia no sea None
                                    logger.debug(f"Intentando estrategia de click {idx + 1}")
                                    estrategia()
                                    logger.info(f"Click exitoso con estrategia {idx + 1}")
                                    click_exitoso = True
                                    break
                            except Exception as e:
                                logger.debug(f"Estrategia de click {idx + 1} falló: {e}")
                                continue
                        
                        if click_exitoso:
                            logger.info("Click en botón de selección realizado exitosamente")
                            unidad_seleccionada = True
                            break
                        else:
                            logger.error("No se pudo hacer click en el botón de selección")
                    else:
                        logger.error("No se pudo encontrar el botón de selección con ningún selector")
                        # Tomar screenshot para debug
                        driver.save_screenshot(ruta_guardado + f'debug_fila_{i+1}.png')
                        
                        # Como último recurso, intentar hacer click en toda la fila
                        try:
                            logger.info("Intentando click en toda la fila como último recurso...")
                            driver.execute_script("arguments[0].click();", fila)
                            logger.info("Click en fila realizado")
                            unidad_seleccionada = True
                            break
                        except Exception as e:
                            logger.error(f"Click en fila también falló: {e}")
                else:
                    logger.debug(f"Unidad '{nombre_unidad}' no contiene 'farma' - descartada")
                    
            except Exception as e:
                logger.error(f"Error al procesar fila {i+1}: {e}")
                continue
        
        if not unidad_seleccionada:
            logger.warning("ADVERTENCIA: No se encontró ninguna unidad que contenga 'farma'")
            logger.info("Activando modo fallback...")
            driver.save_screenshot(ruta_guardado + 'unidad_farma_no_encontrada.png')
            
            # Como fallback, intentar usar la primera unidad disponible
            try:
                logger.info("Intentando seleccionar primera unidad como fallback...")
                primera_fila = filas_unidades[0]
                nombre_primera = primera_fila.find_element(By.TAG_NAME, "td").text
                logger.info(f"Primera unidad disponible: {nombre_primera}")
                
                # Usar las mismas estrategias de búsqueda para el fallback
                boton_primera_unidad = None
                for selector in selectores_boton:
                    try:
                        boton_primera_unidad = primera_fila.find_element(By.XPATH, selector)
                        break
                    except:
                        continue
                
                if boton_primera_unidad:
                    try:
                        onclick_fallback = boton_primera_unidad.get_attribute("onclick")
                        logger.info(f"Función onclick fallback: {onclick_fallback}")
                    except:
                        onclick_fallback = None
                    
                    # Intentar click con las mismas estrategias
                    for idx, estrategia in enumerate([
                        lambda: driver.execute_script("arguments[0].click();", boton_primera_unidad),
                        lambda: boton_primera_unidad.click(),
                        lambda: ActionChains(driver).move_to_element(boton_primera_unidad).click().perform(),
                        lambda: driver.execute_script(onclick_fallback) if onclick_fallback else None
                    ]):
                        try:
                            if estrategia:
                                estrategia()
                                logger.info(f"Fallback click exitoso con estrategia {idx + 1}")
                                unidad_farmaceutica_encontrada = nombre_primera
                                break
                        except Exception as e:
                            logger.debug(f"Estrategia fallback {idx + 1} falló: {e}")
                            continue
                else:
                    # Último recurso: click en toda la primera fila
                    logger.info("Último recurso: click en primera fila completa")
                    driver.execute_script("arguments[0].click();", primera_fila)
                    unidad_farmaceutica_encontrada = nombre_primera
                
                logger.info("Se seleccionó la primera unidad disponible como fallback")
                
            except Exception as fallback_error:
                logger.error(f"Error en fallback: {fallback_error}")
                logger.error("FALLO TOTAL: No se pudo seleccionar ninguna unidad")
                return False
        
        # 5. Esperar a que se procese el cambio de unidad
        logger.info("Paso 5: Esperando procesamiento del cambio de unidad...")
        time.sleep(5)
        driver.save_screenshot(ruta_guardado + 'unidad_farmaceutica_seleccionada.png')
        logger.info("Screenshot post-selección tomada")
        
        # 6. Verificar que el cambio se haya aplicado correctamente
        logger.info("Paso 6: Verificando cambio de unidad...")
        try:
            unidad_actual = driver.find_element(By.CLASS_NAME, "unidad").text
            logger.info(f"Unidad actual después del cambio: {unidad_actual}")
            
            if unidad_farmaceutica_encontrada:
                if unidad_actual == unidad_farmaceutica_encontrada:
                    logger.info("VERIFICACION EXITOSA: La unidad cambio correctamente")
                else:
                    logger.warning(f"VERIFICACION PARCIAL: Unidad esperada '{unidad_farmaceutica_encontrada}' vs actual '{unidad_actual}'")
            
        except Exception as verificacion_error:
            logger.error(f"Error en verificación: {verificacion_error}")
            logger.warning("No se pudo verificar la unidad actual")
        
        logger.info("="*60)
        logger.info("PROCESO DE SELECCIÓN DE UNIDAD FARMACÉUTICA COMPLETADO EXITOSAMENTE")
        logger.info(f"Unidad seleccionada: {unidad_farmaceutica_encontrada}")
        logger.info("="*60)
        
        # Cerrar el logger
        for handler in logger.handlers[:]:
            handler.close()
            logger.removeHandler(handler)
        
        return True
        
    except TimeoutException as e:
        logger.error(f"TIMEOUT ERROR: {e}")
        logger.error("El proceso excedió el tiempo de espera")
        driver.save_screenshot(ruta_guardado + 'error_timeout_unidad_farma.png')
        logger.error("Screenshot de error tomada")
        
        # Cerrar el logger
        for handler in logger.handlers[:]:
            handler.close()
            logger.removeHandler(handler)
        
        return False
        
    except Exception as e:
        logger.error(f"ERROR GENERAL: {e}")
        logger.error("Error inesperado en el proceso")
        driver.save_screenshot(ruta_guardado + 'error_general_unidad_farma.png')
        logger.error("Screenshot de error tomada")
        
        # Cerrar el logger
        for handler in logger.handlers[:]:
            handler.close()
            logger.removeHandler(handler)
        
        return False
while attempts < 30: 
    debug_print(f"Intento de login #{attempts + 1}", main_logger)
    
    if not login_to_zocial_successful:
        debug_print("Navegando a Mercado Público...", main_logger)
        driver.get('https://www.mercadopublico.cl')
        time.sleep(2)
        
        if "queue-it" in driver.current_url:
            debug_print("Detectada cola de espera, intentando bypass...", main_logger)
            try:
                click_when_ready(driver, (By.ID, 'divConfirmRedirectModal'), timeout=100)
                debug_print("Bypass de cola exitoso", main_logger)
            except TimeoutException:
                debug_print("No se encontró modal de cola", main_logger, 'warning')
                pass
        
        user_position = fetch_user_position(rut_cliente)
        debug_print(f"Posición de usuario obtenida: {user_position}", main_logger)
    
    # Lógica para iniciar sesión con manejo de alertas mejorado
    try:
        debug_print("Iniciando proceso de login...", main_logger)
        
        # Esperar que la página se cargue completamente
        esperar_carga_pagina(driver, timeout=30, logger=main_logger)
        
        # Hacer clic en "Iniciar Sesión" con espera inteligente
        debug_print("Haciendo clic en 'Iniciar Sesión'...", main_logger)
        if not click_inteligente(driver, (By.XPATH, '//button[text()="Iniciar Sesión"]'), timeout=60, logger=main_logger):
            debug_print("Error: No se pudo hacer click en 'Iniciar Sesión'", main_logger, 'error')
            raise TimeoutException("Button 'Iniciar Sesión' not clickable")
        
        # Esperar transición de página
        time.sleep(3)
        esperar_carga_pagina(driver, timeout=30, logger=main_logger)
        
        # Hacer clic en Clave Única con espera inteligente
        debug_print("Haciendo clic en 'Clave Única'...", main_logger)
        if not click_inteligente(driver, (By.ID, 'zocial-oidc'), timeout=60, logger=main_logger):
            debug_print("Error: No se pudo hacer click en 'zocial-oidc'", main_logger, 'error')
            raise TimeoutException("Button 'zocial-oidc' not clickable")
        
        # Esperar que aparezcan los campos de credenciales
        debug_print("Esperando campos de credenciales...", main_logger)
        campo_usuario = espera_inteligente_elemento(driver, (By.ID, 'uname'), timeout=30)
        campo_password = espera_inteligente_elemento(driver, (By.ID, 'pword'), timeout=30)
        
        # Ingreso de credenciales con limpieza previa
        debug_print("Ingresando credenciales...", main_logger)
        campo_usuario.clear()
        time.sleep(0.5)
        campo_usuario.send_keys(usuario_mp)
        
        campo_password.clear()
        time.sleep(0.5)
        campo_password.send_keys(clave_mp)
        
        # Pequeña pausa antes del submit
        time.sleep(1)
        
        debug_print("Enviando formulario de login...", main_logger)
        if not click_inteligente(driver, (By.ID, 'login-submit'), timeout=30, logger=main_logger):
            debug_print("Error: No se pudo hacer click en 'login-submit'", main_logger, 'error')
            raise TimeoutException("Button 'login-submit' not clickable")
        
        # ESPERA INTELIGENTE POST-LOGIN: Dar más tiempo para la respuesta del servidor
        debug_print("Esperando respuesta del servidor post-login...", main_logger)
        time.sleep(5)  # Espera inicial más larga
        
        # Verificar alertas con múltiples intentos y timeouts adaptativos
        debug_print("Verificando alertas post-login con sistema inteligente...", main_logger)
        resultado_alerta = manejar_alertas_con_retry(driver, main_logger, max_intentos=3, timeout=8)
        
        if resultado_alerta['es_critico']:
            debug_print(f"ERROR CRÍTICO DETECTADO: {resultado_alerta['texto_alerta']}", main_logger, 'error')
            debug_print(f"Alerta detectada en intento: {resultado_alerta['intento']}", main_logger, 'error')
            result = 'login_error_credenciales'
            actualizar_estado_con_log("Error: Credenciales incorrectas o problema del servidor", id_licitacion, main_logger)
            driver.quit()
            break
        
        # Verificar errores en la página solo si no hubo alertas críticas
        if not resultado_alerta['hay_alerta'] or not resultado_alerta['es_critico']:
            try:
                debug_print("Verificando mensajes de error en página...", main_logger)
                # Usar espera más corta para errores de página ya que las alertas fueron manejadas
                WebDriverWait(driver, 8).until(EC.visibility_of_element_located((By.CLASS_NAME, 'gob-response-error')))
                debug_print("Error de credenciales detectado en página", main_logger, 'error')
                result = 'login_error_credenciales'
                driver.quit()
                break
            except TimeoutException:
                debug_print("No se encontraron errores en página, continuando...", main_logger)
                pass
        
        # Esperar estabilización de la página antes de continuar
        debug_print("Esperando estabilización de página...", main_logger)
        esperar_carga_pagina(driver, timeout=45, logger=main_logger)
        # Lógica de negocio aquí, si es necesario
        
        if user_position:
            #print("Manejando la lógica de negocio...")
            success = handle_business_logic(driver, user_position)
            if not success:
                login_to_zocial_successful = False  # Resetear si no se encuentra el modal
        else:
            #print("Usuario no existe ir a tabla user y ver nombreunidad o el modal no aparece")
            driver.save_screenshot('Modal_none.png')
        
        # Verificar el título de la página
        #print("Verificando el título de la página...")
        titulo = driver.title
        #print("Título obtenido: {}".format(titulo))  #
        
        
        if titulo == 'Mercado publico la nueva plataforma de licitaciones de ChileCompra':
            #print("login_ok")
            result = 'login_ok'
            #driver.save_screenshot('5_Estoy_logeada.png')
            login_to_zocial_successful = True
            if rut_usuario == '80621200-8':
                print("RUT requiere selección de unidad farmacéutica")
                #actualizar_estado("Seleccionando unidad farmacéutica...", id_licitacion)
                
                seleccion_exitosa = seleccionar_unidad_farmaceutica(driver, wait, id_licitacion)  # Agregar id_licitacion

                
                if not seleccion_exitosa:
                    print("ERROR: No se pudo seleccionar la unidad farmacéutica")
                    result = 'error_seleccion_unidad'
                    driver.save_screenshot(ruta_guardado + 'error_final_seleccion_unidad.png')
                    #actualizar_estado("Error: No se pudo seleccionar la unidad farmacéutica", id_licitacion)
                    # Opcional: puedes decidir si abortar o continuar
                    # driver.quit()
                    # break
                else:
                    print("Selección de unidad farmacéutica completada exitosamente")
                    #actualizar_estado("Unidad farmacéutica seleccionada exitosamente", id_licitacion)
            
            actualizar_estado("Login exitoso. Procediendo a la descripción de la oferta...", id_licitacion)
            break
           
            
        
    except (TimeoutException, StaleElementReferenceException) as e:
        #print("Error: {}".format(e))
        login_to_zocial_successful = False
        result = 'login_failed'
        
    finally:
        end_time = time.time()  # Capturar el tiempo de finalización
        elapsed_time = end_time - start_time
        #print("Tiempo total de ejecución del script: {:.2f} minutos".format(elapsed_time / 60))
    attempts += 1  # Aumentar el contador de intentos

time.sleep(5)

print("########### FIN LOGIN ####################")

print("########### PRIMERA PAGINA ####################")
#Rescatamos URL de postulacion

#Rescatamos URL de postulacion
#primera_pagina = driver.get(url_postulacion)
#ruta_guardado = '/home/coordinador/'

                                                         

time.sleep(5)
driver.get("https://www.mercadopublico.cl/BID/Modules/RFB/NEwSearchProcurement.aspx")
time.sleep(3)
                                              
#menu = driver.find_element_by_link_text('Licitaciones')
#actions = ActionChains(driver)
#actions.move_to_element(menu).perform()
#time.sleep(3)
#sublist_item = driver.find_element_by_xpath('/html/body/form/section[2]/div/table/tbody/tr/td/div[4]/table/tbody/tr[1]/td/table/tbody/tr/td/a')
#sublist_item.click()
#time.sleep(7)
#driver.save_screenshot(ruta_guardado + 'menulici.png')
#input_element = driver.find_element_by_xpath('/html/body/form/div[3]/table/tbody/tr/td/div/table[2]/tbody/tr[2]/td[2]/table/tbody/tr[1]/td[1]/input')
#input_element.click()
#input_element.send_keys(id_licitacion)
#driver.switch_to.frame("fraDetalle")
# envio la licitacion
print(id_licitacion)
driver.save_screenshot(ruta_guardado + 'modalnuevo.png')
time.sleep(2)

def verificar_y_cerrar_modal():
    try:
        # Usar espera inteligente para el modal
        modal = espera_inteligente_elemento(driver, (By.ID, "modalOfertasNoEnviadas"), timeout=10)
        
        # Verificar si el modal está visible
        if modal.is_displayed():
            debug_print("Modal de ofertas no enviadas detectado, cerrando...", main_logger)
            # Encuentra el botón de cerrar dentro del modal y haz clic
            if not click_inteligente(driver, (By.CSS_SELECTOR, "button.close"), timeout=10, logger=main_logger):
                debug_print("No se pudo cerrar el modal con el botón close", main_logger, 'warning')
            debug_print("Modal cerrado exitosamente", main_logger)
    except TimeoutException:
        # Si el modal no existe, no hacer nada
        debug_print("Modal no encontrado, continuando...", main_logger)

verificar_y_cerrar_modal()

# Buscar campo de licitación con espera inteligente
debug_print("Buscando campo de código de licitación...", main_logger)
input_element = espera_inteligente_elemento(driver, (By.ID, 'txtProcCode'), timeout=30)

# Limpiar y enviar código de licitación
input_element.clear()
time.sleep(0.5)
input_element.send_keys(id_licitacion)
debug_print(f"Código de licitación '{id_licitacion}' ingresado", main_logger)

# Hacer clic en buscar con espera inteligente
debug_print("Haciendo clic en botón buscar...", main_logger)
if not click_inteligente(driver, (By.ID, "btnSearchByCode"), timeout=30, logger=main_logger):
    debug_print("Error: No se pudo hacer click en buscar", main_logger, 'error')
    raise Exception("No se pudo buscar la licitación")

# Esperar a que se complete la búsqueda
debug_print("Esperando resultados de búsqueda...", main_logger)
time.sleep(5)
esperar_carga_pagina(driver, timeout=45, logger=main_logger)
driver.save_screenshot(ruta_guardado + 'hizobuscar.png')

# Hacer clic en "Ver Ofertas" con espera inteligente
debug_print("Buscando y haciendo clic en 'Ver Ofertas'...", main_logger)
if not click_inteligente(driver, (By.CSS_SELECTOR, "input[title='Ver Ofertas']"), timeout=45, logger=main_logger):
    debug_print("Error: No se pudo hacer click en 'Ver Ofertas'", main_logger, 'error')
    raise Exception("No se pudo acceder a las ofertas")

# Esperar transición a página de ofertas
debug_print("Esperando carga de página de ofertas...", main_logger)
time.sleep(8)
esperar_carga_pagina(driver, timeout=60, logger=main_logger)
driver.save_screenshot(ruta_guardado + 'despuesdeclick.png')
#driver.switch_to.default_content()


#driver.save_screenshot(ruta_guardado + 'menulici2.png')
#Obtenemos las cookies
cookies = driver.get_cookies()

# Actualizar código de postulación en base de datos
url_actual = driver.current_url
debug_print(f"URL actual completa: {url_actual}", main_logger)
print(f"URL actual completa: {url_actual}")

try:
    # Extraer solo lo que viene después de 'enc='
    if "enc=" in url_actual:
        codigo_postulacion_limpio = url_actual.split("enc=")[1]
        debug_print(f"Código extraído (sin enc=): {codigo_postulacion_limpio}", main_logger)
        print(f"Codigo extraido (sin enc=): {codigo_postulacion_limpio}")
        print(f"Longitud del codigo: {len(codigo_postulacion_limpio)} caracteres")
        
        # Actualizar en la base de datos SIN el prefijo enc=
        debug_print("Actualizando CodigoPostulacion en la base de datos...", main_logger)
        print("Actualizando CodigoPostulacion en la base de datos...")
        
        sql_update = """UPDATE licitaciones_diarias_total.Licitaciones_diarias 
                        SET CodigoPostulacion = %s 
                        WHERE Licitacion = %s"""
        
        valores_update = (codigo_postulacion_limpio, id_licitacion)
        mycursor.execute(sql_update, valores_update)
        mydb.commit()
        
        debug_print("CodigoPostulacion actualizado exitosamente", main_logger)
        print("CodigoPostulacion actualizado exitosamente")
        print(f"URL final: https://www.mercadopublico.cl/Portal/Modules/Desktop/Desktop.aspx?enc={codigo_postulacion_limpio}")
        
    else:
        debug_print("ADVERTENCIA: No se encontró 'enc=' en la URL", main_logger, 'warning')
        print("ADVERTENCIA: No se encontro 'enc=' en la URL")
        print(f"URL recibida: {url_actual}")
        
except Exception as e:
    debug_print(f"Error actualizando CodigoPostulacion: {e}", main_logger, 'error')
    print(f"Error actualizando CodigoPostulacion: {e}")
    print(f"URL que causo error: {url_actual}")

#Botón Nueva Oferta
time.sleep(5)
#driver.save_screenshot(ruta_guardado + 'esta.png')

#verificar si existe ya una oferta creada
debug_print("Verificando si existe oferta previa...", main_logger)
existe_oferta = driver.find_elements_by_id('rptDetail_ctl01_imgEdit')

if existe_oferta:
    debug_print("Se encontró oferta existente, verificando estado...", main_logger)
    try:
        estado_elemento = espera_inteligente_elemento(driver, (By.ID, "rptDetail_ctl01_lblrptStatus"), timeout=20)
        estado_oferta = estado_elemento.text
        debug_print(f'Estado oferta existente: {estado_oferta}', main_logger)
        print('Estado oferta: ' + estado_oferta)
        driver.save_screenshot(ruta_guardado + 'estalaoferta.png')

        if estado_oferta == 'Guardada':
            debug_print("Editando oferta guardada...", main_logger)
            if not click_inteligente(driver, (By.ID, "rptDetail_ctl01_imgEdit"), timeout=30, logger=main_logger):
                debug_print("Error: No se pudo editar la oferta guardada", main_logger, 'error')
                raise Exception("No se pudo editar oferta guardada")
            
            # Esperar transición a edición
            time.sleep(8)
            esperar_carga_pagina(driver, timeout=60, logger=main_logger)
            driver.save_screenshot(ruta_guardado + 'despuesdeclick.png')
        else:
            debug_print("Creando nueva oferta (estado no es 'Guardada')...", main_logger)
            if not click_inteligente(driver, (By.ID, "btnNewBid"), timeout=30, logger=main_logger):
                debug_print("Error: No se pudo crear nueva oferta", main_logger, 'error')
                raise Exception("No se pudo crear nueva oferta")
            
            time.sleep(8)
            esperar_carga_pagina(driver, timeout=60, logger=main_logger)
            
    except TimeoutException:
        debug_print("Error: No se pudo obtener el estado de la oferta", main_logger, 'error')
        # Intentar crear nueva oferta como fallback
        debug_print("Intentando crear nueva oferta como fallback...", main_logger)
        if not click_inteligente(driver, (By.ID, "btnNewBid"), timeout=30, logger=main_logger):
            debug_print("Error crítico: No se pudo crear oferta", main_logger, 'error')
            raise Exception("Error crítico en manejo de ofertas")
else:
    debug_print("No existe oferta previa, creando nueva...", main_logger)
    if not click_inteligente(driver, (By.ID, "btnNewBid"), timeout=30, logger=main_logger):
        debug_print("Error: No se pudo crear nueva oferta", main_logger, 'error')
        raise Exception("No se pudo crear nueva oferta")
    
    time.sleep(8)
    esperar_carga_pagina(driver, timeout=60, logger=main_logger)

print("########### FIN PRIMERA PAGINA ####################")
#print(url_postulacion)
print(rut_usuario)
print(rut_cliente)
print(id_licitacion)
print(fecha_publicacion)
print(usuario_mp)
print(clave_mp)
print(nombre_lic_sin_formatear)
print(desc_lic_sin_formatear)
print(acceso_mp)
print(oferta_conjunta)
print(rutRepresentante)
print("clave unica",claveUnica)
print("password clave unica ",passwordClaveUnica)
print("confirma",conFirma)
print(tipoRut)
print("permiso pendiente",permisoPendiente)

print("########### SEGUNDA PAGINA ####################")
debug_print("########### INICIANDO SEGUNDA PAGINA - FORMULARIO DE OFERTA ####################", main_logger)

#Segunda Pagina - Completar Nombre de Oferta
#Buscamos el título de la licitación e ingresamos el texto
debug_print("Completando nombre de oferta...", main_logger)

try:
    # Esperar el campo de nombre con espera inteligente
    campo_nombre = espera_inteligente_elemento(driver, (By.ID, "ctl00_mpcphFormWizardFields_txtBIDName"), timeout=45)
    
    # Limpiar y llenar campo de nombre
    campo_nombre.send_keys(Keys.CONTROL, 'a')
    time.sleep(0.5)
    campo_nombre.send_keys(Keys.DELETE)
    time.sleep(0.5)
    campo_nombre.send_keys(nombre_lic)
    debug_print(f"Nombre de oferta completado: {nombre_lic[:50]}...", main_logger)
    
except TimeoutException:
    debug_print("Error: No se pudo encontrar el campo de nombre de oferta", main_logger, 'error')
    actualizar_estado_con_log("Error: No se pudo encontrar el campo de nombre de oferta", id_licitacion, main_logger)
    raise Exception("Campo nombre de oferta no encontrado")

#Buscamos el textarea de la licitación e ingresamos el texto
debug_print("Completando descripción de oferta...", main_logger)

# Intentar múltiples estrategias para encontrar el textarea de descripción
textarea_encontrado = False
selectors_textarea = [
    "wysiwygctl00_mpcphFormWizardFields_EditZone",
    "ctl00_mpcphFormWizardFields_EditZone", 
    "ctl00_mpcphFormWizardFields_txtDescription",
    "ctl00_mpcphFormWizardFields_txtBIDDescription"
]

for selector in selectors_textarea:
    try:
        debug_print(f"Probando selector textarea: {selector}", main_logger)
        element = espera_inteligente_elemento(driver, (By.ID, selector), timeout=20)
        element.send_keys(Keys.CONTROL, 'a')
        time.sleep(0.5)
        element.send_keys(Keys.DELETE)
        time.sleep(0.5)
        textarea_encontrado = True
        debug_print(f"Textarea encontrado con selector: {selector}", main_logger)
        break
    except TimeoutException:
        debug_print(f"No se encontró textarea con selector: {selector}", main_logger, 'warning')
        continue

if not textarea_encontrado:
    debug_print("ADVERTENCIA: No se pudo encontrar el textarea de descripción", main_logger, 'warning')
    actualizar_estado_con_log("Error: No se pudo encontrar el campo de descripción", id_licitacion, main_logger)
else:
    try:
        element.send_keys(desc_lic)
        debug_print(f"Descripción enviada exitosamente: {desc_lic[:50]}...", main_logger)
    except Exception as e:
        debug_print(f"Error enviando descripción: {e}", main_logger, 'error')

# Verificar y manejar opción de proveedores si existe
debug_print("Verificando opciones de proveedores...", main_logger)
try:
    existeOpcionProveedores = driver.find_elements_by_id("ctl00_mpcphFormWizardFields_Tr1")
    
    if existeOpcionProveedores:
        debug_print("Se encontró opción de proveedores, configurando...", main_logger)
        if oferta_conjunta == 'si':
            debug_print("Activando oferta conjunta...", main_logger)
            if not click_inteligente(driver, (By.ID, "ctl00_mpcphFormWizardFields_rbactivaUtp"), timeout=20, logger=main_logger):
                debug_print("Error activando oferta conjunta", main_logger, 'warning')
        elif oferta_conjunta == 'no':
            debug_print("Desactivando oferta conjunta...", main_logger)
            if not click_inteligente(driver, (By.ID, "ctl00_mpcphFormWizardFields_rbdesactivaUtp"), timeout=20, logger=main_logger):
                debug_print("Error desactivando oferta conjunta", main_logger, 'warning')
    else:
        debug_print("No se encontró opción de proveedores", main_logger)
        
except Exception as e:
    debug_print(f"Error manejando opciones de proveedores: {e}", main_logger, 'warning')

actualizar_estado_con_log("Descripción de la oferta completada. Procediendo a la carga de productos...", id_licitacion, main_logger)

#Buscamos el botón siguiente y hacemos clic
debug_print("Buscando botón 'Siguiente'...", main_logger)
try:
    boton_next = espera_inteligente_elemento(driver, (By.ID, "ctl00_btnNext"), timeout=30)
    
    # Hacer scroll al botón y hacer clic con JavaScript para mayor confiabilidad
    driver.execute_script("arguments[0].scrollIntoView(true);", boton_next)
    time.sleep(1)
    driver.execute_script("arguments[0].click();", boton_next)
    
    debug_print("Click en botón 'Siguiente' realizado exitosamente", main_logger)
    driver.save_screenshot(ruta_guardado + 'deberiahacerclick.png')
    
    # Esperar transición a siguiente página
    time.sleep(5)
    esperar_carga_pagina(driver, timeout=60, logger=main_logger)
    
except TimeoutException:
    debug_print("Error: No se pudo encontrar el botón 'Siguiente'", main_logger, 'error')
    raise Exception("Botón 'Siguiente' no encontrado")

print("########### FIN SEGUNDA PAGINA ####################")

print("########### TERCERA PAGINA ####################")
debug_print("########### INICIANDO TERCERA PAGINA - OFERTA ECONÓMICA ####################", main_logger)

#Tercera Pagina - Completar Oferta Económica
driver.save_screenshot(ruta_guardado + 'antesdeclick.png')

# Esperar estabilización de la página
time.sleep(5)
esperar_carga_pagina(driver, timeout=60, logger=main_logger)

debug_print("Activando checkbox 'No Bids'...", main_logger)
try:
    if not click_inteligente(driver, (By.ID, "ctl00_mpcphFormWizardFields_chkNoBids"), timeout=30, logger=main_logger):
        debug_print("Error: No se pudo hacer click en checkbox 'No Bids'", main_logger, 'error')
        raise Exception("Checkbox 'No Bids' no clickeable")
    
    # Esperar más tiempo después del click en el checkbox ya que puede triggerar cambios en la página
    debug_print("Esperando cambios en página después de activar checkbox...", main_logger)
    time.sleep(10)
    esperar_carga_pagina(driver, timeout=45, logger=main_logger)
    
    # Verificar que las funciones JavaScript estén disponibles antes de continuar
    debug_print("Verificando disponibilidad de funciones JavaScript...", main_logger)
    verificar_funciones_javascript(driver, main_logger)
    
    # Espera adicional para asegurar que todos los scripts se carguen
    time.sleep(5)
    
except TimeoutException:
    debug_print("Error: No se pudo encontrar checkbox 'No Bids'", main_logger, 'error')
    raise Exception("Checkbox 'No Bids' no encontrado")

driver.save_screenshot(ruta_guardado + 'dondeestoy.png')

def limpiar_descripcion(descripcion):
    # Remover saltos de línea y tabs, así como otros caracteres innecesarios
    descripcion_limpia = descripcion.replace("\n", " ").replace("\t", " ").strip()
    # Eliminar espacios múltiples
    descripcion_limpia = " ".join(descripcion_limpia.split())
    return descripcion_limpia

# Espera adicional antes de comenzar carga de productos
debug_print("Preparándose para carga de productos, verificando estado de página...", main_logger)
time.sleep(5)

# Verificar una vez más que las funciones JavaScript estén disponibles
if not esperar_funcion_javascript(driver, 'fnMovePage', timeout=30, logger=main_logger):
    debug_print("ADVERTENCIA: fnMovePage no disponible, intentando reload de página", main_logger, 'warning')
    driver.refresh()
    time.sleep(10)
    esperar_carga_pagina(driver, timeout=60, logger=main_logger)
    
    # Re-activar checkbox después del refresh si es necesario
    try:
        checkbox = driver.find_element(By.ID, "ctl00_mpcphFormWizardFields_chkNoBids")
        if not checkbox.is_selected():
            debug_print("Re-activando checkbox después del refresh...", main_logger)
            click_inteligente(driver, (By.ID, "ctl00_mpcphFormWizardFields_chkNoBids"), timeout=20, logger=main_logger)
            time.sleep(5)
    except:
        debug_print("No se pudo verificar/reactivar checkbox después del refresh", main_logger, 'warning')

#Recorremos las paginas
debug_print("Iniciando carga de productos por páginas...", main_logger)

for b in range(paginas):
  debug_print(f"Procesando página {b+1} de {paginas}", main_logger)
  print(b)
  #Declaramos los parámetros de inicio y término de página
  CANTIDAD_ITEM_PAGINA_INICIO = 10 * b
  CANTIDAD_ITEM_PAGINA_FIN = 10 * (b +1)
  #restar = 10 * b
  #Iniciamos consulta para encontrar los items en las páginas
  debug_print(f"Consultando items para página {b+1}", main_logger)
  mycursorselect.execute("SELECT * FROM precio_interno.item_producto where `Licitacion` = '" + id_licitacion + "' and `strRutUsuario` = '" + rut_usuario + "' order by Item asc ")
  mydb.commit()
  
  for r in mycursorselect:
    debug_print(f"Procesando item: {r[1]} - {r[2]}", main_logger)
    print("dentro de cursor")
    print(r[1])
    print(r[2])
    correlativo = r[6]
    print(correlativo)
    consulta = mydb.cursor(buffered=True)
    mycursor = mydb.cursor()
    #Consulta que trae la glosa
    consulta.execute("SELECT * FROM precio_interno.item_glosa where `Licitacion` = '" + id_licitacion + "' and `strRutUsuario` = '" + rut_usuario + "' and Item = " + str(correlativo) +" limit 1 ")
    mydb.commit()
    print("Correlativo: {}".format(correlativo))
    print("cantidad_item_pagina_fin: {}".format(CANTIDAD_ITEM_PAGINA_FIN))
    print("cantidad_item_pagina_inicio: {}".format(CANTIDAD_ITEM_PAGINA_INICIO))
    #Condición para agfregar el item y el precio a una página
    if correlativo <= CANTIDAD_ITEM_PAGINA_FIN and correlativo > CANTIDAD_ITEM_PAGINA_INICIO:
      print("dentro del if")
      #restar = restar - 1
      #print(restar)
      correlativo = correlativo - (CANTIDAD_ITEM_PAGINA_INICIO + 1)
      indiceFormateado = "{:02d}".format(correlativo)
      str_descripcion = ""
      str_descripcion = r[3]
      str_descripcion = limpiar_descripcion(str_descripcion)

      for w in consulta:
        str_descripcion = str_descripcion +"-" + w[2]
        #str_descripcion = str_descripcion.encode('utf-8') + w[2].encode('utf-8')
      
      # Usar la nueva función de cambio de página con verificación
      debug_print(f"Cambiando a página {b+1} con verificación completa...", main_logger)
      if not cambiar_pagina_con_verificacion(driver, b+1, logger=main_logger, max_intentos=5):
          debug_print(f"Error: No se pudo cambiar a página {b+1} después de todos los intentos", main_logger, 'error')
          
          # Tomar screenshot para análisis
          tomar_screenshot_debug(driver, ruta_guardado, f'error_cambio_pagina_{b+1}.png', main_logger)
          
          # Intentar método de emergencia: buscar elementos sin cambiar página
          debug_print("Intentando método de emergencia: buscar elementos directamente...", main_logger)
          elementos = encontrar_elementos_pagina_productos(driver, indiceFormateado, main_logger, timeout=60)
          
          if not elementos:
              debug_print(f"Método de emergencia falló, saltando item {correlativo}", main_logger, 'error')
              continue  # Saltar este item si no se puede cambiar página
          else:
              debug_print("Método de emergencia exitoso, continuando con elementos encontrados", main_logger)
      else:
          # Cambio exitoso, buscar elementos normalmente
          debug_print("Cambio de página exitoso, buscando elementos...", main_logger)
          elementos = encontrar_elementos_pagina_productos(driver, indiceFormateado, main_logger, timeout=45)
      
      debug_print(f"Página: {b+1}, Correlativo: {correlativo}, Indice: {indiceFormateado}", main_logger)
      
      # Procesar elementos encontrados
      if not elementos:
          debug_print(f"No se encontraron elementos para item {correlativo}, saltando...", main_logger, 'warning')
          continue
      
      try:
          # Procesar checkbox si se encontró
          if 'checkbox' in elementos:
              checkbox_element, checkbox_selector = elementos['checkbox']
              debug_print(f"Procesando checkbox: {checkbox_selector}", main_logger)
              
              # Scroll al elemento y hacer click
              driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", checkbox_element)
              time.sleep(1)
              
              try:
                  checkbox_element.click()
                  debug_print("Click en checkbox exitoso", main_logger)
              except Exception as e:
                  debug_print(f"Click normal falló, usando JavaScript: {e}", main_logger, 'warning')
                  driver.execute_script("arguments[0].click();", checkbox_element)
                  debug_print("Click con JavaScript exitoso", main_logger)
          else:
              debug_print(f"Checkbox no encontrado para item {correlativo}", main_logger, 'error')
              continue
          
          # Procesar textarea si se encontró
          if 'textarea' in elementos:
              textarea_element, textarea_selector = elementos['textarea']
              debug_print(f"Completando descripción en: {textarea_selector}", main_logger)
              
              try:
                  driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", textarea_element)
                  time.sleep(0.5)
                  textarea_element.clear()
                  time.sleep(0.5)
                  textarea_element.send_keys(str_descripcion)
                  debug_print(f"Descripción completada exitosamente", main_logger)
              except Exception as e:
                  debug_print(f"Error completando descripción: {e}", main_logger, 'error')
                  continue
          else:
              debug_print(f"Textarea no encontrado para item {correlativo}", main_logger, 'error')
              continue
          
          # Procesar campo precio si se encontró
          if 'precio' in elementos:
              precio_element, precio_selector = elementos['precio']
              debug_print(f"Completando precio en: {precio_selector}", main_logger)
              
              try:
                  driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", precio_element)
                  time.sleep(0.5)
                  precio_element.clear()
                  time.sleep(0.5)
                  precio_element.send_keys(str(r[2]))
                  
                  # Forzar la validación simulando la tecla 'Tab' y esperar procesamiento
                  precio_element.send_keys(Keys.TAB)
                  time.sleep(2)  # Dar tiempo para validación
                  
                  debug_print(f"Precio {r[2]} completado exitosamente", main_logger)
                  
              except Exception as e:
                  debug_print(f"Error completando precio: {e}", main_logger, 'error')
                  continue
          else:
              debug_print(f"Campo precio no encontrado para item {correlativo}", main_logger, 'error')
              continue
          
          # Si llegamos hasta aquí, el item se procesó exitosamente
          debug_print(f"Item {correlativo} procesado exitosamente", main_logger)
          
      except Exception as e:
          debug_print(f"Error procesando item {correlativo}: {e}", main_logger, 'error')
          tomar_screenshot_debug(driver, ruta_guardado, f'error_item_{correlativo}.png', main_logger)
          continue
      except Exception as e:
          debug_print(f"Error procesando item {correlativo}: {e}", main_logger, 'error')
          continue

# Esperar que se complete toda la carga de productos
debug_print("Finalizando carga de productos, esperando estabilización...", main_logger)
time.sleep(8)
esperar_carga_pagina(driver, timeout=60, logger=main_logger)
driver.save_screenshot(ruta_guardado + 'cargoono1.png')
actualizar_estado_con_log("Carga de productos completada. Procediendo a la firma de la declaración jurada...", id_licitacion, main_logger)

# Buscar y hacer click en botón siguiente con esperas inteligentes
debug_print("Buscando botón 'Siguiente' para continuar...", main_logger)

# Múltiples estrategias para encontrar el botón siguiente
selectores_boton_siguiente = [
    "td.cssFwkWizTDNavigationBtn",
    "//td[contains(@class, 'cssFwkWizTDNavigationBtn')]",
    "//input[@id='ctl00_btnNext']",
    "//input[@value='Siguiente' or @value='Next']",
    "//button[contains(text(), 'Siguiente')]",
    "//a[contains(text(), 'Siguiente')]",
    "#ctl00_btnNext",
    "input[id*='btnNext']"
]

boton_encontrado = False
for i, selector in enumerate(selectores_boton_siguiente):
    try:
        debug_print(f"Intentando selector {i+1}: {selector}", main_logger)
        
        if selector.startswith("//"):
            # XPath selector
            elemento = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, selector))
            )
            by_type = By.XPATH
        elif selector.startswith("#"):
            # CSS ID selector
            elemento = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            by_type = By.CSS_SELECTOR
        else:
            # CSS selector
            elemento = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            by_type = By.CSS_SELECTOR
        
        debug_print(f"✓ Elemento encontrado con selector: {selector}", main_logger)
        
        # Verificar si es el contenedor o el botón directamente
        if selector == "td.cssFwkWizTDNavigationBtn" or "td" in selector:
            # Es el contenedor, buscar el botón dentro
            try:
                boton_next = elemento.find_element(By.ID, "ctl00_btnNext")
                debug_print("Botón 'Siguiente' encontrado dentro del contenedor", main_logger)
            except:
                # Buscar cualquier input/button dentro del contenedor
                botones = elemento.find_elements(By.TAG_NAME, "input") + elemento.find_elements(By.TAG_NAME, "button")
                for boton in botones:
                    if "next" in boton.get_attribute("id").lower() or "siguiente" in boton.get_attribute("value").lower():
                        boton_next = boton
                        break
                else:
                    debug_print("No se encontró botón válido en el contenedor", main_logger, 'warning')
                    continue
        else:
            # Es el botón directamente
            boton_next = elemento
        
        # Desplazarse hacia el botón y verificar estado
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", boton_next)
        time.sleep(2)
        
        # Verificar si es clickeable y hacer clic con múltiples métodos
        if boton_next.is_enabled() and boton_next.is_displayed():
            debug_print("Intentando click en botón 'Siguiente'...", main_logger)
            
            click_exitoso = False
            metodos_click = [
                lambda: boton_next.click(),
                lambda: driver.execute_script("arguments[0].click();", boton_next),
                lambda: ActionChains(driver).move_to_element(boton_next).click().perform()
            ]
            
            for j, metodo in enumerate(metodos_click):
                try:
                    metodo()
                    debug_print(f"Click exitoso con método {j+1}", main_logger)
                    click_exitoso = True
                    break
                except Exception as e:
                    debug_print(f"Método {j+1} falló: {e}", main_logger, 'debug')
                    continue
            
            if click_exitoso:
                # Esperar transición a siguiente página
                debug_print("Esperando transición a página siguiente...", main_logger)
                time.sleep(8)
                esperar_carga_pagina(driver, timeout=60, logger=main_logger)
                debug_print("Transición a página siguiente completada", main_logger)
                boton_encontrado = True
                break
            else:
                debug_print("No se pudo hacer click con ningún método", main_logger, 'warning')
        else:
            debug_print("El botón no es clickeable o no está visible", main_logger, 'warning')
            
    except TimeoutException:
        debug_print(f"Selector {i+1} no encontró elemento", main_logger, 'debug')
        continue
    except Exception as e:
        debug_print(f"Error con selector {i+1}: {e}", main_logger, 'warning')
        continue

if not boton_encontrado:
    debug_print("ERROR CRÍTICO: No se pudo encontrar botón 'Siguiente' con ningún método", main_logger, 'error')
    
    # Tomar screenshot final para análisis
    tomar_screenshot_debug(driver, ruta_guardado, 'error_boton_siguiente_final.png', main_logger)
    
    # Intentar método de emergencia: buscar cualquier botón/enlace que pueda ser el siguiente
    debug_print("Intentando método de emergencia para continuar...", main_logger)
    try:
        # Buscar elementos que puedan ser botones de navegación
        elementos_navegacion = driver.find_elements(By.XPATH, "//input[@type='submit' or @type='button'] | //button | //a[contains(@href, 'javascript')]")
        
        for elemento in elementos_navegacion:
            texto = elemento.get_attribute("value") or elemento.text or elemento.get_attribute("title")
            if texto and ("next" in texto.lower() or "siguiente" in texto.lower() or "continuar" in texto.lower()):
                debug_print(f"Elemento de emergencia encontrado: {texto}", main_logger)
                try:
                    driver.execute_script("arguments[0].click();", elemento)
                    time.sleep(5)
                    debug_print("Método de emergencia exitoso", main_logger)
                    boton_encontrado = True
                    break
                except Exception as e:
                    debug_print(f"Método de emergencia falló: {e}", main_logger, 'warning')
                    continue
    except Exception as e:
        debug_print(f"Método de emergencia completamente falló: {e}", main_logger, 'error')
    
    if not boton_encontrado:
        raise Exception("No se pudo encontrar ni hacer click en botón 'Siguiente' después de todos los métodos")

driver.save_screenshot(ruta_guardado + 'cargoono2.png')

print("########### FIN TERCERA PAGINA ####################")
time.sleep(10)


print("########### CUARTA PAGINA ####################")
#Cuarta Página - Documentación Anexa
driver.save_screenshot(ruta_guardado + 'Documentacion.png')

#Buscamos botón Siguiente y hacemos clic
#wait.until(EC.presence_of_element_located((By.ID, "ctl00_btnNext"))).click()
print("########### FIN CUARTA PAGINA ####################")

##CARGA DE DOCUMENTOS
wait.until(EC.presence_of_element_located((By.ID, "ctl00_trvWizardt3"))).click()
#driver.find_element_by_id('ctl00_trvWizardt3').click()
#time.sleep(2)
wait.until(EC.presence_of_element_located((By.ID, 'ctl00_mpcphFormWizardFields__IFrameAttachment')))
driver.switch_to.frame("ctl00_mpcphFormWizardFields__IFrameAttachment")

#Verificar estado de firma
existe_firma = driver.find_elements_by_id('dj_estado')

if existe_firma:
  estado_firma = wait.until(EC.presence_of_element_located((By.ID, 'dj_estado'))).text

  if estado_firma == 'PENDIENTE':
    print("la encuentra en estado pendiente")
    driver.save_screenshot('pantalladondeaparecelink.png')
    if permisoPendiente == '1':
      sql = "INSERT IGNORE INTO postulaciones.licitacion_pendiente (licitacion, rut_cliente, postulante) VALUES (%s, %s, %s)"
      valores = (id_licitacion, rut_usuario, rut_cliente)
      mycursor.execute(sql, valores)                                  
      mydb.commit()
      driver.quit()
      quit()
      
  
    else: 
      ##Firmar documentacion anexa
      time.sleep(4)

      driver.save_screenshot(ruta_guardado+'captura_antes_de_clic.png')
      wait.until(
          EC.element_to_be_clickable(
              (By.XPATH, "//a[contains(., 'Declarar y firmar')]")
          )
      ).click()

      wait.until(EC.number_of_windows_to_be(2))

      print(len(driver.window_handles))

      driver.switch_to.window(driver.window_handles[-1])

      #driver.switch_to.window(driver.window_handles[1])

      time.sleep(3)
      driver.maximize_window()
      driver.save_screenshot(ruta_guardado + 'firma.png')

      """
      webdriver.ActionChains(driver).send_keys(
                      Keys.TAB).perform()
      webdriver.ActionChains(driver).send_keys(
                      Keys.TAB).perform()
      webdriver.ActionChains(driver).send_keys(
                      Keys.ENTER).perform()
      """

      existeDiv = driver.find_elements_by_class_name('MuiAlert-message')
      

      if existeDiv:
        print('existe')
        wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div[2]/div/div/div/div[2]/div/div/div/div/div/div[1]/div/div[1]/div/div"))).click()
      else:
        print('no existe')
        wait.until(EC.element_to_be_clickable((By.XPATH, "/html/body/div[2]/div/div/div/div[1]/div/div/div/div/div/div[1]/div/div[1]/div/div"))).click()
                                                                                                     
      time.sleep(5)
      #select_element = driver.find_element_by_xpath("//div[contains(@class, 'MuiInputBase-input')][text()='Seleccione...']")
      #select_element.click()
     
      if tipoRut == "representante":
            print(f"Buscando RUT representante: {rutRepresentante}")
            
            # Intentar múltiples veces para ser más robusto
            rut_encontrado = False
            max_intentos = 3
            
            for intento in range(max_intentos):
                try:
                    print(f"Intento {intento + 1} de {max_intentos} para encontrar RUT")
                    
                    # Primero verificar si ya está seleccionado
                    try:
                        elemento_seleccionado = driver.find_element(By.XPATH, f"//div[contains(text(),'{rutRepresentante}') and contains(@class, 'selected')]")
                        if elemento_seleccionado:
                            print("RUT ya está seleccionado")
                            rut_encontrado = True
                            break
                    except:
                        pass
                    
                    # Buscar el RUT con diferentes estrategias
                    selectores_rut = [
                        f"//div[contains(text(),'{rutRepresentante}')]",
                        f"//li[contains(text(),'{rutRepresentante}')]",
                        f"//*[@data-value='{rutRepresentante}']",
                        f"//*[contains(@title,'{rutRepresentante}')]"
                    ]
                    
                    for selector in selectores_rut:
                        try:
                            print(f"Probando selector: {selector}")
                            elemento_rut = WebDriverWait(driver, 10).until(
                                EC.element_to_be_clickable((By.XPATH, selector))
                            )
                            
                            # Hacer scroll al elemento
                            driver.execute_script("arguments[0].scrollIntoView(true);", elemento_rut)
                            time.sleep(1)
                            
                            # Intentar click
                            elemento_rut.click()
                            print(f"RUT seleccionado exitosamente con selector: {selector}")
                            rut_encontrado = True
                            break
                            
                        except TimeoutException:
                            print(f"No se encontró RUT con selector: {selector}")
                            continue
                        except Exception as e:
                            print(f"Error con selector {selector}: {e}")
                            continue
                    
                    if rut_encontrado:
                        break
                        
                    # Si no encontró el RUT, intentar abrir el dropdown primero
                    if not rut_encontrado and intento < max_intentos - 1:
                        print("Intentando abrir dropdown...")
                        dropdown_selectors = [
                            "//div[contains(@class, 'MuiSelect-select')]",
                            "//div[contains(@class, 'MuiInputBase-input')]",
                            "//div[text()='Seleccione...']"
                        ]
                        
                        for dropdown_sel in dropdown_selectors:
                            try:
                                dropdown = driver.find_element(By.XPATH, dropdown_sel)
                                dropdown.click()
                                time.sleep(2)
                                print("Dropdown abierto, reintentando...")
                                break
                            except:
                                continue
                                
                except Exception as e:
                    print(f"Error en intento {intento + 1}: {e}")
                    if intento < max_intentos - 1:
                        time.sleep(2)
                        
            if not rut_encontrado:
                print(f"ERROR: No se pudo seleccionar el RUT {rutRepresentante} después de {max_intentos} intentos")
                # Tomar screenshot para debug
                driver.save_screenshot(ruta_guardado + 'error_seleccion_rut.png')

      elif tipoRut == "otro":
        print("Seleccionando 'Otro RUT'...")
        
        try:
            # Buscar y hacer click en "Otro RUT"
            otro_rut_selectors = [
                "//div[contains(text(),'Otro RUT')]",
                "//li[contains(text(),'Otro RUT')]",
                "//*[contains(text(),'Otro') and contains(text(),'RUT')]"
            ]
            
            otro_rut_clickeado = False
            for selector in otro_rut_selectors:
                try:
                    otro_rut_element = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                    otro_rut_element.click()
                    print("'Otro RUT' seleccionado exitosamente")
                    otro_rut_clickeado = True
                    break
                except:
                    continue
            
            if otro_rut_clickeado:
                time.sleep(2)
                
                # Buscar el campo de input para ingresar el RUT
                input_selectors = [
                    "//input[contains(@class,'MuiInputBase-inputAdornedEnd')]",
                    "//input[@type='text']",
                    "//input[contains(@class, 'MuiInputBase-input')]"
                ]
                
                for input_selector in input_selectors:
                    try:
                        input_rut = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, input_selector))
                        )
                        input_rut.clear()
                        input_rut.send_keys(rutRepresentante)
                        input_rut.send_keys(Keys.ENTER)
                        print(f"RUT '{rutRepresentante}' ingresado exitosamente")
                        break
                    except:
                        continue
            else:
                print("ERROR: No se pudo hacer click en 'Otro RUT'")
                driver.save_screenshot(ruta_guardado + 'error_otro_rut.png')
                
        except Exception as e:
            print(f"Error en selección 'Otro RUT': {e}")
            driver.save_screenshot(ruta_guardado + 'error_otro_rut_general.png')

      else:
        print(f"Tipo de RUT no reconocido: {tipoRut}")

      # Esperar un poco después de la selección
    

      time.sleep(5)
      def check_all_buttons_clicked():
        botones = driver.find_elements_by_xpath("//input[contains(@class, 'fKMtys')]")
        print("Cantidad de botones encontrados: {}".format(len(botones)))
        
        checked_buttons = 0
        for boton in botones:
            parent_span = boton.find_element_by_xpath("..")
            if "Mui-checked" in parent_span.get_attribute("class"):
                checked_buttons += 1

        return len(botones), checked_buttons

      try:
        total_buttons, checked_buttons = check_all_buttons_clicked()
        
        while checked_buttons < total_buttons:
            botones = driver.find_elements_by_xpath("//input[contains(@class, 'fKMtys')]")
            botones_activos = 0
            
            for x in range(len(botones)):
                parent_span = botones[x].find_element_by_xpath("..")
                
                # Verificar si el botón está desactivado
                if "disabled" in parent_span.get_attribute("class"):
                    continue
                    
                botones_activos += 1
                
                if "Mui-checked" in parent_span.get_attribute("class"):
                    print("Botón {} ya está clickeado".format(x))
                    continue
                
                # Aquí comienzan los intentos de click
                try:
                    print("Intento 1: Haciendo clic en el botón {} usando JavaScript".format(x))
                    driver.execute_script("arguments[0].scrollIntoView(true);", botones[x])
                    driver.execute_script("arguments[0].click();", botones[x])
                except Exception as click_exception_js:
                    print("Error al hacer clic usando JavaScript en el botón {}: {}".format(x, click_exception_js))
                    driver.save_screenshot(ruta_guardado + 'error_click_js_boton_{}.png'.format(x))
                    
                    try:
                        print("Intento 2: Haciendo clic en el botón {} usando ActionChains".format(x))
                        actions = webdriver.common.action_chains.ActionChains(driver)
                        actions.move_to_element_with_offset(botones[x], 5, 5).click().perform()
                    except Exception as click_exception_action_chains:
                        print("Error al hacer clic usando ActionChains en el botón {}: {}".format(x, click_exception_action_chains))
                        driver.save_screenshot(ruta_guardado + 'error_click_action_chains_boton_{}.png'.format(x))
                        
                        try:
                            print("Intento 3: Haciendo clic en el botón {} usando el método estándar de Selenium".format(x))
                            botones[x].click()
                        except Exception as click_exception_standard:
                            print("Error al hacer clic usando el método estándar en el botón {}: {}".format(x, click_exception_standard))
                            driver.save_screenshot(ruta_guardado + 'error_click_standard_boton_{}.png'.format(x))
            
            total_buttons, checked_buttons = check_all_buttons_clicked()
            print("Total de botones: {}, Botones clickeados: {}".format(total_buttons, checked_buttons))
            
            # Si los botones clickeados son iguales a los botones activos, salimos
            if checked_buttons >= botones_activos:
                print("Se han clickeado todos los botones activos disponibles")
                break

        driver.save_screenshot(ruta_guardado + 'estatus_botones.png')
        
      except Exception as e:
        print("Error al encontrar botones: {}".format(e))
        driver.save_screenshot(ruta_guardado + 'error_encontrar_botones.png')
            

      if conFirma == "si":

          webdriver.ActionChains(driver).send_keys(Keys.TAB).perform()
          time.sleep(1)
          webdriver.ActionChains(driver).send_keys(Keys.ENTER).perform()
          time.sleep(1)
          webdriver.ActionChains(driver).send_keys(Keys.TAB).perform()
          time.sleep(1)
          webdriver.ActionChains(driver).send_keys(Keys.ENTER).perform()
          driver.save_screenshot(ruta_guardado + 'confirmacion_si.png')
          driver.switch_to.window(driver.window_handles[2])

          linkClaveUnica = driver.current_url

          # inicio captcha
          try:
              # Obtengo el identificador unico del catpcha
              # 6LdVi_IUAAAAANEFLcRMawPo4GKPtfjpqXVyrCZT
              captcha_key = driver.find_element_by_id(
                  "login-submit"
              ).get_attribute("data-sitekey")
              # captcha_key = '6LdVi_IUAAAAANEFLcRMawPo4GKPtfjpqXVyrCZT'

              # Armo el requerimiento a 2captcha
              url = "https://2captcha.com/in.php?"
              url += (
                  "key=" + "c20b6961fe8322e01428ead42a9ff4ff"
              )  # API KEY 2CAPTCHA
              url += "&method=userrecaptcha"
              url += "&googlekey=" + captcha_key
              url += "&pageurl=" + linkClaveUnica
              url += "&json=0"
              url += "&invisible=1"

              print(url)  # Visualizo URL

              # Hago un requerimiento GET con requests a la URL del API de 2captcha
              respuesta_requerimiento = requests.get(url)
              # Ellos encolan el captcha para ser resuelto y nos dan un ID para consultar el estado del catpcha
              captcha_service_key = respuesta_requerimiento.text

              print(captcha_service_key)
              # Parseo la respuesta para obtener el ID que nuestro captcha tiene en el sistema de 2CAPTCHA
              captcha_service_key = captcha_service_key.split("|")[-1]

              # Armo el requerimiento para consultar si el captcha ya se encuentra resuelto
              url_resp = "https://2captcha.com/res.php?"
              url_resp += (
                  "key=" + "c20b6961fe8322e01428ead42a9ff4ff"
              )  # API KEY
              url_resp += "&action=get"
              url_resp += (
                  "&id=" + captcha_service_key
              )  # ID del captcha en el sistema de 2CAPTCHA obtenido previamente
              url_resp += "&json=0"

              print(url_resp)

              # Espero 20 segundos tal y como me lo indican sus instrucciones
              time.sleep(20)

              # Entro en un lazo para consultar el estado del captcha hasta que este resuelto
              while True:
                  respuesta_solver = requests.get(url_resp)
                  respuesta_solver = respuesta_solver.text
                  print(respuesta_solver)
                  # Si el captcha no esta listo, espero 5 segundos, itero nuevamente en el lazo y vuelvo a preguntar
                  if respuesta_solver == "CAPCHA_NOT_READY":
                      time.sleep(5)
                  # Caso contrario el captcha esta resuelto y puedo romper el lazo
                  else:
                      break

              # Obtengo la solucion del captcha que me devolvio el API de 2CAPTCHA
              respuesta_solver = respuesta_solver.split("|")[-1]
              print()
              # Utilizo el script que tienen en su documentacion para insertar la solucion dentro de la pagina web
              insertar_solucion = (
                  'document.getElementById("g-recaptcha-response").innerHTML="'
                  + respuesta_solver
                  + '";'
              )
              print(insertar_solucion)

              # Ejecuto el script con selenium
              driver.execute_script(insertar_solucion)
              # onSubmit

              # Doy click en el boton de submit y deberia avanzar
              wait.until(
                  EC.presence_of_element_located((By.ID, "uname"))
              ).send_keys(claveUnica)
              wait.until(
                  EC.presence_of_element_located((By.ID, "pword"))
              ).send_keys(passwordClaveUnica)
              driver.execute_script("onSubmit()")
              time.sleep(5)
              print("Licitacion Firmada...")
              driver.switch_to.window(driver.window_handles[1])
              driver.close()
              driver.switch_to.window(driver.window_handles[0])
              wait.until(
                  EC.presence_of_element_located(
                      (By.ID, "ctl00_mpcphFormWizardFields__IFrameAttachment")
                  )
              )
              driver.switch_to.frame(
                  "ctl00_mpcphFormWizardFields__IFrameAttachment"
              )
          except Exception as e:
              print(e)

      elif conFirma == "no":
        time.sleep(6)
        driver.save_screenshot(ruta_guardado + 'confirmacion_no.png')
        # Define XPath base para botón de firma
        botonFirmar_xpath = "//button[contains(@class, 'sc-dmsloy') and contains(@class, 'EaXFo') and contains(text(), 'Firmar sin Clave Única')]"
        try:
            # Primer botón - Firma inicial
            botonFirmar = wait.until(EC.element_to_be_clickable((By.XPATH, botonFirmar_xpath)))
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            driver.execute_script("arguments[0].scrollIntoView();", botonFirmar)
            
            # Scroll para asegurar visibilidad
            actions = ActionChains(driver)
            for _ in range(10):
                actions.send_keys(Keys.PAGE_DOWN).perform()
                time.sleep(0.5)
            
            botonFirmar.click()
            
           
            time.sleep(5)
            driver.save_screenshot(ruta_guardado + 'click_primer_boton.png')
            
            
            # Segundo botón - Confirmación en popup con el xpath actualizado
            confirmar_xpath = "//button[contains(@class, 'sc-dmsloy') and contains(@class, 'EaXFo') and contains(@class, 'hOvxpq') and contains(text(), 'Firmar sin Clave Única')]"
            
            print("Esperando botón de confirmación...")
            boton_confirmar = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, confirmar_xpath))
            )
            
            # Asegurarnos que el botón es visible y clickeable
            driver.execute_script("arguments[0].scrollIntoView(true);", boton_confirmar)
            time.sleep(5)
            
            print("Intentando click en botón confirmar...")
            
            
            # Intentar los tres métodos de click en secuencia
            try:
                # 1. Intento con JavaScript
                print("Intento 1: Click con JavaScript")
                driver.execute_script("arguments[0].click();", boton_confirmar)
            except Exception as e1:
                print(f"Error en click JavaScript: {e1}")
                try:
                    # 2. Intento con Action Chains
                    print("Intento 2: Click con Action Chains")
                    actions = ActionChains(driver)
                    actions.move_to_element(boton_confirmar)
                    actions.click()
                    actions.perform()
                except Exception as e2:
                    print(f"Error en click Action Chains: {e2}")
                    try:
                        # 3. Intento click directo
                        print("Intento 3: Click directo")
                        boton_confirmar.click()
                    except Exception as e3:
                        print(f"Error en click directo: {e3}")
                        driver.save_screenshot(ruta_guardado + 'error_todos_clicks.png')
                        raise Exception("No se pudo hacer click en el botón confirmar con ningún método")
            
            print("Click en botón confirmar realizado")
            driver.save_screenshot(ruta_guardado + 'click_segundo_boton.png')

            # Tercer botón - Cerrar
            time.sleep(10)  # Aumentamos el tiempo de espera inicial
            print("Buscando botón Cerrar...")
            
            cerrar_xpath = "//button[contains(@class, 'EaXFo') and contains(text(), 'Cerrar y volver a la oferta')]"
            
            # Esperamos que el botón esté presente primero
            boton_cerrar = wait.until(EC.presence_of_element_located((By.XPATH, cerrar_xpath)))
            print("Botón Cerrar encontrado")
            
            # Tomamos screenshot antes del click
            driver.save_screenshot(ruta_guardado + 'antes_cerrar.png')
            
            # Intentamos diferentes métodos de click
            try:
                print("Intento 1: Click con JavaScript")
                driver.execute_script("arguments[0].scrollIntoView(true);", boton_cerrar)
                time.sleep(1)
                driver.execute_script("arguments[0].click();", boton_cerrar)
            except Exception as e1:
                print(f"Error en click JavaScript: {e1}")
                driver.save_screenshot(ruta_guardado + 'noencoentrocerrarr.png')
                try:
                    print("Intento 2: Click con Action Chains")
                    actions = ActionChains(driver)
                    actions.move_to_element(boton_cerrar)
                    actions.click()
                    actions.perform()
                except Exception as e2:
                    print(f"Error en click Action Chains: {e2}")
                    try:
                        print("Intento 3: Click directo")
                        boton_cerrar.click()
                    except Exception as e3:
                        print(f"Error en click directo: {e3}")
                        driver.save_screenshot(ruta_guardado + 'error_clicks_cerrar.png')
                        pass
                        #raise Exception("No se pudo hacer click en el botón cerrar con ningún método")

            print("Click en botón Cerrar realizado")
            driver.save_screenshot(ruta_guardado + 'tercer_boton.png')
            
            # Verificamos que la ventana se cerró correctamente
            time.sleep(3)
            print(f"Número de ventanas antes del switch: {len(driver.window_handles)}")
            
            # Volver a la ventana principal y cambiar al frame
            driver.close()
            print("Ventana actual cerrada")
            
            driver.switch_to.window(driver.window_handles[0])
            print("Cambiado a ventana principal")
            print(f"URL actual: {driver.current_url}")
            
            # Esperamos más tiempo por el frame
            wait = WebDriverWait(driver, 20)  # Aumentamos el timeout
            print("Esperando por el frame...")
            frame = wait.until(EC.presence_of_element_located((By.ID, "ctl00_mpcphFormWizardFields__IFrameAttachment")))
            print("Frame encontrado")
            
            driver.switch_to.frame("ctl00_mpcphFormWizardFields__IFrameAttachment")
            print("Cambiado al frame")
            
            driver.save_screenshot(ruta_guardado + 'quehayaca.png')

        except Exception as e:
            print(f"Error en proceso de firma: {e}")
            print("Traceback completo:")
            import traceback
            print(traceback.format_exc())
            driver.save_screenshot(ruta_guardado + 'error_firma.png')
            
            # Intentamos obtener información del estado actual
            try:
                print(f"URL actual: {driver.current_url}")
                print(f"Título de la página: {driver.title}")
                print(f"Handles de ventanas disponibles: {driver.window_handles}")
            except:
                print("No se pudo obtener información adicional")

#driver.save_screenshot(ruta_guardado + 'dondeestoy.png')
actualizar_estado("Firma completada. Procediendo a la carga de documentos...", id_licitacion)
actualizar_estado_con_logging("Firma completada. Procediendo a la carga de documentos...", id_licitacion, main_logger)
# Log específico para Galenicum antes de consultar documentos
if rut_usuario == '76285229-2':
    main_logger.info("[GALENICUM] === INICIANDO PROCESO DE CARGA DE DOCUMENTOS ===")

cliente_consulta = """SELECT id, name FROM pharmatender.company 
                              WHERE rut = %s
                            """

cliente_consulta_valores = (rut_usuario, )
if rut_usuario == '76285229-2':
    main_logger.info(f"[GALENICUM] Consultando datos de cliente con RUT: {rut_usuario}")


mycursor.execute(cliente_consulta, cliente_consulta_valores)  

cliente = mycursor.fetchone()
if rut_usuario == '76285229-2':
    if cliente:
        main_logger.info(f"[GALENICUM] Cliente encontrado - ID: {cliente[0]}, Nombre: {cliente[1]}")
    else:
        main_logger.error("[GALENICUM] ERROR CRÍTICO: Cliente no encontrado en base de datos")

####DOCUMENTOS 
documentos_consulta = """SELECT nombre, tipo FROM postulaciones.carga_documentos 
                                WHERE company_id = %s AND licitacion = %s AND estado = 0
                                ORDER BY tipo DESC
                            """
documentos_consulta_valores = (cliente[0], id_licitacion)
mycursor.execute(documentos_consulta, documentos_consulta_valores)

documentos = mycursor.fetchall()
if rut_usuario == '76285229-2':
    main_logger.info(f"[GALENICUM] Documentos encontrados: {len(documentos)}")
    if len(documentos) > 0:
        main_logger.info("[GALENICUM] Lista de documentos a cargar:")
        for i, doc in enumerate(documentos):
            main_logger.info(f"[GALENICUM]   {i+1}. {doc[0]} (tipo: {doc[1]})")
    else:
        main_logger.warning("[GALENICUM] No se encontraron documentos para cargar")
if rut_usuario == '76285229-2':
    main_logger.info("[GALENICUM] Eliminando documentos previos del formulario...")

#####Carga documento por ruta
botones_eliminar = driver.find_elements_by_xpath("//span[contains(@class, 'remove_image')]")

if rut_usuario == '76285229-2':
    main_logger.info(f"[GALENICUM] Se encontraron {len(botones_eliminar)} documentos previos a eliminar")

for x in range(0,len(botones_eliminar)):
    if rut_usuario == '76285229-2':
        main_logger.debug(f"[GALENICUM] Eliminando documento previo {x+1}/{len(botones_eliminar)}")
    driver.execute_script("arguments[0].click();", botones_eliminar[x])



ruta_script = os.path.dirname(os.path.abspath(__file__))
MAX_WAIT_TIME= 60
time.sleep(6)
driver.save_screenshot(ruta_guardado + 'licitacion_documentos.png')

if rut_usuario == '76285229-2':
    main_logger.info(f"[GALENICUM] Screenshot de estado inicial guardada: {ruta_guardado}licitacion_documentos.png")

contadorFotos = 0
for documento in documentos:
    contadorFotos += 1

    if rut_usuario == '76285229-2':
        main_logger.info(f"[GALENICUM] === PROCESANDO DOCUMENTO {contadorFotos}/{len(documentos)} ===")
        main_logger.info(f"[GALENICUM] Nombre: {documento[0]}")
        main_logger.info(f"[GALENICUM] Tipo: {documento[1]}")
    
    if documento[1] == 'administrativo':
        ruta_documento = ruta_script  + '/PYTHON/scraping/imagenes/carga_documentos/' + cliente[1] + '/' + id_licitacion + '/administrativos/' + documento[0]
        
        if rut_usuario == '76285229-2':
            main_logger.info(f"[GALENICUM] Procesando documento administrativo")
            main_logger.info(f"[GALENICUM] Ruta: {ruta_documento}")
            
            # Verificar si el archivo existe
            if os.path.exists(ruta_documento):
                tamaño_mb = round(os.path.getsize(ruta_documento) / 1000000, 2)
                main_logger.info(f"[GALENICUM] Archivo encontrado - Tamaño: {tamaño_mb} MB")
            else:
                main_logger.error(f"[GALENICUM] ERROR: Archivo no encontrado en ruta especificada")
        
        wait.until(EC.presence_of_element_located((By.ID, 'browse_local_admin_file')))
        driver.find_element_by_id('browse_local_admin_file').send_keys(ruta_documento)
        
        if rut_usuario == '76285229-2':
            main_logger.info("[GALENICUM] Archivo administrativo enviado al formulario")
        
        wait.until(EC.presence_of_element_located((By.ID, 'add_local_admin_files'))).click()
        
        if rut_usuario == '76285229-2':
            main_logger.info("[GALENICUM] Click en botón 'Agregar' realizado")

    elif documento[1] == 'tecnico':
        ruta_documento = ruta_script  + '/PYTHON/scraping/imagenes/carga_documentos/' + cliente[1] + '/' + id_licitacion + '/tecnicos/' + documento[0]
        
        if rut_usuario == '76285229-2':
            main_logger.info(f"[GALENICUM] Procesando documento técnico")
            main_logger.info(f"[GALENICUM] Ruta: {ruta_documento}")
            
            if os.path.exists(ruta_documento):
                tamaño_mb = round(os.path.getsize(ruta_documento) / 1000000, 2)
                main_logger.info(f"[GALENICUM] Archivo encontrado - Tamaño: {tamaño_mb} MB")
            else:
                main_logger.error(f"[GALENICUM] ERROR: Archivo no encontrado en ruta especificada")
        
        wait.until(EC.presence_of_element_located((By.ID, 'browse_local_tec_file')))
        driver.find_element_by_id('browse_local_tec_file').send_keys(ruta_documento)
        
        if rut_usuario == '76285229-2':
            main_logger.info("[GALENICUM] Archivo técnico enviado al formulario")
        
        wait.until(EC.presence_of_element_located((By.ID, 'add_local_tec_files'))).click()
        
        if rut_usuario == '76285229-2':
            main_logger.info("[GALENICUM] Click en botón 'Agregar' realizado")

    elif documento[1] == 'economico':
        ruta_documento = ruta_script  + '/PYTHON/scraping/imagenes/carga_documentos/' + cliente[1] + '/' + id_licitacion + '/economicos/' + documento[0]
        
        if rut_usuario == '76285229-2':
            main_logger.info(f"[GALENICUM] Procesando documento económico")
            main_logger.info(f"[GALENICUM] Ruta: {ruta_documento}")
            
            if os.path.exists(ruta_documento):
                tamaño_mb = round(os.path.getsize(ruta_documento) / 1000000, 2)
                main_logger.info(f"[GALENICUM] Archivo encontrado - Tamaño: {tamaño_mb} MB")
            else:
                main_logger.error(f"[GALENICUM] ERROR: Archivo no encontrado en ruta especificada")
        
        wait.until(EC.presence_of_element_located((By.ID, 'browse_local_eco_file')))
        driver.find_element_by_id('browse_local_eco_file').send_keys(ruta_documento)
        
        if rut_usuario == '76285229-2':
            main_logger.info("[GALENICUM] Archivo económico enviado al formulario")
        
        wait.until(EC.presence_of_element_located((By.ID, 'add_local_eco_files'))).click()
        
        if rut_usuario == '76285229-2':
            main_logger.info("[GALENICUM] Click en botón 'Agregar' realizado")

    # Cálculo de tiempos de espera adaptativos
    try:
        sizeArchivo = os.path.getsize(ruta_documento)
        sizeEnMb = round(sizeArchivo / 1000000)
        
        if rut_usuario == '76285229-2':
            main_logger.info(f"[GALENICUM] Tamaño del archivo: {sizeEnMb} MB")
        
    except Exception as e:
        if rut_usuario == '76285229-2':
            main_logger.error(f"[GALENICUM] Error obteniendo tamaño del archivo: {e}")
        sizeEnMb = 1

    timeSleep = min(sizeEnMb, 20) if sizeEnMb > 1 else 1
    MAX_WAIT_TIME = min(sizeEnMb * 2, 120) if sizeEnMb > 1 else 10  # Máximo de 120 segundos

    if rut_usuario == '76285229-2':
        main_logger.info(f"[GALENICUM] Esperando confirmación - Tiempo sleep: {timeSleep}s, Max wait: {MAX_WAIT_TIME}s")

    time.sleep(timeSleep)
    
    # Esperar la aparición del mensaje de confirmación
    try:
        # Usar una espera con un tiempo adaptable
        wait = WebDriverWait(driver, MAX_WAIT_TIME)
        mensaje_confirmacion = wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "mensaje_info_agregar"))
        )
        
        if rut_usuario == '76285229-2':
            main_logger.info(f"[GALENICUM] Documento {documento[0]} cargado exitosamente")
            
    except TimeoutException as e:
        if rut_usuario == '76285229-2':
            main_logger.error(f"[GALENICUM] TIMEOUT: El documento {documento[0]} no se cargo en el tiempo esperado")
            main_logger.error(f"[GALENICUM] Detalles del error: {e}")
            # Tomar screenshot para debug
            driver.save_screenshot(ruta_guardado + f'error_documento_{contadorFotos}.png')
            main_logger.error(f"[GALENICUM] Screenshot de error guardada: {ruta_guardado}error_documento_{contadorFotos}.png")
        
        print("El mensaje de confirmación para el documento {} no apareció a tiempo:".format(documento[0]))

# Verificar cantidad de documentos que se ingresaron
if rut_usuario == '76285229-2':
    main_logger.info("[GALENICUM] === VERIFICACIÓN FINAL DE DOCUMENTOS CARGADOS ===")

try:
    wait.until(EC.presence_of_element_located((By.ID, 'added_chp_doc_list')))
    tabla_documentos = driver.find_element_by_id('added_chp_doc_list')
    tabla_documentos.location_once_scrolled_into_view
    documentos_tabla = driver.find_elements_by_xpath("//ol[@id='added_chp_doc_list']/li/span[@class='nameDocumentoAgregado']")
    
    if rut_usuario == '76285229-2':
        main_logger.info(f"[GALENICUM] Se encontraron {len(documentos_tabla)} documentos en la tabla final")
    
    # Guardar nombres de documentos que se registraron
    array_nombres = []
    for documento_nombre in documentos_tabla:
        inner_html_value = documento_nombre.get_attribute('innerHTML')
        text_value = documento_nombre.text

        if rut_usuario == '76285229-2':
            main_logger.info(f"[GALENICUM] Documento registrado: {inner_html_value}")
        
        # Imprimir valores para comparación (mantener print original)
        print(f"Documento_nombre (innerHTML): {inner_html_value}")
        print(f"Documento_nombre (text): {text_value}")
        array_nombres.append(documento_nombre.get_attribute('innerHTML'))
    
    if rut_usuario == '76285229-2':
        main_logger.info(f"[GALENICUM] Total de documentos verificados: {len(array_nombres)}")
        if len(array_nombres) != len(documentos):
            main_logger.warning(f"[GALENICUM] DISCREPANCIA: Se esperaban {len(documentos)} documentos, pero se verificaron {len(array_nombres)}")
        else:
            main_logger.info("[GALENICUM] Todos los documentos se cargaron correctamente")
    
    # Continuar con el flujo normal
    driver.switch_to.default_content()
    wait.until(EC.element_to_be_clickable((By.ID, 'ctl00_btnNext'))).click()
    
    if rut_usuario == '76285229-2':
        main_logger.info("[GALENICUM] Click en botón 'Siguiente' realizado exitosamente")
        
except TimeoutException:
    if rut_usuario == '76285229-2':
        main_logger.error("[GALENICUM] ERROR CRÍTICO: No se pudo encontrar la tabla de documentos cargados")
        driver.save_screenshot(ruta_guardado + 'error_tabla_documentos.png')
        main_logger.error(f"[GALENICUM] Screenshot de error crítico guardada: {ruta_guardado}error_tabla_documentos.png")
    
    print("No se pudo encontrar la lista de documentos o no está disponible en este momento.")

actualizar_estado_con_logging("Carga de documentos completada. Finalizando oferta...", id_licitacion, main_logger)

if rut_usuario == '76285229-2':
    main_logger.info("[GALENICUM] === PROCESO DE CARGA DE DOCUMENTOS FINALIZADO ===")
    main_logger.info(f"[GALENICUM] Documentos procesados: {len(documentos)}")
    main_logger.info(f"[GALENICUM] Documentos verificados: {len(array_nombres) if 'array_nombres' in locals() else 'Error en verificación'}")

actualizar_estado("Carga de documentos completada. Finalizando oferta...", id_licitacion)


###FIN CARGA DE DOCUMENTOS
time.sleep(5)
print("########### QUINTA PAGINA ####################")
#Quinta Página - Confirmar e Ingresar Oferta
#Calculo total de items a encontrar
cantidad_item = len(driver.find_elements_by_class_name("cssBIDBidsBlockTable"))


print("Obteniendo CodigoPostulacion actualizado para los insert...")
mycursor_updated = mydb.cursor(buffered=True)
mycursor_updated.execute("SELECT CodigoPostulacion FROM licitaciones_diarias_total.Licitaciones_diarias WHERE `Licitacion` = '" + id_licitacion + "' AND `Fecha_Publicacion` LIKE '%" + fecha_publicacion + "%' LIMIT 1")
mydb.commit()

# Obtener el código actualizado
url_postulacion_actualizada = None
for row_updated in mycursor_updated:
    if row_updated[0]:  # Verificar que no sea None o vacío
        url_postulacion_actualizada = 'https://www.mercadopublico.cl/Portal/Modules/Desktop/Desktop.aspx?enc=' + str(row_updated[0])
        print(f"URL postulacion actualizada: {url_postulacion_actualizada}")
    else:
        print("ADVERTENCIA: CodigoPostulacion sigue vacío en la BD")
        url_postulacion_actualizada = url_postulacion  # Usar la original como fallback

mycursor_updated.close()
url_para_insert = url_postulacion_actualizada if url_postulacion_actualizada else url_postulacion

for contador in range(1, cantidad_item):
  #Datos a Insertar
    
  nro_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_hlNumberShow").text
  name_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblNameShow").text
  status_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblStateShow").text
  currency_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblCurrencyShow").text
  buyer_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_hlBuyerShow").text
  buyer_notes_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblBuyerNotesShow").text
  contact_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblContactShow").text
  phones_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblPhonesShow").text
  publish_date_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblPublishDateShow").text
  end_date_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblEndDateShow").text
  open_date_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_ucProcurement_lblOpeningDateShow").text

  user_name_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_lblBIDProUserNameDesc").text
  user_rut_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_lblBIDProRutDesc").text
  social_reason_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_lblBIDProSocialReasonDesc").text

  offer_name_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_lblBIDOfferNameDesc").text
  offer_desc_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_lblDescription").text
  time_desc_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_lblBIDOfferDateTimeDesc").text
  offer_total_adq = driver.find_element_by_id("ctl00_mpcphFormWizardFields_lblBIDOfferTotalDesc").text

  existe_tabla_firma = driver.find_elements_by_id('ctl00_mpcphFormWizardFields_trDJreq')

  ##Cuando existe la tabla de detalle queda segunda 
  if(existe_tabla_firma):
    contador_tr = 9
  else:
    contador_tr = 8

  item = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[1]/td[1]").text
  onu = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[1]/td[2]").text
  esp_comprador = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[2]/td").text
  cant = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[3]/td").text
  cant_ofertada = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[4]/td/table/tbody/tr[2]/td[1]").text
  esp_proveedor = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[4]/td/table/tbody/tr[2]/td[2]").text
  pre_unitario = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[4]/td/table/tbody/tr[2]/td[3]").text
  total_item = driver.find_element_by_xpath("/html/body/form/table/tbody/tr/td[2]/table/tbody/tr/td/table/tbody/tr["+str(contador_tr)+"]/td/table["+str(contador)+"]/tbody/tr[4]/td/table/tbody/tr[2]/td[4]").text
  link = driver.current_url
  print(link)
  time.sleep(1)
  
  sql = """INSERT INTO postulaciones.postulacion_item (nro_adquisicion, nombre, estado, moneda, comprador, obs_comprador, contacto, telefono, 
  fecha_publicacion, fecha_cierre, fecha_apertura, usuario, rut_usuario, razon_social, nombre_oferta, desc_oferta, fecha_ingreso, total_oferta, 
  item, onu, esp_comprador, cantidad, cantidad_ofertada, esp_proveedor, precio_unitario, total_item, link, link_postulacion, strRutCliente, strRutUsuario,
   tipo, status, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
  %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) """

  values = (nro_adq, name_adq, status_adq, currency_adq, buyer_adq, buyer_notes_adq, contact_adq, phones_adq, publish_date_adq, end_date_adq,
  open_date_adq, user_name_adq, user_rut_adq, social_reason_adq, offer_name_adq, offer_desc_adq, time_desc_adq, offer_total_adq, item, onu,
  esp_comprador, cant, cant_ofertada, esp_proveedor, pre_unitario, total_item, link, url_para_insert, rut_usuario, rut_cliente, acceso_mp,  
  0, timestamp, timestamp)

  mycursor.execute(sql,values)
  mydb.commit()
print("########### FIN QUINTA PAGINA ####################")
time.sleep(3)
link = driver.current_url
try:
   wait.until(EC.presence_of_element_located((By.ID, "ctl00_mpcphFormWizardFields_btnEnterOffer")))
except:
   print("no encontro elemento de boton",link)

actualizar_estado("Finalizando oferta en Mercado Público...", id_licitacion)

boton_finalizar = driver.find_element_by_id('ctl00_mpcphFormWizardFields_btnEnterOffer')
boton_finalizar.location_once_scrolled_into_view
try:
   boton_finalizar.click()
except:
   print("no encuentra botonclick",link)
alerta_finalizar = driver.switch_to.alert
alerta_finalizar.accept()
webdriver.ActionChains(driver).send_keys(Keys.TAB).perform()
time.sleep(1)
webdriver.ActionChains(driver).send_keys(Keys.ENTER).perform()

##PROCESOS LUEGO DE FINALIZAR OFERTA
#Actualizar documentos a estado = 1 para que no aparezcan en la tabla y coloco datos de postulacion (nombre y hora)
sql = """UPDATE postulaciones.carga_documentos SET estado = 1 ,nombre_postulacion = %s ,fecha_postulacion = %s
     WHERE licitacion = %s AND company_id = %s AND estado = 0
    """
valores = (nombre_lic, timestamp ,id_licitacion, cliente[0]) 
mycursor.execute(sql, valores) 
mydb.commit()

##Renombrar nombre carpeta de documentos luego de postular
if len(documentos) > 0:
  ruta_carpeta = ruta_script + '/PYTHON/scraping/imagenes/carga_documentos/' + cliente[1] + '/' + id_licitacion
  nuevo_nombre =  ruta_carpeta + '_' + nombre_lic + fecha_hoy.strftime('_%d%m%Y_%H%M%S')
  os.rename(ruta_carpeta, nuevo_nombre)

#Actualizar items a estado = 1 para que aparezcan como Ingresados
sql = """UPDATE licitaciones_diarias_intranet.Licitaciones_diarias_clientes SET intEstadoInterno = 1
     WHERE licitacion = %s and strRutCliente = %s
    """
valores = (id_licitacion, rut_usuario) 
mycursor.execute(sql, valores) 
mydb.commit()

#Los documentos que efectivamente se encontraron se actualizan a estado postuladas en tabla carga_documentos
# NUEVO: Marcar todos los documentos como postulados exitosamente si la postulación se completó
print("=== ACTUALIZANDO ESTADO DE DOCUMENTOS ===")

# Obtener todos los documentos que se procesaron para esta postulación
mycursor.execute("""SELECT nombre FROM postulaciones.carga_documentos 
                    WHERE licitacion = %s AND company_id = %s 
                    AND nombre_postulacion = %s AND fecha_postulacion = %s AND estado = 1""", 
                (id_licitacion, cliente[0], nombre_lic, timestamp))
documentos_en_bd = mycursor.fetchall()

print(f"Documentos en BD para esta postulación: {len(documentos_en_bd)}")
print(f"Documentos detectados en tabla HTML: {len(array_nombres)}")

# Si llegamos hasta acá, significa que la postulación se completó exitosamente
# Marcar TODOS los documentos de esta postulación como exitosos
if len(documentos_en_bd) > 0:
    print("Marcando TODOS los documentos como postulados exitosamente...")
    sql_marcar_todos = """UPDATE postulaciones.carga_documentos 
                         SET postulado = 1 
                         WHERE licitacion = %s AND company_id = %s 
                         AND nombre_postulacion = %s AND fecha_postulacion = %s AND estado = 1"""
    valores_todos = (id_licitacion, cliente[0], nombre_lic, timestamp)
    mycursor.execute(sql_marcar_todos, valores_todos)
    mydb.commit()
    print(f"Marcados {mycursor.rowcount} documentos como postulados exitosamente")
else:
    print("No se encontraron documentos en BD para marcar como postulados")

# Mantener la lógica original como fallback/debug
print("\n=== PROCESO ORIGINAL DE VERIFICACION ===")
for nombre_documento in array_nombres:
    print(f"Verificando documento en array_nombres: {nombre_documento}")
    
    # Intentar actualizar por nombre exacto
    sql = "UPDATE postulaciones.carga_documentos SET postulado = 1 WHERE licitacion = %s AND company_id = %s AND nombre = %s"
    valores = (id_licitacion, cliente[0], nombre_documento)
    mycursor.execute(sql, valores)
    
    if mycursor.rowcount > 0:
        print(f"Documento actualizado por nombre exacto: {nombre_documento}")
    else:
        print(f"No se encontro documento con nombre exacto: {nombre_documento}")
        
        # Intentar búsqueda más flexible
        sql_flexible = """UPDATE postulaciones.carga_documentos 
                         SET postulado = 1 
                         WHERE licitacion = %s AND company_id = %s 
                         AND nombre_postulacion = %s AND fecha_postulacion = %s 
                         AND estado = 1 AND postulado = 0
                         AND (nombre LIKE %s OR %s LIKE CONCAT('%', nombre, '%'))"""
        valores_flexible = (id_licitacion, cliente[0], nombre_lic, timestamp, f"%{nombre_documento}%", nombre_documento)
        mycursor.execute(sql_flexible, valores_flexible)
        
        if mycursor.rowcount > 0:
            print(f"Documento actualizado con busqueda flexible: {nombre_documento}")
        else:
            print(f"No se pudo actualizar documento: {nombre_documento}")
    
    mydb.commit()

print("=== FIN ACTUALIZACION DE DOCUMENTOS ===")
actualizar_estado("Oferta finalizada y confirmada exitosamente", id_licitacion)

driver.quit()






