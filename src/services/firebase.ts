// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

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

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que vamos usar
export const database = getDatabase(app);
export const storage = getStorage(app);
