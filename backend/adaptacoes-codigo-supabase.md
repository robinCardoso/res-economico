# Adaptações no Código para Supabase Auth

## 1. Backend (NestJS)

### 1.1. Atualização de Dependências

Adicionar as dependências necessárias:

```bash
npm install @supabase/supabase-js
npm install --save-dev @supabase/supabase-js
```

### 1.2. Configuração do Supabase Module

Criar um módulo para gerenciar o cliente do Supabase:

```typescript
// supabase/supabase.module.ts
import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
```

```typescript
// supabase/supabase.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAuth() {
    return this.client.auth;
  }
}
```

### 1.3. Atualização do Auth Service

Substituir o serviço de autenticação atual:

```typescript
// auth/supabase-auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SupabaseAuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.getAuth().signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Atualizar o registro do usuário com o ID do Supabase se ainda não estiver associado
    await this.prisma.usuario.update({
      where: { email },
      data: { 
        supabase_user_id: data.user.id,
        ultimoAcesso: new Date(),
      },
    });

    // Obter informações do usuário para o payload do JWT
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nome: true,
        roles: true,
        empresaId: true,
      },
    });

    const payload = { 
      sub: data.user.id, 
      email: user.email, 
      roles: user.roles,
      userId: user.id 
    };
    
    return {
      user,
      token: this.jwtService.sign(payload),
      expiresIn: 3600, // 1 hora
    };
  }

  async signUp(email: string, password: string, nome: string) {
    const { data, error } = await this.supabaseService.getAuth().signUp({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Criar registro do usuário na tabela personalizada
    const user = await this.prisma.usuario.create({
      data: {
        email,
        nome,
        supabase_user_id: data.user.id,
        roles: ['user'],
      },
    });

    return user;
  }

  async signOut(userId: string) {
    const { error } = await this.supabaseService.getAuth().signOut();
    
    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Signed out successfully' };
  }
}
```

### 1.4. Atualização do Auth Guard

Criar um guard para proteger as rotas:

```typescript
// auth/supabase-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Obter o token do header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorização ausente');
    }

    const token = authHeader.substring(7);

    try {
      // Verificar o token com o Supabase
      const { data, error } = await this.supabaseService.getAuth().getUser(token);
      
      if (error) {
        throw new UnauthorizedException('Token inválido');
      }

      // Armazenar o usuário no request para uso posterior
      request.user = data.user;
      
      // Verificar roles se especificado
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
      
      if (!requiredRoles) {
        return true;
      }

      // Obter roles do usuário do banco de dados
      const prisma = context.getArgs()[0].prisma; // Ajuste conforme necessário
      const userProfile = await prisma.usuario.findUnique({
        where: { supabase_user_id: data.user.id },
        select: { roles: true },
      });

      if (!userProfile) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return requiredRoles.some((role) => userProfile.roles.includes(role));
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
```

### 1.5. Atualização do Auth Decorator

```typescript
// auth/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      return undefined;
    }

    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
```

### 1.6. Atualização do Controller de Autenticação

```typescript
// auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  SetMetadata,
} from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { GetUser } from './get-user.decorator';

// Tipos para os DTOs
interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  nome: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: SupabaseAuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto.email, loginDto.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(
      registerDto.email,
      registerDto.password,
      registerDto.nome,
    );
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('logout')
  async logout(@GetUser('id') userId: string) {
    return this.authService.signOut(userId);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: any) {
    return user;
  }

  @UseGuards(SupabaseAuthGuard)
  @SetMetadata('roles', ['admin'])
  @Get('admin')
  async adminAccess(@GetUser() user: any) {
    return { message: 'Acesso administrativo', user };
  }
}
```

### 1.7. Atualização do App Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
// outros módulos

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    // outros módulos
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

## 2. Frontend (Next.js)

### 2.1. Configuração do Cliente Supabase

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2.2. Atualização do Serviço de Autenticação

```typescript
// services/supabase-auth.service.ts
import { supabase } from '@/lib/supabase';

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
    nome: string;
    roles: string[];
    empresaId?: string | null;
  };
  token: string;
  expiresIn: number;
}

export const supabaseAuthService = {
  async login(dto: LoginDto): Promise<LoginResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Obter informações do usuário do banco de dados
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nome, roles, empresa_id')
      .eq('supabase_user_id', data.user.id)
      .single();

    if (userError) {
      throw new Error('Erro ao obter informações do usuário');
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        roles: userData.roles,
        empresaId: userData.empresa_id,
      },
      token: data.session.access_token,
      expiresIn: data.session.expires_in,
    };
  },

  async register(dto: RegisterDto): Promise<any> {
    const { data, error } = await supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Criar perfil do usuário no banco de dados
    const { error: profileError } = await supabase
      .from('usuarios')
      .insert([{
        supabase_user_id: data.user.id,
        email: dto.email,
        nome: dto.nome,
        roles: ['user'],
      }]);

    if (profileError) {
      throw new Error('Erro ao criar perfil do usuário');
    }

    return data;
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
```

### 2.3. Atualização do HTTP Client

```typescript
// lib/http.ts
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { supabase } from './supabase'; // Importar o cliente do Supabase

// Função para obter a baseURL dinamicamente
const getBaseURL = (): string | undefined => {
  if (typeof window === 'undefined') {
    // Server-side: usar variável de ambiente ou undefined
    return process.env.NEXT_PUBLIC_API_URL?.trim() || undefined;
  }

  // Client-side: SEMPRE priorizar variável de ambiente do .env.local
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  
  if (envApiUrl) {
    // Se há variável de ambiente, usar SEMPRE ela e limpar localStorage conflitante
    const storedApiUrl = localStorage.getItem('api-url');
    
    if (storedApiUrl && storedApiUrl.trim() !== envApiUrl) {
      // Limpar automaticamente localStorage conflitante (apenas uma vez)
      if (!hasCleanedLocalStorage) {
        localStorage.removeItem('api-url');
        hasCleanedLocalStorage = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[HTTP] ✅ Usando URL do .env.local: ${envApiUrl}`
          );
          console.log(
            `[HTTP] 🧹 Removido valor conflitante do localStorage (${storedApiUrl})`
          );
        }
      }
    }
    
    return envApiUrl;
  }

  // Se não há variável de ambiente, verificar localStorage (permite configuração dinâmica temporária)
  const storedApiUrl = localStorage.getItem('api-url');
  if (storedApiUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[HTTP] ⚠️ Usando URL do localStorage (temporário). Configure NEXT_PUBLIC_API_URL no .env.local para uso permanente.'
      );
    }
    return storedApiUrl.trim();
  }

  // Fallback: usar localhost (funciona quando frontend e backend estão na mesma máquina)
  return 'http://localhost:3000';
};

// Criar instância do axios sem baseURL fixa
export const api = axios.create({
  timeout: 60_000, // 60 segundos padrão
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token e baseURL dinâmica nas requisições
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      // Definir baseURL dinamicamente a cada requisição
      const dynamicBaseURL = getBaseURL();
      if (dynamicBaseURL && !config.baseURL) {
        config.baseURL = dynamicBaseURL;
      }

      // Obter token do Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (error.response) {
      const status = error.response.status;
      const isAuthError = status === 401 || status === 403;
      const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      
      // Se receber 401, limpar autenticação
      if (status === 401 && typeof window !== 'undefined') {
        await supabase.auth.signOut(); // Logout do Supabase
        localStorage.removeItem('auth-storage');
        // Não redirecionar se já estiver na página de login
        if (!isOnLoginPage) {
          window.location.href = '/login';
        }
      }
      
      // Restante do tratamento de erros...
    }
    
    // Lançar erro original
    return Promise.reject(error);
  },
);
```

### 2.4. Atualização do Contexto de Autenticação

```typescript
// contexts/auth.context.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Obter sessão atual
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      // Ouvir por mudanças de autenticação
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
          setLoading(false);
          
          if (!_event.includes('SIGNED_IN') && !_event.includes('SIGNED_OUT')) {
            return;
          }
          
          // Redirecionar após login/logout se necessário
          if (_event === 'SIGNED_OUT') {
            router.push('/login');
          } else if (_event === 'SIGNED_IN') {
            router.push('/dashboard');
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    getInitialSession();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 3. Atualizações no .env

Adicionar as variáveis de ambiente necessárias para o Supabase:

```env
# Supabase
SUPABASE_URL=seu_url_supabase_aqui
SUPABASE_ANON_KEY=sua_chave_anon_supabase_aqui
NEXT_PUBLIC_SUPABASE_URL=seu_url_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase_aqui

# JWT (se ainda for necessário para outros propósitos)
JWT_SECRET=sua_chave_secreta_jwt_aqui_para_assinatura_dos_tokens
JWT_EXPIRES_IN=24h
```

## 4. Considerações Finais

### 4.1. Testes Necessários
- Testar fluxo completo de autenticação (login, logout, registro)
- Verificar proteção de rotas
- Validar sistema de roles e permissões
- Testar recuperação de senha
- Verificar comportamento em diferentes ambientes (desenvolvimento, produção)

### 4.2. Migração Gradual
- Implementar o novo sistema paralelamente ao antigo
- Testar extensivamente antes de desativar o antigo
- Planejar um período de transição para os usuários
- Considerar a necessidade de redefinição de senhas para segurança

### 4.3. Segurança
- Configurar políticas de RLS corretamente
- Validar todas as entradas de usuário
- Implementar proteção contra ataques comuns (CSRF, XSS, etc.)
- Configurar os provedores de autenticação (Google, etc.) conforme necessário