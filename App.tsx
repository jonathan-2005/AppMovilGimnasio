import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';

// Importar pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReservasScreen from './src/screens/ReservasScreen';
import MembresiasScreen from './src/screens/MembresiasScreen';

type Screen = 'Login' | 'Register' | 'Home' | 'Reservas' | 'Membresias';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');

  const navigation = {
    navigate: (screen: Screen) => setCurrentScreen(screen),
    replace: (screen: Screen) => setCurrentScreen(screen),
    goBack: () => {
      // Lógica simple de navegación hacia atrás
      if (currentScreen === 'Register') setCurrentScreen('Login');
      else if (currentScreen === 'Reservas' || currentScreen === 'Membresias') setCurrentScreen('Home');
      else setCurrentScreen('Login');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return <LoginScreen navigation={navigation} />;
      case 'Register':
        return <RegisterScreen navigation={navigation} />;
      case 'Home':
        return <HomeScreen navigation={navigation} />;
      case 'Reservas':
        return <ReservasScreen navigation={navigation} />;
      case 'Membresias':
        return <MembresiasScreen navigation={navigation} />;
      default:
        return <LoginScreen navigation={navigation} />;
    }
  };

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        {renderScreen()}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
