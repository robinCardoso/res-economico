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

async function validateDataIntegrity() {
  console.log('🔍 Iniciando validação de integridade dos dados migrados...');
  
  try {
    // Verificar tabelas principais
    const tablesToValidate = [
      { name: 'empresas', expectedFields: ['id', 'cnpj', 'razao_social', 'created_at'] },
      { name: 'usuarios', expectedFields: ['id', 'email', 'nome', 'roles', 'created_at'] },
      { name: 'uploads', expectedFields: ['id', 'empresa_id', 'mes', 'ano', 'status', 'created_at'] },
      { name: 'linhas_upload', expectedFields: ['id', 'upload_id', 'conta', 'debito', 'credito', 'created_at'] },
      { name: 'resumos_economicos', expectedFields: ['id', 'empresa_id', 'titulo', 'ano', 'status', 'created_at'] },
      { name: 'processos', expectedFields: ['id', 'numero_controle', 'protocolo', 'user_id', 'empresa_id', 'created_at'] },
      { name: 'atas_reuniao', expectedFields: ['id', 'numero', 'titulo', 'data_reuniao', 'status', 'created_at'] },
      { name: 'vendas', expectedFields: ['id', 'nfe', 'data_venda', 'empresa_id', 'created_at'] },
      { name: 'pedidos', expectedFields: ['id', 'numero_pedido', 'data_pedido', 'empresa_id', 'created_at'] }
    ];
    
    console.log('\n📊 Validando estrutura das tabelas...');
    
    for (const table of tablesToValidate) {
      console.log(`\n📋 Validando tabela: ${table.name}`);
      
      try {
        // Verificar se a tabela existe e contar registros
        const { count, error: countError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          if (countError.code === '42P01') {
            console.log(`  ⚠️  Tabela "${table.name}" não existe`);
          } else {
            console.log(`  ❌ Erro ao acessar tabela "${table.name}":`, countError.message);
          }
          continue;
        }
        
        console.log(`  ✅ Tabela "${table.name}" acessível - ${count || 0} registros`);
        
        // Verificar campos esperados se houver registros
        if (count && count > 0) {
          const { data: sampleRecord, error: sampleError } = await supabase
            .from(table.name)
            .select('*')
            .limit(1);
          
          if (sampleError) {
            console.log(`  ⚠️  Erro ao obter amostra de dados:`, sampleError.message);
          } else if (sampleRecord && sampleRecord.length > 0) {
            const record = sampleRecord[0];
            const missingFields = table.expectedFields.filter(field => !(field in record));
            
            if (missingFields.length === 0) {
              console.log(`  ✅ Campos esperados presentes: ${table.expectedFields.join(', ')}`);
            } else {
              console.log(`  ⚠️  Campos ausentes: ${missingFields.join(', ')}`);
            }
          }
        }
      } catch (tableError) {
        console.log(`  ❌ Erro ao validar tabela "${table.name}":`, tableError.message);
      }
    }
    
    // Validar relacionamentos entre tabelas
    console.log('\n🔗 Validando relacionamentos entre tabelas...');
    
    // Verificar relacionamento empresas -> usuarios
    try {
      const { data: userSample, error: userError } = await supabase
        .from('usuarios')
        .select('id, empresa_id')
        .not('empresa_id', 'is', null)
        .limit(1);
      
      if (!userError && userSample && userSample.length > 0) {
        const userId = userSample[0].id;
        const empresaId = userSample[0].empresa_id;
        
        // Verificar se empresa associada existe
        const { data: empresa, error: empresaError } = await supabase
          .from('empresas')
          .select('id')
          .eq('id', empresaId)
          .single();
        
        if (!empresaError && empresa) {
          console.log('  ✅ Relacionamento usuarios -> empresas está funcionando');
        } else {
          console.log('  ⚠️  Problema com relacionamento usuarios -> empresas');
        }
      }
    } catch (relError) {
      console.log('  ⚠️  Erro ao validar relacionamento usuarios -> empresas:', relError.message);
    }
    
    // Verificar relacionamento uploads -> empresas
    try {
      const { data: uploadSample, error: uploadError } = await supabase
        .from('uploads')
        .select('id, empresa_id')
        .limit(1);
      
      if (!uploadError && uploadSample && uploadSample.length > 0) {
        const uploadEmpresaId = uploadSample[0].empresa_id;
        
        if (uploadEmpresaId) {
          const { data: empresa, error: empresaError } = await supabase
            .from('empresas')
            .select('id')
            .eq('id', uploadEmpresaId)
            .single();
          
          if (!empresaError && empresa) {
            console.log('  ✅ Relacionamento uploads -> empresas está funcionando');
          } else {
            console.log('  ⚠️  Problema com relacionamento uploads -> empresas');
          }
        }
      }
    } catch (relError) {
      console.log('  ⚠️  Erro ao validar relacionamento uploads -> empresas:', relError.message);
    }
    
    // Validar dados de exemplo
    console.log('\n🔍 Validando dados de exemplo...');
    
    // Verificar se temos dados consistentes
    const { count: empresasCount, error: empresasError } = await supabase
      .from('empresas')
      .select('*', { count: 'exact', head: true });
    
    const { count: usuariosCount, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    
    if (!empresasError && !usuariosError) {
      console.log(`  🏢 Empresas: ${empresasCount || 0}`);
      console.log(`  👤 Usuários: ${usuariosCount || 0}`);
      
      if (empresasCount && empresasCount > 0 && usuariosCount && usuariosCount > 0) {
        console.log('  ✅ Ambas tabelas principais têm dados');
      } else {
        console.log('  ⚠️  Uma ou ambas tabelas principais estão vazias');
      }
    }
    
    console.log('\n✅ Validação de integridade dos dados concluída!');
    console.log('📋 Próximos passos:');
    console.log('   1. Verificar se todos os dados críticos foram migrados');
    console.log('   2. Validar consistência dos dados em todas as tabelas');
    console.log('   3. Testar os fluxos de negócio com os dados migrados');
    
  } catch (error) {
    console.error('❌ Erro durante a validação de integridade dos dados:', error.message);
    process.exit(1);
  }
}

// Executar a função principal se este arquivo for executado diretamente
if (require.main === module) {
  validateDataIntegrity();
}

export { validateDataIntegrity };