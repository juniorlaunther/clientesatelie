import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');
content = content.replace("await this.bulkDeleteClientes([email]);\n  }\n\n  async getAllCompras", "await this.bulkDeleteClientes([email]);\n  },\n\n  async getAllCompras");
fs.writeFileSync('src/services/clientService.ts', content);
