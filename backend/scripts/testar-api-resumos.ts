import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarApiResumos() {
  try {
    // Buscar o resumo
    const resumo = await prisma.resumoEconomico.findUnique({
      where: { id: '0197c0a6-e4d6-4d11-95d1-de1e4ec36d29' },
      select: { criadoPor: true },
    });

    if (!resumo) {
      console.log('❌ Resumo não encontrado');
      return;
    }

    console.log(`📝 Resumo criado por userId: ${resumo.criadoPor}`);

    // Buscar todos os usuários
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true },
    });

    console.log('\n👥 Usuários no sistema:');
    usuarios.forEach((u) => {
      const isCriador = u.id === resumo.criadoPor;
      console.log(`   ${isCriador ? '→' : ' '} ${u.nome || u.email} (${u.id})${isCriador ? ' [CRIADOR DO RESUMO]' : ''}`);
    });

    // Testar query com userId do criador
    console.log('\n🔍 Testando query COM userId do criador...');
    const comUserId = await prisma.resumoEconomico.findMany({
      where: { criadoPor: resumo.criadoPor },
      take: 10,
    });
    console.log(`   Total encontrado: ${comUserId.length}`);

    // Testar query sem userId (como admin)
    console.log('\n🔍 Testando query SEM userId (admin)...');
    const semUserId = await prisma.resumoEconomico.findMany({
      take: 10,
    });
    console.log(`   Total encontrado: ${semUserId.length}`);

    // Verificar se o usuário criador existe
    const criador = await prisma.usuario.findUnique({
      where: { id: resumo.criadoPor },
    });

    if (!criador) {
      console.log('\n⚠️ ATENÇÃO: O usuário criador do resumo não existe mais!');
      console.log(`   Isso pode causar problemas na listagem.`);
    } else {
      console.log(`\n✅ Usuário criador existe: ${criador.nome || criador.email}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testarApiResumos()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

