const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const oldState = `
  // Filters
  const [search, setSearch] = useState('');
  const [whatsappFilter, setWhatsappFilter] = useState<'all' | 'in' | 'out'>('all');
  const [sortField, setSortField] = useState<'numero' | 'nome' | 'primeiraCompra' | 'ultimaCompra' | 'totalCompras' | 'totalProdutos'>('numero');
  const [sortDesc, setSortDesc] = useState(true);
`;

const newState = `
  const [searchParams] = useSearchParams();
  // Filters
  const [search, setSearch] = useState('');
  const [whatsappFilter, setWhatsappFilter] = useState<'all' | 'in' | 'out'>(searchParams.get('grupo') === 'true' ? 'in' : searchParams.get('grupo') === 'false' ? 'out' : 'all');
  const [produtoFilter, setProdutoFilter] = useState<string>(searchParams.get('produtoId') || '');
  const [sortField, setSortField] = useState<'numero' | 'nome' | 'primeiraCompra' | 'ultimaCompra' | 'totalCompras' | 'totalProdutos'>('numero');
  const [sortDesc, setSortDesc] = useState(true);
  
  const [catalog, setCatalog] = useState<ProdutoCatalogo[]>([]);
  const [showSaveListModal, setShowSaveListModal] = useState(false);
  const [listName, setListName] = useState('');
  
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagAction, setBulkTagAction] = useState<'add'|'remove'>('add');
  const [bulkTagText, setBulkTagText] = useState('');
`;

code = code.replace(oldState.trim(), newState.trim());
fs.writeFileSync('src/pages/Clientes.tsx', code);
