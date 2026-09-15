const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getCountFromServer } = require('firebase/firestore');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
// Connects to (default)
const db = getFirestore(app);

async function check() {
  try {
    const clientesSnap = await getCountFromServer(collection(db, 'clientes'));
    const comprasSnap = await getCountFromServer(collection(db, 'compras'));
    const produtosSnap = await getCountFromServer(collection(db, 'produtos_comprados'));
    
    console.log(`Total Clientes in (default): ${clientesSnap.data().count}`);
    console.log(`Total Compras in (default): ${comprasSnap.data().count}`);
    console.log(`Total Produtos Comprados in (default): ${produtosSnap.data().count}`);
    process.exit(0);
  } catch (err) {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  }
}
check();
