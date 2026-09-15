import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const createCompraCode = `
  async createCompraEProduto(compra: Compra, produto: ProdutoVendido): Promise<void> {
    const { getDoc } = require('firebase/firestore');
    const batch = writeBatch(db);
    batch.set(doc(db, 'compras', compra.id), compra);
    batch.set(doc(db, 'produtos_comprados', produto.id), produto);
    await batch.commit();
    
    // Check if we need to recalcularNumeracao
    const cSnap = await getDoc(doc(db, 'clientes', compra.clienteId));
    let needsRenumbering = false;
    if (cSnap.exists()) {
       const cData = cSnap.data();
       if (compra.dataTransacao < cData.dataPrimeiraCompra) {
          needsRenumbering = true;
       }
    }
    
    await this.recalcularResumoCliente(compra.clienteId);
    if (needsRenumbering) {
       await this.recalcularNumeracao(compra.clienteId);
    }
    await statsService.atualizarEstatisticasGerais();
    
    // Trigger product recalculation
    if (produto.codigoProduto) {
       const catalogSnap = await require('firebase/firestore').getDocs(collection(db, 'produtos_catalogo'));
       const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(produto.codigoProduto));
       if (cat) await require('./catalogService').catalogService.recalcularResumoProduto(cat.id);
    }
  },
`;

const deleteCompraCode = `
  async deleteCompraEProdutos(compraId: string): Promise<void> {
    const { getDoc } = require('firebase/firestore');
    const q = query(collection(db, 'produtos_comprados'), where('compraId', '==', compraId));
    const snapshot = await getDocs(q);
    
    let clienteId = '';
    const codigosProdutos = new Set<string>();
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      clienteId = d.data().clienteId;
      codigosProdutos.add(d.data().codigoProduto);
      batch.delete(d.ref);
    });
    batch.delete(doc(db, 'compras', compraId));
    
    // Check if this was the first purchase
    let needsRenumbering = false;
    if (clienteId) {
       const cSnap = await getDoc(doc(db, 'clientes', clienteId));
       if (cSnap.exists() && cSnap.data().codigoPrimeiraCompra === compraId) {
          needsRenumbering = true;
       }
    }
    
    await batch.commit();
    
    if (clienteId) {
       await this.recalcularResumoCliente(clienteId);
       if (needsRenumbering) await this.recalcularNumeracao(clienteId);
    }
    await statsService.atualizarEstatisticasGerais();
    
    // Trigger product recalculation
    if (codigosProdutos.size > 0) {
       const catalogSnap = await require('firebase/firestore').getDocs(collection(db, 'produtos_catalogo'));
       for (const cod of codigosProdutos) {
          const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(cod));
          if (cat) await require('./catalogService').catalogService.recalcularResumoProduto(cat.id);
       }
    }
  },
`;

content = content.replace(/async createCompraEProduto[\s\S]*?async deleteCompraEProdutos/, createCompraCode.trim() + '\n\n  async deleteCompraEProdutos');
content = content.replace(/async deleteCompraEProdutos[\s\S]*?batch\.commit\(\);\n\s*await this\.recalcularNumeracao\(\);\s*\}/, deleteCompraCode.trim());

// We must also update deleteCliente
const deleteClienteCode = `
  async deleteCliente(email: string): Promise<void> {
    const { getDocs, query, where, collection } = require('firebase/firestore');
    
    // Find products they bought to recalculate
    const q = query(collection(db, 'produtos_comprados'), where('clienteId', '==', email));
    const snapshot = await getDocs(q);
    const codigosProdutos = new Set<string>();
    snapshot.docs.forEach((d: any) => codigosProdutos.add(d.data().codigoProduto));
    
    await this.bulkDeleteClientes([email]);
    
    if (codigosProdutos.size > 0) {
       const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
       for (const cod of codigosProdutos) {
          const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(cod));
          if (cat) await require('./catalogService').catalogService.recalcularResumoProduto(cat.id);
       }
    }
  },
`;

content = content.replace(/async deleteCliente[\s\S]*?await this\.bulkDeleteClientes\(\[email\]\);\s*\}/, deleteClienteCode.trim());

// In bulkDeleteClientes, it calls recalcularNumeracao() and atualizarEstatisticasGerais() at the end. That's fine.

fs.writeFileSync('src/services/clientService.ts', content);
