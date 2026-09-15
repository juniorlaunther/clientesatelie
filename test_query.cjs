const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, where } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const q = query(collection(db, 'produtos_comprados'), where('codigoProduto', '==', 'test'), limit(1));
    const snap = await getDocs(q);
    console.log("Query success. Docs:", snap.docs.length);
  } catch(e) {
    console.error("Query failed:", e.message);
  }
  process.exit(0);
}
run();
