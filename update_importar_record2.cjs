const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

code = code.replace(
  "baseCompraIds: Array.from(comprasToCreate.keys()),",
  "baseCompraIds: comprasToWrite.map(c => c.id),"
);

code = code.replace(
  "newClientEmails: Array.from(clientesToCreate.keys()),",
  "newClientEmails: clientsToWrite.map(c => c.email),"
);

code = code.replace(
  "updatedClientEmails: Array.from(clientesToUpdate.keys()),",
  "updatedClientEmails: updatedClientsArray,"
);

fs.writeFileSync('src/pages/Importar.tsx', code);
