# Configuración de Firebase para Control Remoto Multi-Dispositivo

Esta aplicación ahora usa **Firebase Realtime Database** para sincronizar el control remoto entre múltiples dispositivos en tiempo real.

## 📋 Pasos de Configuración

### 1. Crear/Configurar Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Si ya tienes un proyecto, selecciónalo. Si no:
   - Haz clic en "Agregar proyecto"
   - Sigue los pasos para crear tu proyecto

### 2. Habilitar Realtime Database

1. En la consola de Firebase, ve a **Build** > **Realtime Database**
2. Haz clic en **"Crear base de datos"**
3. Selecciona la ubicación (recomendado: United States para mejor rendimiento)
4. Selecciona **"Comenzar en modo de prueba"** (configuraremos las reglas después)
5. Haz clic en **"Habilitar"**

### 3. Configurar Reglas de Seguridad

1. En Realtime Database, ve a la pestaña **"Reglas"**
2. Reemplaza las reglas con las siguientes:

```json
{
  "rules": {
    "roulette": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ IMPORTANTE**: Estas reglas permiten acceso completo. Para producción, considera agregar autenticación.

3. Haz clic en **"Publicar"**

### 4. Obtener Configuración de Firebase

1. En Firebase Console, haz clic en el ícono de **configuración** (⚙️) > **Configuración del proyecto**
2. Baja hasta la sección **"Tus apps"**
3. Si no tienes una app web, haz clic en el botón **`</>`** (Web)
4. Registra tu app con un nombre (ej: "Ruleta Control")
5. Copia la configuración que aparece. Se verá así:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### 5. Configurar la Aplicación

Necesitas actualizar la configuración en **DOS archivos**:

#### A. `src/config/firebase.ts`

Abre el archivo `src/config/firebase.ts` y reemplaza TODO el objeto `firebaseConfig` con tu configuración:

```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Reemplazar con tu configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://TU_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Realtime Database
export const database = getDatabase(app);
```

#### B. `public/control.html`

Abre el archivo `public/control.html` y busca la sección donde está `firebaseConfig` (alrededor de la línea 279). Reemplaza TODO el objeto con tu configuración:

```javascript
// TODO: Reemplazar con tu configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://TU_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 6. Reconstruir y Desplegar

1. Reconstruye la aplicación:
   ```bash
   npm run build
   ```

2. Despliega a Firebase Hosting:
   ```bash
   npm run deploy
   ```

## ✅ Verificar que Funciona

1. Abre la ruleta en un dispositivo: `https://tu-proyecto.web.app`
2. Abre el panel de control en OTRO dispositivo: `https://tu-proyecto.web.app/control.html`
3. En el panel de control:
   - Congela un participante
   - Deberías ver el cambio reflejado INMEDIATAMENTE en ambos dispositivos
4. Envía un control remoto desde el panel
5. El siguiente sorteo en la ruleta usará el ganador/premio reservado

## 🔍 Solución de Problemas

### Error: "Permission denied"
- Verifica que las reglas de seguridad estén configuradas correctamente
- Asegúrate de que el `databaseURL` sea correcto en ambos archivos

### Los cambios no se sincronizan
- Abre la consola del navegador (F12) y verifica si hay errores
- Verifica que el `firebaseConfig` esté configurado en AMBOS archivos
- Verifica que el `databaseURL` incluya tu región correcta

### No se conecta a Firebase
- Verifica que tu `apiKey` y `projectId` sean correctos
- Asegúrate de que Realtime Database esté habilitado en Firebase Console

## 📱 Cómo Usar el Control Remoto

1. **Desde cualquier dispositivo**, abre: `https://tu-proyecto.web.app/control.html`
2. Congela participantes y/o premios para reservarlos
3. En "Control Manual", selecciona:
   - Un ganador (de los congelados)
   - Un premio (de los congelados)
4. Haz clic en "ENVIAR Y DESCONGELAR"
5. El siguiente sorteo automáticamente usará ese ganador/premio
6. Ambos se descongelan automáticamente después de enviar

## 🔐 Seguridad (Opcional - Recomendado para Producción)

Las reglas actuales permiten acceso completo. Para mayor seguridad:

1. Habilita Firebase Authentication
2. Actualiza las reglas de seguridad:

```json
{
  "rules": {
    "roulette": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

3. Implementa login en tu aplicación

## 📊 Estructura de Datos en Firebase

Los datos se guardan en esta estructura:

```
roulette/
  ├── participants/      (Array de participantes)
  ├── prizes/            (Array de premios)
  └── remote_control/    (Objeto de control remoto)
```

Puedes ver y modificar los datos directamente en Firebase Console > Realtime Database.

## 💡 Notas Importantes

- ✅ Los cambios se sincronizan en **tiempo real** entre todos los dispositivos
- ✅ `localStorage` se usa como fallback para acceso inmediato
- ✅ Firebase asegura que todos los dispositivos estén sincronizados
- ⚠️ Asegúrate de configurar ambos archivos (`firebase.ts` y `control.html`)
- ⚠️ El `databaseURL` debe incluir `-default-rtdb` en el nombre
