/**
 * Script para limpar tabelas do módulo Bravo ERP
 * 
 * Este script deleta TODOS os registros das tabelas:
 *   - BravoSyncProgress (progresso de sincronização)
 *   - BravoSyncLog (logs de sincronização)
 *   - Produto (produtos sincronizados)
 * 
 * ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
 * ⚠️ Faça um backup antes de executar se precisar dos dados!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limparTabelasBravo() {
  console.log('🧹 Iniciando limpeza das tabelas do módulo Bravo ERP...\n');

  try {
    // Contar registros antes da limpeza
    const [progressCount, logCount, produtoCount] = await Promise.all([
      prisma.bravoSyncProgress.count(),
      prisma.bravoSyncLog.count(),
      prisma.produto.count(),
    ]);

    console.log('📊 Registros antes da limpeza:');
    console.log(`   - BravoSyncProgress: ${progressCount}`);
    console.log(`   - BravoSyncLog: ${logCount}`);
    console.log(`   - Produto: ${produtoCount}\n`);

    if (progressCount === 0 && logCount === 0 && produtoCount === 0) {
      console.log('✅ Todas as tabelas já estão vazias!');
      return;
    }

    // Limpar na ordem correta (respeitando foreign keys)
    console.log('🗑️  Limpando tabelas...');

    // 1. Limpar BravoSyncProgress primeiro (tem foreign key para BravoSyncLog)
    await prisma.bravoSyncProgress.deleteMany({});
    console.log('   ✅ BravoSyncProgress limpo');

    // 2. Limpar BravoSyncLog
    await prisma.bravoSyncLog.deleteMany({});
    console.log('   ✅ BravoSyncLog limpo');

    // 3. Limpar Produto (não tem dependências das outras tabelas)
    await prisma.produto.deleteMany({});
    console.log('   ✅ Produto limpo\n');

    // Verificar que as tabelas estão vazias
    const [progressAfter, logAfter, produtoAfter] = await Promise.all([
      prisma.bravoSyncProgress.count(),
      prisma.bravoSyncLog.count(),
      prisma.produto.count(),
    ]);

    console.log('📊 Registros após a limpeza:');
    console.log(`   - BravoSyncProgress: ${progressAfter}`);
    console.log(`   - BravoSyncLog: ${logAfter}`);
    console.log(`   - Produto: ${produtoAfter}\n`);

    if (progressAfter === 0 && logAfter === 0 && produtoAfter === 0) {
      console.log('✅ Limpeza concluída com sucesso!');
      console.log('📋 Todas as tabelas estão vazias e prontas para novos testes.');
    } else {
      console.log('⚠️  Algumas tabelas ainda contêm registros!');
      console.log('   Verifique se há algum problema com foreign keys.');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar tabelas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
limparTabelasBravo()
  .then(() => {
    console.log('\n🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });