const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

const app = initializeApp({
  projectId: "atelie-do-ju-clientes",
  apiKey: "AIzaSyBKxd9-OJNapMJclryXzs1Tp-eFJTC_uks",
  authDomain: "atelie-do-ju-clientes.firebaseapp.com",
  storageBucket: "atelie-do-ju-clientes.firebasestorage.app",
  messagingSenderId: "767593955614",
  appId: "1:767593955614:web:d36852fb6dd130765ac90f"
});

const db = getFirestore(app);

async function run() {
  console.log("Recalculating...");
  const snap = await getDocs(collection(db, 'produtos_catalogo'));
  const docs = snap.docs;
  
  let total = docs.length;
  console.log(`Found ${total} catalog products.`);
  
  let count = 0;
  for (const d of docs) {
    const data = d.data();
    const id = d.id;
    
    let totalUnidades = 0;
    const clientesSet = new Set();
    
    const codigos = data.codigosProduto || [];
    
    for (let i = 0; i < codigos.length; i += 30) {
      const chunk = codigos.slice(i, i + 30);
      const { query, where } = require('firebase/firestore');
      const q = query(collection(db, 'produtos_comprados'), where('codigoProduto', 'in', chunk));
      const pSnap = await getDocs(q);
      pSnap.docs.forEach(pd => {
        totalUnidades++;
        clientesSet.add(pd.data().clienteId);
      });
    }
    
    await updateDoc(doc(db, 'produtos_catalogo', id), {
      unidadesVendidas: totalUnidades,
      clientesUnicos: clientesSet.size
    });
    
    count++;
    if (count % 5 === 0) console.log(`Processed ${count}/${total}`);
  }
  
  console.log("Done!");
}

run().catch(console.error).finally(() => process.exit(0));
