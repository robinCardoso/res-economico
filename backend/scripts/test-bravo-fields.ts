/**
 * Script para testar campos do Bravo ERP sem números nos caminhos
 * 
 * Este script testa se os campos podem ser acessados sem os números
 * que aparecem nos caminhos (ex: _ref.unidade.1806.abreviacao vs _ref.unidade.abreviacao)
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Simular o que o BravoErpClientV2Service faz
async function consultarProdutosBravo() {
  try {
    // Buscar configuração do banco usando a mesma estrutura do serviço
    const configs = await prisma.bravoSyncConfig.findMany({
      select: {
        chave: true,
        valor: true,
      },
    });

    // Converter array em objeto
    const configObj: Record<string, string> = {};
    configs.forEach((config) => {
      configObj[config.chave] = config.valor;
    });

    const baseUrl = configObj['base_url'];
    const apiKey = configObj['api_key'];

    if (!baseUrl || !apiKey) {
      throw new Error('Configuração do Bravo ERP não encontrada (base_url ou api_key)');
    }

    const response = await axios.get(`${baseUrl}/produtos`, {
      params: {
        page: 1,
        limit: 3, // Pegar 3 produtos para comparar
        sortCol: 'id_produto',
        sortOrder: 'ASC',
      },
      headers: {
        'X-API-Key': apiKey,
      },
      timeout: 30000,
    });

    // A API pode retornar data.data ou diretamente um array
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('❌ Erro ao consultar API:', error);
    if (axios.isAxiosError(error)) {
      console.error('   Status:', error.response?.status);
      console.error('   Mensagem:', error.response?.data || error.message);
    }
    throw error;
  }
}

/**
 * Analisa a estrutura de _ref para entender os números
 */
function analisarEstruturaRef(produto: any) {
  console.log('\n📊 ANÁLISE DA ESTRUTURA _ref:');
  console.log('=' .repeat(60));
  
  if (!produto._ref) {
    console.log('⚠️  Produto não tem campo _ref');
    return;
  }

  console.log('\n🔍 Campos em _ref:');
  console.log(JSON.stringify(Object.keys(produto._ref), null, 2));

  // Analisar cada campo
  for (const [key, value] of Object.entries(produto._ref)) {
    console.log(`\n📦 ${key}:`);
    
    if (Array.isArray(value)) {
      console.log(`   Tipo: Array com ${value.length} itens`);
      if (value.length > 0) {
        console.log(`   Primeiro item:`);
        console.log(JSON.stringify(value[0], null, 6));
        
        // Verificar se todos os itens têm a mesma estrutura
        const firstItemKeys = Object.keys(value[0]);
        const allSameStructure = value.every((item: any) => 
          JSON.stringify(Object.keys(item)) === JSON.stringify(firstItemKeys)
        );
        console.log(`   Todos têm a mesma estrutura: ${allSameStructure}`);
        
        if (allSameStructure) {
          console.log(`   ✅ Estrutura comum (pode ser normalizada):`);
          console.log(`   ${firstItemKeys.join(', ')}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      console.log(`   Tipo: Objeto`);
      console.log(JSON.stringify(value, null, 6));
    } else {
      console.log(`   Tipo: ${typeof value}, Valor: ${value}`);
    }
  }
}

/**
 * Testa acessar campo sem número
 */
function testarAcessoSemNumero(produtos: any[]) {
  console.log('\n🧪 TESTES DE ACESSO SEM NÚMERO:');
  console.log('=' .repeat(60));

  if (produtos.length === 0) {
    console.log('⚠️  Nenhum produto para testar');
    return;
  }

  const produto = produtos[0];
  const resultados: Array<{
    caminhoComNumero: string;
    caminhoSemNumero: string;
    funciona: boolean;
    valor?: any;
    erro?: string;
  }> = [];

  // Exemplos de campos que aparecem com números
  const camposParaTestar = [
    {
      comNumero: '_ref.unidade.1806.abreviacao',
      semNumero: '_ref.unidade.0.abreviacao', // Tentar primeiro item do array
      alternativa: 'unidade.abreviacao', // Se unidade já foi extraída
    },
    {
      comNumero: '_ref.categoria.15.titulo',
      semNumero: '_ref.categoria.0.titulo',
      alternativa: 'categoria.titulo',
    },
    {
      comNumero: '_ref.marca.3._data_ult_modif',
      semNumero: '_ref.marca.0._data_ult_modif',
      alternativa: 'marca._data_ult_modif',
    },
  ];

  camposParaTestar.forEach(({ comNumero, semNumero, alternativa }) => {
    console.log(`\n🔸 Testando: ${comNumero}`);
    
    // Tentar com número (caminho original)
    const valorComNumero = acessarCampo(produto, comNumero);
    console.log(`   Com número: ${valorComNumero !== undefined ? '✅' : '❌'} ${JSON.stringify(valorComNumero)}`);
    
    // Tentar sem número (usando índice 0)
    const valorSemNumero = acessarCampo(produto, semNumero);
    console.log(`   Sem número (índice 0): ${valorSemNumero !== undefined ? '✅' : '❌'} ${JSON.stringify(valorSemNumero)}`);
    
    // Tentar alternativa (assumindo que já foi normalizado)
    const valorAlternativa = acessarCampo(produto, alternativa);
    console.log(`   Alternativa: ${valorAlternativa !== undefined ? '✅' : '❌'} ${JSON.stringify(valorAlternativa)}`);

    // Verificar se valores são consistentes entre produtos
    if (produtos.length > 1) {
      console.log(`   📊 Comparação entre produtos:`);
      produtos.forEach((p, idx) => {
        const v1 = acessarCampo(p, comNumero);
        const v2 = acessarCampo(p, semNumero);
        const v3 = acessarCampo(p, alternativa);
        console.log(`      Produto ${idx + 1}: comNumero=${v1}, semNumero=${v2}, alternativa=${v3}`);
      });
    }

    resultados.push({
      caminhoComNumero: comNumero,
      caminhoSemNumero: semNumero,
      funciona: valorSemNumero !== undefined || valorAlternativa !== undefined,
      valor: valorSemNumero || valorAlternativa,
    });
  });

  return resultados;
}

/**
 * Função auxiliar para acessar campo usando caminho
 */
function acessarCampo(obj: any, caminho: string): any {
  try {
    return caminho.split('.').reduce((o: any, key: string) => {
      if (o && typeof o === 'object') {
        return o[key];
      }
      return undefined;
    }, obj);
  } catch {
    return undefined;
  }
}

/**
 * Sugere normalização de campos
 */
function sugerirNormalizacao(produtos: any[]) {
  console.log('\n💡 SUGESTÃO DE NORMALIZAÇÃO:');
  console.log('=' .repeat(60));

  if (produtos.length === 0) return;

  const produto = produtos[0];
  
  if (!produto._ref) return;

  console.log('\n📝 Estratégia recomendada:');
  console.log('1. Se _ref.campo é um array, sempre pegar o primeiro item (índice 0)');
  console.log('2. Normalizar caminhos removendo IDs numéricos');
  console.log('3. Usar caminhos genéricos como: _ref.unidade.0.abreviacao');
  console.log('   ou extrair direto: _ref.unidade[0].abreviacao');

  // Exemplo de normalização
  console.log('\n📋 Exemplos de normalização:');
  
  for (const [key, value] of Object.entries(produto._ref)) {
    if (Array.isArray(value) && value.length > 0) {
      const primeiroItem = (value as any[])[0];
      const camposDisponiveis = Object.keys(primeiroItem);
      console.log(`\n   ${key} (array):`);
      camposDisponiveis.forEach(campo => {
        console.log(`     ❌ _ref.${key}.${primeiroItem.id || 'X'}.${campo}`);
        console.log(`     ✅ _ref.${key}.0.${campo} ou _ref.${key}[0].${campo}`);
      });
    }
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 TESTE DE CAMPOS BRAVO ERP (SEM NÚMEROS)');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar produtos
    console.log('\n📥 Buscando produtos da API...');
    const produtos = await consultarProdutosBravo();
    console.log(`✅ ${produtos.length} produto(s) encontrado(s)`);

    if (produtos.length === 0) {
      console.log('⚠️  Nenhum produto para analisar');
      return;
    }

    // 2. Analisar estrutura
    analisarEstruturaRef(produtos[0]);

    // 3. Testar acesso
    const resultados = testarAcessoSemNumero(produtos);

    // 4. Sugerir normalização
    sugerirNormalizacao(produtos);

    // 5. Resumo
    console.log('\n\n📊 RESUMO:');
    console.log('=' .repeat(60));
    const funcionam = resultados?.filter(r => r.funciona) || [];
    const naoFuncionam = resultados?.filter(r => !r.funciona) || [];
    
    console.log(`✅ Campos que funcionam sem número: ${funcionam.length}`);
    console.log(`❌ Campos que NÃO funcionam sem número: ${naoFuncionam.length}`);
    
    if (naoFuncionam.length > 0) {
      console.log('\n⚠️  Atenção: Alguns campos precisam dos números');
      naoFuncionam.forEach(r => {
        console.log(`   - ${r.caminhoComNumero}`);
      });
    }

    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('\n❌ Erro ao executar teste:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main();
