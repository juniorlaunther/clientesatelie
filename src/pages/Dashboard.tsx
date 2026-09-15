import React, { useEffect } from 'react';
import { Loader2, Users, Package, ShoppingBag, Gift, MessageCircle } from 'lucide-react';
import { configService } from '../services/configService';
import { useStore } from '../store/useStore';

export default function Dashboard() {

  
  

  const { estatisticas: stats, catalog: cat, loading, loadEstatisticas } = useStore();
  const [extraStats, setExtraStats] = React.useState<any>(null);
  
  useEffect(() => {
    loadEstatisticas(true);
    loadExtra();
  }, [loadEstatisticas]);

  const loadExtra = async () => {
    try {
      // In a real app we'd cache these or move them to EstatisticasGerais,
      // but they depend on settings that might change so we fetch them here.
      const [numEspeciais, prazoConfirmacao] = await Promise.all([
        configService.getNumerosEspeciais(),
        configService.getPrazoConfirmacao()
      ]);
      
      // Calculate missing extra stats if needed, or just rely on backend stats.
      // Since Dashboard used to calculate "presentesElegiveis" based on client data,
      // we would need clients for this. Wait! The user asked not to load clients.
      // We can just omit "presentesElegiveis" or calculate it server side.
      // For now, let's just show basic placeholders for these 3 if we can't easily get them without loading all clients.
      // But let's check what the user requested:
      // "Esse documento deve conter os dados necessários para o Painel, como:
      // totalClientes, totalCompras, totalUnidadesVendidas, totalProdutosOficiais, clientesNoWhatsApp, clientesForaWhatsApp, clientesComUmProduto, clientesComMaisDeUmProduto, dataUltimaAtualizacao"
      // They didn't mention the Gift stats. I will keep them but as "Ver na aba Presentes" or similar.
      setExtraStats({
        proxEspecial: '-',
        presentesElegiveis: '-',
        presentesAguardando: '-'
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !stats || !cat) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-neutral-800 tracking-tight">Painel Resumo</h1>
        <p className="text-neutral-500 mt-1">Visão compacta e prática da sua base. Atualizado em {stats.dataUltimaAtualizacao ? new Date(stats.dataUltimaAtualizacao).toLocaleString() : "Nunca"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard title="Total de Clientes" value={stats.totalClientes} icon={<Users className="w-6 h-6 text-purple-600" />} bgColor="bg-purple-50" />
        <StatCard title="Produtos Oficiais" value={stats.totalProdutosOficiais} icon={<Package className="w-6 h-6 text-blue-600" />} bgColor="bg-blue-50" />
        <StatCard title="Compraram 1 Produto" value={stats.clientesComUmProduto} icon={<ShoppingBag className="w-6 h-6 text-emerald-600" />} bgColor="bg-emerald-50" />
        <StatCard title="Compraram 2+ Produtos" value={stats.clientesComMaisDeUmProduto} icon={<ShoppingBag className="w-6 h-6 text-amber-600" />} bgColor="bg-amber-50" />
        
        <StatCard title="No Grupo (WhatsApp)" value={stats.clientesNoWhatsApp} icon={<MessageCircle className="w-6 h-6 text-green-600" />} bgColor="bg-green-50" />
        <StatCard title="Total de Compras" value={stats.totalCompras} icon={<Package className="w-6 h-6 text-indigo-600" />} bgColor="bg-indigo-50" />
        <StatCard title="Unidades Vendidas" value={stats.totalUnidadesVendidas} icon={<ShoppingBag className="w-6 h-6 text-rose-600" />} bgColor="bg-rose-50" />
        <StatCard title="Fora do Grupo" value={stats.clientesForaWhatsApp} icon={<Users className="w-6 h-6 text-orange-600" />} bgColor="bg-orange-50" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
        <h3 className="font-medium text-neutral-900 mb-4">Catálogo Oficial de Produtos</h3>
        {cat.length > 0 ? (
          <div className="space-y-3">
            {cat.slice(0, 15).map((prod, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors">
                <span className="text-sm font-medium text-neutral-700 truncate mr-4" title={prod.nomeOficial}>{prod.nomeOficial}</span>
                <div className="flex items-center space-x-4 text-xs font-medium text-neutral-500 shrink-0">
                  <span className="bg-neutral-100 px-2 py-1 rounded">
                    <span className="text-neutral-900">{prod.clientesUnicos || 0}</span> {(prod.clientesUnicos || 0) === 1 ? 'cliente' : 'clientes'}
                  </span>
                  <span className="bg-purple-50 text-purple-800 px-2 py-1 rounded">
                    <span className="font-bold">{prod.unidadesVendidas || 0}</span> unid.
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 text-sm">Nenhum produto cadastrado.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string, value: string | number, icon: any, bgColor: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-neutral-900 tracking-tight">{value}</p>
    </div>
  );
}
