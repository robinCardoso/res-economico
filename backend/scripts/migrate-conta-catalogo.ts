/**
 * Script para migrar dados existentes na tabela ContaCatalogo
 * Preenche conta (número) e nomeConta a partir dos dados de LinhaUpload
 * 
 * Execute com: npx ts-node backend/scripts/migrate-conta-catalogo.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateContaCatalogo() {
  console.log('🔄 Iniciando migração de dados do ContaCatalogo...');

  try {
    // Buscar todas as contas do catálogo que precisam ser migradas
    // Como os campos são String (não nullable), vamos buscar todas e verificar quais estão vazias
    const todasContas = await prisma.contaCatalogo.findMany();
    
    const contasCatalogo = todasContas.filter(
      (conta) => !conta.conta || conta.conta === '' || !conta.nomeConta || conta.nomeConta === '',
    );

    console.log(`📊 Encontradas ${contasCatalogo.length} contas que precisam ser migradas.`);

    let atualizadas = 0;
    let semDados = 0;

    for (const conta of contasCatalogo) {
      // Buscar a primeira LinhaUpload com a mesma classificação
      const linhaUpload = await prisma.linhaUpload.findFirst({
        where: {
          classificacao: conta.classificacao,
        },
        orderBy: {
          createdAt: 'desc', // Pegar a mais recente
        },
      });

      if (linhaUpload) {
        const dadosAtualizacao: {
          conta?: string;
          nomeConta?: string;
        } = {};

        // Preencher conta (número) se estiver vazio
        if (!conta.conta || conta.conta === '') {
          dadosAtualizacao.conta = linhaUpload.conta || '';
        }

        // Preencher nomeConta se estiver vazio
        if (!conta.nomeConta || conta.nomeConta === '') {
          dadosAtualizacao.nomeConta = linhaUpload.nomeConta || 'Sem nome';
        }

        if (Object.keys(dadosAtualizacao).length > 0) {
          await prisma.contaCatalogo.update({
            where: { id: conta.id },
            data: dadosAtualizacao,
          });
          atualizadas++;
          console.log(
            `✅ Atualizada: ${conta.classificacao} - conta: ${dadosAtualizacao.conta || conta.conta}, nomeConta: ${dadosAtualizacao.nomeConta || conta.nomeConta}`,
          );
        }
      } else {
        semDados++;
        console.log(`⚠️  Sem dados em LinhaUpload para: ${conta.classificacao}`);
        
        // Preencher com valores padrão se não houver dados
        const dadosAtualizacao: {
          conta?: string;
          nomeConta?: string;
        } = {};

        if (!conta.conta || conta.conta === '') {
          dadosAtualizacao.conta = '';
        }

        if (!conta.nomeConta || conta.nomeConta === '') {
          dadosAtualizacao.nomeConta = 'Sem nome';
        }

        if (Object.keys(dadosAtualizacao).length > 0) {
          await prisma.contaCatalogo.update({
            where: { id: conta.id },
            data: dadosAtualizacao,
          });
        }
      }
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`   - Contas atualizadas: ${atualizadas}`);
    console.log(`   - Contas sem dados: ${semDados}`);
    console.log(`   - Total processado: ${contasCatalogo.length}`);
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateContaCatalogo()
  .then(() => {
    console.log('✨ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });

