import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ReservasService, { ReservaCliente } from '../services/reservasService';

type ReservaFilter = 'Próximas' | 'Historial' | 'Canceladas' | 'Todas';

interface MyReservationsScreenProps {
  navigation: any;
}

const FILTERS: ReservaFilter[] = ['Próximas', 'Historial', 'Canceladas', 'Todas'];

const MyReservationsScreen: React.FC<MyReservationsScreenProps> = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [reservas, setReservas] = useState<ReservaCliente[]>([]);
  const [filtered, setFiltered] = useState<ReservaCliente[]>([]);
  const [filter, setFilter] = useState<ReservaFilter>('Próximas');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
  const themeIcon = isDarkMode ? '☀️' : '🌙';

  const cleanupBanner = useCallback(() => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
  }, []);

  const showBanner = useCallback(
    (type: 'success' | 'error', message: string) => {
      cleanupBanner();
      setBanner({ type, message });
      bannerTimeoutRef.current = setTimeout(() => {
        setBanner(null);
        bannerTimeoutRef.current = null;
      }, 4500);
    },
    [cleanupBanner]
  );

  const fetchReservas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ReservasService.listarMisReservas();
      setReservas(
        data.sort((a, b) => {
          const dateA = buildDate(a);
          const dateB = buildDate(b);
          return dateA.getTime() - dateB.getTime();
        })
      );
    } catch (err: any) {
      console.error('Error al obtener reservas del cliente:', err?.response?.data || err?.message);
      setError('No pudimos obtener tus reservas. Intenta nuevamente.');
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
    return () => cleanupBanner();
  }, [fetchReservas, cleanupBanner]);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let data = [...reservas];

    if (filter === 'Próximas') {
      data = data.filter(
        (reserva) => reserva.estado === 'confirmada' && buildDate(reserva).getTime() >= now.getTime()
      );
    } else if (filter === 'Historial') {
      data = data.filter(
        (reserva) =>
          reserva.estado === 'confirmada' && buildDate(reserva).getTime() < now.getTime()
      );
    } else if (filter === 'Canceladas') {
      data = data.filter((reserva) => reserva.estado === 'cancelada');
    }

    setFiltered(data);
  }, [reservas, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReservas();
    setRefreshing(false);
  }, [fetchReservas]);

  const handleCancelar = useCallback(
    (reserva: ReservaCliente) => {
      Alert.alert(
        'Cancelar reserva',
        `¿Seguro que deseas cancelar tu lugar en ${reserva.actividad}?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, cancelar',
            style: 'destructive',
            onPress: async () => {
              try {
                setProcessingId(reserva.id);
                await ReservasService.cancelarReserva(reserva.id);
                showBanner('success', 'Reserva cancelada correctamente.');
                await fetchReservas();
              } catch (error: any) {
                const detalle =
                  error?.response?.data?.error ||
                  error?.response?.data?.detail ||
                  error?.message;
                showBanner('error', detalle || 'No pudimos cancelar la reserva.');
              } finally {
                setProcessingId(null);
              }
            },
          },
        ]
      );
    },
    [fetchReservas, showBanner]
  );

  const renderEmptyState = () => (
    <View style={styles.feedbackContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>
        {filter === 'Próximas'
          ? 'No tienes reservas próximas'
          : filter === 'Historial'
          ? 'Aún no tienes historial'
          : filter === 'Canceladas'
          ? 'No hay reservas canceladas'
          : 'No hay reservas'}
      </Text>
      <Text style={styles.feedbackText}>
        {filter === 'Próximas' && '¡Reserva una sesión para comenzar!'}
      </Text>
      {filter === 'Próximas' && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Actividades')}
        >
          <Text style={styles.ctaButtonText}>Ver Actividades Disponibles</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mis Reservas</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
            <Text style={styles.themeIcon}>{themeIcon}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {banner && (
        <View
          style={[
            styles.banner,
            banner.type === 'success' ? styles.bannerSuccess : styles.bannerError,
          ]}
        >
          <Text style={styles.bannerText}>{banner.message}</Text>
          <TouchableOpacity style={styles.bannerClose} onPress={() => setBanner(null)}>
            <Text style={styles.bannerCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterButton,
                filter === option && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(option)}
            >
              <Text
                style={[styles.filterText, filter === option && styles.filterTextActive]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.feedbackText}>Cargando reservas…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReservas}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!loading && !error && filtered.length === 0 && renderEmptyState()}

        {filtered.map((reserva) => {
          const fecha = formatFecha(reserva.fechaSesion);
          const fechaCorta = formatFechaCorta(reserva.fechaSesion);
          const horaTexto = buildHorario(reserva.horaInicio, reserva.horaFin);
          const cancelable =
            reserva.estado === 'confirmada' && buildDate(reserva).getTime() >= Date.now();

          return (
            <View key={reserva.id} style={styles.card}>
              {/* Status Badge at Top */}
              <View style={styles.cardTopBar}>
                <View style={[styles.statusBadge, getStatusStyle(reserva.estado, styles)]}>
                  <Text style={styles.statusText}>{tituloEstado(reserva.estado)}</Text>
                </View>
              </View>

              {/* Activity Name */}
              <View style={styles.activityHeader}>
                <Text style={styles.activityName}>{reserva.actividad}</Text>
              </View>

              {/* Highlighted Date & Time */}
              <View style={styles.dateTimeSection}>
                <View style={styles.dateTimeBox}>
                  <Text style={styles.dateTimeIcon}>📅</Text>
                  <View style={styles.dateTimeText}>
                    <Text style={styles.dateLabel}>Fecha</Text>
                    <Text style={styles.dateValue}>{fechaCorta}</Text>
                  </View>
                </View>

                {horaTexto && (
                  <View style={styles.dateTimeBox}>
                    <Text style={styles.dateTimeIcon}>🕐</Text>
                    <View style={styles.dateTimeText}>
                      <Text style={styles.dateLabel}>Horario</Text>
                      <Text style={styles.dateValue}>{horaTexto}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Details Grid */}
              <View style={styles.detailsSection}>
                {reserva.entrenador && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>👨‍🏫</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Entrenador</Text>
                      <Text style={styles.detailValue}>{reserva.entrenador}</Text>
                    </View>
                  </View>
                )}

                {reserva.espacio && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Espacio</Text>
                      <Text style={styles.detailValue}>{reserva.espacio}</Text>
                    </View>
                  </View>
                )}

                {reserva.sede && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>🏢</Text>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Sede</Text>
                      <Text style={styles.detailValue}>{reserva.sede}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Observaciones */}
              {reserva.observaciones && (
                <View style={styles.infoNotes}>
                  <Text style={styles.notesTitle}>📝 Observaciones</Text>
                  <Text style={styles.notesText}>{reserva.observaciones}</Text>
                </View>
              )}

              {/* Motivo Cancelación */}
              {reserva.motivoCancelacion && (
                <View style={[styles.infoNotes, styles.cancelationNote]}>
                  <Text style={styles.notesTitle}>❌ Motivo de Cancelación</Text>
                  <Text style={styles.notesText}>{reserva.motivoCancelacion}</Text>
                </View>
              )}

              {/* Cancel Button */}
              {cancelable && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelar(reserva)}
                  disabled={processingId === reserva.id}
                >
                  {processingId === reserva.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.cancelButtonText}>❌ Cancelar Reserva</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const getStatusStyle = (estado: string, styles: ReturnType<typeof createStyles>) => {
  switch (estado) {
    case 'confirmada':
    case 'pendiente':
      return styles.statusBadgeSuccess;
    case 'cancelada':
      return styles.statusBadgeError;
    case 'asistio':
      return styles.statusBadgeInfo;
    default:
      return styles.statusBadgeNeutral;
  }
};

const tituloEstado = (estado: string) => {
  switch (estado) {
    case 'confirmada':
      return '✓ Confirmada';
    case 'pendiente':
      return '⏳ Pendiente';
    case 'cancelada':
      return '✕ Cancelada';
    case 'asistio':
      return '✓ Asistió';
    case 'no_asistio':
      return '✕ No asistió';
    default:
      return estado;
  }
};

const buildHorario = (inicio?: string | null, fin?: string | null) => {
  if (inicio && fin) {
    return `${inicio} - ${fin}`;
  }
  if (inicio) {
    return inicio;
  }
  return null;
};

const buildDate = (reserva: ReservaCliente) => {
  const base = reserva.fechaSesion || reserva.fechaReserva;
  if (!base) {
    return new Date();
  }

  const hora = reserva.horaInicio ?? '00:00';
  const isoLike = `${base}T${hora.length === 5 ? `${hora}:00` : hora}`;
  const date = new Date(isoLike);
  if (isNaN(date.getTime())) {
    return new Date(base);
  }
  return date;
};

const formatFecha = (fecha: string) => {
  if (!fecha) {
    return 'Fecha no disponible';
  }
  const date = new Date(fecha);
  if (isNaN(date.getTime())) {
    return fecha;
  }
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatFechaCorta = (fecha: string) => {
  if (!fecha) {
    return 'N/A';
  }
  const date = new Date(fecha);
  if (isNaN(date.getTime())) {
    return fecha;
  }
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]}`;
};

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.text,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    themeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    themeIcon: {
      fontSize: 18,
    },
    banner: {
      marginHorizontal: 20,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
    },
    bannerSuccess: {
      backgroundColor: isDarkMode ? '#12361f' : '#e6f4ea',
      borderColor: isDarkMode ? '#1f6e3b' : '#9ad5b3',
    },
    bannerError: {
      backgroundColor: isDarkMode ? '#3a1414' : '#fdeaea',
      borderColor: isDarkMode ? '#8c2f2f' : '#f0b2b2',
    },
    bannerText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      marginRight: 12,
    },
    bannerClose: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
    },
    bannerCloseText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    filtersContainer: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    filterButton: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginRight: 10,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    feedbackContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    feedbackText: {
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 14,
      marginBottom: 20,
    },
    ctaButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 8,
    },
    ctaButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    errorText: {
      color: '#f87171',
      textAlign: 'center',
      fontSize: 14,
      marginBottom: 10,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    list: {
      flex: 1,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 0,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
      overflow: 'hidden',
    },
    cardTopBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'flex-end',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusBadgeSuccess: {
      backgroundColor: isDarkMode ? '#194d30' : '#d1fae5',
    },
    statusBadgeError: {
      backgroundColor: isDarkMode ? '#4b1f1f' : '#fee2e2',
    },
    statusBadgeInfo: {
      backgroundColor: isDarkMode ? '#123c56' : '#dbeafe',
    },
    statusBadgeNeutral: {
      backgroundColor: isDarkMode ? '#2d2d2d' : '#e5e7eb',
    },
    statusText: {
      color: isDarkMode ? colors.text : '#1f2937',
      fontWeight: '700',
      fontSize: 12,
    },
    activityHeader: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    activityName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    dateTimeSection: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
    },
    dateTimeBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    dateTimeIcon: {
      fontSize: 24,
      marginRight: 8,
    },
    dateTimeText: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    dateValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    detailsSection: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    detailIcon: {
      fontSize: 20,
      marginRight: 12,
      width: 28,
    },
    detailTextContainer: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    detailValue: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    infoNotes: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#f5f5f5',
      padding: 12,
      borderRadius: 12,
    },
    cancelationNote: {
      backgroundColor: isDarkMode ? '#3a1414' : '#fef2f2',
      borderWidth: 1,
      borderColor: isDarkMode ? '#6b1f1f' : '#fecaca',
    },
    notesTitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 6,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    notesText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    cancelButton: {
      margin: 16,
      marginTop: 4,
      backgroundColor: '#ef4444',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 15,
    },
  });

export default MyReservationsScreen;
