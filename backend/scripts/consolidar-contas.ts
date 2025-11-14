import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function consolidarContas() {
  console.log('🔍 Verificando contas duplicadas...');

  // Encontrar contas duplicadas
  const duplicatas = await prisma.$queryRaw<Array<{ classificacao: string; count: bigint }>>`
    SELECT classificacao, COUNT(*) as count
    FROM "ContaCatalogo"
    GROUP BY classificacao
    HAVING COUNT(*) > 1
  `;

  if (duplicatas.length === 0) {
    console.log('✅ Nenhuma conta duplicada encontrada!');
    return;
  }

  console.log(`⚠️  Encontradas ${duplicatas.length} classificações com contas duplicadas`);

  // Para cada classificação duplicada, manter apenas a conta com a última importação mais recente
  for (const dup of duplicatas) {
    const contas = await prisma.contaCatalogo.findMany({
      where: { classificacao: dup.classificacao },
      orderBy: [
        { ultimaImportacao: 'desc' },
        { primeiraImportacao: 'desc' },
      ],
    });

    // Manter a primeira (mais recente) e deletar as outras
    const contasParaDeletar = contas.slice(1);
    
    if (contasParaDeletar.length > 0) {
      await prisma.contaCatalogo.deleteMany({
        where: {
          id: { in: contasParaDeletar.map((c) => c.id) },
        },
      });
      console.log(`  ✓ Consolidada classificação ${dup.classificacao}: mantida 1, removidas ${contasParaDeletar.length}`);
    }
  }

  // Verificar novamente
  const duplicatasFinais = await prisma.$queryRaw<Array<{ classificacao: string; count: bigint }>>`
    SELECT classificacao, COUNT(*) as count
    FROM "ContaCatalogo"
    GROUP BY classificacao
    HAVING COUNT(*) > 1
  `;

  if (duplicatasFinais.length === 0) {
    console.log('✅ Consolidação concluída! Todas as contas estão únicas.');
  } else {
    console.error(`❌ Ainda existem ${duplicatasFinais.length} classificações duplicadas!`);
  }
}

consolidarContas()
  .catch((e) => {
    console.error('Erro ao consolidar contas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

