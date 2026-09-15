const fs = require('fs');
let code = fs.readFileSync('src/pages/Listas.tsx', 'utf8');

// Replace the loadData mapping logic
code = code.replace(
  /const listasMapped = allListas\.map\([\s\S]*?\}\);\s*setListas\(listasMapped\);/,
  `const listasMapped = allListas.map(lista => {
        let qtd = 0;
        if (lista.clienteIds) {
          qtd = lista.clienteIds.length;
        } else if (lista.filtros) {
          // fallback to legacy dynamic
          let matches = allClientes;
          const f = lista.filtros;
          if (f.produtoId) {
            const cat = allCatalog.find(c => c.id === f.produtoId);
            if (cat) {
              const productClients = new Set(
                allProdVendidos
                  .filter(pv => cat.codigosProduto.includes(pv.codigoProduto))
                  .map(pv => pv.clienteId)
              );
              matches = matches.filter(c => productClients.has(c.email));
            } else {
              matches = [];
            }
          }
          if (f.dataInicio) matches = matches.filter(c => c.dataPrimeiraCompra >= f.dataInicio!);
          if (f.dataFim) matches = matches.filter(c => c.dataPrimeiraCompra <= f.dataFim!);
          if (f.estaNoGrupo !== undefined && f.estaNoGrupo !== null) matches = matches.filter(c => c.estaNoGrupo === f.estaNoGrupo);
          if (f.etiqueta) matches = matches.filter(c => c.etiquetas?.includes(f.etiqueta!));
          qtd = matches.length;
        }
        
        return {
          ...lista,
          qtdClientes: qtd
        };
      });
      setListas(listasMapped);`
);

// Replace getFilterText
code = code.replace(
  /const getFilterText = \(lista: ListaSalva\) => \{[\s\S]*?return parts\.join\(' \| '\) \|\| 'Sem filtros';\n  \};/,
  `const getFilterText = (lista: ListaSalva) => {
    if (lista.clienteIds) {
      return "Lista Estática (Seleção Manual)";
    }
    const parts = [];
    const f = lista.filtros;
    if (!f) return 'Sem filtros';
    if (f.produtoId) {
      const cat = catalog.find(c => c.id === f.produtoId);
      parts.push(\`Produto: \${cat ? cat.nomeOficial : 'Desconhecido'}\`);
    }
    if (f.dataInicio || f.dataFim) parts.push(\`Período definido\`);
    if (f.estaNoGrupo !== undefined && f.estaNoGrupo !== null) parts.push(\`WhatsApp: \${f.estaNoGrupo ? 'Sim' : 'Não'}\`);
    if (f.etiqueta) parts.push(\`Etiqueta: \${f.etiqueta}\`);
    return parts.join(' | ') || 'Sem filtros';
  };`
);

// Replace openList navigation
code = code.replace(
  /const openList = \(lista: ListaSalva\) => \{[\s\S]*?navigate\(\`\/clientes\?\$\{\params\.toString\(\)\}\`\);\n  \};/,
  `const openList = (lista: ListaSalva) => {
    const params = new URLSearchParams();
    if (lista.clienteIds) {
      params.set('listaId', lista.id);
    } else if (lista.filtros) {
      if (lista.filtros.produtoId) params.set('produtoId', lista.filtros.produtoId);
      if (lista.filtros.dataInicio) params.set('dataInicio', lista.filtros.dataInicio.toString());
      if (lista.filtros.dataFim) params.set('dataFim', lista.filtros.dataFim.toString());
      if (lista.filtros.estaNoGrupo !== undefined && lista.filtros.estaNoGrupo !== null) params.set('grupo', lista.filtros.estaNoGrupo.toString());
      if (lista.filtros.etiqueta) params.set('etiqueta', lista.filtros.etiqueta);
    }
    navigate(\`/clientes?\${params.toString()}\`);
  };`
);

fs.writeFileSync('src/pages/Listas.tsx', code);
