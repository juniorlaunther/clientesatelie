const fs = require('fs');

let importar = fs.readFileSync('src/pages/Importar.tsx', 'utf8');
importar = importar.replace(
  /await clientService.recalcularNumeracao\(\);\n      \}/,
  "await clientService.recalcularNumeracao();\n      }\n\n      const allCatalogIdsToUpdate = Array.from(new Set([...Array.from(newCatalogItems.keys()), ...Array.from(catalogUpdates)]));\n      for (const id of allCatalogIdsToUpdate) {\n         await require('../services/catalogService').catalogService.recalcularResumoProduto(id);\n      }"
);
fs.writeFileSync('src/pages/Importar.tsx', importar);

let clientService = fs.readFileSync('src/services/clientService.ts', 'utf8');
// Fix createCompraEProduto
clientService = clientService.replace(
  /if \(needsRenumbering\) \{\n       await this\.recalcularNumeracao\(compra\.clienteId\);\n    \}/,
  "if (needsRenumbering) {\n       await this.recalcularNumeracao(compra.clienteId);\n    }\n    await statsService.atualizarEstatisticasGerais();"
);

// Fix updateCliente
clientService = clientService.replace(
  /await updateDoc\(docRef, data\);\n  \},/,
  "await updateDoc(docRef, data);\n    if (data.estaNoGrupo !== undefined) {\n      await statsService.atualizarEstatisticasGerais();\n    }\n  },"
);

fs.writeFileSync('src/services/clientService.ts', clientService);
