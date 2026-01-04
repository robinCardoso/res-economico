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

// Função para corrigir imports de bibliotecas externas específicas
function fixRemainingLibraryImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corrigir imports específicos que ainda estão errados
    const fixes = [
      // Reverter imports de class-transformer
      {
        pattern: /(import\s+{[^}]+}\s+from\s+')\.\/(class-transformer)(')/g,
        replacement: "$1$2$3"
      },
      // Reverter imports de dotenv
      {
        pattern: /(import\s+{[^}]+}\s+from\s+')\.\/(dotenv)(')/g,
        replacement: "$1$2$3"
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
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('Diretório src não encontrado!');
    return;
  }
  
  console.log('🔧 Corrigindo imports de bibliotecas externas restantes...');
  
  // Encontrar todos os arquivos TypeScript
  const tsFiles = findTsFiles(srcDir);
  
  let fixedCount = 0;
  
  tsFiles.forEach(filePath => {
    if (fixRemainingLibraryImports(filePath)) {
      fixedCount++;
    }
  });
  
  console.log(`\n✅ Finalizado! Corrigidos ${fixedCount} arquivos.`);
}

main();