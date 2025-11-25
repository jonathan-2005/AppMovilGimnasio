# 📱 DISEÑO APP MÓVIL DE LIMPIEZA - ANÁLISIS Y PLAN DE IMPLEMENTACIÓN

## 📋 RESUMEN EJECUTIVO

Se diseñará una **App Móvil para Personal de Limpieza** que permitirá a los empleados de limpieza:
- Iniciar sesión con sus credenciales
- Ver sus tareas asignadas filtradas automáticamente por su sede
- Marcar tareas como completadas
- Ver su información personal (nombre, sede, turno)

## 🎯 CARACTERÍSTICAS PRINCIPALES

### 1. **Autenticación Simplificada**
- Login solo con email y contraseña (sin registro desde app móvil)
- Los empleados son creados desde el panel web administrativo
- Autenticación contra endpoint Django `/api/auth/login/`

### 2. **Perfil Automático**
- Al iniciar sesión, se obtiene automáticamente:
  - Nombre completo del empleado
  - Sede asignada (se usa para filtrar tareas)
  - Turno (matutino/vespertino/nocturno)
  - Email y teléfono

### 3. **Visualización de Tareas**
- **Filtrado automático**: Solo muestra tareas de la sede del empleado
- **Vista por fecha**: Por defecto muestra tareas del día actual
- **Estados de tarea**:
  - ⏳ Pendiente (puede iniciar)
  - ▶️ En progreso (puede completar)
  - ✅ Completada (solo lectura)

### 4. **Gestión de Tareas**
- **Botón "Iniciar Tarea"**: Cambia estado de `pendiente` → `en_progreso`
- **Botón "Completar Tarea"**:
  - Cambia estado de `en_progreso` → `completada`
  - Guarda automáticamente `hora_fin` (hora actual)
  - Permite agregar observaciones opcionales

## 🏗️ ARQUITECTURA TÉCNICA

### **Stack Tecnológico**
```
- React Native + TypeScript
- Expo framework
- Axios para peticiones HTTP
- Context API para estado global (ThemeContext, AuthContext)
- Navegación manual (stack de pantallas)
```

### **Backend Django (ya implementado)**
```
Endpoints disponibles:
✅ POST   /api/auth/login/                    # Login
✅ GET    /api/limpieza/personal/             # Obtener info del empleado
✅ GET    /api/limpieza/asignaciones/         # Listar tareas
✅ POST   /api/limpieza/asignaciones/{id}/marcar_en_progreso/
✅ POST   /api/limpieza/asignaciones/{id}/marcar_completada/
```

## 📱 DISEÑO DE PANTALLAS

### **1. LoginScreen (ya existe - se reutiliza)**
```
┌──────────────────────────────┐
│  🏋️  FitReserva Limpieza     │
│                              │
│  Email:                      │
│  ┌────────────────────────┐  │
│  │ empleado@gmail.com     │  │
│  └────────────────────────┘  │
│                              │
│  Contraseña:                 │
│  ┌────────────────────────┐  │
│  │ ••••••••          👁️  │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   INICIAR SESIÓN       │  │
│  └────────────────────────┘  │
│                              │
│         🌙 (tema)            │
└──────────────────────────────┘

Flujo:
1. Empleado ingresa email y contraseña
2. Se llama a /api/auth/login/
3. Se guarda token en AsyncStorage
4. Se obtiene info del empleado desde /api/limpieza/personal/
5. Se navega a HomeScreen (TareasScreen)
```

### **2. HomeScreen → TareasLimpiezaScreen (nueva)**
```
┌──────────────────────────────────┐
│  Hola, Juan Pérez 👋        🌙  │
│  Sede: Principal                 │
│  Turno: Matutino                 │
├──────────────────────────────────┤
│  📅 Mis Tareas - Hoy             │
│  ┌────────────────────────────┐  │
│  │ 📅 22/11/2025              │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  ┌──────────────────────────┐    │
│  │ 🟡 ALTA | ⏳ Pendiente   │    │
│  │                          │    │
│  │ 🧹 Limpieza profunda     │    │
│  │    de baños              │    │
│  │                          │    │
│  │ 📍 Baño Principal        │    │
│  │ ⏱️  30 min               │    │
│  │                          │    │
│  │ 💬 Instrucciones:        │    │
│  │ Desinfectar todas las    │    │
│  │ superficies              │    │
│  │                          │    │
│  │  ┌──────────────┐        │    │
│  │  │ ▶️ INICIAR   │        │    │
│  │  └──────────────┘        │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │ 🟢 MEDIA | ▶️ En Progreso│    │
│  │                          │    │
│  │ 🧹 Limpieza de gimnasio  │    │
│  │                          │    │
│  │ 📍 Sala de Pesas         │    │
│  │ ⏱️  45 min               │    │
│  │                          │    │
│  │  ┌──────────────┐        │    │
│  │  │ ✅ COMPLETAR │        │    │
│  │  └──────────────┘        │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │ 🔴 BAJA | ✅ Completada  │    │
│  │                          │    │
│  │ 🧹 Limpieza vestidores   │    │
│  │                          │    │
│  │ 📍 Vestidor Hombres      │    │
│  │ ⏱️  20 min               │    │
│  │ ✓ Completada a las 10:30 │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌────────────────────────────┐  │
│  │  👤 MI PERFIL              │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  🚪 CERRAR SESIÓN          │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Componentes Visuales:
- Header con nombre, sede y turno
- Selector de fecha (por defecto hoy)
- Lista de tarjetas de tareas con:
  * Badge de prioridad (🔴 Alta, 🟡 Media, 🟢 Baja)
  * Badge de estado (⏳ Pendiente, ▶️ En Progreso, ✅ Completada)
  * Nombre de la tarea
  * Espacio asignado
  * Duración estimada
  * Notas/instrucciones
  * Botón de acción según estado
```

### **3. PerfilScreen (nueva)**
```
┌──────────────────────────────┐
│  ← Volver                    │
├──────────────────────────────┤
│  👤 Mi Perfil                │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │  👨 Juan Pérez López   │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  📧 Email                    │
│  juan.perez@gmail.com        │
│                              │
│  📱 Teléfono                 │
│  +52 123 456 7890            │
│                              │
│  🏢 Sede                     │
│  Gimnasio Principal          │
│                              │
│  🕐 Turno                    │
│  Matutino (06:00 - 14:00)    │
│                              │
│  📋 Puesto                   │
│  Personal de Limpieza        │
│                              │
│  📊 Estadísticas             │
│  ┌────────────────────────┐  │
│  │ Tareas Completadas Hoy │  │
│  │         5 / 7          │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ Total Esta Semana      │  │
│  │         28             │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘

Solo lectura - sin edición
```

### **4. Modal Completar Tarea (nuevo)**
```
┌──────────────────────────────┐
│  ✅ Completar Tarea          │
├──────────────────────────────┤
│                              │
│  Tarea:                      │
│  Limpieza profunda de baños  │
│                              │
│  Espacio:                    │
│  Baño Principal              │
│                              │
│  Observaciones (opcional):   │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │ Agregar comentarios... │  │
│  │                        │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ℹ️ Se guardará              │
│  automáticamente la hora     │
│  de finalización             │
│                              │
│  ┌────────────────────────┐  │
│  │   CONFIRMAR            │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   CANCELAR             │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

## 🔧 IMPLEMENTACIÓN TÉCNICA

### **Archivos a Crear**

#### **1. Services**
```typescript
// src/services/limpiezaService.ts
import api from './api';

interface Tarea {
  id: number;
  tarea_nombre: string;
  espacio_nombre: string;
  sede_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  tarea_duracion: number;
  tarea_prioridad: 'alta' | 'media' | 'baja';
  notas: string;
  personal_nombre: string;
}

interface PersonalLimpieza {
  empleado_id: number;
  empleado_nombre: string;
  email: string;
  telefono: string;
  turno: string;
  sede_id: number;
  sede_nombre: string;
  tareas_pendientes_count: number;
}

class LimpiezaService {
  // Obtener información del empleado actual
  async getEmpleadoActual(): Promise<PersonalLimpieza> {
    const response = await api.get('/api/limpieza/personal/me/');
    return response.data;
  }

  // Obtener tareas del empleado (filtradas por sede automáticamente en backend)
  async getTareas(fecha?: string): Promise<Tarea[]> {
    const params = fecha ? { fecha } : { fecha: new Date().toISOString().split('T')[0] };
    const response = await api.get('/api/limpieza/asignaciones/', { params });
    return response.data;
  }

  // Marcar tarea como en progreso
  async iniciarTarea(tareaId: number): Promise<Tarea> {
    const response = await api.post(`/api/limpieza/asignaciones/${tareaId}/marcar_en_progreso/`);
    return response.data;
  }

  // Marcar tarea como completada
  async completarTarea(tareaId: number, observaciones?: string): Promise<Tarea> {
    const response = await api.post(`/api/limpieza/asignaciones/${tareaId}/marcar_completada/`, {
      observaciones_completado: observaciones || ''
    });
    return response.data;
  }
}

export default new LimpiezaService();
```

#### **2. Context para Limpieza**
```typescript
// src/context/LimpiezaContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import limpiezaService from '../services/limpiezaService';

interface PersonalLimpieza {
  empleado_id: number;
  empleado_nombre: string;
  email: string;
  telefono: string;
  turno: string;
  sede_id: number;
  sede_nombre: string;
  tareas_pendientes_count: number;
}

interface LimpiezaContextType {
  empleado: PersonalLimpieza | null;
  loadEmpleado: () => Promise<void>;
  clearEmpleado: () => void;
  loading: boolean;
}

const LimpiezaContext = createContext<LimpiezaContextType | undefined>(undefined);

export const LimpiezaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [empleado, setEmpleado] = useState<PersonalLimpieza | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEmpleado = async () => {
    setLoading(true);
    try {
      const data = await limpiezaService.getEmpleadoActual();
      setEmpleado(data);
    } catch (error) {
      console.error('Error al cargar empleado:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearEmpleado = () => {
    setEmpleado(null);
  };

  return (
    <LimpiezaContext.Provider value={{ empleado, loadEmpleado, clearEmpleado, loading }}>
      {children}
    </LimpiezaContext.Provider>
  );
};

export const useLimpieza = () => {
  const context = useContext(LimpiezaContext);
  if (!context) {
    throw new Error('useLimpieza must be used within LimpiezaProvider');
  }
  return context;
};
```

#### **3. Screens**
```typescript
// src/screens/TareasLimpiezaScreen.tsx
// src/screens/PerfilLimpiezaScreen.tsx
```

### **Estilos Reutilizados**
- Se usará el mismo `ThemeContext` (light/dark mode)
- Paleta de colores existente
- Componentes de tarjetas similares a `ActivitiesScreen`
- Botones y inputs consistentes con `LoginScreen`

### **Colores para Estados**
```typescript
const estadoColors = {
  pendiente: {
    bg: '#FFF3CD',
    text: '#856404',
    icon: '⏳'
  },
  en_progreso: {
    bg: '#D1ECF1',
    text: '#0C5460',
    icon: '▶️'
  },
  completada: {
    bg: '#D4EDDA',
    text: '#155724',
    icon: '✅'
  }
};

const prioridadColors = {
  alta: {
    bg: '#F8D7DA',
    text: '#721C24',
    icon: '🔴'
  },
  media: {
    bg: '#FFF3CD',
    text: '#856404',
    icon: '🟡'
  },
  baja: {
    bg: '#D4EDDA',
    text: '#155724',
    icon: '🟢'
  }
};
```

## 🔄 FLUJO DE USUARIO COMPLETO

```
1. APERTURA DE APP
   ↓
2. LoginScreen
   - Ingresa email: empleado@gmail.com
   - Ingresa contraseña: ••••••
   - Tap en "INICIAR SESIÓN"
   ↓
3. AUTENTICACIÓN
   - POST /api/auth/login/ → Obtiene token
   - Token guardado en AsyncStorage
   - GET /api/limpieza/personal/me/ → Obtiene datos del empleado
   ↓
4. TareasLimpiezaScreen (Home)
   - Header muestra: "Hola, Juan Pérez 👋"
   - Muestra: "Sede: Gimnasio Principal"
   - Muestra: "Turno: Matutino"
   - GET /api/limpieza/asignaciones/?fecha=2025-11-22
   - Lista tareas filtradas por sede automáticamente
   ↓
5. USUARIO VE TAREA PENDIENTE
   - Card muestra: "🟡 ALTA | ⏳ Pendiente"
   - Nombre: "Limpieza profunda de baños"
   - Espacio: "Baño Principal"
   - Duración: "30 min"
   - Botón: "▶️ INICIAR"
   ↓
6. TAP EN "INICIAR TAREA"
   - POST /api/limpieza/asignaciones/15/marcar_en_progreso/
   - Estado cambia: pendiente → en_progreso
   - Card actualiza a: "🟡 ALTA | ▶️ En Progreso"
   - Botón cambia a: "✅ COMPLETAR"
   ↓
7. EMPLEADO COMPLETA LA LIMPIEZA
   - Tap en "✅ COMPLETAR"
   - Se abre modal "Completar Tarea"
   - (Opcional) Ingresa observaciones
   - Tap en "CONFIRMAR"
   ↓
8. CONFIRMACIÓN
   - POST /api/limpieza/asignaciones/15/marcar_completada/
   - Body: { observaciones_completado: "Todo limpio" }
   - Backend guarda automáticamente hora_fin
   - Estado cambia: en_progreso → completada
   - Card actualiza a: "🟡 ALTA | ✅ Completada"
   - Muestra: "✓ Completada a las 10:30"
   - Botón desaparece (solo lectura)
   ↓
9. NAVEGACIÓN A PERFIL
   - Tap en "👤 MI PERFIL"
   - PerfilLimpiezaScreen muestra:
     * Nombre completo
     * Email y teléfono
     * Sede y turno
     * Estadísticas del día
   ↓
10. CERRAR SESIÓN
    - Tap en "🚪 CERRAR SESIÓN"
    - Elimina token de AsyncStorage
    - Navega a LoginScreen
```

## 🎨 DISEÑO VISUAL (Similar a App Cliente)

### **Elementos Reutilizados**
✅ Header con saludo personalizado (como HomeScreen)
✅ Cards con sombras y bordes redondeados (como ActivitiesScreen)
✅ Botones con gradientes y efectos hover (como LoginScreen)
✅ Badges de estado con colores semánticos (como MyReservationsScreen)
✅ Theme toggle (modo claro/oscuro) en todas las pantallas
✅ Navegación simple con stack manual

### **Nuevos Elementos**
🆕 Badge de prioridad (Alta/Media/Baja) con íconos
🆕 Selector de fecha para filtrar tareas
🆕 Modal de confirmación para completar tarea
🆕 Timer visual para duración estimada
🆕 Indicador de progreso del día (X/Y tareas completadas)

## 📊 ESTRUCTURA DE DATOS

### **Tarea (Asignación)**
```typescript
interface Tarea {
  id: number;
  tarea_nombre: string;              // "Limpieza profunda de baños"
  tarea_duracion: number;            // 30 (minutos)
  tarea_prioridad: 'alta' | 'media' | 'baja';
  espacio_nombre: string;            // "Baño Principal"
  sede_nombre: string;               // "Gimnasio Principal"
  fecha: string;                     // "2025-11-22"
  hora_inicio: string;               // "09:00:00"
  hora_fin: string | null;           // "09:30:00" o null
  estado: 'pendiente' | 'en_progreso' | 'completada';
  notas: string;                     // Instrucciones del admin
  observaciones_completado: string;  // Comentarios del empleado
  personal_nombre: string;           // "Juan Pérez"
  fecha_completada: string | null;   // "2025-11-22T09:30:00Z"
}
```

### **Personal de Limpieza**
```typescript
interface PersonalLimpieza {
  empleado_id: number;               // ID del empleado
  empleado_nombre: string;           // "Juan Pérez López"
  email: string;                     // "juan.perez@gmail.com"
  telefono: string;                  // "+52 123 456 7890"
  turno: string;                     // "Matutino"
  sede_id: number;                   // 1
  sede_nombre: string;               // "Gimnasio Principal"
  espacios_asignados: Array<{        // Espacios donde puede limpiar
    id: number;
    nombre: string;
    sede: string;
  }>;
  tareas_pendientes_count: number;   // 3
}
```

## 🔐 SEGURIDAD Y VALIDACIONES

### **Autenticación**
- Token JWT almacenado en AsyncStorage
- Interceptor de Axios agrega header: `Authorization: Token ${token}`
- Logout elimina token y navega a LoginScreen

### **Validaciones Frontend**
- Solo empleados con rol "Personal de Limpieza" pueden acceder
- Tareas filtradas automáticamente por sede del empleado
- Botones deshabilitados según estado de tarea
- No se puede completar tarea que no esté "en progreso"

### **Validaciones Backend (ya implementadas)**
✅ Solo empleado asignado puede marcar como completada
✅ No se puede completar tarea ya completada
✅ Hora de finalización se guarda automáticamente
✅ Filtrado por sede en queryset

## 📱 NAVEGACIÓN

```
App.tsx
 ├─ LoginScreen (inicial)
 └─ TareasLimpiezaScreen (después de login)
     ├─ PerfilLimpiezaScreen
     └─ Modal Completar Tarea
```

### **Actualización de App.tsx**
```typescript
type ScreenName =
  | 'Login'
  | 'TareasLimpieza'
  | 'PerfilLimpieza';

// Agregar en renderScreen():
case 'TareasLimpieza':
  return <TareasLimpiezaScreen navigation={navigation} />;
case 'PerfilLimpieza':
  return <PerfilLimpiezaScreen navigation={navigation} />;
```

## 🚀 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Setup Básico** (1-2 horas)
1. ✅ Crear `limpiezaService.ts`
2. ✅ Crear `LimpiezaContext.tsx`
3. ✅ Actualizar `App.tsx` con nuevas rutas

### **Fase 2: Pantalla Principal** (2-3 horas)
1. ✅ Crear `TareasLimpiezaScreen.tsx`
2. ✅ Implementar header con info del empleado
3. ✅ Implementar lista de tareas con cards
4. ✅ Implementar botones de acción por estado

### **Fase 3: Interacciones** (1-2 horas)
1. ✅ Implementar "Iniciar Tarea"
2. ✅ Implementar modal "Completar Tarea"
3. ✅ Implementar refresh al completar
4. ✅ Agregar selector de fecha

### **Fase 4: Perfil** (1 hora)
1. ✅ Crear `PerfilLimpiezaScreen.tsx`
2. ✅ Mostrar información del empleado
3. ✅ Agregar estadísticas básicas

### **Fase 5: Testing y Ajustes** (1-2 horas)
1. ✅ Probar flujo completo de inicio a fin
2. ✅ Ajustar estilos y responsividad
3. ✅ Manejar casos de error
4. ✅ Optimizar rendimiento

## 📝 NOTAS IMPORTANTES

1. **No hay registro desde app móvil**: Los empleados se crean desde panel web
2. **Filtrado automático por sede**: El backend filtra tareas por la sede del empleado
3. **Hora de finalización automática**: Se guarda al completar, no se ingresa manualmente
4. **Solo lectura del perfil**: El empleado no puede editar su información
5. **Sin gestión de horarios**: Esto se maneja desde el panel web
6. **Tema light/dark reutilizado**: Consistencia visual con app de clientes

## 🎯 BENEFICIOS

✅ **Simplicidad**: Solo lo necesario para el personal de limpieza
✅ **Eficiencia**: Menos clics para completar tareas
✅ **Consistencia**: Mismo diseño y flujo que app de clientes
✅ **Automatización**: Hora de inicio y fin se guardan automáticamente
✅ **Claridad**: Estados visuales claros con íconos y colores
✅ **Filtrado inteligente**: Solo ve tareas de su sede
✅ **Offline-ready**: Puede agregarse soporte offline en el futuro

---

**Documento creado**: 22 de noviembre de 2025
**Versión**: 1.0
**Estado**: Pendiente de implementación
