import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Produtos() {
  const navigate = useNavigate();
  const { catalog, loading, loadEstatisticas } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEstatisticas();
  }, [loadEstatisticas]);

  const filteredProdutos = (catalog || []).filter(p => 
    p.nomeOficial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigosProduto.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.16))] md:h-screen flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-light text-neutral-800 tracking-tight">Catálogo de Produtos</h1>
          <p className="text-neutral-500 mt-1">{catalog?.length || 0} produtos oficiais</p>
        </div>
      </div>

      <div className="bg-white rounded-t-2xl shadow-sm border-x border-t border-neutral-200 p-4 flex-shrink-0">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
            placeholder="Buscar por nome ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col min-h-0 relative">
        <div className="overflow-auto flex-1">
          {loading && (!catalog || catalog.length === 0) ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Nome Oficial</th>
                  <th className="px-6 py-4 font-medium">Códigos Vinculados</th>
                  <th className="px-6 py-4 font-medium">Unidades Vendidas</th>
                  <th className="px-6 py-4 font-medium">Clientes Únicos</th>
                  <th className="px-6 py-4 font-medium">Primeira Venda</th>
                  <th className="px-6 py-4 font-medium">Última Venda</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProdutos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900 max-w-xs truncate" title={produto.nomeOficial}>
                      {produto.nomeOficial}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                        {produto.codigosProduto.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-900">{produto.unidadesVendidas || 0}</td>
                    <td className="px-6 py-4 text-neutral-900">{produto.clientesUnicos || 0}</td>
                    <td className="px-6 py-4 text-neutral-500">
                      {produto.primeiraVenda ? new Date(produto.primeiraVenda).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {produto.ultimaVenda ? new Date(produto.ultimaVenda).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/produtos/${produto.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
