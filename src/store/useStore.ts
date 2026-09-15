import { create } from 'zustand';
import { EstatisticasGerais, ProdutoCatalogo } from '../types';
import { statsService } from '../services/statsService';
import { catalogService } from '../services/catalogService';

interface StoreState {
  estatisticas: EstatisticasGerais | null;
  catalog: ProdutoCatalogo[] | null;
  loading: boolean;
  loadEstatisticas: (force?: boolean) => Promise<void>;
  invalidateCache: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  estatisticas: null,
  catalog: null,
  loading: false,
  loadEstatisticas: async (force = false) => {
    const { estatisticas, catalog } = get();
    if (!force && estatisticas && catalog) return; // Cache hit

    set({ loading: true });
    try {
      const [stats, cat] = await Promise.all([
        statsService.getEstatisticas(),
        catalogService.getCatalogWithStats()
      ]);
      
      // Sort catalog globally by units sold to make it easier for UI
      const sortedCat = (cat || []).sort((a, b) => (b.unidadesVendidas || 0) - (a.unidadesVendidas || 0));

      set({ estatisticas: stats, catalog: sortedCat });
    } finally {
      set({ loading: false });
    }
  },
  invalidateCache: () => set({ estatisticas: null, catalog: null })
}));
