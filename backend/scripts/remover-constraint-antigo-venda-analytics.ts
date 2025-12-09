import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removerConstraintAntigo() {
  console.log('🔍 Verificando constraints únicos em VendaAnalytics...');

  try {
    // Listar todos os constraints únicos
    const constraints = await prisma.$queryRaw<Array<{ conname: string; def: string }>>`
      SELECT 
        conname,
        pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = '"VendaAnalytics"'::regclass
      AND contype = 'u'
      ORDER BY conname
    `;

    console.log(`\n📋 Constraints únicos encontrados: ${constraints.length}`);
    constraints.forEach((c) => {
      console.log(`  - ${c.conname}: ${c.def}`);
    });

    // Remover todos os constraints que não incluem grupo e subgrupo
    const constraintsParaRemover = constraints.filter(
      (c) => !c.def.includes('grupo') || !c.def.includes('subgrupo'),
    );

    if (constraintsParaRemover.length === 0) {
      console.log('\n✅ Nenhum constraint antigo encontrado!');
      return;
    }

    console.log(`\n🗑️  Removendo ${constraintsParaRemover.length} constraint(s) antigo(s)...`);

    for (const constraint of constraintsParaRemover) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS "${constraint.conname}"`,
      );
      console.log(`  ✓ Removido: ${constraint.conname}`);
    }

    // Garantir que o novo constraint existe
    const novoConstraintExiste = constraints.some(
      (c) => c.conname === 'VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key',
    );

    if (!novoConstraintExiste) {
      console.log('\n➕ Adicionando novo constraint com grupo e subgrupo...');
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "VendaAnalytics" 
        ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
        UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf")`,
      );
      console.log('  ✓ Novo constraint adicionado');
    } else {
      console.log('\n✅ Novo constraint já existe');
    }

    // Verificar novamente
    const constraintsFinais = await prisma.$queryRaw<Array<{ conname: string; def: string }>>`
      SELECT 
        conname,
        pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = '"VendaAnalytics"'::regclass
      AND contype = 'u'
      ORDER BY conname
    `;

    console.log(`\n📋 Constraints únicos finais: ${constraintsFinais.length}`);
    constraintsFinais.forEach((c) => {
      console.log(`  - ${c.conname}: ${c.def}`);
    });

    console.log('\n✅ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro ao remover constraints:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removerConstraintAntigo();

