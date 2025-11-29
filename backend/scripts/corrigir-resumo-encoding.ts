import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Corrige caracteres corrompidos em um resumo específico
 */
async function corrigirResumoEncoding() {
  try {
    const resumoId = '0197c0a6-e4d6-4d11-95d1-de1e4ec36d29';
    
    console.log('🔍 Buscando resumo...');
    const resumo = await prisma.resumoEconomico.findUnique({
      where: { id: resumoId },
    });

    if (!resumo) {
      console.log('❌ Resumo não encontrado no banco de dados');
      return;
    }

    console.log('📝 Resumo encontrado:');
    console.log(`   Título: ${resumo.titulo}`);
    console.log(`   Status: ${resumo.status}`);
    console.log(`   Tipo: ${resumo.tipoAnalise}`);

    // Função para corrigir caracteres corrompidos
    const corrigirTexto = (texto: string): string => {
      if (!texto) return texto;
      
      let textoCorrigido = texto;
      
      // Padrões de correção específicos (ordem importa - mais específicos primeiro)
      const correcoesEspecificas: Array<[string, string]> = [
        ['An??lise', 'Análise'],
        ['an??lise', 'análise'],
        ['per??odos', 'períodos'],
        ['per??odo', 'período'],
        ['Uni??o', 'União'],
        ['m??dia', 'média'],
        ['varia????o', 'variação'],
        ['Super??vit', 'Superávit'],
        ['D??ficit', 'Déficit'],
        ['Informa????o', 'Informação'],
        ['servi??os', 'serviços'],
        ['produ????o', 'produção'],
      ];

      // Aplicar correções específicas primeiro
      for (const [errado, correto] of correcoesEspecificas) {
        textoCorrigido = textoCorrigido.replace(new RegExp(errado.replace(/\?/g, '\\?'), 'g'), correto);
      }

      // Tentar conversão latin1 -> utf8 para caracteres restantes
      if (textoCorrigido.includes('??')) {
        try {
          const buffer = Buffer.from(textoCorrigido, 'latin1');
          const tentativa = buffer.toString('utf8');
          if (!tentativa.includes('??') || tentativa.length === textoCorrigido.length) {
            textoCorrigido = tentativa;
          }
        } catch (e) {
          // Ignorar erro de conversão
        }
      }

      return textoCorrigido;
    };

    // Corrigir título
    const tituloCorrigido = corrigirTexto(resumo.titulo);
    
    // Corrigir resultado (JSON)
    let resultadoCorrigido = resumo.resultado as any;
    if (resultadoCorrigido) {
      // Corrigir resumo
      if (resultadoCorrigido.resumo) {
        resultadoCorrigido.resumo = corrigirTexto(resultadoCorrigido.resumo);
      }
      
      // Corrigir insights
      if (Array.isArray(resultadoCorrigido.insights)) {
        resultadoCorrigido.insights = resultadoCorrigido.insights.map((insight: any) => ({
          ...insight,
          titulo: corrigirTexto(insight.titulo || ''),
          descricao: corrigirTexto(insight.descricao || ''),
          recomendacao: insight.recomendacao ? corrigirTexto(insight.recomendacao) : undefined,
        }));
      }
      
      // Corrigir padrões anômalos
      if (Array.isArray(resultadoCorrigido.padroesAnomalos)) {
        resultadoCorrigido.padroesAnomalos = resultadoCorrigido.padroesAnomalos.map((padrao: any) => ({
          ...padrao,
          descricao: corrigirTexto(padrao.descricao || ''),
        }));
      }
    }

    // Verificar se há mudanças
    const tituloMudou = tituloCorrigido !== resumo.titulo;
    const resultadoMudou = JSON.stringify(resultadoCorrigido) !== JSON.stringify(resumo.resultado);

    if (!tituloMudou && !resultadoMudou) {
      console.log('✅ Nenhuma correção necessária - dados já estão corretos');
      return;
    }

    console.log('\n🔧 Aplicando correções...');
    
    // Atualizar no banco
    await prisma.resumoEconomico.update({
      where: { id: resumoId },
      data: {
        titulo: tituloCorrigido,
        resultado: resultadoCorrigido as any,
      },
    });

    console.log('✅ Resumo corrigido com sucesso!');
    console.log(`\n📊 Comparação:`);
    console.log(`   Título antes: ${resumo.titulo}`);
    console.log(`   Título depois: ${tituloCorrigido}`);
    
    if (resultadoMudou) {
      console.log(`   Resultado: Corrigido (${Object.keys(resultadoCorrigido).length} campos)`);
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir resumo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
corrigirResumoEncoding()
  .then(() => {
    console.log('\n✅ Script concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

