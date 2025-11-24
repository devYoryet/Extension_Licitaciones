from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException, UnexpectedAlertPresentException
import mysql.connector
import time
import json
import logging
import sys
import random
import os
import platform

class MercadoPublicoLogin:
    def __init__(self, log_file='/var/www/html/CRONJOBS/login.log'):
        self.setup_logger(log_file)
        self.environment = self.detect_environment()
        self.setup_driver()
        
    def setup_logger(self, log_file):
        self.logger = logging.getLogger('mercado_publico_login')
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler(log_file, encoding='utf-8')
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def detect_environment(self):
        """Detecta automáticamente el entorno de ejecución"""
        display_available = os.environ.get('DISPLAY') is not None
        is_linux = platform.system().lower() == 'linux'
        
        desktop_available = False
        try:
            if is_linux:
                result = os.popen('ps aux | grep -E "(gdm|lightdm|sddm|xorg|wayland)" | grep -v grep').read()
                desktop_available = len(result.strip()) > 0
        except:
            desktop_available = False
        
        env_type = "servidor_headless" if (is_linux and not display_available and not desktop_available) else "desarrollo"
        self.logger.info(f"Entorno detectado: {env_type}")
        return env_type

    def verify_server_environment(self):
        """Verifica que el servidor tenga todo lo necesario"""
        if self.environment != "servidor_headless":
            return True, 3
            
        checks = []
        
        # Verificar Chrome
        try:
            chrome_version = os.popen('google-chrome --version 2>/dev/null || chromium --version 2>/dev/null').read().strip()
            if chrome_version:
                checks.append(True)
            else:
                checks.append(False)
        except:
            checks.append(False)
        
        # Verificar memoria
        try:
            memoria_info = os.popen("free -h | grep Mem").read().strip()
            checks.append(True)
        except:
            checks.append(False)
        
        # Verificar /tmp
        try:
            tmp_space = os.popen("df -h /tmp | tail -1").read().strip()
            checks.append(True)
        except:
            checks.append(False)
        
        return sum(checks), len(checks)

    def get_dynamic_user_agent(self):
        """Genera User-Agent dinámico"""
        chrome_versions = ["118.0.0.0", "119.0.0.0", "120.0.0.0", "121.0.0.0"]
        windows_versions = ["Windows NT 10.0; Win64; x64", "Windows NT 11.0; Win64; x64"]
        
        chrome_version = random.choice(chrome_versions)
        windows_version = random.choice(windows_versions)
        
        return f"Mozilla/5.0 ({windows_version}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome_version} Safari/537.36"

    def human_like_scroll(self):
        """Simula scroll humano"""
        try:
            scroll_distance = random.randint(100, 500)
            self.driver.execute_script(f"window.scrollBy(0, {scroll_distance});")
            time.sleep(random.uniform(0.5, 1.2))
        except Exception as e:
            pass

    def human_like_mouse_movement(self):
        """Simula movimientos naturales del mouse"""
        try:
            actions = ActionChains(self.driver)
            for _ in range(random.randint(2, 4)):
                x_offset = random.randint(-100, 100)
                y_offset = random.randint(-50, 50)
                actions.move_by_offset(x_offset, y_offset)
                time.sleep(random.uniform(0.1, 0.3))
            actions.perform()
        except Exception as e:
            pass

    def handle_alerts(self):
        """Manejo silencioso de alertas"""
        try:
            alert = WebDriverWait(self.driver, 3).until(EC.alert_is_present())
            alert_text = alert.text
            
            critical_messages = [
                "error al iniciar sesión",
                "intenta nuevamente", 
                "credenciales incorrectas",
                "usuario o contraseña",
                "acceso denegado"
            ]
            
            is_critical = any(msg in alert_text.lower() for msg in critical_messages)
            
            if is_critical:
                self.logger.error(f"Alerta crítica detectada: {alert_text}")
            
            try:
                alert.accept()
            except:
                pass
            
            return {
                'hay_alerta': True,
                'texto_alerta': alert_text,
                'es_critico': is_critical
            }
            
        except TimeoutException:
            return {
                'hay_alerta': False,
                'texto_alerta': None,
                'es_critico': False
            }
        except Exception as e:
            self.logger.error(f"Error manejando alerta: {e}")
            return {
                'hay_alerta': False,
                'texto_alerta': None,
                'es_critico': True
            }

    def human_like_click(self, element):
        """Clic optimizado"""
        try:
            element.click()
            return True
        except Exception as e:
            try:
                self.driver.execute_script("arguments[0].click();", element)
                return True
            except Exception as e2:
                return False

    def random_human_delay(self):
        """Delay humanizado"""
        return random.uniform(0.8, 3.2)

    def simulate_reading(self):
        """Simula tiempo de lectura"""
        reading_time = random.uniform(2.0, 4.5)
        time.sleep(reading_time)
        if random.choice([True, False]):
            self.human_like_scroll()

    def setup_driver(self):
        start_time = time.time()
        
        chrome_options = self.configure_chrome_options()
        self.driver = self.initialize_driver_robust(chrome_options)
        
        # CONFIGURACIÓN EXACTA DE POSTULACION.PY
        self.driver.set_window_size(1920, 1080)
        
        # USAR EXACTAMENTE LA MISMA CONFIGURACIÓN QUE POSTULACION.PY
        self.wait = WebDriverWait(self.driver, 500)  # Timeout de 500 segundos igual que postulacion.py
        
        self.apply_stealth_scripts()
        self.establish_browsing_pattern()
        
        setup_time = time.time() - start_time
        self.logger.info(f"Driver inicializado exitosamente en {setup_time:.2f}s")

    def configure_chrome_options(self):
        """Configura opciones de Chrome usando exactamente la misma configuración que postulacion.py"""        
        options = Options()
        
        # CONFIGURACIÓN EXACTA DE POSTULACION.PY - LÍNEA POR LÍNEA IDÉNTICA
        options.add_argument("--headless")
        options.add_argument('--disable-gpu')
        options.add_argument("--no-sandbox")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        options.add_argument("--incognito")
        options.add_argument("--start-maximized")
        options.add_argument("--disable-dev-shm-usage")  # <-- agrega esto
        
        options.add_argument("user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/59.0.3071.115 Safari/537.36")
        
        return options

    def initialize_driver_robust(self, options):
        """Inicializa el driver usando exactamente la misma configuración que postulacion.py"""
        
        # USAR EXACTAMENTE EL MISMO PATRÓN QUE POSTULACION.PY
        try:
            driver = webdriver.Chrome('/usr/local/bin/chromedriver', options=options)
            return driver
        except Exception as e1:
            try:
                driver = webdriver.Chrome(options=options)
                return driver
            except Exception as e2:
                self.logger.error(f"No se pudo inicializar Chrome: {e1} | {e2}")
                raise Exception(f"No se pudo inicializar Chrome en entorno {self.environment}")

    def configure_adaptive_timeouts(self):
        """Configura timeouts según el entorno"""
        if self.environment == "servidor_headless":
            base_timeout = 60
            page_timeout = 45
            script_timeout = 30
        else:
            base_timeout = 30
            page_timeout = 25
            script_timeout = 20
        
        return base_timeout, page_timeout, script_timeout

    def apply_stealth_scripts(self):
        """Aplica scripts JavaScript para evadir detección"""
        try:
            stealth_script = """
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['es-CL', 'es', 'en']
            });
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {}
            };
            """
            
            self.driver.execute_script(stealth_script)
        except Exception as e:
            pass

    def establish_browsing_pattern(self):
        """Establece patrón inicial de navegación"""
        try:
            if random.choice([True, False]):
                scroll = random.randint(50, 200)
                self.driver.execute_script(f"window.scrollBy(0, {scroll});")
                time.sleep(random.uniform(0.3, 1.0))
            
            if random.choice([True, False, False]):
                self.driver.execute_script("window.blur(); window.focus();")
                time.sleep(random.uniform(0.2, 0.8))
        except Exception as e:
            pass

    def fetch_user_position(self, usuario_id):
        try:
            self.logger.info(f"Buscando posición para usuario ID: {usuario_id}")
            cache_file = '/var/www/html/CRONJOBS/users_cache.json'
            
            # Verificar si el archivo existe
            if not os.path.exists(cache_file):
                self.logger.error(f"Archivo de cache no existe: {cache_file}")
                return None
            
            with open(cache_file, 'r') as f:
                users = json.load(f)
                self.logger.info(f"Cache cargado exitosamente, {len(users)} usuarios encontrados")
                
                for user in users:
                    if user['id'] == int(usuario_id):
                        position = (user['lugar_unidad'], user['nombre_unidad'])
                        self.logger.info(f"Usuario encontrado: {position}")
                        return position
                
                self.logger.error(f"Usuario ID {usuario_id} no encontrado en cache")
                return None
                
        except json.JSONDecodeError as e:
            self.logger.error(f"Error decodificando JSON del cache: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Error leyendo cache: {str(e)}")
            return None

    def login(self, username, password, user_id):
        try:
            # USAR EXACTAMENTE EL MISMO PATRÓN QUE POSTULACION.PY
            self.logger.info(f"=== INICIANDO PROCESO DE LOGIN ===")
            self.logger.info(f"Username: {username}")
            self.logger.info(f"User ID: {user_id}")
            
            # Navegación inicial
            self.logger.info("Navegando a https://www.mercadopublico.cl")
            self.driver.get('https://www.mercadopublico.cl')
            time.sleep(2)
            
            current_url = self.driver.current_url
            self.logger.info(f"URL actual después de navegación inicial: {current_url}")
            
            # Verificar cola de espera (igual que en postulacion.py)
            if "queue-it" in self.driver.current_url:
                self.logger.info("Detectada cola de espera, intentando bypass")
                try:
                    queue_element = self.wait.until(EC.element_to_be_clickable((By.ID, 'divConfirmRedirectModal')))
                    queue_element.click()
                    self.logger.info("Bypass de cola exitoso")
                except TimeoutException:
                    self.logger.info("No se encontró modal de cola")
                    pass
            
            # Obtener posición del usuario
            self.logger.info(f"Obteniendo posición del usuario ID: {user_id}")
            user_position = self.fetch_user_position(int(user_id))
            self.logger.info(f"Posición de usuario obtenida: {user_position}")
            if not user_position:
                self.logger.error("No se pudo obtener la posición del usuario")
                return 'login_failed'
            
            # Hacer clic en "Iniciar Sesión" con timeout más alto (igual que postulacion.py)
            self.logger.info("Buscando botón 'Iniciar Sesión'")
            login_button = self.wait.until(EC.element_to_be_clickable(
                (By.XPATH, '//button[text()="Iniciar Sesión"]')))
            self.logger.info("Botón 'Iniciar Sesión' encontrado, haciendo clic")
            login_button.click()
            
            # Esperar transición de página (igual que postulacion.py)
            time.sleep(3)
            current_url = self.driver.current_url
            self.logger.info(f"URL después de clic en 'Iniciar Sesión': {current_url}")
            
            # Hacer clic en Clave Única
            self.logger.info("Buscando botón 'Clave Única' (zocial-oidc)")
            clave_button = self.wait.until(EC.element_to_be_clickable((By.ID, 'zocial-oidc')))
            self.logger.info("Botón 'Clave Única' encontrado, haciendo clic")
            clave_button.click()
            
            # Esperar que aparezca la página de Clave Única
            time.sleep(3)
            current_url = self.driver.current_url
            self.logger.info(f"URL después de clic en 'Clave Única': {current_url}")
            
            # Esperar campos de credenciales (igual que postulacion.py)
            self.logger.info("Buscando campos de credenciales")
            username_field = self.wait.until(EC.visibility_of_element_located((By.ID, 'uname')))
            password_field = self.wait.until(EC.visibility_of_element_located((By.ID, 'pword')))
            self.logger.info("Campos de credenciales encontrados")
            
            # Ingreso de credenciales con limpieza previa (igual que postulacion.py)
            self.logger.info("Ingresando credenciales")
            username_field.clear()
            time.sleep(0.5)
            username_field.send_keys(str(username))
            
            password_field.clear()
            time.sleep(0.5)
            password_field.send_keys(str(password))
            self.logger.info("Credenciales ingresadas correctamente")
            
            # Pequeña pausa antes del submit (igual que postulacion.py)
            time.sleep(1)
            
            # Enviar formulario
            self.logger.info("Buscando botón de envío de formulario")
            submit_button = self.wait.until(EC.element_to_be_clickable((By.ID, 'login-submit')))
            self.logger.info("Enviando formulario de login")
            submit_button.click()
            
            # ESPERA INTELIGENTE POST-LOGIN (igual que postulacion.py)
            self.logger.info("Esperando respuesta del servidor post-login...")
            time.sleep(5)  # Espera inicial más larga
            
            current_url = self.driver.current_url
            page_title = self.driver.title
            self.logger.info(f"URL después de submit: {current_url}")
            self.logger.info(f"Título de página después de submit: '{page_title}'")
            
            # Verificar alertas con múltiples intentos (simplificado pero efectivo)
            self.logger.info("Verificando alertas post-login")
            alert_result = self.handle_alerts()
            if alert_result['es_critico']:
                self.logger.error(f"Alerta crítica detectada: {alert_result['texto_alerta']}")
                return 'login_error_credenciales'
            
            # Verificar errores en la página solo si no hubo alertas críticas
            if not alert_result['hay_alerta'] or not alert_result['es_critico']:
                try:
                    self.logger.info("Verificando errores en página")
                    WebDriverWait(self.driver, 8).until(EC.visibility_of_element_located((By.CLASS_NAME, 'gob-response-error')))
                    self.logger.error("Error de credenciales detectado en página")
                    return 'login_error_credenciales'
                except TimeoutException:
                    self.logger.info("No se encontraron errores en página")
                    pass
            
            # Verificar el título de la página ANTES del modal (EXACTAMENTE igual que postulacion.py)
            titulo = self.driver.title
            self.logger.info(f"Título actual para verificación: '{titulo}'")
            
            if titulo == 'Mercado publico la nueva plataforma de licitaciones de ChileCompra':
                self.logger.info("¡LOGIN EXITOSO! Título de página confirmado")
                
                # Manejar lógica de negocio (selección de organización) igual que postulacion.py
                if user_position:
                    self.logger.info("Iniciando proceso de selección de organización")
                    success = self.handle_business_logic_postulacion_style(user_position)
                    if not success:
                        self.logger.error("Fallo en selección de organización")
                        return 'login_failed'
                    self.logger.info("Selección de organización exitosa")
                
                return 'login_ok'
            else:
                self.logger.error(f"Título de página inesperado: '{titulo}' - Se esperaba: 'Mercado publico la nueva plataforma de licitaciones de ChileCompra'")
                return 'login_failed'

        except Exception as e:
            error_type = type(e).__name__
            error_msg = str(e)
            
            # Manejo específico de UnexpectedAlertPresentException
            if "UnexpectedAlertPresentException" in error_type:
                try:
                    alert = self.driver.switch_to.alert
                    alert_text = alert.text
                    alert.accept()
                    
                    if any(msg in alert_text.lower() for msg in ["error", "intenta", "credenciales"]):
                        return 'login_error_credenciales'
                    
                except Exception as alert_error:
                    pass
            
            self.logger.error(f"Error en login: {error_type} - {error_msg}")
            return 'login_failed'
        
        finally:
            if hasattr(self, 'driver'):
                self.driver.quit()

    def handle_business_logic_postulacion_style(self, user_position):
        """Maneja la lógica de negocio exactamente igual que postulacion.py"""
        try:
            self.logger.info("Esperando modal de selección de organización (myModal)")
            modal_element = WebDriverWait(self.driver, 10).until(EC.visibility_of_element_located((By.ID, 'myModal')))
            self.logger.info("Modal encontrado exitosamente")
            
            if modal_element:
                self.logger.info("Buscando filas de organizaciones en el modal")
                filas = self.driver.find_elements(By.XPATH, "//table[@id='tabla']/tbody/tr/td/div/label[@class='wrap-td']")
                self.logger.info(f"Se encontraron {len(filas)} organizaciones disponibles")
                
                nombre_company = user_position[1]
                self.logger.info(f"Buscando organización que contenga: '{nombre_company}'")
                
                organizacion_encontrada = False
                for i, fila in enumerate(filas):
                    nombre_formateado = fila.text.lower()
                    existe_nombre = nombre_company.lower() in nombre_formateado
                    self.logger.info(f"Organización {i+1}: '{fila.text}' - ¿Coincide? {existe_nombre}")

                    if existe_nombre:
                        self.logger.info(f"¡Organización encontrada! Haciendo clic en: '{fila.text}'")
                        fila.click()
                        time.sleep(1)
                        
                        self.logger.info("Buscando botón de confirmación")
                        confirm_button = WebDriverWait(self.driver, 60).until(
                            EC.element_to_be_clickable((By.XPATH, '//*[@id="myModal"]/div/div/div[3]/a'))
                        )
                        self.logger.info("Haciendo clic en botón de confirmación")
                        confirm_button.click()
                        organizacion_encontrada = True
                        time.sleep(3)  # Dar tiempo para que se procese
                        break
                
                if organizacion_encontrada:
                    self.logger.info("Selección de organización completada exitosamente")
                    return True
                else:
                    self.logger.error(f"No se encontró organización que contenga '{nombre_company}'")
                    return False
            else:
                self.logger.error("Modal no disponible")
                return False
                
        except TimeoutException as e:
            self.logger.error(f"Timeout esperando modal: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Error en selección de organización: {e}")
            return False

    def close(self):
        if hasattr(self, 'driver'):
            self.driver.quit()

def main():
    if len(sys.argv) < 6:
        print("login_failed") 
        return

    usuario_mp = sys.argv[1]
    clave_mp = sys.argv[2]
    acceso_mp = sys.argv[3]
    company_id = sys.argv[4]
    usuario_id = sys.argv[5]

    login_manager = None
    try:
        login_manager = MercadoPublicoLogin()
        login_manager.logger.info(f"=== PARÁMETROS RECIBIDOS ===")
        login_manager.logger.info(f"Usuario MP: {usuario_mp}")
        login_manager.logger.info(f"Acceso MP: {acceso_mp}")
        login_manager.logger.info(f"Company ID: {company_id}")
        login_manager.logger.info(f"Usuario ID: {usuario_id}")
        login_manager.logger.info(f"==========================")
        
        result = login_manager.login(usuario_mp, clave_mp, usuario_id)
        
        login_manager.logger.info(f"=== RESULTADO FINAL ===")
        login_manager.logger.info(f"Resultado: {result}")
        login_manager.logger.info(f"======================")
        
        print(result)  # SOLO EL RESULTADO
        
    except Exception as e:
        # Log solo errores críticos al archivo
        if login_manager and hasattr(login_manager, 'logger'):
            login_manager.logger.error(f"Error crítico en main(): {type(e).__name__} - {str(e)}")
            login_manager.logger.error(f"Traceback completo:", exc_info=True)
        print("login_failed")
    finally:
        if login_manager:
            login_manager.close()

if __name__ == "__main__":
    main()