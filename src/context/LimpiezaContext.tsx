import React, { createContext, useContext, useState, ReactNode } from 'react';
import limpiezaService, { PersonalLimpieza, Tarea } from '../services/limpiezaService';

// ============================================
// INTERFACE DEL CONTEXTO
// ============================================

interface LimpiezaContextType {
  // Datos del empleado
  empleado: PersonalLimpieza | null;
  loadEmpleado: () => Promise<void>;
  clearEmpleado: () => void;

  // Tareas
  tareas: Tarea[];
  loadTareas: (fecha?: string) => Promise<void>;
  actualizarTarea: (tareaActualizada: Tarea) => void;

  // Estados de carga
  loadingEmpleado: boolean;
  loadingTareas: boolean;

  // Errores
  error: string | null;
  clearError: () => void;
}

// ============================================
// CREACIÓN DEL CONTEXTO
// ============================================

const LimpiezaContext = createContext<LimpiezaContextType | undefined>(undefined);

// ============================================
// PROVEEDOR DEL CONTEXTO
// ============================================

interface LimpiezaProviderProps {
  children: ReactNode;
}

export const LimpiezaProvider: React.FC<LimpiezaProviderProps> = ({ children }) => {
  // Estados
  const [empleado, setEmpleado] = useState<PersonalLimpieza | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loadingEmpleado, setLoadingEmpleado] = useState(false);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar información del empleado logueado
   */
  const loadEmpleado = async () => {
    setLoadingEmpleado(true);
    setError(null);

    try {
      console.log('🔄 Cargando información del empleado...');
      const data = await limpiezaService.getEmpleadoActual();
      setEmpleado(data);
      console.log('✅ Empleado cargado:', data.empleado_nombre);
    } catch (err: any) {
      console.error('❌ Error al cargar empleado:', err);
      setError('No se pudo cargar la información del empleado');
      throw err;
    } finally {
      setLoadingEmpleado(false);
    }
  };

  /**
   * Limpiar datos del empleado (al cerrar sesión)
   */
  const clearEmpleado = () => {
    console.log('🧹 Limpiando datos del empleado...');
    setEmpleado(null);
    setTareas([]);
    setError(null);
  };

  /**
   * Cargar tareas del empleado
   * @param fecha - Fecha en formato YYYY-MM-DD (opcional)
   */
  const loadTareas = async (fecha?: string) => {
    setLoadingTareas(true);
    setError(null);

    try {
      const fechaMostrar = fecha || new Date().toISOString().split('T')[0];
      console.log(`🔄 Cargando tareas para la fecha: ${fechaMostrar}`);
      const data = await limpiezaService.getTareas(fecha);
      setTareas(data);
      console.log(`✅ ${data.length} tareas cargadas`);
    } catch (err: any) {
      console.error('❌ Error al cargar tareas:', err);
      setError('No se pudieron cargar las tareas');
      throw err;
    } finally {
      setLoadingTareas(false);
    }
  };

  /**
   * Actualizar una tarea específica en el estado local
   * (Útil después de iniciar o completar una tarea)
   */
  const actualizarTarea = (tareaActualizada: Tarea) => {
    console.log(`🔄 Actualizando tarea ${tareaActualizada.id} en el estado local`);
    setTareas(prevTareas =>
      prevTareas.map(tarea =>
        tarea.id === tareaActualizada.id ? tareaActualizada : tarea
      )
    );
  };

  /**
   * Limpiar errores
   */
  const clearError = () => {
    setError(null);
  };

  // Valor del contexto
  const value: LimpiezaContextType = {
    empleado,
    loadEmpleado,
    clearEmpleado,
    tareas,
    loadTareas,
    actualizarTarea,
    loadingEmpleado,
    loadingTareas,
    error,
    clearError
  };

  return (
    <LimpiezaContext.Provider value={value}>
      {children}
    </LimpiezaContext.Provider>
  );
};

// ============================================
// HOOK PERSONALIZADO
// ============================================

/**
 * Hook para usar el contexto de limpieza
 * Lanza error si se usa fuera del LimpiezaProvider
 */
export const useLimpieza = (): LimpiezaContextType => {
  const context = useContext(LimpiezaContext);

  if (!context) {
    throw new Error('useLimpieza debe ser usado dentro de un LimpiezaProvider');
  }

  return context;
};

export default LimpiezaContext;
