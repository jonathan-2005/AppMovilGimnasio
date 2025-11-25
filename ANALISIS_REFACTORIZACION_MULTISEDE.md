# Análisis Completo: App Móvil vs Backend Multi-Sede

## Resumen Ejecutivo

La aplicación móvil actual **NO está alineada con el backend multi-sede**. Existen discrepancias críticas en:

1. **Registro de clientes** - Falta selección de sede
2. **Endpoints de membresías** - Los endpoints que usa la app móvil no existen
3. **Endpoints de reservas** - La mayoría de endpoints que usa la app móvil no existen
4. **Filtrado por sede** - No existe filtrado multi-sede en ninguna pantalla

---

## 1. Análisis del Backend (Django)

### 1.1 Arquitectura Multi-Sede Confirmada

#### Modelo Cliente (`clientes/models.py:31-36`)
```python
sede = models.ForeignKey(
    Sede,
    on_delete=models.PROTECT,
    related_name='clientes',
    help_text="Sede principal del cliente"
)
```

**Conclusión**: Cada cliente DEBE estar asociado a una sede. Esto es fundamental.

#### Vista de Registro (`authentication/views.py:172-264`)

**PROBLEMA CRÍTICO IDENTIFICADO**:

```python
# Líneas 242-243
from instalaciones.models import Sede
sede_default = Sede.objects.first()

# Líneas 245-251
cliente = Cliente.objects.create(
    persona=persona,
    sede=sede_default,  # ❌ ASIGNA LA PRIMERA SEDE AUTOMÁTICAMENTE
    objetivo_fitness=request.data.get('objetivo_fitness', 'mantenimiento'),
    nivel_experiencia=request.data.get('nivel_experiencia', 'principiante'),
    estado='activo'
)
```

**Diagnóstico**: El backend actual acepta el registro SIN campo `sede_id` y asigna automáticamente la primera sede. Esto es incorrecto para un sistema multi-sede.

**Solución Requerida**:
- Modificar `ClienteRegistroView` para requerir `sede_id` en el request
- Agregar validación de que la sede existe
- Eliminar la asignación automática de `sede_default`

---

### 1.2 Endpoints de Membresías Disponibles

#### ✅ Endpoints que SÍ existen (`membresias/views.py`)

| Método | Endpoint | Descripción | Línea |
|--------|----------|-------------|-------|
| GET | `/api/membresias/` | Listar todas las membresías | 36-74 |
| POST | `/api/membresias/` | Crear nueva membresía | - |
| GET | `/api/membresias/{id}/` | Detalle de membresía | - |
| PUT/PATCH | `/api/membresias/{id}/` | Actualizar membresía | - |
| DELETE | `/api/membresias/{id}/` | Eliminar membresía | - |
| GET | `/api/membresias/activas/` | **Listar membresías activas** | 159-167 |
| POST | `/api/membresias/{id}/toggle_activo/` | Activar/desactivar | 76-90 |
| GET | `/api/membresias/estadisticas/` | Estadísticas | 92-157 |

**Filtros disponibles** (`membresias/views.py:36-74`):
- `?tipo=mensual` - Filtrar por tipo
- `?activo=true` - Filtrar por estado activo
- `?sede={id}` - **Filtrar por sede** (incluye multi-sede)
- `?permite_todas_sedes=true` - Filtrar membresías multi-sede
- `?search={texto}` - Búsqueda general

#### ✅ Endpoints de Suscripciones que SÍ existen

| Método | Endpoint | Descripción | Línea |
|--------|----------|-------------|-------|
| GET | `/api/suscripciones/` | Listar suscripciones | 184-225 |
| POST | `/api/suscripciones/` | Crear suscripción | - |
| GET | `/api/suscripciones/{id}/` | Detalle de suscripción | - |
| GET | `/api/suscripciones/clientes_con_membresia/` | Clientes con membresía | 227-283 |
| POST | `/api/suscripciones/{id}/cancelar/` | Cancelar suscripción | 285-306 |
| POST | `/api/suscripciones/{id}/renovar/` | Renovar suscripción | 308-332 |
| GET | `/api/suscripciones/estadisticas/` | Estadísticas | 334-400 |

**Filtros disponibles** (`membresias/views.py:184-225`):
- `?cliente={id}` - Filtrar por cliente
- `?estado=activa` - Filtrar por estado
- `?membresia={id}` - Filtrar por membresía
- `?sede={id}` - **Filtrar por sede**
- `?search={texto}` - Buscar por nombre de cliente

---

### 1.3 Endpoints de Horarios/Reservas Disponibles

#### ✅ Endpoints que SÍ existen (`horarios/views.py`)

**TipoActividadViewSet** (líneas 27-54):
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/horarios/tipos-actividad/` | Listar tipos de actividades |
| POST | `/api/horarios/tipos-actividad/` | Crear tipo de actividad |
| GET | `/api/horarios/tipos-actividad/{id}/` | Detalle de tipo |
| GET | `/api/horarios/tipos-actividad/{id}/equipos_necesarios/` | Equipos necesarios |

**Filtros**: `?activo=true`, `?sede={id}`

**SesionClaseViewSet** (líneas 234-348):
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/horarios/sesiones/` | Listar sesiones de clases |
| POST | `/api/horarios/sesiones/` | Crear sesión |
| GET | `/api/horarios/sesiones/{id}/` | Detalle de sesión |
| GET | `/api/horarios/sesiones/calendario_mensual/` | Calendario mensual |
| GET | `/api/horarios/sesiones/{id}/reservas/` | Reservas de una sesión |
| POST | `/api/horarios/sesiones/{id}/marcar_asistencia/` | Marcar asistencia |

**Filtros**: `?estado=confirmada`, `?fecha=2024-01-15`, `?horario__tipo_actividad={id}`, `?horario__espacio__sede={id}`

**ReservaClaseViewSet** (líneas 375-456):
| Método | Endpoint | Descripción | Línea |
|--------|----------|-------------|-------|
| GET | `/api/horarios/reservas-clases/` | Listar reservas | 379-413 |
| POST | `/api/horarios/reservas-clases/` | Crear reserva | - |
| GET | `/api/horarios/reservas-clases/{id}/` | Detalle de reserva | - |
| GET | `/api/horarios/reservas-clases/mis_reservas/` | **Mis reservas** | 415-437 |
| POST | `/api/horarios/reservas-clases/{id}/cancelar/` | **Cancelar reserva** | 439-455 |

**Filtros para mis_reservas** (`horarios/views.py:415-437`):
- `?estado=confirmada`
- `?fecha_desde=2024-01-15`

---

## 2. Análisis de la App Móvil

### 2.1 Pantalla de Registro (`RegisterScreen.tsx`)

#### ❌ PROBLEMA 1: Falta Selección de Sede

**Estado actual del formulario**:
```typescript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  confirmPassword: '',
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',
  fecha_nacimiento: '',
  sexo: 'masculino',
  objetivo_fitness: '',
  nivel_experiencia: 'principiante',
  // ❌ FALTA: sede_id: null
});
```

**Payload enviado al backend**:
```typescript
const newUser: any = {
  email: formData.email,
  password: formData.password,
  nombre: formData.nombre,
  apellido_paterno: formData.apellido_paterno,
  apellido_materno: formData.apellido_materno,
  telefono: formData.telefono,
  fecha_nacimiento: formData.fecha_nacimiento || null,
  sexo: formData.sexo,
  objetivo_fitness: formData.objetivo_fitness,
  nivel_experiencia: formData.nivel_experiencia,
  // ❌ NO SE ENVÍA: sede_id
};
```

**Impacto**: Los clientes se registran sin elegir su sede, y el backend les asigna automáticamente la primera sede de la base de datos.

---

### 2.2 Servicio de Membresías (`membresiasService.ts`)

#### ❌ PROBLEMA 2: Endpoints Inexistentes

**Endpoints que la app móvil intenta usar**:

```typescript
// ❌ NO EXISTE en el backend
async listarActivas(): Promise<MembresiaDisponible[]> {
  const response = await api.get('membresias/activas/');
  return ensureArray<MembresiaDisponible>(response.data);
}
```

**CORRECCIÓN ENCONTRADA**: Este endpoint SÍ existe (`membresias/views.py:159-167`). ✅

```typescript
// ❌ NO EXISTE en el backend
async obtenerMisMembresias(): Promise<MembresiaCliente[]> {
  const response = await api.get('membresias/mis_membresias/');
  return ensureArray<MembresiaCliente>(response.data);
}
```

**Endpoint correcto**: `/api/suscripciones/?cliente={id}` (filtrar suscripciones por cliente autenticado)

```typescript
// ❌ NO EXISTE en el backend
async adquirirMembresia(id: number, payload: AdquirirMembresiaPayload = {}) {
  const response = await api.post(`membresias/${id}/adquirir/`, payload);
  return response.data;
}
```

**Endpoint correcto**: `POST /api/suscripciones/` (crear nueva suscripción)

---

### 2.3 Servicio de Reservas (`reservasService.ts`)

#### ❌ PROBLEMA 3: Endpoints Inexistentes

**Endpoints que la app móvil intenta usar**:

```typescript
// ❌ NO EXISTE - Línea 107
async listarActividadesDisponibles(): Promise<ActividadDisponible[]> {
  const response = await api.get('horarios/api/actividades/disponibles/');
  return normalizeArrayResponse<ActividadDisponible>(response.data);
}
```

**Endpoint correcto**: `GET /api/horarios/tipos-actividad/?activo=true&sede={id}`

```typescript
// ❌ NO EXISTE - Línea 111
async obtenerSesionesDisponibles(params?: SesionesParams): Promise<SesionDisponible[]> {
  const response = await api.get('horarios/api/sesiones/disponibles/', {
    params: queryParams,
  });
  return normalizeArrayResponse<SesionDisponible>(response.data);
}
```

**Endpoint correcto**: `GET /api/horarios/sesiones/?estado=confirmada&horario__espacio__sede={id}`

```typescript
// ❌ NO EXISTE - Línea 139
async reservarSesion(sesionId: number, observaciones?: string): Promise<SesionReservaResponse> {
  const response = await api.post(`horarios/api/sesiones/${sesionId}/reservar/`, {
    observaciones,
  });
  return response.data as SesionReservaResponse;
}
```

**Endpoint correcto**: `POST /api/horarios/reservas-clases/` con body `{ sesion_clase: sesionId, observaciones }`

```typescript
// ✅ CORRECTO - Línea 147
async listarMisReservas(): Promise<ReservaCliente[]> {
  const response = await api.get('horarios/api/reservas-clases/mis_reservas/');
  const items = normalizeArrayResponse<any>(response.data);
  return items.map(mapReservaCliente);
}
```

**Endpoint correcto**: ✅ Este SÍ existe (`horarios/views.py:415-437`)

```typescript
// ✅ CORRECTO - Línea 153
async cancelarReserva(reservaId: number, motivo?: string): Promise<CancelarReservaResponse> {
  const response = await api.post(`horarios/api/reservas-clases/${reservaId}/cancelar/`, {
    motivo,
  });
  return response.data as CancelarReservaResponse;
}
```

**Endpoint correcto**: ✅ Este SÍ existe (`horarios/views.py:439-455`)

---

## 3. Matriz de Discrepancias

### 3.1 Membresías

| Funcionalidad App Móvil | Endpoint Móvil (Incorrecto) | Endpoint Backend (Correcto) | Estado |
|-------------------------|----------------------------|----------------------------|--------|
| Listar membresías activas | `GET membresias/activas/` | `GET /api/membresias/activas/` | ✅ Existe (solo falta `/api/` prefix) |
| Ver mis membresías | `GET membresias/mis_membresias/` | `GET /api/suscripciones/?cliente={id}` | ❌ Refactorizar |
| Adquirir membresía | `POST membresias/{id}/adquirir/` | `POST /api/suscripciones/` | ❌ Refactorizar |

### 3.2 Reservas/Horarios

| Funcionalidad App Móvil | Endpoint Móvil (Incorrecto) | Endpoint Backend (Correcto) | Estado |
|-------------------------|----------------------------|----------------------------|--------|
| Listar actividades disponibles | `GET horarios/api/actividades/disponibles/` | `GET /api/horarios/tipos-actividad/?activo=true` | ❌ Refactorizar |
| Obtener sesiones disponibles | `GET horarios/api/sesiones/disponibles/` | `GET /api/horarios/sesiones/?estado=confirmada` | ❌ Refactorizar |
| Reservar sesión | `POST horarios/api/sesiones/{id}/reservar/` | `POST /api/horarios/reservas-clases/` | ❌ Refactorizar |
| Listar mis reservas | `GET horarios/api/reservas-clases/mis_reservas/` | `GET /api/horarios/reservas-clases/mis_reservas/` | ✅ Correcto |
| Cancelar reserva | `POST horarios/api/reservas-clases/{id}/cancelar/` | `POST /api/horarios/reservas-clases/{id}/cancelar/` | ✅ Correcto |

---

## 4. Plan de Refactorización

### Fase 1: Backend - Corregir Registro Multi-Sede

**Archivo**: `authentication/views.py` (líneas 172-264)

**Cambios requeridos**:

1. Agregar `sede_id` a los campos requeridos:
```python
required_fields = ['email', 'password', 'nombre', 'apellido_paterno', 'telefono', 'sede_id']
```

2. Validar que la sede existe:
```python
sede_id = request.data.get('sede_id')
try:
    sede = Sede.objects.get(id=sede_id)
except Sede.DoesNotExist:
    return Response(
        {'error': 'La sede especificada no existe'},
        status=status.HTTP_400_BAD_REQUEST
    )
```

3. Asignar la sede seleccionada:
```python
cliente = Cliente.objects.create(
    persona=persona,
    sede=sede,  # ✅ Usar la sede seleccionada
    objetivo_fitness=request.data.get('objetivo_fitness', 'mantenimiento'),
    nivel_experiencia=request.data.get('nivel_experiencia', 'principiante'),
    estado='activo'
)
```

4. **OPCIONAL**: Crear endpoint para listar sedes disponibles:
```python
# Nuevo endpoint: GET /api/sedes-disponibles/
class SedesDisponiblesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        sedes = Sede.objects.filter(activo=True)
        data = [
            {
                'id': sede.id,
                'nombre': sede.nombre,
                'direccion': sede.direccion,
                'telefono': sede.telefono
            }
            for sede in sedes
        ]
        return Response(data)
```

---

### Fase 2: App Móvil - Actualizar Registro

**Archivo**: `AppMovilGimnasio/src/screens/RegisterScreen.tsx`

**Cambios requeridos**:

1. Agregar estado para sedes disponibles:
```typescript
const [sedes, setSedes] = useState<Sede[]>([]);
const [formData, setFormData] = useState({
  // ... campos existentes
  sede_id: null, // ✅ Agregar campo sede
});
```

2. Cargar sedes al montar el componente:
```typescript
useEffect(() => {
  const cargarSedes = async () => {
    try {
      const response = await api.get('/sedes-disponibles/');
      setSedes(response.data);
    } catch (error) {
      console.error('Error al cargar sedes:', error);
    }
  };
  cargarSedes();
}, []);
```

3. Agregar selector de sede en el formulario:
```typescript
<Picker
  selectedValue={formData.sede_id}
  onValueChange={(value) => setFormData({...formData, sede_id: value})}
>
  <Picker.Item label="Selecciona tu sede" value={null} />
  {sedes.map(sede => (
    <Picker.Item key={sede.id} label={sede.nombre} value={sede.id} />
  ))}
</Picker>
```

4. Incluir `sede_id` en el payload de registro:
```typescript
const newUser: any = {
  // ... campos existentes
  sede_id: formData.sede_id, // ✅ Incluir sede seleccionada
};
```

---

### Fase 3: App Móvil - Refactorizar membresiasService

**Archivo**: `AppMovilGimnasio/src/services/membresiasService.ts`

**Cambios**:

```typescript
export const MembresiasService = {
  // ✅ YA FUNCIONA - Solo ajustar URL
  async listarActivas(): Promise<MembresiaDisponible[]> {
    const response = await api.get('/membresias/activas/'); // ✅ Agregar / al inicio
    return ensureArray<MembresiaDisponible>(response.data);
  },

  // ❌ REFACTORIZAR - Usar endpoint de suscripciones
  async obtenerMisMembresias(): Promise<MembresiaCliente[]> {
    try {
      // Obtener el cliente_id del usuario autenticado
      // Opción 1: Si el backend puede inferir el cliente del token
      const response = await api.get('/suscripciones/', {
        params: { cliente: 'me' } // Backend debe interpretar 'me' como cliente autenticado
      });

      // Opción 2: Si necesitas obtener el cliente_id primero
      // const userResponse = await api.get('/auth/me/');
      // const clienteId = userResponse.data.cliente_id;
      // const response = await api.get(`/suscripciones/?cliente=${clienteId}`);

      return ensureArray<MembresiaCliente>(response.data);
    } catch (error) {
      console.error('Error al obtener membresías:', error);
      throw error;
    }
  },

  // ❌ REFACTORIZAR - Usar endpoint de crear suscripción
  async adquirirMembresia(membresiaId: number, payload: AdquirirMembresiaPayload = {}) {
    try {
      const body = {
        membresia: membresiaId,
        metodo_pago: payload.metodo_pago || 'efectivo',
        notas: payload.notas || '',
        // El backend debe inferir:
        // - cliente: del usuario autenticado
        // - fecha_inicio: fecha actual
        // - sede_suscripcion: de la sede del cliente
      };

      const response = await api.post('/suscripciones/', body);
      return response.data;
    } catch (error) {
      console.error('Error al adquirir membresía:', error);
      throw error;
    }
  },
};
```

**Modificación requerida en el backend** (`membresias/views.py`):

```python
# En SuscripcionMembresiaViewSet
def create(self, request, *args, **kwargs):
    """Crear nueva suscripción desde la app móvil"""
    # Obtener cliente del usuario autenticado
    if not hasattr(request.user, 'persona') or not hasattr(request.user.persona, 'cliente'):
        return Response(
            {'error': 'Usuario no es un cliente'},
            status=status.HTTP_403_FORBIDDEN
        )

    cliente = request.user.persona.cliente

    # Agregar automáticamente el cliente y sede
    data = request.data.copy()
    data['cliente'] = cliente.persona_id
    data['sede_suscripcion'] = cliente.sede_id  # Usar la sede del cliente

    serializer = self.get_serializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

---

### Fase 4: App Móvil - Refactorizar reservasService

**Archivo**: `AppMovilGimnasio/src/services/reservasService.ts`

**Cambios**:

```typescript
export const ReservasService = {
  // ❌ REFACTORIZAR - Usar tipos-actividad
  async listarActividadesDisponibles(): Promise<ActividadDisponible[]> {
    try {
      // Obtener la sede del cliente autenticado
      const userResponse = await api.get('/auth/me/'); // Necesitamos este endpoint
      const sedeId = userResponse.data.sede_id;

      const response = await api.get('/horarios/tipos-actividad/', {
        params: {
          activo: true,
          sede: sedeId
        }
      });

      // Transformar la respuesta del backend al formato esperado
      const tipos = ensureArray(response.data);
      return tipos.map(tipo => ({
        id: tipo.id,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        duracion_default: tipo.duracion_default,
        duracion_minutos: tipo.duracion_minutos,
        color_hex: tipo.color_hex,
        sesiones_disponibles: 0, // Calcular si es necesario
        proxima_sesion: null, // Obtener en una segunda consulta si es necesario
      }));
    } catch (error) {
      console.error('Error al listar actividades:', error);
      throw error;
    }
  },

  // ❌ REFACTORIZAR - Usar sesiones
  async obtenerSesionesDisponibles(params?: SesionesParams): Promise<SesionDisponible[]> {
    try {
      const userResponse = await api.get('/auth/me/');
      const sedeId = userResponse.data.sede_id;

      const queryParams: Record<string, any> = {
        estado: 'confirmada',
        'horario__espacio__sede': sedeId, // Filtrar por sede del cliente
        ordering: 'fecha,horario__hora_inicio',
      };

      if (params?.tipoActividadId) {
        queryParams['horario__tipo_actividad'] = params.tipoActividadId;
      }

      if (params?.fechaDesde) {
        queryParams['fecha__gte'] = params.fechaDesde;
      }

      if (params?.fechaHasta) {
        queryParams['fecha__lte'] = params.fechaHasta;
      }

      const response = await api.get('/horarios/sesiones/', {
        params: queryParams,
      });

      // Transformar respuesta al formato esperado
      const sesiones = ensureArray(response.data);
      return sesiones.map(mapSesionDisponible);
    } catch (error) {
      console.error('Error al obtener sesiones:', error);
      throw error;
    }
  },

  // ❌ REFACTORIZAR - Usar POST reservas-clases
  async reservarSesion(sesionId: number, observaciones?: string): Promise<SesionReservaResponse> {
    try {
      const response = await api.post('/horarios/reservas-clases/', {
        sesion_clase: sesionId,
        observaciones: observaciones || '',
        // El backend debe inferir:
        // - cliente: del usuario autenticado
        // - estado: 'confirmada'
        // - fecha_reserva: fecha actual
      });

      return {
        mensaje: 'Reserva creada exitosamente',
        reserva: response.data,
      };
    } catch (error) {
      console.error('Error al reservar sesión:', error);
      throw error;
    }
  },

  // ✅ YA FUNCIONA - Solo ajustar URL si es necesario
  async listarMisReservas(): Promise<ReservaCliente[]> {
    const response = await api.get('/horarios/reservas-clases/mis_reservas/');
    const items = normalizeArrayResponse<any>(response.data);
    return items.map(mapReservaCliente);
  },

  // ✅ YA FUNCIONA
  async cancelarReserva(reservaId: number, motivo?: string): Promise<CancelarReservaResponse> {
    const response = await api.post(`/horarios/reservas-clases/${reservaId}/cancelar/`, {
      motivo,
    });
    return response.data as CancelarReservaResponse;
  },
};

// Función auxiliar para mapear sesiones del backend al formato de la app
const mapSesionDisponible = (sesion: any): SesionDisponible => {
  const horario = sesion.horario || {};
  const tipoActividad = horario.tipo_actividad || {};
  const entrenador = sesion.entrenador_override || horario.entrenador || {};
  const espacio = sesion.espacio_override || horario.espacio || {};
  const sede = espacio.sede || {};

  return {
    id: sesion.id,
    fecha: sesion.fecha,
    estado: sesion.estado,
    actividad: {
      id: tipoActividad.id,
      nombre: tipoActividad.nombre,
      descripcion: tipoActividad.descripcion,
      color: tipoActividad.color_hex,
      duracion: tipoActividad.duracion_default,
    },
    entrenador: {
      id: entrenador.id,
      nombre: entrenador.nombre_completo || 'Sin asignar',
      especialidad: entrenador.especialidad,
    },
    espacio: {
      id: espacio.id,
      nombre: espacio.nombre,
      capacidad: espacio.capacidad,
    },
    sede: {
      id: sede.id,
      nombre: sede.nombre,
    },
    hora_inicio: sesion.hora_inicio_efectiva || horario.hora_inicio,
    hora_fin: sesion.hora_fin_efectiva || horario.hora_fin,
    cupo_total: sesion.cupo_efectivo || horario.cupo_maximo,
    lugares_disponibles: sesion.cupo_efectivo - sesion.asistentes_registrados,
    puede_reservar: sesion.estado === 'confirmada',
    categoria: 'basico', // Ajustar según lógica de negocio
  };
};
```

**Modificación requerida en el backend** (`horarios/views.py`):

```python
# En ReservaClaseViewSet
def create(self, request, *args, **kwargs):
    """Crear nueva reserva desde la app móvil"""
    # Obtener cliente del usuario autenticado
    if not hasattr(request.user, 'persona') or not hasattr(request.user.persona, 'cliente'):
        return Response(
            {'error': 'Usuario no es un cliente'},
            status=status.HTTP_403_FORBIDDEN
        )

    cliente = request.user.persona.cliente

    # Agregar automáticamente el cliente
    data = request.data.copy()
    data['cliente'] = cliente.persona_id

    serializer = self.get_serializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

---

### Fase 5: Backend - Crear Endpoint de Usuario Actual

**Nuevo archivo**: `authentication/views.py`

```python
class UsuarioActualView(APIView):
    """
    Endpoint para obtener información del usuario autenticado
    GET /api/auth/me/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Verificar si el usuario es un cliente
        if hasattr(user, 'persona') and hasattr(user.persona, 'cliente'):
            cliente = user.persona.cliente
            return Response({
                'user_id': user.id,
                'email': user.email,
                'persona_id': user.persona.id,
                'cliente_id': cliente.persona_id,
                'nombre': user.persona.nombre,
                'apellido_paterno': user.persona.apellido_paterno,
                'apellido_materno': user.persona.apellido_materno,
                'telefono': user.persona.telefono,
                'sede_id': cliente.sede_id,
                'sede_nombre': cliente.sede.nombre,
                'estado': cliente.estado,
                'nivel_experiencia': cliente.nivel_experiencia,
                'objetivo_fitness': cliente.objetivo_fitness,
            })

        # Si es empleado u otro tipo de usuario
        return Response({
            'user_id': user.id,
            'email': user.email,
            'persona_id': user.persona.id if hasattr(user, 'persona') else None,
            'nombre': user.persona.nombre if hasattr(user, 'persona') else None,
        })
```

**Agregar a** `authentication/urls.py`:
```python
path('auth/me/', UsuarioActualView.as_view(), name='usuario_actual'),
```

---

## 5. Resumen de Archivos a Modificar

### Backend (Django)

1. **`authentication/views.py`**
   - [ ] Modificar `ClienteRegistroView` para requerir `sede_id`
   - [ ] Crear `UsuarioActualView` (GET /api/auth/me/)
   - [ ] Crear `SedesDisponiblesView` (GET /api/sedes-disponibles/)

2. **`authentication/urls.py`**
   - [ ] Agregar ruta `auth/me/`
   - [ ] Agregar ruta `sedes-disponibles/`

3. **`membresias/views.py`**
   - [ ] Modificar `SuscripcionMembresiaViewSet.create()` para inferir cliente autenticado

4. **`horarios/views.py`**
   - [ ] Modificar `ReservaClaseViewSet.create()` para inferir cliente autenticado

### App Móvil (React Native)

1. **`src/screens/RegisterScreen.tsx`**
   - [ ] Agregar selector de sede
   - [ ] Cargar sedes disponibles
   - [ ] Incluir `sede_id` en payload de registro

2. **`src/services/authService.ts`**
   - [ ] Crear método `obtenerUsuarioActual()` (GET /auth/me/)

3. **`src/services/membresiasService.ts`**
   - [ ] Refactorizar `obtenerMisMembresias()` - usar `/api/suscripciones/`
   - [ ] Refactorizar `adquirirMembresia()` - usar `POST /api/suscripciones/`
   - [ ] Ajustar `listarActivas()` - agregar `/` al inicio

4. **`src/services/reservasService.ts`**
   - [ ] Refactorizar `listarActividadesDisponibles()` - usar `/api/horarios/tipos-actividad/`
   - [ ] Refactorizar `obtenerSesionesDisponibles()` - usar `/api/horarios/sesiones/`
   - [ ] Refactorizar `reservarSesion()` - usar `POST /api/horarios/reservas-clases/`
   - [ ] Crear función `mapSesionDisponible()` para transformar respuesta

5. **`src/config/config.ts`**
   - [ ] Verificar que `API_BASE_URL` incluya `/api/` al final

---

## 6. Orden de Implementación Recomendado

### Sprint 1: Backend - Fundamentos Multi-Sede
1. Crear endpoint `GET /api/sedes-disponibles/` (público)
2. Crear endpoint `GET /api/auth/me/` (autenticado)
3. Modificar `ClienteRegistroView` para requerir `sede_id`
4. Modificar `SuscripcionMembresiaViewSet.create()` para inferir cliente
5. Modificar `ReservaClaseViewSet.create()` para inferir cliente

### Sprint 2: App Móvil - Registro Multi-Sede
1. Actualizar `authService.ts` - agregar `obtenerUsuarioActual()`
2. Actualizar `RegisterScreen.tsx` - agregar selector de sede
3. Probar registro completo con selección de sede

### Sprint 3: App Móvil - Membresías
1. Refactorizar `membresiasService.ts`
2. Actualizar pantallas de membresías para usar nuevos endpoints
3. Probar flujo completo de adquirir membresía

### Sprint 4: App Móvil - Reservas
1. Refactorizar `reservasService.ts`
2. Actualizar `ReservasScreen.tsx` para usar nuevos endpoints
3. Actualizar `MyReservationsScreen.tsx` si es necesario
4. Probar flujo completo de reservas

### Sprint 5: Testing y Filtrado Multi-Sede
1. Verificar que todas las consultas filtren por sede correctamente
2. Testing de integración completo
3. Pruebas de usuario final

---

## 7. Consideraciones de Seguridad

### 7.1 Validaciones Requeridas

1. **Registro**:
   - ✅ Validar que `sede_id` sea un número válido
   - ✅ Validar que la sede exista y esté activa
   - ✅ No permitir registro sin sede

2. **Membresías**:
   - ✅ Verificar que el cliente solo vea membresías de su sede
   - ✅ Verificar que el cliente solo pueda adquirir membresías de su sede o multi-sede
   - ✅ Validar que el cliente esté autenticado

3. **Reservas**:
   - ✅ Verificar que el cliente solo pueda reservar sesiones de su sede
   - ✅ Validar que la sesión tenga cupos disponibles
   - ✅ Validar que el cliente no tenga una reserva duplicada
   - ✅ Validar que el cliente solo pueda cancelar sus propias reservas

### 7.2 Permisos

Todos los endpoints de la app móvil deben usar:
```python
permission_classes = [IsAuthenticated]
```

Y filtrar automáticamente por:
- Cliente autenticado (del token JWT)
- Sede del cliente (de `request.user.persona.cliente.sede`)

---

## 8. Testing Recomendado

### 8.1 Tests Backend (Django)

```python
# tests/test_registro_cliente.py
def test_registro_sin_sede_falla(self):
    """El registro debe fallar si no se proporciona sede_id"""
    response = self.client.post('/api/registro/cliente/', {
        'email': 'test@test.com',
        'password': 'password123',
        'nombre': 'Test',
        'apellido_paterno': 'User',
        'telefono': '1234567890',
        # sede_id NO incluido
    })
    self.assertEqual(response.status_code, 400)
    self.assertIn('sede_id', response.data['error'].lower())

def test_registro_con_sede_exitoso(self):
    """El registro debe ser exitoso con sede_id válido"""
    sede = Sede.objects.create(nombre='Sede Test')
    response = self.client.post('/api/registro/cliente/', {
        'email': 'test@test.com',
        'password': 'password123',
        'nombre': 'Test',
        'apellido_paterno': 'User',
        'telefono': '1234567890',
        'sede_id': sede.id,
    })
    self.assertEqual(response.status_code, 201)

    # Verificar que el cliente se creó con la sede correcta
    cliente = Cliente.objects.get(persona__user__email='test@test.com')
    self.assertEqual(cliente.sede_id, sede.id)
```

### 8.2 Tests App Móvil

```typescript
// __tests__/services/reservasService.test.ts
describe('ReservasService', () => {
  it('debe listar actividades de la sede del cliente', async () => {
    const actividades = await ReservasService.listarActividadesDisponibles();
    expect(actividades).toBeDefined();
    expect(Array.isArray(actividades)).toBe(true);
  });

  it('debe reservar una sesión correctamente', async () => {
    const resultado = await ReservasService.reservarSesion(1, 'Test');
    expect(resultado.mensaje).toContain('exitoso');
    expect(resultado.reserva).toBeDefined();
  });
});
```

---

## 9. Cronograma Estimado

| Sprint | Duración | Tareas |
|--------|----------|--------|
| Sprint 1 | 3 días | Backend - Endpoints base + Multi-sede |
| Sprint 2 | 2 días | App Móvil - Registro con sede |
| Sprint 3 | 2 días | App Móvil - Membresías |
| Sprint 4 | 3 días | App Móvil - Reservas |
| Sprint 5 | 2 días | Testing + Ajustes |
| **TOTAL** | **12 días** | - |

---

## 10. Conclusión

La aplicación móvil requiere una **refactorización completa** para alinearse con el backend multi-sede. Los cambios principales son:

1. ✅ **Registro**: Agregar selección de sede (CRÍTICO)
2. ✅ **Membresías**: Cambiar endpoints a `/api/suscripciones/`
3. ✅ **Reservas**: Cambiar endpoints a `/api/horarios/tipos-actividad/` y `/api/horarios/sesiones/`
4. ✅ **Filtrado**: Todas las consultas deben filtrar por sede del cliente
5. ✅ **Backend**: Crear endpoints de soporte (`/api/auth/me/`, `/api/sedes-disponibles/`)

Una vez completados estos cambios, la aplicación móvil estará completamente integrada con el sistema multi-sede del backend.
