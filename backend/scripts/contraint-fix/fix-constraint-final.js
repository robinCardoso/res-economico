const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixConstraint() {
  try {
    console.log('🔍 Verificando constraints existentes na tabela VendaAnalytics...\n');
    
    // Verificar constraints únicos existentes
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'VendaAnalytics'::regclass
      AND contype = 'u'
    `;
    
    console.log('Constraints encontrados:');
    constraints.forEach(c => {
      console.log(`  - ${c.constraint_name}: ${c.constraint_definition}`);
    });
    console.log('');
    
    // Remover todos os constraints únicos existentes
    console.log('🗑️  Removendo constraints antigos...');
    for (const constraint of constraints) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS "${constraint.constraint_name}"`
        );
        console.log(`  ✓ Removido: ${constraint.constraint_name}`);
      } catch (error) {
        console.error(`  ✗ Erro ao remover ${constraint.constraint_name}:`, error.message);
      }
    }
    console.log('');
    
    // Adicionar novo constraint
    console.log('➕ Adicionando novo constraint com grupo e subgrupo...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "VendaAnalytics" 
        ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
        UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf")
      `);
      console.log('  ✓ Novo constraint adicionado com sucesso!');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('  ⚠ Constraint já existe, pulando...');
      } else {
        console.error('  ✗ Erro ao adicionar constraint:', error.message);
        throw error;
      }
    }
    console.log('');
    
    // Verificar novamente
    console.log('✅ Verificando constraint final...');
    const finalConstraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'VendaAnalytics'::regclass
      AND contype = 'u'
    `;
    
    console.log('\nConstraint final:');
    finalConstraints.forEach(c => {
      console.log(`  - ${c.constraint_name}`);
      console.log(`    ${c.constraint_definition}`);
    });
    
    // Verificar se o constraint inclui grupo e subgrupo
    const constraintDef = finalConstraints[0]?.constraint_definition || '';
    if (constraintDef.includes('grupo') && constraintDef.includes('subgrupo')) {
      console.log('\n✅ SUCESSO: Constraint atualizado corretamente com grupo e subgrupo!');
    } else {
      console.log('\n⚠️  ATENÇÃO: Constraint pode não incluir grupo e subgrupo. Verifique manualmente.');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixConstraint();
