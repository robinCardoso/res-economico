import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Testando conexão com o banco de dados...\n');

  try {
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar qual banco está conectado
    const dbInfo = await prisma.$queryRaw<Array<{ current_database: string; current_user: string }>>`
      SELECT current_database(), current_user;
    `;
    
    if (dbInfo && dbInfo.length > 0) {
      console.log(`\n📊 Informações do banco:`);
      console.log(`   Banco: ${dbInfo[0].current_database}`);
      console.log(`   Usuário: ${dbInfo[0].current_user}`);
      
      // Verificar se é o banco correto
      if (dbInfo[0].current_database === 'painel_rede_uniao_db') {
        console.log('   ✅ Banco correto!');
      } else {
        console.log('   ⚠️ ATENÇÃO: Banco diferente do esperado!');
        console.log('   Esperado: painel_rede_uniao_db');
      }
    }

    // Testar se consegue fazer queries
    console.log('\n🔍 Testando queries...');
    
    const uploadCount = await prisma.upload.count();
    console.log(`   ✅ Uploads encontrados: ${uploadCount}`);

    const linhasCount = await prisma.linhaUpload.count({
      where: {
        conta: '745',
        nomeConta: {
          contains: 'Resultado do Exercício',
          mode: 'insensitive',
        },
      },
    });
    console.log(`   ✅ Linhas com conta 745 encontradas: ${linhasCount}`);

    const empresasCount = await prisma.empresa.count();
    console.log(`   ✅ Empresas encontradas: ${empresasCount}`);

    // Verificar contas mais comuns
    console.log('\n🔍 Verificando contas mais comuns...');
    const contasAgrupadas = await prisma.linhaUpload.groupBy({
      by: ['conta'],
      _count: { conta: true },
      orderBy: { _count: { conta: 'desc' } },
      take: 10,
    });
    console.log('   Top 10 contas:');
    contasAgrupadas.forEach((c) => {
      console.log(`     ${c.conta || '(vazio)'}: ${c._count.conta} linhas`);
    });

    // Verificar linhas que podem ser 745
    console.log('\n🔍 Verificando linhas que podem ser conta 745...');
    const linhasPossiveis745 = await prisma.linhaUpload.findMany({
      where: {
        OR: [
          { conta: { contains: '745' } },
          { nomeConta: { contains: 'Resultado', mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        conta: true,
        nomeConta: true,
        saldoAtual: true,
        uploadId: true,
      },
    });
    console.log(`   Linhas encontradas: ${linhasPossiveis745.length}`);
    if (linhasPossiveis745.length > 0) {
      linhasPossiveis745.forEach((l) => {
        console.log(
          `     Conta: ${l.conta}, Nome: ${l.nomeConta?.substring(0, 50)}`,
        );
      });
    }

    // Testar query específica do dashboard
    console.log('\n🔍 Testando query do dashboard (conta 745)...');
    const uploads = await prisma.upload.findMany({
      where: {
        status: {
          in: ['CONCLUIDO', 'COM_ALERTAS'],
        },
      },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
          },
        },
        linhas: {
          where: {
            conta: '745',
            nomeConta: {
              contains: 'Resultado do Exercício',
              mode: 'insensitive',
            },
          },
        },
      },
      take: 5,
    });

    console.log(`   ✅ Uploads processados encontrados: ${uploads.length}`);
    
    if (uploads.length > 0) {
      const totalLinhas = uploads.reduce((sum, u) => sum + u.linhas.length, 0);
      const totalValor = uploads.reduce((sum, u) => {
        const valorUpload = u.linhas.reduce((s, l) => s + Number(l.saldoAtual || 0), 0);
        return sum + valorUpload;
      }, 0);
      
      console.log(`   ✅ Total de linhas 745: ${totalLinhas}`);
      console.log(`   ✅ Soma dos valores: ${totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
      
      console.log('\n📋 Exemplo de upload:');
      const exemplo = uploads[0];
      console.log(`   - ID: ${exemplo.id}`);
      console.log(`   - Empresa: ${exemplo.empresa.razaoSocial}`);
      console.log(`   - Período: ${exemplo.mes}/${exemplo.ano}`);
      console.log(`   - Status: ${exemplo.status}`);
      console.log(`   - Linhas 745: ${exemplo.linhas.length}`);
    } else {
      console.log('   ⚠️ Nenhum upload processado encontrado!');
      console.log('   💡 Isso pode explicar por que o dashboard não mostra dados.');
    }

    console.log('\n✅ Todos os testes passaram!\n');
  } catch (error) {
    console.error('\n❌ Erro ao testar conexão:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

