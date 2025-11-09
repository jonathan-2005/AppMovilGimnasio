import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.dumbbellIcon}>🏋️</Text>
        </View>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>FitReserva</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tu gimnasio en la palma de tu mano
        </Text>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Actividades')}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.iconText}>🔥</Text>
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>Actividades</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Reservas')}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.iconText}>📅</Text>
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>Reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('MisReservas')}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.iconText}>🗒️</Text>
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>Mis reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Membresias')}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.iconText}>💳</Text>
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>Membresías</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.loginButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Text style={[styles.loginText, { color: colors.text }]}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dumbbellIcon: {
    fontSize: 24,
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
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  menuContainer: {
    marginBottom: 60,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  menuIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomContainer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
