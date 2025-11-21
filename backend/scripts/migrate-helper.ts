#!/usr/bin/env ts-node
/**
 * Script auxiliar para gerenciar migrações do Prisma
 * 
 * Uso:
 *   ts-node scripts/migrate-helper.ts status
 *   ts-node scripts/migrate-helper.ts list
 *   ts-node scripts/migrate-helper.ts info <nome_migracao>
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, '../prisma/migrations');

interface MigrationInfo {
  name: string;
  path: string;
  sql: string;
  applied: boolean;
}

function getMigrations(): MigrationInfo[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true });
  const migrations: MigrationInfo[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'migration_lock.toml') {
      const migrationPath = path.join(MIGRATIONS_DIR, entry.name);
      const sqlPath = path.join(migrationPath, 'migration.sql');

      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        migrations.push({
          name: entry.name,
          path: migrationPath,
          sql,
          applied: false, // Seria necessário consultar o banco para saber
        });
      }
    }
  }

  return migrations.sort((a, b) => a.name.localeCompare(b.name));
}

function showStatus() {
  console.log('📊 Status das Migrações\n');
  console.log('Verificando status no banco de dados...\n');

  try {
    const output = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log(output);
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string };
    if (err.stdout) console.log(err.stdout);
    if (err.stderr) console.error(err.stderr);
  }
}

function listMigrations() {
  const migrations = getMigrations();

  console.log(`📋 Lista de Migrações (${migrations.length} total)\n`);

  if (migrations.length === 0) {
    console.log('Nenhuma migração encontrada.\n');
    return;
  }

  migrations.forEach((migration, index) => {
    const dateMatch = migration.name.match(/^(\d{14})/);
    let dateStr = 'Data desconhecida';
    if (dateMatch) {
      const date = new Date(
        dateMatch[1].replace(
          /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
          '$1-$2-$3T$4:$5:$6',
        ),
      );
      dateStr = date.toLocaleString('pt-BR');
    }

    const description = migration.name.replace(/^\d+_/, '');
    const lines = migration.sql.split('\n').length;

    console.log(`${index + 1}. ${description}`);
    console.log(`   📅 ${dateStr}`);
    console.log(`   📄 ${lines} linhas SQL`);
    console.log(`   📁 ${migration.name}\n`);
  });
}

function showMigrationInfo(migrationName: string) {
  const migrations = getMigrations();
  const migration = migrations.find(
    (m) => m.name === migrationName || m.name.includes(migrationName),
  );

  if (!migration) {
    console.error(`❌ Migração "${migrationName}" não encontrada.\n`);
    console.log('Migrações disponíveis:');
    migrations.forEach((m) => console.log(`  - ${m.name}`));
    return;
  }

  console.log(`📄 Detalhes da Migração: ${migration.name}\n`);
  console.log('─'.repeat(60));
  console.log(migration.sql);
  console.log('─'.repeat(60));
  console.log(`\n📊 Estatísticas:`);
  console.log(`   Linhas SQL: ${migration.sql.split('\n').length}`);
  console.log(`   Tamanho: ${(migration.sql.length / 1024).toFixed(2)} KB`);
}

function showHelp() {
  console.log(`
🔧 Helper de Migrações do Prisma

Uso:
  ts-node scripts/migrate-helper.ts <comando> [argumentos]

Comandos:
  status                    Mostra o status das migrações no banco
  list                      Lista todas as migrações disponíveis
  info <nome>               Mostra detalhes de uma migração específica
  help                      Mostra esta ajuda

Exemplos:
  ts-node scripts/migrate-helper.ts status
  ts-node scripts/migrate-helper.ts list
  ts-node scripts/migrate-helper.ts info add_telefone_to_usuario
`);
}

// Main
const command = process.argv[2];

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'list':
    listMigrations();
    break;
  case 'info':
    const migrationName = process.argv[3];
    if (!migrationName) {
      console.error('❌ Por favor, forneça o nome da migração.');
      console.log('Use: ts-node scripts/migrate-helper.ts info <nome_migracao>');
      process.exit(1);
    }
    showMigrationInfo(migrationName);
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      console.error(`❌ Comando desconhecido: ${command}\n`);
    }
    showHelp();
    process.exit(1);
}

