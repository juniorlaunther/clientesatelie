import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const regex = /if \(data\.nome !== undefined \|\| data\.telefoneOriginal !== undefined \|\| data\.emailOriginal !== undefined\) \{[\s\S]*?\}\n    \}\n    \n    await updateDoc\(docRef, data\);/;

const newLogic = `
    if (data.nome !== undefined || data.telefoneOriginal !== undefined || data.emailOriginal !== undefined || data.etiquetas !== undefined) {
      const snap = await require('firebase/firestore').getDoc(docRef);
      if (snap.exists()) {
         const current = snap.data();
         const merged = { ...current, ...data };
         const termos = [
            merged.nome?.toLowerCase(),
            merged.emailOriginal?.toLowerCase(),
            merged.telefoneOriginal?.toLowerCase(),
            ...(merged.produtosCompradosIds || []),
            ...(merged.etiquetas || [])
         ].filter(Boolean);
         data.termosBusca = termos;
      }
    }
    
    await updateDoc(docRef, data);`;

content = content.replace(regex, newLogic.trim());
fs.writeFileSync('src/services/clientService.ts', content);
