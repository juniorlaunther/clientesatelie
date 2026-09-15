import fs from 'fs';

let dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
dashboard = dashboard.replace('{new Date(stats.dataUltimaAtualizacao).toLocaleString()}', '{stats.dataUltimaAtualizacao ? new Date(stats.dataUltimaAtualizacao).toLocaleString() : "Nunca"}');
fs.writeFileSync('src/pages/Dashboard.tsx', dashboard);

let importar = fs.readFileSync('src/pages/Importar.tsx', 'utf8');
importar = importar.replace('{new Date(lastImport.data).toLocaleString(\'pt-BR\')}', '{lastImport.data ? new Date(lastImport.data).toLocaleString(\'pt-BR\') : "-"}');
fs.writeFileSync('src/pages/Importar.tsx', importar);

let clientes = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');
clientes = clientes.replace(/{format\(new Date\(c.dataPrimeiraCompra\), 'dd\/MM\/yyyy'\)}/g, '{c.dataPrimeiraCompra ? format(new Date(c.dataPrimeiraCompra), "dd/MM/yyyy") : "-"}');
clientes = clientes.replace(/{c.dataUltimaCompra \? format\(new Date\(c.dataUltimaCompra\), 'dd\/MM\/yyyy'\) : '-'}/g, '{c.dataUltimaCompra ? format(new Date(c.dataUltimaCompra), "dd/MM/yyyy") : "-"}');
fs.writeFileSync('src/pages/Clientes.tsx', clientes);

let produtoDetalhes = fs.readFileSync('src/pages/ProdutoDetalhes.tsx', 'utf8');
produtoDetalhes = produtoDetalhes.replace(/{new Date\(cliente.dataUltimaCompraProduto\).toLocaleDateString\('pt-BR'\)}/g, '{cliente.dataUltimaCompraProduto ? new Date(cliente.dataUltimaCompraProduto).toLocaleDateString("pt-BR") : "-"}');
fs.writeFileSync('src/pages/ProdutoDetalhes.tsx', produtoDetalhes);

let presentes = fs.readFileSync('src/pages/Presentes.tsx', 'utf8');
presentes = presentes.replace(/{new Date\(cli.dataPrimeiraCompra\).toLocaleDateString\('pt-BR'\)}/g, '{cli.dataPrimeiraCompra ? new Date(cli.dataPrimeiraCompra).toLocaleDateString("pt-BR") : "-"}');
fs.writeFileSync('src/pages/Presentes.tsx', presentes);
