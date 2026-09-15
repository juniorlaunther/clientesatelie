const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// Replace handleBulkAction
code = code.replace(
  /const handleBulkAction = async \([\s\S]*?\}\s*\};/m,
  `const handleBulkAction = async (action: 'toggle_grupo' | 'toggle_destaque' | 'delete') => {
    if (selectedEmails.size === 0) return;
    
    if (action === 'delete') {
      setShowConfirmBulkDelete(true);
      return;
    }

    setBulkActionLoading(true);
    try {
      const selected = clientes.filter(c => selectedEmails.has(c.email));
      
      const promises = selected.map(async (cliente) => {
        if (action === 'toggle_grupo') {
          const allInGroup = selected.every(c => c.estaNoGrupo);
          await clientService.updateCliente(cliente.email, { estaNoGrupo: !allInGroup });
        } else if (action === 'toggle_destaque') {
          const allDestaque = selected.every(c => c.destaqueManual);
          await clientService.updateCliente(cliente.email, { destaqueManual: !allDestaque });
        }
      });

      await Promise.all(promises);
      await loadData();
      if (action !== 'delete') {
        setSelectedEmails(new Set());
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };`
);

// Replace the UI for the bulk action bar
code = code.replace(
  /\{selectedEmails\.size > 0 && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
  `{selectedEmails.size > 0 && (
        <div className="bg-purple-50 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 mb-4 flex-shrink-0 border border-purple-100">
          <span className="text-purple-800 font-medium">{selectedEmails.size} cliente(s) selecionado(s)</span>
          <div className="flex flex-wrap gap-2">
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('toggle_grupo')} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Alternar Grupo (WP)</button>
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('toggle_destaque')} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Alternar Destaque</button>
            <button disabled={bulkActionLoading} onClick={() => setShowAddToListModal(true)} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Salvar em Lista</button>
            
            <div className="relative group inline-block">
              <button disabled={bulkActionLoading} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Etiquetas ▾</button>
              <div className="absolute bottom-full left-0 mb-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                <button onClick={() => { setBulkTagAction('add'); setShowBulkTagModal(true); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Adicionar...</button>
                <button onClick={() => { setBulkTagAction('remove'); setShowBulkTagModal(true); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Remover...</button>
              </div>
            </div>

            <button disabled={bulkActionLoading} onClick={handleExportSelected} className="text-xs bg-neutral-900 text-white px-3 py-1.5 rounded border border-neutral-900 hover:bg-neutral-800 disabled:opacity-50">Exportar Selecionados</button>
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('delete')} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded border border-red-200 hover:bg-red-100 disabled:opacity-50">Excluir</button>
          </div>
        </div>
      )}`
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
