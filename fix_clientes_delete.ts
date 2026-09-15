import fs from 'fs';
let content = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

if (!content.includes("'delete'")) {
    const handleBulkActionRegex = /const handleBulkAction = async \(action: 'add_grupo' \| 'remove_grupo' \| 'add_tag'\) => \{/;
    content = content.replace(handleBulkActionRegex, "const handleBulkAction = async (action: 'add_grupo' | 'remove_grupo' | 'add_tag' | 'delete') => {");

    const deleteLogic = `
    if (action === 'delete') {
      if (!window.confirm(\`Tem certeza que deseja excluir \${emailsArray.length} cliente(s)? Esta ação também excluirá as compras relacionadas.\`)) return;
      try {
        await clientService.bulkDeleteClientes(emailsArray);
        setSelectedEmails(new Set());
        alert('Clientes excluídos com sucesso!');
        await loadData(true);
      } catch (e) {
        console.error(e);
        alert('Erro ao excluir clientes');
      }
      setBulkActionLoading(false);
      return;
    }
    `;
    
    content = content.replace(/setBulkActionLoading\(true\);\n\s*const emailsArray = Array\.from\(selectedEmails\);/, "setBulkActionLoading(true);\n    const emailsArray = Array.from(selectedEmails);\n" + deleteLogic);

    const deleteButton = `
              <button 
                onClick={() => handleBulkAction('delete')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Excluir Selecionados
              </button>
    `;
    
    content = content.replace(/<button \n\s*onClick=\{handleExportSelected\}/, deleteButton + "\n              <button \n                onClick={handleExportSelected}");
    
    fs.writeFileSync('src/pages/Clientes.tsx', content);
}
