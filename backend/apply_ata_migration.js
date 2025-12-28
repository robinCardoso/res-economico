const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyAtaMigrations() {
  try {
    console.log('=== APLICANDO MIGRAÇÕES DE ATAS ===\n');

    // Ler o arquivo SQL corrigido
    const sqlPath = path.join(__dirname, 'prisma/migrations/20251226000000_create_ata_reuniao_tables/migration_fixed.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo não encontrado: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executando migration de atas...\n');

    // Executar o SQL
    const result = await prisma.$executeRawUnsafe(sqlContent);

    console.log('✅ Migration de atas executada com sucesso!\n');

    // Verificar se as tabelas foram criadas
    console.log('Verificando tabelas criadas...\n');

    const tables = [
      'AtaReuniao',
      'AtaParticipante',
      'AtaAnexo',
      'AtaComentario',
      'ModeloAta',
      'HistoricoAndamento',
      'PrazoAcao',
      'LembretePrazo'
    ];

    const createdTables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name = ANY(ARRAY[${tables.join("','")}]::text[])
      ORDER BY table_name
    `;

    console.log(`Tabelas de atas criadas: ${createdTables.length}/8\n`);
    createdTables.forEach(t => {
      console.log(`  ✓ ${t.table_name}`);
    });

    // Verificar enums
    console.log('\nVerificando enums criados...\n');

    const enums = await prisma.$queryRaw`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      AND t.typtype = 'e'
      AND t.typname IN ('TipoReuniao', 'StatusAta', 'StatusPrazo', 'TipoLembrete', 'TipoArquivoAta', 'TipoComentario')
      ORDER BY t.typname
    `;

    console.log(`Enums de atas criados: ${enums.length}/6\n`);
    enums.forEach(e => {
      console.log(`  ✓ ${e.enum_name}`);
    });

    console.log('\n=== RESULTADO FINAL ===\n');
    
    if (createdTables.length === 8 && enums.length === 6) {
      console.log('✅ SUCESSO! Todas as tabelas e enums de atas foram criados corretamente!');
      console.log('\nPróximos passos:');
      console.log('1. Regenerar Prisma Client: npx prisma generate');
      console.log('2. Compilar TypeScript: npx tsc --noEmit');
      console.log('3. Iniciar servidor: npm run start');
    } else {
      console.log(`⚠️ PARCIAL: ${createdTables.length} tabelas e ${enums.length} enums criados`);
      console.log('Verifique os logs acima para mais detalhes');
    }

  } catch (error) {
    console.error('\n❌ ERRO ao aplicar migration de atas:');
    console.error(error.message);
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyAtaMigrations();
