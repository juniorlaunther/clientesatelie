import fs from 'fs';
let content = fs.readFileSync('src/services/migrationService.ts', 'utf8');

const newPreview = `
  async getMigrationPreview() {
    const statusDoc = await getDoc(doc(db, 'migracoes', 'v2_summary_migration'));
    const isCompleted = statusDoc.exists() && statusDoc.data().status === 'concluida';

    const [clientesSnap, comprasSnap, prodCompradosSnap, prodOficiaisSnap] = await Promise.all([
      getCountFromServer(collection(db, 'clientes')),
      getCountFromServer(collection(db, 'compras')),
      getCountFromServer(collection(db, 'produtos_comprados')),
      getCountFromServer(collection(db, 'produtos_catalogo'))
    ]);

    const allClientes = await getDocs(collection(db, 'clientes'));
    let semResumo = 0;
    allClientes.forEach(d => {
       const data = d.data();
       if (data.quantidadeProdutos === undefined || !data.termosBusca || !data.produtosMap || !data.etiquetasMap) {
          semResumo++;
       }
    });

    const allProdOficiais = await getDocs(collection(db, 'produtos_catalogo'));
    let prodSemResumo = 0;
    allProdOficiais.forEach(d => {
       const data = d.data();
       if (data.unidadesVendidas === undefined || data.clientesUnicos === undefined) {
          prodSemResumo++;
       }
    });

    return {
       isCompleted,
       totalClientes: clientesSnap.data().count,
       totalCompras: comprasSnap.data().count,
       totalProdutosComprados: prodCompradosSnap.data().count,
       totalProdutosOficiais: prodOficiaisSnap.data().count,
       clientesSemResumo: semResumo,
       comprasSemResumo: 0,
       produtosSemResumo: prodSemResumo,
       estimatedDocs: semResumo + prodSemResumo,
       versaoAtual: isCompleted ? 'v2' : 'v1',
       versaoFutura: 'v2',
       ultimaExecucao: statusDoc.exists() ? statusDoc.data().data : null
    };
  },
`;

const runMigrationRegex = /async runSummaryMigration[\s\S]*?onProgress\('Migração concluída com sucesso!'\);\n\s*\}/;

const newRun = `
  async runSummaryMigration(onProgress: (msg: string) => void): Promise<void> {
    const statusRef = doc(db, 'migracoes', 'v2_summary_migration');
    const statusDoc = await getDoc(statusRef);
    if (statusDoc.exists() && statusDoc.data().status === 'concluida') {
       throw new Error('Migração já concluída.');
    }

    // Capture BEFORE totals
    const preCounts = await Promise.all([
      getCountFromServer(collection(db, 'clientes')),
      getCountFromServer(collection(db, 'compras')),
      getCountFromServer(collection(db, 'produtos_comprados')),
      getCountFromServer(collection(db, 'produtos_catalogo'))
    ]);
    const preClientes = preCounts[0].data().count;
    const preCompras = preCounts[1].data().count;
    const preProdComp = preCounts[2].data().count;
    const preProdOficial = preCounts[3].data().count;

    onProgress('Atualizando resumos de clientes...');
    const clientesSnap = await getDocs(collection(db, 'clientes'));
    let opCount = 0;
    let alterados = 0;
    for (const d of clientesSnap.docs) {
      await clientService.recalcularResumoCliente(d.id);
      opCount++;
      alterados++;
      if (opCount % 10 === 0) onProgress(\`Migrando cliente \${opCount} de \${clientesSnap.size}...\`);
    }

    onProgress('Atualizando catálogo de produtos...');
    const catSnap = await getDocs(collection(db, 'produtos_catalogo'));
    let catOp = 0;
    for (const c of catSnap.docs) {
      await catalogService.recalcularResumoProduto(c.id);
      catOp++;
      alterados++;
      if (catOp % 10 === 0) onProgress(\`Migrando produto \${catOp} de \${catSnap.size}...\`);
    }
    
    // Capture AFTER totals
    const postCounts = await Promise.all([
      getCountFromServer(collection(db, 'clientes')),
      getCountFromServer(collection(db, 'compras')),
      getCountFromServer(collection(db, 'produtos_comprados')),
      getCountFromServer(collection(db, 'produtos_catalogo'))
    ]);
    const postClientes = postCounts[0].data().count;
    const postCompras = postCounts[1].data().count;
    const postProdComp = postCounts[2].data().count;
    const postProdOficial = postCounts[3].data().count;

    if (preClientes !== postClientes || preCompras !== postCompras || preProdComp !== postProdComp || preProdOficial !== postProdOficial) {
       onProgress('ERRO CRÍTICO: Totais alterados durante a otimização! A operação foi abortada.');
       throw new Error('Inconsistência detectada nos totais.');
    }
    
    await setDoc(statusRef, { 
       status: 'concluida', 
       data: Date.now(), 
       lidos: clientesSnap.size + catSnap.size, 
       alterados 
    });
    
    onProgress('Otimização concluída com sucesso!');
  }
`;

content = content.replace(/async getMigrationPreview\(\) \{[\s\S]*?versaoFutura: 'v2'\n\s*\};\n\s*\},/, newPreview.trim() + ',');
content = content.replace(runMigrationRegex, newRun.trim());

fs.writeFileSync('src/services/migrationService.ts', content);
