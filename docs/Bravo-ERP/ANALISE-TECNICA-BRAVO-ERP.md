# 🔍 ANÁLISE TÉCNICA DETALHADA: Módulo Bravo ERP

## 📋 SUMÁRIO

Este documento complementa o `PLANO-IMPLEMENTACAO-BRAVO-ERP.md` com análises técnicas detalhadas, mapeamento de código, dependências específicas e exemplos de adaptação.

---

## 📂 MAPEAMENTO DE ARQUIVOS - CÓDIGO ORIGINAL → ADAPTAÇÃO

### Backend

| Arquivo Original (painel-completo) | Arquivo Adaptado (NestJS) | Status |
|-----------------------------------|---------------------------|--------|
| `src/app/api/bravo-erp/config/route.ts` | `backend/src/bravo-erp/config/bravo-config.controller.ts` | 🔄 Adaptar |
| `src/app/api/bravo-erp/sincronizar/route.ts` | `backend/src/bravo-erp/sync/sync.controller.ts` | 🔄 Adaptar |
| `src/app/api/bravo-erp/mapeamento/route.ts` | `backend/src/bravo-erp/mapping/mapping.controller.ts` | 🔄 Adaptar |
| `src/lib/bravo-erp/bravo-erp-client-v2.ts` | `backend/src/bravo-erp/client/bravo-erp-client-v2.service.ts` | 🔄 Adaptar |
| `src/lib/bravo-erp/bravo-erp-mapping.ts` | `backend/src/bravo-erp/mapping/campo-transform.service.ts` | 🔄 Adaptar |
| `src/lib/core/sync-lock.ts` | `backend/src/bravo-erp/sync/sync-lock.manager.ts` | 🔄 Adaptar |

### Frontend

| Arquivo Original (painel-completo) | Arquivo Adaptado (Next.js) | Status |
|-----------------------------------|---------------------------|--------|
| `src/app/admin/bravo-erp/page.tsx` | `frontend/src/app/(app)/admin/importações/bravo-erp/produtos/page.tsx` | 🔄 Adaptar |
| `src/app/admin/bravo-erp/mapeamento/page.tsx` | `frontend/src/app/(app)/admin/importações/bravo-erp/produtos/mapeamento/page.tsx` | 🔄 Adaptar |

#### 📝 Nota sobre Estrutura:
- Estrutura preparada para futuro: `/bravo-erp/vendas` e `/bravo-erp/pedidos`
- Estrutura temporária também: `/importações/vendas` e `/importações/pedidos` (sem Bravo ERP)

---

## 🔧 DEPENDÊNCIAS E SUBSTITUIÇÕES

### 1. Supabase → Prisma

#### Funções Supabase que precisam ser substituídas:

| Função Supabase | Equivalente Prisma | Exemplo |
|----------------|-------------------|---------|
| `supabase.from('table').select('*')` | `prisma.table.findMany()` | Ver abaixo |
| `supabase.from('table').select('*').eq('id', id).single()` | `prisma.table.findUnique({ where: { id } })` | Ver abaixo |
| `supabase.from('table').insert(data)` | `prisma.table.create({ data })` | Ver abaixo |
| `supabase.from('table').upsert(data, { onConflict: 'key' })` | `prisma.table.upsert({ where, create, update })` | Ver abaixo |
| `supabase.from('table').update(data).eq('id', id)` | `prisma.table.update({ where: { id }, data })` | Ver abaixo |
| `supabase.from('table').delete().eq('id', id)` | `prisma.table.delete({ where: { id } })` | Ver abaixo |

#### Exemplos de Adaptação:

**❌ Código Original (Supabase):**
```typescript
// Buscar configurações
const { data: configs, error } = await supabase
  .schema('api')
  .from('bravo_sync_config')
  .select('chave, valor');

// Converter array em objeto
const configObj: any = {};
if (configs) {
  configs.forEach(config => {
    configObj[config.chave] = config.valor;
  });
}
```

**✅ Código Adaptado (Prisma):**
```typescript
// Buscar configurações
const configs = await this.prisma.bravoSyncConfig.findMany({
  select: {
    chave: true,
    valor: true
  }
});

// Converter array em objeto
const configObj: Record<string, string> = {};
configs.forEach(config => {
  configObj[config.chave] = config.valor;
});
```

**❌ Código Original (Supabase - UPSERT):**
```typescript
const { error } = await supabase
  .schema('api')
  .from('produtos')
  .upsert(produto, {
    onConflict: 'referencia'
  });
```

**✅ Código Adaptado (Prisma - UPSERT):**
```typescript
await this.prisma.produto.upsert({
  where: {
    referencia: produto.referencia
  },
  update: produto,
  create: produto
});
```

**❌ Código Original (Supabase - INSERT com SELECT):**
```typescript
const { data: newLog, error } = await supabase
  .schema('api')
  .from('bravo_sync_logs')
  .insert({
    sync_type: 'complete',
    status: 'running'
  })
  .select('id')
  .single();
```

**✅ Código Adaptado (Prisma - CREATE com RETURN):**
```typescript
const newLog = await this.prisma.bravoSyncLog.create({
  data: {
    syncType: 'complete',
    status: 'running'
  },
  select: {
    id: true
  }
});
```

**❌ Código Original (Supabase - UPDATE):**
```typescript
await supabase
  .schema('api')
  .from('bravo_sync_logs')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', syncLogId);
```

**✅ Código Adaptado (Prisma - UPDATE):**
```typescript
await this.prisma.bravoSyncLog.update({
  where: { id: syncLogId },
  data: {
    status: 'completed',
    completedAt: new Date()
  }
});
```

**❌ Código Original (Supabase - Query com condicionais):**
```typescript
const { data: maxDataResult } = await supabase
  .schema('api')
  .from('produtos')
  .select('_data_ult_modif')
  .not('_data_ult_modif', 'is', null)
  .order('_data_ult_modif', { ascending: false })
  .limit(1)
  .single();
```

**✅ Código Adaptado (Prisma - Query com condicionais):**
```typescript
const maxDataResult = await this.prisma.produto.findFirst({
  where: {
    _dataUltModif: {
      not: null
    }
  },
  select: {
    _dataUltModif: true
  },
  orderBy: {
    _dataUltModif: 'desc'
  }
});
```

---

### 2. Next.js API Routes → NestJS Controllers

#### ❌ Código Original (Next.js API Route):
```typescript
// app/api/bravo-erp/config/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from '@/lib/core/supabase';

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('bravo_sync_config')
      .select('*');
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ...
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

#### ✅ Código Adaptado (NestJS Controller):
```typescript
// bravo-erp/config/bravo-config.controller.ts
import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { BravoConfigService } from './bravo-config.service';
import { CreateConfigDto, ConfigResponseDto } from '../dto/config.dto';

@Controller('bravo-erp/config')
export class BravoConfigController {
  constructor(private readonly configService: BravoConfigService) {}

  @Get()
  async getConfig(): Promise<ConfigResponseDto> {
    try {
      const config = await this.configService.getConfig();
      return {
        success: true,
        config
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  async saveConfig(@Body() dto: CreateConfigDto): Promise<{ success: boolean }> {
    try {
      await this.configService.saveConfig(dto);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
```

---

### 3. Autenticação - Supabase Auth → JWT + Passport

#### ❌ Código Original (Supabase Auth):
```typescript
import { authContext } from "@/lib/core/auth-context";

const user = await authContext.getUserFromRequest(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### ✅ Código Adaptado (JWT + Passport):
```typescript
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Post('sincronizar')
async sincronizar(@Request() req, @Body() dto: SyncRequestDto) {
  const userId = req.user.id; // req.user vem do JWT guard
  const userEmail = req.user.email;
  // ...
}
```

---

### 4. Lock Manager - Adaptação para Redis

#### ❌ Código Original (Sync Lock - In-Memory):
```typescript
// sync-lock.ts (painel-completo)
class SyncLockManager {
  private locks: Map<string, Lock> = new Map();
  
  acquireLock(userId: string, userEmail: string, type: string) {
    // Verificar se já existe lock ativo
    if (this.hasActiveLock()) {
      return { success: false, error: 'Sync already in progress' };
    }
    
    const lockId = uuid();
    this.locks.set(lockId, {
      id: lockId,
      userId,
      userEmail,
      type,
      startedAt: new Date(),
      status: 'running'
    });
    
    return { success: true, lockId };
  }
}
```

#### ✅ Código Adaptado (Redis):
```typescript
// sync-lock.manager.ts (NestJS)
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class SyncLockManager {
  private readonly LOCK_KEY = 'bravo-erp:sync:lock';
  private readonly LOCK_TTL = 7200; // 2 horas em segundos

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async acquireLock(userId: string, userEmail: string, type: string): Promise<{ success: boolean; lockId?: string; error?: string }> {
    // Verificar se já existe lock ativo
    const existingLock = await this.redis.get(this.LOCK_KEY);
    if (existingLock) {
      return { success: false, error: 'Sincronização já em andamento' };
    }

    const lockId = uuid();
    const lockData = {
      id: lockId,
      userId,
      userEmail,
      type,
      startedAt: new Date().toISOString(),
      status: 'running'
    };

    // Criar lock no Redis com TTL
    await this.redis.set(
      this.LOCK_KEY,
      JSON.stringify(lockData),
      'EX',
      this.LOCK_TTL
    );

    return { success: true, lockId };
  }

  async releaseLock(lockId: string, status: 'completed' | 'failed' | 'cancelled'): Promise<void> {
    await this.redis.del(this.LOCK_KEY);
  }

  async getCurrentSync(): Promise<any | null> {
    const lockData = await this.redis.get(this.LOCK_KEY);
    return lockData ? JSON.parse(lockData) : null;
  }
}
```

**Nota:** O projeto já tem Redis configurado via BullMQ, então podemos reutilizar a mesma instância.

---

## 🔄 ADAPTAÇÕES ESPECÍFICAS POR COMPONENTE

### 1. Bravo ERP Client

#### Estrutura do Cliente Original:
```typescript
// bravo-erp-client-v2.ts
export class BravoERPClientV2 {
  private baseUrl: string;
  private cliente: string;
  private token: string;
  
  constructor() {
    // Configuração vazia - será carregada do banco
  }
  
  private async loadConfig(): Promise<void> {
    // Carrega do Supabase
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('bravo_sync_config')
      .select('chave, valor');
    // ...
  }
  
  async consultarProdutosCompleto(params: {
    page: number;
    limit?: number;
    useNewSorting?: boolean;
    filterDate?: string;
  }): Promise<BravoResponse<BravoProduto[]>> {
    // Implementação...
  }
}
```

#### Adaptação para NestJS Service:
```typescript
// bravo-erp-client-v2.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class BravoErpClientV2Service {
  private axiosInstance: AxiosInstance;
  private config: any = null;
  private configLoaded = false;

  constructor(private readonly prisma: PrismaService) {
    this.axiosInstance = axios.create({
      timeout: 30000
    });
  }

  private async loadConfig(): Promise<void> {
    if (this.configLoaded && this.config) {
      return; // Já carregado
    }

    const configs = await this.prisma.bravoSyncConfig.findMany({
      select: {
        chave: true,
        valor: true
      }
    });

    const configObj: Record<string, string> = {};
    configs.forEach(config => {
      configObj[config.chave] = config.valor;
    });

    this.config = {
      baseUrl: configObj['bravo_base_url'] || 'https://v2.bravoerp.com.br',
      cliente: configObj['bravo_cliente'] || '',
      token: configObj['bravo_token'] || '',
      ambiente: configObj['bravo_ambiente'] || 'p',
      server: configObj['bravo_server'] || 'alpha',
      timeout: parseInt(configObj['bravo_timeout'] || '30', 10) * 1000
    };

    this.configLoaded = true;
  }

  async consultarProdutosCompleto(params: {
    page: number;
    limit?: number;
    useNewSorting?: boolean;
    filterDate?: string;
  }): Promise<BravoResponse<BravoProduto[]>> {
    await this.loadConfig();

    // Validar configuração
    if (!this.config.token) {
      throw new Error('Token do Bravo ERP não configurado');
    }

    // Construir URL
    const url = `${this.config.baseUrl}/${this.config.cliente}/api/get/Get.php`;
    
    // Construir query params
    const queryParams = new URLSearchParams({
      token: this.config.token,
      page: params.page.toString(),
      // ... outros parâmetros
    });

    try {
      const response = await this.axiosInstance.get(`${url}?${queryParams}`);
      
      // Processar resposta
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'REQUEST_FAILED',
          message: error.message
        }
      };
    }
  }
}
```

---

### 2. Mapping/Transform Service

#### Código Original:
```typescript
// bravo-erp-mapping.ts
export async function transformarProduto(
  produtoBravo: any,
  mapeamentos?: CampoMapeamento[]
): Promise<any> {
  // Buscar mapeamentos do Supabase se não fornecidos
  if (!mapeamentos) {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('bravo_campo_mapeamento')
      .select('*')
      .eq('ativo', true)
      .order('ordem');
    mapeamentos = data || [];
  }
  
  // Aplicar transformações
  // ...
}
```

#### Adaptação para NestJS Service:
```typescript
// campo-transform.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';

@Injectable()
export class CampoTransformService {
  constructor(private readonly prisma: PrismaService) {}

  async transformarProduto(
    produtoBravo: any,
    mapeamentos?: any[]
  ): Promise<any> {
    // Buscar mapeamentos do Prisma se não fornecidos
    if (!mapeamentos) {
      mapeamentos = await this.prisma.bravoCampoMapeamento.findMany({
        where: {
          ativo: true
        },
        orderBy: {
          ordem: 'asc'
        }
      });
    }

    const produtoTransformado: any = {};

    for (const mapeamento of mapeamentos) {
      if (!mapeamento.ativo) continue;

      const valorBravo = this.obterValorNested(
        produtoBravo,
        mapeamento.campoBravo
      );

      if (valorBravo === undefined || valorBravo === null) continue;

      const valorTransformado = this.aplicarTransformacao(
        valorBravo,
        mapeamento.tipoTransformacao
      );

      this.definirValorNested(
        produtoTransformado,
        mapeamento.campoInterno,
        valorTransformado
      );
    }

    return produtoTransformado;
  }

  private obterValorNested(obj: any, path: string): any {
    // Implementar lógica de acesso nested (ex: "gtin.gtin")
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private aplicarTransformacao(valor: any, tipo: string): any {
    switch (tipo) {
      case 'direto':
        return valor;
      case 'decimal':
        return parseFloat(valor) || 0;
      case 'boolean':
        return valor === 'S' || valor === true || valor === 1;
      case 'boolean_invertido':
        return valor === 'N' || valor === false || valor === 0;
      case 'datetime':
        return new Date(valor);
      case 'json':
        return { valor };
      default:
        return valor;
    }
  }

  private definirValorNested(obj: any, path: string, valor: any): void {
    // Implementar lógica de definição nested (ex: "metadata->campo")
    if (path.includes('->')) {
      // Campo JSONB
      const [campo, campoJson] = path.split('->');
      if (!obj[campo]) obj[campo] = {};
      obj[campo][campoJson.trim()] = valor;
    } else {
      obj[path] = valor;
    }
  }
}
```

---

## 📦 ESTRUTURA DE DTOs (Data Transfer Objects)

### 1. Config DTOs

```typescript
// dto/config.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export class CreateConfigDto {
  @IsString()
  baseUrl: string;

  @IsString()
  cliente: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  senha?: string;

  @IsString()
  @IsOptional()
  pdv?: string;

  @IsEnum(['p', 'h'])
  ambiente: 'p' | 'h';

  @IsString()
  @IsOptional()
  server?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsNumber()
  @IsOptional()
  timeout?: number;

  @IsBoolean()
  @IsOptional()
  verificar_duplicatas?: boolean;

  @IsBoolean()
  @IsOptional()
  usar_data_ult_modif?: boolean;
}

export class ConfigResponseDto {
  success: boolean;
  config?: CreateConfigDto;
  error?: string;
}
```

### 2. Sync DTOs

```typescript
// dto/sync-request.dto.ts
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class SyncRequestDto {
  @IsBoolean()
  @IsOptional()
  apenas_ativos?: boolean;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsNumber()
  @IsOptional()
  pages?: number;

  @IsString()
  @IsOptional()
  resume_sync_id?: string;

  @IsBoolean()
  @IsOptional()
  verificar_duplicatas?: boolean;

  @IsBoolean()
  @IsOptional()
  usar_data_ult_modif?: boolean;

  @IsBoolean()
  @IsOptional()
  modo_teste?: boolean;
}

export class SyncResponseDto {
  success: boolean;
  message?: string;
  sync_log_id?: string;
  lock_id?: string;
  data?: {
    filtro_aplicado: string;
    total_produtos_bravo: number;
    produtos_filtrados: number;
    paginas_processadas: number;
    tempo_total_segundos: number;
  };
  error?: string;
}
```

---

## 🔌 ENDPOINTS DA API

### Backend (NestJS) - Rotas Esperadas:

```
GET    /bravo-erp/config              # Buscar configuração
POST   /bravo-erp/config              # Salvar configuração

GET    /bravo-erp/mapeamento          # Buscar mapeamentos
POST   /bravo-erp/mapeamento          # Salvar mapeamentos

POST   /bravo-erp/sincronizar         # Iniciar sincronização
GET    /bravo-erp/sync-status         # Status da sincronização
DELETE /bravo-erp/sync-status         # Cancelar sincronização
GET    /bravo-erp/sync-progress       # Progresso da sincronização
POST   /bravo-erp/resume-sync         # Retomar sincronização

GET    /bravo-erp/stats               # Estatísticas
GET    /bravo-erp/sync-logs           # Logs de sincronização

POST   /bravo-erp/discover-fields     # Descobrir campos da API
GET    /bravo-erp/preview-automatico  # Preview automático
```

---

## ⚙️ CONFIGURAÇÃO DO MÓDULO

### Adicionar ao AppModule:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { BravoErpModule } from './bravo-erp/bravo-erp.module';

@Module({
  imports: [
    // ... outros módulos
    BravoErpModule,
  ],
})
export class AppModule {}
```

### Estrutura do Módulo:

```typescript
// bravo-erp/bravo-erp.module.ts
import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/core.module';
import { BravoConfigModule } from './config/config.module';
import { SyncModule } from './sync/sync.module';
import { MappingModule } from './mapping/mapping.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    CoreModule, // Para PrismaService
    BravoConfigModule,
    SyncModule,
    MappingModule,
    StatsModule,
  ],
  exports: [],
})
export class BravoErpModule {}
```

---

## 🧪 TESTES SUGERIDOS

### 1. Testes Unitários

```typescript
// bravo-erp-client-v2.service.spec.ts
describe('BravoErpClientV2Service', () => {
  let service: BravoErpClientV2Service;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BravoErpClientV2Service,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BravoErpClientV2Service>(BravoErpClientV2Service);
  });

  it('deve carregar configuração do banco', async () => {
    // Teste...
  });

  it('deve consultar produtos corretamente', async () => {
    // Teste...
  });
});
```

### 2. Testes de Integração

```typescript
// bravo-erp.e2e-spec.ts
describe('Bravo ERP (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Setup...
  });

  it('/bravo-erp/config (GET)', () => {
    return request(app.getHttpServer())
      .get('/bravo-erp/config')
      .expect(200);
  });
});
```

---

## 📝 NOTAS IMPORTANTES

### 1. Convenções de Nomenclatura

- **Supabase:** snake_case (`bravo_sync_config`)
- **Prisma:** camelCase (`bravoSyncConfig`)

### 2. Timestamps

- **Supabase:** Strings ISO (`new Date().toISOString()`)
- **Prisma:** Objetos Date (`new Date()`)

### 3. JSON/JSONB

- **Supabase:** Campo JSONB como objeto JavaScript
- **Prisma:** Campo Json como objeto JavaScript (mesma coisa!)

### 4. Relacionamentos

- **Supabase:** `.select('*, relacionamento(*)')`
- **Prisma:** `.include({ relacionamento: true })`

---

## 🔗 REFERÊNCIAS

### Arquivos do painel-completo para Consulta:

1. **Client:**
   - `painel-completo/src/lib/bravo-erp/bravo-erp-client-v2.ts` (463 linhas)
   
2. **Mapping:**
   - `painel-completo/src/lib/bravo-erp/bravo-erp-mapping.ts`
   
3. **Sync:**
   - `painel-completo/src/app/api/bravo-erp/sincronizar/route.ts` (1461 linhas)
   
4. **Lock:**
   - `painel-completo/src/lib/core/sync-lock.ts`
   
5. **Frontend:**
   - `painel-completo/src/app/admin/bravo-erp/page.tsx` (2620+ linhas)
     → Adaptar para: `frontend/src/app/(app)/admin/importações/bravo-erp/produtos/page.tsx`
   - `painel-completo/src/app/admin/bravo-erp/mapeamento/page.tsx` (796 linhas)
     → Adaptar para: `frontend/src/app/(app)/admin/importações/bravo-erp/produtos/mapeamento/page.tsx`

---

**Última Atualização:** 2025-01-XX  
**Versão:** 1.0.0  
**Status:** 📋 Pronto para Consulta Durante Implementação