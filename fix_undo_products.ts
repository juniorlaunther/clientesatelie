import fs from 'fs';
let content = fs.readFileSync('src/services/importService.ts', 'utf8');

const regex = /for \(const email of updatedClientEmails\) \{\n\s*await clientService\.recalcularResumoCliente\(email\);\n\s*\}/;

const newLogic = `for (const email of updatedClientEmails) {
       await clientService.recalcularResumoCliente(email);
    }
    
    // Also recalculate updated products
    const updatedCatalogIds = imp.updatedCatalogIds || [];
    for (const catId of updatedCatalogIds) {
       await require('./catalogService').catalogService.recalcularResumoProduto(catId);
    }`;

content = content.replace(regex, newLogic);
fs.writeFileSync('src/services/importService.ts', content);
