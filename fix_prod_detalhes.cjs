const fs = require('fs');
let code = fs.readFileSync('src/pages/ProdutoDetalhes.tsx', 'utf8');

code = code.replace(
  /for \(const update of updates\) \{\s*if\(update\) await clientService\.updateCliente\(update\.email, update\.data\);\s*\}/,
  `for (const update of updates) {
        if(update && update.email) await clientService.updateCliente(update.email, update.data);
      }`
);

fs.writeFileSync('src/pages/ProdutoDetalhes.tsx', code);
