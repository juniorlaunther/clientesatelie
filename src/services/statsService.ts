import { db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, getCountFromServer } from 'firebase/firestore';
import { EstatisticasGerais } from '../types';

export const statsService = {
  async getEstatisticas(): Promise<EstatisticasGerais | null> {
    const snap = await getDoc(doc(db, 'estatisticas', 'gerais'));
    if (!snap.exists()) return null;
    return snap.data() as EstatisticasGerais;
  },

  async atualizarEstatisticasGerais(): Promise<void> {
    const clientesRef = collection(db, 'clientes');
    const comprasRef = collection(db, 'compras');
    const prodVendidosRef = collection(db, 'produtos_comprados');
    const catalogoRef = collection(db, 'produtos_catalogo');

    // Executando agregações no lado do servidor para economizar banda e leituras
    const [
      totalClientesSnap,
      totalComprasSnap,
      totalUnidadesSnap,
      totalCatalogoSnap,
      clientesNoWhatsAppSnap,
      clientesForaWhatsAppSnap,
      clientesComUmProdutoSnap,
      clientesComMaisDeUmProdutoSnap
    ] = await Promise.all([
      getCountFromServer(clientesRef),
      getCountFromServer(comprasRef),
      getCountFromServer(prodVendidosRef),
      getCountFromServer(catalogoRef),
      getCountFromServer(query(clientesRef, where('estaNoGrupo', '==', true))),
      getCountFromServer(query(clientesRef, where('estaNoGrupo', '==', false))),
      getCountFromServer(query(clientesRef, where('quantidadeProdutos', '==', 1))),
      getCountFromServer(query(clientesRef, where('quantidadeProdutos', '>=', 2)))
    ]);

    const stats: EstatisticasGerais = {
      totalClientes: totalClientesSnap.data().count,
      totalCompras: totalComprasSnap.data().count,
      totalUnidadesVendidas: totalUnidadesSnap.data().count,
      totalProdutosOficiais: totalCatalogoSnap.data().count,
      clientesNoWhatsApp: clientesNoWhatsAppSnap.data().count,
      clientesForaWhatsApp: clientesForaWhatsAppSnap.data().count,
      clientesComUmProduto: clientesComUmProdutoSnap.data().count,
      clientesComMaisDeUmProduto: clientesComMaisDeUmProdutoSnap.data().count,
      dataUltimaAtualizacao: Date.now()
    };

    await setDoc(doc(db, 'estatisticas', 'gerais'), stats);
  }
};
