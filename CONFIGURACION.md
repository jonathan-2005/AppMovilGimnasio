# 📱 Configuración de la App Móvil - Gimnasio

## 🚀 Paso 1: Instalar Dependencias

Primero, instala todas las dependencias del proyecto:

```bash
npm install
```

## 🌐 Paso 2: Obtener tu IP Local

### Windows:
```bash
ipconfig
```
Busca "Dirección IPv4" en tu adaptador WiFi (ej: `192.168.1.100`)

### Mac/Linux:
```bash
ifconfig
# o
hostname -I
```

## ⚙️ Paso 3: Configurar la URL del Backend

Abre el archivo `src/services/api.ts` y cambia la IP en la línea 5:

```typescript
const API_BASE_URL = 'http://TU_IP_AQUI:8000/api/';
```

Por ejemplo, si tu IP es `192.168.1.100`:
```typescript
const API_BASE_URL = 'http://192.168.1.100:8000/api/';
```

**Actualmente configurada:** `http://192.168.1.70:8000/api/`

## 🖥️ Paso 4: Ejecutar el Backend de Django

En la carpeta raíz del proyecto Django (`c:\gimnasio`), ejecuta:

```bash
python manage.py runserver 0.0.0.0:8000
```

⚠️ **IMPORTANTE**: Usa `0.0.0.0:8000` para que acepte conexiones desde tu dispositivo móvil.

## 📱 Paso 5: Ejecutar la App Móvil

### Opción A: Usar el script (Windows)
Doble clic en `EJECUTAR_APP.bat`

### Opción B: Desde la terminal
```bash
npm start
# o
npx expo start
```

## 📲 Paso 6: Conectar tu Dispositivo

### Con Expo Go (Recomendado):

1. **Instala Expo Go** en tu dispositivo móvil:
   - [Android - Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Escanea el QR** que aparece en la terminal con:
   - Android: App de Expo Go
   - iOS: Cámara nativa del iPhone

3. **Asegúrate de estar en la misma red WiFi** que tu computadora

### Con Emulador Android:
```bash
npm run android
```

### Con Simulador iOS (solo Mac):
```bash
npm run ios
```

## ✅ Verificar que funciona

1. La app móvil debería cargar la pantalla de Login
2. Intenta iniciar sesión con tus credenciales
3. Si todo está bien configurado, deberías poder navegar por la app

## ❌ Solución de Problemas

### La app no se conecta al backend:

1. **Verifica la IP** en `src/services/api.ts`
2. **Confirma que Django está corriendo** en `0.0.0.0:8000`
3. **Asegúrate de estar en la misma WiFi** (computadora y celular)
4. **Desactiva el firewall** temporalmente para probar

### Error "Network request failed":

1. Verifica que el backend Django esté corriendo
2. Prueba abrir `http://TU_IP:8000/api/` en el navegador del celular
3. Si no carga, revisa la configuración del firewall

### La app no carga:

1. Borra caché: `npx expo start -c`
2. Reinstala dependencias: `rm -rf node_modules && npm install`
3. Verifica que Node.js esté instalado correctamente

## 📝 Estructura del Proyecto

```
AppMovilGimnasio/
├── src/
│   ├── screens/          # Pantallas de la app
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ReservasScreen.tsx
│   │   ├── MyReservationsScreen.tsx
│   │   ├── ActivitiesScreen.tsx
│   │   └── MembresiasScreen.tsx
│   ├── services/         # Servicios de API
│   │   ├── api.ts        # Configuración base de Axios
│   │   ├── authService.ts
│   │   ├── membresiasService.ts
│   │   └── reservasService.ts
│   ├── context/          # Context API
│   │   └── ThemeContext.tsx
│   ├── styles/           # Estilos globales
│   │   └── colors.ts
│   └── utils/            # Utilidades
│       └── storage.ts
├── App.tsx              # Componente principal
└── package.json         # Dependencias
```

## 🔐 Credenciales de Prueba

Usa las mismas credenciales que tienes en el sistema web.

## 📚 Tecnologías Utilizadas

- **React Native** 0.81.5
- **Expo** 54.0.0
- **React Navigation** 7.0.0
- **Axios** 1.7.0
- **TypeScript** 5.9.2
- **AsyncStorage** 2.2.0

---

**¿Necesitas ayuda?** Revisa que el backend esté configurado correctamente según `c:\gimnasio\CONFIGURACION_MOVIL.md`
