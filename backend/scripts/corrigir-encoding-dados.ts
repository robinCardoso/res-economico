import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para corrigir encoding de dados corrompidos no banco
 * 
 * Este script tenta corrigir caracteres que foram corrompidos durante a migração do banco.
 * Ele tenta detectar padrões comuns de encoding incorreto e corrigi-los.
 */
async function corrigirEncoding() {
  console.log('\n🔧 Iniciando correção de encoding...\n');

  try {
    // Buscar todas as linhas com possíveis problemas de encoding
    const linhas = await prisma.linhaUpload.findMany({
      where: {
        OR: [
          { nomeConta: { contains: '??' } },
          { nomeConta: { contains: 'Ã' } },
          { nomeConta: { contains: 'Â' } },
          { nomeConta: { contains: 'Õ' } },
          { classificacao: { contains: '??' } },
          { classificacao: { contains: 'Ã' } },
        ],
      },
      select: {
        id: true,
        nomeConta: true,
        classificacao: true,
        conta: true,
      },
    });

    console.log(`📊 Total de linhas com possível encoding incorreto: ${linhas.length}\n`);

    if (linhas.length === 0) {
      console.log('✅ Nenhuma linha com problema de encoding encontrada!');
      return;
    }

    let corrigidas = 0;
    let naoCorrigidas = 0;

    // Função para tentar corrigir encoding
    const tentarCorrigir = (texto: string | null): string => {
      if (!texto) return '';

      // Primeiro, tentar substituir padrões conhecidos de caracteres corrompidos
      const correcoes: Record<string, string> = {
        'Exerc??cio': 'Exercício',
        'Per??odo': 'Período',
        'Balan??o': 'Balanço',
        'Uni??o': 'União',
        'S??o': 'São',
        'A??o': 'Ação',
        'Classifica??o': 'Classificação',
        'Aplica????es': 'Aplicações',
        'PE??AS': 'PEÇAS',
        'PE??as': 'PEÇAS',
        'pe??as': 'peças',
        'SERVI??OS': 'SERVIÇOS',
        'SERVI??os': 'SERVIÇOS',
        'servi??os': 'serviços',
        'IMPORTA????O': 'IMPORTAÇÃO',
        'Importa????o': 'Importação',
        'importa????o': 'importação',
        'RESTRI????O': 'RESTRIÇÃO',
        'Restri????o': 'Restrição',
        'restri????o': 'restrição',
        'AUTOSãAção': 'AUTO', // Corrigir corrupção dupla
        'CSãAçãoMERCISãAção': 'COMÉRCIO', // Corrigir corrupção dupla
        'RECURSãAçãoS': 'RECURSOS', // Corrigir corrupção dupla
        'BANCSãAçãoS': 'BANCOS', // Corrigir corrupção dupla
      };

      let corrigido = texto;
      for (const [errado, certo] of Object.entries(correcoes)) {
        const escaped = errado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        corrigido = corrigido.replace(new RegExp(escaped, 'gi'), certo);
      }

      // Se ainda tem '??', tentar padrões mais genéricos
      if (corrigido.includes('??')) {
        // Tentar padrões mais genéricos (substituir ?? seguido de letra)
        corrigido = corrigido.replace(/\?\?o/gi, 'ção');
        corrigido = corrigido.replace(/\?\?O/gi, 'ÇÃO');
        corrigido = corrigido.replace(/\?\?a/gi, 'ção');
        corrigido = corrigido.replace(/\?\?A/gi, 'ÇÃO');
      }

      // Se contém caracteres como 'Ã', 'Â', 'Õ' que não foram corrigidos pelos padrões,
      // pode ser encoding incorreto - mas só tentar se não tiver '??' (que indica perda de dados)
      if (!corrigido.includes('??') && (corrigido.includes('Ã') || corrigido.includes('Â') || corrigido.includes('Õ'))) {
        try {
          // Tentar converter de latin1 para utf8
          const buffer = Buffer.from(corrigido, 'latin1');
          const utf8 = buffer.toString('utf8');
          // Se a conversão produziu resultado diferente e válido, usar
          if (utf8 !== corrigido && !utf8.includes('\uFFFD') && !utf8.includes('??')) {
            return utf8;
          }
        } catch {
          // Ignorar erros de conversão
        }
      }

      return corrigido;
    };

    // Processar em lotes para não sobrecarregar o banco
    const batchSize = 100;
    for (let i = 0; i < linhas.length; i += batchSize) {
      const batch = linhas.slice(i, i + batchSize);
      
      for (const linha of batch) {
        const nomeContaOriginal = linha.nomeConta;
        const classificacaoOriginal = linha.classificacao;

        const nomeContaCorrigido = tentarCorrigir(nomeContaOriginal);
        const classificacaoCorrigida = tentarCorrigir(classificacaoOriginal);

        // Se houve correção, atualizar no banco
        if (
          nomeContaCorrigido !== nomeContaOriginal ||
          classificacaoCorrigida !== classificacaoOriginal
        ) {
          try {
            const updateData: { nomeConta?: string; classificacao?: string } = {};
            if (nomeContaCorrigido !== nomeContaOriginal) {
              updateData.nomeConta = nomeContaCorrigido;
            }
            if (classificacaoCorrigida !== classificacaoOriginal) {
              updateData.classificacao = classificacaoCorrigida;
            }
            
            await prisma.linhaUpload.update({
              where: { id: linha.id },
              data: updateData,
            });

            corrigidas++;
            
            if (corrigidas <= 5) {
              // Mostrar primeiras 5 correções como exemplo
              console.log(`✅ Corrigido (ID: ${linha.id}):`);
              if (nomeContaCorrigido !== nomeContaOriginal) {
                console.log(`   Nome: "${nomeContaOriginal?.substring(0, 50)}" → "${nomeContaCorrigido?.substring(0, 50)}"`);
              }
              if (classificacaoCorrigida !== classificacaoOriginal) {
                console.log(`   Classificação: "${classificacaoOriginal}" → "${classificacaoCorrigida}"`);
              }
            }
          } catch (error) {
            console.error(`❌ Erro ao corrigir linha ${linha.id}:`, error);
            naoCorrigidas++;
          }
        } else {
          naoCorrigidas++;
        }
      }

      // Mostrar progresso
      const processadas = Math.min(i + batchSize, linhas.length);
      console.log(`📊 Processadas: ${processadas}/${linhas.length} (${Math.round((processadas / linhas.length) * 100)}%)`);
    }

    console.log(`\n✅ Correção concluída!`);
    console.log(`   ✅ Linhas corrigidas: ${corrigidas}`);
    console.log(`   ⚠️ Linhas não corrigidas: ${naoCorrigidas}`);
    console.log(`\n💡 Nota: Alguns caracteres podem ter sido perdidos completamente (aparecem como '??').`);
    console.log(`   Para esses casos, será necessário reprocessar o upload original.`);

    // Também corrigir no catálogo de contas
    console.log(`\n🔧 Corrigindo catálogo de contas...`);
    const contasCatalogo = await prisma.contaCatalogo.findMany({
      where: {
        OR: [
          { nomeConta: { contains: '??' } },
          { nomeConta: { contains: 'Ã' } },
          { classificacao: { contains: '??' } },
        ],
      },
      select: {
        id: true,
        nomeConta: true,
        classificacao: true,
      },
    });

    console.log(`📊 Contas no catálogo com possível encoding incorreto: ${contasCatalogo.length}`);

    let catalogoCorrigidas = 0;
    for (const conta of contasCatalogo) {
      const nomeContaCorrigido = tentarCorrigir(conta.nomeConta);
      const classificacaoCorrigida = tentarCorrigir(conta.classificacao);

      if (
        nomeContaCorrigido !== conta.nomeConta ||
        classificacaoCorrigida !== conta.classificacao
      ) {
        try {
          const updateData: { nomeConta?: string; classificacao?: string } = {};
          if (nomeContaCorrigido !== conta.nomeConta) {
            updateData.nomeConta = nomeContaCorrigido;
          }
          if (classificacaoCorrigida !== conta.classificacao) {
            updateData.classificacao = classificacaoCorrigida;
          }
          
          await prisma.contaCatalogo.update({
            where: { id: conta.id },
            data: updateData,
          });
          catalogoCorrigidas++;
        } catch (error) {
          console.error(`❌ Erro ao corrigir conta catálogo ${conta.id}:`, error);
        }
      }
    }

    console.log(`✅ Contas do catálogo corrigidas: ${catalogoCorrigidas}`);

  } catch (error) {
    console.error('\n❌ Erro durante a correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

corrigirEncoding()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

