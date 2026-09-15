const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

s = s.replace(
  /import { Loader2, Search, Plus, Filter, MessageCircle, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';/,
  "import { Loader2, Search, Plus, Filter, MessageCircle, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingBag, Package } from 'lucide-react';"
);

fs.writeFileSync('src/pages/Clientes.tsx', s);
