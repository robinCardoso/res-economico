import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function aplicarMigration() {
  console.log('🔄 Aplicando migration para unificar catálogo de contas...');

  try {
    // Step 1: Remover foreign key
    console.log('  - Removendo foreign key...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ContaCatalogo" DROP CONSTRAINT IF EXISTS "ContaCatalogo_empresaId_fkey";
    `);

    // Step 2: Remover coluna empresaId
    console.log('  - Removendo coluna empresaId...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ContaCatalogo" DROP COLUMN IF EXISTS "empresaId";
    `);

    // Step 3: Adicionar índice único em classificacao
    console.log('  - Adicionando índice único em classificacao...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ContaCatalogo_classificacao_key" ON "ContaCatalogo"("classificacao");
    `);

    console.log('✅ Migration aplicada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  }
}

aplicarMigration()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

