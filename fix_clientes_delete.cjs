const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const oldFunc = `  const handleBulkAction = async (action: 'add_grupo' | 'remove_grupo' | 'add_tag' | 'delete') => {
    if (selectedEmails.size === 0) return;
    if (action === 'add_tag') {
      setShowBulkTagModal(true);
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
      loadPage(currentPage); // Reload current page
      setSelectedEmails(new Set());
    } catch(e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };`;

const newFunc = `  const handleBulkAction = async (action: 'add_grupo' | 'remove_grupo' | 'add_tag' | 'delete') => {
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

s = s.replace(oldFunc, newFunc);
fs.writeFileSync('src/pages/Clientes.tsx', s);
