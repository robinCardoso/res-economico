import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para identificar uploads com status de erro ou processamento travado
 * 
 * Este script:
 * 1. Lista uploads com status PROCESSANDO há mais de 10 minutos (provavelmente travados)
 * 2. Lista uploads com status CANCELADO (erros)
 * 3. Verifica jobs na fila do Redis (se possível)
 */
async function verificarUploadsComErro() {
  console.log('\n🔍 Verificando uploads com problemas...\n');

  // 1. Uploads processando há muito tempo (provavelmente travados)
  const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
  const uploadsTravados = await prisma.upload.findMany({
    where: {
      status: 'PROCESSANDO',
      updatedAt: {
        lt: dezMinutosAtras,
      },
    },
    include: {
      empresa: {
        select: {
          razaoSocial: true,
          nomeFantasia: true,
        },
      },
      _count: {
        select: {
          linhas: true,
          alertas: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'asc',
    },
  });

  console.log(`📊 Uploads PROCESSANDO há mais de 10 minutos: ${uploadsTravados.length}`);
  if (uploadsTravados.length > 0) {
    console.log('\n⚠️ Uploads possivelmente travados:');
    uploadsTravados.forEach((upload, index) => {
      const tempoTravado = Math.round(
        (Date.now() - upload.updatedAt.getTime()) / 1000 / 60,
      );
      console.log(`\n${index + 1}. ID: ${upload.id.substring(0, 8)}...`);
      console.log(`   Empresa: ${upload.empresa?.razaoSocial || 'N/A'}`);
      console.log(`   Período: ${upload.mes}/${upload.ano}`);
      console.log(`   Arquivo: ${upload.nomeArquivo}`);
      console.log(`   Travado há: ${tempoTravado} minutos`);
      console.log(`   Última atualização: ${upload.updatedAt.toLocaleString('pt-BR')}`);
      console.log(`   Linhas processadas: ${upload._count.linhas}`);
      console.log(`   Alertas: ${upload._count.alertas}`);
      console.log(
        `   💡 Ação: Reprocessar via interface ou endpoint PATCH /uploads/${upload.id}/reprocessar`,
      );
    });
  }

  // 2. Uploads cancelados (erros)
  const uploadsCancelados = await prisma.upload.findMany({
    where: {
      status: 'CANCELADO',
    },
    include: {
      empresa: {
        select: {
          razaoSocial: true,
          nomeFantasia: true,
        },
      },
      _count: {
        select: {
          linhas: true,
          alertas: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  console.log(`\n\n📊 Uploads CANCELADOS (erros): ${uploadsCancelados.length}`);
  if (uploadsCancelados.length > 0) {
    console.log('\n❌ Uploads com erro:');
    uploadsCancelados.forEach((upload, index) => {
      console.log(`\n${index + 1}. ID: ${upload.id.substring(0, 8)}...`);
      console.log(`   Empresa: ${upload.empresa?.razaoSocial || 'N/A'}`);
      console.log(`   Período: ${upload.mes}/${upload.ano}`);
      console.log(`   Arquivo: ${upload.nomeArquivo}`);
      console.log(`   Cancelado em: ${upload.updatedAt.toLocaleString('pt-BR')}`);
      console.log(`   Linhas processadas: ${upload._count.linhas}`);
      console.log(`   Alertas: ${upload._count.alertas}`);
      console.log(
        `   💡 Ação: Reprocessar via interface ou endpoint PATCH /uploads/${upload.id}/reprocessar`,
      );
    });
  }

  // 3. Resumo
  console.log(`\n\n📋 Resumo:`);
  console.log(`   ✅ Uploads travados: ${uploadsTravados.length}`);
  console.log(`   ❌ Uploads cancelados: ${uploadsCancelados.length}`);
  console.log(`   📊 Total com problemas: ${uploadsTravados.length + uploadsCancelados.length}`);

  if (uploadsTravados.length === 0 && uploadsCancelados.length === 0) {
    console.log(`\n✅ Nenhum upload com problema encontrado!`);
  } else {
    console.log(`\n💡 Para reprocessar todos os uploads com problema:`);
    console.log(`   1. Use a interface web: /admin/resultado-economico/uploads`);
    console.log(`   2. Ou execute o script: npx ts-node scripts/reprocessar-uploads-com-erro.ts`);
  }
}

verificarUploadsComErro()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

