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
  Modal,
  TextInput,
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipCardData | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancelarSuscripcion = useCallback(async () => {
    if (!currentMembership) return;

    Alert.alert(
      '¿Cancelar Suscripción?',
      `¿Estás seguro de que deseas cancelar tu suscripción de ${currentMembership.membresia.nombre_plan}? Esta acción no se puede deshacer.`,
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await MembresiasService.cancelarSuscripcion(currentMembership.id);
              Alert.alert(
                'Suscripción Cancelada',
                'Tu suscripción ha sido cancelada exitosamente.',
                [{ text: 'OK', onPress: () => fetchData() }]
              );
            } catch (error: any) {
              console.error('Error al cancelar suscripción:', error);
              Alert.alert(
                'Error',
                error?.response?.data?.error || 'No se pudo cancelar la suscripción.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }, [currentMembership, fetchData]);

  const handleAdquirirMembresia = useCallback(
    (plan: MembershipCardData) => {
      if (processingId) {
        return;
      }

      if (currentMembership?.activa) {
        Alert.alert(
          'Ya tienes una membresía activa',
          `Tu membresía actual (${currentMembership.membresia.nombre_plan}) sigue activa. Puedes adquirir otra membresía después de que expire o cancelarla primero.`
        );
        return;
      }

      // Abrir modal de pago
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    },
    [currentMembership, processingId]
  );

  const handleProcesarPago = useCallback(
    async (metodoPago: string) => {
      if (!selectedPlan) return;

      try {
        setProcessingPayment(true);

        // 1. Procesar pago simulado
        const resultadoPago = await MembresiasService.procesarPago(
          selectedPlan.id,
          metodoPago
        );

        if (resultadoPago.success) {
          // 2. Si el pago fue exitoso, crear la suscripción
          await MembresiasService.adquirirMembresia(selectedPlan.id, { metodo_pago: metodoPago as any });

          setShowPaymentModal(false);
          Alert.alert(
            '¡Pago Exitoso!',
            `Tu membresía ${selectedPlan.nombre} ha sido activada correctamente.\n\nID de transacción: ${resultadoPago.transaction_id}`,
            [{ text: 'OK', onPress: () => fetchData() }]
          );
        } else {
          // Pago rechazado
          Alert.alert(
            'Pago Rechazado',
            resultadoPago.message || 'El pago no pudo ser procesado. Por favor intenta con otro método.'
          );
        }
      } catch (error: any) {
        console.error('Error al procesar pago:', error);
        const detalle =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        Alert.alert(
          'Error en el Pago',
          detalle || 'Ocurrió un error inesperado al procesar el pago.'
        );
      } finally {
        setProcessingPayment(false);
      }
    },
    [selectedPlan, fetchData]
  );

  const styles = useMemo(
    () => createStyles(colors, isDarkMode),
    [colors, isDarkMode]
  );
  const themeIcon = isDarkMode ? '☀️' : '🌙';

  const renderCurrentMembership = () => {
    if (!currentMembership) {
      return (
        <View style={styles.noMembershipCard}>
          <Text style={styles.noMembershipIcon}>📋</Text>
          <Text style={styles.noMembershipTitle}>Sin Membresía Activa</Text>
          <Text style={styles.noMembershipSubtitle}>
            Elige un plan para comenzar a entrenar con nosotros
          </Text>
        </View>
      );
    }

    const fechaInicio = new Date(currentMembership.fecha_inicio);
    const fechaFin = new Date(currentMembership.fecha_fin);
    const fechaInicioTexto = fechaInicio.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const fechaFinTexto = fechaFin.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const estadoColor =
      currentMembership.estado === 'activa' ? '#4CAF50' :
      currentMembership.estado === 'vencida' ? '#F44336' :
      '#FF9800';

    const estadoTexto = currentMembership.estado.charAt(0).toUpperCase() + currentMembership.estado.slice(1);

    return (
      <View style={[styles.currentMembershipCard, { borderColor: estadoColor }]}>
        <View style={styles.currentMembershipHeader}>
          <View style={styles.currentMembershipBadge}>
            <Text style={styles.currentMembershipBadgeText}>MI MEMBRESÍA</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor }]}>
            <Text style={styles.estadoTexto}>{estadoTexto}</Text>
          </View>
        </View>

        <Text style={styles.currentMembershipName}>
          {currentMembership.membresia.nombre_plan}
        </Text>

        <View style={styles.currentMembershipDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Inicio:</Text>
            <Text style={styles.detailValue}>{fechaInicioTexto}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vence:</Text>
            <Text style={styles.detailValue}>{fechaFinTexto}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Días restantes:</Text>
            <Text style={[styles.detailValue, { color: estadoColor, fontWeight: 'bold' }]}>
              {Math.max(currentMembership.dias_restantes, 0)} días
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Precio pagado:</Text>
            <Text style={styles.detailValue}>
              ${numberFrom(currentMembership.membresia.precio).toFixed(2)}
            </Text>
          </View>
        </View>

        {currentMembership.activa && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelarSuscripcion}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancelar Suscripción</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
        style={styles.scrollView}
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
        {!loading && !errorMessage && renderCurrentMembership()}

        {!loading && !errorMessage && (
          <>
            <View style={styles.divider} />

            <View style={styles.availablePlansHeader}>
              <Text style={styles.availablePlansTitle}>
                {currentMembership?.activa ? 'Otros planes disponibles' : 'Planes disponibles'}
              </Text>
              <Text style={styles.availablePlansSubtitle}>
                Compara beneficios y elige el que mejor se adapte a ti
              </Text>
            </View>

            {membershipCards.length === 0 && (
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
                    disabled={isProcessing || currentMembership?.activa}
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
                        {currentMembership?.activa
                          ? 'Membresía activa'
                          : `Seleccionar ${membresia.nombre}`
                        }
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
          </>
        )}
      </ScrollView>

      {/* Modal de Pasarela de Pago Simulada */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !processingPayment && setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              💳 Procesar Pago
            </Text>

            {selectedPlan && (
              <View style={styles.modalPlanInfo}>
                <Text style={[styles.modalPlanName, { color: colors.text }]}>
                  {selectedPlan.nombre}
                </Text>
                <Text style={[styles.modalPlanPrice, { color: colors.primary }]}>
                  ${selectedPlan.precio.toFixed(2)}
                </Text>
              </View>
            )}

            {processingPayment ? (
              <View style={styles.modalProcessing}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.modalProcessingText, { color: colors.text }]}>
                  Procesando pago...
                </Text>
                <Text style={[styles.modalProcessingSubtext, { color: colors.textSecondary }]}>
                  Esto puede tomar unos segundos
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Selecciona un método de pago:
                </Text>

                <TouchableOpacity
                  style={[styles.paymentMethodButton, { borderColor: colors.border }]}
                  onPress={() => handleProcesarPago('tarjeta')}
                >
                  <Text style={styles.paymentMethodIcon}>💳</Text>
                  <Text style={[styles.paymentMethodText, { color: colors.text }]}>
                    Tarjeta de Crédito/Débito
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentMethodButton, { borderColor: colors.border }]}
                  onPress={() => handleProcesarPago('transferencia')}
                >
                  <Text style={styles.paymentMethodIcon}>🏦</Text>
                  <Text style={[styles.paymentMethodText, { color: colors.text }]}>
                    Transferencia Bancaria
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentMethodButton, { borderColor: colors.border }]}
                  onPress={() => handleProcesarPago('efectivo')}
                >
                  <Text style={styles.paymentMethodIcon}>💵</Text>
                  <Text style={[styles.paymentMethodText, { color: colors.text }]}>
                    Efectivo en Recepción
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalCancelButton, { borderColor: colors.border }]}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.text }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    // Estilos de membresía actual
    currentMembershipCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      marginTop: 10,
      marginBottom: 20,
      borderWidth: 3,
      shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    currentMembershipHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    currentMembershipBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    currentMembershipBadgeText: {
      color: colors.background,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    estadoBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    estadoTexto: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    currentMembershipName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    currentMembershipDetails: {
      marginBottom: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: '#F44336',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    cancelButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    noMembershipCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 32,
      marginTop: 10,
      marginBottom: 20,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    noMembershipIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    noMembershipTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    noMembershipSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    availablePlansHeader: {
      marginBottom: 16,
    },
    availablePlansTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 6,
    },
    availablePlansSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
    // Estilos del Modal de Pago
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    modalPlanInfo: {
      alignItems: 'center',
      marginBottom: 24,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalPlanName: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    modalPlanPrice: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    modalSubtitle: {
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalProcessing: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    modalProcessingText: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 16,
    },
    modalProcessingSubtext: {
      fontSize: 14,
      marginTop: 8,
    },
    paymentMethodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      marginBottom: 12,
      backgroundColor: colors.background,
    },
    paymentMethodIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    paymentMethodText: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    modalCancelButton: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 8,
      alignItems: 'center',
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default MembresiasScreen;
