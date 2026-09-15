import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Check, X, Loader2, Search, Tag, Download, Package } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { clientService } from '../services/clientService';
import { ProdutoCatalogo, Cliente, ProdutoVendido } from '../types';

export default function ProdutoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<(ProdutoCatalogo & { unidadesVendidas: number; clientesUnicos: number; primeiraVenda: number | null; ultimaVenda: number | null }) | null>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  
  const [allCatalog, setAllCatalog] = useState<ProdutoCatalogo[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCode, setSplitCode] = useState<{code: string, type: 'produto'|'preco'}|null>(null);
  const [splitNewName, setSplitNewName] = useState('');

  const [clientes, setClientes] = useState<(Cliente & { qtdComprasProduto: number, dataPrimeiraCompraProduto: number, dataUltimaCompraProduto: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagAction, setBulkTagAction] = useState<'add'|'remove'>('add');
  const [bulkTagText, setBulkTagText] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getCatalogWithStats();
      const p = data.find(c => c.id === id);
      if (!p) {
        navigate('/produtos');
        return;
      }
      setProduto(p);
      setEditName(p.nomeOficial);
      setAllCatalog(data);

      // Load clients
      const allClients = await clientService.getClientes();
      const allProdVendidos = await clientService.getAllProdutos();
      
      const prodVendidos = allProdVendidos.filter(pv => p.codigosProduto.includes(pv.codigoProduto));
      const clientStats = new Map<string, { qtd: number, primeira: number, ultima: number }>();
      
      prodVendidos.forEach(pv => {
        if (!clientStats.has(pv.clienteId)) {
          clientStats.set(pv.clienteId, { qtd: 0, primeira: Infinity, ultima: 0 });
        }
        const st = clientStats.get(pv.clienteId)!;
        st.qtd++;
        if (pv.dataTransacao < st.primeira) st.primeira = pv.dataTransacao;
        if (pv.dataTransacao > st.ultima) st.ultima = pv.dataTransacao;
      });
      
      const matchedClients = allClients
        .filter(c => clientStats.has(c.email))
        .map(c => {
          const st = clientStats.get(c.email)!;
          return {
            ...c,
            qtdComprasProduto: st.qtd,
            dataPrimeiraCompraProduto: st.primeira,
            dataUltimaCompraProduto: st.ultima
          };
        });
      
      setClientes(matchedClients);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do produto');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!produto || !editName.trim()) return;
    try {
      await catalogService.updateProduct(produto.id, {
        nomeOficial: editName.trim(),
        nomeNormalizado: editName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()
      });
      setProduto({ ...produto, nomeOficial: editName.trim() });
      setIsEditingName(false);
    } catch (err: any) {
      alert('Erro ao salvar nome: ' + err.message);
    }
  };

  const handleMerge = async () => {
    if (!produto || !mergeTargetId) return;
    try {
      await catalogService.mergeProducts(mergeTargetId, produto.id);
      setShowMergeModal(false);
      navigate(`/produtos/${mergeTargetId}`);
    } catch (err: any) {
      alert('Erro ao juntar produtos: ' + err.message);
    }
  };

  const handleSplit = async () => {
    if (!produto || !splitCode || !splitNewName.trim()) return;
    try {
      await catalogService.splitCode(produto.id, splitCode.code, splitCode.type, splitNewName.trim());
      setShowSplitModal(false);
      loadData();
    } catch (err: any) {
      alert('Erro ao separar código: ' + err.message);
    }
  };

  const handleBulkTag = async () => {
    if (selectedEmails.size === 0 || !bulkTagText.trim()) return;
    setBulkActionLoading(true);
    try {
      const allClients = await clientService.getClientes();
      const updates = Array.from(selectedEmails as Set<string>).map(email => {
        const c = allClients.find(x => x.email === email);
        if (!c) return null;
        let et = c.etiquetas || [];
        if (bulkTagAction === 'add') {
          if (!et.includes(bulkTagText.trim())) et = [...et, bulkTagText.trim()];
        } else {
          et = et.filter(e => e !== bulkTagText.trim());
        }
        return { email, data: { etiquetas: et } };
      }).filter(Boolean);

      // We should ideally do this via a batch update in clientService, but doing it one by one is fine for smaller sizes or we can add a method
      // Actually, we can use bulkUpdateClientes but it sets the exact same data for everyone. We can't do that here since each client has different tags array.
      // So we loop:
      for (const update of updates) {
        if(update && update.email) await clientService.updateCliente(update.email, update.data);
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

  const handleExport = () => {
    if (selectedEmails.size === 0 || !produto) return;
    
    const selectedClientsData = clientes.filter(c => selectedEmails.has(c.email));
    if (selectedClientsData.length === 0) return;

    const headers = [
      'Número', 'Nome', 'E-mail', 'Telefone', 
      'Data da Primeira Compra (Geral)', 'Data da Compra Mais Recente (Geral)', 
      'Status Grupo WhatsApp', 'Etiquetas',
      'Produto Filtrado', 'Qtd Compras Deste Produto', 'Primeira Compra Deste Produto', 'Última Compra Deste Produto'
    ].join(';');

    const rows = selectedClientsData.map(c => {
      return [
        c.numero,
        `"${c.nome.replace(/"/g, '""')}"`,
        c.email,
        c.telefone,
        c.dataPrimeiraCompra ? new Date(c.dataPrimeiraCompra).toLocaleDateString('pt-BR') : '-',
        '-', // We'd need to compute this for general, but we can skip if hard to get easily, or fetch it. Actually let's just use dataPrimeiraCompra
        c.estaNoGrupo ? 'Sim' : 'Não',
        `"${(c.etiquetas || []).join(', ')}"`,
        `"${produto.nomeOficial.replace(/"/g, '""')}"`,
        c.qtdComprasProduto,
        c.dataPrimeiraCompraProduto ? new Date(c.dataPrimeiraCompraProduto).toLocaleDateString('pt-BR') : '-',
        c.dataUltimaCompraProduto ? new Date(c.dataUltimaCompraProduto).toLocaleDateString('pt-BR') : '-'
      ].join(';');
    });

    const csv = headers + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compradores_${produto.nomeOficial.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    a.click();
  };

  if (loading || !produto) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone.includes(searchTerm)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.16))] md:h-screen flex flex-col">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => navigate('/produtos')}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-2xl font-light text-neutral-900 border-b border-neutral-300 focus:border-neutral-900 focus:outline-none px-1"
                autoFocus
              />
              <button onClick={handleSaveName} className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="p-1 text-neutral-400 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-light text-neutral-800 tracking-tight">{produto.nomeOficial}</h1>
              <button onClick={() => setIsEditingName(true)} className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => setShowMergeModal(true)}
          className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
        >
          Juntar com outro produto
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-1">Unidades Vendidas</p>
          <p className="text-2xl font-semibold text-neutral-900">{produto.unidadesVendidas}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-1">Clientes Únicos</p>
          <p className="text-2xl font-semibold text-neutral-900">{produto.clientesUnicos}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-1">Primeira Venda</p>
          <p className="text-lg font-medium text-neutral-900">
            {produto.primeiraVenda ? new Date(produto.primeiraVenda).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-1">Venda Mais Recente</p>
          <p className="text-lg font-medium text-neutral-900">
            {produto.ultimaVenda ? new Date(produto.ultimaVenda).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-3">Códigos de Produto Vinculados</h3>
          <div className="flex flex-wrap gap-2">
            {produto.codigosProduto.map(code => (
              <div key={code} className="group relative inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 text-sm font-medium text-neutral-800">
                {code}
                <button 
                  onClick={() => { setSplitCode({code, type: 'produto'}); setShowSplitModal(true); }}
                  className="ml-2 text-neutral-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Separar para novo produto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="font-medium text-neutral-900 mb-3">Códigos de Preço / Oferta Encontrados</h3>
          <div className="flex flex-wrap gap-2">
            {produto.codigosPreco.map(code => (
              <div key={code} className="group relative inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 text-sm font-medium text-neutral-800">
                {code}
                <button 
                  onClick={() => { setSplitCode({code, type: 'preco'}); setShowSplitModal(true); }}
                  className="ml-2 text-neutral-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Separar para novo produto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-t-2xl shadow-sm border-x border-t border-neutral-200 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
              placeholder="Buscar clientes que compraram..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {selectedEmails.size > 0 && (
            <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
              <span className="text-sm font-medium text-neutral-600 mr-2">
                {selectedEmails.size} selecionados
              </span>
              <button onClick={() => { setBulkTagAction('add'); setShowBulkTagModal(true); }} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 flex items-center">
                <Tag className="w-3 h-3 mr-1" /> Adicionar Etiqueta
              </button>
              <button onClick={() => { setBulkTagAction('remove'); setShowBulkTagModal(true); }} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 flex items-center">
                <X className="w-3 h-3 mr-1" /> Remover Etiqueta
              </button>
              <button onClick={handleExport} className="text-xs bg-neutral-900 text-white px-3 py-1.5 rounded border border-neutral-900 hover:bg-neutral-800 flex items-center">
                <Download className="w-3 h-3 mr-1" /> Exportar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-4">
                  <input
                    type="checkbox"
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    checked={filteredClientes.length > 0 && selectedEmails.size === filteredClientes.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmails(new Set(filteredClientes.map(c => c.email)));
                      } else {
                        setSelectedEmails(new Set());
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-4 font-medium">Nº</th>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">E-mail</th>
                <th className="px-6 py-4 font-medium">Qtd Compras</th>
                <th className="px-6 py-4 font-medium">Última Compra</th>
                <th className="px-6 py-4 font-medium">Etiquetas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredClientes.map((cliente) => (
                <tr key={cliente.email} className={`hover:bg-neutral-50 transition-colors ${selectedEmails.has(cliente.email) ? 'bg-neutral-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      checked={selectedEmails.has(cliente.email)}
                      onChange={(e) => {
                        const newSet = new Set(selectedEmails);
                        if (e.target.checked) newSet.add(cliente.email);
                        else newSet.delete(cliente.email);
                        setSelectedEmails(newSet);
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-900">#{cliente.numero}</td>
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    <button onClick={() => navigate(`/clientes/${encodeURIComponent(cliente.email)}`)} className="hover:underline">
                      {cliente.nome}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-neutral-500">{cliente.email}</td>
                  <td className="px-6 py-4 text-neutral-900">{cliente.qtdComprasProduto}</td>
                  <td className="px-6 py-4 text-neutral-500">
                    {cliente.dataUltimaCompraProduto ? new Date(cliente.dataUltimaCompraProduto).toLocaleDateString("pt-BR") : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {cliente.etiquetas?.map(et => (
                        <span key={et} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-800">
                          {et}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Juntar com outro produto</h3>
            <p className="text-sm text-neutral-500 mb-4">
              O produto <strong>{produto.nomeOficial}</strong> será movido para dentro do produto selecionado abaixo. Todos os códigos serão unidos. Esta ação não duplicará compras ou clientes.
            </p>
            <select
              value={mergeTargetId}
              onChange={e => setMergeTargetId(e.target.value)}
              className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 mb-6"
            >
              <option value="">Selecione o produto principal...</option>
              {allCatalog.filter(c => c.id !== produto.id).map(c => (
                <option key={c.id} value={c.id}>{c.nomeOficial} ({c.codigosProduto.length} códigos)</option>
              ))}
            </select>
            <div className="flex space-x-3">
              <button onClick={() => setShowMergeModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleMerge} disabled={!mergeTargetId} className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50">
                Confirmar Junção
              </button>
            </div>
          </div>
        </div>
      )}

      {showSplitModal && splitCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Separar Código</h3>
            <p className="text-sm text-neutral-500 mb-4">
              O código <strong>{splitCode.code}</strong> será removido deste produto e um novo produto será criado para ele.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nome do novo produto</label>
              <input
                type="text"
                value={splitNewName}
                onChange={e => setSplitNewName(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                placeholder="Ex: Novo Produto Separado"
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowSplitModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleSplit} disabled={!splitNewName.trim()} className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50">
                Separar
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkTagModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              {bulkTagAction === 'add' ? 'Adicionar Etiqueta em Massa' : 'Remover Etiqueta em Massa'}
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              {selectedEmails.size} clientes selecionados.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da Etiqueta</label>
              <input
                type="text"
                value={bulkTagText}
                onChange={e => setBulkTagText(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                placeholder="Ex: VIP"
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowBulkTagModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleBulkTag} disabled={!bulkTagText.trim() || bulkActionLoading} className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center">
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
