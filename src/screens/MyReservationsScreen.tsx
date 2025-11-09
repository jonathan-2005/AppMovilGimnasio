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
      <Text style={styles.feedbackText}>
        {filter === 'Próximas'
          ? 'No tienes reservas próximas. ¡Reserva una sesión para comenzar!'
          : filter === 'Historial'
          ? 'Aún no tienes historial de clases.'
          : filter === 'Canceladas'
          ? 'No hay reservas canceladas.'
          : 'No se encontraron reservas.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mis reservas</Text>

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
          const horaTexto = buildHorario(reserva.horaInicio, reserva.horaFin);
          const cancelable =
            reserva.estado === 'confirmada' && buildDate(reserva).getTime() >= Date.now();

          return (
            <View key={reserva.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{reserva.actividad}</Text>
                <View style={[styles.statusBadge, getStatusStyle(reserva.estado, styles)]}>
                  <Text style={styles.statusText}>{tituloEstado(reserva.estado)}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📅</Text>
                  <Text style={styles.infoText}>{fecha}</Text>
                </View>

                {horaTexto ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🕒</Text>
                    <Text style={styles.infoText}>{horaTexto}</Text>
                  </View>
                ) : null}

                {reserva.espacio ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📍</Text>
                    <Text style={styles.infoText}>
                      {reserva.espacio}
                      {reserva.sede ? ` · ${reserva.sede}` : ''}
                    </Text>
                  </View>
                ) : null}

                {reserva.entrenador ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>👤</Text>
                    <Text style={styles.infoText}>{reserva.entrenador}</Text>
                  </View>
                ) : null}

                {reserva.observaciones ? (
                  <View style={styles.infoNotes}>
                    <Text style={styles.notesTitle}>Notas</Text>
                    <Text style={styles.notesText}>{reserva.observaciones}</Text>
                  </View>
                ) : null}

                {reserva.motivoCancelacion ? (
                  <View style={styles.infoNotes}>
                    <Text style={styles.notesTitle}>Motivo cancelación</Text>
                    <Text style={styles.notesText}>{reserva.motivoCancelacion}</Text>
                  </View>
                ) : null}
              </View>

              {cancelable && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelar(reserva)}
                  disabled={processingId === reserva.id}
                >
                  {processingId === reserva.id ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
      return 'Confirmada';
    case 'pendiente':
      return 'Pendiente';
    case 'cancelada':
      return 'Cancelada';
    case 'asistio':
      return 'Asistió';
    case 'no_asistio':
      return 'No asistió';
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
      color: colors.background,
    },
    feedbackContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 30,
      paddingHorizontal: 20,
    },
    feedbackText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 10,
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
      color: colors.background,
      fontWeight: '600',
    },
    list: {
      flex: 1,
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      marginRight: 12,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
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
      fontWeight: '600',
      fontSize: 12,
    },
    cardBody: {
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    infoIcon: {
      marginRight: 8,
      width: 20,
      textAlign: 'center',
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: 14,
      flex: 1,
    },
    infoNotes: {
      marginTop: 10,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#f5f5f5',
      padding: 10,
      borderRadius: 10,
    },
    notesTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      fontWeight: '600',
    },
    notesText: {
      color: colors.text,
      fontSize: 14,
    },
    cancelButton: {
      marginTop: 4,
      backgroundColor: colors.error,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: 14,
    },
  });

export default MyReservationsScreen;


