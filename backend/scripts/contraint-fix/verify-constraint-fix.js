const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('\n==========================================');
    console.log('VERIFICANDO CONSTRAINT VendaAnalytics');
    console.log('==========================================\n');

    // Verificar constraints
    const constraints = await prisma.$queryRawUnsafe(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      WHERE cl.relname IN ('VendaAnalytics', 'vendaanalytics')
      AND c.contype = 'u'
      ORDER BY conname
    `);
    
    console.log(`Constraints únicos encontrados: ${constraints.length}\n`);
    
    if (constraints.length === 0) {
      console.log('❌ ERRO: Nenhum constraint único encontrado!');
      process.exit(1);
    }
    
    constraints.forEach((c, i) => {
      console.log(`${i + 1}. ${c.constraint_name}`);
      console.log(`   ${c.constraint_definition}`);
      console.log('');
    });

    // Verificar se o constraint correto existe
    const correctConstraint = constraints.find(c => 
      c.constraint_name.includes('grupo') && 
      c.constraint_name.includes('subgrupo')
    );

    if (correctConstraint) {
      const def = correctConstraint.constraint_definition;
      
      // Verificar se inclui todos os campos necessários
      const hasAno = def.includes('ano');
      const hasMes = def.includes('mes');
      const hasNomeFantasia = def.includes('nomeFantasia');
      const hasMarca = def.includes('marca');
      const hasGrupo = def.includes('grupo');
      const hasSubgrupo = def.includes('subgrupo');
      const hasUf = def.includes('uf');
      
      console.log('Verificação de campos:');
      console.log(`  ✓ ano: ${hasAno ? 'SIM' : 'NÃO'}`);
      console.log(`  ✓ mes: ${hasMes ? 'SIM' : 'NÃO'}`);
      console.log(`  ✓ nomeFantasia: ${hasNomeFantasia ? 'SIM' : 'NÃO'}`);
      console.log(`  ✓ marca: ${hasMarca ? 'SIM' : 'NÃO'}`);
      console.log(`  ✓ grupo: ${hasGrupo ? 'SIM' : 'NÃO'}`);
      console.log(`  ✓ subgrupo: ${hasSubgrupo ? 'SIM' : 'NÃO'}`);
      console.log(`  ✓ uf: ${hasUf ? 'SIM' : 'NÃO'}`);
      console.log('');
      
      if (hasAno && hasMes && hasNomeFantasia && hasMarca && hasGrupo && hasSubgrupo && hasUf) {
        console.log('✅ SUCESSO! Constraint está correto!');
        console.log('   O constraint inclui todos os campos necessários:');
        console.log('   ano, mes, nomeFantasia, marca, grupo, subgrupo, uf');
        console.log('\n==========================================');
        console.log('TUDO FUNCIONANDO CORRETAMENTE!');
        console.log('==========================================\n');
      } else {
        console.log('⚠️  Constraint encontrado mas está incompleto');
        console.log('   Faltam alguns campos na definição');
        process.exit(1);
      }
    } else {
      console.log('❌ ERRO: Constraint com grupo e subgrupo não foi encontrado!');
      console.log('   O constraint antigo ainda está ativo.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    if (error.stack) {
      console.error(error.stack.split('\n').slice(0, 3).join('\n'));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
