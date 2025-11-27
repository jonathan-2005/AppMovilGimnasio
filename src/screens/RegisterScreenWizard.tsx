import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';
import { Sede } from '../types/sede';

interface RegisterScreenWizardProps {
  navigation: any;
}

const RegisterScreenWizard: React.FC<RegisterScreenWizardProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Paso 1: Información Personal
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    sexo: '',
    telefono: '',
    direccion: '',

    // Paso 2: Información de Cuenta
    email: '',
    password: '',
    confirmPassword: '',

    // Paso 3: Información del Cliente
    nivel_experiencia: 'principiante',
    objetivo_fitness: '',
    estado: 'activo',
    sede_id: 0,

    // Paso 4: Contacto de Emergencia
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    contactoEmergenciaParentesco: '',
  });

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSexoModal, setShowSexoModal] = useState(false);
  const [showExperienciaModal, setShowExperienciaModal] = useState(false);
  const [showSedeModal, setShowSedeModal] = useState(false);
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const sexoOptions = [
    { label: 'Seleccionar', value: '' },
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
  ];

  const experienciaOptions = [
    { label: 'Principiante', value: 'principiante' },
    { label: 'Intermedio', value: 'intermedio' },
    { label: 'Avanzado', value: 'avanzado' },
  ];

  useEffect(() => {
    const cargarSedes = async () => {
      try {
        const sedesDisponibles = await authService.obtenerSedesDisponibles();
        setSedes(sedesDisponibles);
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: string, value: string) => {
    // Solo permitir números y máximo 10 dígitos
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // En iOS mantener abierto, en Android cerrar

    if (selected) {
      setSelectedDate(selected);
      // Formatear la fecha a YYYY-MM-DD
      const year = selected.getFullYear();
      const month = String(selected.getMonth() + 1).padStart(2, '0');
      const day = String(selected.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      handleInputChange('fecha_nacimiento', formattedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Información Personal
        if (!formData.nombre || !formData.apellido_paterno || !formData.telefono) {
          Alert.alert('Error', 'Por favor completa nombre, apellido paterno y teléfono');
          return false;
        }
        if (formData.telefono.length !== 10) {
          Alert.alert('Error', 'El teléfono debe tener exactamente 10 dígitos');
          return false;
        }
        return true;

      case 2: // Información de Cuenta
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          Alert.alert('Error', 'Por favor completa todos los campos de la cuenta');
          return false;
        }
        // Validar que el email sea de Gmail, Hotmail o Outlook
        const emailRegex = /^[^\s@]+@(gmail\.com|hotmail\.com|outlook\.com)$/i;
        if (!emailRegex.test(formData.email)) {
          Alert.alert('Error', 'Por favor ingresa un email válido de Gmail, Hotmail o Outlook');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return false;
        }
        if (formData.password.length < 6) {
          Alert.alert('Error', 'La contraseña debe tener mínimo 6 caracteres');
          return false;
        }
        return true;

      case 3: // Información del Cliente
        if (!formData.sede_id) {
          Alert.alert('Error', 'Por favor selecciona una sede');
          return false;
        }
        if (!formData.sexo) {
          Alert.alert('Error', 'Por favor selecciona tu sexo');
          return false;
        }
        return true;

      case 4: // Contacto de Emergencia (opcional, pero recomendado)
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleRegister();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    setLoading(true);

    try {
      const newUser: any = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido_paterno: formData.apellido_paterno,
        telefono: formData.telefono,
        sede_id: formData.sede_id,
      };

      // Campos opcionales
      if (formData.apellido_materno) newUser.apellido_materno = formData.apellido_materno;
      if (formData.fecha_nacimiento) newUser.fecha_nacimiento = formData.fecha_nacimiento;
      if (formData.sexo) newUser.genero = formData.sexo;
      if (formData.direccion) newUser.direccion = formData.direccion;
      if (formData.objetivo_fitness) newUser.objetivo_fitness = formData.objetivo_fitness;
      if (formData.nivel_experiencia) newUser.nivel_experiencia = formData.nivel_experiencia;
      if (formData.contactoEmergenciaNombre) newUser.contacto_emergencia_nombre = formData.contactoEmergenciaNombre;
      if (formData.contactoEmergenciaTelefono) newUser.contacto_emergencia_telefono = formData.contactoEmergenciaTelefono;
      if (formData.contactoEmergenciaParentesco) newUser.contacto_emergencia_parentesco = formData.contactoEmergenciaParentesco;

      console.log('=== REGISTRO CON BACKEND DJANGO ===');
      console.log('Datos a enviar:', newUser);

      const response = await authService.register(newUser);

      setLoading(false);
      console.log('✅ Usuario registrado exitosamente');

      Alert.alert(
        '¡Éxito!',
        `Tu cuenta ha sido creada en ${response.sede_nombre}. Ahora puedes iniciar sesión.`,
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
        Alert.alert('Error', 'No se pudo conectar con el servidor. Intenta nuevamente.');
      }
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              step <= currentStep && { backgroundColor: colors.text },
              step > currentStep && { backgroundColor: colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
        Paso {currentStep} de {totalSteps}
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Información Personal</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Cuéntanos sobre ti
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Nombre *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="Ej: Juan"
        placeholderTextColor={colors.textSecondary}
        value={formData.nombre}
        onChangeText={(value) => handleInputChange('nombre', value)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Apellido Paterno *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="Ej: Pérez"
        placeholderTextColor={colors.textSecondary}
        value={formData.apellido_paterno}
        onChangeText={(value) => handleInputChange('apellido_paterno', value)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Apellido Materno</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="Ej: García"
        placeholderTextColor={colors.textSecondary}
        value={formData.apellido_materno}
        onChangeText={(value) => handleInputChange('apellido_materno', value)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Teléfono * (10 dígitos)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="1234567890"
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        maxLength={10}
        value={formData.telefono}
        onChangeText={(value) => handlePhoneChange('telefono', value)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Fecha de Nacimiento</Text>
      <TouchableOpacity onPress={showDatePickerModal}>
        <View pointerEvents="none">
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            placeholder="Selecciona tu fecha de nacimiento"
            placeholderTextColor={colors.textSecondary}
            value={formData.fecha_nacimiento}
            editable={false}
          />
        </View>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // No permitir fechas futuras
          minimumDate={new Date(1900, 0, 1)} // Fecha mínima razonable
        />
      )}

      <Text style={[styles.label, { color: colors.text }]}>Dirección</Text>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="Dirección completa"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={3}
        value={formData.direccion}
        onChangeText={(value) => handleInputChange('direccion', value)}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Información de Cuenta</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Crea tu cuenta de acceso
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Email * (Gmail, Hotmail o Outlook)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="ejemplo@gmail.com"
        placeholderTextColor={colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Contraseña *</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Confirmar Contraseña *</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
          placeholder="Repite la contraseña"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!showConfirmPassword}
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Text style={styles.eyeIconText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Información del Cliente</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Personaliza tu experiencia
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Sexo *</Text>
      <TouchableOpacity
        style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => setShowSexoModal(true)}
      >
        <Text style={[styles.pickerButtonText, { color: formData.sexo ? colors.text : colors.textSecondary }]}>
          {formData.sexo ? sexoOptions.find(o => o.value === formData.sexo)?.label : 'Seleccionar'}
        </Text>
        <Text style={[styles.pickerArrow, { color: colors.text }]}>▼</Text>
      </TouchableOpacity>

      <Text style={[styles.label, { color: colors.text }]}>Nivel de Experiencia</Text>
      <TouchableOpacity
        style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => setShowExperienciaModal(true)}
      >
        <Text style={[styles.pickerButtonText, { color: colors.text }]}>
          {experienciaOptions.find(o => o.value === formData.nivel_experiencia)?.label || 'Principiante'}
        </Text>
        <Text style={[styles.pickerArrow, { color: colors.text }]}>▼</Text>
      </TouchableOpacity>

      <Text style={[styles.label, { color: colors.text }]}>Sede *</Text>
      {loadingSedes ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando sedes...
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.pickerButton, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => setShowSedeModal(true)}
        >
          <Text style={[styles.pickerButtonText, { color: formData.sede_id ? colors.text : colors.textSecondary }]}>
            {formData.sede_id 
              ? `${sedes.find(s => s.id === formData.sede_id)?.nombre} - ${sedes.find(s => s.id === formData.sede_id)?.direccion}`
              : 'Selecciona una sede'}
          </Text>
          <Text style={[styles.pickerArrow, { color: colors.text }]}>▼</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Objetivo Fitness</Text>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="Ej: Pérdida de peso, ganancia muscular, mejorar resistencia..."
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={3}
        value={formData.objetivo_fitness}
        onChangeText={(value) => handleInputChange('objetivo_fitness', value)}
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Contacto de Emergencia</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Información importante para tu seguridad
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Nombre del Contacto</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="Nombre completo"
        placeholderTextColor={colors.textSecondary}
        value={formData.contactoEmergenciaNombre}
        onChangeText={(value) => handleInputChange('contactoEmergenciaNombre', value)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Teléfono del Contacto (10 dígitos)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="1234567890"
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        maxLength={10}
        value={formData.contactoEmergenciaTelefono}
        onChangeText={(value) => handlePhoneChange('contactoEmergenciaTelefono', value)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Parentesco</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
        placeholder="Ej: Padre, Madre, Hermano, Esposo/a..."
        placeholderTextColor={colors.textSecondary}
        value={formData.contactoEmergenciaParentesco}
        onChangeText={(value) => handleInputChange('contactoEmergenciaParentesco', value)}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Registro</Text>
          <View style={{ width: 40 }} />
        </View>

        {renderProgressBar()}

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {/* Modales para selección */}
        {/* Modal Sexo */}
        <Modal
          visible={showSexoModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSexoModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSexoModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecciona tu sexo</Text>
              <FlatList
                data={sexoOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      formData.sexo === item.value && { backgroundColor: colors.text + '20' },
                    ]}
                    onPress={() => {
                      handleInputChange('sexo', item.value);
                      setShowSexoModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    {formData.sexo === item.value && (
                      <Text style={[styles.modalCheck, { color: colors.text }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setShowSexoModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal Nivel de Experiencia */}
        <Modal
          visible={showExperienciaModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowExperienciaModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowExperienciaModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecciona tu nivel</Text>
              <FlatList
                data={experienciaOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      formData.nivel_experiencia === item.value && { backgroundColor: colors.text + '20' },
                    ]}
                    onPress={() => {
                      handleInputChange('nivel_experiencia', item.value);
                      setShowExperienciaModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    {formData.nivel_experiencia === item.value && (
                      <Text style={[styles.modalCheck, { color: colors.text }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setShowExperienciaModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal Sede */}
        <Modal
          visible={showSedeModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSedeModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSedeModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecciona una sede</Text>
              {loadingSedes ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
                    Cargando sedes...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={[{ id: 0, nombre: 'Selecciona una sede', direccion: '' }, ...sedes]}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalOption,
                        { borderBottomColor: colors.border },
                        formData.sede_id === item.id && { backgroundColor: colors.text + '20' },
                      ]}
                      onPress={() => {
                        if (item.id !== 0) {
                          handleInputChange('sede_id', item.id.toString());
                        }
                        setShowSedeModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          { color: item.id === 0 ? colors.textSecondary : colors.text },
                        ]}
                      >
                        {item.id === 0 ? item.nombre : `${item.nombre} - ${item.direccion}`}
                      </Text>
                      {formData.sede_id === item.id && item.id !== 0 && (
                        <Text style={[styles.modalCheck, { color: colors.text }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setShowSedeModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Botones de navegación */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.backButtonBottom, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>
              {currentStep === 1 ? 'Cancelar' : 'Atrás'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.text }, loading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={[styles.nextButtonText, { color: colors.background }]}>
              {loading ? 'Creando...' : currentStep === totalSteps ? 'Crear Cuenta' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 8,
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
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  pickerButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    flex: 1,
  },
  pickerArrow: {
    fontSize: 12,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    flex: 1,
  },
  modalCheck: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  backButtonBottom: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreenWizard;
