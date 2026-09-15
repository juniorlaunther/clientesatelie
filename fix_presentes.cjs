const fs = require('fs');
let code = fs.readFileSync('src/pages/Presentes.tsx', 'utf8');

code = code.replace(
  /id: \\\`PRES-\\\$\\{Date\.now\(\)\}\\\`/,
  "id: `PRES-${Date.now()}`"
);

code = code.replace(
  /href=\{\\\`https:\/\/wa\.me\/\\\$\\{cli\.telefone\.replace\(\/\\\\D\/g, ''\)\}\\\`\}/,
  "href={`https://wa.me/${cli.telefone.replace(/\\D/g, '')}`}"
);

code = code.replace(
  /className=\{\\\`px-2.5 py-1 rounded-full text-xs font-medium \\n                          \\\$\\{statusLabel === 'Elegível' \? 'bg-blue-50 text-blue-700' : \\n                            statusLabel === 'Enviado' \? 'bg-orange-50 text-orange-700' : \\n                            statusLabel === 'Entregue' \? 'bg-green-50 text-green-700' : \\n                            'bg-neutral-100 text-neutral-600'\\}\\\`\}/,
  "className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusLabel === 'Elegível' ? 'bg-blue-50 text-blue-700' : statusLabel === 'Enviado' ? 'bg-orange-50 text-orange-700' : statusLabel === 'Entregue' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}"
);

fs.writeFileSync('src/pages/Presentes.tsx', code);
