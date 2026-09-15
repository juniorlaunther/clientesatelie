import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-81be4f42-de43-48c5-9c71-1bd0049bba5a");

async function run() {
  const snap = await getDocs(query(collection(db, 'clientes'), limit(5)));
  snap.forEach(d => console.log(d.id));
  process.exit(0);
}
run();
