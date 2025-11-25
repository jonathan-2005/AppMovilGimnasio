/**
 * Configuración de la aplicación
 *
 * IMPORTANTE: Cambia la IP por la de tu computadora
 *
 * Para obtener tu IP:
 * - Windows: abre CMD y ejecuta "ipconfig"
 * - Mac/Linux: ejecuta "ifconfig" o "hostname -I"
 *
 * Ejemplo: Si tu IP es 192.168.1.100, la URL debe ser:
 * http://192.168.1.100:8000/api/
 */

export const config = {
  // URL de backend en Railway
  API_BASE_URL: 'https://carefree-fulfillment-production.up.railway.app/api/',

  // Configuración de timeout (en milisegundos)
  API_TIMEOUT: 10000,

  // Otros ajustes
  DEBUG: __DEV__, // true en desarrollo, false en producción
};

// URL completa para diferentes endpoints
export const API_ENDPOINTS = {
  LOGIN: `${config.API_BASE_URL}token/`,
  REFRESH: `${config.API_BASE_URL}token/refresh/`,
  REGISTER: `${config.API_BASE_URL}auth/register/`,
  MEMBRESIAS: `${config.API_BASE_URL}membresias/`,
  RESERVAS: `${config.API_BASE_URL}horarios/reservas/`,
  SESIONES: `${config.API_BASE_URL}horarios/sesiones/`,
  TIPOS_ACTIVIDAD: `${config.API_BASE_URL}horarios/tipos-actividad/`,
};
