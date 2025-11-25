# 📱 App Móvil - Sistema de Gestión de Gimnasio

Aplicación móvil desarrollada con **React Native + Expo** para el sistema de gestión de gimnasios.

## ✨ Funcionalidades

- 🔐 **Autenticación** - Login y registro de usuarios
- 📅 **Reservas de Clases** - Ver y reservar clases disponibles
- 📋 **Mis Reservas** - Gestionar reservas personales
- 🏋️ **Actividades** - Explorar tipos de actividades disponibles
- 💳 **Membresías** - Ver información de membresías

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar IP del Backend

Edita el archivo `src/config/config.ts` y cambia la IP:

```typescript
API_BASE_URL: 'http://TU_IP:8000/api/'
```

**Para obtener tu IP:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

### 3. Ejecutar la App

**Opción A - Script automatizado (Windows):**
```bash
EJECUTAR_APP.bat
```

**Opción B - Comando manual:**
```bash
npm start
```

### 4. Abrir en tu Dispositivo

1. Instala **Expo Go** en tu celular
2. Escanea el código QR que aparece
3. ¡Listo!

## 📖 Documentación Completa

Para instrucciones detalladas, consulta: **[CONFIGURACION.md](CONFIGURACION.md)**

## 🛠️ Stack Tecnológico

- React Native 0.81.5
- Expo 54.0.0
- TypeScript 5.9.2
- React Navigation 7.0.0
- Axios 1.7.0
- AsyncStorage 2.2.0

## 📁 Estructura del Proyecto

```
src/
├── config/              # Configuración (API URL, etc.)
├── screens/             # Pantallas de la app
├── services/            # Servicios de API
├── context/             # Context API (Theme)
├── styles/              # Estilos globales
└── utils/               # Utilidades
```

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run android    # Abrir en emulador Android
npm run ios        # Abrir en simulador iOS (solo Mac)
npm run web        # Abrir en navegador web
```

## ⚙️ Configuración del Backend

Asegúrate de que el backend de Django esté configurado correctamente:

1. Ve a `c:\gimnasio\CONFIGURACION_MOVIL.md` para instrucciones del backend
2. El backend debe estar corriendo en `http://0.0.0.0:8000`
3. Ambos dispositivos (PC y celular) deben estar en la misma red WiFi

## 🐛 Solución de Problemas

### No se conecta al backend

- Verifica que la IP esté correcta en `src/config/config.ts`
- Confirma que Django esté corriendo con `python manage.py runserver 0.0.0.0:8000`
- Asegúrate de estar en la misma red WiFi

### Error "Network request failed"

- Verifica el firewall de Windows
- Prueba abrir `http://TU_IP:8000/api/` en el navegador del celular

### La app no carga

```bash
# Limpiar caché
npx expo start -c

# Reinstalar dependencias
rm -rf node_modules && npm install
```

## 📝 Notas Importantes

- Esta configuración es **solo para desarrollo**
- Para producción, usa variables de entorno y configuraciones más seguras
- El backend debe estar corriendo en `0.0.0.0:8000` (no en `localhost:8000`)

## 📞 Soporte

Si tienes problemas, verifica:
1. [CONFIGURACION.md](CONFIGURACION.md) - Guía completa de configuración
2. `c:\gimnasio\CONFIGURACION_MOVIL.md` - Configuración del backend Django

---

**Desarrollado con ❤️ usando React Native + Expo**
