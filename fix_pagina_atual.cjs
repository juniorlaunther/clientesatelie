const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

s = s.replace(
  /<span className="text-\[10px\] text-neutral-400 whitespace-nowrap hidden sm:inline">\(página atual\)<\/span>/,
  ""
);

fs.writeFileSync('src/pages/Clientes.tsx', s);
