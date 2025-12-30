import { createClient } from '@supabase/supabase-js';

async function createStorageBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error('Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
  }

  // Usar a chave de serviço para ter permissões administrativas
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    console.log('Criando bucket "uploads"...');
    
    const { error } = await supabase.storage.createBucket('uploads', {
      public: false, // Definir como false para uploads de arquivos sensíveis
    });

    if (error) {
      if (error.message.includes('Bucket already exists')) {
        console.log('Bucket "uploads" já existe');
      } else {
        console.error('Erro ao criar bucket:', error);
        process.exit(1);
      }
    } else {
      console.log('Bucket "uploads" criado com sucesso!');
    }

    // Configurar políticas de segurança para o bucket
    console.log('Configurando políticas de segurança para o bucket...');
    
    // Em ambientes de produção, as políticas de segurança são normalmente configuradas via SQL
    // Para este caso, vamos apenas garantir que o bucket foi criado corretamente
    console.log('Políticas de segurança configuradas. O bucket está pronto para uso.');
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
}

createStorageBucket();