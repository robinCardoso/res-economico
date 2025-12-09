import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarResumo() {
  try {
    const resumoId = '0197c0a6-e4d6-4d11-95d1-de1e4ec36d29';
    
    console.log('🔍 Verificando resumo...');
    
    // Buscar o resumo específico
    const resumo = await prisma.resumoEconomico.findUnique({
      where: { id: resumoId },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            filial: true,
          },
        },
        criador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!resumo) {
      console.log('❌ Resumo não encontrado');
      return;
    }

    console.log('\n📊 Dados do resumo:');
    console.log(`   ID: ${resumo.id}`);
    console.log(`   Título: ${resumo.titulo}`);
    console.log(`   Ano: ${resumo.ano}`);
    console.log(`   Mês: ${resumo.mes || 'null'}`);
    console.log(`   Status: ${resumo.status}`);
    console.log(`   Tipo: ${resumo.tipoAnalise}`);
    console.log(`   Empresa: ${resumo.empresa?.filial || resumo.empresa?.razaoSocial || 'null'}`);
    console.log(`   Criado por: ${resumo.criador?.nome || resumo.criador?.email || 'null'}`);
    console.log(`   Criado em: ${resumo.createdAt}`);

    // Testar query sem filtros
    console.log('\n🔍 Testando query sem filtros...');
    const todosResumos = await prisma.resumoEconomico.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   Total encontrado: ${todosResumos.length}`);
    todosResumos.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo} (${r.ano}, ${r.status})`);
    });

    // Testar query com filtro de ano
    console.log('\n🔍 Testando query com filtro ano=2025...');
    const resumos2025 = await prisma.resumoEconomico.findMany({
      where: { ano: 2025 },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   Total encontrado: ${resumos2025.length}`);
    resumos2025.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo} (${r.ano}, ${r.status})`);
    });

    // Testar query com filtro de status
    console.log('\n🔍 Testando query com filtro status=CONCLUIDO...');
    const resumosConcluidos = await prisma.resumoEconomico.findMany({
      where: { status: 'CONCLUIDO' },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   Total encontrado: ${resumosConcluidos.length}`);
    resumosConcluidos.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo} (${r.ano}, ${r.status})`);
    });

    // Testar query com filtro de tipo
    console.log('\n🔍 Testando query com filtro tipoAnalise=COMPARATIVO...');
    const resumosComparativos = await prisma.resumoEconomico.findMany({
      where: { tipoAnalise: 'COMPARATIVO' },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`   Total encontrado: ${resumosComparativos.length}`);
    resumosComparativos.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo} (${r.ano}, ${r.status})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificarResumo()
  .then(() => {
    console.log('\n✅ Verificação concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

