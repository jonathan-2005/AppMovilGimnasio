import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: () => navigation.replace('Login')
        }
      ]
    );
  };

  const menuOptions = [
    {
      id: 'perfil',
      title: 'Información Personal',
      subtitle: 'Ver y editar tu perfil',
      icon: '👤',
      color: '#4CAF50',
      screen: 'Perfil'
    },
    {
      id: 'actividades',
      title: 'Actividades',
      subtitle: 'Explora clases y reserva',
      icon: '🏋️',
      color: '#FF9800',
      screen: 'Actividades'
    },
    {
      id: 'reservas',
      title: 'Mis Reservas',
      subtitle: 'Consulta tus reservas',
      icon: '📋',
      color: '#2196F3',
      screen: 'MisReservas'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Hola! 👋</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Bienvenido a FitReserva
          </Text>
        </View>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Acceso Rápido</Text>

          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.actionCard,
                { backgroundColor: colors.surface, borderLeftColor: option.color }
              ]}
              onPress={() => navigation.navigate(option.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                  <Text style={styles.actionIcon}>{option.icon}</Text>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>
              <Text style={[styles.arrowIcon, { color: colors.textSecondary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Section - Membership Status */}
        <View style={styles.membershipSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tu Membresía</Text>
          <TouchableOpacity
            style={[styles.membershipCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Membresias')}
          >
            <View style={styles.membershipIconContainer}>
              <Text style={styles.membershipIcon}>💳</Text>
            </View>
            <View style={styles.membershipTextContainer}>
              <Text style={[styles.membershipTitle, { color: colors.text }]}>
                Gestionar Membresía
              </Text>
              <Text style={[styles.membershipSubtitle, { color: colors.textSecondary }]}>
                Ver planes y suscripciones
              </Text>
            </View>
            <Text style={[styles.arrowIcon, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding for scroll */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Logout Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutIcon, { color: colors.text }]}>🚪</Text>
          <Text style={[styles.logoutText, { color: colors.text }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  themeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  themeIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickActionsContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  arrowIcon: {
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },
  membershipSection: {
    marginTop: 24,
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membershipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9C27B020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  membershipIcon: {
    fontSize: 24,
  },
  membershipTextContainer: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  membershipSubtitle: {
    fontSize: 13,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
