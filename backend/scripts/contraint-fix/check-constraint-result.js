const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function check() {
  let output = '';
  
  function log(msg) {
    output += msg + '\n';
    console.log(msg);
  }
  
  try {
    log('\n==========================================');
    log('VERIFICANDO CONSTRAINT VendaAnalytics');
    log('==========================================\n');

    const constraints = await prisma.$queryRawUnsafe(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      WHERE cl.relname IN ('VendaAnalytics', 'vendaanalytics')
      AND c.contype = 'u'
    `);
    
    log(`Constraints encontrados: ${constraints.length}\n`);
    
    constraints.forEach(c => {
      log(`${c.conname}:`);
      log(`  ${c.def}\n`);
    });

    const hasGrupo = constraints.some(c => 
      c.def.includes('grupo') && 
      c.def.includes('subgrupo') &&
      c.def.includes('uf')
    );
    
    if (hasGrupo) {
      log('✅ SUCESSO! Constraint está correto!');
      log('   Inclui: ano, mes, nomeFantasia, marca, grupo, subgrupo, uf');
    } else {
      log('❌ ERRO: Constraint não inclui grupo/subgrupo');
      process.exit(1);
    }
    
    fs.writeFileSync('constraint-check-result.txt', output);
    log('\nResultado salvo em: constraint-check-result.txt');
    
  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`);
    fs.writeFileSync('constraint-check-result.txt', output);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

check();
