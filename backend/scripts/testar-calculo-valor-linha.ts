/**
 * Script para testar o cálculo de valorLinha exatamente como o RelatoriosService faz
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarCalculo() {
  const uploadId = 'd56290b7-4b32-4f8a-96be-4c266b68c8a7';
  
  console.log(`🔍 Testando cálculo para upload: ${uploadId}\n`);

  // Buscar linha específica
  const linha = await prisma.linhaUpload.findFirst({
    where: {
      uploadId,
      classificacao: '2.07.05.01.01',
      conta: '745',
      tipoConta: '3-DRE',
    },
  });

  if (!linha) {
    console.log('❌ Linha não encontrada');
    return;
  }

  console.log('📊 Dados da linha:');
  console.log(`  Nome: ${linha.nomeConta}`);
  console.log(`  Débito: ${linha.debito}`);
  console.log(`  Crédito: ${linha.credito}`);
  console.log(`  Saldo Atual: ${linha.saldoAtual}\n`);

  // Simular exatamente o cálculo do RelatoriosService (linha 372-405)
  // NOVA FÓRMULA: credito - debito (usando valor absoluto do débito)
  const debitoRaw = Number(linha.debito) || 0;
  const credito = Number(linha.credito) || 0;
  const debito = Math.abs(debitoRaw);
  let valorLinha = credito - debito;

  console.log('🔢 Cálculo inicial (NOVA FÓRMULA):');
  console.log(`  debitoRaw = ${debitoRaw}`);
  console.log(`  debito (absoluto) = ${debito}`);
  console.log(`  credito = ${credito}`);
  console.log(`  valorLinha = credito - debito`);
  console.log(`  valorLinha = ${credito} - ${debito}`);
  console.log(`  valorLinha = ${valorLinha}\n`);

  // Verificar se é despesa/custo
  const nomeConta = (linha.nomeConta || '').toUpperCase();
  const isDespesaCusto =
    nomeConta.includes('(-)') ||
    nomeConta.includes('DEDUÇÃO') ||
    nomeConta.includes('DEDUÇÕES') ||
    nomeConta.includes('CUSTO') ||
    nomeConta.includes('DESPESA') ||
    nomeConta.startsWith('(-');

  console.log('🔍 Verificações:');
  console.log(`  Nome da conta (uppercase): ${nomeConta}`);
  console.log(`  É despesa/custo? ${isDespesaCusto}`);
  console.log(`  Contém "(-)": ${nomeConta.includes('(-)')}`);
  console.log(`  Contém "CUSTO": ${nomeConta.includes('CUSTO')}`);
  console.log(`  Contém "DESPESA": ${nomeConta.includes('DESPESA')}\n`);

  // Lógica de correção de sinal baseada em saldoAtual
  const saldoAtual = Number(linha.saldoAtual) || 0;
  console.log('📐 Correção de sinal baseada em saldoAtual:');
  console.log(`  saldoAtual = ${saldoAtual}`);
  console.log(`  valorLinha = ${valorLinha}`);
  
  if (saldoAtual !== 0 && valorLinha !== 0) {
    const saldoAtualNegativo = saldoAtual < 0;
    const valorCalculadoNegativo = valorLinha < 0;

    console.log(`  saldoAtualNegativo = ${saldoAtualNegativo}`);
    console.log(`  valorCalculadoNegativo = ${valorCalculadoNegativo}`);
    console.log(`  Sinais diferentes? ${saldoAtualNegativo !== valorCalculadoNegativo}`);

    // Se os sinais são diferentes, usar o sinal do saldoAtual como referência
    if (saldoAtualNegativo !== valorCalculadoNegativo) {
      console.log(`  ⚠️  Aplicando correção de sinal!`);
      valorLinha = saldoAtualNegativo
        ? -Math.abs(valorLinha)
        : Math.abs(valorLinha);
      console.log(`  valorLinha após correção = ${valorLinha}`);
    } else {
      console.log(`  ✅ Sinais iguais, não precisa corrigir`);
    }
  } else if (isDespesaCusto && valorLinha > 0) {
    console.log(`  ⚠️  É despesa/custo e valorLinha > 0, invertendo sinal!`);
    valorLinha = -valorLinha;
    console.log(`  valorLinha após inversão = ${valorLinha}`);
  } else {
    console.log(`  ✅ Nenhuma correção necessária`);
  }

  console.log(`\n📊 Resultado final:`);
  console.log(`  valorLinha = ${valorLinha}`);
  console.log(`  Esperado: 66.34`);
  console.log(`  Diferença: ${Math.abs(valorLinha - 66.34)}`);
  
  if (Math.abs(valorLinha - 66.34) < 0.01) {
    console.log(`  ✅ Cálculo correto!`);
  } else if (Math.abs(valorLinha + 66.34) < 0.01) {
    console.log(`  ❌ Sinal invertido! (deveria ser positivo)`);
  } else {
    console.log(`  ❌ Valor incorreto!`);
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

