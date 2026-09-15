const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

code = code.replace(
  "status: 'concluida'",
  `status: 'concluida',
        transactionIds: produtosToWrite.map(p => p.id),
        baseCompraIds: Array.from(comprasToCreate.keys()),
        newClientEmails: Array.from(clientesToCreate.keys()),
        updatedClientEmails: Array.from(clientesToUpdate.keys()),
        newCatalogIds: Array.from(newCatalogItems.keys()),
        updatedCatalogIds: Array.from(catalogUpdates)`
);

fs.writeFileSync('src/pages/Importar.tsx', code);
