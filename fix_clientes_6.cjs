const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const newUI = `
          <select 
            value={produtoFilter}
            onChange={(e) => setProdutoFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm max-w-[200px]"
          >
            <option value="">Produto: Todos</option>
            {catalog.map(c => (
              <option key={c.id} value={c.id}>{c.nomeOficial}</option>
            ))}
          </select>
          <select 
            value={whatsappFilter}
`;

code = code.replace(
  /<select \s*value=\{whatsappFilter\}/,
  newUI.trim()
);

code = code.replace(
  /<div className="flex flex-col md:flex-row md:items-end justify-between mb-6 space-y-4 md:space-y-0 flex-shrink-0">/,
  `<div className="flex flex-col md:flex-row md:items-end justify-between mb-6 space-y-4 md:space-y-0 flex-shrink-0">`
);

code = code.replace(
  /<button \s*onClick=\{\(\) => setShowAddModal\(true\)\}/,
  `<button onClick={() => setShowSaveListModal(true)} className="bg-white border border-neutral-200 text-neutral-700 px-5 py-2.5 rounded-lg font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2 mr-3">
            <span>Salvar como Lista</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}`
);

code = code.replace(
  /<button disabled=\{bulkActionLoading\} onClick=\{\(\) => handleBulkAction\('delete'\)\}/,
  `<button disabled={bulkActionLoading} onClick={() => { setBulkTagAction('add'); setShowBulkTagModal(true); }} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Adicionar Etiqueta</button>
            <button disabled={bulkActionLoading} onClick={() => { setBulkTagAction('remove'); setShowBulkTagModal(true); }} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Remover Etiqueta</button>
            <button disabled={bulkActionLoading} onClick={handleExportSelected} className="text-xs bg-neutral-900 text-white px-3 py-1.5 rounded border border-neutral-900 hover:bg-neutral-800 disabled:opacity-50">Exportar Selecionados</button>
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('delete')}`
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
