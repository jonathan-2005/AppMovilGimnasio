import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MembresiasService, {
  MembresiaDisponible,
  MembresiaCliente,
} from '../services/membresiasService';

interface MembresiasScreenProps {
  navigation: any;
}

interface MembershipCardData {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  precio: number;
  icon: string;
  color: string;
  beneficios: string[];
  popular: boolean;
  duracionLabel: string;
}

const MEMBERSHIP_VISUALS: Record<
  string,
  { icon: string; color: string; tag?: string }
> = {
  mensual: { icon: '⚡', color: '#4CAF50', tag: 'Más popular' },
  trimestral: { icon: '🔥', color: '#FF9800' },
  semestral: { icon: '💪', color: '#F06292' },
  anual: { icon: '🏆', color: '#9C27B0', tag: 'Mejor valor' },
  pase_dia: { icon: '🚀', color: '#42A5F5' },
  pase_semana: { icon: '📆', color: '#AB47BC' },
};

const parseBeneficios = (plan: MembresiaDisponible): string[] => {
  if (plan.beneficios_list && plan.beneficios_list.length > 0) {
    return plan.beneficios_list;
  }

  if (!plan.beneficios) {
    return [];
  }

  return plan.beneficios
    .replace(/\r/g, '\n')
    .split(/[\n;,]+/)
    .map((item) => item.trim().replace(/^[•*\-]+/, '').trim())
    .filter(Boolean);
};

const numberFrom = (value: number | string): number => {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const MembresiasScreen: React.FC<MembresiasScreenProps> = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [membresias, setMembresias] = useState<MembresiaDisponible[]>([]);
  const [currentMembership, setCurrentMembership] =
    useState<MembresiaCliente | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const [planes, misMembresias] = await Promise.all([
        MembresiasService.listarActivas(),
        MembresiasService.obtenerMisMembresias(),
      ]);

      setMembresias(planes);

      const activa =
        misMembresias.find((item) => item.activa) ?? misMembresias[0] ?? null;
      setCurrentMembership(activa);
    } catch (error: any) {
      console.error('Error al cargar membresías:', error?.response || error);
      setErrorMessage(
        'No pudimos obtener tus membresías. Verifica tu conexión e inténtalo de nuevo.'
      );
      setMembresias([]);
      setCurrentMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const popularId = useMemo(() => {
    if (membresias.length === 0) {
      return null;
    }
    return membresias.reduce((maxId, actual) => {
      const currentMaxPlan =
        membresias.find((plan) => plan.id === maxId) ?? membresias[0];
      const currentMaxPrice = numberFrom(currentMaxPlan.precio);
      const actualPrice = numberFrom(actual.precio);
      return actualPrice > currentMaxPrice ? actual.id : maxId;
    }, membresias[0].id);
  }, [membresias]);

  const membershipCards = useMemo<MembershipCardData[]>(() => {
    return membresias.map((plan) => {
      const visuals = MEMBERSHIP_VISUALS[plan.tipo] ?? {
        icon: '💳',
        color: colors.primary,
      };
      const precio = numberFrom(plan.precio);

      let duracionLabel = '/mes';
      if (plan.tipo === 'anual') {
        duracionLabel = '/año';
      } else if (plan.tipo === 'trimestral') {
        duracionLabel = '• 3 meses';
      } else if (plan.tipo === 'semestral') {
        duracionLabel = '• 6 meses';
      } else if (plan.tipo.startsWith('pase')) {
        duracionLabel = plan.tipo === 'pase_dia' ? '• 1 día' : '• 7 días';
      } else if (plan.duracion_dias) {
        duracionLabel = `• ${plan.duracion_dias} días`;
      }

      return {
        id: plan.id,
        nombre: plan.nombre_plan,
        tipo: plan.tipo_display ?? plan.tipo,
        descripcion: plan.descripcion,
        precio,
        icon: visuals.icon,
        color: visuals.color,
        beneficios: parseBeneficios(plan),
        popular: plan.id === popularId || Boolean(visuals.tag),
        duracionLabel,
      };
    });
  }, [colors.primary, membresias, popularId]);

  const currentMembershipSummary = useMemo(() => {
    if (!currentMembership) {
      return null;
    }

    const fechaFin = new Date(currentMembership.fecha_fin);
    const fechaFinTexto = fechaFin.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return {
      nombre: currentMembership.membresia?.nombre_plan ?? 'Membresía',
      estado: currentMembership.estado,
      diasRestantes: Math.max(currentMembership.dias_restantes, 0),
      fechaFinTexto,
      activa: currentMembership.activa,
    };
  }, [currentMembership]);

  const handleAdquirirMembresia = useCallback(
    (plan: MembershipCardData) => {
      if (processingId) {
        return;
      }

      if (currentMembership?.activa) {
        Alert.alert(
          'Ya tienes una membresía',
          `Tu membresía actual (${currentMembership.membresia.nombre_plan}) sigue activa.`
        );
        return;
      }

      Alert.alert(
        'Confirmar Compra',
        `¿Deseas adquirir la membresía ${plan.nombre} por $${plan.precio.toFixed(
          2
        )}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Comprar',
            onPress: async () => {
              try {
                setProcessingId(plan.id);
                await MembresiasService.adquirirMembresia(plan.id);
                Alert.alert(
                  '¡Éxito!',
                  'Tu membresía fue activada correctamente.'
                );
                fetchData();
              } catch (error: any) {
                const detalle =
                  error?.response?.data?.error ||
                  error?.response?.data?.detail ||
                  error?.message;
                Alert.alert(
                  'No se pudo completar la compra',
                  detalle || 'Ocurrió un error inesperado.'
                );
              } finally {
                setProcessingId(null);
              }
            },
          },
        ]
      );
    },
    [currentMembership, fetchData, processingId]
  );

  const styles = useMemo(
    () => createStyles(colors, isDarkMode),
    [colors, isDarkMode]
  );
  const themeIcon = isDarkMode ? '☀️' : '🌙';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Membresías</Text>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{themeIcon}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.currentMembershipContainer}>
        {currentMembershipSummary ? (
          <>
            <View style={styles.currentMembershipInfo}>
              <View style={styles.currentMembershipBadge}>
                <Text style={styles.currentMembershipText}>
                  {currentMembershipSummary.nombre}
                </Text>
              </View>
              <Text style={styles.currentMembershipStatus}>
                Estado: {currentMembershipSummary.estado}
              </Text>
              <Text style={styles.currentMembershipMeta}>
                Expira: {currentMembershipSummary.fechaFinTexto} •{' '}
                {currentMembershipSummary.diasRestantes} días restantes
              </Text>
            </View>
            <TouchableOpacity
              style={styles.renewButton}
              onPress={() => Alert.alert('Próximamente', 'Renovación manual.')}
            >
              <Text style={styles.renewButtonText}>Renovar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.currentMembershipInfo}>
            <Text style={styles.noMembershipTitle}>Aún no tienes membresía</Text>
            <Text style={styles.noMembershipSubtitle}>
              Elige un plan para comenzar a entrenar con nosotros.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.upgradeContainer}>
        <Text style={styles.upgradeTitle}>Planes disponibles</Text>
        <Text style={styles.upgradeSubtitle}>
          Compara los beneficios y selecciona el que mejor se adapte a ti.
        </Text>
      </View>

      {loading && (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.feedbackText}>Cargando membresías…</Text>
        </View>
      )}

      {errorMessage && !loading && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.membershipsList}
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
        {!loading && !errorMessage && membershipCards.length === 0 && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>
              No hay membresías activas en este momento.
            </Text>
          </View>
        )}

        {membershipCards.map((membresia) => {
          const isProcessing = processingId === membresia.id;
          return (
            <View
              key={membresia.id}
              style={[
                styles.membershipCard,
                { borderColor: membresia.color },
              ]}
            >
              <View style={styles.membershipHeader}>
                <View style={styles.membershipTitleContainer}>
                  <Text style={styles.membershipIcon}>{membresia.icon}</Text>
                  <View>
                    <Text style={styles.membershipName}>{membresia.nombre}</Text>
                    <Text style={styles.membershipType}>{membresia.tipo}</Text>
                  </View>
                </View>

                {membresia.popular && (
                  <View
                    style={[
                      styles.popularBadge,
                      { backgroundColor: membresia.color },
                    ]}
                  >
                    <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
                  </View>
                )}
              </View>

              {membresia.descripcion ? (
                <Text style={styles.membershipDescription}>
                  {membresia.descripcion}
                </Text>
              ) : null}

              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  ${membresia.precio.toFixed(2)}
                </Text>
                <Text style={styles.pricePeriod}>{membresia.duracionLabel}</Text>
              </View>

              <View style={styles.benefitsContainer}>
                {membresia.beneficios.map((benefit, index) => (
                  <View key={`${membresia.id}-${index}`} style={styles.benefitRow}>
                    <Text style={[styles.checkIcon, { color: membresia.color }]}>
                      ✓
                    </Text>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: membresia.popular
                      ? membresia.color
                      : colors.surface,
                    borderColor: membresia.popular
                      ? membresia.color
                      : colors.border,
                  },
                ]}
                onPress={() => handleAdquirirMembresia(membresia)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator
                    size="small"
                    color={membresia.popular ? colors.background : colors.text}
                  />
                ) : (
                  <Text
                    style={[
                      styles.actionButtonText,
                      membresia.popular
                        ? styles.actionButtonTextWhite
                        : { color: colors.text },
                    ]}
                  >
                    {membresia.popular
                      ? `Mejorar a ${membresia.nombre}`
                      : `Seleccionar ${membresia.nombre}`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.paymentMethodsContainer}>
          <Text style={styles.paymentMethodsTitle}>
            Métodos de pago aceptados
          </Text>
          <Text style={styles.paymentMethodsText}>
            • Tarjeta de crédito o débito{'\n'}• Transferencia bancaria{'\n'}•
            Efectivo en recepción{'\n'}• Todas las membresías se renuevan
            automáticamente
          </Text>
        </View>
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
    currentMembershipContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    currentMembershipInfo: {
      flex: 1,
      marginRight: 12,
    },
    currentMembershipBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.success,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 8,
    },
    currentMembershipText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: '600',
    },
    currentMembershipStatus: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    currentMembershipMeta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    noMembershipTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    noMembershipSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    renewButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    renewButtonText: {
      color: colors.background,
      fontWeight: '600',
    },
    upgradeContainer: {
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    upgradeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    upgradeSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    membershipsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    membershipCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 18,
      borderWidth: 2,
      shadowColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    membershipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    membershipTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    membershipIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    membershipName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    membershipType: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    membershipDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    popularBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 16,
    },
    price: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    pricePeriod: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    benefitsContainer: {
      marginBottom: 18,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    checkIcon: {
      fontSize: 16,
      marginRight: 10,
      marginTop: 2,
    },
    benefitText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    actionButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    actionButtonTextWhite: {
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
    paymentMethodsContainer: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 30,
    },
    paymentMethodsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    paymentMethodsText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });

export default MembresiasScreen;
