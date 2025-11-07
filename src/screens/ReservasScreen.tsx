import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
// Colors ahora se manejan a través del contexto de tema

interface ReservasScreenProps {
  navigation: any;
}

const ReservasScreen: React.FC<ReservasScreenProps> = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filters = ['Todos', 'Disponibles', 'Premium', 'Básico'];

  // Datos de demo
  const clasesDemo = [
    {
      id: 1,
      nombre: 'Zumba',
      instructor: 'María González',
      salon: 'Salón A',
      horario: 'Lun, Mié, Vie - 7:00 AM',
      cupo: '8 / 25 disponibles'
    },
    {
      id: 2,
      nombre: 'Yoga',
      instructor: 'Ana Martínez',
      salon: 'Salón C',
      horario: 'Lun a Vie - 6:00 AM',
      cupo: '12 / 15 disponibles'
    }
  ];

  const handleReservar = (nombreClase: string) => {
    Alert.alert('Reserva', `¿Deseas reservar la clase de ${nombreClase}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reservar', onPress: () => Alert.alert('¡Éxito!', 'Clase reservada exitosamente') }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reservas</Text>
        <TouchableOpacity style={styles.themeButton}>
          <Text style={styles.themeIcon}>🌙</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Classes List */}
      <ScrollView style={styles.classesList} showsVerticalScrollIndicator={false}>
        {clasesDemo.map((clase) => (
          <View key={clase.id} style={styles.classCard}>
            {/* Class Image */}
            <View style={styles.classImageContainer}>
              <View style={styles.classImagePlaceholder}>
                <Text style={styles.classImageText}>
                  {clase.nombre.charAt(0)}
                </Text>
              </View>
            </View>

            {/* Class Info */}
            <View style={styles.classInfo}>
              <Text style={styles.className}>{clase.nombre}</Text>

              <View style={styles.classDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👤</Text>
                  <Text style={styles.detailText}>{clase.instructor}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>{clase.salon}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>🕐</Text>
                  <Text style={styles.detailText}>{clase.horario}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👥</Text>
                  <Text style={styles.detailText}>{clase.cupo}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.reserveButton}
                onPress={() => handleReservar(clase.nombre)}
              >
                <Text style={styles.reserveButtonText}>Reservar clase</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor se maneja dinámicamente
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
    color: '#000000', // Color temporal - text,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // Color temporal - text,
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
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#000000', // Color temporal - surface,
    borderWidth: 1,
    borderColor: '#000000', // Color temporal - border,
  },
  filterButtonActive: {
    backgroundColor: '#000000', // Color temporal - text,
  },
  filterText: {
    fontSize: 14,
    color: '#000000', // Color temporal - text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#000000', // Color temporal - background,
  },
  classesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  classCard: {
    // backgroundColor se maneja dinámicamente
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#000000', // Color temporal - border,
    overflow: 'hidden',
  },
  classImageContainer: {
    height: 120,
    backgroundColor: '#000000', // Color temporal - surface,
  },
  classImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  classImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000000', // Color temporal - textSecondary,
  },
  classInfo: {
    padding: 15,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Color temporal - text,
    marginBottom: 10,
  },
  classDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#000000', // Color temporal - textSecondary,
    flex: 1,
  },
  reserveButton: {
    backgroundColor: '#000000', // Color temporal - text,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#000000', // Color temporal - background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReservasScreen;
