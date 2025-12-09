const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n==========================================');
    console.log('CORRIGINDO CONSTRAINT VendaAnalytics');
    console.log('==========================================\n');

    // 1. Listar constraints atuais
    console.log('1. Listando constraints atuais...');
    const constraints = await prisma.$queryRawUnsafe(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      WHERE cl.relname IN ('VendaAnalytics', 'vendaanalytics')
      AND c.contype = 'u'
    `);
    
    console.log(`   Encontrados: ${constraints.length}`);
    constraints.forEach(c => console.log(`   - ${c.conname}`));
    console.log('');

    // 2. Remover todos
    console.log('2. Removendo constraints antigos...');
    for (const c of constraints) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS "${c.conname}"`);
      console.log(`   ✓ ${c.conname}`);
    }
    console.log('');

    // 3. Adicionar novo
    console.log('3. Adicionando novo constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "VendaAnalytics" 
      ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
      UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf")
    `);
    console.log('   ✓ Constraint adicionado\n');

    // 4. Verificar
    console.log('4. Verificando resultado...');
    const final = await prisma.$queryRawUnsafe(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint c
      JOIN pg_class cl ON c.conrelid = cl.oid
      WHERE cl.relname IN ('VendaAnalytics', 'vendaanalytics')
      AND c.contype = 'u'
    `);
    
    const hasGrupo = final.some(c => c.def.includes('grupo') && c.def.includes('subgrupo'));
    
    if (hasGrupo) {
      console.log('   ✅ SUCESSO! Constraint inclui grupo e subgrupo');
      final.forEach(c => {
        if (c.def.includes('grupo')) {
          console.log(`   - ${c.conname}`);
          console.log(`     ${c.def}`);
        }
      });
    } else {
      console.log('   ❌ ERRO: Constraint não inclui grupo/subgrupo');
      process.exit(1);
    }

    console.log('\n==========================================');
    console.log('CONCLUÍDO COM SUCESSO!');
    console.log('==========================================\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
