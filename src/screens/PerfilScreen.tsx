import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import PerfilService, { PerfilCliente, ActualizarPerfilPayload } from '../services/perfilService';

interface PerfilScreenProps {
  navigation: any;
}

const PerfilScreen: React.FC<PerfilScreenProps> = ({ navigation }) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
  const [formData, setFormData] = useState<ActualizarPerfilPayload>({});

  const cargarPerfil = useCallback(async () => {
    try {
      setLoading(true);
      const data = await PerfilService.obtenerMiPerfil();
      setPerfil(data);
      setFormData({
        nombre: data.nombre,
        apellido_paterno: data.apellido_paterno,
        apellido_materno: data.apellido_materno,
        telefono: data.telefono,
        direccion: data.direccion,
        objetivo_fitness: data.objetivo_fitness,
        nombre_contacto: data.nombre_contacto,
        telefono_contacto: data.telefono_contacto,
        parentesco: data.parentesco,
      });
    } catch (error: any) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo cargar tu perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarPerfil();
    setRefreshing(false);
  }, [cargarPerfil]);

  const handleGuardar = async () => {
    try {
      setSaving(true);
      const updated = await PerfilService.actualizarPerfil(formData);
      setPerfil(updated);
      setEditMode(false);
      Alert.alert('Éxito', 'Tu perfil ha sido actualizado correctamente');
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar tu perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    if (perfil) {
      setFormData({
        nombre: perfil.nombre,
        apellido_paterno: perfil.apellido_paterno,
        apellido_materno: perfil.apellido_materno,
        telefono: perfil.telefono,
        direccion: perfil.direccion,
        objetivo_fitness: perfil.objetivo_fitness,
        nombre_contacto: perfil.nombre_contacto,
        telefono_contacto: perfil.telefono_contacto,
        parentesco: perfil.parentesco,
      });
    }
    setEditMode(false);
  };

  if (loading && !perfil) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Mi Perfil</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando perfil...
          </Text>
        </View>
      </View>
    );
  }

  if (!perfil) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Mi Perfil</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {perfil.nombre.charAt(0).toUpperCase()}
              {perfil.apellido_paterno.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {perfil.nombre} {perfil.apellido_paterno} {perfil.apellido_materno}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {perfil.email}
          </Text>
          <View style={[styles.sedeBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.sedeText, { color: colors.primary }]}>
              📍 {perfil.sede_nombre}
            </Text>
          </View>
        </View>

        {/* Edit Button */}
        {!editMode && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.editButtonText}>✏️ Editar Perfil</Text>
          </TouchableOpacity>
        )}

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Información Personal
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <InfoRow
              label="Nombre"
              value={formData.nombre || ''}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              colors={colors}
            />
            <InfoRow
              label="Apellido Paterno"
              value={formData.apellido_paterno || ''}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, apellido_paterno: text })}
              colors={colors}
            />
            <InfoRow
              label="Apellido Materno"
              value={formData.apellido_materno || ''}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, apellido_materno: text })}
              colors={colors}
            />
            <InfoRow
              label="Teléfono"
              value={formData.telefono || ''}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, telefono: text })}
              colors={colors}
              keyboardType="phone-pad"
            />
            <InfoRow
              label="Dirección"
              value={formData.direccion || ''}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, direccion: text })}
              colors={colors}
              multiline
            />
            <InfoRow
              label="Fecha de Nacimiento"
              value={perfil.fecha_nacimiento || 'No especificado'}
              editable={false}
              colors={colors}
            />
            <InfoRow
              label="Sexo"
              value={perfil.sexo || 'No especificado'}
              editable={false}
              colors={colors}
            />
          </View>
        </View>

        {/* Fitness Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Información de Fitness
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <InfoRow
              label="Objetivo Fitness"
              value={formData.objetivo_fitness || 'No especificado'}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, objetivo_fitness: text })}
              colors={colors}
            />
            <InfoRow
              label="Nivel de Experiencia"
              value={perfil.nivel_experiencia}
              editable={false}
              colors={colors}
            />
            <InfoRow
              label="Estado"
              value={perfil.estado}
              editable={false}
              colors={colors}
            />
            <InfoRow
              label="Fecha de Registro"
              value={new Date(perfil.fecha_registro).toLocaleDateString('es-MX')}
              editable={false}
              colors={colors}
            />
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contacto de Emergencia
          </Text>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <InfoRow
              label="Nombre"
              value={formData.nombre_contacto || 'No especificado'}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, nombre_contacto: text })}
              colors={colors}
            />
            <InfoRow
              label="Teléfono"
              value={formData.telefono_contacto || 'No especificado'}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, telefono_contacto: text })}
              colors={colors}
              keyboardType="phone-pad"
            />
            <InfoRow
              label="Parentesco"
              value={formData.parentesco || 'No especificado'}
              editable={editMode}
              onChangeText={(text) => setFormData({ ...formData, parentesco: text })}
              colors={colors}
            />
          </View>
        </View>

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Action Buttons (when editing) */}
        {editMode && (
          <View style={[styles.actionButtons, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancelar}
              disabled={saving}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleGuardar}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  editable: boolean;
  onChangeText?: (text: string) => void;
  colors: any;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  multiline?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  editable,
  onChangeText,
  colors,
  keyboardType = 'default',
  multiline = false,
}) => {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      {editable && onChangeText ? (
        <TextInput
          style={[
            styles.infoInput,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.background,
            },
            multiline && styles.infoInputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      )}
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
  themeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  sedeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sedeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
  },
  infoInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  infoInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PerfilScreen;
