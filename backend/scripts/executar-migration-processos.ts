import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function executarMigration() {
  console.log('=== Executando Migration de Processos ===\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '../prisma/migrations/manual_add_processos_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir o SQL em comandos individuais (separados por ;)
    const comandos = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`Encontrados ${comandos.length} comandos SQL para executar\n`);

    // Executar cada comando separadamente
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i];
      
      // Pular comentários
      if (comando.startsWith('--')) {
        continue;
      }

      try {
        console.log(`Executando comando ${i + 1}/${comandos.length}...`);
        
        // Usar $executeRawUnsafe para executar SQL direto
        await prisma.$executeRawUnsafe(comando);
        
        console.log(`✅ Comando ${i + 1} executado com sucesso\n`);
      } catch (error: any) {
        // Se o erro for de permissão, tentar continuar
        if (error.message?.includes('permission denied')) {
          console.log(`⚠️  Comando ${i + 1} falhou por permissão (pode já existir): ${error.message.substring(0, 100)}...\n`);
          // Continuar com os próximos comandos
          continue;
        }
        
        // Se o erro for de objeto já existir, continuar
        if (error.message?.includes('already exists') || error.message?.includes('does not exist')) {
          console.log(`⚠️  Comando ${i + 1}: ${error.message.substring(0, 100)}...\n`);
          continue;
        }
        
        // Outros erros, mostrar mas continuar
        console.log(`⚠️  Erro no comando ${i + 1}: ${error.message.substring(0, 200)}\n`);
      }
    }

    console.log('✅ Migration executada!');
    console.log('\nVerificando se as tabelas foram criadas...\n');

    // Verificar se as tabelas foram criadas
    const tabelas = await prisma.$queryRawUnsafe(
      `SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Processo', 'ProcessoItem', 'ProcessoAnexo', 'ProcessoHistorico')
      ORDER BY table_name;`
    );

    console.log(`Tabelas encontradas: ${tabelas.length}/4`);
    tabelas.forEach(t => console.log(`  ✅ ${t.table_name}`));

    if (tabelas.length === 4) {
      console.log('\n✅ Todas as tabelas foram criadas com sucesso!');
    } else {
      console.log('\n⚠️  Algumas tabelas podem não ter sido criadas. Verifique os erros acima.');
    }

    // Verificar enums
    const enums = await prisma.$queryRawUnsafe(
      `SELECT typname 
      FROM pg_type 
      WHERE typname IN ('TipoProcesso', 'SituacaoProcesso', 'CategoriaReclamacao', 'PrioridadeProcesso', 'TipoArquivoProcesso')
      ORDER BY typname;`
    );

    console.log(`\nEnums encontrados: ${enums.length}/5`);
    enums.forEach(e => console.log(`  ✅ ${e.typname}`));

  } catch (error: any) {
    console.error('\n❌ Erro ao executar migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executarMigration();

