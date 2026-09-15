import { db } from './src/lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Cliente, Compra, ProdutoVendido, ProdutoCatalogo } from './src/types';

async function run() {
  console.log('Starting migration...');
  
  const clientesSnap = await getDocs(collection(db, 'clientes'));
  const comprasSnap = await getDocs(collection(db, 'compras'));
  const produtosSnap = await getDocs(collection(db, 'produtos_comprados'));
  const catalogoSnap = await getDocs(collection(db, 'produtos_catalogo'));

  const clientes = clientesSnap.docs.map(d => ({ docId: d.id, ...d.data() } as Cliente & { docId: string }));
  const compras = comprasSnap.docs.map(d => ({ docId: d.id, ...d.data() } as Compra & { docId: string }));
  const produtos = produtosSnap.docs.map(d => ({ docId: d.id, ...d.data() } as ProdutoVendido & { docId: string }));
  const catalogo = catalogoSnap.docs.map(d => ({ docId: d.id, ...d.data() } as ProdutoCatalogo & { docId: string }));

  let batch = writeBatch(db);
  let opCount = 0;

  const commit = async () => {
    if (opCount > 0) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
      console.log('Batch committed');
    }
  };

  // 1. Process Clients
  console.log(`Processing ${clientes.length} clients...`);
  for (const c of clientes) {
    const cProds = produtos.filter(p => p.clienteId === c.email);
    const cCompras = compras.filter(comp => comp.clienteId === c.email);
    
    // Group sold products by official catalog id
    const cCatalogIds = new Set<string>();
    cProds.forEach(pv => {
      const official = catalogo.find(cat => cat.codigosProduto.includes(pv.codigoProduto));
      if (official) {
        cCatalogIds.add(official.docId);
      }
    });

    // Date calculations
    let first = Infinity;
    let last = 0;
    cCompras.forEach(comp => {
      if (comp.dataTransacao < first) first = comp.dataTransacao;
      if (comp.dataTransacao > last) last = comp.dataTransacao;
    });
    
    // Update client
    const updateData: Partial<Cliente> = {
      produtosCompradosIds: Array.from(cCatalogIds),
      quantidadeProdutos: cCatalogIds.size,
      quantidadeCompras: cCompras.length,
      dataPrimeiraCompra: first === Infinity ? c.dataPrimeiraCompra : first,
      dataUltimaCompra: last === 0 ? c.dataPrimeiraCompra : last
    };

    batch.update(doc(db, 'clientes', c.docId), updateData);
    opCount++;
    if (opCount >= 400) await commit();
  }
  await commit();

  // 2. Process Compras (Add clienteNome)
  console.log(`Processing ${compras.length} compras...`);
  for (const comp of compras) {
    const cliente = clientes.find(c => c.email === comp.clienteId);
    if (cliente && comp.clienteNome !== cliente.nome) {
      batch.update(doc(db, 'compras', comp.docId), {
        clienteNome: cliente.nome
      });
      opCount++;
      if (opCount >= 400) await commit();
    }
  }
  await commit();

  // 3. Process Catalog
  console.log(`Processing ${catalogo.length} catalog items...`);
  const codeToCat = new Map<string, string>();
  catalogo.forEach(c => {
    c.codigosProduto.forEach(code => codeToCat.set(code, c.docId));
  });

  const statsMap = new Map<string, {
    unidadesVendidas: number;
    clientes: Set<string>;
    primeiraVenda: number;
    ultimaVenda: number;
  }>();

  catalogo.forEach(c => {
    statsMap.set(c.docId, { unidadesVendidas: 0, clientes: new Set(), primeiraVenda: Infinity, ultimaVenda: 0 });
  });

  produtos.forEach(p => {
    const catId = codeToCat.get(p.codigoProduto);
    if (catId) {
      const stats = statsMap.get(catId)!;
      stats.unidadesVendidas++;
      stats.clientes.add(p.clienteId);
      if (p.dataTransacao < stats.primeiraVenda) stats.primeiraVenda = p.dataTransacao;
      if (p.dataTransacao > stats.ultimaVenda) stats.ultimaVenda = p.dataTransacao;
    }
  });

  for (const c of catalogo) {
    const st = statsMap.get(c.docId)!;
    batch.update(doc(db, 'produtos_catalogo', c.docId), {
      unidadesVendidas: st.unidadesVendidas,
      clientesUnicos: st.clientes.size,
      primeiraVenda: st.primeiraVenda === Infinity ? null : st.primeiraVenda,
      ultimaVenda: st.ultimaVenda === 0 ? null : st.ultimaVenda
    });
    opCount++;
    if (opCount >= 400) await commit();
  }
  await commit();

  console.log('Migration finished successfully!');
  process.exit(0);
}

run().catch(console.error);
