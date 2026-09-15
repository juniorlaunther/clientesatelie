export interface Presente {
  id: string;
  numeroEspecial?: number;
  descricao: string;
  data: number;
  dataEnvio?: number;
  rastreamento?: string;
  observacao?: string;
  status?: 'Enviado' | 'Entregue';
}

export interface Cliente {
  numero: number;
  email: string;
  telefone: string;
  nome: string;
  emailOriginal: string;
  telefoneOriginal: string;
  dataPrimeiraCompra: number;
  codigoPrimeiraCompra: string;
  criadoEm: number;
  estaNoGrupo?: boolean;
  observacoes?: string;
  etiquetas?: string[];
  presentes?: Presente[];
  destaqueManual?: boolean;
  // Summary fields
  produtosCompradosIds?: string[];
  quantidadeProdutos?: number;
  quantidadeCompras?: number;
  dataUltimaCompra?: number;
  termosBusca?: string[];
}

export interface Compra {
  id: string; // Base code (e.g. HP3374549325)
  clienteId: string; // normalized email
  dataTransacao: number;
  // Summary fields
  clienteNome?: string;
}

export interface ProdutoVendido {
  id: string; // Full transaction code (e.g. HP3374549325C1)
  compraId: string;
  clienteId: string;
  dataTransacao: number;
  codigoProduto: string;
  nomeProduto: string;
  codigoPreco: string;
  valorTotal: number;
  faturamentoLiquido: number;
  taxaProcessamento: number;
  metodoPagamento: string;
  importacaoId: string;
}

export interface Importacao {
  id: string;
  data: number;
  nomeArquivo: string;
  linhasProcessadas: number;
  novosClientes: number;
  clientesAtualizados: number;
  novasCompras: number;
  novosProdutos: number;
  ignorados: number;
  conflitos: number;
  erros: number;
  status: 'concluida' | 'com_erros' | 'desfeita';
  transactionIds?: string[];
  baseCompraIds?: string[];
  newClientEmails?: string[];
  updatedClientEmails?: string[];
  newCatalogIds?: string[];
  updatedCatalogIds?: string[];
}

export interface ProdutoCatalogo {
  id: string;
  nomeOficial: string;
  nomeNormalizado: string;
  nomesAlternativos?: string[];
  codigosProduto: string[];
  codigosPreco: string[];
  // Summary fields
  unidadesVendidas?: number;
  clientesUnicos?: number;
  primeiraVenda?: number | null;
  ultimaVenda?: number | null;
}

export interface ListaSalva {
  id: string;
  nome: string;
  clienteIds: string[];
  // Legacy filter compatibility
  filtros?: {
    produtoId?: string;
    dataInicio?: number;
    dataFim?: number;
    estaNoGrupo?: boolean | null;
    etiqueta?: string;
  };
  criadoEm: number;
}

export interface EstatisticasGerais {
  totalClientes: number;
  totalCompras: number;
  totalUnidadesVendidas: number;
  totalProdutosOficiais: number;
  clientesNoWhatsApp: number;
  clientesForaWhatsApp: number;
  clientesComUmProduto: number;
  clientesComMaisDeUmProduto: number;
  dataUltimaAtualizacao: number;
}
