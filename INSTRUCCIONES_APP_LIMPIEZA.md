# App Móvil de Limpieza - Instrucciones de Uso

## Resumen de la Implementación

Se ha implementado exitosamente la aplicación móvil para el personal de limpieza del gimnasio. La app permite a los empleados de limpieza ver sus tareas asignadas y marcarlas como completadas desde sus dispositivos móviles.

## Características Implementadas

### 1. Autenticación Automática por Rol
- Al iniciar sesión, el sistema detecta automáticamente si el usuario es personal de limpieza
- Si es personal de limpieza → navega a `TareasLimpiezaScreen`
- Si es cliente → navega a `Home` (pantalla normal de clientes)

### 2. Pantalla Principal de Tareas (TareasLimpiezaScreen)
- **Header**: Muestra nombre del empleado, sede y turno
- **Selector de fecha**: Actualmente muestra "Hoy" (puede extenderse para seleccionar otras fechas)
- **Estadísticas**: Cards con resumen de tareas completadas/pendientes
- **Lista de tareas**: Muestra todas las tareas asignadas al empleado con:
  - Badge de prioridad (Alta/Media/Baja)
  - Badge de estado (Pendiente/En Progreso/Completada)
  - Información de la tarea (espacio, horario, duración)
  - Botones de acción según el estado
- **Pull-to-refresh**: Deslizar hacia abajo para recargar tareas
- **Footer**: Botones para ver perfil y cerrar sesión

### 3. Pantalla de Perfil (PerfilLimpiezaScreen)
- Información personal del empleado (solo lectura)
- Contacto (email, teléfono)
- Sede y turno asignado
- Espacios asignados
- Estadísticas de rendimiento

### 4. Modal de Completar Tarea
- Campo opcional para agregar observaciones
- Confirma la finalización de la tarea
- Guarda automáticamente la hora de finalización en el backend

## Archivos Creados/Modificados

### Backend
1. **C:\gimnasio\empleados\views_limpieza.py**
   - Agregado endpoint `GET /api/limpieza/personal/me/` para obtener info del empleado actual
   - Modificado filtro en `AsignacionTareaViewSet.get_queryset()` para filtrar automáticamente por empleado autenticado
   - Modificado `marcar_completada()` para usar el usuario autenticado (no requiere enviar empleado_id)

### Frontend (App Móvil)
1. **C:\gimnasio\AppMovilGimnasio\src\services\limpiezaService.ts** ✅
   - Servicio completo para comunicación con API de limpieza
   - Métodos: `getEmpleadoActual()`, `getTareas()`, `iniciarTarea()`, `completarTarea()`

2. **C:\gimnasio\AppMovilGimnasio\src\context\LimpiezaContext.tsx** ✅
   - Context para manejo global de estado de limpieza
   - Maneja empleado, tareas, loading states y errores

3. **C:\gimnasio\AppMovilGimnasio\App.tsx** ✅
   - Agregadas rutas `TareasLimpieza` y `PerfilLimpieza`
   - Envuelto en `LimpiezaProvider`

4. **C:\gimnasio\AppMovilGimnasio\src\screens\LoginScreen.tsx** ✅
   - Detecta automáticamente si el usuario es personal de limpieza
   - Navega a la pantalla correcta según el rol

5. **C:\gimnasio\AppMovilGimnasio\src\screens\TareasLimpiezaScreen.tsx** ✅
   - Pantalla principal con lista de tareas
   - Modal para completar tareas
   - Pull-to-refresh
   - Navegación a perfil

6. **C:\gimnasio\AppMovilGimnasio\src\screens\PerfilLimpiezaScreen.tsx** ✅
   - Pantalla de perfil del empleado
   - Información de contacto
   - Espacios asignados
   - Estadísticas

## Cómo Probar la Aplicación

### 1. Iniciar el Backend
```bash
cd C:\gimnasio
python manage.py runserver 0.0.0.0:8000
```

### 2. Iniciar la App Móvil
```bash
cd C:\gimnasio\AppMovilGimnasio
npx expo start
```

### 3. Configurar IP del Backend
Asegúrate de que el archivo `C:\gimnasio\AppMovilGimnasio\src\config\config.ts` tenga la IP correcta de tu computadora:
```typescript
export const config = {
  API_BASE_URL: 'http://TU_IP_LOCAL:8000',
  API_TIMEOUT: 10000,
};
```

### 4. Iniciar Sesión
1. Abre la app en tu dispositivo móvil o emulador
2. Ingresa las credenciales de un empleado de limpieza existente
3. La app detectará automáticamente que es personal de limpieza y navegará a la pantalla de tareas

### 5. Usar la Aplicación

#### Ver Tareas
- La pantalla principal muestra todas las tareas asignadas al empleado para el día actual
- Las tareas están filtradas automáticamente por la sede del empleado
- Cada tarea muestra:
  - Nombre de la tarea
  - Espacio a limpiar
  - Horario (inicio y fin estimado)
  - Prioridad (color del badge)
  - Estado actual
  - Observaciones (si las hay)

#### Iniciar una Tarea
1. Busca una tarea con estado "Pendiente"
2. Presiona el botón "Iniciar"
3. Confirma la acción
4. La tarea cambiará a estado "En Progreso"

#### Completar una Tarea
1. Busca una tarea con estado "En Progreso" o "Pendiente"
2. Presiona el botón "Completar"
3. Opcionalmente, agrega observaciones sobre el trabajo realizado
4. Presiona "Confirmar"
5. La tarea se marcará como "Completada"
6. Se guardará automáticamente la hora de finalización

#### Ver Perfil
1. Presiona el botón "Mi Perfil" en la parte inferior de la pantalla
2. Verás tu información personal, espacios asignados y estadísticas

#### Actualizar Lista de Tareas
- Desliza hacia abajo en la lista de tareas para recargar los datos del servidor

#### Cerrar Sesión
- Presiona el botón "Cerrar Sesión" en la parte inferior de la pantalla

## Flujo de Datos

```
Login → LoginScreen
  ├─→ Intenta obtener personal de limpieza (GET /api/limpieza/personal/me/)
  │   ├─→ Éxito → Es personal de limpieza → TareasLimpiezaScreen
  │   └─→ Error → Es cliente → HomeScreen
  │
TareasLimpiezaScreen
  ├─→ Al montar: loadEmpleado() + loadTareas()
  ├─→ GET /api/limpieza/personal/me/ (info del empleado)
  ├─→ GET /api/limpieza/asignaciones/?fecha=YYYY-MM-DD (tareas del día)
  │   └─→ Backend filtra automáticamente por empleado autenticado
  │
  ├─→ Iniciar Tarea
  │   └─→ POST /api/limpieza/asignaciones/{id}/marcar_en_progreso/
  │
  └─→ Completar Tarea
      └─→ POST /api/limpieza/asignaciones/{id}/marcar_completada/
          └─→ Body: { observaciones_completado: "texto opcional" }
          └─→ Backend usa empleado autenticado automáticamente
```

## Requisitos Previos

### Base de Datos
Debe existir al menos un empleado de limpieza en la base de datos con:
- Usuario con email y contraseña válidos
- Persona asociada al usuario
- Empleado asociado a la persona
- PersonalLimpieza asociado al empleado
- Espacios asignados al personal de limpieza
- Tareas asignadas al personal de limpieza

### Verificar Datos
Puedes verificar los datos existentes con el Django Admin:
```
http://localhost:8000/admin/
```

## Solución de Problemas

### Error "No se pudo cargar la información del empleado"
- Verifica que el usuario logueado tenga un registro en la tabla `PersonalLimpieza`
- Verifica que el backend esté corriendo
- Verifica la IP configurada en `config.ts`

### No aparecen tareas
- Verifica que existan tareas asignadas al empleado para la fecha seleccionada
- Verifica que las tareas estén en estado "pendiente" o "en_progreso"
- Intenta hacer pull-to-refresh

### Error al iniciar/completar tarea
- Verifica que tengas conexión con el backend
- Verifica que la tarea esté asignada a tu empleado
- Verifica los logs del servidor Django para más detalles

## Próximos Pasos (Opcionales)

Si quieres extender la funcionalidad:

1. **Selector de Fecha**: Permitir ver tareas de otros días
2. **Historial**: Ver tareas completadas de días anteriores
3. **Notificaciones**: Alertas cuando se asigne una nueva tarea
4. **Fotos**: Permitir subir fotos de las áreas limpiadas
5. **Checklist**: Implementar checklist detallado por tarea
6. **Modo Offline**: Guardar tareas localmente y sincronizar después

## Resumen de Endpoints Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/token/` | Login con email y password |
| GET | `/api/limpieza/personal/me/` | Info del empleado autenticado |
| GET | `/api/limpieza/asignaciones/?fecha=YYYY-MM-DD` | Tareas asignadas (filtradas automáticamente) |
| POST | `/api/limpieza/asignaciones/{id}/marcar_en_progreso/` | Iniciar una tarea |
| POST | `/api/limpieza/asignaciones/{id}/marcar_completada/` | Completar una tarea |

## Notas Importantes

- ✅ El backend filtra automáticamente las tareas por el empleado autenticado
- ✅ No es necesario pasar el `empleado_id` al completar tareas
- ✅ La hora de finalización se guarda automáticamente cuando se completa una tarea
- ✅ Los empleados solo pueden ver y completar sus propias tareas
- ✅ La app reutiliza los mismos estilos y componentes de la app de clientes
