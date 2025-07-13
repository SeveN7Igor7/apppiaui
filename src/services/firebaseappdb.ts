// src/services/firebaseappdb.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfigSocial = {
  apiKey: "AIzaSyDOupLW3rbpxA7H78pW4802nzjUJHIKG5k",
  authDomain: "piauiappdb.firebaseapp.com",
  databaseURL: "https://piauiappdb-default-rtdb.firebaseio.com",
  projectId: "piauiappdb",
  storageBucket: "piauiappdb.firebasestorage.app",
  messagingSenderId: "483545469093",
  appId: "1:483545469093:web:e3b2df211c6684320d7d4c"
};

// Inicializa um app Firebase separado para o social feed
const appSocial = initializeApp(firebaseConfigSocial, "socialApp");

export const databaseSocial = getDatabase(appSocial);
