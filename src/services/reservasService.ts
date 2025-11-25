import api from './api';

export interface ActividadDisponible {
  id: number;
  nombre: string;
  descripcion?: string;
  duracion_default?: string;
  duracion_minutos?: number;
  color_hex: string;
  sesiones_disponibles: number;
  proxima_sesion?: {
    id: number;
    fecha: string;
    hora_inicio?: string;
    hora_fin?: string;
    lugares_disponibles: number;
    estado: string;
    entrenador?: string;
    espacio?: string;
  } | null;
}

export interface SesionDisponible {
  id: number;
  fecha: string;
  estado: string;
  actividad: {
    id: number;
    nombre: string;
    descripcion?: string;
    color?: string;
    duracion?: string;
  };
  entrenador: {
    id: number;
    nombre: string;
    especialidad?: string;
  };
  espacio: {
    id: number;
    nombre: string;
    capacidad?: number;
  };
  sede: {
    id: number;
    nombre: string;
  };
  hora_inicio?: string | null;
  hora_fin?: string | null;
  cupo_total: number;
  lugares_disponibles: number;
  puede_reservar: boolean;
  categoria: 'premium' | 'basico';
}

export interface SesionReservaResponse {
  message: string;
  data: any;
}

export interface ReservaCliente {
  id: number;
  estado: string;
  actividad: string;
  fechaSesion: string;
  horaInicio?: string | null;
  horaFin?: string | null;
  sede?: string | null;
  espacio?: string | null;
  entrenador?: string | null;
  observaciones?: string | null;
  fechaReserva: string;
  fechaCancelacion?: string | null;
  motivoCancelacion?: string | null;
}

export interface CancelarReservaResponse {
  mensaje: string;
  estado?: string;
}

const normalizeArrayResponse = <T,>(data: any): T[] => {
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

interface SesionesParams {
  tipoActividadId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

export const ReservasService = {
  /**
   * Listar actividades disponibles con sus sesiones
   * Endpoint: GET /api/horarios/tipos-actividad/
   */
  async listarActividadesDisponibles(): Promise<ActividadDisponible[]> {
    console.log('📋 Obteniendo actividades disponibles...');
    const response = await api.get('horarios/tipos-actividad/', {
      params: { activo: true }
    });
    console.log(`✅ ${response.data.length} actividades encontradas`);
    return normalizeArrayResponse<ActividadDisponible>(response.data);
  },

  /**
   * Obtener sesiones disponibles para reservar
   * Endpoint: GET /api/horarios/sesiones/disponibles/
   * El backend filtra automáticamente por la sede del cliente autenticado
   */
  async obtenerSesionesDisponibles(params?: SesionesParams): Promise<SesionDisponible[]> {
    console.log('📅 Obteniendo sesiones disponibles...');
    const queryParams: Record<string, any> = {};

    if (params?.tipoActividadId) {
      queryParams.tipo_actividad = params.tipoActividadId;
    }

    if (params?.fechaDesde) {
      queryParams.fecha_desde = params.fechaDesde;
    }

    if (params?.fechaHasta) {
      queryParams.fecha_hasta = params.fechaHasta;
    }

    const response = await api.get('horarios/sesiones/disponibles/', {
      params: queryParams,
    });

    console.log(`✅ ${response.data.length} sesiones disponibles encontradas`);
    return normalizeArrayResponse<SesionDisponible>(response.data);
  },

  /**
   * Reservar una sesión de clase
   * Endpoint: POST /api/horarios/reservas-clases/
   * El backend infiere automáticamente el cliente del token
   */
  async reservarSesion(sesionId: number, observaciones?: string): Promise<SesionReservaResponse> {
    console.log(`📝 Reservando sesión ${sesionId}...`);
    const response = await api.post('horarios/reservas-clases/', {
      sesion_clase: sesionId,
      observaciones: observaciones || ''
    });

    console.log('✅ Reserva creada exitosamente');
    return response.data as SesionReservaResponse;
  },

  /**
   * Obtener mis reservas
   * Endpoint: GET /api/horarios/reservas-clases/mis_reservas/
   * El backend filtra automáticamente por el cliente autenticado
   */
  async listarMisReservas(): Promise<ReservaCliente[]> {
    console.log('📋 Obteniendo mis reservas...');
    const response = await api.get('horarios/reservas-clases/mis_reservas/');
    const items = normalizeArrayResponse<any>(response.data);
    console.log(`✅ ${items.length} reservas encontradas`);
    return items.map(mapReservaCliente);
  },

  /**
   * Cancelar una reserva
   * Endpoint: POST /api/horarios/reservas-clases/{id}/cancelar/
   */
  async cancelarReserva(reservaId: number, motivo?: string): Promise<CancelarReservaResponse> {
    console.log(`❌ Cancelando reserva ${reservaId}...`);
    const response = await api.post(`horarios/reservas-clases/${reservaId}/cancelar/`, {
      motivo: motivo || 'Cancelado por el cliente'
    });
    console.log('✅ Reserva cancelada exitosamente');
    return response.data as CancelarReservaResponse;
  },
};

export default ReservasService;

const mapReservaCliente = (item: any): ReservaCliente => {
  const sesion = item?.sesion_detalle ?? {};
  const horario = sesion?.horario_detalle ?? {};
  const espacio = sesion?.espacio_efectivo_detalle ?? horario?.espacio_detalle ?? {};
  const entrenador = sesion?.entrenador_efectivo_detalle ?? horario?.entrenador_detalle ?? {};

  return {
    id: item?.id ?? 0,
    estado: item?.estado ?? 'pendiente',
    actividad:
      item?.actividad_nombre ??
      horario?.tipo_actividad_detalle?.nombre ??
      sesion?.horario?.tipo_actividad?.nombre ??
      'Actividad',
    fechaSesion: item?.fecha_sesion ?? sesion?.fecha ?? '',
    horaInicio: formatHora(item?.hora_inicio ?? sesion?.hora_inicio_efectiva),
    horaFin: formatHora(item?.hora_fin ?? sesion?.hora_fin_efectiva),
    sede:
      espacio?.sede_nombre ??
      horario?.sede_nombre ??
      espacio?.sede?.nombre ??
      null,
    espacio: espacio?.nombre ?? horario?.espacio_detalle?.nombre ?? null,
    entrenador: entrenador?.nombre_completo ?? null,
    observaciones: item?.observaciones ?? null,
    fechaReserva: item?.fecha_reserva ?? '',
    fechaCancelacion: item?.fecha_cancelacion ?? null,
    motivoCancelacion: item?.motivo_cancelacion ?? null,
  };
};

const formatHora = (hora?: string | null): string | null => {
  if (!hora) {
    return null;
  }

  if (hora.length === 5) {
    return hora;
  }

  // Formato HH:MM:SS -> devolver HH:MM
  if (hora.length >= 5) {
    return hora.slice(0, 5);
  }

  return hora;
};
