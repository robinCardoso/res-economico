import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarIndices() {
  console.log('🔍 Verificando índices únicos em VendaAnalytics...');

  try {
    // Listar todos os índices únicos
    const indices = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'VendaAnalytics'
      AND indexdef LIKE '%UNIQUE%'
      ORDER BY indexname
    `;

    console.log(`\n📋 Índices únicos encontrados: ${indices.length}`);
    indices.forEach((idx) => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });

    // Verificar registros duplicados (sem considerar grupo/subgrupo)
    const duplicatas = await prisma.$queryRaw<Array<{
      ano: number;
      mes: number;
      nomeFantasia: string;
      marca: string;
      uf: string;
      count: bigint;
    }>>`
      SELECT 
        "ano",
        "mes",
        "nomeFantasia",
        "marca",
        "uf",
        COUNT(*) as count
      FROM "VendaAnalytics"
      GROUP BY "ano", "mes", "nomeFantasia", "marca", "uf"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicatas.length > 0) {
      console.log(`\n⚠️  Registros duplicados encontrados (sem grupo/subgrupo): ${duplicatas.length}`);
      duplicatas.forEach((dup) => {
        console.log(
          `  - ${dup.count} registros: ano=${dup.ano}, mes=${dup.mes}, nomeFantasia=${dup.nomeFantasia}, marca=${dup.marca}, uf=${dup.uf}`,
        );
      });
    } else {
      console.log('\n✅ Nenhum registro duplicado encontrado');
    }

    // Verificar registros duplicados (com grupo/subgrupo)
    const duplicatasCompleto = await prisma.$queryRaw<Array<{
      ano: number;
      mes: number;
      nomeFantasia: string;
      marca: string;
      grupo: string;
      subgrupo: string;
      uf: string;
      count: bigint;
    }>>`
      SELECT 
        "ano",
        "mes",
        "nomeFantasia",
        "marca",
        "grupo",
        "subgrupo",
        "uf",
        COUNT(*) as count
      FROM "VendaAnalytics"
      GROUP BY "ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf"
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicatasCompleto.length > 0) {
      console.log(`\n⚠️  Registros duplicados encontrados (com grupo/subgrupo): ${duplicatasCompleto.length}`);
      duplicatasCompleto.forEach((dup) => {
        console.log(
          `  - ${dup.count} registros: ano=${dup.ano}, mes=${dup.mes}, nomeFantasia=${dup.nomeFantasia}, marca=${dup.marca}, grupo=${dup.grupo}, subgrupo=${dup.subgrupo}, uf=${dup.uf}`,
        );
      });
    } else {
      console.log('\n✅ Nenhum registro duplicado encontrado (com grupo/subgrupo)');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verificarIndices();

