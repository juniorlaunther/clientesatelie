import fs from 'fs';
let content = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

const regex = /await clientService\.recalcularNumeracao\(\);\n\s*await import\('\.\.\/services\/statsService'\)\.then\(m => m\.statsService\.atualizarEstatisticasGerais\(\)\);/;

const newLogic = `
      // Check if renumbering is actually needed
      // Needs renumbering if there are new clients, or if updated clients got older purchases
      // For simplicity, if novasCompras > 0 we run it, but it's very fast anyway since it just validates order
      if (novosClientes > 0 || novasCompras > 0) {
         await clientService.recalcularNumeracao();
      }
      
      if (novosClientes > 0 || novasCompras > 0 || novosProdutos > 0 || clientesAtualizados > 0) {
         await import('../services/statsService').then(m => m.statsService.atualizarEstatisticasGerais());
      }`;

content = content.replace(regex, newLogic);
fs.writeFileSync('src/pages/Importar.tsx', content);
