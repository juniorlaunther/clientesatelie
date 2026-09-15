import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ListaSalva } from '../types';

export const listaService = {
  async getListas(): Promise<ListaSalva[]> {
    const snap = await getDocs(collection(db, 'listas'));
    return snap.docs.map(d => d.data() as ListaSalva).sort((a, b) => b.criadoEm - a.criadoEm);
  },
  
  async createLista(lista: ListaSalva): Promise<void> {
    await setDoc(doc(db, 'listas', lista.id), lista);
  },
  
  async updateLista(id: string, nome: string): Promise<void> {
    await updateDoc(doc(db, 'listas', id), { nome });
  },
  
  async deleteLista(id: string): Promise<void> {
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
  }
};
