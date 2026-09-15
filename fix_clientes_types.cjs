const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

code = code.replace(/Array.from\(selectedEmails\)/g, 'Array.from(selectedEmails) as string[]');

fs.writeFileSync('src/pages/Clientes.tsx', code);
