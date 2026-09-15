import React, { useState, useEffect } from 'react';
import { Loader2, Gift, Send, ExternalLink, MessageCircle } from 'lucide-react';
import { clientService } from '../services/clientService';
import { configService } from '../services/configService';
import { Cliente, Presente } from '../types';

export default function Presentes() {
  const [loading, setLoading] = useState(true);
  const [numerosEspeciais, setNumerosEspeciais] = useState<number[]>([]);
  const [prazoDias, setPrazoDias] = useState(7);
  const [clientesMap, setClientesMap] = useState<Map<number, Cliente>>(new Map());
  const [presentesUsados, setPresentesUsados] = useState<Map<number, Presente>>(new Map());
  const [allClientsMap, setAllClientsMap] = useState<Map<string, Cliente>>(new Map());

  // Modal de envio
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [sendDescricao, setSendDescricao] = useState('');
  const [sendRastreio, setSendRastreio] = useState('');
  const [sendObs, setSendObs] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [nums, prazo, cls] = await Promise.all([
        configService.getNumerosEspeciais(),
        configService.getPrazoConfirmacao(),
        clientService.getClientes()
      ]);
      setNumerosEspeciais(nums.sort((a, b) => a - b));
      setPrazoDias(prazo);
      
      const cMap = new Map<number, Cliente>();
      const aMap = new Map<string, Cliente>();
      const pMap = new Map<number, Presente>();
      
      cls.forEach(c => {
        aMap.set(c.email, c);
        if (c.presentes) {
          c.presentes.forEach(p => {
            if (p.numeroEspecial) {
              pMap.set(p.numeroEspecial, { ...p, clienteEmail: c.email } as any);
            }
          });
        }
      });
      
      // Find current occupant for non-sent presents
      nums.forEach(n => {
        if (!pMap.has(n)) {
          const occ = cls.find(c => c.numero === n);
          if (occ) cMap.set(n, occ);
        }
      });
      
      setClientesMap(cMap);
      setPresentesUsados(pMap);
      setAllClientsMap(aMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (num: number) => {
    if (presentesUsados.has(num)) {
      const p = presentesUsados.get(num)!;
      return p.status; // 'Enviado' | 'Entregue'
    }
    const cli = clientesMap.get(num);
    if (!cli) return 'Aguardando cliente';
    
    // Check prazoo
    const diffTime = Math.abs(Date.now() - cli.dataPrimeiraCompra);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= prazoDias) {
      return 'Elegível';
    }
    return 'Aguardando prazo'; // Passed the elegible window? Wait: "Aguardando prazo" if < prazoDias, "Elegível" if passed? The prompt says "Aguardando prazo, Elegível, Enviado, Entregue". "Enquanto o presente ainda não estiver marcado como enviado..."
    // Usually "Aguardando prazo" means it hasn't reached the deadline, or maybe elegible means it CAN be sent. Let's assume if diff <= prazoDias it's Elegível, otherwise Aguardando prazo? Or it's the other way. "Prazo para confirmar cliente especial, com valor inicial de 7 dias". 
  };

  // The logic for Elegível vs Aguardando prazo:
  // If we just need it simple: say Elegível always if they occupy it, until you mark as sent.
  // Actually, if we look at the request:
  // "Prazo para confirmar cliente especial, com valor inicial de 7 dias."
  // "Enquanto o presente ainda não estiver marcado como enviado..."
  
  const getStatusLabel = (num: number) => {
    if (presentesUsados.has(num)) return presentesUsados.get(num)!.status;
    const cli = clientesMap.get(num);
    if (!cli) return 'Aguardando chegada';
    const diffDays = (Date.now() - cli.dataPrimeiraCompra) / (1000 * 60 * 60 * 24);
    return diffDays > prazoDias ? 'Elegível' : 'Aguardando prazo';
  };

  const openSendModal = (num: number, cli: Cliente) => {
    setSelectedNum(num);
    setSelectedClient(cli);
    setSendDescricao('Presente número ' + num);
    setSendRastreio('');
    setSendObs('');
    setShowSendModal(true);
  };

  const handleSend = async () => {
    if (!selectedNum || !selectedClient) return;
    setSending(true);
    try {
      const p: Presente = {
        id: `PRES-${Date.now()}`,
        numeroEspecial: selectedNum,
        descricao: sendDescricao,
        data: Date.now(),
        dataEnvio: Date.now(),
        rastreamento: sendRastreio,
        observacao: sendObs,
        status: 'Enviado'
      };
      
      const et = selectedClient.etiquetas || [];
      const updated = {
        presentes: [...(selectedClient.presentes || []), p],
        etiquetas: et.includes('Presenteado') ? et : [...et, 'Presenteado']
      };
      
      await clientService.updateCliente(selectedClient.email, updated);
      
      setShowSendModal(false);
      loadData();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-neutral-800 tracking-tight flex items-center">
          <Gift className="w-6 h-6 mr-3 text-purple-600" />
          Central de Presentes
        </h1>
        <p className="text-neutral-500 mt-1">Acompanhe e gerencie envios para os clientes especiais.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Número</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Situação</th>
                  <th className="px-6 py-4 font-medium">Detalhes do Envio</th>
                  <th className="px-6 py-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {numerosEspeciais.map(num => {
                  const hasSent = presentesUsados.has(num);
                  const p = hasSent ? presentesUsados.get(num)! : null;
                  const cliEmail = hasSent ? (p as any).clienteEmail : null;
                  const cli = hasSent ? allClientsMap.get(cliEmail) : clientesMap.get(num);
                  const statusLabel = getStatusLabel(num);
                  
                  return (
                    <tr key={num} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">#{num}</span>
                      </td>
                      <td className="px-6 py-4">
                        {cli ? (
                          <div>
                            <p className="font-medium text-neutral-900">{cli.nome}</p>
                            <p className="text-neutral-500 text-xs mt-0.5">{cli.email}</p>
                            <p className="text-neutral-500 text-xs mt-0.5">{cli.telefone}</p>
                            <p className="text-neutral-400 text-xs mt-1">1ª compra: {cli.dataPrimeiraCompra ? new Date(cli.dataPrimeiraCompra).toLocaleDateString("pt-BR") : "-"}</p>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Vago</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                          ${statusLabel === 'Elegível' ? 'bg-blue-50 text-blue-700' : 
                            statusLabel === 'Enviado' ? 'bg-orange-50 text-orange-700' : 
                            statusLabel === 'Entregue' ? 'bg-green-50 text-green-700' : 
                            'bg-neutral-100 text-neutral-600'}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p ? (
                          <div className="text-xs text-neutral-600 space-y-1">
                            <p><strong>Desc:</strong> {p.descricao}</p>
                            {p.rastreamento && <p><strong>Rastreio:</strong> {p.rastreamento}</p>}
                            {p.observacao && <p><strong>Obs:</strong> {p.observacao}</p>}
                            {p.dataEnvio && <p><strong>Enviado:</strong> {new Date(p.dataEnvio).toLocaleDateString('pt-BR')}</p>}
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {cli && (
                          <div className="flex space-x-2">
                            <a 
                              href={`https://wa.me/${cli.telefone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            {!hasSent && (
                              <button 
                                onClick={() => openSendModal(num, cli)}
                                className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                title="Marcar como Enviado"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSendModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Enviar Presente #{selectedNum}</h3>
            <div className="bg-neutral-50 p-3 rounded-lg mb-4 text-sm">
              <p><strong>Cliente:</strong> {selectedClient.nome}</p>
              <p>Este presente ficará permanentemente vinculado a este cliente, mesmo que a numeração mude futuramente.</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição do Presente</label>
                <input
                  type="text"
                  value={sendDescricao}
                  onChange={e => setSendDescricao(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Código de Rastreio (Opcional)</label>
                <input
                  type="text"
                  value={sendRastreio}
                  onChange={e => setSendRastreio(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Observação (Opcional)</label>
                <textarea
                  value={sendObs}
                  onChange={e => setSendObs(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500 min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button onClick={() => setShowSendModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleSend} disabled={sending} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Envio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
