const fs = require('fs');
let code = fs.readFileSync('src/services/listaService.ts', 'utf8');

code = code.replace(
  "import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';",
  "import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';"
);

code = code.replace(
  "async deleteLista(id: string): Promise<void> {\n    await deleteDoc(doc(db, 'listas', id));\n  }",
  `async deleteLista(id: string): Promise<void> {
    await deleteDoc(doc(db, 'listas', id));
  },
  
  async addClientesToLista(listaId: string, novosEmails: string[]): Promise<void> {
    const docRef = doc(db, 'listas', listaId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const set = new Set([...(data.clienteIds || []), ...novosEmails]);
      await updateDoc(docRef, { clienteIds: Array.from(set) });
    }
  }`
);

fs.writeFileSync('src/services/listaService.ts', code);
