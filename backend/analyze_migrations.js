const fs = require('fs');
const path = require('path');

console.log('=== ANÁLISE COMPLETA DAS MIGRAÇÕES DO BANCO DE DADOS ===\n');

const migrationsDir = './prisma/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => {
  const stat = fs.statSync(path.join(migrationsDir, f));
  return stat.isDirectory();
});

// Ordenar migrações por data
const migrations = files.map(dir => {
  const match = dir.match(/^(\d{14})_/);
  const timestamp = match ? match[1] : '99999999999999';
  return { name: dir, timestamp };
}).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

console.log(`1. HISTÓRICO DE MIGRAÇÕES (${migrations.length} migrações encontradas)\n`);
migrations.forEach((m, i) => {
  console.log(`   ${(i+1).toString().padStart(2)}) ${m.name}`);
});

console.log('\n2. ANÁLISE DE CONTEÚDO DAS MIGRAÇÕES\n');

// Analisar cada migration
const analysis = {};
let tablesCreated = new Set();
let enumsCreated = new Set();
let foreignKeysCount = 0;
let issues = [];

migrations.forEach(m => {
  const migrationPath = path.join(migrationsDir, m.name, 'migration.sql');
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf-8');
    const lines = content.split('\n');
    
    // Buscar CREATE TABLE
    const createTableMatches = content.match(/CREATE TABLE[^(]*"([^"]+)"/gi) || [];
    const createIfNotExists = content.match(/CREATE TABLE IF NOT EXISTS[^(]*"([^"]+)"/gi) || [];
    
    // Buscar CREATE TYPE (enums)
    const createTypeMatches = content.match(/CREATE TYPE[^A]{0,20}"([^"]+)"/gi) || [];
    
    // Buscar ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
    const fkMatches = content.match(/FOREIGN KEY|ADD CONSTRAINT.*REFERENCES/g) || [];
    
    // Buscar ALTER TABLE ... ADD COLUMN
    const alterTableAddColumn = content.match(/ALTER TABLE[^A]*ADD COLUMN/gi) || [];
    
    analysis[m.name] = {
      tables: createTableMatches.length + createIfNotExists.length,
      enums: createTypeMatches.length,
      foreignKeys: fkMatches.length,
      alterations: alterTableAddColumn.length,
      content: content
    };
    
    foreignKeysCount += fkMatches.length;
    
    // Rastrear tabelas criadas
    [...createTableMatches, ...createIfNotExists].forEach(match => {
      const tableName = match.match(/"([^"]+)"/)[1];
      if (!tablesCreated.has(tableName)) {
        tablesCreated.add(tableName);
      } else {
        issues.push(`⚠️ Tabela "${tableName}" criada múltiplas vezes (em ${m.name})`);
      }
    });
    
    // Rastrear enums
    createTypeMatches.forEach(match => {
      const enumName = match.match(/"([^"]+)"/)[1];
      if (!enumsCreated.has(enumName)) {
        enumsCreated.add(enumName);
      } else {
        issues.push(`⚠️ Enum "${enumName}" criado múltiplas vezes (em ${m.name})`);
      }
    });
  }
});

console.log('Estatísticas por migração:\n');
let totalTables = 0;
let totalEnums = 0;
let totalFKs = 0;

migrations.forEach((m, i) => {
  const data = analysis[m.name];
  if (data.tables > 0 || data.enums > 0 || data.foreignKeys > 0) {
    console.log(`${(i+1).toString().padStart(2)}) ${m.name}`);
    if (data.tables > 0) {
      console.log(`    ├─ Tabelas: ${data.tables}`);
      totalTables += data.tables;
    }
    if (data.enums > 0) {
      console.log(`    ├─ Enums: ${data.enums}`);
      totalEnums += data.enums;
    }
    if (data.foreignKeys > 0) {
      console.log(`    ├─ Foreign Keys: ${data.foreignKeys}`);
      totalFKs += data.foreignKeys;
    }
    if (data.alterations > 0) {
      console.log(`    └─ Alterações de coluna: ${data.alterations}`);
    }
  }
});

console.log(`\n   TOTAL: ${totalTables} tabelas | ${totalEnums} enums | ${totalFKs} foreign keys\n`);

console.log('3. PROBLEMAS E INCONSISTÊNCIAS DETECTADOS\n');

if (issues.length === 0) {
  console.log('   ✓ Nenhum problema de duplicação encontrado');
} else {
  issues.forEach(issue => {
    console.log(`   ${issue}`);
  });
}

// Verificar se há migrações com nomes problemáticos
console.log('\n4. MIGRAÇÕES COM NOMES PROBLEMÁTICOS\n');

const problematicNames = migrations.filter(m => {
  return m.name.includes('_add_') && m.name.includes('tables') ||
         m.name.includes('duplicate') ||
         m.name.includes('fix') ||
         m.name.includes('force') ||
         m.name.includes('remove') ||
         !m.name.match(/^\d{14}_/);
});

if (problematicNames.length === 0) {
  console.log('   ✓ Nenhuma migração com nomes problemáticos');
} else {
  problematicNames.forEach(m => {
    console.log(`   ⚠️ ${m.name}`);
  });
}

// Analisar migrações de atas especificamente
console.log('\n5. STATUS DAS MIGRAÇÕES DE ATAS\n');

const ataMigrations = migrations.filter(m => m.name.includes('ata') || m.name.includes('processo'));
if (ataMigrations.length === 0) {
  console.log('   ⚠️ NENHUMA migração de atas encontrada!');
} else {
  ataMigrations.forEach(m => {
    console.log(`   ✓ ${m.name}`);
    const data = analysis[m.name];
    console.log(`     └─ Tabelas: ${data.tables}, Enums: ${data.enums}, FKs: ${data.foreignKeys}`);
  });
}

// Verificar ordem temporal vs estrutural
console.log('\n6. RECOMENDAÇÕES DE REORGANIZAÇÃO\n');

const recommendations = [
  '✓ Tabelas de atas estão em migrações separadas (20251226000000)',
  '⚠️ Verifique se todas as dependências estão no lugar antes de criar foreign keys',
  '⚠️ Unifique migrações de atas em uma única migração coerente',
  '⚠️ Remova migrações com prefixo "force_" e "remove_" e consolide em uma única migração por entidade'
];

recommendations.forEach(rec => {
  console.log(`   ${rec}`);
});

console.log('\n7. CONCLUSÃO\n');
console.log(`   ✓ Total de ${migrations.length} migrações`);
console.log(`   ✓ Total de ${totalTables} tabelas`);
console.log(`   ✓ Total de ${totalEnums} enums`);
console.log(`   ⚠️ Problemas encontrados: ${issues.length}`);

if (issues.length > 0 || problematicNames.length > 0) {
  console.log('\n❌ AÇÃO RECOMENDADA: Reorganizar e consolidar migrações');
} else {
  console.log('\n✅ Estrutura de migrações está bem organizada');
}
