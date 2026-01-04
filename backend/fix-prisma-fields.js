const fs = require('fs');
const path = require('path');

// Função para encontrar todos os arquivos .ts recursivamente
function findTsFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        findTsFiles(filePath, fileList);
      } else if (stat.isFile() && file.endsWith('.ts')) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error.message);
  }
  
  return fileList;
}

// Função para corrigir erros TS2353 - campos inexistentes no Prisma
function fixPrismaFieldErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corrigir campo referencia_id_prod (constraint composta inexistente)
    const fixes = [
      // Substituir referencia_id_prod por busca separada
      {
        pattern: /referencia_id_prod:\s*{\s*referencia:\s*([^,]+),\s*id_prod:\s*([^}]+)\s*}/g,
        replacement: (match, referencia, idProd) => {
          return `referencia: ${referencia.trim()},\n          id_prod: ${idProd.trim()}`;
        }
      },
      // Corrigir acesso a razaoSocial em UsuarioCliente (campo não existe)
      {
        pattern: /razaoSocial:\s*\(dto as any\)\.razaoSocial/g,
        replacement: "// razaoSocial: (dto as any).razaoSocial // Campo não existe no schema"
      }
    ];
    
    fixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        if (typeof replacement === 'string') {
          content = content.replace(pattern, replacement);
        } else {
          // Para funções de substituição
          content = content.replace(pattern, replacement);
        }
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
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('Diretório src não encontrado!');
    return;
  }
  
  console.log('🔧 Corrigindo erros TS2353 - campos inexistentes no Prisma...');
  
  // Arquivos específicos que sabemos ter problemas
  const problematicFiles = [
    'src/pedidos/pedidos-update.service.ts',
    'src/usuarios/usuarios-clientes.service.ts',
    'src/vendas/vendas-update.service.ts'
  ];
  
  let fixedCount = 0;
  
  problematicFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      if (fixPrismaFieldErrors(fullPath)) {
        fixedCount++;
      }
    }
  });
  
  console.log(`\n✅ Finalizado! Corrigidos ${fixedCount} arquivos.`);
}

main();