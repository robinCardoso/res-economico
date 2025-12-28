const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('=== VERIFICAÇÃO DE TABELAS ===\n');

    const result = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log('Tabelas encontradas:');
    result.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log(`\nTotal: ${result.length} tabelas\n`);

    // Verificar especificamente as tabelas de atas
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
    const existingTables = result.map(r => r.table_name);
    ataTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    });

  } catch (error) {
    console.error('ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
