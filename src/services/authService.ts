import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sede } from '../types/sede';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    nombre: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  telefono: string;
  fecha_nacimiento?: string;
  genero?: string;
  objetivo_fitness?: string;
  nivel_experiencia?: string;
  sede_id: number; // ✅ AGREGADO: sede_id es ahora requerido
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Intentando login con backend Django:', credentials.email);
      
      const response = await api.post('/token/', credentials);
      console.log('✅ Login exitoso con backend:', response.data);
      
      // Guardar tokens
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en login con backend:', error.response?.data || error.message);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<any> {
    try {
      console.log('📝 Registrando usuario en backend Django:', userData.email);
      
      const response = await api.post('/registro/cliente/', userData);
      console.log('✅ Registro exitoso en backend:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en registro con backend:', error.response?.data || error.message);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    console.log('🚪 Logout completado');
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('access_token');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Verificar si el backend está disponible
  // Usa un endpoint público (OPTIONS) para verificar conectividad sin requerir autenticación
  async checkBackendConnection(): Promise<boolean> {
    try {
      // Hacer una petición OPTIONS al endpoint de registro (público) para verificar conectividad
      const response = await api.options('/registro/cliente/');
      console.log('🌐 Backend Django conectado correctamente');
      return true;
    } catch (error: any) {
      // Si falla, intentar con un HEAD simple para verificar que el servidor responde
      try {
        await api.head('/registro/cliente/');
        return true;
      } catch (headError) {
        console.error('🔴 Backend Django no disponible:', error?.message || error);
        return false;
      }
    }
  }

  // ✅ NUEVO: Obtener sedes disponibles para registro
  async obtenerSedesDisponibles(): Promise<Sede[]> {
    try {
      console.log('🏢 Obteniendo sedes disponibles...');
      const response = await api.get('/sedes-disponibles/');
      console.log(`✅ ${response.data.length} sedes disponibles`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al obtener sedes:', error.response?.data || error.message);
      throw error;
    }
  }

  // ✅ NUEVO: Obtener información del usuario autenticado
  async obtenerUsuarioActual(): Promise<any> {
    try {
      console.log('👤 Obteniendo información del usuario actual...');
      const response = await api.get('/auth/me/');
      console.log('✅ Información de usuario obtenida:', response.data.email);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al obtener usuario actual:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new AuthService();
