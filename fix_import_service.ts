import fs from 'fs';
let content = fs.readFileSync('src/services/importService.ts', 'utf8');

const regex = /const q = query\(collection\(db, 'importacoes'\), where\('status', '==', 'concluida'\), orderBy\('data', 'desc'\), limit\(1\)\);\n\s*const snap = await getDocs\(q\);\n\s*if \(snap\.empty\) return null;\n\s*return \{ \.\.\.snap\.docs\[0\]\.data\(\), id: snap\.docs\[0\]\.id \} as Importacao;/;

const newCode = `    const q = query(collection(db, 'importacoes'), orderBy('data', 'desc'), limit(20));
    const snap = await getDocs(q);
    const doc = snap.docs.find(d => d.data().status === 'concluida');
    if (!doc) return null;
    return { ...doc.data(), id: doc.id } as Importacao;`;

content = content.replace(regex, newCode);
fs.writeFileSync('src/services/importService.ts', content);
