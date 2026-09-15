import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  throw new Error('Firebase Project ID ausente nas variáveis de ambiente.');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Usando um nome específico para evitar colisão com a inicialização injetada do AI Studio
const APP_NAME = "painel-clientes";
const app = getApps().find(a => a.name === APP_NAME) || initializeApp(firebaseConfig, APP_NAME);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Apenas para validação (conforme solicitado pelo usuário)
console.log("Validação - Auth ProjectID:", auth.app.options.projectId);
console.log("Validação - DB ProjectID:", db.app.options.projectId);
