import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLimpieza } from '../context/LimpiezaContext';
import limpiezaService from '../services/limpiezaService';

interface PerfilLimpiezaScreenProps {
  navigation: any;
}

const PerfilLimpiezaScreen: React.FC<PerfilLimpiezaScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { empleado, tareas } = useLimpieza();

  // Calcular estadísticas
  const stats = tareas.length > 0
    ? limpiezaService.calcularEstadisticas(tareas)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>👤 Mi Perfil</Text>
        </View>

        {/* Card de información personal */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Nombre */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {empleado?.empleado_nombre.charAt(0) || '?'}
              </Text>
            </View>
            <Text style={[styles.nombreCompleto, { color: colors.text }]}>
              {empleado?.empleado_nombre || 'Cargando...'}
            </Text>
          </View>

          {/* Información de contacto */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                📧 Email
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {empleado?.email || 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                📱 Teléfono
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {empleado?.telefono || 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                🏢 Sede
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {empleado?.sede_nombre || 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                🕐 Turno
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {empleado?.turno || 'N/A'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                📋 Puesto
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                Personal de Limpieza
              </Text>
            </View>
          </View>
        </View>

        {/* Espacios asignados */}
        {empleado && empleado.espacios_asignados && empleado.espacios_asignados.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              📍 Espacios Asignados
            </Text>
            <View style={styles.espaciosContainer}>
              {empleado.espacios_asignados.map((espacio, index) => (
                <View
                  key={index}
                  style={[styles.espacioChip, { backgroundColor: '#EFF6FF' }]}
                >
                  <Text style={styles.espacioChipText}>{espacio.nombre}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Estadísticas */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            📊 Estadísticas
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.statIconText}>📋</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Tareas Completadas Hoy
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.tareas_completadas_hoy || 0} / {stats?.total_tareas_hoy || 0}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.statIconText}>⏳</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Tareas Pendientes Hoy
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.tareas_pendientes_hoy || 0}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: '#D4EDDA' }]}>
                <Text style={styles.statIconText}>✅</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Total Esta Semana
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats?.tareas_completadas_semana || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Espacio al final */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nombreCompleto: {
    fontSize: 22,
    fontWeight: '700',
  },
  infoSection: {
    gap: 0,
  },
  infoItem: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  espaciosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  espacioChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  espacioChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
  statsContainer: {
    gap: 0,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statIconText: {
    fontSize: 24,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default PerfilLimpiezaScreen;
