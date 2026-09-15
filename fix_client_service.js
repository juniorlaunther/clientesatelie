const fs = require('fs');
let code = fs.readFileSync('src/services/clientService.ts', 'utf8');

// Insert new methods at the end of the object
const methods = `
  async bulkUpdateClientes(emails: string[], data: Partial<Cliente>): Promise<void> {
    const batch = writeBatch(db);
    let opCount = 0;
    
    for (const email of emails) {
      batch.update(doc(db, 'clientes', email), data);
      opCount++;
      if (opCount >= 400) {
        await batch.commit();
        opCount = 0;
      }
    }
    if (opCount > 0) {
      await batch.commit();
    }
  },

  async bulkDeleteClientes(emails: string[]): Promise<void> {
    // Delete the clients
    let batch = writeBatch(db);
    let opCount = 0;
    for (const email of emails) {
      batch.delete(doc(db, 'clientes', email));
      opCount++;
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
    if (opCount > 0) {
      await batch.commit();
    }
    
    // Now renumber remaining clients
    await this.recalcularNumeracao();
  },
  
  async recalcularNumeracao(): Promise<void> {
    const clientesRef = collection(db, 'clientes');
    // Sort by date created or first purchase to maintain deterministic order if possible,
    // or just by their current number so they shrink down without changing relative order.
    const q = query(clientesRef, orderBy('numero', 'asc'));
    const snapshot = await getDocs(q);
    
    let batch = writeBatch(db);
    let opCount = 0;
    let expectedNumber = 1;
    
    for (const d of snapshot.docs) {
      const data = d.data() as Cliente;
      if (data.numero !== expectedNumber) {
        batch.update(d.ref, { numero: expectedNumber });
        opCount++;
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }
      expectedNumber++;
    }
    
    if (opCount > 0) {
      await batch.commit();
    }
  },
`;

code = code.replace(/async deleteCompraEProdutos[^}]+\}[^}]+\}[^}]+\}/, match => match + ',\n' + methods);

fs.writeFileSync('src/services/clientService.ts', code);
