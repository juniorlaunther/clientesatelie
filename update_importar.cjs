const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

if(!code.includes("import { catalogService }")) {
  code = code.replace("import { clientService }", "import { clientService }\\nimport { catalogService }\\nimport { ProdutoCatalogo }");
}

code = code.replace(
  "const [existingClients, existingPhones, maxClientNumber] = await Promise.all([",
  "const [existingClients, existingPhones, maxClientNumber, catalogArray] = await Promise.all(["
);

code = code.replace(
  "importService.getMaxClientNumber()\\n      ]);",
  "importService.getMaxClientNumber(),\\n        catalogService.getCatalog()\\n      ]);"
);

code = code.replace(
  "let conflitos = 0;",
  `let conflitos = 0;
      
      const normalizeProductName = (name: string) => name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim().toLowerCase();
      
      const catalog = new Map<string, ProdutoCatalogo>();
      catalogArray.forEach(c => catalog.set(c.id, c));
      const newCatalogItems = new Map<string, ProdutoCatalogo>();
      const catalogUpdates = new Set<string>(); // IDs of existing catalog items to update
`
);

code = code.replace(
  "novosProdutos++;\\n        });",
  `novosProdutos++;
          
          const pCodigoProduto = prod['Código do produto'];
          const pCodigoPreco = prod['Código do preço'];
          const pNomeProduto = prod['Nome do produto'];
          const pNorm = normalizeProductName(pNomeProduto);
          
          let foundCatId = null;
          // check new catalog items first
          for (const [catId, catObj] of newCatalogItems.entries()) {
            if (catObj.codigosProduto.includes(pCodigoProduto) || catObj.nomeNormalizado === pNorm) {
              foundCatId = catId;
              break;
            }
          }
          if (!foundCatId) {
            for (const [catId, catObj] of catalog.entries()) {
              if (catObj.codigosProduto.includes(pCodigoProduto) || catObj.nomeNormalizado === pNorm) {
                foundCatId = catId;
                break;
              }
            }
          }
          
          if (foundCatId) {
            let catObj = newCatalogItems.get(foundCatId) || catalog.get(foundCatId)!;
            let updated = false;
            if (!catObj.codigosProduto.includes(pCodigoProduto)) {
              catObj.codigosProduto.push(pCodigoProduto);
              updated = true;
            }
            if (!catObj.codigosPreco.includes(pCodigoPreco)) {
              catObj.codigosPreco.push(pCodigoPreco);
              updated = true;
            }
            if (catalog.has(foundCatId) && updated) {
              catalogUpdates.add(foundCatId);
            }
          } else {
            const newId = \`CAT-\${Date.now()}-\${Math.floor(Math.random()*10000)}\`;
            newCatalogItems.set(newId, {
              id: newId,
              nomeOficial: pNomeProduto,
              nomeNormalizado: pNorm,
              codigosProduto: [pCodigoProduto],
              codigosPreco: [pCodigoPreco]
            } as ProdutoCatalogo);
          }
        });`
);

code = code.replace(
  "for (const prod of produtosToWrite) {",
  `
      for (const [id, item] of newCatalogItems.entries()) {
        batch.set(doc(collection(db, 'produtos_catalogo'), id), item);
        opCount++;
        if (opCount >= 500) await commitBatch();
      }
      for (const id of catalogUpdates) {
        batch.update(doc(collection(db, 'produtos_catalogo'), id), catalog.get(id)!);
        opCount++;
        if (opCount >= 500) await commitBatch();
      }
      for (const prod of produtosToWrite) {`
);

fs.writeFileSync('src/pages/Importar.tsx', code);
