import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-81be4f42-de43-48c5-9c71-1bd0049bba5a");

async function testStats() {
    const { doc, setDoc } = await import('firebase/firestore');
    // Emulate atualizarEstatisticasGerais
    const clientesSnap = await getDocs(collection(db, 'clientes'));
    const comprasSnap = await getDocs(collection(db, 'compras'));
    const produtosSnap = await getDocs(collection(db, 'produtos_comprados'));

    let totalClientes = clientesSnap.size;
    let compras = comprasSnap.size;
    let produtosVendidos = produtosSnap.size;
    
    await setDoc(doc(db, 'estatisticas', 'geral'), {
        totalClientes, compras, produtosVendidos,
        novosClientes: 0,
        inGroup: 0,
        notInGroup: 0,
        productCounts: {}
    }, { merge: true });
    
    console.log("Stats updated successfully");
}
testStats().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1)});
