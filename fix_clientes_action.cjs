const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const regex = /if \(action === 'delete'\) \{\s*await clientService\.bulkDeleteClientes\(emailsArray\);\s*\} else \{\s*let updateData: any = \{\};\s*if \(action === 'grupo_in'\) updateData\.estaNoGrupo = true;\s*if \(action === 'grupo_out'\) updateData\.estaNoGrupo = false;\s*if \(action === 'destaque_in'\) updateData\.destaqueManual = true;\s*if \(action === 'destaque_out'\) updateData\.destaqueManual = false;\s*await clientService\.bulkUpdateClientes\(emailsArray, updateData\);\s*\}/;

const replacement = `
      let updateData: any = {};
      if (action === 'grupo_in') updateData.estaNoGrupo = true;
      if (action === 'grupo_out') updateData.estaNoGrupo = false;
      if (action === 'destaque_in') updateData.destaqueManual = true;
      if (action === 'destaque_out') updateData.destaqueManual = false;
      
      await clientService.bulkUpdateClientes(emailsArray, updateData);
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/Clientes.tsx', code);
