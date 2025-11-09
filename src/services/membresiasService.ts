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
  async listarActivas(): Promise<MembresiaDisponible[]> {
    const response = await api.get('membresias/activas/');
    return ensureArray<MembresiaDisponible>(response.data);
  },

  async obtenerMisMembresias(): Promise<MembresiaCliente[]> {
    const response = await api.get('membresias/mis_membresias/');
    return ensureArray<MembresiaCliente>(response.data);
  },

  async adquirirMembresia(id: number, payload: AdquirirMembresiaPayload = {}) {
    const response = await api.post(`membresias/${id}/adquirir/`, payload);
    return response.data;
  },
};

export default MembresiasService;

