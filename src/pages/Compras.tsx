import React, { useState, useEffect } from 'react';
import { clientService } from '../services/clientService';
import { Compra } from '../types';
import { Loader2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [pageDocs, setPageDocs] = useState<any[]>([]); // array of last documents per page
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadPage(0, true);
  }, []);

  const loadPage = async (pageIndex: number, reset = false) => {
    setLoading(true);
    try {
      const isNext = pageIndex > currentPage;
      const lastDoc = reset ? undefined : (isNext ? pageDocs[currentPage] : pageDocs[pageIndex - 1]);
      
      const result = await clientService.getComprasPaginated(PAGE_SIZE, lastDoc);
      
      setCompras(result.data);
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
      setError(err.message);
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.16))] md:h-screen flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-neutral-800 tracking-tight">Registro de Compras</h1>
          <p className="text-neutral-500 mt-1">Exibindo página {currentPage + 1}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-red-600">Erro: {error}</div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4">ID da Transação</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {compras.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900">{c.id}</td>
                    <td className="px-6 py-4 text-neutral-500">{c.dataTransacao ? format(new Date(c.dataTransacao), 'dd/MM/yyyy HH:mm') : '-'}</td>
                    <td className="px-6 py-4 text-neutral-900">{c.clienteNome || 'Cliente'}</td>
                    <td className="px-6 py-4 text-neutral-500">{c.clienteId}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/clientes/${c.clienteId}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-neutral-200 p-4 bg-neutral-50 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-neutral-500">
            {compras.length > 0 ? (
              <>Mostrando <span className="font-medium text-neutral-900">{currentPage * PAGE_SIZE + 1}</span> até <span className="font-medium text-neutral-900">{currentPage * PAGE_SIZE + compras.length}</span></>
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
    </div>
  );
}
