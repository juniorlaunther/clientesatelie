import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

// 1. _deleteRelatedRecords
const delRelRegex = /async _deleteRelatedRecords\(email: string, batch: any, ops: \{ count: number \}\) \{/;
content = content.replace(delRelRegex, "async _deleteRelatedRecords(email: string, batch: any, ops: { count: number }, codigosProdutos: Set<string>) {");

const snapProdRegex = /for \(const d of snapProd\.docs\) \{\n\s*batch\.delete\(d\.ref\);\n\s*ops\.count\+\+;\n\s*\}/;
content = content.replace(snapProdRegex, "for (const d of snapProd.docs) {\n      batch.delete(d.ref);\n      codigosProdutos.add(d.data().codigoProduto);\n      ops.count++;\n    }");

// 2. bulkDeleteClientes
const bulkDelRegex = /async bulkDeleteClientes\(emails: string\[\]\): Promise<void> \{[\s\S]*?await statsService\.atualizarEstatisticasGerais\(\);\n\s*\}/;

const newBulkDel = `
  async bulkDeleteClientes(emails: string[]): Promise<void> {
    if (emails.length === 0) return;
    
    let batch = writeBatch(db);
    let ops = { count: 0 };
    const codigosProdutos = new Set<string>();
    
    for (const email of emails) {
      batch.delete(doc(db, 'clientes', email));
      ops.count++;
      
      await this._deleteRelatedRecords(email, batch, ops, codigosProdutos);
      if (ops.count >= 350) {
        await batch.commit();
        batch = writeBatch(db);
        ops.count = 0;
      }
    }
    if (ops.count > 0) {
      await batch.commit();
    }
    
    // Recalculate catalog products
    if (codigosProdutos.size > 0) {
       const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
       for (const cod of codigosProdutos) {
          const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(cod));
          if (cat) await require('./catalogService').catalogService.recalcularResumoProduto(cat.id);
       }
    }

    await this.recalcularNumeracao();
    await statsService.atualizarEstatisticasGerais();
  }
`;

content = content.replace(bulkDelRegex, newBulkDel.trim());

// 3. deleteCliente - remove the redundant product logic since bulkDeleteClientes handles it now
const delClienteRegex = /async deleteCliente\(email: string\): Promise<void> \{[\s\S]*?async getAllCompras/;
const newDelCliente = `
  async deleteCliente(email: string): Promise<void> {
    await this.bulkDeleteClientes([email]);
  }

  async getAllCompras
`;

content = content.replace(delClienteRegex, newDelCliente.trim());

fs.writeFileSync('src/services/clientService.ts', content);
