import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
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
}

const USERS_KEY = 'registered_users';

// Obtener todos los usuarios registrados
export const getRegisteredUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.log('Error al obtener usuarios:', error);
    return [];
  }
};

// Guardar un nuevo usuario
export const saveUser = async (user: User): Promise<boolean> => {
  try {
    const existingUsers = await getRegisteredUsers();
    
    // Verificar si el email ya existe
    const emailExists = existingUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (emailExists) {
      return false; // Email ya registrado
    }
    
    // Agregar nuevo usuario
    const updatedUsers = [...existingUsers, user];
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    return true;
  } catch (error) {
    console.log('Error al guardar usuario:', error);
    return false;
  }
};

// Verificar credenciales de login
export const validateLogin = async (email: string, password: string): Promise<User | null> => {
  try {
    const users = await getRegisteredUsers();
    console.log('validateLogin - usuarios encontrados:', users.length);
    console.log('validateLogin - buscando:', email, password);
    
    const user = users.find(u => {
      console.log('validateLogin - comparando con:', u.email, u.password);
      return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
    });
    
    console.log('validateLogin - usuario encontrado:', user ? 'SÍ' : 'NO');
    return user || null;
  } catch (error) {
    console.log('Error al validar login:', error);
    return null;
  }
};

// Función para limpiar todos los usuarios (debug)
export const clearAllUsers = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USERS_KEY);
    console.log('Todos los usuarios han sido eliminados');
  } catch (error) {
    console.log('Error al limpiar usuarios:', error);
  }
};
