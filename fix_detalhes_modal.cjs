const fs = require('fs');
let code = fs.readFileSync('src/pages/ClienteDetalhes.tsx', 'utf8');

code = code.replace(
  /\`Tem certeza que deseja excluir o cliente \$\{cliente.nome\}\? Esta ação é irreversível e o número \#\$\{cliente.numero\} não poderá ser reutilizado.\`/,
  "\`Tem certeza que deseja excluir o cliente ${cliente.nome}? Esta ação é irreversível e a numeração dos próximos clientes será ajustada para não deixar buracos na sequência.\`"
);

fs.writeFileSync('src/pages/ClienteDetalhes.tsx', code);
