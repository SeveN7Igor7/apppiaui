// src/services/firebaseappdb.ts
import { getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Banco de dados do APP
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
let appSocial;
if (getApps().some(app => app.name === "socialApp")) {
  appSocial = getApps().find(app => app.name === "socialApp");
  console.log("[Firebase Social] Usando instância existente do socialApp.");
} else {
  appSocial = initializeApp(firebaseConfigSocial, "socialApp");
  console.log("[Firebase Social] socialApp inicializado.");
}

export const databaseSocial = getDatabase(appSocial);
console.log("[Firebase Social] Database social exportado.");