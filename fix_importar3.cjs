const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

code = code.replace(
  /batch\.update\(doc\(collection\(db, 'produtos_catalogo'\), id\), catalog\.get\(id\)\!\);/g,
  "batch.set(doc(collection(db, 'produtos_catalogo'), id), catalog.get(id)!, { merge: true });"
);

fs.writeFileSync('src/pages/Importar.tsx', code);
