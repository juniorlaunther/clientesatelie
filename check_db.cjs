const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getCountFromServer } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-81be4f42-de43-48c5-9c71-1bd0049bba5a");

async function check() {
  try {
    const clientesSnap = await getCountFromServer(collection(db, 'clientes'));
    const comprasSnap = await getCountFromServer(collection(db, 'compras'));
    const produtosSnap = await getCountFromServer(collection(db, 'produtos_comprados'));
    
    console.log(`Total Clientes: ${clientesSnap.data().count}`);
    console.log(`Total Compras: ${comprasSnap.data().count}`);
    console.log(`Total Produtos Comprados: ${produtosSnap.data().count}`);
    process.exit(0);
  } catch (err) {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  }
}
check();
