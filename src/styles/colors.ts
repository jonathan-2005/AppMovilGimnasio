// Sistema de colores para modo claro y oscuro

const lightColors = {
  primary: '#000000',      // Negro principal
  secondary: '#333333',    // Gris oscuro
  background: '#FFFFFF',   // Blanco fondo
  surface: '#F5F5F5',     // Gris muy claro
  text: '#000000',        // Texto negro
  textSecondary: '#666666', // Texto gris
  border: '#E0E0E0',      // Bordes grises
  success: '#4CAF50',     // Verde para éxito
  error: '#F44336',       // Rojo para errores
  warning: '#FF9800',     // Naranja para advertencias
  info: '#2196F3',        // Azul para información
};

const darkColors = {
  primary: '#FFFFFF',      // Blanco principal
  secondary: '#CCCCCC',    // Gris claro
  background: '#000000',   // Negro fondo
  surface: '#1A1A1A',     // Gris muy oscuro
  text: '#FFFFFF',        // Texto blanco
  textSecondary: '#AAAAAA', // Texto gris claro
  border: '#333333',      // Bordes grises oscuros
  success: '#66BB6A',     // Verde más claro
  error: '#EF5350',       // Rojo más claro
  warning: '#FFA726',     // Naranja más claro
  info: '#42A5F5',        // Azul más claro
};

export const Colors = {
  light: lightColors,
  dark: darkColors
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof lightColors;
