const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function executeMigration() {
  try {
    console.log('='.repeat(70));
    console.log('EXECUTANDO MIGRATION: Fix VendaAnalytics Constraint');
    console.log('='.repeat(70));
    console.log('');

    // Ler o arquivo de migration
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20251209010000_fix_venda_analytics_constraint_final', 'migration.sql');
    console.log(`📄 Lendo migration: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migration não encontrado: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('✓ Arquivo lido com sucesso\n');

    // Verificar estado antes
    console.log('📊 Estado ANTES da migration:');
    const before = await prisma.$queryRawUnsafe(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = '"VendaAnalytics"'::regclass
      AND contype = 'u'
      ORDER BY conname
    `);
    
    if (before.length === 0) {
      console.log('   Nenhum constraint único encontrado\n');
    } else {
      before.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.constraint_name}`);
        console.log(`      ${c.constraint_definition.substring(0, 100)}...`);
      });
      console.log('');
    }

    // Executar a migration
    console.log('⚙️  Executando migration SQL...\n');
    
    // Dividir o SQL em comandos individuais (separados por ;)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim().length === 0) continue;
      
      try {
        // Executar cada comando
        await prisma.$executeRawUnsafe(command);
        console.log(`   ✓ Comando ${i + 1}/${commands.length} executado`);
      } catch (error) {
        // Ignorar erros de "já existe" ou "não existe"
        if (
          error.message.includes('does not exist') ||
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          console.log(`   ⚠ Comando ${i + 1}/${commands.length}: ${error.message.split('\n')[0]}`);
        } else {
          console.error(`   ✗ Erro no comando ${i + 1}/${commands.length}:`, error.message);
          throw error;
        }
      }
    }

    console.log('');

    // Verificar estado depois
    console.log('📊 Estado DEPOIS da migration:');
    const after = await prisma.$queryRawUnsafe(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = '"VendaAnalytics"'::regclass
      AND contype = 'u'
      ORDER BY conname
    `);
    
    if (after.length === 0) {
      console.log('   ⚠ Nenhum constraint único encontrado (isso não deveria acontecer)');
    } else {
      after.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.constraint_name}`);
        console.log(`      ${c.constraint_definition}`);
      });
    }
    console.log('');

    // Validar resultado
    const correctConstraint = after.find(c => 
      c.constraint_name.includes('grupo') && 
      c.constraint_name.includes('subgrupo')
    );

    if (correctConstraint) {
      const def = correctConstraint.constraint_definition;
      if (def.includes('grupo') && def.includes('subgrupo') && def.includes('uf')) {
        console.log('✅ SUCESSO! Constraint atualizado corretamente.');
        console.log('   O constraint agora inclui: ano, mes, nomeFantasia, marca, grupo, subgrupo, uf');
        console.log('');
        console.log('='.repeat(70));
        console.log('Migration executada com sucesso!');
        console.log('='.repeat(70));
      } else {
        console.log('⚠️  Constraint encontrado mas pode estar incompleto');
        console.log('   Verifique manualmente a definição acima');
      }
    } else {
      console.log('❌ ERRO: Constraint com grupo e subgrupo não foi encontrado!');
      console.log('   A migration pode não ter funcionado corretamente.');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ ERRO ao executar migration:');
    console.error('   Mensagem:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    console.error('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executeMigration();
