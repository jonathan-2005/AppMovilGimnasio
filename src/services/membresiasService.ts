import api from './api';

export interface MembresiaDisponible {
  id: number;
  nombre_plan: string;
  tipo: string;
  tipo_display: string;
  precio: number | string;
  activo: boolean;
  duracion_dias?: number | null;
  descripcion?: string | null;
  beneficios?: string | null;
  beneficios_list?: string[];
}

export interface MembresiaCliente {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  dias_restantes: number;
  activa: boolean;
  membresia: {
    id: number;
    nombre_plan: string;
    tipo: string;
    precio: number | string;
    beneficios?: string | null;
  };
}

export interface AdquirirMembresiaPayload {
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia';
  meses_adicionales?: number;
}

const ensureArray = <T,>(data: any): T[] => {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (Array.isArray(data.results)) {
    return data.results as T[];
  }

  return [];
};

export const MembresiasService = {
  /**
   * Listar membresías activas disponibles para la sede del cliente
   * Endpoint: GET /api/membresias/activas/
   */
  async listarActivas(): Promise<MembresiaDisponible[]> {
    console.log('📋 Obteniendo membresías activas...');
    const response = await api.get('membresias/activas/');
    console.log(`✅ ${response.data.length} membresías activas encontradas`);
    return ensureArray<MembresiaDisponible>(response.data);
  },

  /**
   * Obtener suscripciones del cliente autenticado
   * Endpoint: GET /api/suscripciones/
   * El backend filtra automáticamente por el cliente autenticado
   */
  async obtenerMisMembresias(): Promise<MembresiaCliente[]> {
    console.log('📋 Obteniendo mis suscripciones...');
    const response = await api.get('suscripciones/');
    console.log(`✅ ${response.data.length} suscripciones encontradas`);

    // Transformar la respuesta del backend al formato esperado por la app
    const suscripciones = ensureArray(response.data);
    return suscripciones.map((suscripcion: any) => ({
      id: suscripcion.id,
      fecha_inicio: suscripcion.fecha_inicio,
      fecha_fin: suscripcion.fecha_fin,
      estado: suscripcion.estado,
      dias_restantes: suscripcion.dias_restantes || 0,
      activa: suscripcion.estado === 'activa',
      membresia: {
        id: suscripcion.membresia,
        nombre_plan: suscripcion.membresia_nombre || 'Membresía',
        tipo: suscripcion.membresia_tipo || 'mensual',
        precio: suscripcion.precio_pagado,
        beneficios: null
      }
    }));
  },

  /**
   * Procesar pago simulado
   * Endpoint: POST /api/suscripciones/procesar_pago/
   */
  async procesarPago(membresiaId: number, metodoPago: string, datosTarjeta?: any) {
    console.log(`💳 Procesando pago para membresía ${membresiaId}...`);
    const body = {
      membresia: membresiaId,
      metodo_pago: metodoPago,
      ...datosTarjeta
    };

    const response = await api.post('suscripciones/procesar_pago/', body);
    console.log('✅ Pago procesado');
    return response.data;
  },

  /**
   * Adquirir/Suscribirse a una membresía
   * Endpoint: POST /api/suscripciones/
   * El backend infiere automáticamente el cliente y sede del token
   */
  async adquirirMembresia(id: number, payload: AdquirirMembresiaPayload = {}) {
    console.log(`🛒 Adquiriendo membresía ${id}...`);
    const body = {
      membresia: id,
      metodo_pago: payload.metodo_pago || 'efectivo',
      notas: payload.meses_adicionales
        ? `Suscripción con ${payload.meses_adicionales} meses adicionales`
        : 'Suscripción desde app móvil'
    };

    const response = await api.post('suscripciones/', body);
    console.log('✅ Membresía adquirida exitosamente');
    return response.data;
  },

  /**
   * Cancelar una suscripción
   * Endpoint: POST /api/suscripciones/{id}/cancelar/
   */
  async cancelarSuscripcion(suscripcionId: number) {
    console.log(`❌ Cancelando suscripción ${suscripcionId}...`);
    const response = await api.post(`suscripciones/${suscripcionId}/cancelar/`);
    console.log('✅ Suscripción cancelada exitosamente');
    return response.data;
  },
};

export default MembresiasService;

