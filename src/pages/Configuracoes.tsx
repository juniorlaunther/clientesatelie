import React, { useState, useEffect } from 'react';
import { configService } from '../services/configService';
import { Loader2, Plus, X, Settings } from 'lucide-react';

import { catalogService } from '../services/catalogService';
import { statsService } from '../services/statsService';
import { clientService } from '../services/clientService';
export default function Configuracoes() {
  const [numeros, setNumeros] = useState<number[]>([]);
  const [prazo, setPrazo] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [novoNumero, setNovoNumero] = useState('');
  const [saving, setSaving] = useState(false);

  

  useEffect(() => {
    loadData();
  }, []);

  
  const handleReparar = async () => {
    setSaving(true);
    try {
      // 1. Recalcula todos os clientes (muito pesado, mas repara bugs passados)
      await clientService.recalcularNumeracao();
      
      // 2. Recalcula todos os produtos do catalogo
      const cat = await catalogService.getCatalog();
      for(const p of cat) {
         await catalogService.recalcularResumoProduto(p.id);
      }
      
      // 3. Atualiza os totais
      await statsService.atualizarEstatisticasGerais();
      alert('Banco de dados reparado e re-sincronizado com sucesso!');
    } catch(err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const nums = await configService.getNumerosEspeciais();
      const p = await configService.getPrazoConfirmacao();
      setPrazo(p);
      setNumeros(nums);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrazo = async () => {
    setSaving(true);
    try {
      await configService.setPrazoConfirmacao(prazo);
      alert('Prazo salvo com sucesso!');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(novoNumero, 10);
    if (isNaN(num) || num <= 0) return;
    
    if (numeros.includes(num)) {
      setNovoNumero('');
      return;
    }

    setSaving(true);
    try {
      await configService.addNumeroEspecial(num);
      setNumeros([...numeros, num].sort((a, b) => a - b));
      setNovoNumero('');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (num: number) => {
    setSaving(true);
    try {
      await configService.removeNumeroEspecial(num);
      setNumeros(numeros.filter(n => n !== num));
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-neutral-800 tracking-tight flex items-center">
          <Settings className="w-6 h-6 mr-3 text-purple-600" />
          Configurações
        </h1>
        <p className="text-neutral-500 mt-1">Gerencie preferências e regras do sistema.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100">
          <h2 className="text-lg font-medium text-neutral-900">Números Especiais</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Clientes com esses números receberão destaque visual no sistema e perfil.
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleAdd} className="flex space-x-3 mb-6">
            <input
              type="number"
              min="1"
              value={novoNumero}
              onChange={e => setNovoNumero(e.target.value)}
              placeholder="Adicionar número (ex: 1000)"
              className="flex-1 max-w-[200px] border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!novoNumero || saving}
              className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Adicionar
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            {numeros.map(num => (
              <div 
                key={num} 
                className="inline-flex items-center px-3 py-1.5 bg-purple-50 text-purple-700 font-bold font-mono rounded-lg border border-purple-100"
              >
                #{num}
                <button 
                  onClick={() => handleRemove(num)}
                  disabled={saving}
                  className="ml-2 text-purple-400 hover:text-purple-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {numeros.length === 0 && (
              <span className="text-sm text-neutral-400">Nenhum número configurado.</span>
            )}
          </div>
        </div>
      
      
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-8">
          <h2 className="text-xl font-medium text-neutral-900 mb-6 flex items-center">
            <Settings className="w-5 h-5 mr-3 text-red-500" />
            Manutenção do Sistema
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Se os dados do Painel (clientes, produtos ou unidades vendidas) estiverem inconsistentes devido a erros passados, você pode forçar um recálculo geral de toda a base de dados. Este processo pode demorar alguns minutos.
          </p>
          <button
            onClick={handleReparar}
            disabled={saving}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Reparar Banco de Dados'}
          </button>
        </div>
      </div>

    </div>
  );
}
