const fs = require('fs');

function fixFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/Array\.from\(selectedEmails\)/g, "Array.from(selectedEmails as Set<string>)");
  fs.writeFileSync(path, code);
}

fixFile('src/pages/Clientes.tsx');
fixFile('src/pages/ProdutoDetalhes.tsx');
