import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const oldCode = `  async getComprasByCliente(email: string): Promise<Compra[]> {
    const q = query(collection(db, 'compras'), where('clienteId', '==', email), orderBy('dataTransacao', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Compra));
  },`;

const newCode = `  async getComprasByCliente(email: string): Promise<Compra[]> {
    const q = query(collection(db, 'compras'), where('clienteId', '==', email));
    const snapshot = await getDocs(q);
    const compras = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Compra));
    return compras.sort((a, b) => b.dataTransacao - a.dataTransacao);
  },`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/services/clientService.ts', content);
