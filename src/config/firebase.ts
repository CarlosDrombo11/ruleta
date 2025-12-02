// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBu3FjGX42LsZRoHE_6cUoyHCMsUNc1Yh8",
  authDomain: "ruleta-a9643.firebaseapp.com",
  databaseURL: "https://ruleta-a9643-default-rtdb.firebaseio.com",
  projectId: "ruleta-a9643",
  storageBucket: "ruleta-a9643.firebasestorage.app",
  messagingSenderId: "859095891871",
  appId: "1:859095891871:web:71e856590b3b0c3f6107aa"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Realtime Database
export const database = getDatabase(app);
