const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

code = code.replace(
  /const existingTxs = await importService\.getExistingTransactions\(allTxIds\);/,
  "const existingTxs = await importService.getValidExistingTransactions(allTxIds, existingClients);"
);

fs.writeFileSync('src/pages/Importar.tsx', code);
