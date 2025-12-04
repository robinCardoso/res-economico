/**
 * Script para verificar de onde vêm as descrições das classificações "2" e "3"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarDescricoes() {
  console.log('🔍 Verificando descrições para classificações "2" e "3"\n');

  // 1. Verificar no catálogo (ContaCatalogo)
  console.log('📚 1. Buscando no CATÁLOGO (ContaCatalogo):');
  const contasCatalogo = await prisma.contaCatalogo.findMany({
    where: {
      OR: [
        { classificacao: '2' },
        { classificacao: '3' },
        { classificacao: '2.' },
        { classificacao: '3.' },
        { classificacao: { startsWith: '2.' } },
        { classificacao: { startsWith: '3.' } },
      ],
    },
    select: {
      classificacao: true,
      conta: true,
      subConta: true,
      nomeConta: true,
      tipoConta: true,
      nivel: true,
    },
    take: 20,
  });

  if (contasCatalogo.length > 0) {
    console.log(`   ✅ Encontradas ${contasCatalogo.length} contas no catálogo:`);
    for (const conta of contasCatalogo) {
      console.log(`      - ${conta.classificacao} | ${conta.conta || '(sem conta)'} | ${conta.subConta || '(sem subConta)'} | ${conta.nomeConta} | ${conta.tipoConta} | Nível ${conta.nivel}`);
    }
  } else {
    console.log('   ❌ Nenhuma conta encontrada no catálogo');
  }

  console.log('\n');

  // 2. Verificar nos uploads (LinhaUpload)
  console.log('📊 2. Buscando nos UPLOADS (LinhaUpload):');
  const linhasUpload = await prisma.linhaUpload.findMany({
    where: {
      OR: [
        { classificacao: '2' },
        { classificacao: '3' },
        { classificacao: '2.' },
        { classificacao: '3.' },
        { classificacao: { startsWith: '2.' } },
        { classificacao: { startsWith: '3.' } },
      ],
    },
    select: {
      classificacao: true,
      conta: true,
      subConta: true,
      nomeConta: true,
      tipoConta: true,
      nivel: true,
      uploadId: true,
    },
    distinct: ['classificacao', 'conta', 'subConta', 'nomeConta'],
    take: 20,
  });

  if (linhasUpload.length > 0) {
    console.log(`   ✅ Encontradas ${linhasUpload.length} linhas nos uploads:`);
    for (const linha of linhasUpload) {
      console.log(`      - ${linha.classificacao} | ${linha.conta || '(sem conta)'} | ${linha.subConta || '(sem subConta)'} | ${linha.nomeConta} | ${linha.tipoConta} | Nível ${linha.nivel}`);
    }
  } else {
    console.log('   ❌ Nenhuma linha encontrada nos uploads');
  }

  console.log('\n');

  // 3. Verificar especificamente classificações exatas "2" e "3"
  console.log('🎯 3. Buscando classificações EXATAS "2" e "3":');
  
  const classificacao2 = await prisma.linhaUpload.findFirst({
    where: {
      classificacao: '2',
    },
    select: {
      classificacao: true,
      conta: true,
      subConta: true,
      nomeConta: true,
      tipoConta: true,
      nivel: true,
    },
  });

  const classificacao3 = await prisma.linhaUpload.findFirst({
    where: {
      classificacao: '3',
    },
    select: {
      classificacao: true,
      conta: true,
      subConta: true,
      nomeConta: true,
      tipoConta: true,
      nivel: true,
    },
  });

  if (classificacao2) {
    console.log(`   ✅ Classificação "2" encontrada: ${classificacao2.nomeConta} (${classificacao2.tipoConta})`);
  } else {
    console.log('   ❌ Classificação "2" NÃO encontrada nos uploads');
  }

  if (classificacao3) {
    console.log(`   ✅ Classificação "3" encontrada: ${classificacao3.nomeConta} (${classificacao3.tipoConta})`);
  } else {
    console.log('   ❌ Classificação "3" NÃO encontrada nos uploads');
  }

  console.log('\n');

  // 4. Verificar no catálogo com classificações exatas
  const cat2 = await prisma.contaCatalogo.findFirst({
    where: {
      classificacao: '2',
    },
  });

  const cat3 = await prisma.contaCatalogo.findFirst({
    where: {
      classificacao: '3',
    },
  });

  console.log('📚 4. Buscando no CATÁLOGO com classificações EXATAS "2" e "3":');
  if (cat2) {
    console.log(`   ✅ Classificação "2" no catálogo: ${cat2.nomeConta} (${cat2.tipoConta})`);
  } else {
    console.log('   ❌ Classificação "2" NÃO encontrada no catálogo');
  }

  if (cat3) {
    console.log(`   ✅ Classificação "3" no catálogo: ${cat3.nomeConta} (${cat3.tipoConta})`);
  } else {
    console.log('   ❌ Classificação "3" NÃO encontrada no catálogo');
  }
}

async function main() {
  try {
    await verificarDescricoes();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

