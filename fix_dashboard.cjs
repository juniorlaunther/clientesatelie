const fs = require('fs');
let s = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
s = s.replace(/loadEstatisticas\(\);/g, 'loadEstatisticas(true);');
fs.writeFileSync('src/pages/Dashboard.tsx', s);
