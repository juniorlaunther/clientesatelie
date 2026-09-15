const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const replacement = `
      const now = Date.now();
      const baseCode = \`MANUAL-\${now}\`;
      const newC: Cliente = {
        nome: novoCliente.nome.trim(),
        email: novoCliente.email.trim().toLowerCase(),
        emailOriginal: novoCliente.email.trim(),
        telefone: novoCliente.telefone.trim().replace(/\\D/g, ''),
        telefoneOriginal: novoCliente.telefone.trim(),
        numero: maxNum + 1,
        codigoPrimeiraCompra: baseCode,
        dataPrimeiraCompra: now,
        estaNoGrupo: false,
        criadoEm: now
      };
      
      await clientService.updateCliente(newC.email, newC);
      
      // Create a dummy purchase so the client is considered valid and not deleted by recalcularNumeracao
      await clientService.createCompraEProduto(
        { id: baseCode, clienteId: newC.email, dataTransacao: now },
        { 
          id: \`PROD-\${now}\`, 
          compraId: baseCode, 
          clienteId: newC.email, 
          nomeProduto: 'Cadastro Manual', 
          codigoProduto: 'MANUAL',
          codigoPreco: 'MANUAL',
          valorTotal: 0,
          faturamentoLiquido: 0,
          taxaProcessamento: 0,
          metodoPagamento: 'Manual',
          dataTransacao: now,
          importacaoId: 'MANUAL'
        }
      );
      // createCompraEProduto already calls recalcularNumeracao!
`;

code = code.replace(/const newC: Cliente = \{[\s\S]*?await clientService\.updateCliente\(newC\.email, newC\);/, replacement);
fs.writeFileSync('src/pages/Clientes.tsx', code);
