const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyFix() {
  try {
    console.log('='.repeat(60));
    console.log('CORREÇÃO DO CONSTRAINT ÚNICO - VendaAnalytics');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. Verificar constraints existentes
    console.log('1. Verificando constraints existentes...');
    const before = await prisma.$queryRaw`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'VendaAnalytics'::regclass AND contype = 'u'
    `;
    
    console.log(`   Encontrados ${before.length} constraint(s) único(s):`);
    before.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.conname}`);
    });
    console.log('');
    
    // 2. Remover todos os constraints únicos
    console.log('2. Removendo constraints antigos...');
    for (const constraint of before) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "VendaAnalytics" DROP CONSTRAINT "${constraint.conname}"`
        );
        console.log(`   ✓ Removido: ${constraint.conname}`);
      } catch (error) {
        console.log(`   ⚠ Erro ao remover ${constraint.conname}: ${error.message}`);
      }
    }
    console.log('');
    
    // 3. Adicionar novo constraint
    console.log('3. Adicionando novo constraint com grupo e subgrupo...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "VendaAnalytics" 
        ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
        UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf")
      `);
      console.log('   ✓ Constraint adicionado com sucesso!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠ Constraint já existe');
      } else {
        throw error;
      }
    }
    console.log('');
    
    // 4. Verificar resultado
    console.log('4. Verificando resultado final...');
    const after = await prisma.$queryRaw`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'VendaAnalytics'::regclass AND contype = 'u'
    `;
    
    console.log(`   Constraint(s) final(is):`);
    after.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.conname}`);
      console.log(`      ${c.def}`);
    });
    console.log('');
    
    // 5. Validar
    const correct = after.find(c => 
      c.conname.includes('grupo') && 
      c.conname.includes('subgrupo') &&
      c.def.includes('grupo') &&
      c.def.includes('subgrupo')
    );
    
    if (correct) {
      console.log('✅ SUCESSO! Constraint atualizado corretamente.');
      console.log('   O constraint agora inclui: ano, mes, nomeFantasia, marca, grupo, subgrupo, uf');
    } else {
      console.log('❌ ERRO! Constraint não foi atualizado corretamente.');
      console.log('   Verifique manualmente no banco de dados.');
      process.exit(1);
    }
    
    console.log('');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('');
    console.error('❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyFix();
