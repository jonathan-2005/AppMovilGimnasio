import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';
import { Sede } from '../types/sede';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
    objetivo_fitness: '',
    nivel_experiencia: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    contactoEmergenciaParentesco: '',
    sede_id: 0, // ✅ AGREGADO: campo sede_id
  });
  const [sedes, setSedes] = useState<Sede[]>([]); // ✅ AGREGADO: estado para sedes
  const [loadingSedes, setLoadingSedes] = useState(true); // ✅ AGREGADO: loading de sedes
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  // ✅ AGREGADO: Cargar sedes al montar el componente
  useEffect(() => {
    const cargarSedes = async () => {
      try {
        console.log('📍 Cargando sedes disponibles...');
        const sedesDisponibles = await authService.obtenerSedesDisponibles();
        setSedes(sedesDisponibles);
        console.log(`✅ ${sedesDisponibles.length} sedes cargadas`);
      } catch (error) {
        console.error('❌ Error al cargar sedes:', error);
        Alert.alert('Error', 'No se pudieron cargar las sedes disponibles');
      } finally {
        setLoadingSedes(false);
      }
    };

    cargarSedes();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    // ✅ MODIFICADO: Validar que se haya seleccionado una sede
    if (!formData.email || !formData.password || !formData.nombre || !formData.apellido_paterno || !formData.telefono || !formData.sede_id) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios incluyendo la selección de sede');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Crear objeto usuario
      // Solo incluir campos con valor (no enviar strings vacíos)
      const newUser: any = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido_paterno: formData.apellido_paterno,
        telefono: formData.telefono,
      };
      
      // Agregar campos opcionales solo si tienen valor
      if (formData.apellido_materno) {
        newUser.apellido_materno = formData.apellido_materno;
      }
      
      if (formData.fecha_nacimiento) {
        newUser.fecha_nacimiento = formData.fecha_nacimiento;
      }
      
      if (formData.genero) {
        newUser.genero = formData.genero;
      }
      
      if (formData.contactoEmergenciaNombre) {
        newUser.contacto_emergencia_nombre = formData.contactoEmergenciaNombre;
      }
      if (formData.contactoEmergenciaTelefono) {
        newUser.contacto_emergencia_telefono = formData.contactoEmergenciaTelefono;
      }
      if (formData.contactoEmergenciaParentesco) {
        newUser.contacto_emergencia_parentesco = formData.contactoEmergenciaParentesco;
      }
      
      newUser.objetivo_fitness = formData.objetivo_fitness || 'mantenimiento';
      newUser.nivel_experiencia = formData.nivel_experiencia || 'principiante';
      newUser.sede_id = formData.sede_id; // ✅ AGREGADO: incluir sede_id

      console.log('=== REGISTRO CON BACKEND DJANGO ===');
      console.log('Datos del usuario a registrar:', newUser);
      
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
      
      // Registrar usuario en backend Django
      const response = await authService.register(newUser);
      
      setLoading(false);
      console.log('✅ Usuario registrado exitosamente en backend Django');
      
      Alert.alert(
        'Éxito', 
        'Cuenta creada exitosamente en el servidor. Ahora puedes iniciar sesión con tus credenciales.', 
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
      
    } catch (error: any) {
      console.error('💥 Error en registro:', error);
      setLoading(false);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.includes('email')) {
          Alert.alert('Error', 'Este email ya está registrado. Intenta con otro email o inicia sesión.');
        } else {
          Alert.alert('Error', errorData.error || 'Datos inválidos. Verifica la información ingresada.');
        }
      } else {
        Alert.alert(
          'Error de conexión', 
          'No se pudo conectar con el servidor. Verifica que el backend Django esté ejecutándose.'
        );
      }
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Registro</Text>
        <TouchableOpacity style={styles.themeButton}>
          <Text style={styles.themeIcon}>🌙</Text>
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={[styles.subtitle, { color: colors.text }]}>Crea tu cuenta</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Completa tus datos para comenzar tu transformación
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={styles.progressStep} />
        </View>
      </View>

      {/* Photo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Foto y contraseña</Text>
        <Text style={styles.sectionSubtitle}>Foto de perfil</Text>
        
        <TouchableOpacity style={styles.photoContainer}>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.photoText}>Toca para subir o tomar foto</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Contraseña</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
        />

        <Text style={[styles.inputLabel, { color: colors.text }]}>Confirmar Contraseña</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="Repite Contraseña"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
        />
      </View>

      {/* Personal Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos personales</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre Completo"
          placeholderTextColor={colors.textSecondary}
          value={formData.nombre}
          onChangeText={(value) => handleInputChange('nombre', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Apellido Paterno"
          placeholderTextColor={colors.textSecondary}
          value={formData.apellido_paterno}
          onChangeText={(value) => handleInputChange('apellido_paterno', value)}
        />

        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
        />

        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="Teléfono"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={formData.telefono}
          onChangeText={(value) => handleInputChange('telefono', value)}
        />
      </View>

      {/* ✅ NUEVO: Sede Selection Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Selecciona tu sede</Text>
        <Text style={[styles.description, { color: colors.textSecondary, marginBottom: 10 }]}>
          Elige la sede del gimnasio más cercana a tu ubicación
        </Text>

        {loadingSedes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.text} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando sedes disponibles...
            </Text>
          </View>
        ) : (
          <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Picker
              selectedValue={formData.sede_id}
              onValueChange={(value) => setFormData({ ...formData, sede_id: value as number })}
              style={[styles.picker, { color: colors.text }]}
            >
              <Picker.Item label="Selecciona una sede" value={0} />
              {sedes.map((sede) => (
                <Picker.Item
                  key={sede.id}
                  label={`${sede.nombre} - ${sede.direccion}`}
                  value={sede.id}
                />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {/* Emergency Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacto de emergencia</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nombre Completo"
          placeholderTextColor={colors.textSecondary}
          value={formData.contactoEmergenciaNombre}
          onChangeText={(value) => handleInputChange('contactoEmergenciaNombre', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={formData.contactoEmergenciaTelefono}
          onChangeText={(value) => handleInputChange('contactoEmergenciaTelefono', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Parentesco"
          placeholderTextColor={colors.textSecondary}
          value={formData.contactoEmergenciaParentesco}
          onChangeText={(value) => handleInputChange('contactoEmergenciaParentesco', value)}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.backButtonBottom, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Atrás</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: colors.text }, loading && styles.createButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={[styles.createButtonText, { color: colors.background }]}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor se maneja dinámicamente
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    // color se maneja dinámicamente
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    // color se maneja dinámicamente
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
  subtitleContainer: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    // color se maneja dinámicamente
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    // color se maneja dinámicamente
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    // backgroundColor se maneja dinámicamente
    borderRadius: 2,
  },
  progressActive: {
    // backgroundColor se maneja dinámicamente
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color se maneja dinámicamente
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    // color se maneja dinámicamente
    marginBottom: 10,
  },
  photoContainer: {
    marginBottom: 20,
  },
  photoPlaceholder: {
    height: 120,
    // backgroundColor se maneja dinámicamente
    borderRadius: 8,
    borderWidth: 2,
    // borderColor se maneja dinámicamente
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 12,
    // color se maneja dinámicamente
  },
  inputLabel: {
    fontSize: 14,
    // color se maneja dinámicamente
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    // borderColor se maneja dinámicamente
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    // color se maneja dinámicamente
    // backgroundColor se maneja dinámicamente
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
    marginBottom: 40,
  },
  backButtonBottom: {
    flex: 1,
    height: 50,
    // backgroundColor se maneja dinámicamente
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    // borderColor se maneja dinámicamente
  },
  backButtonText: {
    fontSize: 16,
    // color se maneja dinámicamente
  },
  createButton: {
    flex: 1,
    height: 50,
    // backgroundColor se maneja dinámicamente
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // ✅ NUEVOS ESTILOS: Para el selector de sede
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ddd',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
});

export default RegisterScreen;
