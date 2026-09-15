const fs = require('fs');
let s = fs.readFileSync('src/services/clientService.ts', 'utf8');
s = s.replace(/await statsService\.atualizarEstatisticasGerais\(\);\s*await statsService\.atualizarEstatisticasGerais\(\);/g, 'await statsService.atualizarEstatisticasGerais();');
fs.writeFileSync('src/services/clientService.ts', s);
