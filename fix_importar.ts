import fs from 'fs';
let content = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

// The broken code looks like:
// produtosCompradosIds: Array.from(prodIds),
// dataUltimaCompra: maxData,
// etiquetas: [],
// estaNoGrupo: false,
// termosBusca: computeTermos({ nome: data.nome, emailOriginal: data.emailOriginal, telefoneOriginal: data.telefoneOriginal }, Array.from(prodIds), []), id) => ({ ...acc, [id]: true }), {}),
// });

// Fix newClients:
content = content.replace(/termosBusca: computeTermos\(\{ nome: data\.nome, emailOriginal: data\.emailOriginal, telefoneOriginal: data\.telefoneOriginal \}, Array\.from\(prodIds\), \[\]\), id\) => \(\{ \.\.\.acc, \[id\]: true \}\), \{\}\),/, "termosBusca: computeTermos({ nome: data.nome, emailOriginal: data.emailOriginal, telefoneOriginal: data.telefoneOriginal }, Array.from(prodIds), [])");

// Fix updatedClients:
// produtosCompradosIds: pArray, id) => ({ ...acc, [id]: true }), {}),
// termosBusca: computeTermos(existing, pArray, existing.etiquetas || []),
content = content.replace(/produtosCompradosIds: pArray, id\) => \(\{ \.\.\.acc, \[id\]: true \}\), \{\}\),/, "produtosCompradosIds: pArray,");


fs.writeFileSync('src/pages/Importar.tsx', content);
