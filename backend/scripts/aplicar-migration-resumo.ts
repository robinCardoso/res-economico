import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function aplicarMigrationResumo() {
  console.log('=== Aplicando Migration: ResumoEconomico ===\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'aplicar-migration-resumo.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Executar SQL
    console.log('Executando SQL...');
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migration aplicada com sucesso!\n');

    // Marcar migration como aplicada na tabela _prisma_migrations
    const migrationName = '20250119200000_add_resumo_economico';
    const checksum = 'a1b2c3d4e5f6'; // Checksum fictício, o Prisma vai gerar o correto

    // Verificar se já existe
    const existing = await prisma.$queryRawUnsafe<Array<{ migration_name: string }>>(
      `SELECT migration_name FROM _prisma_migrations WHERE migration_name = $1`,
      migrationName,
    );

    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO _prisma_migrations (migration_name, finished_at, applied_steps_count) 
         VALUES ($1, NOW(), 1)`,
        migrationName,
      );
      console.log(`✅ Migration ${migrationName} marcada como aplicada\n`);
    } else {
      console.log(`⚠️  Migration ${migrationName} já estava marcada como aplicada\n`);
    }

    console.log('✅ Processo concluído!');
  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

aplicarMigrationResumo();

