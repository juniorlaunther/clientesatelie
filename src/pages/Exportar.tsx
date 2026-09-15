import React, { useState, useEffect } from 'react';
import { Download, Loader2, FileSpreadsheet, Users as UsersIcon, Filter } from 'lucide-react';
import Papa from 'papaparse';
import { clientService } from '../services/clientService';
import { format } from 'date-fns';
import { Cliente, Compra, ProdutoVendido } from '../types';

export default function Exportar() {
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  const handleExport = async (type: 'clientes' | 'historico') => {
    setExporting(true);
    try {
      const allClients = await clientService.getClientes();
      const allCompras = await clientService.getAllCompras();
      const allProdutos = await clientService.getAllProdutos();

      let filteredClients = allClients;
      let filteredProdutos = allProdutos;

      // Filter by date
      if (startDate) {
        const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
        filteredProdutos = filteredProdutos.filter(p => p.dataTransacao >= start);
        // Se filtramos produtos, atualizamos a lista de clientes para manter só os que compraram no período, ou a instrução diz "Somente o período selecionado"? 
        // Geralmente os filtros se aplicam à base que estamos exportando. 
      }
      if (endDate) {
        const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : 0;
        filteredProdutos = filteredProdutos.filter(p => p.dataTransacao <= end);
      }

      // Filter by client search
      if (clientFilter.trim()) {
        const s = clientFilter.toLowerCase();
        filteredClients = filteredClients.filter(c => 
          c.nome.toLowerCase().includes(s) || 
          c.email.toLowerCase().includes(s) || 
          c.telefone.includes(s) ||
          c.numero.toString() === s
        );
        const validEmails = new Set(filteredClients.map(c => c.email));
        filteredProdutos = filteredProdutos.filter(p => validEmails.has(p.clienteId));
      } else {
        if (startDate || endDate || productFilter) {
          const validEmails = new Set(filteredProdutos.map(p => p.clienteId));
          filteredClients = filteredClients.filter(c => validEmails.has(c.email));
        }
      }

      // Filter by product search
      if (productFilter.trim()) {
        const s = productFilter.toLowerCase();
        filteredProdutos = filteredProdutos.filter(p => 
          p.nomeProduto.toLowerCase().includes(s) || 
          p.codigoProduto.toLowerCase().includes(s)
        );
        if (!clientFilter.trim()) {
          const validEmails = new Set(filteredProdutos.map(p => p.clienteId));
          filteredClients = allClients.filter(c => validEmails.has(c.email));
        }
      }

      let dataToExport: any[] = [];
      let filename = '';

      if (type === 'clientes') {
        const produtosPorCliente = new Map<string, ProdutoVendido[]>();
        filteredProdutos.forEach(p => {
          if (!produtosPorCliente.has(p.clienteId)) produtosPorCliente.set(p.clienteId, []);
          produtosPorCliente.get(p.clienteId)!.push(p);
        });

        const comprasPorCliente = new Map<string, Set<string>>();
        filteredProdutos.forEach(p => {
          if (!comprasPorCliente.has(p.clienteId)) comprasPorCliente.set(p.clienteId, new Set());
          comprasPorCliente.get(p.clienteId)!.add(p.compraId);
        });

        dataToExport = filteredClients.map(c => {
          const prods = produtosPorCliente.get(c.email) || [];
          const comps = comprasPorCliente.get(c.email) || new Set();
          
          let maisRecente = 0;
          prods.forEach(p => {
            if (p.dataTransacao > maisRecente) maisRecente = p.dataTransacao;
          });

          return {
            'Número do cliente': c.numero,
            'Nome': c.nome,
            'E-mail': c.emailOriginal,
            'Telefone': c.telefoneOriginal,
            'Data da primeira compra': c.dataPrimeiraCompra ? format(c.dataPrimeiraCompra, 'dd/MM/yyyy HH:mm:ss') : '',
            'Data da compra mais recente': maisRecente ? format(maisRecente, 'dd/MM/yyyy HH:mm:ss') : '',
            'Quantidade de compras': comps.size,
            'Quantidade de produtos adquiridos': prods.length,
            'Está no grupo': c.estaNoGrupo ? 'SIM' : 'NÃO',
            'Etiquetas': c.etiquetas?.join(', ') || '',
            'Observações': c.observacoes || ''
          };
        });
        filename = 'clientes_export.csv';
      } else {
        const clientesMap = new Map(allClients.map(c => [c.email, c]));

        dataToExport = filteredProdutos.map(p => {
          const c = clientesMap.get(p.clienteId);
          return {
            'Código da transação': p.id,
            'Data da transação': p.dataTransacao ? format(p.dataTransacao, 'dd/MM/yyyy HH:mm:ss') : '',
            'Código do produto': p.codigoProduto,
            'Nome do produto': p.nomeProduto,
            'Código do preço': p.codigoPreco,
            'Valor total da compra': p.valorTotal.toString().replace('.', ','),
            'Faturamento líquido': p.faturamentoLiquido.toString().replace('.', ','),
            'Taxa de processamento': p.taxaProcessamento.toString().replace('.', ','),
            'Método de pagamento': p.metodoPagamento,
            'Nome Comprador(a)': c?.nome || '',
            'Email Comprador(a)': c?.emailOriginal || '',
            'Telefone Comprador(a)': c?.telefoneOriginal || '',
            'Número do cliente': c?.numero || '',
            'Código base da compra': p.compraId,
            'Está no grupo': c?.estaNoGrupo ? 'SIM' : 'NÃO',
            'Etiquetas': c?.etiquetas?.join(', ') || ''
          };
        });
        filename = 'historico_export.csv';
      }

      if (dataToExport.length > 0) {
        const csv = Papa.unparse(dataToExport, { delimiter: ';' });
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        const link = document.createElement('url');
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Nenhum dado encontrado para os filtros selecionados.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao exportar dados.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-64px)] md:min-h-screen">
      <h1 className="text-2xl md:text-3xl font-light text-neutral-800 tracking-tight mb-8">Exportar Dados</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-8">
        <h2 className="text-lg font-medium text-neutral-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-neutral-400" />
          Filtros de Exportação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Data Inicial</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Data Final</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar Cliente</label>
            <input 
              type="text" 
              placeholder="Nome, e-mail, telefone..."
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Filtrar Produto</label>
            <input 
              type="text" 
              placeholder="Nome ou código..."
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <UsersIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Exportar Clientes</h3>
          <p className="text-neutral-500 mb-6 text-sm flex-1">
            Exporte a base de clientes (uma linha por cliente), considerando os filtros aplicados acima.
          </p>
          <button 
            onClick={() => handleExport('clientes')}
            disabled={exporting}
            className="w-full flex items-center justify-center space-x-2 bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span>Baixar CSV</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Exportar Histórico</h3>
          <p className="text-neutral-500 mb-6 text-sm flex-1">
            Exporte o histórico completo (uma linha por produto vendido), mantendo o formato original e adicionando dados extras.
          </p>
          <button 
            onClick={() => handleExport('historico')}
            disabled={exporting}
            className="w-full flex items-center justify-center space-x-2 bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span>Baixar CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}

