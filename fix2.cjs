const fs = require('fs');
let code = fs.readFileSync('src/services/clientService.ts', 'utf8');

code = code.replace(/  \}\},\n  async bulkUpdateClientes/, '  },\n  async bulkUpdateClientes');

// The end of the file currently is:
//   }
// };

code = code.replace(/  \}\n\s*;\s*$/, '  }\n};\n');

fs.writeFileSync('src/services/clientService.ts', code);
