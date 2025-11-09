import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ReservasService, { SesionDisponible, ActividadDisponible } from '../services/reservasService';

type FilterOption = 'Todos' | 'Disponibles' | 'Premium' | 'Básico';

interface ClaseReservable {
   id: number;
   actividadId: number;
   nombre: string;
   descripcion?: string;
   color?: string;
   instructor: string;
   salon: string;
   sede: string;
   horario: string;
   fecha: string;
   cupo: string;
   cupoTotal: number;
   lugaresDisponibles: number;
   disponible: boolean;
   categoria: 'premium' | 'basico';
 }

 interface ReservasScreenProps {
   navigation: any;
   selectedActivity?: ActividadDisponible | null;
   onClearSelectedActivity?: () => void;
 }

 const FILTERS: FilterOption[] = ['Todos', 'Disponibles', 'Premium', 'Básico'];

 const ReservasScreen: React.FC<ReservasScreenProps> = ({ navigation, selectedActivity = null, onClearSelectedActivity }) => {
   const [activeFilter, setActiveFilter] = useState<FilterOption>('Todos');
   const [clases, setClases] = useState<ClaseReservable[]>([]);
   const [filteredClases, setFilteredClases] = useState<ClaseReservable[]>([]);
   const [loading, setLoading] = useState(false);
   const [refreshing, setRefreshing] = useState(false);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const [bookingId, setBookingId] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

   const { colors, isDarkMode, toggleTheme } = useTheme();
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const parseSesionToClase = useCallback((sesion: SesionDisponible): ClaseReservable => {
     const fechaDate = new Date(`${sesion.fecha}T00:00:00`);
     const dia = fechaDate.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase();
     const fechaTexto = fechaDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

     let horarioTexto = `${dia} ${fechaTexto}`;
     if (sesion.hora_inicio) {
       horarioTexto += ` • ${sesion.hora_inicio}`;
       if (sesion.hora_fin) {
         horarioTexto += ` - ${sesion.hora_fin}`;
       }
     }

     const cupo = `${sesion.lugares_disponibles} / ${sesion.cupo_total} disponibles`;
     const disponible = sesion.puede_reservar && sesion.lugares_disponibles > 0;

     return {
       id: sesion.id,
       actividadId: sesion.actividad.id,
       nombre: sesion.actividad.nombre,
       descripcion: sesion.actividad.descripcion,
       color: sesion.actividad.color,
       instructor: sesion.entrenador?.nombre || 'Entrenador por asignar',
       salon: sesion.espacio?.nombre || 'Espacio por confirmar',
       sede: sesion.sede?.nombre || 'Sede por confirmar',
       horario: horarioTexto,
       fecha: sesion.fecha,
       cupo,
       cupoTotal: sesion.cupo_total,
       lugaresDisponibles: sesion.lugares_disponibles,
       disponible,
       categoria: sesion.categoria,
     };
   }, []);

   const fetchSesiones = useCallback(async () => {
     setLoading(true);
     setErrorMessage(null);
     try {
       const sesiones = await ReservasService.obtenerSesionesDisponibles({
         tipoActividadId: selectedActivity?.id,
       });
       const clasesNormalizadas = sesiones.map(parseSesionToClase);
       setClases(clasesNormalizadas);
     } catch (error: any) {
       console.error('Error al obtener sesiones de clases:', error?.response?.data || error?.message);
       setErrorMessage('No pudimos obtener las clases. Verifica tu conexión e inténtalo de nuevo.');
       setClases([]);
     } finally {
       setLoading(false);
     }
   }, [parseSesionToClase, selectedActivity?.id]);

  const showBanner = useCallback((type: 'success' | 'error', message: string) => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    setBanner({ type, message });
    bannerTimeoutRef.current = setTimeout(() => {
      setBanner(null);
      bannerTimeoutRef.current = null;
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

   useEffect(() => {
     fetchSesiones();
   }, [fetchSesiones]);

   useEffect(() => {
     let data = [...clases];

     if (activeFilter === 'Disponibles') {
       data = data.filter((clase) => clase.disponible);
     } else if (activeFilter === 'Premium') {
       data = data.filter((clase) => clase.categoria === 'premium');
     } else if (activeFilter === 'Básico') {
       data = data.filter((clase) => clase.categoria === 'basico');
     }

     setFilteredClases(data);
   }, [activeFilter, clases]);

   const reservarClase = useCallback(async (clase: ClaseReservable) => {
     try {
       setBookingId(clase.id);
      await ReservasService.reservarSesion(clase.id);
      showBanner('success', `Tu lugar en ${clase.nombre} ha sido registrado.`);
      await fetchSesiones();
     } catch (error: any) {
       const detalle = error?.response?.data?.error || error?.response?.data?.detail || error?.message;
      showBanner('error', detalle || 'Ocurrió un error al reservar.');
     } finally {
       setBookingId(null);
     }
  }, [fetchSesiones, showBanner]);

   const handleReservar = (clase: ClaseReservable) => {
     if (!clase.disponible) {
       Alert.alert('Sin lugares disponibles', 'Esta sesión ya no tiene cupos.');
       return;
     }

     Alert.alert(
       'Reservar clase',
       `¿Deseas reservar la clase ${clase.nombre}?`,
       [
         { text: 'Cancelar', style: 'cancel' },
         {
           text: 'Reservar',
           onPress: () => reservarClase(clase),
         },
       ]
     );
   };

   const onRefresh = useCallback(async () => {
     setRefreshing(true);
     await fetchSesiones();
     setRefreshing(false);
   }, [fetchSesiones]);

   const styles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);
   const themeIcon = isDarkMode ? '☀️' : '🌙';

   const renderEmptyState = () => (
     <View style={styles.feedbackContainer}>
       <Text style={styles.feedbackText}>
         {selectedActivity
           ? `No hay sesiones disponibles para ${selectedActivity.nombre} en este momento.`
           : 'No hay clases disponibles con el filtro seleccionado.'}
       </Text>
     </View>
   );

   return (
     <View style={styles.container}>
       <View style={styles.header}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
           <Text style={styles.backArrow}>←</Text>
         </TouchableOpacity>
        <Text style={styles.title}>Reservas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('MisReservas')}
          >
            <Text style={styles.historyIcon}>🗒️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
            <Text style={styles.themeIcon}>{themeIcon}</Text>
          </TouchableOpacity>
        </View>
       </View>

       {selectedActivity && (
         <View style={styles.selectedActivityContainer}>
           <View style={styles.selectedActivityInfo}>
             <Text style={styles.selectedActivityTitle}>{selectedActivity.nombre}</Text>
             {selectedActivity.descripcion ? (
               <Text style={styles.selectedActivityDescription} numberOfLines={2}>
                 {selectedActivity.descripcion}
               </Text>
             ) : null}
             <Text style={styles.selectedActivityMeta}>
               {selectedActivity.sesiones_disponibles} sesiones disponibles
             </Text>
           </View>
           {onClearSelectedActivity && (
             <TouchableOpacity style={styles.clearActivityButton} onPress={onClearSelectedActivity}>
               <Text style={styles.clearActivityText}>✕</Text>
             </TouchableOpacity>
           )}
         </View>
       )}

       <View style={styles.filtersContainer}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
           {FILTERS.map((filter) => (
             <TouchableOpacity
               key={filter}
               style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
               onPress={() => setActiveFilter(filter)}
             >
               <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                 {filter}
               </Text>
             </TouchableOpacity>
           ))}
         </ScrollView>
       </View>

      {banner && (
        <View
          style={[
            styles.banner,
            banner.type === 'success' ? styles.bannerSuccess : styles.bannerError,
          ]}
        >
          <Text style={styles.bannerText}>{banner.message}</Text>
          <TouchableOpacity
            onPress={() => {
              if (bannerTimeoutRef.current) {
                clearTimeout(bannerTimeoutRef.current);
                bannerTimeoutRef.current = null;
              }
              setBanner(null);
            }}
            style={styles.bannerClose}
          >
            <Text style={styles.bannerCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

       {loading && (
         <View style={styles.feedbackContainer}>
           <ActivityIndicator size="large" color={colors.primary} />
           <Text style={styles.feedbackText}>Cargando clases…</Text>
         </View>
       )}

       {errorMessage && !loading && (
         <View style={styles.feedbackContainer}>
           <Text style={styles.errorText}>{errorMessage}</Text>
           <TouchableOpacity style={styles.retryButton} onPress={fetchSesiones}>
             <Text style={styles.retryButtonText}>Reintentar</Text>
           </TouchableOpacity>
         </View>
       )}

       <ScrollView
         style={styles.classesList}
         showsVerticalScrollIndicator={false}
         refreshControl={
           <RefreshControl
             refreshing={refreshing}
             onRefresh={onRefresh}
             colors={[colors.primary]}
             progressBackgroundColor={colors.surface}
           />
         }
       >
         {!loading && !errorMessage && filteredClases.length === 0 && renderEmptyState()}

         {filteredClases.map((clase) => {
           const disabled = !clase.disponible || bookingId === clase.id;

           return (
             <View key={clase.id} style={styles.classCard}>
               <View style={[styles.classImageContainer, clase.color ? { backgroundColor: clase.color } : null]}>
                 <View style={styles.classImagePlaceholder}>
                   <Text style={styles.classImageText}>{clase.nombre.charAt(0)}</Text>
                 </View>
               </View>

               <View style={styles.classInfo}>
                 <Text style={styles.className}>{clase.nombre}</Text>
                 <Text style={styles.classSubtitle}>{clase.sede}</Text>

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
                   style={[styles.reserveButton, disabled && styles.reserveButtonDisabled]}
                   onPress={() => handleReservar(clase)}
                   disabled={disabled}
                 >
                   {bookingId === clase.id ? (
                     <ActivityIndicator size="small" color={colors.background} />
                   ) : (
                     <Text style={[styles.reserveButtonText, disabled && styles.reserveButtonTextDisabled]}>
                       {clase.disponible ? 'Reservar clase' : 'Cupo lleno'}
                     </Text>
                   )}
                 </TouchableOpacity>
               </View>
             </View>
           );
         })}
       </ScrollView>
     </View>
   );
 };

 const createStyles = (colors: any, isDarkMode: boolean) =>
   StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: colors.background,
     },
     header: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       paddingTop: 50,
       paddingBottom: 20,
       paddingHorizontal: 20,
       backgroundColor: colors.background,
     },
     backButton: {
       width: 40,
       height: 40,
       justifyContent: 'center',
       alignItems: 'center',
     },
     backArrow: {
       fontSize: 24,
       color: colors.text,
     },
     title: {
       fontSize: 20,
       fontWeight: 'bold',
       color: colors.text,
     },
     themeButton: {
       width: 40,
       height: 40,
       justifyContent: 'center',
       alignItems: 'center',
       borderRadius: 20,
       backgroundColor: colors.surface,
     },
     themeIcon: {
       fontSize: 18,
     },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    historyButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyIcon: {
      fontSize: 16,
    },
     selectedActivityContainer: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'space-between',
       marginHorizontal: 20,
       marginBottom: 10,
       paddingHorizontal: 16,
       paddingVertical: 12,
       borderRadius: 16,
       backgroundColor: isDarkMode ? '#1f1f1f' : '#f0f0f0',
     },
     selectedActivityInfo: {
       flex: 1,
       paddingRight: 12,
     },
     selectedActivityTitle: {
       color: colors.text,
       fontWeight: '600',
       fontSize: 16,
       marginBottom: 4,
     },
     selectedActivityDescription: {
       color: colors.textSecondary,
       fontSize: 13,
       marginBottom: 6,
     },
     selectedActivityMeta: {
       color: colors.textSecondary,
       fontSize: 12,
     },
     clearActivityButton: {
       padding: 6,
       borderRadius: 12,
       backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
     },
     clearActivityText: {
       color: colors.text,
       fontSize: 14,
       fontWeight: '600',
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
       backgroundColor: colors.surface,
       borderWidth: 1,
       borderColor: colors.border,
     },
     filterButtonActive: {
       backgroundColor: colors.primary,
       borderColor: colors.primary,
     },
     filterText: {
       fontSize: 14,
       color: colors.textSecondary,
       fontWeight: '500',
     },
     filterTextActive: {
       color: colors.background,
     },
    banner: {
      marginHorizontal: 20,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
    },
    bannerSuccess: {
      backgroundColor: isDarkMode ? '#12361f' : '#e6f4ea',
      borderColor: isDarkMode ? '#1f6e3b' : '#9ad5b3',
    },
    bannerError: {
      backgroundColor: isDarkMode ? '#3a1414' : '#fdeaea',
      borderColor: isDarkMode ? '#8c2f2f' : '#f0b2b2',
    },
    bannerText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      marginRight: 12,
    },
    bannerClose: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
    },
    bannerCloseText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
     classesList: {
       flex: 1,
       paddingHorizontal: 20,
     },
     classCard: {
       borderRadius: 12,
       marginBottom: 15,
       borderWidth: 1,
       borderColor: colors.border,
       overflow: 'hidden',
       backgroundColor: colors.surface,
       shadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.3,
       shadowRadius: 6,
       elevation: 4,
     },
     classImageContainer: {
       height: 110,
       backgroundColor: colors.surface,
       justifyContent: 'center',
       alignItems: 'center',
     },
     classImagePlaceholder: {
       width: 60,
       height: 60,
       borderRadius: 30,
       backgroundColor: isDarkMode ? '#2C2C2C' : '#E0E0E0',
       justifyContent: 'center',
       alignItems: 'center',
     },
     classImageText: {
       fontSize: 30,
       fontWeight: 'bold',
       color: colors.primary,
     },
     classInfo: {
       padding: 16,
     },
     className: {
       fontSize: 18,
       fontWeight: 'bold',
       color: colors.text,
       marginBottom: 4,
     },
     classSubtitle: {
       fontSize: 13,
       color: colors.textSecondary,
       marginBottom: 12,
     },
     classDetails: {
       marginBottom: 15,
     },
     detailRow: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 6,
     },
     detailIcon: {
       fontSize: 14,
       marginRight: 8,
       width: 20,
     },
     detailText: {
       fontSize: 14,
       color: colors.textSecondary,
       flex: 1,
     },
     reserveButton: {
       backgroundColor: colors.primary,
       paddingVertical: 12,
       borderRadius: 8,
       alignItems: 'center',
     },
     reserveButtonDisabled: {
       backgroundColor: colors.border,
     },
     reserveButtonText: {
       color: colors.background,
       fontSize: 16,
       fontWeight: '600',
     },
     reserveButtonTextDisabled: {
       color: colors.textSecondary,
     },
     feedbackContainer: {
       alignItems: 'center',
       justifyContent: 'center',
       paddingVertical: 30,
       paddingHorizontal: 20,
     },
     feedbackText: {
       color: colors.textSecondary,
       textAlign: 'center',
       marginTop: 10,
       fontSize: 14,
     },
     errorText: {
       color: '#f87171',
       textAlign: 'center',
       fontSize: 14,
       marginBottom: 10,
     },
     retryButton: {
       backgroundColor: colors.primary,
       paddingHorizontal: 24,
       paddingVertical: 10,
       borderRadius: 20,
     },
     retryButtonText: {
       color: colors.background,
       fontWeight: '600',
     },
   });

 export default ReservasScreen;
