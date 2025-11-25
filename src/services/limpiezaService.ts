import api from './api';

// ============================================
// INTERFACES
// ============================================

export interface Tarea {
  id: number;
  tarea_nombre: string;
  espacio_nombre: string;
  sede_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  tarea_duracion: number;
  tarea_prioridad: 'alta' | 'media' | 'baja';
  notas: string;
  personal_nombre: string;
  observaciones_completado?: string;
  fecha_completada?: string | null;
}

export interface PersonalLimpieza {
  empleado_id: number;
  empleado_nombre: string;
  email: string;
  telefono: string;
  turno: string;
  sede_id: number;
  sede_nombre: string;
  espacios_asignados: Array<{
    id: number;
    nombre: string;
    sede: string;
  }>;
  tareas_pendientes_count: number;
}

export interface EstadisticasEmpleado {
  tareas_completadas_hoy: number;
  tareas_pendientes_hoy: number;
  total_tareas_hoy: number;
  tareas_completadas_semana: number;
}

// ============================================
// SERVICIO DE LIMPIEZA
// ============================================

class LimpiezaService {
  /**
   * Obtener información del empleado actual (logueado)
   * GET /api/limpieza/personal/me/
   */
  async getEmpleadoActual(): Promise<PersonalLimpieza> {
    try {
      const response = await api.get('/limpieza/personal/me/');
      console.log('✅ Empleado actual obtenido:', response.data);
      return response.data;
    } catch (error: any) {
      // Si es un 404, el usuario no es personal de limpieza (esperado para clientes)
      if (error.response?.status === 404) {
        throw error; // Re-lanzar sin mostrar error en consola
      }
      // Para otros errores, mostrar en consola
      console.error('❌ Error al obtener empleado actual:', error);
      throw error;
    }
  }

  /**
   * Obtener tareas del empleado (filtradas por sede automáticamente en backend)
   * GET /api/limpieza/asignaciones/?fecha=YYYY-MM-DD
   *
   * @param fecha - Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)
   */
  async getTareas(fecha?: string): Promise<Tarea[]> {
    try {
      const params: any = {};

      // Si no se proporciona fecha, usar hoy
      if (fecha) {
        params.fecha = fecha;
      } else {
        const hoy = new Date().toISOString().split('T')[0];
        params.fecha = hoy;
      }

      console.log('📋 Obteniendo tareas con parámetros:', params);
      const response = await api.get('/limpieza/asignaciones/', { params });
      console.log(`✅ ${response.data.length} tareas obtenidas`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener tareas:', error);
      throw error;
    }
  }

  /**
   * Marcar tarea como en progreso
   * POST /api/limpieza/asignaciones/{id}/marcar_en_progreso/
   *
   * @param tareaId - ID de la tarea a iniciar
   */
  async iniciarTarea(tareaId: number): Promise<Tarea> {
    try {
      console.log(`▶️ Iniciando tarea ${tareaId}...`);
      const response = await api.post(
        `/limpieza/asignaciones/${tareaId}/marcar_en_progreso/`
      );
      console.log('✅ Tarea iniciada correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al iniciar tarea:', error);
      throw error;
    }
  }

  /**
   * Marcar tarea como completada
   * POST /api/limpieza/asignaciones/{id}/marcar_completada/
   * Body: { observaciones_completado: string }
   *
   * Nota: El backend guarda automáticamente hora_fin y fecha_completada
   *
   * @param tareaId - ID de la tarea a completar
   * @param observaciones - Observaciones opcionales del empleado
   */
  async completarTarea(
    tareaId: number,
    observaciones?: string
  ): Promise<Tarea> {
    try {
      console.log(`✅ Completando tarea ${tareaId}...`);
      const response = await api.post(
        `/limpieza/asignaciones/${tareaId}/marcar_completada/`,
        {
          observaciones_completado: observaciones || ''
        }
      );
      console.log('✅ Tarea completada correctamente');
      console.log('⏰ Hora de finalización guardada automáticamente:', response.data.hora_fin);
      return response.data;
    } catch (error) {
      console.error('❌ Error al completar tarea:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del empleado
   * (Cálculo local basado en las tareas)
   *
   * @param tareas - Lista de tareas del empleado
   */
  calcularEstadisticas(tareas: Tarea[]): EstadisticasEmpleado {
    const hoy = new Date().toISOString().split('T')[0];

    // Tareas de hoy
    const tareasHoy = tareas.filter(t => t.fecha === hoy);
    const completadasHoy = tareasHoy.filter(t => t.estado === 'completada').length;
    const pendientesHoy = tareasHoy.filter(
      t => t.estado === 'pendiente' || t.estado === 'en_progreso'
    ).length;

    // Tareas de esta semana
    const inicioSemana = this.getInicioSemana(new Date());
    const finSemana = this.getFinSemana(new Date());

    const tareasEstaSemana = tareas.filter(t => {
      const fechaTarea = new Date(t.fecha);
      return fechaTarea >= inicioSemana && fechaTarea <= finSemana;
    });
    const completadasSemana = tareasEstaSemana.filter(
      t => t.estado === 'completada'
    ).length;

    return {
      tareas_completadas_hoy: completadasHoy,
      tareas_pendientes_hoy: pendientesHoy,
      total_tareas_hoy: tareasHoy.length,
      tareas_completadas_semana: completadasSemana
    };
  }

  /**
   * Obtener el lunes de la semana actual
   */
  private getInicioSemana(fecha: Date): Date {
    const dia = fecha.getDay();
    const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar cuando es domingo
    return new Date(fecha.setDate(diff));
  }

  /**
   * Obtener el domingo de la semana actual
   */
  private getFinSemana(fecha: Date): Date {
    const inicioSemana = this.getInicioSemana(new Date(fecha));
    return new Date(inicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  /**
   * Formatear fecha para mostrar
   * @param fecha - Fecha en formato YYYY-MM-DD
   * @returns Fecha formateada como "DD/MM/YYYY"
   */
  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Formatear hora para mostrar
   * @param hora - Hora en formato HH:MM:SS
   * @returns Hora formateada como "HH:MM"
   */
  formatearHora(hora: string | null): string {
    if (!hora) return '--:--';
    return hora.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
  }
}

export default new LimpiezaService();
