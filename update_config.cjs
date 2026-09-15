const fs = require('fs');
let code = fs.readFileSync('src/services/configService.ts', 'utf8');
code = code.replace(
  "export const configService = {",
  `export const configService = {
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
  },`
);
fs.writeFileSync('src/services/configService.ts', code);
