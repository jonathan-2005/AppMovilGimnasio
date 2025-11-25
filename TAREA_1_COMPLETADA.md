# ✅ TAREA 1 COMPLETADA: Registro Multi-Sede

## 🎯 Objetivo
Implementar el registro de clientes con selección de sede para el sistema multi-sede.

## ✅ Cambios Realizados

### Backend (Django)

#### 1. `authentication/views.py`
**Modificaciones**:
- ✅ Línea 200: Agregado `sede_id` a campos requeridos
- ✅ Líneas 218-226: Validación de que la sede existe
- ✅ Línea 253: Cliente se crea con la sede seleccionada (NO primera sede automática)
- ✅ Líneas 265-267: Response incluye `sede_id` y `sede_nombre`

**Nuevas vistas creadas**:
- ✅ `SedesDisponiblesView` (líneas 277-301)
  - Endpoint: `GET /api/sedes-disponibles/`
  - Público (AllowAny)
  - Retorna: `[{id, nombre, direccion, telefono}]`

- ✅ `UsuarioActualView` (líneas 304-353)
  - Endpoint: `GET /api/auth/me/`
  - Requiere autenticación
  - Retorna información completa del usuario autenticado

#### 2. `authentication/urls.py`
**Nuevas rutas**:
- ✅ Línea 36: `path('sedes-disponibles/', SedesDisponiblesView.as_view())`
- ✅ Línea 39: `path('auth/me/', UsuarioActualView.as_view())`

---

### App Móvil (React Native)

#### 1. Nuevo archivo: `src/types/sede.ts`
```typescript
export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
}
```

#### 2. `src/services/authService.ts`
**Modificaciones**:
- ✅ Línea 3: Import de tipo `Sede`
- ✅ Línea 31: `sede_id` agregado a `RegisterRequest` (requerido)

**Nuevos métodos**:
- ✅ `obtenerSedesDisponibles()` (líneas 103-112)
  - GET /sedes-disponibles/
  - Retorna: Promise<Sede[]>

- ✅ `obtenerUsuarioActual()` (líneas 115-125)
  - GET /auth/me/
  - Retorna: Promise<any> (información del usuario)

#### 3. `src/screens/RegisterScreen.tsx`
**Modificaciones**:
- ✅ Línea 12: Import de `Picker` de `@react-native-picker/picker`
- ✅ Línea 10: Import de `ActivityIndicator`
- ✅ Línea 15: Import de tipo `Sede`
- ✅ Línea 37: Agregado `sede_id: 0` al estado del formulario
- ✅ Línea 39: Estado `sedes` para almacenar sedes disponibles
- ✅ Línea 40: Estado `loadingSedes` para indicador de carga
- ✅ Líneas 45-61: `useEffect` para cargar sedes al montar componente
- ✅ Línea 72: Validación de `sede_id` en campos requeridos
- ✅ Línea 132: Incluir `sede_id` en payload de registro

**Nuevo JSX (líneas 289-321)**:
- Sección "Selecciona tu sede"
- Spinner de carga mientras se obtienen las sedes
- Picker con lista de sedes disponibles
- Formato: "Nombre Sede - Dirección"

**Nuevos estilos (líneas 531-551)**:
- `pickerContainer`: Contenedor del picker con borde
- `picker`: Altura del picker
- `loadingContainer`: Contenedor del spinner
- `loadingText`: Texto de carga

#### 4. Dependencia instalada
```bash
npm install @react-native-picker/picker
```

---

## 🧪 Cómo Probar

### Prerequisitos
1. Backend Django debe estar corriendo en `http://192.168.100.7:8000`
2. Debe haber al menos 1 sede en la base de datos

### Pasos para probar desde el celular:

1. **Iniciar backend**:
   ```bash
   cd c:\gimnasio
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Iniciar app móvil** (en otra terminal):
   ```bash
   cd c:\gimnasio\AppMovilGimnasio
   npm start
   ```

3. **En el celular**:
   - Abrir la app Expo Go
   - Escanear el QR code
   - Navegar a la pantalla de Registro

### Verificaciones esperadas:

#### ✅ Carga de sedes
- Al entrar a la pantalla de registro, debe aparecer "Cargando sedes disponibles..."
- Después debe mostrarse un selector con todas las sedes
- Los logs en Metro deben mostrar:
  ```
  🏢 Obteniendo sedes disponibles...
  ✅ X sedes disponibles
  ```

#### ✅ Validación de sede
- Si intentas registrarte SIN seleccionar una sede, debe mostrar:
  ```
  "Por favor completa todos los campos obligatorios incluyendo la selección de sede"
  ```

#### ✅ Registro exitoso
- Completa el formulario:
  - Email: `test@test.com`
  - Contraseña: `123456`
  - Nombre: `Test`
  - Apellido Paterno: `Usuario`
  - Teléfono: `1234567890`
  - **Sede**: Selecciona cualquier sede del dropdown

- Haz clic en "Crear cuenta"
- Debe mostrar: "Cuenta creada exitosamente en el servidor"
- Debe redirigir a la pantalla de Login

#### ✅ Verificar en base de datos
```sql
SELECT
    c.persona_id,
    p.nombre,
    p.apellido_paterno,
    s.nombre as sede_nombre,
    c.sede_id
FROM clientes_cliente c
JOIN authentication_persona p ON c.persona_id = p.id
JOIN instalaciones_sede s ON c.sede_id = s.id
WHERE p.nombre = 'Test';
```

Debe mostrar que el cliente fue creado con la sede que seleccionaste.

---

## 🐛 Posibles Errores

### Error 1: "No se pudieron cargar las sedes disponibles"
**Causa**: Backend no está corriendo o no es accesible
**Solución**:
- Verificar que Django esté corriendo en `0.0.0.0:8000`
- Verificar la IP en `src/config/config.ts`

### Error 2: "La sede especificada no existe"
**Causa**: El `sede_id` enviado no existe en la base de datos
**Solución**:
- Verificar que hay sedes en la tabla `instalaciones_sede`
- Recargar la lista de sedes en la app

### Error 3: "El campo sede_id es requerido"
**Causa**: El formulario no está enviando el `sede_id`
**Solución**:
- Verificar que `formData.sede_id` no sea `0`
- Verificar que se haya seleccionado una sede en el Picker

---

## 📝 Endpoints Nuevos

### 1. GET /api/sedes-disponibles/
**Descripción**: Obtener lista de sedes disponibles para registro
**Autenticación**: No requerida (público)
**Response**:
```json
[
  {
    "id": 1,
    "nombre": "Sede Central",
    "direccion": "Av. Principal 123",
    "telefono": "5551234567"
  },
  {
    "id": 2,
    "nombre": "Sede Norte",
    "direccion": "Calle Norte 456",
    "telefono": "5559876543"
  }
]
```

### 2. GET /api/auth/me/
**Descripción**: Obtener información del usuario autenticado
**Autenticación**: Requerida (Bearer token)
**Response** (para cliente):
```json
{
  "user_id": 1,
  "email": "test@test.com",
  "persona_id": 1,
  "cliente_id": 1,
  "nombre": "Test",
  "apellido_paterno": "Usuario",
  "apellido_materno": "",
  "telefono": "1234567890",
  "fecha_nacimiento": null,
  "sexo": null,
  "sede_id": 1,
  "sede_nombre": "Sede Central",
  "estado": "activo",
  "nivel_experiencia": "principiante",
  "objetivo_fitness": "mantenimiento",
  "fecha_registro": "2024-01-15"
}
```

### 3. POST /api/registro/cliente/ (MODIFICADO)
**Cambios**: Ahora requiere `sede_id`
**Request**:
```json
{
  "email": "test@test.com",
  "password": "123456",
  "nombre": "Test",
  "apellido_paterno": "Usuario",
  "telefono": "1234567890",
  "sede_id": 1
}
```

**Response**:
```json
{
  "message": "Cliente registrado exitosamente",
  "cliente_id": 1,
  "user_id": 1,
  "email": "test@test.com",
  "sede_id": 1,
  "sede_nombre": "Sede Central"
}
```

---

## 📊 Impacto

### ✅ Beneficios
1. Los clientes ahora se registran con una sede específica
2. No más asignación automática de la primera sede
3. Base sólida para filtrado multi-sede en toda la app
4. Experiencia de usuario mejorada (el cliente elige su ubicación)

### ⚠️ Breaking Changes
- Clientes antiguos que se registraron antes de este cambio tienen la primera sede asignada
- Nuevos registros DEBEN incluir `sede_id` (obligatorio)

---

## 🔜 Siguientes Pasos

Una vez que confirmes que el registro funciona correctamente:

1. **Tarea 2**: Modificar creación de suscripciones para inferir cliente autenticado
2. **Tarea 3**: Modificar creación de reservas para inferir cliente autenticado
3. **Tarea 4**: Refactorizar `membresiasService.ts`
4. **Tarea 5**: Refactorizar `reservasService.ts`

---

## ✅ Checklist de Pruebas

- [ ] Backend Django corriendo en 0.0.0.0:8000
- [ ] Hay al menos 1 sede en la base de datos
- [ ] App móvil inicia correctamente
- [ ] Pantalla de registro carga las sedes
- [ ] Selector de sede muestra todas las sedes disponibles
- [ ] No se puede registrar sin seleccionar sede
- [ ] Registro exitoso con sede seleccionada
- [ ] Cliente se crea con la sede correcta en la BD
- [ ] Logs muestran información correcta

---

**¡LISTO PARA PROBAR!** 🚀

Prueba el registro desde tu celular y confirma que funciona antes de continuar con las siguientes tareas.
