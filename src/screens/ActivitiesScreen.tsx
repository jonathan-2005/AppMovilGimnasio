import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ReservasService, { ActividadDisponible } from '../services/reservasService';

interface ActivitiesScreenProps {
  navigation: any;
}

const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [activities, setActivities] = useState<ActividadDisponible[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await ReservasService.listarActividadesDisponibles();
      setActivities(data);
    } catch (error: any) {
      console.error('Error al obtener actividades:', error?.response?.data || error?.message);
      setErrorMessage('No pudimos obtener las actividades. Intenta de nuevo.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  }, [fetchActivities]);

  const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
  const themeIcon = isDarkMode ? '☀️' : '🌙';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Actividades</Text>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{themeIcon}</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.feedbackText}>Cargando actividades…</Text>
        </View>
      )}

      {errorMessage && !loading && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {!loading && !errorMessage && activities.length === 0 && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>No hay actividades disponibles en este momento.</Text>
          </View>
        )}

        {activities.map((actividad) => (
          <View key={actividad.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: actividad.color_hex || colors.primary }]}>
                <Text style={styles.iconText}>{actividad.nombre.charAt(0)}</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{actividad.nombre}</Text>
                {actividad.descripcion ? (
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {actividad.descripcion}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>
                Duración estimada: {actividad.duracion_minutos ?? '—'} minutos
              </Text>
              <Text style={styles.metaText}>
                Sesiones disponibles: {actividad.sesiones_disponibles}
              </Text>
              {actividad.proxima_sesion ? (
                <Text style={styles.metaText}>
                  Próxima sesión: {actividad.proxima_sesion.fecha} {actividad.proxima_sesion.hora_inicio ?? ''}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => navigation.navigate('Reservas', { selectedActivity: actividad })}
            >
              <Text style={styles.viewButtonText}>Ver sesiones</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
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
      backgroundColor: colors.background,
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
    list: {
      flex: 1,
      paddingHorizontal: 20,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 16,
      padding: 16,
      shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    cardHeaderText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    cardMeta: {
      marginBottom: 16,
    },
    metaText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    viewButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    viewButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontSize: 16,
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
    },
    errorText: {
      color: '#f87171',
      textAlign: 'center',
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
  });

export default ActivitiesScreen;
