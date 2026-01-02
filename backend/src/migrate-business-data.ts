import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env' });

// Obter credenciais do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

// Cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateBusinessData() {
  console.log('📊 Iniciando migração de dados de negócio (uploads, linhas, resumos)...');
  
  try {
    console.log('🔍 Verificando tabelas de negócio...');
    
    // Verificar se as tabelas existem
    const businessTables = ['uploads', 'linhas_upload', 'resumos_economicos', 'processos', 'atas_reuniao', 'vendas', 'pedidos'];
    
    for (const table of businessTables) {
      try {
        const { error: checkError } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });
        
        if (checkError && checkError.code === '42P01') {
          console.log(`⚠️  Tabela "${table}" não existe no Supabase (aguardando criação do schema)`);
        } else if (checkError) {
          console.log(`⚠️  Erro ao verificar tabela "${table}":`, checkError.message);
        } else {
          console.log(`✅ Tabela "${table}" está pronta`);
        }
      } catch (checkError) {
        console.log(`⚠️  Erro ao verificar tabela "${table}":`, checkError.message);
      }
    }
    
    // Contar registros existentes antes da migração
    console.log('\n📊 Contando registros existentes...');
    
    for (const table of businessTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`⚠️  Não foi possível contar registros em "${table}":`, error.message);
        } else {
          console.log(`   ${table}: ${count} registros`);
        }
      } catch (countError) {
        console.log(`⚠️  Erro ao contar registros em "${table}":`, countError.message);
      }
    }
    
    console.log('\n✅ Verificação de tabelas de negócio concluída!');
    console.log('📋 Próximos passos:');
    console.log('   1. Conectar ao banco de dados original para extrair os dados de negócio');
    console.log('   2. Transformar os dados conforme necessário para o novo schema');
    console.log('   3. Inserir os dados transformados no Supabase, respeitando as relações');
    console.log('   4. Validar a integridade dos dados migrados');
    console.log('   5. Verificar os relacionamentos entre uploads, linhas e resumos');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação de dados de negócio:', error.message);
    process.exit(1);
  }
}

// Executar a função principal se este arquivo for executado diretamente
if (require.main === module) {
  migrateBusinessData();
}

export { migrateBusinessData };