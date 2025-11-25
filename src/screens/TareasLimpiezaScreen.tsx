import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLimpieza } from '../context/LimpiezaContext';
import limpiezaService, { Tarea } from '../services/limpiezaService';

interface TareasLimpiezaScreenProps {
  navigation: any;
}

const TareasLimpiezaScreen: React.FC<TareasLimpiezaScreenProps> = ({ navigation }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { empleado, loadEmpleado, clearEmpleado, tareas, loadTareas, actualizarTarea, loadingTareas } = useLimpieza();

  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showCompletarModal, setShowCompletarModal] = useState(false);
  const [tareaACompletar, setTareaACompletar] = useState<Tarea | null>(null);
  const [observaciones, setObservaciones] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    inicializarDatos();
  }, []);

  // Recargar tareas cuando cambia la fecha
  useEffect(() => {
    if (empleado) {
      loadTareas(fechaSeleccionada);
    }
  }, [fechaSeleccionada]);

  const inicializarDatos = async () => {
    try {
      await loadEmpleado();
      await loadTareas(fechaSeleccionada);
    } catch (error) {
      console.error('Error al inicializar datos:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTareas(fechaSeleccionada);
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleIniciarTarea = async (tarea: Tarea) => {
    Alert.alert(
      '¿Iniciar tarea?',
      `¿Deseas iniciar la tarea "${tarea.tarea_nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              const tareaActualizada = await limpiezaService.iniciarTarea(tarea.id);
              actualizarTarea(tareaActualizada);
              Alert.alert('¡Éxito!', 'Tarea iniciada correctamente');
            } catch (error) {
              console.error('Error al iniciar tarea:', error);
              Alert.alert('Error', 'No se pudo iniciar la tarea');
            }
          }
        }
      ]
    );
  };

  const handleAbrirModalCompletar = (tarea: Tarea) => {
    setTareaACompletar(tarea);
    setObservaciones('');
    setShowCompletarModal(true);
  };

  const handleCompletarTarea = async () => {
    if (!tareaACompletar) return;

    try {
      const tareaActualizada = await limpiezaService.completarTarea(
        tareaACompletar.id,
        observaciones
      );
      actualizarTarea(tareaActualizada);
      setShowCompletarModal(false);
      setTareaACompletar(null);
      setObservaciones('');
      Alert.alert('¡Éxito!', 'Tarea completada correctamente');
    } catch (error) {
      console.error('Error al completar tarea:', error);
      Alert.alert('Error', 'No se pudo completar la tarea');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: () => {
            clearEmpleado();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return { bg: '#FFF3CD', text: '#856404' };
      case 'en_progreso':
        return { bg: '#D1ECF1', text: '#0C5460' };
      case 'completada':
        return { bg: '#D4EDDA', text: '#155724' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return { bg: '#F8D7DA', text: '#721C24', icon: '🔴' };
      case 'media':
        return { bg: '#FFF3CD', text: '#856404', icon: '🟡' };
      case 'baja':
        return { bg: '#D4EDDA', text: '#155724', icon: '🟢' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', icon: '⚪' };
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return '⏳';
      case 'en_progreso':
        return '▶️';
      case 'completada':
        return '✅';
      default:
        return '⚪';
    }
  };

  const renderTareaCard = (tarea: Tarea) => {
    const estadoColor = getEstadoColor(tarea.estado);
    const prioridadColor = getPrioridadColor(tarea.tarea_prioridad);

    return (
      <View key={tarea.id} style={[styles.tareaCard, { backgroundColor: colors.surface }]}>
        {/* Header de la card con badges */}
        <View style={styles.tareaHeader}>
          <View style={[styles.badge, { backgroundColor: prioridadColor.bg }]}>
            <Text style={[styles.badgeText, { color: prioridadColor.text }]}>
              {prioridadColor.icon} {tarea.tarea_prioridad.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: estadoColor.bg }]}>
            <Text style={[styles.badgeText, { color: estadoColor.text }]}>
              {getEstadoIcon(tarea.estado)} {tarea.estado.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Nombre de la tarea */}
        <Text style={[styles.tareaNombre, { color: colors.text }]}>
          🧹 {tarea.tarea_nombre}
        </Text>

        {/* Información de la tarea */}
        <View style={styles.tareaInfo}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📍 Espacio:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{tarea.espacio_nombre}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>⏱️ Duración:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{tarea.tarea_duracion} min</Text>
          </View>

          {tarea.notas && (
            <View style={styles.notasContainer}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>💬 Instrucciones:</Text>
              <Text style={[styles.notasText, { color: colors.text }]}>{tarea.notas}</Text>
            </View>
          )}

          {tarea.estado === 'completada' && tarea.hora_fin && (
            <View style={styles.completadaInfo}>
              <Text style={[styles.completadaText, { color: '#155724' }]}>
                ✓ Completada a las {limpiezaService.formatearHora(tarea.hora_fin)}
              </Text>
            </View>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.accionesContainer}>
          {tarea.estado === 'pendiente' && (
            <TouchableOpacity
              style={[styles.btnAccion, styles.btnIniciar]}
              onPress={() => handleIniciarTarea(tarea)}
            >
              <Text style={styles.btnAccionText}>▶️ INICIAR</Text>
            </TouchableOpacity>
          )}

          {tarea.estado === 'en_progreso' && (
            <TouchableOpacity
              style={[styles.btnAccion, styles.btnCompletar]}
              onPress={() => handleAbrirModalCompletar(tarea)}
            >
              <Text style={styles.btnAccionText}>✅ COMPLETAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Calcular estadísticas
  const stats = empleado && tareas.length > 0
    ? limpiezaService.calcularEstadisticas(tareas)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hola, {empleado?.empleado_nombre.split(' ')[0] || 'Empleado'} 👋
          </Text>
          <Text style={[styles.sedeInfo, { color: colors.textSecondary }]}>
            🏢 {empleado?.sede_nombre || 'Cargando...'}
          </Text>
          <Text style={[styles.turnoInfo, { color: colors.textSecondary }]}>
            🕐 Turno: {empleado?.turno || 'N/A'}
          </Text>
        </View>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Fecha selector - por ahora solo muestra la fecha de hoy */}
      <View style={styles.fechaContainer}>
        <Text style={[styles.fechaLabel, { color: colors.text }]}>📅 Mis Tareas - Hoy</Text>
        <Text style={[styles.fechaValue, { color: colors.textSecondary }]}>
          {limpiezaService.formatearFecha(fechaSeleccionada)}
        </Text>
      </View>

      {/* Estadísticas rápidas */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statValue}>{stats.tareas_completadas_hoy}/{stats.total_tareas_hoy}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hoy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statValue}>{stats.tareas_pendientes_hoy}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statValue}>{stats.tareas_completadas_semana}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Esta Semana</Text>
          </View>
        </View>
      )}

      {/* Lista de tareas */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loadingTareas ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando tareas...
            </Text>
          </View>
        ) : tareas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No tienes tareas para esta fecha
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Desliza hacia abajo para actualizar
            </Text>
          </View>
        ) : (
          <View style={styles.tareasContainer}>
            {tareas.map(tarea => renderTareaCard(tarea))}
          </View>
        )}

        {/* Espacio al final para scroll */}
        <View style={{ height: 150 }} />
      </ScrollView>

      {/* Botones del footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('PerfilLimpieza')}
        >
          <Text style={[styles.footerButtonText, { color: colors.text }]}>
            👤 Mi Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para completar tarea */}
      <Modal
        visible={showCompletarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompletarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>✅ Completar Tarea</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCompletarModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>Tarea:</Text>
              <Text style={[styles.modalValue, { color: colors.textSecondary }]}>
                {tareaACompletar?.tarea_nombre}
              </Text>

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>Espacio:</Text>
              <Text style={[styles.modalValue, { color: colors.textSecondary }]}>
                {tareaACompletar?.espacio_nombre}
              </Text>

              <Text style={[styles.modalLabel, { color: colors.text, marginTop: 16 }]}>
                Observaciones (opcional):
              </Text>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Agregar comentarios..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={observaciones}
                onChangeText={setObservaciones}
                textAlignVertical="top"
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  ℹ️ Se guardará automáticamente la hora de finalización
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowCompletarModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCompletarTarea}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sedeInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  turnoInfo: {
    fontSize: 14,
  },
  themeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  fechaContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fechaLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  fechaValue: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  tareasContainer: {
    paddingHorizontal: 20,
  },
  tareaCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tareaHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tareaNombre: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  tareaInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  notasContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  notasText: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  completadaInfo: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#D4EDDA',
    borderRadius: 8,
  },
  completadaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accionesContainer: {
    marginTop: 16,
    gap: 8,
  },
  btnAccion: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnIniciar: {
    backgroundColor: '#3b82f6',
  },
  btnCompletar: {
    backgroundColor: '#10b981',
  },
  btnAccionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  footerContainer: {
    padding: 20,
    paddingBottom: 30,
    gap: 10,
  },
  footerButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalValue: {
    fontSize: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginTop: 8,
    minHeight: 100,
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoBoxText: {
    fontSize: 13,
    color: '#1e40af',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#10b981',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TareasLimpiezaScreen;
