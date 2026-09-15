import React, { useState, useEffect, useRef } from 'react';
import { clientService } from '../services/clientService';
import { Cliente } from '../types';
import { Loader2, Search, Plus, Filter, MessageCircle, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingBag, Package, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Clientes() {
  const navigate = useNavigate();
  const { catalog, estatisticas, loadEstatisticas } = useStore();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [indexErrorLink, setIndexErrorLink] = useState('');
  const [searchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [whatsappFilter, setWhatsappFilter] = useState<'all' | 'in' | 'out'>(searchParams.get('grupo') === 'true' ? 'in' : searchParams.get('grupo') === 'false' ? 'out' : 'all');
  const [produtoFilter, setProdutoFilter] = useState<string>(searchParams.get('produtoId') || '');
  
  // Sorting & Pagination
  const [sortField, setSortField] = useState<'numero' | 'nome' | 'primeiraCompra' | 'ultimaCompra' | 'totalCompras' | 'totalProdutos'>('numero');
  const [sortDesc, setSortDesc] = useState(true);
  const [pageDocs, setPageDocs] = useState<any[]>([]); // array of last documents per page
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  // Selections
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagAction, setBulkTagAction] = useState<'add'|'remove'>('add');
  const [bulkTagText, setBulkTagText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'single' | 'bulk', email?: string } | null>(null);

  useEffect(() => {
    loadEstatisticas();
  }, [loadEstatisticas]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    // Reset pagination when filters or sort change
    setCurrentPage(0);
    setPageDocs([]);
    loadPage(0, true);
  }, [debouncedSearch, whatsappFilter, produtoFilter, sortField, sortDesc]);

  
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (email: string) => {
    touchTimer.current = setTimeout(() => {
      toggleSelect(email);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const isSelectionMode = selectedEmails.size > 0;

  const loadPage = async (pageIndex: number, reset = false) => {
    setLoading(true);
    try {
      const isNext = pageIndex > currentPage;
      const lastDoc = reset ? undefined : (isNext ? pageDocs[currentPage] : pageDocs[pageIndex - 1]);
      
      const filters = {
        whatsapp: whatsappFilter !== 'all' ? whatsappFilter : undefined,
        produtoId: produtoFilter || undefined,
        search: debouncedSearch || undefined
      };

      const result = await clientService.getClientesPaginated(
        PAGE_SIZE, 
        lastDoc,
        filters,
        sortField,
        sortDesc
      );

      setClientes(result.data);
      setHasMore(result.data.length === PAGE_SIZE);

      if (isNext && result.lastDoc) {
        setPageDocs(prev => {
          const next = [...prev];
          next[pageIndex] = result.lastDoc;
          return next;
        });
      }
      
      setCurrentPage(pageIndex);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar clientes. Note que algumas combinações de ordenação e filtros requerem índices no Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore) loadPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) loadPage(currentPage - 1);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const toggleSelect = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  const toggleAll = () => {
    if (selectedEmails.size === clientes.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(clientes.map(c => c.email)));
    }
  };

  const handleDeleteCliente = (email: string) => {
    setConfirmDelete({ type: 'single', email });
  };

  const handleBulkAction = async (action: 'add_grupo' | 'remove_grupo' | 'add_tag' | 'delete') => {
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
  };

  
  const handleExportSelected = () => {
    if (selectedEmails.size === 0) return;
    const selectedClientsData = clientes.filter(c => selectedEmails.has(c.email));
    
    const headers = ['Número', 'Nome', 'E-mail', 'Telefone', 'Primeira Compra', 'Última Compra', 'Total Compras', 'Total Produtos', 'WhatsApp'];
    const csvContent = [
      headers.join(','),
      ...selectedClientsData.map(c => [
        c.numero,
        `"${c.nome}"`,
        c.emailOriginal,
        c.telefoneOriginal || '',
        c.dataPrimeiraCompra ? new Date(c.dataPrimeiraCompra).toLocaleDateString('pt-BR') : '',
        c.dataUltimaCompra ? new Date(c.dataUltimaCompra).toLocaleDateString('pt-BR') : '',
        c.quantidadeCompras || 0,
        c.quantidadeProdutos || 0,
        c.estaNoGrupo ? 'Sim' : 'Não'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `exportacao_clientes_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleBulkTag = async () => {
    if (!bulkTagText.trim()) return;
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedEmails).map(async (email: string) => {
        const cliente = clientes.find(c => c.email === email);
        if (!cliente) return;
        let tags = cliente.etiquetas || [];
        if (bulkTagAction === 'add' && !tags.includes(bulkTagText.trim())) {
          tags.push(bulkTagText.trim());
        } else if (bulkTagAction === 'remove') {
          tags = tags.filter(t => t !== bulkTagText.trim());
        }
        await clientService.updateCliente(email, { etiquetas: tags });
      });
      await Promise.all(promises);
      loadPage(currentPage);
      setShowBulkTagModal(false);
      setBulkTagText('');
    } catch(e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-neutral-300 group-hover:text-neutral-400" />;
    return <ArrowUpDown className={`w-3 h-3 ml-1 ${sortDesc ? 'text-purple-600' : 'text-purple-600 rotate-180 transform'}`} />;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 space-y-4 md:space-y-0 flex-shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-neutral-800 tracking-tight">Clientes</h1>
          <p className="text-neutral-500 mt-1">
            Exibindo página {currentPage + 1} • {estatisticas?.totalClientes || 0} no total
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link to="/importar" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Importar CSV
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-sm"
              placeholder="Buscar (min. 3 letras)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 min-w-max">
            <Filter className="w-5 h-5 text-neutral-400" />
            <select 
              value={produtoFilter}
              onChange={(e) => setProdutoFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm max-w-[200px]"
            >
              <option value="">Produto: Todos</option>
              {catalog?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nomeOficial}</option>
              ))}
            </select>
            <select 
              value={whatsappFilter}
              onChange={(e) => setWhatsappFilter(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm"
            >
              <option value="all">WhatsApp: Todos</option>
              <option value="in">No Grupo</option>
              <option value="out">Fora do Grupo</option>
            </select>
          </div>
        </div>

        {selectedEmails.size > 0 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
            <span className="text-sm font-medium text-purple-800">{selectedEmails.size} clientes selecionados</span>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleBulkAction('add_grupo')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-md text-sm font-medium hover:bg-green-50 disabled:opacity-50"
              >
                + Adicionar ao Grupo
              </button>
              <button 
                onClick={() => handleBulkAction('remove_grupo')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-600 rounded-md text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                - Remover do Grupo
              </button>
              <button 
                onClick={() => handleBulkAction('add_tag')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-50 disabled:opacity-50"
              >
                Gerenciar Etiquetas
              </button>
  
              
              <button 
                onClick={() => handleBulkAction('delete')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Excluir Selecionados
              </button>
    
              <button 
                onClick={handleExportSelected}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Exportar CSV
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full relative">
        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-full text-neutral-500 p-8 text-center">
              <AlertCircle className="w-10 h-10 mb-2 text-red-500 opacity-50" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">Nenhum cliente encontrado</h3>
              <p className="text-neutral-500">Tente ajustar os filtros ou a busca.</p>
            </div>
          ) : (
            
            <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-neutral-500 uppercase bg-transparent border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 w-10" title="Selecionar os clientes desta página">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedEmails.size === clientes.length && clientes.length > 0} onChange={toggleAll} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" />
                      </div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('numero')}>
                      <div className="flex items-center"># <SortIcon field="numero" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('nome')}>
                      <div className="flex items-center">Cliente <SortIcon field="nome" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('totalCompras')}>
                      <div className="flex items-center">Total Compras <SortIcon field="totalCompras" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('totalProdutos')}>
                      <div className="flex items-center">Total Produtos <SortIcon field="totalProdutos" /></div>
                    </th>
                    <th className="px-6 py-4">WhatsApp</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clientes.map(c => (
                    <tr key={c.email} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 w-10">
                        <input type="checkbox" checked={selectedEmails.has(c.email)} onChange={() => toggleSelect(c.email)} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-900">{c.numero}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900 flex items-center space-x-2">
                          <Link to={`/clientes/${c.email}`} className="text-purple-700 hover:text-purple-900 font-semibold">{c.nome}</Link>
                          {c.destaqueManual && <span className="flex w-2 h-2 rounded-full bg-amber-400" title="Cliente Destacado"></span>}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">{c.emailOriginal}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                          {c.quantidadeCompras || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                          {c.quantidadeProdutos || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.estaNoGrupo ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <MessageCircle className="w-3 h-3 mr-1" /> No Grupo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Não
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                        <Link to={`/clientes/${c.email}`} className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                          Abrir
                        </Link>
                        <button onClick={() => handleDeleteCliente(c.email)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col divide-y divide-neutral-100">
              {isSelectionMode && (
                <div className="px-4 py-3 bg-neutral-50 flex items-center justify-between border-b border-neutral-200">
                   <div className="flex items-center gap-2">
                     <input type="checkbox" checked={selectedEmails.size === clientes.length && clientes.length > 0} onChange={toggleAll} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-5 h-5 cursor-pointer" />
                     <span className="text-sm font-medium text-neutral-700">Selecionar Todos</span>
                   </div>
                </div>
              )}
              {clientes.map(c => (
                <div 
                  key={c.email} 
                  className={`flex items-center py-4 px-2 ${selectedEmails.has(c.email) ? 'bg-purple-50/50' : 'active:bg-neutral-50'}`}
                >
                  {isSelectionMode && (
                    <div className="pl-2 pr-3 flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={selectedEmails.has(c.email)} 
                        onChange={() => toggleSelect(c.email)} 
                        className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-5 h-5 cursor-pointer" 
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col pl-2">
                    <div className="flex justify-between items-start mb-1">
                      <Link 
                        to={`/clientes/${c.email}`} 
                        className="font-medium text-purple-700 truncate block"
                        onTouchStart={() => handleTouchStart(c.email)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onMouseDown={() => handleTouchStart(c.email)}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                      >
                        {c.numero}. {c.nome}
                        {c.destaqueManual && <span className="inline-block ml-2 w-2 h-2 rounded-full bg-amber-400" title="Cliente Destacado"></span>}
                      </Link>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCliente(c.email); }} className="text-red-400 hover:text-red-600 p-1 ml-2" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex-shrink-0 ml-2">
                         {c.estaNoGrupo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                            <MessageCircle className="w-3 h-3 mr-1" /> Grupo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Fora
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-neutral-500 truncate mb-2">
                      {c.emailOriginal}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-neutral-600">
                      <div className="flex items-center">
                        <ShoppingBag className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                        <span className="font-medium text-neutral-800 mr-1">{c.quantidadeCompras || 0}</span> compras
                      </div>
                      <div className="flex items-center">
                        <Package className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                        <span className="font-medium text-neutral-800 mr-1">{c.quantidadeProdutos || 0}</span> unid.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>

          )}
        </div>
        
        {/* Pagination Footer */}
        <div className="py-6 flex items-center justify-between flex-shrink-0 mt-4">
          <p className="text-sm text-neutral-500">
            {clientes.length > 0 ? (
              <>Mostrando <span className="font-medium text-neutral-900">{currentPage * PAGE_SIZE + 1}</span> até <span className="font-medium text-neutral-900">{currentPage * PAGE_SIZE + clientes.length}</span></>
            ) : (
              'Nenhum resultado'
            )}
          </p>
          <div className="flex space-x-2">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 0 || loading}
              className="p-2 border border-neutral-200 rounded-lg bg-white disabled:opacity-50 hover:bg-neutral-50"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <button 
              onClick={handleNextPage} 
              disabled={!hasMore || loading}
              className="p-2 border border-neutral-200 rounded-lg bg-white disabled:opacity-50 hover:bg-neutral-50"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {showBulkTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Gerenciar Etiquetas ({selectedEmails.size} clientes)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Ação</label>
                <select 
                  className="w-full border-neutral-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  value={bulkTagAction}
                  onChange={e => setBulkTagAction(e.target.value as 'add'|'remove')}
                >
                  <option value="add">Adicionar Etiqueta</option>
                  <option value="remove">Remover Etiqueta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da Etiqueta</label>
                <input 
                  type="text"
                  className="w-full border-neutral-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  value={bulkTagText}
                  onChange={e => setBulkTagText(e.target.value)}
                  placeholder="Ex: VIP"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowBulkTagModal(false)} className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleBulkTag} disabled={bulkActionLoading || !bulkTagText.trim()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {confirmDelete.type === 'bulk' ? 'Excluir Selecionados' : 'Excluir Cliente'}
            </h3>
            <p className="text-neutral-500 text-sm mb-6">
              {confirmDelete.type === 'bulk' 
                ? `Tem certeza que deseja excluir ${selectedEmails.size} cliente(s)? Esta ação apagará permanentemente o(s) cliente(s) e o histórico de compras e reajustará a numeração.`
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
}
