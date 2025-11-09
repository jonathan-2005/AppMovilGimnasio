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
  mensaje: string;
  reserva: any;
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
  soloDisponibles?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
}

export const ReservasService = {
  async listarActividadesDisponibles(): Promise<ActividadDisponible[]> {
    const response = await api.get('horarios/api/actividades/disponibles/');
    return normalizeArrayResponse<ActividadDisponible>(response.data);
  },

  async obtenerSesionesDisponibles(params?: SesionesParams): Promise<SesionDisponible[]> {
    const queryParams: Record<string, any> = {
      ordering: 'fecha',
    };

    if (params?.tipoActividadId) {
      queryParams.tipo_actividad = params.tipoActividadId;
    }

    if (params?.soloDisponibles !== undefined) {
      queryParams.solo_disponibles = params.soloDisponibles;
    }

    if (params?.fechaDesde) {
      queryParams.fecha_desde = params.fechaDesde;
    }

    if (params?.fechaHasta) {
      queryParams.fecha_hasta = params.fechaHasta;
    }

    const response = await api.get('horarios/api/sesiones/disponibles/', {
      params: queryParams,
    });

    return normalizeArrayResponse<SesionDisponible>(response.data);
  },

  async reservarSesion(sesionId: number, observaciones?: string): Promise<SesionReservaResponse> {
    const response = await api.post(`horarios/api/sesiones/${sesionId}/reservar/`, {
      observaciones,
    });

    return response.data as SesionReservaResponse;
  },

  async listarMisReservas(): Promise<ReservaCliente[]> {
    const response = await api.get('horarios/api/reservas-clases/mis_reservas/');
    const items = normalizeArrayResponse<any>(response.data);
    return items.map(mapReservaCliente);
  },

  async cancelarReserva(reservaId: number, motivo?: string): Promise<CancelarReservaResponse> {
    const response = await api.post(`horarios/api/reservas-clases/${reservaId}/cancelar/`, {
      motivo,
    });
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

