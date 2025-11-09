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
import ActivitiesScreen from './src/screens/ActivitiesScreen';

type ScreenName = 'Login' | 'Register' | 'Home' | 'Reservas' | 'Membresias' | 'Actividades';

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
        return <RegisterScreen navigation={navigation} />;
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
