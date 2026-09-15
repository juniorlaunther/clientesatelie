const fs = require('fs');
let s = fs.readFileSync('src/store/useStore.ts', 'utf8');

s = s.replace(
  /catalogService\.getCatalog\(\)/,
  "catalogService.getCatalogWithStats()"
);

fs.writeFileSync('src/store/useStore.ts', s);
