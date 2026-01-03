import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function aplicarIndices() {
  console.log('=== Aplicando Índices de Otimização ===\n');

  try {
    // Índice 1: status + ano
    console.log('1. Criando índice Upload_status_ano_idx...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Upload_status_ano_idx" ON "Upload"("status", "ano");
    `);
    console.log('   ✓ Índice criado com sucesso\n');

    // Índice 2: ano + mês
    console.log('2. Criando índice Upload_ano_mes_idx...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Upload_ano_mes_idx" ON "Upload"("ano", "mes");
    `);
    console.log('   ✓ Índice criado com sucesso\n');

    // Índice 3: empresaId + ano + mês
    console.log('3. Criando índice Upload_empresaId_ano_mes_idx...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Upload_empresaId_ano_mes_idx" ON "Upload"("empresaId", "ano", "mes");
    `);
    console.log('   ✓ Índice criado com sucesso\n');

    // Índice 4: status + empresaId + ano
    console.log('4. Criando índice Upload_status_empresaId_ano_idx...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Upload_status_empresaId_ano_idx" ON "Upload"("status", "empresaId", "ano");
    `);
    console.log('   ✓ Índice criado com sucesso\n');

    // Verificar índices criados
    console.log('=== Verificando Índices Criados ===\n');
    const indices = await prisma.$queryRawUnsafe(`
      SELECT 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Upload' 
        AND indexname LIKE 'Upload_%_idx'
      ORDER BY indexname;
    `);

    console.log(`Total de índices encontrados: ${indices.length}\n`);
    indices.forEach((idx, i) => {
      console.log(`${i + 1}. ${idx.indexname}`);
    });

    console.log('\n✅ Todos os índices foram aplicados com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao aplicar índices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

aplicarIndices();

