import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ReservasService, {
  SesionDisponible,
  ActividadDisponible
} from '../services/reservasService';

interface ActivitiesScreenProps {
  navigation: any;
}

const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();

  // State
  const [sesiones, setSesiones] = useState<SesionDisponible[]>([]);
  const [actividades, setActividades] = useState<ActividadDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservando, setReservando] = useState(false);

  // Filters
  const [filtroActividad, setFiltroActividad] = useState<number | null>(null);
  const [filtroEspacio, setFiltroEspacio] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Modal state
  const [sesionSeleccionada, setSesionSeleccionada] = useState<SesionDisponible | null>(null);
  const [observaciones, setObservaciones] = useState('');

  // Get unique spaces for filter
  const espaciosDisponibles = [...new Set(sesiones.map(s => s.espacio.nombre))].sort();

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      // Load activities and sessions in parallel
      const [actividadesData, sesionesData] = await Promise.all([
        ReservasService.listarActividadesDisponibles(),
        ReservasService.obtenerSesionesDisponibles({
          tipoActividadId: filtroActividad || undefined
        })
      ]);

      setActividades(actividadesData);
      setSesiones(sesionesData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar las sesiones disponibles');
    } finally {
      setLoading(false);
    }
  }, [filtroActividad]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  }, [cargarDatos]);

  const handleReservar = async () => {
    if (!sesionSeleccionada) return;

    try {
      setReservando(true);
      await ReservasService.reservarSesion(sesionSeleccionada.id, observaciones);

      Alert.alert(
        '¡Reserva Exitosa!',
        `Tu reserva para ${sesionSeleccionada.actividad.nombre} ha sido confirmada.`,
        [
          {
            text: 'Ver Mis Reservas',
            onPress: () => {
              setSesionSeleccionada(null);
              setObservaciones('');
              navigation.navigate('MisReservas');
            }
          },
          {
            text: 'Continuar',
            onPress: () => {
              setSesionSeleccionada(null);
              setObservaciones('');
              cargarDatos();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error al reservar:', error);
      const mensaje = error?.response?.data?.error || 'No se pudo completar la reserva';
      Alert.alert('Error', mensaje);
    } finally {
      setReservando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroActividad(null);
    setFiltroEspacio(null);
  };

  // Apply filters
  const sesionesFiltradas = sesiones.filter(sesion => {
    if (filtroEspacio && sesion.espacio.nombre !== filtroEspacio) {
      return false;
    }
    return true;
  });

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]}`;
  };

  if (loading && sesiones.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Actividades</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando sesiones disponibles...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Actividades</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
          <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={[styles.filterSection, { backgroundColor: colors.surface }]}>
        <View style={styles.filterHeader}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            🔍 Filtros
          </Text>
          {(filtroActividad || filtroEspacio) && (
            <TouchableOpacity onPress={limpiarFiltros}>
              <Text style={[styles.clearButton, { color: colors.primary }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {/* Activity Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { borderColor: colors.border },
              !filtroActividad && { backgroundColor: colors.primary }
            ]}
            onPress={() => setFiltroActividad(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: !filtroActividad ? '#FFFFFF' : colors.text }
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {actividades.map((act) => (
            <TouchableOpacity
              key={act.id}
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                filtroActividad === act.id && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFiltroActividad(act.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: filtroActividad === act.id ? '#FFFFFF' : colors.text }
                ]}
              >
                {act.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Space Filter */}
        {espaciosDisponibles.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { borderColor: colors.border },
                !filtroEspacio && { backgroundColor: colors.primary + '40' }
              ]}
              onPress={() => setFiltroEspacio(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.text }
                ]}
              >
                📍 Todos los espacios
              </Text>
            </TouchableOpacity>

            {espaciosDisponibles.map((espacio) => (
              <TouchableOpacity
                key={espacio}
                style={[
                  styles.filterChip,
                  { borderColor: colors.border },
                  filtroEspacio === espacio && { backgroundColor: colors.primary + '40' }
                ]}
                onPress={() => setFiltroEspacio(espacio)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.text }
                  ]}
                >
                  📍 {espacio}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Sessions List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {sesionesFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay sesiones disponibles con los filtros seleccionados
            </Text>
          </View>
        ) : (
          sesionesFiltradas.map((sesion) => (
            <View key={sesion.id} style={[styles.sesionCard, { backgroundColor: colors.surface }]}>
              {/* Activity Header */}
              <View style={styles.sesionHeader}>
                <View
                  style={[
                    styles.activityColor,
                    { backgroundColor: sesion.actividad.color || colors.primary }
                  ]}
                />
                <View style={styles.sesionHeaderText}>
                  <Text style={[styles.activityName, { color: colors.text }]}>
                    {sesion.actividad.nombre}
                  </Text>
                  {sesion.actividad.descripcion && (
                    <Text
                      style={[styles.activityDescription, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {sesion.actividad.descripcion}
                    </Text>
                  )}
                </View>
              </View>

              {/* Session Details */}
              <View style={styles.sesionDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    📅 Fecha
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatFecha(sesion.fecha)}
                  </Text>
                </View>

                {sesion.hora_inicio && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      🕐 Horario
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {sesion.hora_inicio} - {sesion.hora_fin}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    👨‍🏫 Entrenador
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {sesion.entrenador.nombre}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    📍 Espacio
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {sesion.espacio.nombre}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    👥 Disponibilidad
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          sesion.lugares_disponibles > 5
                            ? '#4CAF50'
                            : sesion.lugares_disponibles > 0
                            ? '#FF9800'
                            : '#f87171'
                      }
                    ]}
                  >
                    {sesion.lugares_disponibles} / {sesion.cupo_total} lugares
                  </Text>
                </View>
              </View>

              {/* Reserve Button */}
              <TouchableOpacity
                style={[
                  styles.reserveButton,
                  {
                    backgroundColor: sesion.puede_reservar ? colors.primary : colors.border
                  }
                ]}
                onPress={() => {
                  if (sesion.puede_reservar) {
                    setSesionSeleccionada(sesion);
                  }
                }}
                disabled={!sesion.puede_reservar}
              >
                <Text style={styles.reserveButtonText}>
                  {sesion.puede_reservar ? '📝 Reservar Ahora' : '🚫 No Disponible'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Reservation Modal */}
      <Modal
        visible={sesionSeleccionada !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSesionSeleccionada(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Confirmar Reserva
            </Text>

            {sesionSeleccionada && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>
                    Actividad
                  </Text>
                  <Text style={[styles.modalInfoValue, { color: colors.text }]}>
                    {sesionSeleccionada.actividad.nombre}
                  </Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>
                    Fecha y Hora
                  </Text>
                  <Text style={[styles.modalInfoValue, { color: colors.text }]}>
                    {formatFecha(sesionSeleccionada.fecha)}
                    {sesionSeleccionada.hora_inicio && ` • ${sesionSeleccionada.hora_inicio}`}
                  </Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>
                    Entrenador
                  </Text>
                  <Text style={[styles.modalInfoValue, { color: colors.text }]}>
                    {sesionSeleccionada.entrenador.nombre}
                  </Text>
                </View>

                <View style={styles.modalInfo}>
                  <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>
                    Espacio
                  </Text>
                  <Text style={[styles.modalInfoValue, { color: colors.text }]}>
                    {sesionSeleccionada.espacio.nombre}
                  </Text>
                </View>

                <View style={styles.observacionesContainer}>
                  <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>
                    Observaciones (opcional)
                  </Text>
                  <TextInput
                    style={[
                      styles.observacionesInput,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.background
                      }
                    ]}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    placeholder="Agrega algún comentario..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { borderColor: colors.border }]}
                onPress={() => {
                  setSesionSeleccionada(null);
                  setObservaciones('');
                }}
                disabled={reservando}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: colors.primary }]}
                onPress={handleReservar}
                disabled={reservando}
              >
                {reservando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Confirmar
                  </Text>
                )}
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
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterChips: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sesionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sesionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityColor: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  sesionHeaderText: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
  },
  sesionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  reserveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInfo: {
    marginBottom: 16,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInfoValue: {
    fontSize: 16,
  },
  observacionesContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  observacionesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonConfirm: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActivitiesScreen;
