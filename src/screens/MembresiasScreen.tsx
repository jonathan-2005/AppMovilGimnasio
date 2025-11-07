import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
// Colors ahora se manejan a través del contexto de tema

interface MembresiasScreenProps {
  navigation: any;
}

const MembresiasScreen: React.FC<MembresiasScreenProps> = ({ navigation }) => {
  
  // Datos de demo exactos de tu diseño
  const membresias = [
    {
      id: 1,
      nombre: 'Básica',
      precio: 499,
      icon: '⚡',
      color: '#4CAF50',
      beneficios: [
        'Acceso a área de pesas',
        'Acceso a área cardio',
        'Clases de yoga y pilates',
        'Horario: 6am - 10pm',
        'Casillero personal'
      ]
    },
    {
      id: 2,
      nombre: 'Premium',
      precio: 899,
      icon: '👑',
      color: '#FF9800',
      popular: true,
      beneficios: [
        'Todo lo de Premium',
        'Acceso a todas las clases',
        'Uso de sauna y vapor',
        'Horario: 24/7',
        'Invitados gratis y descuentos',
        'Asesoría nutricional'
      ]
    },
    {
      id: 3,
      nombre: 'Anual Premium',
      precio: 8990,
      icon: '🏆',
      color: '#9C27B0',
      beneficios: [
        'Todo lo de Premium',
        'Plan de entrenamiento personalizado',
        'Evaluaciones médicas',
        'Descuentos en productos',
        'Membresía en productos'
      ]
    }
  ];

  const handleAdquirirMembresia = (nombre: string, precio: number) => {
    Alert.alert(
      'Confirmar Compra',
      `¿Deseas adquirir la membresía ${nombre} por $${precio}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Comprar', 
          onPress: () => Alert.alert('¡Éxito!', 'Membresía adquirida exitosamente')
        }
      ]
    );
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
        <Text style={styles.title}>Membresías</Text>
        <TouchableOpacity style={styles.themeButton}>
          <Text style={styles.themeIcon}>🌙</Text>
        </TouchableOpacity>
      </View>

      {/* Current Membership Status */}
      <View style={styles.currentMembershipContainer}>
        <View style={styles.currentMembershipBadge}>
          <Text style={styles.currentMembershipText}>Básica</Text>
        </View>
        <TouchableOpacity style={styles.renewButton}>
          <Text style={styles.renewButtonText}>Renovar ahora</Text>
        </TouchableOpacity>
      </View>

      {/* Upgrade Message */}
      <View style={styles.upgradeContainer}>
        <Text style={styles.upgradeTitle}>Mejora tu membresía</Text>
        <Text style={styles.upgradeSubtitle}>
          Elige el plan que mejor se adapte a tus necesidades
        </Text>
      </View>

      {/* Memberships List */}
      <ScrollView style={styles.membershipsList} showsVerticalScrollIndicator={false}>
        {membresias.map((membresia) => (
          <View key={membresia.id} style={[
            styles.membershipCard,
            { borderColor: membresia.color }
          ]}>
            {/* Header */}
            <View style={styles.membershipHeader}>
              <View style={styles.membershipTitleContainer}>
                <Text style={styles.membershipIcon}>{membresia.icon}</Text>
                <Text style={styles.membershipName}>{membresia.nombre}</Text>
              </View>
              
              {membresia.popular && (
                <View style={[styles.popularBadge, { backgroundColor: membresia.color }]}>
                  <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
                </View>
              )}
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${membresia.precio}</Text>
              <Text style={styles.pricePeriod}>
                {membresia.nombre.includes('Anual') ? '/año' : '/mes'}
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              {membresia.beneficios.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.actionButton,
                membresia.popular 
                  ? { backgroundColor: membresia.color }
                  : styles.actionButtonOutline
              ]}
              onPress={() => handleAdquirirMembresia(membresia.nombre, membresia.precio)}
            >
              <Text style={[
                styles.actionButtonText,
                membresia.popular 
                  ? styles.actionButtonTextWhite
                  : styles.actionButtonTextDark
              ]}>
                {membresia.popular 
                  ? `Mejorar a ${membresia.nombre}`
                  : `Seleccionar ${membresia.nombre}`
                }
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Payment Methods */}
      <View style={styles.paymentMethodsContainer}>
        <Text style={styles.paymentMethodsTitle}>Métodos de pago aceptados</Text>
        <Text style={styles.paymentMethodsText}>
          • Tarjeta de crédito o débito{'\n'}
          • Transferencia bancaria{'\n'}
          • Efectivo en recepción{'\n'}
          • Todas las membresías se renuevan automáticamente
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Color temporal - background,
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
  currentMembershipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  currentMembershipBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentMembershipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  renewButton: {
    backgroundColor: '#000000', // Color temporal - surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000', // Color temporal - border,
  },
  renewButtonText: {
    fontSize: 12,
    color: '#000000', // Color temporal - text,
    fontWeight: '500',
  },
  upgradeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Color temporal - text,
    marginBottom: 5,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#000000', // Color temporal - textSecondary,
  },
  membershipsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  membershipCard: {
    backgroundColor: '#000000', // Color temporal - background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
  },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  membershipTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  membershipName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Color temporal - text,
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Color temporal - text,
  },
  pricePeriod: {
    fontSize: 14,
    color: '#000000', // Color temporal - textSecondary,
    marginLeft: 4,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkIcon: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 14,
    color: '#000000', // Color temporal - textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonOutline: {
    backgroundColor: '#000000', // Color temporal - background,
    borderWidth: 1,
    borderColor: '#000000', // Color temporal - text,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextWhite: {
    color: 'white',
  },
  actionButtonTextDark: {
    color: '#000000', // Color temporal - text,
  },
  paymentMethodsContainer: {
    backgroundColor: '#000000', // Color temporal - surface,
    padding: 20,
    marginTop: 10,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000', // Color temporal - text,
    marginBottom: 10,
  },
  paymentMethodsText: {
    fontSize: 12,
    color: '#000000', // Color temporal - textSecondary,
    lineHeight: 18,
  },
});

export default MembresiasScreen;
