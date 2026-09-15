const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// Add state
s = s.replace(
  /const \[bulkTagText, setBulkTagText\] = useState\(''\);/,
  "const [bulkTagText, setBulkTagText] = useState('');\n  const [confirmDelete, setConfirmDelete] = useState<{ type: 'single' | 'bulk', email?: string } | null>(null);"
);

// Replace handleDeleteCliente
const oldHandleDeleteCliente = `  const handleDeleteCliente = async (email: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este cliente e seu histórico de compras?')) {
      return;
    }
    setLoading(true);
    try {
      await clientService.bulkDeleteClientes([email]);
      // Remove local and reset
      loadPage(currentPage);
    } catch (e: any) {
      alert('Erro: ' + e.message);
      setLoading(false);
    }
  };`;

const newHandleDeleteCliente = `  const handleDeleteCliente = (email: string) => {
    setConfirmDelete({ type: 'single', email });
  };`;
s = s.replace(oldHandleDeleteCliente, newHandleDeleteCliente);

// Replace handleBulkAction
const oldHandleBulkAction = `  const handleBulkAction = async (action: 'add_grupo' | 'remove_grupo' | 'add_tag' | 'delete') => {
    if (selectedEmails.size === 0) return;
    if (action === 'add_tag') {
      setShowBulkTagModal(true);
      return;
    }
    if (action === 'delete') {
      if (!confirm(\`Tem certeza que deseja excluir \${selectedEmails.size} cliente(s)?\\n\\nIsso apagará permanentemente o cliente e o seu histórico de compras.\`)) {
        return;
      }
    }
    setBulkActionLoading(true);
    try {
      if (action === 'delete') {
        const emailsArray = Array.from(selectedEmails);
        await clientService.bulkDeleteClientes(emailsArray);
        // Reset to first page to avoid empty view if deleting all on last page
        setCurrentPage(0);
        loadPage(0);
      } else {
        const selected = clientes.filter(c => selectedEmails.has(c.email));
        const promises = selected.map(async (cliente) => {
          if (action === 'add_grupo') {
            await clientService.updateCliente(cliente.email, { estaNoGrupo: true });
          } else if (action === 'remove_grupo') {
            await clientService.updateCliente(cliente.email, { estaNoGrupo: false });
          }
        });
        await Promise.all(promises);
        loadPage(currentPage);
      }
      setSelectedEmails(new Set());
    } catch(e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };`;

const newHandleBulkAction = `  const handleBulkAction = async (action: 'add_grupo' | 'remove_grupo' | 'add_tag' | 'delete') => {
    if (selectedEmails.size === 0) return;
    if (action === 'add_tag') {
      setShowBulkTagModal(true);
      return;
    }
    if (action === 'delete') {
      setConfirmDelete({ type: 'bulk' });
      return;
    }
    
    setBulkActionLoading(true);
    try {
      const selected = clientes.filter(c => selectedEmails.has(c.email));
      const promises = selected.map(async (cliente) => {
        if (action === 'add_grupo') {
          await clientService.updateCliente(cliente.email, { estaNoGrupo: true });
        } else if (action === 'remove_grupo') {
          await clientService.updateCliente(cliente.email, { estaNoGrupo: false });
        }
      });
      await Promise.all(promises);
      loadPage(currentPage);
      setSelectedEmails(new Set());
    } catch(e: any) {
      setError('Erro: ' + e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    
    if (confirmDelete.type === 'single' && confirmDelete.email) {
      setLoading(true);
      try {
        await clientService.bulkDeleteClientes([confirmDelete.email]);
        setConfirmDelete(null);
        loadPage(currentPage);
      } catch (e: any) {
        setError('Erro ao excluir: ' + e.message);
        setLoading(false);
        setConfirmDelete(null);
      }
    } else if (confirmDelete.type === 'bulk') {
      setBulkActionLoading(true);
      try {
        const emailsArray = Array.from(selectedEmails);
        await clientService.bulkDeleteClientes(emailsArray);
        setCurrentPage(0);
        setConfirmDelete(null);
        setSelectedEmails(new Set());
        loadPage(0, true);
      } catch (e: any) {
        setError('Erro ao excluir: ' + e.message);
      } finally {
        setBulkActionLoading(false);
      }
    }
  };`;
s = s.replace(oldHandleBulkAction, newHandleBulkAction);

// Add Modal JSX right before the end of the return statement
const modalJsx = `
      {confirmDelete && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {confirmDelete.type === 'bulk' ? 'Excluir Selecionados' : 'Excluir Cliente'}
            </h3>
            <p className="text-neutral-500 text-sm mb-6">
              {confirmDelete.type === 'bulk' 
                ? \`Tem certeza que deseja excluir \${selectedEmails.size} cliente(s)? Esta ação apagará permanentemente o(s) cliente(s) e o histórico de compras e reajustará a numeração.\`
                : 'Tem certeza que deseja excluir este cliente? Esta ação apagará permanentemente o cliente e o histórico de compras e reajustará a numeração.'}
            </p>
            <div className="flex w-full space-x-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                disabled={bulkActionLoading || loading}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                disabled={bulkActionLoading || loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {(bulkActionLoading && confirmDelete.type === 'bulk') || (loading && confirmDelete.type === 'single') ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
s = s.replace(/    <\/div>\n  \);\n\}$/, modalJsx);

fs.writeFileSync('src/pages/Clientes.tsx', s);
