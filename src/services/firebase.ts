// src/services/firebase.ts
import { getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase para produção (original) - comentada
/*
const firebaseConfig = {
  apiKey: "AIzaSyB2JMVHvH8FKs_GEl8JVRoRfPDjY9Ztcf8",
  authDomain: "piauiticketsdb.firebaseapp.com",
  databaseURL: "https://piauiticketsdb-default-rtdb.firebaseio.com",
  projectId: "piauiticketsdb",
  storageBucket: "piauiticketsdb.appspot.com",
  messagingSenderId: "372256479753",
  appId: "1:372256479753:web:8b5890e8c94dc75daaf6d8",
  measurementId: "G-FMD1R115PG"
};
*/

// Configuração do Firebase para desenvolvimento
const firebaseConfig = {
  apiKey: "AIzaSyCdiQJBz7--aJMoCfh7HJ7_QV-KN1eidYQ",
  authDomain: "piauiticketsdevelopment.firebaseapp.com",
  databaseURL: "https://piauiticketsdevelopment-default-rtdb.firebaseio.com",
  projectId: "piauiticketsdevelopment",
  storageBucket: "piauiticketsdevelopment.appspot.com", // Corrigido aqui
  messagingSenderId: "690254869200",
  appId: "1:690254869200:web:797f8d96a154e419fc24d5"
};

// Inicializa o app Firebase apenas se ainda não existir uma instância
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// Exporta os serviços que vamos usar
export const database = getDatabase(app);
export const storage = getStorage(app);
