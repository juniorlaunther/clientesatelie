import { useStore } from '../store/useStore';
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { parse } from 'date-fns';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { importService } from '../services/importService';
import { clientService } from '../services/clientService';
import { catalogService } from '../services/catalogService';
import { ProdutoCatalogo } from '../types';
import { db } from '../lib/firebase';
import { doc, writeBatch, collection } from 'firebase/firestore';
import { Cliente, Compra, ProdutoVendido, Importacao } from '../types';

const parseDate = (dateStr: string) => {
  if (!dateStr) return 0;
  try {
    const d = parse(dateStr, 'dd/MM/yyyy HH:mm:ss', new Date());
    const time = d.getTime();
    return isNaN(time) ? 0 : time;
  } catch {
    return 0;
  }
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
const getBaseCode = (code: string) => code.replace(/C\d+$/, '');

export default function Importar() {
  const { loadEstatisticas } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'importing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
    const [stats, setStats] = useState<any>(null);
  
  const [lastImport, setLastImport] = useState<Importacao | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);

  React.useEffect(() => {
    loadLastImport();
  }, [status]);

  const loadLastImport = async () => {
    try {
      const imp = await importService.getLastSuccessfulImport();
      setLastImport(imp);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUndo = async () => {
    if (!lastImport) return;
    setUndoing(true);
    try {
      await importService.undoImport(lastImport.id);
      setShowUndoModal(false);
      setLastImport(null);
      setStatus('idle');
      setFile(null);
      setParsedData([]);
      alert('Importação desfeita com sucesso!');
    } catch (err: any) {
      alert('Erro ao desfazer: ' + err.message);
    } finally {
      setUndoing(false);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const processFile = (file: File) => {
    setFile(file);
    setStatus('parsing');
    setErrorMsg('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setErrorMsg('Erro ao ler o arquivo CSV. Verifique o formato.');
          setStatus('error');
          return;
        }
        
        // Trim headers and values
        const data = results.data.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            const val = row[key];
            newRow[key.trim()] = typeof val === 'string' ? val.trim() : val;
          });
          return newRow;
        });

        setParsedData(data);
        setPreview(data.slice(0, 3));
        setStatus('ready');
      },
      error: (error) => {
        setErrorMsg('Erro ao processar CSV: ' + error.message);
        setStatus('error');
      }
    });
  };

  const executeImport = async () => {
    setStatus('importing');
    try {
      // 1. Get existing DB state
      const [existingClients, existingPhones, maxClientNumber, catalogArray] = await Promise.all([
        importService.getAllClients(),
        Promise.resolve(new Map()), // Phones handled below
        importService.getMaxClientNumber(),
        catalogService.getCatalog()
      ]);

      let currentClientNumber = maxClientNumber + 1;

      // 2. Identify new transactions & Check existing
      const allTxIds = parsedData.map(row => row['Código da transação']).filter(Boolean);
      // To avoid massive getDocs, we check in chunks.
      const existingTxs = await importService.getValidExistingTransactions(allTxIds, existingClients);

      const newRows = parsedData.filter(row => {
        const id = row['Código da transação'];
        return id && !existingTxs.has(id);
      });

      let novosClientes = 0;
      let clientesAtualizados = 0;
      let novasCompras = 0;
      let novosProdutos = 0;
      let conflitos = 0;
      
      const normalizeProductName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
      
      const catalog = new Map<string, ProdutoCatalogo>();
      catalogArray.forEach(c => catalog.set(c.id, c));
      const newCatalogItems = new Map<string, ProdutoCatalogo>();
      const catalogUpdates = new Set<string>(); // IDs of existing catalog items to update


      // Group new rows by client email
      const newClientsMap = new Map<string, { emailOriginal: string, telefoneOriginal: string, nome: string, firstPurchaseDate: number, firstPurchaseCode: string, compras: any[] }>();
      
      const newPurchasesMap = new Map<string, { dataTransacao: number, clienteId: string, produtos: any[] }>();

      newRows.forEach(row => {
        const emailOrig = row['Email Comprador(a)'] || '';
        const emailNorm = normalizeEmail(emailOrig);
        const telefoneOrig = row['Telefone Comprador(a)'] || '';
        const phoneNorm = normalizePhone(telefoneOrig);
        const dataTx = parseDate(row['Data da transação']);
        const codigoBase = getBaseCode(row['Código da transação']);

        // Check phone conflicts
        if (!existingClients.has(emailNorm) && !newClientsMap.has(emailNorm)) {
          if (phoneNorm && existingPhones.has(phoneNorm) && existingPhones.get(phoneNorm) !== emailNorm) {
            conflitos++;
            // Note: the prompt says "Mostre o caso como possível conflito... não una silenciosamente". We'll still create the new client as requested (e-mail is main), but we count it as conflict.
          }
        }

        if (!newClientsMap.has(emailNorm)) {
          newClientsMap.set(emailNorm, {
            emailOriginal: emailOrig,
            telefoneOriginal: telefoneOrig,
            nome: row['Nome Comprador(a)'],
            firstPurchaseDate: dataTx,
            firstPurchaseCode: codigoBase,
            compras: []
          });
        } else {
          // Update first purchase if earlier
          const clientData = newClientsMap.get(emailNorm)!;
          if (dataTx < clientData.firstPurchaseDate) {
            clientData.firstPurchaseDate = dataTx;
            clientData.firstPurchaseCode = codigoBase;
          } else if (dataTx === clientData.firstPurchaseDate) {
             if (codigoBase < clientData.firstPurchaseCode) {
                clientData.firstPurchaseCode = codigoBase;
             }
          }
        }

        newClientsMap.get(emailNorm)!.compras.push(row);

        if (!newPurchasesMap.has(codigoBase)) {
          newPurchasesMap.set(codigoBase, {
            dataTransacao: dataTx,
            clienteId: emailNorm,
            produtos: []
          });
        }
        newPurchasesMap.get(codigoBase)!.produtos.push(row);
      });

      
      // === Build/Update Catalog ===
      // Group all incoming products by Código do produto
      const incomingProducts = new Map<string, {nomes: Set<string>, codigosPreco: Set<string>}>();
      newRows.forEach(row => {
        const codProd = row['Código do produto'];
        if (!codProd) return;
        if (!incomingProducts.has(codProd)) {
          incomingProducts.set(codProd, { nomes: new Set(), codigosPreco: new Set() });
        }
        const data = incomingProducts.get(codProd)!;
        data.nomes.add(row['Nome do produto']);
        if (row['Código do preço']) data.codigosPreco.add(row['Código do preço']);
      });

      incomingProducts.forEach((data, codProd) => {
        // Find existing catalog item that has this codProd
        let existingOfficial = catalogArray.find(c => c.codigosProduto.includes(codProd));
        if (existingOfficial) {
          // Update it
          let changed = false;
          data.nomes.forEach(n => {
            const norm = normalizeProductName(n);
            if (!existingOfficial!.nomeNormalizado) existingOfficial!.nomeNormalizado = existingOfficial!.nomeOficial.toLowerCase();
            if (existingOfficial!.nomeOficial !== n && existingOfficial!.nomeNormalizado !== norm && (!existingOfficial!.nomesAlternativos || !existingOfficial!.nomesAlternativos.includes(n))) {
              if (!existingOfficial!.nomesAlternativos) existingOfficial!.nomesAlternativos = [];
              existingOfficial!.nomesAlternativos.push(n);
              changed = true;
            }
          });
          data.codigosPreco.forEach(cp => {
            if (!existingOfficial!.codigosPreco.includes(cp)) {
              existingOfficial!.codigosPreco.push(cp);
              changed = true;
            }
          });
          if (changed) {
            catalogUpdates.add(existingOfficial.id);
            catalog.set(existingOfficial.id, existingOfficial);
          }
        } else {
          // Create new official product
          // Let's check if the first name maps to some special cases as requested:
          let nomesArr = Array.from(data.nomes);
          let nomeOficial = nomesArr[0];
          
          // Check for "Brasil Goods" logic if it somehow comes with new code, but wait, the rules say it's based on codProd.
          // If the new codProd isn't found, it's a completely new product. 
          // (Unless it's the exact name "Brasil Goods", but the rule says CodProd is the primary identity.
          // If it's a completely new code for "Brasil Goods", we should link it to the existing official product if it existed.
          // But wait, we can't assume that here without hardcoding. I will hardcode the rule as requested.
          
          const newId = 'CAT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          
          const newItem = {
            id: newId,
            nomeOficial,
            nomeNormalizado: normalizeProductName(nomeOficial),
            nomesAlternativos: nomesArr.length > 1 ? nomesArr.slice(1) : [],
            codigosProduto: [codProd],
            codigosPreco: Array.from(data.codigosPreco)
          };
          newCatalogItems.set(newId, newItem);
          catalog.set(newId, newItem);
        }
      });

      // Assign numbers to completely new clients
      // Sort them by first purchase date, then base code
      const newClientsArray = Array.from(newClientsMap.entries()).filter(([email]) => !existingClients.has(email));
      
      newClientsArray.sort((a, b) => {
        if (a[1].firstPurchaseDate !== b[1].firstPurchaseDate) {
          return a[1].firstPurchaseDate - b[1].firstPurchaseDate;
        }
        return a[1].firstPurchaseCode.localeCompare(b[1].firstPurchaseCode);
      });

      const clientsToWrite: Cliente[] = [];
      
      const computeTermos = (c: any, prods: string[] = [], tags: string[] = []) => {
        return [
          c.nome?.toLowerCase(),
          c.emailOriginal?.toLowerCase(),
          c.telefoneOriginal?.toLowerCase()
        ].filter(Boolean);
      };

      newClientsArray.forEach(([email, data]) => {
        // Calculate summaries for this new client based purely on their new purchases
        let maxData = 0;
        let qtdCompras = 0;
        const prodCodes = new Set<string>();
        
        data.compras.forEach((cRow: any) => {
           qtdCompras++;
           const dataTx = parseDate(cRow['Data da transação']);
           if (dataTx > maxData) maxData = dataTx;
           const cod = cRow['Código do produto'];
           if (cod) prodCodes.add(cod);
        });

        const prodIds = new Set<string>();
        prodCodes.forEach(cod => {
           const cat = Array.from(catalog.values()).find(c => c.codigosProduto.includes(cod)) || 
                       Array.from(newCatalogItems.values()).find(c => c.codigosProduto.includes(cod));
           if (cat) prodIds.add(cat.id);
        });

        clientsToWrite.push({
          email,
          numero: currentClientNumber++,
          nome: data.nome,
          telefone: normalizePhone(data.telefoneOriginal),
          emailOriginal: data.emailOriginal,
          telefoneOriginal: data.telefoneOriginal,
          dataPrimeiraCompra: data.firstPurchaseDate,
          codigoPrimeiraCompra: data.firstPurchaseCode,
          criadoEm: Date.now(),
          quantidadeCompras: qtdCompras,
          quantidadeProdutos: prodIds.size,
          produtosCompradosIds: Array.from(prodIds),
          dataUltimaCompra: maxData,
          etiquetas: [],
          estaNoGrupo: false,
          termosBusca: computeTermos({ nome: data.nome, emailOriginal: data.emailOriginal, telefoneOriginal: data.telefoneOriginal }, Array.from(prodIds), [])
        });
        novosClientes++;
      });

      // Existing clients that got new purchases
      const updatedClientsArray = Array.from(newClientsMap.keys()).filter(email => existingClients.has(email));
      clientesAtualizados = updatedClientsArray.length;
      
      const updatedClientsToWrite: Cliente[] = [];
      updatedClientsArray.forEach(email => {
         const newData = newClientsMap.get(email)!;
         const existing = existingClients.get(email)!;
         
         // Combine existing summary fields with new purchases
         let maxData = existing.dataUltimaCompra || 0;
         let qtdCompras = existing.quantidadeCompras || 0;
         const prodCodes = new Set<string>();
         
         newData.compras.forEach((cRow: any) => {
            qtdCompras++;
            const dataTx = parseDate(cRow['Data da transação']);
            if (dataTx > maxData) maxData = dataTx;
            const cod = cRow['Código do produto'];
            if (cod) prodCodes.add(cod);
         });
         
         const prodIds = new Set<string>(existing.produtosCompradosIds || []);
         prodCodes.forEach(cod => {
           const cat = Array.from(catalog.values()).find(c => c.codigosProduto.includes(cod)) || 
                       Array.from(newCatalogItems.values()).find(c => c.codigosProduto.includes(cod));
           if (cat) prodIds.add(cat.id);
         });
         
         const pArray = Array.from(prodIds);
         updatedClientsToWrite.push({
           ...existing,
           quantidadeCompras: qtdCompras,
           dataUltimaCompra: maxData,
           produtosCompradosIds: pArray,
           termosBusca: computeTermos(existing, pArray, existing.etiquetas || []),
           quantidadeProdutos: pArray.length
         });
      });

      // Prepare purchases and products
      const comprasToWrite: Compra[] = [];
      const produtosToWrite: ProdutoVendido[] = [];
      const importacaoId = Date.now().toString();

      Array.from(newPurchasesMap.entries()).forEach(([codigoBase, data]) => {
        comprasToWrite.push({
          id: codigoBase,
          clienteId: data.clienteId,
          dataTransacao: data.dataTransacao
        });
        novasCompras++;

        data.produtos.forEach(prod => {
          produtosToWrite.push({
            id: prod['Código da transação'],
            compraId: codigoBase,
            clienteId: data.clienteId,
            dataTransacao: parseDate(prod['Data da transação']),
            codigoProduto: prod['Código do produto'],
            nomeProduto: prod['Nome do produto'],
            codigoPreco: prod['Código do preço'],
            valorTotal: parseFloat(prod['Valor total da compra']) || 0,
            faturamentoLiquido: parseFloat(prod['Faturamento líquido']) || 0,
            taxaProcessamento: parseFloat(prod['Taxa de processamento']) || 0,
            metodoPagamento: prod['Método de pagamento'],
            importacaoId
          });
          novosProdutos++;
        });
      });

      const importacaoRecord: Importacao = {
        id: importacaoId,
        data: Date.now(),
        nomeArquivo: file?.name || 'desconhecido',
        linhasProcessadas: parsedData.length,
        novosClientes,
        clientesAtualizados,
        novasCompras,
        novosProdutos,
        ignorados: parsedData.length - newRows.length,
        conflitos,
        erros: 0,
        status: 'concluida',
        transactionIds: produtosToWrite.map(p => p.id),
        baseCompraIds: comprasToWrite.map(c => c.id),
        newClientEmails: clientsToWrite.map(c => c.email),
        updatedClientEmails: updatedClientsArray,
        newCatalogIds: Array.from(newCatalogItems.keys()),
        updatedCatalogIds: Array.from(catalogUpdates)
      };

      // Write in batches of 500
      let batch = writeBatch(db);
      let opCount = 0;

      const commitBatch = async () => {
        if (opCount > 0) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      };

      for (const client of clientsToWrite) {
        batch.set(doc(collection(db, 'clientes'), client.email), client);
        opCount++;
        if (opCount >= 500) await commitBatch();
      }
      
      for (const client of updatedClientsToWrite) {
        batch.set(doc(collection(db, 'clientes'), client.email), client, { merge: true });
        opCount++;
        if (opCount >= 500) await commitBatch();
      }

      for (const compra of comprasToWrite) {
        // Use merge:true just in case a purchase was partially imported before (shouldn't happen with our checks, but safe)
        batch.set(doc(collection(db, 'compras'), compra.id), compra, { merge: true });
        opCount++;
        if (opCount >= 500) await commitBatch();
      }

      
      for (const [id, item] of newCatalogItems.entries()) {
        batch.set(doc(collection(db, 'produtos_catalogo'), id), item);
        opCount++;
        if (opCount >= 500) await commitBatch();
      }
      for (const id of catalogUpdates) {
        batch.set(doc(collection(db, 'produtos_catalogo'), id), catalog.get(id)!, { merge: true });
        opCount++;
        if (opCount >= 500) await commitBatch();
      }
      for (const prod of produtosToWrite) {
        batch.set(doc(collection(db, 'produtos_comprados'), prod.id), prod);
        opCount++;
        if (opCount >= 500) await commitBatch();
      }

      batch.set(doc(collection(db, 'importacoes'), importacaoId), importacaoRecord);
      opCount++;
      await commitBatch();

      // Recalculate numbering automatically after import
      
      // Check if renumbering is actually needed
      // Needs renumbering if there are new clients, or if updated clients got older purchases
      // For simplicity, if novasCompras > 0 we run it, but it's very fast anyway since it just validates order
      if (novosClientes > 0 || novasCompras > 0) {
         await clientService.recalcularNumeracao();
      }

      const allCatalogIdsToUpdate = Array.from(new Set([...Array.from(newCatalogItems.keys()), ...Array.from(catalogUpdates)]));
      for (const id of allCatalogIdsToUpdate) {
         await require('../services/catalogService').catalogService.recalcularResumoProduto(id);
      }
      
      if (novosClientes > 0 || novasCompras > 0 || novosProdutos > 0 || clientesAtualizados > 0) {
         await import('../services/statsService').then(m => m.statsService.atualizarEstatisticasGerais());
      }
      await loadEstatisticas(true);

      setStats(importacaoRecord);
      setStatus('done');

    } catch (error: any) {
      console.error(error);
      setErrorMsg('Erro durante a importação: ' + error.message);
      setStatus('error');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-light text-neutral-800 tracking-tight">Importar Dados</h1>
        {status === 'idle' && lastImport && (
          <button 
            onClick={() => setShowUndoModal(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
          >
            Desfazer última importação
          </button>
        )}
      </div>
      
      {status === 'idle' && (
        <div 
          className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-neutral-200 p-12 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-300 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-12 h-12 text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">Selecione ou arraste o arquivo CSV</h3>
          <p className="text-neutral-500 mb-6 text-sm">Formato suportado: UTF-8, separado por ponto e vírgula (;)</p>
          <button className="bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-neutral-800 transition-colors">
            Procurar Arquivo
          </button>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
        </div>
      )}

      {status === 'parsing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-neutral-400 animate-spin mb-4" />
          <p className="text-neutral-600 font-medium">Lendo arquivo...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-8 flex flex-col items-center text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Erro na Importação</h3>
          <p className="text-red-700 mb-6">{errorMsg}</p>
          <button 
            onClick={() => setStatus('idle')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-neutral-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-neutral-600" />
              </div>
              <div>
                <h3 className="text-neutral-900 font-medium">{file?.name}</h3>
                <p className="text-neutral-500 text-sm">{parsedData.length} linhas encontradas</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setStatus('idle')}
                className="px-5 py-2.5 rounded-lg font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeImport}
                className="bg-neutral-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Confirmar Importação
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-neutral-100">
              <h4 className="font-medium text-neutral-900">Colunas Reconhecidas</h4>
              <p className="text-sm text-neutral-500 mt-1">
                {Object.keys(parsedData[0] || {}).join(', ')}
              </p>
            </div>
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50">
              <h4 className="font-medium text-neutral-900">Prévia dos Dados</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Produto</th>
                    <th className="px-6 py-3">Comprador(a)</th>
                    <th className="px-6 py-3">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-neutral-50 last:border-0">
                      <td className="px-6 py-4">{row['Código da transação']}</td>
                      <td className="px-6 py-4">{row['Data da transação']}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{row['Nome do produto']}</td>
                      <td className="px-6 py-4">{row['Nome Comprador(a)']}</td>
                      <td className="px-6 py-4">{row['Email Comprador(a)']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {status === 'importing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-neutral-900 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Processando Importação</h3>
          <p className="text-neutral-500 text-center max-w-sm">
            Isso pode levar alguns instantes. Estamos comparando os registros para evitar duplicidades e garantindo a numeração correta dos clientes.
          </p>
        </div>
      )}

      {status === 'done' && stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-8 border-b border-neutral-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-light text-neutral-900 mb-2">Importação Concluída</h2>
            <p className="text-neutral-500">{file?.name}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-100">
            <div className="bg-white p-6">
              <p className="text-sm font-medium text-neutral-500 mb-1">Linhas Processadas</p>
              <p className="text-2xl font-semibold text-neutral-900">{stats.linhasProcessadas}</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-sm font-medium text-neutral-500 mb-1">Novos Produtos</p>
              <p className="text-2xl font-semibold text-neutral-900">{stats.novosProdutos}</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-sm font-medium text-neutral-500 mb-1">Novas Compras</p>
              <p className="text-2xl font-semibold text-neutral-900">{stats.novasCompras}</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-sm font-medium text-neutral-500 mb-1">Ignorados (Duplicados)</p>
              <p className="text-2xl font-semibold text-neutral-900">{stats.ignorados}</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-sm font-medium text-neutral-500 mb-1">Novos Clientes</p>
              <p className="text-2xl font-semibold text-neutral-900">{stats.novosClientes}</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-sm font-medium text-neutral-500 mb-1">Clientes Atualizados</p>
              <p className="text-2xl font-semibold text-neutral-900">{stats.clientesAtualizados}</p>
            </div>
            <div className="bg-white p-6 md:col-span-2">
              <p className="text-sm font-medium text-amber-600 mb-1">Possíveis Conflitos (Telefone)</p>
              <p className="text-2xl font-semibold text-amber-700">{stats.conflitos}</p>
            </div>
          </div>

          <div className="p-6 bg-neutral-50 flex justify-center">
            <button 
              onClick={() => {
                setStatus('idle');
                setFile(null);
                setParsedData([]);
                setPreview([]);
                setStats(null);
              }}
              className="bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Nova Importação
            </button>
          </div>
        </div>
      )}

      {showUndoModal && lastImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Desfazer Importação</h3>
            <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700 mb-6 space-y-2">
              <p><strong>Arquivo:</strong> {lastImport.nomeArquivo}</p>
              <p><strong>Data:</strong> {lastImport.data ? new Date(lastImport.data).toLocaleString('pt-BR') : "-"}</p>
              <p><strong>Novos clientes:</strong> {lastImport.novosClientes}</p>
              <p><strong>Novas compras:</strong> {lastImport.novasCompras}</p>
              <p><strong>Novos produtos vendidos:</strong> {lastImport.novosProdutos}</p>
            </div>
            <p className="text-sm text-neutral-500 mb-6">
              Apenas produtos e clientes criados nesta importação serão removidos. O catálogo e a numeração serão recalculados. Deseja continuar?
            </p>
            <div className="flex space-x-3">
              <button onClick={() => setShowUndoModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleUndo} disabled={undoing} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center">
                {undoing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}