const runSimulation = () => {
    let queries = 0;
    let reads = 0;

    const simulate = (newCount: number, existCount: number) => {
        queries = 0;
        reads = 0;
        const total = newCount + existCount;
        
        // Mock data
        const ids: string[] = [];
        const isExisting = new Map<string, boolean>();
        for(let i=0; i<newCount; i++) {
           const id = 'new' + i;
           ids.push(id);
           isExisting.set(id, false);
        }
        for(let i=0; i<existCount; i++) {
           const id = 'ext' + i;
           ids.push(id);
           isExisting.set(id, true);
        }

        // Shuffle
        ids.sort(() => Math.random() - 0.5);

        for (let i = 0; i < ids.length; i += 30) {
           const chunk = ids.slice(i, i + 30);
           queries++;
           // Simulating the DB read
           for(const id of chunk) {
              if (isExisting.get(id)) {
                 reads++;
              }
           }
        }
        
        console.log(`Cenário: ${newCount} novos, ${existCount} existentes`);
        console.log(`- Consultas (queries): ${queries}`);
        console.log(`- Documentos lidos (reads): ${reads}`);
    };

    simulate(1000, 0);
    simulate(0, 1000);
    simulate(500, 500);
};

runSimulation();
