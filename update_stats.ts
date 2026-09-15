import { statsService } from './src/services/statsService';
async function run() {
  await statsService.atualizarEstatisticasGerais();
  console.log('Stats updated');
  process.exit(0);
}
run().catch(console.error);
