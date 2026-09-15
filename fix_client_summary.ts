import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

// replace recalcularResumoCliente
const regex = /async recalcularResumoCliente[\s\S]*?quantidadeProdutos: produtosCompradosIds\.length,\n\s*termosBusca: termos\n\s*\}\);\n\s*\},/;

const newFunc = `async recalcularResumoCliente(clienteId: string): Promise<void> {
    const { query, where, collection, getDocs, doc, updateDoc, getDoc } = require('firebase/firestore');
    
    const comprasSnap = await getDocs(query(collection(db, 'compras'), where('clienteId', '==', clienteId)));
    const prodSnap = await getDocs(query(collection(db, 'produtos_comprados'), where('clienteId', '==', clienteId)));
    
    let quantidadeCompras = 0;
    let dataUltimaCompra = 0;
    let dataPrimeiraCompra = Number.MAX_SAFE_INTEGER;
    let codigoPrimeiraCompra = '';
    
    comprasSnap.forEach(d => {
       quantidadeCompras++;
       const dt = d.data().dataTransacao;
       if (dt > dataUltimaCompra) dataUltimaCompra = dt;
       if (dt < dataPrimeiraCompra) {
          dataPrimeiraCompra = dt;
          codigoPrimeiraCompra = d.id;
       }
    });

    if (quantidadeCompras === 0) {
       dataPrimeiraCompra = 0;
       codigoPrimeiraCompra = '';
    }
    
    const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
    const catalogData = catalogSnap.docs.map(d => ({id: d.id, codigos: d.data().codigosProduto || []}));
    
    const produtosCompradosIdsSet = new Set<string>();
    
    prodSnap.forEach(d => {
       const cod = d.data().codigoProduto;
       const cat = catalogData.find(c => c.codigos.includes(cod));
       if (cat) produtosCompradosIdsSet.add(cat.id);
    });
    
    const produtosCompradosIds = Array.from(produtosCompradosIdsSet);
    
    // Create maps for efficient querying without multiple array-contains
    const produtosMap: Record<string, boolean> = {};
    produtosCompradosIds.forEach(id => produtosMap[id] = true);
    
    const clienteSnap = await getDoc(doc(db, 'clientes', clienteId));
    if (!clienteSnap.exists()) return;
    const cData = clienteSnap.data();
    
    const etiquetas = cData.etiquetas || [];
    const etiquetasMap: Record<string, boolean> = {};
    etiquetas.forEach((t: string) => etiquetasMap[t] = true);
    
    const termos = [
      cData.nome?.toLowerCase(),
      cData.emailOriginal?.toLowerCase(),
      cData.telefoneOriginal?.toLowerCase(),
      ...produtosCompradosIds
    ].filter(Boolean);
    
    await updateDoc(doc(db, 'clientes', clienteId), {
       quantidadeCompras,
       dataUltimaCompra,
       dataPrimeiraCompra: quantidadeCompras > 0 ? dataPrimeiraCompra : cData.dataPrimeiraCompra,
       codigoPrimeiraCompra: quantidadeCompras > 0 ? codigoPrimeiraCompra : cData.codigoPrimeiraCompra,
       produtosCompradosIds,
       produtosMap,
       etiquetasMap,
       quantidadeProdutos: produtosCompradosIds.length,
       termosBusca: termos
    });
  },`;

content = content.replace(regex, newFunc);
fs.writeFileSync('src/services/clientService.ts', content);
