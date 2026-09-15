import fs from 'fs';
let content = fs.readFileSync('src/services/catalogService.ts', 'utf8');

const summaryFunc = `
  async recalcularResumoProduto(produtoId: string): Promise<void> {
    const { query, where, collection, getDocs, doc, updateDoc, getDoc } = require('firebase/firestore');
    
    const catSnap = await getDoc(doc(db, 'produtos_catalogo', produtoId));
    if (!catSnap.exists()) return;
    const cat = catSnap.data() as ProdutoCatalogo;
    
    // We can't do an 'in' query if the array is large, but usually codigosProduto is < 10
    // To be safe, we fetch all purchases that match.
    // Wait, the page Clientes doesn't read the whole collection anymore, but this recalculates ONE product.
    // If the product has many codes, we can chunk them.
    let totalUnidades = 0;
    const clientesSet = new Set<string>();
    let primeira = Infinity;
    let ultima = 0;
    
    const codigos = cat.codigosProduto || [];
    
    // We query by codigoProduto in batches of 30
    for (let i = 0; i < codigos.length; i += 30) {
       const chunk = codigos.slice(i, i + 30);
       const q = query(collection(db, 'produtos_comprados'), where('codigoProduto', 'in', chunk));
       const pSnap = await getDocs(q);
       pSnap.docs.forEach(d => {
          totalUnidades++;
          clientesSet.add(d.data().clienteId);
          const dt = d.data().dataTransacao;
          if (dt < primeira) primeira = dt;
          if (dt > ultima) ultima = dt;
       });
    }
    
    await updateDoc(doc(db, 'produtos_catalogo', produtoId), {
       unidadesVendidas: totalUnidades,
       clientesUnicos: clientesSet.size,
       primeiraVenda: primeira === Infinity ? null : primeira,
       ultimaVenda: ultima === 0 ? null : ultima
    });
  },
`;

if (!content.includes('recalcularResumoProduto')) {
  content = content.replace('export const catalogService = {', 'export const catalogService = {' + summaryFunc);
}

// Ensure mergeProducts calls it
const mergeEnd = `await batch.commit();\n    await this.recalcularResumoProduto(targetId);`;
content = content.replace('await batch.commit();\n  },', mergeEnd + '\n  },');

// Ensure splitCode calls it
const splitEnd = `await batch.commit();\n    await this.recalcularResumoProduto(productId);\n    await this.recalcularResumoProduto(newId);`;
content = content.replace('await batch.commit();\n  }\n};', splitEnd + '\n  }\n};');

fs.writeFileSync('src/services/catalogService.ts', content);
