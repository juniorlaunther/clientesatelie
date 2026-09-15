import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';

export const configService = {
  async getPrazoConfirmacao(): Promise<number> {
    const docRef = doc(db, 'config', 'geral');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists() && snapshot.data().prazoConfirmacaoPresente) {
      return snapshot.data().prazoConfirmacaoPresente;
    }
    return 7;
  },
  async setPrazoConfirmacao(dias: number): Promise<void> {
    const docRef = doc(db, 'config', 'geral');
    await setDoc(docRef, { prazoConfirmacaoPresente: dias }, { merge: true });
  },
  async getNumerosEspeciaisUtilizados(): Promise<number[]> {
    const docRef = doc(db, 'config', 'numerosUtilizados');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data().numeros || [];
    }
    return [];
  },
  async addNumeroEspecialUtilizado(numero: number): Promise<void> {
    const docRef = doc(db, 'config', 'numerosUtilizados');
    const snapshot = await getDoc(docRef);
    let numeros = snapshot.exists() ? snapshot.data().numeros || [] : [];
    if (!numeros.includes(numero)) {
      numeros.push(numero);
      await setDoc(docRef, { numeros }, { merge: true });
    }
  },
  async getNumerosEspeciais(): Promise<number[]> {
    const docRef = doc(db, 'config', 'numerosEspeciais');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data().numeros || [];
    }
    // Default values if not set
    return [100, 200, 300, 500, 700, 1000];
  },

  async addNumeroEspecial(numero: number): Promise<void> {
    const docRef = doc(db, 'config', 'numerosEspeciais');
    const snapshot = await getDoc(docRef);
    let numeros = snapshot.exists() ? snapshot.data().numeros || [] : [100, 200, 300, 500, 700, 1000];
    if (!numeros.includes(numero)) {
      numeros.push(numero);
      numeros.sort((a: number, b: number) => a - b);
      await setDoc(docRef, { numeros }, { merge: true });
    }
  },
  
  async removeNumeroEspecial(numero: number): Promise<void> {
    const docRef = doc(db, 'config', 'numerosEspeciais');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      let numeros = snapshot.data().numeros || [];
      numeros = numeros.filter((n: number) => n !== numero);
      await setDoc(docRef, { numeros }, { merge: true });
    }
  }
};
