const fs = require('fs');
let code = fs.readFileSync('src/services/clientService.ts', 'utf8');

// Also update standard deleteCliente to trigger recalcularNumeracao
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
    await this.recalcularNumeracao();
  },
  
  async recalcularNumeracao(): Promise<void> {
    const clientesRef = collection(db, 'clientes');
    const q = query(clientesRef, orderBy('numero', 'asc'));
    const snapshot = await getDocs(q);
    
    let batch = writeBatch(db);
    let opCount = 0;
    let expectedNumber = 1;
    
    for (const d of snapshot.docs) {
      const data = d.data();
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
  }
`;

// Insert new methods at the end of the object
code = code.replace(/async deleteCompraEProdutos[^}]+\}[^}]+\}[^}]+\}/, match => match + ',\n' + methods);

// Replace deleteCliente to also call recalcularNumeracao
code = code.replace(/async deleteCliente\(email: string\): Promise<void> \{([^}]+)\}/, 
"async deleteCliente(email: string): Promise<void> {\n    const docRef = doc(db, 'clientes', email);\n    await deleteDoc(docRef);\n    await this.recalcularNumeracao();\n  }"
);

fs.writeFileSync('src/services/clientService.ts', code);
