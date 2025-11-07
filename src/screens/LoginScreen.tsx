import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      console.log('=== LOGIN CON BACKEND DJANGO ===');
      console.log('Email:', email);
      
      // Verificar conexión con backend
      const backendConnected = await authService.checkBackendConnection();
      if (!backendConnected) {
        setLoading(false);
        Alert.alert(
          'Error de conexión', 
          'No se puede conectar con el servidor. Asegúrate de que el backend Django esté ejecutándose en http://192.168.1.70:8000'
        );
        return;
      }
      
      // Intentar login con backend Django
      const response = await authService.login({ email, password });
      
      setLoading(false);
      console.log('✅ Login exitoso con backend Django');
      
      // Login exitoso - navegar al Home
      navigation.replace('Home');
      
    } catch (error: any) {
      console.error('💥 Error en login:', error);
      setLoading(false);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Error de autenticación', 
          'Email o contraseña incorrectos.'
        );
      } else if (error.response?.status === 400) {
        Alert.alert(
          'Error de datos', 
          'Por favor verifica que los datos sean correctos.'
        );
      } else {
        Alert.alert(
          'Error de conexión', 
          'No se pudo conectar con el servidor. Verifica que el backend Django esté ejecutándose.'
        );
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>Login</Text>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Logo and Welcome */}
      <View style={styles.logoContainer}>
        <View style={[styles.logoIcon, { backgroundColor: colors.surface }]}>
          <Text style={styles.dumbbellIcon}>🏋️</Text>
        </View>
        
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>Bienvenido de vuelta</Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Inicia sesión para continuar</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Correo electrónico</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="tu@email.com"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Contraseña</Text>
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: colors.textSecondary }]}>¿Olvidaste tu Contraseña?</Text>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="Tu contraseña"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={[styles.loginButton, { backgroundColor: colors.text }, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={[styles.loginButtonText, { color: colors.background }]}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>

        {/* Botón de Registro */}
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.registerButtonText, { color: colors.textSecondary }]}>
            ¿No tienes cuenta? Regístrate aquí
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
  headerText: {
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
    fontSize: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dumbbellIcon: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    padding: 5,
  },
  forgotPasswordText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;
