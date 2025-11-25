import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { LimpiezaProvider } from './src/context/LimpiezaContext';

// Importar pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreenWizard from './src/screens/RegisterScreenWizard';
import HomeScreen from './src/screens/HomeScreen';
import ReservasScreen from './src/screens/ReservasScreen';
import MembresiasScreen from './src/screens/MembresiasScreen';
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import MyReservationsScreen from './src/screens/MyReservationsScreen';
import PerfilScreen from './src/screens/PerfilScreen';

// Pantallas de Limpieza
import TareasLimpiezaScreen from './src/screens/TareasLimpiezaScreen';
import PerfilLimpiezaScreen from './src/screens/PerfilLimpiezaScreen';

type ScreenName =
  | 'Login'
  | 'Register'
  | 'Home'
  | 'Reservas'
  | 'Membresias'
  | 'Actividades'
  | 'MisReservas'
  | 'Perfil'
  | 'TareasLimpieza'
  | 'PerfilLimpieza';

interface ScreenState {
  name: ScreenName;
  params?: Record<string, any> | null;
}

export default function App() {
  const [stack, setStack] = useState<ScreenState[]>([{ name: 'Login', params: null }]);

  const current = stack[stack.length - 1];

  const navigation = {
    navigate: (name: ScreenName, params?: Record<string, any>) => {
      setStack((prev) => [...prev, { name, params: params ?? null }]);
    },
    replace: (name: ScreenName, params?: Record<string, any>) => {
      setStack([{ name, params: params ?? null }]);
    },
    goBack: () => {
      setStack((prev) => {
        if (prev.length <= 1) {
          return prev;
        }
        return prev.slice(0, -1);
      });
    },
    setParams: (params: Record<string, any>) => {
      setStack((prev) => {
        const next = [...prev];
        const currentState = next[next.length - 1];
        next[next.length - 1] = {
          ...currentState,
          params: {
            ...(currentState.params ?? {}),
            ...params,
          },
        };
        return next;
      });
    },
  };

  const renderScreen = () => {
    switch (current.name) {
      case 'Login':
        return <LoginScreen navigation={navigation} />;
      case 'Register':
        return <RegisterScreenWizard navigation={navigation} />;
      case 'Home':
        return <HomeScreen navigation={navigation} />;
      case 'Reservas':
        return (
          <ReservasScreen
            navigation={navigation}
            selectedActivity={current.params?.selectedActivity ?? null}
            onClearSelectedActivity={() => navigation.setParams({ selectedActivity: null })}
          />
        );
      case 'Membresias':
        return <MembresiasScreen navigation={navigation} />;
      case 'Actividades':
        return <ActivitiesScreen navigation={navigation} />;
      case 'MisReservas':
        return <MyReservationsScreen navigation={navigation} />;
      case 'Perfil':
        return <PerfilScreen navigation={navigation} />;
      case 'TareasLimpieza':
        return <TareasLimpiezaScreen navigation={navigation} />;
      case 'PerfilLimpieza':
        return <PerfilLimpiezaScreen navigation={navigation} />;
      default:
        return <LoginScreen navigation={navigation} />;
    }
  };

  return (
    <ThemeProvider>
      <LimpiezaProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          {renderScreen()}
        </SafeAreaProvider>
      </LimpiezaProvider>
    </ThemeProvider>
  );
}
