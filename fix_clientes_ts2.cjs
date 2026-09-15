const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

code = code.replace(
  "if (action !== 'delete') {\n        setSelectedEmails(new Set());\n      }",
  "setSelectedEmails(new Set());"
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
