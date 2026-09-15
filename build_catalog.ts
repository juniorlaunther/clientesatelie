import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

function normalizeProductName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function run() {
  const prodsSnap = await getDocs(collection(db, 'produtos_comprados'));
  const catalog = new Map(); // id -> ProdutoCatalogo
  
  // existing catalog?
  const catSnap = await getDocs(collection(db, 'produtos_catalogo'));
  catSnap.forEach(d => catalog.set(d.id, d.data()));

  let batch = writeBatch(db);
  let cCount = 0;

  for (const d of prodsSnap.docs) {
    const p = d.data();
    const norm = normalizeProductName(p.nomeProduto);
    
    // Find if we already have it in catalog by product code or normalized name
    let foundId = null;
    for (const [catId, catObj] of catalog.entries()) {
      if (catObj.codigosProduto.includes(p.codigoProduto)) {
        foundId = catId;
        break;
      }
      if (catObj.nomeNormalizado === norm) {
        foundId = catId;
        break;
      }
    }

    if (foundId) {
      const catObj = catalog.get(foundId);
      if (!catObj.codigosProduto.includes(p.codigoProduto)) catObj.codigosProduto.push(p.codigoProduto);
      if (!catObj.codigosPreco.includes(p.codigoPreco)) catObj.codigosPreco.push(p.codigoPreco);
    } else {
      const newId = `CAT-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const newCat = {
        id: newId,
        nomeOficial: p.nomeProduto,
        nomeNormalizado: norm,
        codigosProduto: [p.codigoProduto],
        codigosPreco: [p.codigoPreco]
      };
      catalog.set(newId, newCat);
    }
  }

  for (const [catId, catObj] of catalog.entries()) {
    batch.set(doc(db, 'produtos_catalogo', catId), catObj);
    cCount++;
    if (cCount >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      cCount = 0;
    }
  }

  if (cCount > 0) {
    await batch.commit();
  }
  console.log('Catalog built.');
}

run().catch(console.error);
