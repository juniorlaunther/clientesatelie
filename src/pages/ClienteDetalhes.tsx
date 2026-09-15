import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { configService } from '../services/configService';
import { Cliente, Compra, ProdutoVendido, Presente } from '../types';
import { Loader2, ArrowLeft, MessageCircle, Copy, Gift, Settings, Tag, Edit, Trash2, Calendar, Phone, Plus, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ClienteDetalhes() {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [produtos, setProdutos] = useState<ProdutoVendido[]>([]);
  const [numerosEspeciais, setNumerosEspeciais] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit states
  const [obs, setObs] = useState('');
  const [isEditingObs, setIsEditingObs] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Gift states
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftDesc, setGiftDesc] = useState('');
  const [giftObs, setGiftObs] = useState('');
  const [giftTrack, setGiftTrack] = useState('');

  // Purchase states
  const [showAddCompraModal, setShowAddCompraModal] = useState(false);
  const [novaCompra, setNovaCompra] = useState({ produto: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), codigoProduto: '' });
  
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'cliente' | 'compra', id?: string } | null>(null);

  useEffect(() => {
    if (email) {
      loadData(email);
    }
  }, [email]);

  const loadData = async (clientEmail: string) => {
    setLoading(true);
    try {
      const decodedEmail = decodeURIComponent(clientEmail);
      const c = await clientService.getCliente(decodedEmail);
      if (!c) {
        setError('Cliente não encontrado.');
        setLoading(false);
        return;
      }
      
      const comp = await clientService.getComprasByCliente(decodedEmail);
      const prod = await clientService.getProdutosByCliente(decodedEmail);
      const numEspeciais = await configService.getNumerosEspeciais();
      
      comp.sort((a, b) => b.dataTransacao - a.dataTransacao);
      
      setCliente(c);
      setObs(c.observacoes || '');
      setCompras(comp);
      setProdutos(prod);
      setNumerosEspeciais(numEspeciais);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWhatsApp = async () => {
    if (!cliente) return;
    setSaving(true);
    try {
      const novoStatus = !cliente.estaNoGrupo;
      await clientService.updateCliente(cliente.email, { estaNoGrupo: novoStatus });
      setCliente({ ...cliente, estaNoGrupo: novoStatus });
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isNumeroEspecial = cliente && numerosEspeciais.includes(cliente.numero);

  const copyPhone = () => {
    if (cliente?.telefone) {
      navigator.clipboard.writeText(cliente.telefone);
      alert('Telefone copiado!');
    }
  };

  const openWhatsApp = () => {
    if (!cliente?.telefone) return;
    let tel = cliente.telefone;
    if (!tel.startsWith('55') && tel.length <= 11) {
      tel = '55' + tel;
    }
    window.open(`https://wa.me/${tel}`, '_blank');
  };

  const handleDelete = async () => {
    if (!cliente) return;
    setSaving(true);
    try {
      if (confirmDelete?.type === 'cliente') {
        await clientService.deleteCliente(cliente.email);
        navigate('/clientes');
      } else if (confirmDelete?.type === 'compra' && confirmDelete.id) {
        await clientService.deleteCompraEProdutos(confirmDelete.id);
        setCompras(compras.filter(c => c.id !== confirmDelete.id));
        setProdutos(produtos.filter(p => p.compraId !== confirmDelete.id));
        setConfirmDelete(null);
      }
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveObs = async () => {
    if (!cliente) return;
    setSaving(true);
    try {
      await clientService.updateCliente(cliente.email, { observacoes: obs });
      setCliente({ ...cliente, observacoes: obs });
      setIsEditingObs(false);
    } catch (err: any) {
      alert('Erro ao salvar observações: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTag = async () => {
    if (!cliente || !newTag.trim()) return;
    const tag = newTag.trim();
    if (cliente.etiquetas?.includes(tag)) {
      setNewTag('');
      return;
    }
    setSaving(true);
    try {
      const novasTags = [...(cliente.etiquetas || []), tag];
      await clientService.updateCliente(cliente.email, { etiquetas: novasTags });
      setCliente({ ...cliente, etiquetas: novasTags });
      setNewTag('');
    } catch (err: any) {
      alert('Erro ao adicionar etiqueta: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!cliente) return;
    setSaving(true);
    try {
      const novasTags = (cliente.etiquetas || []).filter(t => t !== tagToRemove);
      await clientService.updateCliente(cliente.email, { etiquetas: novasTags });
      setCliente({ ...cliente, etiquetas: novasTags });
    } catch (err: any) {
      alert('Erro ao remover etiqueta: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addGift = async () => {
    if (!cliente || !giftDesc.trim()) return;
    setSaving(true);
    try {
      const novoPresente: Presente = {
        id: `PRES-${Date.now()}`,
        descricao: giftDesc.trim(),
        data: Date.now(),
        observacao: giftObs.trim(),
        rastreamento: giftTrack.trim()
      };
      const novosPresentes = [...(cliente.presentes || []), novoPresente];
      await clientService.updateCliente(cliente.email, { presentes: novosPresentes });
      setCliente({ ...cliente, presentes: novosPresentes });
      setShowGiftModal(false);
      setGiftDesc('');
      setGiftObs('');
      setGiftTrack('');
    } catch (err: any) {
      alert('Erro ao adicionar presente: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCompra = async () => {
    if (!cliente || !novaCompra.produto || !novaCompra.valor) return;
    setSaving(true);
    try {
      const now = Date.now();
      const compraId = `MANUAL-${now}`;
      const produtoId = `PROD-${now}`;
      
      const compraObj: Compra = {
        id: compraId,
        clienteId: cliente.email,
        dataTransacao: new Date(novaCompra.data + 'T12:00:00').getTime()
      };
      
      const valorNum = parseFloat(novaCompra.valor.replace(',', '.'));
      
      const prodObj: ProdutoVendido = {
        id: produtoId,
        compraId: compraId,
        clienteId: cliente.email,
        nomeProduto: novaCompra.produto,
        codigoProduto: novaCompra.codigoProduto || 'MANUAL',
        codigoPreco: 'MANUAL',
        valorTotal: valorNum,
        metodoPagamento: 'Manual',
        faturamentoLiquido: valorNum,
        taxaProcessamento: 0,
        dataTransacao: compraObj.dataTransacao,
        importacaoId: 'MANUAL'
      };

      await clientService.createCompraEProduto(compraObj, prodObj);
      
      // Update local state
      setCompras([compraObj, ...compras].sort((a, b) => b.dataTransacao - a.dataTransacao));
      setProdutos([...produtos, prodObj]);
      
      setShowAddCompraModal(false);
      setNovaCompra({ produto: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), codigoProduto: '' });
    } catch(err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl text-center">
          <p>{error}</p>
          <Link to="/clientes" className="mt-4 inline-block text-red-800 underline">Voltar para clientes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Link to="/clientes" className="inline-flex items-center text-neutral-500 hover:text-neutral-900 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para a lista
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className={`p-6 border-b border-neutral-100 ${isNumeroEspecial ? 'bg-purple-50' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-mono ${isNumeroEspecial ? 'bg-purple-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-700'}`}>
                  #{cliente.numero}
                  {isNumeroEspecial && <Gift className="w-3 h-3 ml-1.5" />}
                </span>
                
                <button 
                  onClick={() => setConfirmDelete({ type: 'cliente' })}
                  className="text-neutral-400 hover:text-red-600 transition-colors"
                  title="Excluir Cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h1 className="text-xl font-bold text-neutral-900 mb-1">{cliente.nome}</h1>
              <p className="text-neutral-500 text-sm truncate" title={cliente.emailOriginal}>{cliente.emailOriginal}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Contato</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-neutral-700">
                    <Phone className="w-4 h-4 mr-2 text-neutral-400" />
                    <span className="font-mono">{cliente.telefoneOriginal || '-'}</span>
                  </div>
                  {cliente.telefone && (
                    <div className="flex space-x-1">
                      <button onClick={copyPhone} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={openWhatsApp} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">WhatsApp Group</h3>
                <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mr-2 ${cliente.estaNoGrupo ? 'bg-green-500' : 'bg-neutral-300'}`}></div>
                    <span className="text-sm font-medium text-neutral-700">{cliente.estaNoGrupo ? 'Está no Grupo' : 'Não está'}</span>
                  </div>
                  <button 
                    onClick={handleToggleWhatsApp}
                    disabled={saving}
                    className="text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    Alterar
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Etiquetas</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cliente.etiquetas?.map(tag => (
                    <span key={tag} className="inline-flex items-center bg-neutral-100 text-neutral-700 text-xs px-2.5 py-1 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1.5 text-neutral-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Nova etiqueta..." 
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag()}
                    className="flex-1 text-sm bg-white border border-neutral-300 rounded px-2 py-1 outline-none focus:border-purple-500"
                  />
                  <button onClick={addTag} disabled={!newTag.trim() || saving} className="bg-neutral-900 text-white p-1 rounded disabled:opacity-50">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Observações</h3>
                  {!isEditingObs ? (
                    <button onClick={() => setIsEditingObs(true)} className="text-xs text-purple-600 hover:underline">Editar</button>
                  ) : (
                    <button onClick={saveObs} disabled={saving} className="text-xs text-green-600 font-medium hover:underline">Salvar</button>
                  )}
                </div>
                {!isEditingObs ? (
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50 p-3 rounded-lg border border-neutral-100 min-h-[60px]">
                    {cliente.observacoes || <span className="text-neutral-400 italic">Sem observações.</span>}
                  </p>
                ) : (
                  <textarea 
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    className="w-full text-sm border border-purple-300 rounded-lg p-3 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                    rows={4}
                    placeholder="Adicione observações aqui..."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-medium text-neutral-900 flex items-center">
                <Gift className="w-5 h-5 mr-2 text-purple-500" />
                Presentes
              </h3>
              <button 
                onClick={() => setShowGiftModal(true)}
                className="text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
              >
                + Dar Presente
              </button>
            </div>
            <div className="divide-y divide-neutral-100">
              {!cliente.presentes || cliente.presentes.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-500">Nenhum presente registrado.</div>
              ) : (
                cliente.presentes.map(p => (
                  <div key={p.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-neutral-900 text-sm">{p.descricao}</p>
                      <span className="text-xs text-neutral-500">{p.data ? format(p.data, 'dd/MM/yyyy') : '-'}</span>
                    </div>
                    {p.observacao && <p className="text-xs text-neutral-600 mt-1">{p.observacao}</p>}
                    {p.rastreamento && (
                      <p className="text-xs text-purple-600 mt-2 font-mono bg-purple-50 inline-block px-1.5 py-0.5 rounded">
                        Rastreio: {p.rastreamento}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Histórico de Compras */}
        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Comprado (Bruto)</p>
              <p className="text-2xl font-bold text-neutral-900">
                R$ {produtos.reduce((sum, p) => sum + (p.valorTotal || 0), 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deixou Líquido</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {produtos.reduce((sum, p) => sum + (p.faturamentoLiquido || 0), 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-900">Histórico de Compras</h2>
              <button 
                onClick={() => setShowAddCompraModal(true)}
                className="text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Compra
              </button>
            </div>
            
            <div className="divide-y divide-neutral-100">
              {compras.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">
                  Nenhuma compra registrada para este cliente.
                </div>
              ) : (
                compras.map(compra => {
                  const prods = produtos.filter(p => p.compraId === compra.id);
                  const valorTotal = prods.reduce((sum, p) => sum + p.valorTotal, 0);
                  
                  return (
                    <div key={compra.id} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                        <div className="flex items-center text-sm mb-2 sm:mb-0">
                          <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                          <span className="font-medium text-neutral-900 mr-3">{compra.dataTransacao ? format(compra.dataTransacao, 'dd/MM/yyyy HH:mm') : '-'}</span>
                          <span className="text-neutral-500 font-mono text-xs">#{compra.id}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-1 rounded font-medium">
                            {prods.length} produto(s)
                          </span>
                          <span className="text-sm font-bold text-neutral-900">
                            R$ {valorTotal.toFixed(2).replace('.', ',')}
                          </span>
                          <button 
                            onClick={() => setConfirmDelete({ type: 'compra', id: compra.id })}
                            className="text-neutral-300 hover:text-red-500 transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-neutral-50 rounded-lg border border-neutral-100 overflow-hidden">
                        {prods.map((prod, i) => (
                          <div key={prod.id} className={`p-3 flex items-center justify-between text-sm ${i > 0 ? 'border-t border-neutral-200' : ''}`}>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="font-medium text-neutral-900 truncate" title={prod.nomeProduto}>{prod.nomeProduto}</p>
                              <p className="text-neutral-500 font-mono text-xs mt-0.5">{prod.id}</p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <p className="font-medium text-neutral-900">R$ {prod.valorTotal.toFixed(2).replace('.', ',')}</p>
                              <p className="text-neutral-400 text-xs mt-0.5">{prod.metodoPagamento}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showGiftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Registrar Presente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Presente *</label>
                <input 
                  type="text" 
                  value={giftDesc}
                  onChange={e => setGiftDesc(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                  placeholder="Ex: Caneca do Ateliê"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Rastreamento</label>
                <input 
                  type="text" 
                  value={giftTrack}
                  onChange={e => setGiftTrack(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono text-sm"
                  placeholder="Ex: BR123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Observações</label>
                <textarea 
                  value={giftObs}
                  onChange={e => setGiftObs(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowGiftModal(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={addGift}
                disabled={!giftDesc.trim() || saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Salvar Presente
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCompraModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Adicionar Compra</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Data *</label>
                <input 
                  type="date" 
                  value={novaCompra.data}
                  onChange={e => setNovaCompra({...novaCompra, data: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Produto *</label>
                <input 
                  type="text" 
                  value={novaCompra.produto}
                  onChange={e => setNovaCompra({...novaCompra, produto: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                  placeholder="Nome do produto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Valor Total (R$) *</label>
                <input 
                  type="text" 
                  value={novaCompra.valor}
                  onChange={e => setNovaCompra({...novaCompra, valor: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                  placeholder="Ex: 150,00"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddCompraModal(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddCompra}
                disabled={!novaCompra.produto.trim() || !novaCompra.valor.trim() || saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {confirmDelete.type === 'cliente' ? 'Excluir Cliente' : 'Excluir Compra'}
              </h3>
              <p className="text-neutral-500 text-sm mb-6">
                {confirmDelete.type === 'cliente' 
                  ? `Tem certeza que deseja excluir o cliente ${cliente.nome}? Esta ação é irreversível e a numeração dos próximos clientes será ajustada para não deixar buracos na sequência.`
                  : 'Tem certeza que deseja excluir esta compra e seus produtos associados?'}
              </p>
              
              <div className="flex w-full space-x-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
