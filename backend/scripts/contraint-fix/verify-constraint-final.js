const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('Verificando constraint único de VendaAnalytics...\n');
    
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'VendaAnalytics'::regclass
      AND contype = 'u'
    `;
    
    if (constraints.length === 0) {
      console.log('❌ Nenhum constraint único encontrado!');
      process.exit(1);
    }
    
    console.log('Constraints encontrados:');
    constraints.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.constraint_name}`);
      console.log(`   ${c.constraint_definition}`);
    });
    
    const mainConstraint = constraints.find(c => 
      c.constraint_name.includes('grupo') && c.constraint_name.includes('subgrupo')
    );
    
    if (mainConstraint) {
      const def = mainConstraint.constraint_definition;
      if (def.includes('grupo') && def.includes('subgrupo') && def.includes('uf')) {
        console.log('\n✅ SUCESSO: Constraint correto encontrado!');
        console.log('   O constraint inclui: ano, mes, nomeFantasia, marca, grupo, subgrupo, uf');
        process.exit(0);
      } else {
        console.log('\n⚠️  Constraint encontrado mas pode estar incompleto');
        process.exit(1);
      }
    } else {
      console.log('\n❌ ERRO: Constraint com grupo e subgrupo não encontrado!');
      console.log('   O constraint antigo ainda está ativo.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
