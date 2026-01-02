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

// Função para verificar e migrar dados de referência que são automaticamente atualizados pelo sistema
async function migrateReferenceData() {
  console.log('📦 Iniciando verificação de dados de referência...');
  
  try {
    console.log('⚠️  AVISO: marcas, grupos e subgrupos são atualizados automaticamente pelo sistema');
    console.log('💡 Estas tabelas NÃO devem receber valores manuais, pois são sincronizadas automaticamente');
    console.log('📋 Verificando integridade das tabelas de referência...');
    
    // Verificar se as tabelas existem
    const tablesToCheck = ['marcas', 'grupos', 'subgrupos'];
    
    for (const table of tablesToCheck) {
      try {
        const { error: checkError } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });
        
        if (checkError && checkError.code === '42P01') {
          console.log(`⚠️  Tabela "${table}" não existe no Supabase (aguardando criação do schema)`);
        } else if (checkError) {
          console.log(`⚠️  Erro ao verificar tabela "${table}":`, checkError.message);
        } else {
          console.log(`✅ Tabela "${table}" está pronta para sincronização automática`);
        }
      } catch (checkError) {
        console.log(`⚠️  Erro ao verificar tabela "${table}":`, checkError.message);
      }
    }
    
    console.log('\n✅ Verificação de tabelas de referência concluída!');
    console.log('📋 Próximos passos:');
    console.log('   1. As tabelas marcas, grupos e subgrupos serão mantidas vazias para sincronização automática');
    console.log('   2. O sistema de sincronização (como o Bravo ERP) atualizará essas tabelas automaticamente');
    console.log('   3. Prossiga com a migração dos dados principais (empresas e usuários)');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação de dados de referência:', error.message);
    process.exit(1);
  }
}

// Exportar função para uso em outros módulos
export { migrateReferenceData };

// Executar a função principal se este arquivo for executado diretamente
if (require.main === module) {
  migrateReferenceData();
}