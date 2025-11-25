import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
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
  const [showPassword, setShowPassword] = useState(false);
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validar formato de email (Gmail, Hotmail o Outlook)
    const emailRegex = /^[^\s@]+@(gmail\.com|hotmail\.com|outlook\.com)$/i;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido de Gmail, Hotmail o Outlook');
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
          'No se puede conectar con el servidor. Verifica tu conexión a internet y que el backend esté disponible.'
        );
        return;
      }

      // Intentar login con backend Django
      const response = await authService.login({ email, password });

      console.log('✅ Login exitoso con backend Django');

      // Detectar si es personal de limpieza
      let esPersonalLimpieza = false;
      try {
        const limpiezaService = (await import('../services/limpiezaService')).default;
        await limpiezaService.getEmpleadoActual();
        esPersonalLimpieza = true;
        console.log('👷 Usuario identificado como Personal de Limpieza');
      } catch (error: any) {
        // No es personal de limpieza, es un cliente normal
        // Este error 404 es esperado para clientes, no lo mostramos
        if (error.response?.status === 404) {
          console.log('👤 Usuario identificado como Cliente');
        } else {
          console.log('👤 Usuario identificado como Cliente (error:', error.message, ')');
        }
      }

      setLoading(false);

      // Navegar según el tipo de usuario
      if (esPersonalLimpieza) {
        navigation.replace('TareasLimpieza');
      } else {
        navigation.replace('Home');
      }

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
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
                placeholder="tu@gmail.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <View style={styles.passwordLabelContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Contraseña</Text>
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={[styles.forgotPasswordText, { color: colors.textSecondary }]}>¿Olvidaste tu Contraseña?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Tu contraseña"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
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
  passwordLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 13,
    padding: 5,
  },
  eyeIconText: {
    fontSize: 20,
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
