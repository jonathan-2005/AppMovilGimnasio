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
};

export default ReservasService;

