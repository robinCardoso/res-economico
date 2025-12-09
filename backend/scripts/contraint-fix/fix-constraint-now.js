const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const logFile = 'constraint-fix-log.txt';

function log(message) {
  const msg = `${new Date().toISOString()} - ${message}\n`;
  fs.appendFileSync(logFile, msg);
  console.log(message);
}

async function main() {
  // Limpar log anterior
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }

  try {
    log('\n==========================================');
    log('CORRIGINDO CONSTRAINT VendaAnalytics');
    log('==========================================\n');

    // 1. Listar constraints
    log('1. Listando constraints atuais...');
    const constraints = await prisma.$queryRawUnsafe(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      WHERE cl.relname IN ('VendaAnalytics', 'vendaanalytics')
      AND c.contype = 'u'
    `);
    
    log(`   Encontrados: ${constraints.length}`);
    constraints.forEach(c => log(`   - ${c.conname}: ${c.def.substring(0, 60)}...`));
    log('');

    // 2. Remover todos
    log('2. Removendo constraints antigos...');
    for (const c of constraints) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS "${c.conname}"`);
        log(`   ✓ Removido: ${c.conname}`);
      } catch (e) {
        log(`   ⚠ Erro ao remover ${c.conname}: ${e.message.split('\n')[0]}`);
      }
    }
    log('');

    // 3. Adicionar novo
    log('3. Adicionando novo constraint com grupo e subgrupo...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "VendaAnalytics" 
        ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
        UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf")
      `);
      log('   ✓ Constraint adicionado com sucesso!');
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('duplicate')) {
        log('   ⚠ Constraint já existe (pode estar correto)');
      } else {
        throw e;
      }
    }
    log('');

    // 4. Verificar
    log('4. Verificando resultado final...');
    const final = await prisma.$queryRawUnsafe(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      WHERE cl.relname IN ('VendaAnalytics', 'vendaanalytics')
      AND c.contype = 'u'
    `);
    
    log(`   Total de constraints: ${final.length}`);
    final.forEach(c => {
      log(`   - ${c.conname}`);
      log(`     ${c.def}`);
    });
    log('');

    const hasGrupo = final.some(c => 
      c.def.includes('grupo') && 
      c.def.includes('subgrupo') &&
      c.def.includes('uf')
    );
    
    if (hasGrupo) {
      log('✅ SUCESSO! Constraint atualizado corretamente.');
      log('   O constraint agora inclui: ano, mes, nomeFantasia, marca, grupo, subgrupo, uf');
    } else {
      log('❌ ERRO: Constraint não inclui grupo/subgrupo corretamente.');
      log('   Verifique o log acima para detalhes.');
      process.exit(1);
    }

    log('\n==========================================');
    log('CONCLUÍDO COM SUCESSO!');
    log('==========================================\n');
    log(`Log salvo em: ${logFile}`);

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`);
    if (error.stack) {
      log(error.stack.split('\n').slice(0, 5).join('\n'));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
