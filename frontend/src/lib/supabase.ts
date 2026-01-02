import { createClient } from '@supabase/supabase-js';

// Obter variáveis de ambiente com valores padrão seguros
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validar configuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Variáveis de ambiente do Supabase não configuradas');
  console.warn('💡 Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local');
}

// Criar cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configurações de autenticação
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Tipos para o serviço de autenticação
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nome: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    nome?: string;
    roles?: string[];
    empresaId?: string | null;
  };
  token: string;
  expiresIn: number;
  session: any;
}

// Serviço de autenticação com Supabase
export const supabaseAuthService = {
  async login(dto: LoginDto): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

      if (error) {
        throw new Error(`Falha no login: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
        },
        token: data.session?.access_token || '',
        expiresIn: data.session?.expires_in || 3600,
        session: data.session,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido durante o login');
    }
  },

  async register(dto: RegisterDto): Promise<any> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: dto.email,
        password: dto.password,
      });

      if (error) {
        throw new Error(`Falha no registro: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido durante o registro');
    }
  },

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(`Falha no logout: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido durante o logout');
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  },

  // Listener para mudanças de estado de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};