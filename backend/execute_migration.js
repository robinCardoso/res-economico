const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function executeMigration() {
  try {
    console.log('=== EXECUTANDO MIGRAÇÃO DAS TABELAS DE ATAS ===\n');

    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('./direct_migration_test.sql', 'utf-8');

    console.log('Executando script SQL completo...\n');

    // Executar o script inteiro de uma vez
    await prisma.$executeRawUnsafe(sqlScript);

    console.log('✓ Script executado com sucesso!\n');

    console.log('=== VERIFICANDO RESULTADO ===\n');

    // Verificar tabelas criadas
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log(`Total de tabelas no banco: ${tables.length}\n`);

    // Verificar tabelas de atas especificamente
    const ataTables = [
      'AtaReuniao',
      'AtaParticipante',
      'AtaAnexo',
      'AtaComentario',
      'ModeloAta',
      'HistoricoAndamento',
      'PrazoAcao',
      'LembretePrazo'
    ];

    console.log('Status das tabelas de Atas:');
    const existingTables = tables.map(t => t.table_name);
    let createdCount = 0;
    
    ataTables.forEach(table => {
      const exists = existingTables.includes(table);
      if (exists) {
        console.log(`  ✓ ${table}`);
        createdCount++;
      } else {
        console.log(`  ✗ ${table}`);
      }
    });

    if (createdCount === ataTables.length) {
      console.log(`\n✅ SUCESSO! Todas as ${createdCount} tabelas de Atas foram criadas com sucesso!`);
    } else {
      console.log(`\n⚠️ AVISO: Apenas ${createdCount}/${ataTables.length} tabelas foram criadas`);
    }

  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:');
    console.error(error.message);
    if (error.code) {
      console.error(`Código de erro: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executeMigration();
