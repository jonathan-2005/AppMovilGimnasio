import api from './api';

export interface PerfilCliente {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento?: string;
  sexo?: string;
  direccion?: string;
  telefono: string;
  email: string;
  sede: number;
  sede_nombre: string;
  objetivo_fitness?: string;
  nivel_experiencia: string;
  estado: string;
  fecha_registro: string;
  // Datos de contacto de emergencia (vienen como campos planos del backend)
  nombre_contacto?: string;
  telefono_contacto?: string;
  parentesco?: string;
  membresia_activa?: {
    nombre_plan: string;
    fecha_fin: string;
    dias_restantes: number;
  };
}

export interface ActualizarPerfilPayload {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  objetivo_fitness?: string;
  nivel_experiencia?: string;
  nombre_contacto?: string;
  telefono_contacto?: string;
  parentesco?: string;
}

export const PerfilService = {
  /**
   * Obtener perfil del cliente autenticado
   * Endpoint: GET /api/clientes/mi_perfil/
   */
  async obtenerMiPerfil(): Promise<PerfilCliente> {
    console.log('👤 Obteniendo mi perfil...');
    const response = await api.get('clientes/mi_perfil/');
    console.log('✅ Perfil obtenido');
    return response.data;
  },

  /**
   * Actualizar perfil del cliente autenticado
   * Endpoint: PATCH /api/clientes/actualizar_perfil/
   */
  async actualizarPerfil(datos: ActualizarPerfilPayload): Promise<PerfilCliente> {
    console.log('✏️ Actualizando perfil...');
    const response = await api.patch('clientes/actualizar_perfil/', datos);
    console.log('✅ Perfil actualizado');
    return response.data.data;
  },
};

export default PerfilService;
