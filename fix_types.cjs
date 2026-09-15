const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "filtros: {\n    produtoId?: string;\n    dataInicio?: number;\n    dataFim?: number;\n    estaNoGrupo?: boolean | null;\n    etiqueta?: string;\n  };",
  "clienteIds: string[];\n  // Legacy filter compatibility\n  filtros?: {\n    produtoId?: string;\n    dataInicio?: number;\n    dataFim?: number;\n    estaNoGrupo?: boolean | null;\n    etiqueta?: string;\n  };"
);

fs.writeFileSync('src/types.ts', code);
