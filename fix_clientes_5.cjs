const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const handlers = `
  const handleSaveList = async () => {
    if (!listName.trim()) return;
    try {
      const novaLista = {
        id: \`LIST-\${Date.now()}\`,
        nome: listName.trim(),
        filtros: {
          produtoId: produtoFilter || undefined,
          estaNoGrupo: whatsappFilter === 'in' ? true : whatsappFilter === 'out' ? false : undefined,
          etiqueta: undefined // Se quisermos add etiqueta depois, ou busca
        },
        criadoEm: Date.now()
      };
      await listaService.createLista(novaLista);
      setShowSaveListModal(false);
      setListName('');
      alert('Lista salva com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar lista: ' + err.message);
    }
  };

  const handleBulkTag = async () => {
    if (selectedEmails.size === 0 || !bulkTagText.trim()) return;
    setBulkActionLoading(true);
    try {
      for (const email of Array.from(selectedEmails)) {
        const c = clientes.find(x => x.email === email);
        if (c) {
          let et = c.etiquetas || [];
          if (bulkTagAction === 'add') {
            if (!et.includes(bulkTagText.trim())) et = [...et, bulkTagText.trim()];
          } else {
            et = et.filter(e => e !== bulkTagText.trim());
          }
          await clientService.updateCliente(email, { etiquetas: et });
        }
      }
      setShowBulkTagModal(false);
      setSelectedEmails(new Set());
      loadData();
    } catch (err: any) {
      alert('Erro na ação em massa: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedEmails.size === 0) return;
    const selectedClientsData = filteredClientes.filter(c => selectedEmails.has(c.email));
    
    const headers = [
      'Número', 'Nome', 'E-mail', 'Telefone', 
      'Data da Primeira Compra', 'Data da Compra Mais Recente', 
      'Quantidade de Compras', 'Quantidade de Produtos Adquiridos',
      'Nomes dos Produtos Adquiridos',
      'Situação no WhatsApp', 'Etiquetas'
    ].join(';');

    const rows = selectedClientsData.map(c => {
      const ultima = c._produtos.length > 0 ? Math.max(...c._produtos.map(p => p.dataTransacao)) : 0;
      const nomesProds = Array.from(new Set(c._produtos.map(p => p.nomeProduto))).join(', ');
      
      return [
        c.numero,
        \`"\${c.nome.replace(/"/g, '""')}"\`,
        c.email,
        c.telefone,
        new Date(c.dataPrimeiraCompra).toLocaleDateString('pt-BR'),
        ultima ? new Date(ultima).toLocaleDateString('pt-BR') : '-',
        c.totalCompras,
        c._produtos.length,
        \`"\${nomesProds.replace(/"/g, '""')}"\`,
        c.estaNoGrupo ? 'Sim' : 'Não',
        \`"\${(c.etiquetas || []).join(', ')}"\`
      ].join(';');
    });

    const csv = headers + '\\n' + rows.join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`clientes_selecionados.csv\`;
    a.click();
  };
`;

code = code.replace(
  "const handleAddCliente = async () => {",
  handlers + "\n\n  const handleAddCliente = async () => {"
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
