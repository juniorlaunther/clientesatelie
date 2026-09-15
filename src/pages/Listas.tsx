import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Loader2, Edit2, Trash2, Check, X } from 'lucide-react';
import { listaService } from '../services/listaService';
import { clientService } from '../services/clientService';
import { ListaSalva } from '../types';

export default function Listas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listas, setListas] = useState<(ListaSalva & { qtdClientes: number })[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allListas = await listaService.getListas();
      
      const listasMappedPromises = allListas.map(async (lista) => {
        let qtd = 0;
        if (lista.clienteIds) {
          qtd = lista.clienteIds.length;
        } else if (lista.filtros) {
          qtd = await clientService.getQtdClientes(lista.filtros);
        }
        return { ...lista, qtdClientes: qtd };
      });
      
      const listasMapped = await Promise.all(listasMappedPromises);
      setListas(listasMapped);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await listaService.updateLista(editingId, editName.trim());
      await loadData();
      setEditingId(null);
    } catch (e) {
      alert('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta lista?')) return;
    try {
      await listaService.deleteLista(id);
      await loadData();
    } catch (e) {
      alert('Erro ao excluir');
    }
  };

  const openList = (lista: ListaSalva) => {
    if (lista.clienteIds) {
      navigate('/clientes?lista=' + lista.id);
    } else if (lista.filtros) {
      const q = new URLSearchParams();
      if (lista.filtros.produtoId) q.set('produtoId', lista.filtros.produtoId);
      if (lista.filtros.estaNoGrupo !== undefined) q.set('grupo', lista.filtros.estaNoGrupo ? 'true' : 'false');
      navigate('/clientes?' + q.toString());
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.16))] md:h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-light text-neutral-800 tracking-tight">Listas Salvas</h1>
        <p className="text-neutral-500 mt-1">Acesse seus segmentos e filtros customizados</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : listas.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                <List className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">Nenhuma lista salva</h3>
              <p className="text-neutral-500">Crie listas a partir dos filtros na tela de Clientes.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {listas.map((lista) => (
                <div key={lista.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-neutral-50 transition-colors gap-4">
                  <div className="flex-1">
                    {editingId === lista.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 text-sm w-full max-w-xs"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                        />
                        <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <h3 className="text-lg font-medium text-neutral-900">{lista.nome}</h3>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-neutral-500">
                      <span className="bg-neutral-100 px-2 py-0.5 rounded-md text-neutral-700">
                        {lista.qtdClientes} {lista.qtdClientes === 1 ? 'cliente' : 'clientes'}
                      </span>
                      {lista.tipo === 'estatica' ? (
                        <span className="text-blue-600">Lista Estática</span>
                      ) : (
                        <span className="text-purple-600">Lista Dinâmica (Auto-atualizável)</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {!editingId && (
                      <>
                        <button onClick={() => handleEdit(lista.id, lista.nome)} className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(lista.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => openList(lista)} className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors shadow-sm">
                          Abrir Lista
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
