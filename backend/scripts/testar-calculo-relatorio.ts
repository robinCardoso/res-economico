/**
 * Script para testar a lógica de cálculo do relatório e identificar o problema de sinal
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarCalculo() {
  const uploadId = 'd56290b7-4b32-4f8a-96be-4c266b68c8a7';
  
  console.log(`🧪 Testando lógica de cálculo para upload: ${uploadId}\n`);

  // Buscar a linha específica
  const linha = await prisma.linhaUpload.findFirst({
    where: {
      uploadId,
      saldoAtual: {
        gte: 66.33,
        lte: 66.35,
      },
    },
  });

  if (!linha) {
    console.log('❌ Linha não encontrada');
    return;
  }

  console.log('📊 Dados da linha:');
  console.log(`  Classificação: ${linha.classificacao}`);
  console.log(`  Conta: ${linha.conta}`);
  console.log(`  Nome: ${linha.nomeConta}`);
  console.log(`  Tipo Conta: ${linha.tipoConta}`);
  console.log(`  Saldo Anterior: ${linha.saldoAnterior}`);
  console.log(`  Débito: ${linha.debito}`);
  console.log(`  Crédito: ${linha.credito}`);
  console.log(`  Saldo Atual: ${linha.saldoAtual}\n`);

  // Simular a lógica do relatório
  console.log('🔍 Simulando lógica do relatório:\n');

  const debito = Number(linha.debito) || 0;
  const credito = Number(linha.credito) || 0;
  let valorLinha = credito + debito;

  console.log(`1. valorLinha = credito + debito`);
  console.log(`   valorLinha = ${credito} + ${debito} = ${valorLinha}\n`);

  // Verificar se é despesa/custo
  const nomeConta = (linha.nomeConta || '').toUpperCase();
  const isDespesaCusto =
    nomeConta.includes('(-)') ||
    nomeConta.includes('DEDUÇÃO') ||
    nomeConta.includes('DEDUÇÕES') ||
    nomeConta.includes('CUSTO') ||
    nomeConta.includes('DESPESA') ||
    nomeConta.startsWith('(-');

  console.log(`2. Verificando se é despesa/custo:`);
  console.log(`   Nome: ${linha.nomeConta}`);
  console.log(`   É despesa/custo? ${isDespesaCusto}\n`);

  // Usar saldoAtual como referência
  const saldoAtual = Number(linha.saldoAtual) || 0;
  console.log(`3. Verificando sinal do saldoAtual:`);
  console.log(`   saldoAtual = ${saldoAtual}`);
  console.log(`   saldoAtual é negativo? ${saldoAtual < 0}`);
  console.log(`   valorLinha é negativo? ${valorLinha < 0}\n`);

  if (saldoAtual !== 0 && valorLinha !== 0) {
    const saldoAtualNegativo = saldoAtual < 0;
    const valorCalculadoNegativo = valorLinha < 0;

    console.log(`4. Comparando sinais:`);
    console.log(`   saldoAtualNegativo = ${saldoAtualNegativo}`);
    console.log(`   valorCalculadoNegativo = ${valorCalculadoNegativo}`);
    console.log(`   Sinais diferentes? ${saldoAtualNegativo !== valorCalculadoNegativo}\n`);

    if (saldoAtualNegativo !== valorCalculadoNegativo) {
      const valorAntes = valorLinha;
      valorLinha = saldoAtualNegativo
        ? -Math.abs(valorLinha)
        : Math.abs(valorLinha);
      console.log(`5. ⚠️  CORREÇÃO APLICADA:`);
      console.log(`   valorLinha ANTES: ${valorAntes}`);
      console.log(`   valorLinha DEPOIS: ${valorLinha}\n`);
    } else {
      console.log(`5. ✅ Sinais iguais, sem correção necessária\n`);
    }
  } else if (isDespesaCusto && valorLinha > 0) {
    const valorAntes = valorLinha;
    valorLinha = -valorLinha;
    console.log(`5. ⚠️  CORREÇÃO APLICADA (é despesa/custo):`);
    console.log(`   valorLinha ANTES: ${valorAntes}`);
    console.log(`   valorLinha DEPOIS: ${valorLinha}\n`);
  } else {
    console.log(`5. ✅ Sem correção necessária\n`);
  }

  console.log('📋 RESULTADO FINAL:');
  console.log(`   valorLinha que será usado no relatório: ${valorLinha}`);
  console.log(`   saldoAtual no banco: ${saldoAtual}`);
  console.log(`   Diferença: ${valorLinha - saldoAtual}\n`);

  if (valorLinha !== saldoAtual) {
    console.log('❌ PROBLEMA IDENTIFICADO:');
    console.log(`   O valor calculado (${valorLinha}) é diferente do saldoAtual (${saldoAtual})`);
    console.log(`   Isso pode causar o problema de sinal no relatório!\n`);
  } else {
    console.log('✅ Valores coincidem - o problema pode estar em outro lugar\n');
  }

  // Verificar se a conta é de resultado
  const isContaResultado = 
    nomeConta.includes('RESULTADO') ||
    nomeConta.includes('SUPERÁVIT') ||
    nomeConta.includes('DÉFICIT') ||
    linha.classificacao?.startsWith('2.07') ||
    linha.classificacao?.startsWith('3.14') ||
    linha.classificacao?.startsWith('3.39') ||
    linha.classificacao?.startsWith('3.41') ||
    linha.classificacao?.startsWith('3.50');

  console.log('🔍 Informações adicionais:');
  console.log(`   É conta de resultado? ${isContaResultado}`);
  console.log(`   Tipo Conta: ${linha.tipoConta}`);
  if (linha.tipoConta === '2-Passivo' && isContaResultado) {
    console.log(`   ⚠️  ATENÇÃO: Conta de resultado classificada como Passivo!`);
    console.log(`      Isso pode estar causando problemas na lógica de cálculo.\n`);
  }
}

async function main() {
  try {
    await testarCalculo();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

