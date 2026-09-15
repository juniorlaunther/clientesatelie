const fs = require('fs');
let s = fs.readFileSync('src/services/clientService.ts', 'utf8');
s = s.replace(
  /snapshot\.docs\.forEach\(d => \{\n\s*clienteId = d\.data\(\)\.clienteId;\n\s*batch\.delete\(d\.ref\);\n\s*\}\);/,
  "const codigosAfetados: string[] = [];\n    snapshot.docs.forEach(d => {\n      clienteId = d.data().clienteId;\n      if (d.data().codigoProduto) codigosAfetados.push(d.data().codigoProduto);\n      batch.delete(d.ref);\n    });"
);

s = s.replace(
  /if \(clienteId\) \{\n\s*await this\.recalcularNumeracao\(clienteId\);\n\s*\}/,
  "if (clienteId) {\n      await this.recalcularNumeracao(clienteId);\n    }\n\n    const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));\n    for (const cod of codigosAfetados) {\n       const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(cod));\n       if (cat) await require('./catalogService').catalogService.recalcularResumoProduto(cat.id);\n    }"
);
fs.writeFileSync('src/services/clientService.ts', s);
