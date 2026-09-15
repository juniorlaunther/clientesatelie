const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// Fix duplicate identifier
code = code.replace(
  "import { listaService } from '../services/listaService';\nimport { listaService } from '../services/listaService';",
  "import { listaService } from '../services/listaService';"
);
code = code.replace(
  "import { ListaSalva } from '../types';\nimport { ListaSalva } from '../types';",
  "import { ListaSalva } from '../types';"
);
// Remove first occurrence if any
const firstListaService = "import { listaService } from '../services/listaService';\nimport { ListaSalva } from '../types';";
const dupCount = (code.match(/import \{ listaService \}/g) || []).length;
if (dupCount > 1) {
  code = code.replace(firstListaService, "");
}

code = code.replace(
  "const handleBulkTag = async () => {",
  "// Handle Bulk Tag\n  const handleBulkTag = async () => {"
);

// If handleBulkTag is missing, add it
if (!code.includes("const handleBulkTag = async () => {")) {
  code = code.replace(
    "const executeBulkDelete = async () => {",
    `const handleBulkTag = async () => {
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedEmails).map(async (email) => {
        const cliente = clientes.find(c => c.email === email);
        if (!cliente) return;
        let tags = cliente.etiquetas || [];
        if (bulkTagAction === 'add' && !tags.includes(bulkTagText.trim())) {
          tags.push(bulkTagText.trim());
        } else if (bulkTagAction === 'remove') {
          tags = tags.filter(t => t !== bulkTagText.trim());
        }
        await clientService.updateCliente(email, { etiquetas: tags });
      });
      await Promise.all(promises);
      await loadData();
      setShowBulkTagModal(false);
      setBulkTagText('');
    } catch(e: any) {
      alert(e.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeBulkDelete = async () => {`
  );
}

// Fix missing handleSaveList (probably inside a leftover modal)
// Wait, I replaced {showSaveListModal && ...} but maybe it was duplicated? Or I left the button?
// Let's remove any leftover save list logic
code = code.replace(
  /<button onClick=\{handleSaveList\}.*?<\/button>/g,
  ""
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
