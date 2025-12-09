import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removerIndiceAntigo() {
  console.log('🔍 Removendo índice único antigo de VendaAnalytics...');

  try {
    // Remover o índice antigo
    await prisma.$executeRawUnsafe(
      `DROP INDEX IF EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key"`,
    );
    console.log('✅ Índice antigo removido');

    // Verificar índices restantes
    const indices = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'VendaAnalytics'
      AND indexdef LIKE '%UNIQUE%'
      ORDER BY indexname
    `;

    console.log(`\n📋 Índices únicos restantes: ${indices.length}`);
    indices.forEach((idx) => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });

    console.log('\n✅ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removerIndiceAntigo();

