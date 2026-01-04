const fs = require('fs');
const path = require('path');

// Função para corrigir todos os tipos de erros restantes
function fixAllRemainingErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corrigir todos os tipos de erros identificados
    const fixes = [
      // Corrigir imports de bibliotecas externas
      {
        pattern: /(import\s+{[^}]+}\s+from\s+')\.\/(fs|path|express)(')/g,
        replacement: "$1$2$3"
      },
      // Corrigir imports de analisar-dados.dto (de ../ai/dto/analisar-dados.dto para ../../ai/dto/analisar-dados.dto)
      {
        pattern: /(import\s+{[^}]+}\s+from\s+')\.\.\/ai\/dto\/analisar-dados\.dto(')/g,
        replacement: "$1../../ai/dto/analisar-dados.dto$2"
      }
    ];
    
    fixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Corrigido: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função principal
function main() {
  // Lista de arquivos com erros restantes
  const remainingErrorFiles = [
    'src/configuracoes/configuracoes.controller.ts',
    'src/pedidos/analytics/pedidos-analytics.controller.ts',
    'src/prepare-deploy-scripts.ts',
    'src/processos/processos.controller.ts',
    'src/push-notifications/push-notifications.controller.ts',
    'src/resumos/dto/create-resumo.dto.ts',
    'src/resumos/dto/filter-resumo.dto.ts',
    'src/update-production-env.ts'
  ];
  
  console.log('🔧 Corrigindo erros restantes...');
  
  let fixedCount = 0;
  
  remainingErrorFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      if (fixAllRemainingErrors(fullPath)) {
        fixedCount++;
      }
    }
  });
  
  console.log(`\n✅ Finalizado! Corrigidos ${fixedCount} arquivos.`);
}

main();