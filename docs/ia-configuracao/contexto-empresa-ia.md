# Plano: Contexto de Empresa para Análises IA

## Objetivo
Enriquecer as análises da IA com informações contextuais sobre a empresa, permitindo análises mais precisas, relevantes e acionáveis.

## Benefícios Esperados
- ✅ Análises mais específicas e contextualizadas
- ✅ Recomendações alinhadas ao setor e porte da empresa
- ✅ Identificação de padrões setoriais vs. anomalias reais
- ✅ Comparações mais relevantes (benchmarking por setor)
- ✅ Insights sobre sazonalidade e tendências históricas
- ✅ **Avaliação de saúde financeira considerando modelo de negócio único**
- ✅ **Identificação de pontos críticos específicos do modelo operacional**
- ✅ **Recomendações baseadas em fontes de receita reais (mensalidades, bonificações)**
- ✅ **Configuração global por modelo de negócio**: Configure uma vez, aplique a todas as empresas
- ✅ **Menos manutenção**: Mudanças na configuração global afetam todas as empresas automaticamente
- ✅ **Padronização**: Garante consistência entre empresas do mesmo modelo

---

## Fase 1: Estender Modelo de Dados da Empresa

### 1.1. Adicionar Campos ao Schema Prisma

**Arquivo:** `backend/prisma/schema.prisma`

```prisma
model Empresa {
  id           String               @id @default(uuid())
  cnpj         String               @unique
  razaoSocial  String
  nomeFantasia String?
  tipo         TipoEmpresa          @default(MATRIZ)
  uf           String?              // Estado (SC, SP, etc.)
  
  // NOVOS CAMPOS PARA CONTEXTO IA
  setor        String?              // Ex: "Comércio", "Indústria", "Serviços", "Agronegócio"
  porte        PorteEmpresa?        // MICRO, PEQUENA, MEDIA, GRANDE
  dataFundacao DateTime?            // Data de fundação
  descricao    String?              // Descrição/observações sobre a empresa
  website      String?              // URL do site oficial da empresa (opcional - apenas para referência, IA não acessa)
  
  // MODELO DE NEGÓCIO ESPECÍFICO
  modeloNegocio ModeloNegocio?      // ASSOCIACAO, COMERCIO, INDUSTRIA, SERVICOS, etc.
  modeloNegocioDetalhes Json?       // Detalhes específicos do modelo (ex: associação para retificas) - OPcional: override da configuração global
  
  // FONTES DE RECEITA (para identificar contas no DRE)
  // OPcional: se não informado, usa ConfiguracaoModeloNegocio.contasReceita
  contasReceita Json?               // Ex: { mensalidades: "3.1.01.01", bonificacoes: "3.1.02.01" }
  
  // ESTRUTURA OPERACIONAL
  // OPcional: se não informado, usa ConfiguracaoModeloNegocio.custosCentralizados
  custosCentralizados Boolean?      // Se custos estão centralizados na matriz
  // OPcional: se não informado, usa ConfiguracaoModeloNegocio.receitasCentralizadas
  receitasCentralizadas Boolean?    // Se receitas (ex: bonificações) estão centralizadas na matriz
  // OPcional: se não informado, usa ConfiguracaoModeloNegocio.contasCustos
  contasCustos Json?                // Contas de custos operacionais (funcionários, sistema, contabilidade)
  
  uploads      Upload[]
  templates    TemplateImportacao[]
  usuarios     Usuario[]
  resumos      ResumoEconomico[]
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
}

// NOVA TABELA: Configuração Global por Modelo de Negócio
model ConfiguracaoModeloNegocio {
  id                  String        @id @default(uuid())
  modeloNegocio       ModeloNegocio @unique
  modeloNegocioDetalhes Json        // Detalhes específicos do modelo (ex: associação para retificas)
  contasReceita       Json          // Mapeamento padrão de contas de receita
  contasCustos        Json          // Mapeamento padrão de contas de custos
  custosCentralizados Boolean       // Padrão para custos centralizados
  receitasCentralizadas Boolean     // Padrão para receitas centralizadas
  descricao           String?       // Descrição da configuração
  ativo               Boolean        @default(true)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}

enum PorteEmpresa {
  MICRO
  PEQUENA
  MEDIA
  GRANDE
}

enum ModeloNegocio {
  ASSOCIACAO          // Associação (ex: para retificas)
  COMERCIO            // Comércio tradicional
  INDUSTRIA           // Indústria
  SERVICOS            // Prestação de serviços
  AGROPECUARIA        // Agronegócio
  OUTRO               // Outro modelo
}
```

### 1.2. Criar Migration

**Arquivo:** `backend/prisma/migrations/YYYYMMDDHHMMSS_add_empresa_contexto/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "PorteEmpresa" AS ENUM ('MICRO', 'PEQUENA', 'MEDIA', 'GRANDE');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN "setor" TEXT;
ALTER TABLE "Empresa" ADD COLUMN "porte" "PorteEmpresa";
ALTER TABLE "Empresa" ADD COLUMN "dataFundacao" TIMESTAMP(3);
ALTER TABLE "Empresa" ADD COLUMN "descricao" TEXT;
ALTER TABLE "Empresa" ADD COLUMN "website" TEXT;
```

### 1.3. Atualizar DTOs

**Arquivo:** `backend/src/empresas/dto/create-empresa.dto.ts`
- Adicionar validação para novos campos (opcionais)

**Arquivo:** `backend/src/empresas/dto/update-empresa.dto.ts`
- Adicionar validação para novos campos (opcionais)

---

## Fase 2: Coletar Informações Contextuais Dinâmicas

### 2.1. Criar Serviço de Contexto de Empresa

**Arquivo:** `backend/src/ai/empresa-contexto.service.ts`

```typescript
@Injectable()
export class EmpresaContextoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Coleta informações contextuais sobre a empresa para enriquecer análises IA
   */
  async coletarContextoEmpresa(empresaId: string): Promise<EmpresaContexto> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        uploads: {
          where: { status: 'CONCLUIDO' },
          orderBy: { createdAt: 'desc' },
          take: 12, // Últimos 12 meses
          select: {
            mes: true,
            ano: true,
            totalLinhas: true,
            createdAt: true,
          },
        },
      },
    });

    if (!empresa) {
      return null;
    }

    // Calcular estatísticas históricas
    const estatisticas = await this.calcularEstatisticasHistoricas(empresaId);

    return {
      // Informações básicas
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      uf: empresa.uf,
      tipo: empresa.tipo,
      
      // Informações contextuais
      setor: empresa.setor,
      porte: empresa.porte,
      dataFundacao: empresa.dataFundacao,
      descricao: empresa.descricao,
      
      // Modelo de negócio
      modeloNegocio: empresa.modeloNegocio,
      modeloNegocioDetalhes: empresa.modeloNegocioDetalhes as Record<string, unknown> | null,
      contasReceita: empresa.contasReceita as Record<string, string> | null,
      custosCentralizados: empresa.custosCentralizados,
      receitasCentralizadas: empresa.receitasCentralizadas,
      contasCustos: empresa.contasCustos as Record<string, string> | null,
      
      // Estatísticas históricas
      totalUploads: empresa.uploads.length,
      mesesComDados: empresa.uploads.map(u => `${u.mes}/${u.ano}`),
      periodoMaisAntigo: this.obterPeriodoMaisAntigo(empresa.uploads),
      periodoMaisRecente: this.obterPeriodoMaisRecente(empresa.uploads),
      
      // Estatísticas financeiras históricas (se disponível)
      estatisticas: estatisticas,
      
      // Métricas específicas do modelo de negócio
      metricasModelo: await this.calcularMetricasModelo(empresaId, empresa),
    };
  }

  private async calcularEstatisticasHistoricas(empresaId: string) {
    // Calcular médias, tendências, etc. dos últimos uploads
    // Retornar informações como:
    // - Receita média mensal
    // - Variação média de receita
    // - Principais contas por volume
    // etc.
  }

  /**
   * Calcula métricas específicas baseadas no modelo de negócio
   * Ex: Para associação, calcula cobertura de custos por mensalidades
   */
  private async calcularMetricasModelo(empresaId: string, empresa: any) {
    if (empresa.modeloNegocio === 'ASSOCIACAO') {
      // Para associações, calcular:
      // - Cobertura de custos por mensalidades
      // - Proporção mensalidades vs. bonificações
      // - Custo por associado (se disponível)
      // - Margem de segurança operacional
      
      const contasReceita = empresa.contasReceita as Record<string, string> | null;
      if (!contasReceita) return null;

      // Buscar valores históricos das contas de receita
      const metricas = {
        coberturaCustosPorMensalidades: null as number | null,
        proporcaoMensalidadesBonificacoes: null as number | null,
        custoPorAssociado: null as number | null,
        margemSeguranca: null as number | null,
      };

      // TODO: Implementar cálculo baseado em dados históricos
      return metricas;
    }
    
    return null;
  }
}
```

### 2.2. Interface TypeScript

**Arquivo:** `backend/src/ai/interfaces/empresa-contexto.interface.ts`

```typescript
export interface EmpresaContexto {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  uf?: string;
  tipo: 'MATRIZ' | 'FILIAL';
  setor?: string;
  porte?: 'MICRO' | 'PEQUENA' | 'MEDIA' | 'GRANDE';
  dataFundacao?: Date;
  descricao?: string;
  
  // Modelo de negócio
  modeloNegocio?: 'ASSOCIACAO' | 'COMERCIO' | 'INDUSTRIA' | 'SERVICOS' | 'AGROPECUARIA' | 'OUTRO';
  modeloNegocioDetalhes?: Record<string, unknown>;
  contasReceita?: Record<string, string>; // Ex: { mensalidades: "3.1.01.01", bonificacoes: "3.1.02.01" }
  custosCentralizados?: boolean;
  contasCustos?: Record<string, string>; // Ex: { funcionarios: "4.1.01", sistema: "4.1.02", contabilidade: "4.1.03" }
  
  totalUploads: number;
  mesesComDados: string[];
  periodoMaisAntigo?: string;
  periodoMaisRecente?: string;
  estatisticas?: {
    receitaMediaMensal?: number;
    variacaoMediaReceita?: number;
    principaisContas?: Array<{ nome: string; saldoMedio: number }>;
  };
  
  metricasModelo?: {
    coberturaCustosPorMensalidades?: number;
    proporcaoMensalidadesBonificacoes?: number;
    custoPorAssociado?: number;
    margemSeguranca?: number;
  } | null;
}
```

---

## Fase 3: Integrar Contexto nas Análises IA

### 3.1. Atualizar `AiService.coletarDadosParaAnalise`

**Arquivo:** `backend/src/ai/ai.service.ts`

```typescript
async analisar(dto: AnalisarDadosDto, usuarioId: string): Promise<AnaliseResponse> {
  // ... código existente ...

  // NOVO: Coletar contexto da empresa se empresaId estiver presente
  let contextoEmpresa: EmpresaContexto | null = null;
  if (dto.empresaId) {
    contextoEmpresa = await this.empresaContextoService.coletarContextoEmpresa(
      dto.empresaId
    );
  }

  // Coletar dados para análise
  const dados = await this.coletarDadosParaAnalise(dto.tipo, dto);

  // Adicionar contexto da empresa aos dados
  if (contextoEmpresa) {
    dados.contextoEmpresa = contextoEmpresa;
  }

  // Criar prompt com contexto
  const prompt = this.criarPrompt(dto.tipo, dados);

  // ... resto do código ...
}
```

### 3.2. Atualizar Prompts para Incluir Contexto

**Arquivo:** `backend/src/ai/ai.service.ts`

```typescript
private criarPrompt(tipo: TipoAnalise, dados: Record<string, unknown>): string {
  const dadosStr = JSON.stringify(dados, null, 2);
  const contextoEmpresa = dados.contextoEmpresa as EmpresaContexto | undefined;

  // Seção de contexto da empresa (se disponível)
  let contextoSection = '';
  if (contextoEmpresa) {
    contextoSection = `
## CONTEXTO DA EMPRESA
${contextoEmpresa.nomeFantasia || contextoEmpresa.razaoSocial}
- Setor: ${contextoEmpresa.setor || 'Não informado'}
- Porte: ${contextoEmpresa.porte || 'Não informado'}
- UF: ${contextoEmpresa.uf || 'Não informado'}
- Tipo: ${contextoEmpresa.tipo}
${contextoEmpresa.dataFundacao ? `- Fundada em: ${new Date(contextoEmpresa.dataFundacao).getFullYear()}` : ''}
${contextoEmpresa.descricao ? `- Descrição: ${contextoEmpresa.descricao}` : ''}
- Total de uploads históricos: ${contextoEmpresa.totalUploads}
- Períodos com dados: ${contextoEmpresa.mesesComDados.join(', ')}
${contextoEmpresa.estatisticas?.receitaMediaMensal ? `- Receita média mensal (histórico): R$ ${contextoEmpresa.estatisticas.receitaMediaMensal.toLocaleString('pt-BR')}` : ''}

${contextoEmpresa.modeloNegocio ? `## MODELO DE NEGÓCIO
- Tipo: ${contextoEmpresa.modeloNegocio}
${contextoEmpresa.modeloNegocio === 'ASSOCIACAO' ? `
⚠️ MODELO ESPECIAL: ASSOCIAÇÃO PARA RETIFICAS

CARACTERÍSTICAS DO MODELO:
- A empresa NÃO tem margem de lucro nas vendas (compra por X, vende por X)
- Fontes de receita principais:
  ${contextoEmpresa.contasReceita?.mensalidades ? `  • Mensalidades (conta DRE: ${contextoEmpresa.contasReceita.mensalidades})` : '  • Mensalidades'}
  ${contextoEmpresa.contasReceita?.bonificacoes ? `  • Bonificações de fornecedores (conta DRE: ${contextoEmpresa.contasReceita.bonificacoes})` : '  • Bonificações de fornecedores'}
- Estrutura organizacional:
  ${contextoEmpresa.custosCentralizados ? '  • Custos operacionais CENTRALIZADOS na matriz' : '  • Custos operacionais distribuídos'}
  ${contextoEmpresa.receitasCentralizadas ? '  • Receitas (ex: bonificações) CENTRALIZADAS na matriz' : '  • Receitas distribuídas'}
  ${contextoEmpresa.contasCustos ? `  • Principais custos: ${Object.keys(contextoEmpresa.contasCustos).join(', ')}` : ''}

⚠️ ENTENDENDO VISÃO INDIVIDUAL vs. CONSOLIDADA:
${contextoEmpresa.tipo === 'MATRIZ' ? `
- Você está analisando dados da MATRIZ
${contextoEmpresa.custosCentralizados ? '- Custos operacionais altos na matriz são NORMAIS e ESPERADOS - isso é a estrutura organizacional, não um problema' : ''}
${contextoEmpresa.receitasCentralizadas ? '- Receitas altas (ex: bonificações) na matriz são NORMAIS e ESPERADAS - isso é a estrutura organizacional, não um problema' : ''}
- A matriz concentra custos/receitas que servem a todas as unidades
- Foque em avaliar se as receitas (mensalidades + bonificações) cobrem os custos centralizados
` : `
- Você está analisando dados de uma FILIAL
- Custos operacionais podem estar baixos porque são centralizados na matriz
- Receitas podem estar baixas se bonificações estão centralizadas na matriz
- Foque em avaliar a operação individual da filial
`}

MÉTRICAS CRÍTICAS PARA AVALIAR SAÚDE FINANCEIRA:
1. Cobertura de custos por mensalidades: Mensalidades devem cobrir custos operacionais
2. Proporção mensalidades vs. bonificações: Bonificações são complementares, não principais
3. Margem de segurança: Diferença entre receita total e custos totais
4. Tendência de mensalidades: Crescimento/declínio no número de associados
5. Eficiência operacional: Custo por associado vs. receita por associado

PONTOS CRÍTICOS A MONITORAR:
- Se mensalidades não cobrem custos operacionais → CRÍTICO
- Se bonificações representam >50% da receita → ATENÇÃO (dependência de fornecedores)
- Se custos operacionais crescem mais que receita → CRÍTICO
- Se há queda consistente em mensalidades → CRÍTICO
- Se margem de segurança < 10% → ATENÇÃO

IMPORTANTE: Ao analisar os dados, considere que:
- Variações em "vendas" não geram lucro (é normal ter saldo zero)
- Foque em mensalidades e bonificações como indicadores de saúde
${contextoEmpresa.tipo === 'MATRIZ' && contextoEmpresa.custosCentralizados ? '- Custos altos na matriz são NORMAIS quando centralizados - não é um problema, é a estrutura organizacional' : ''}
${contextoEmpresa.tipo === 'MATRIZ' && contextoEmpresa.receitasCentralizadas ? '- Receitas altas (ex: bonificações) na matriz são NORMAIS quando centralizadas - não é um problema, é a estrutura organizacional' : ''}
- Custos/receitas centralizados na matriz devem ser cobertos pelas receitas totais
- Identifique se há necessidade de ajustar mensalidades ou reduzir custos
- Forneça recomendações PRÁTICAS e ACIONÁVEIS: ex: "Aumentar contribuição mensal em X%" ou "Reduzir custos de X em Y%"
` : ''}
${contextoEmpresa.modeloNegocioDetalhes ? `- Detalhes: ${JSON.stringify(contextoEmpresa.modeloNegocioDetalhes, null, 2)}` : ''}
` : ''}

IMPORTANTE: Use este contexto para:
- Ajustar expectativas e benchmarks conforme o setor, porte e modelo de negócio
- Identificar padrões setoriais vs. anomalias reais
- Fornecer recomendações específicas para o tipo de empresa
- Considerar sazonalidade típica do setor
${contextoEmpresa.modeloNegocio === 'ASSOCIACAO' ? `- **AVALIAR SAÚDE FINANCEIRA baseada em mensalidades e bonificações, não em margem de vendas**` : ''}
${contextoEmpresa.modeloNegocio === 'ASSOCIACAO' ? `- **IDENTIFICAR PONTOS CRÍTICOS**: cobertura de custos, tendência de mensalidades, margem de segurança` : ''}

`;
  }

  switch (tipo) {
    case TipoAnalise.UPLOAD:
      return `${contextoSection}Analise detalhadamente os dados do upload fornecido. 

Foque em:
1. Identificar contas com valores mais significativos (top linhas) - cite valores específicos
2. Detectar anomalias específicas (valores zerados, débito e crédito simultâneos) - cite contas e classificações
3. Analisar estatísticas por tipo de conta
4. Fornecer insights acionáveis baseados nos dados reais
${contextoEmpresa?.setor ? `5. Considerar padrões típicos do setor ${contextoEmpresa.setor}` : ''}

IMPORTANTE: Cite valores específicos, nomes de contas e classificações quando disponíveis. Evite generalizações vagas.

Dados do upload:
${dadosStr}`;

    // ... outros casos ...
  }
}
```

### 3.3. Atualizar Prompt do Sistema

**Arquivo:** `backend/src/ai/ai.service.ts`

```typescript
role: 'system',
content: `Você é um analista financeiro especializado em análise de Demonstração de Resultado do Exercício (DRE). 

${contextoEmpresa ? `Você está analisando dados da empresa "${contextoEmpresa.nomeFantasia || contextoEmpresa.razaoSocial}" (${contextoEmpresa.setor || 'setor não informado'}, ${contextoEmpresa.porte || 'porte não informado'}).` : ''}

IMPORTANTE: Sua resposta DEVE seguir este formato estruturado:

## Resumo Executivo
[Forneça um resumo executivo conciso e objetivo (2-3 parágrafos) destacando os principais achados da análise. Cite valores específicos, percentuais e contas relevantes quando disponíveis. Seja direto e acionável.${contextoEmpresa?.setor ? ` Considere o contexto do setor ${contextoEmpresa.setor}.` : ''}]

## Insights Principais
[Liste 3-5 insights mais importantes, cada um com título, descrição e impacto. Use formato: "• Título: Descrição detalhada (Impacto: ALTO/MÉDIO/BAIXO)"]

## Padrões Anômalos Detectados
[Identifique padrões anômalos específicos com valores, contas e classificações quando disponíveis.${contextoEmpresa?.setor ? ` Compare com padrões típicos do setor ${contextoEmpresa.setor}.` : ''} Se não houver anomalias significativas, informe claramente.]

## Recomendações Estratégicas
[Forneça 3-5 recomendações PRÁTICAS e ACIONÁVEIS baseadas nos dados analisados.${contextoEmpresa?.porte ? ` Adapte as recomendações ao porte ${contextoEmpresa.porte} da empresa.` : ''}${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? ` 

Para associações, foque em recomendações ESPECÍFICAS e QUANTIFICADAS:
- Exemplo: "Aumentar contribuição mensal em 15% para cobrir custos operacionais"
- Exemplo: "Reduzir custos de sistema em 10% através de renegociação de contratos"
- Exemplo: "Aumentar base de associados em 20% através de campanha de adesão"
- Exemplo: "Ajustar mensalidades de R$ X para R$ Y para atingir margem de segurança de 15%"

NÃO use recomendações vagas como "melhorar receitas" ou "reduzir custos". Seja ESPECÍFICO com valores, percentuais e ações concretas.` : ''} Priorize ações que tenham maior impacto e forneça valores/percentuais específicos quando possível.]

## Avaliação de Saúde Financeira
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `[Para associações, avalie especificamente:
- Cobertura de custos: Mensalidades cobrem custos operacionais? Qual a margem? (Cite valores específicos)
- Proporção de receitas: Mensalidades vs. Bonificações (ideal: mensalidades > 70%) - Cite percentuais reais
- Tendência de mensalidades: Crescendo, estável ou declinando? (Cite variação percentual se disponível)
- Margem de segurança: Diferença entre receita total e custos (ideal: > 15%) - Cite valor e percentual
- Eficiência: Custo por associado vs. receita por associado (se dados disponíveis)
- Pontos críticos: Identifique riscos específicos do modelo associativo
- Sustentabilidade: A taxa de adesão e contribuição mensal são suficientes? Quanto precisa aumentar?]` : `[Avalie a saúde financeira geral da empresa considerando receitas, custos, margens e tendências. Cite valores e percentuais específicos.]`}

Regras:
- Responda SEMPRE em português brasileiro
- Seja ESPECÍFICO: cite números, valores, percentuais, nomes de contas e classificações quando disponíveis
- Evite generalizações vagas como "a empresa está crescendo" - seja preciso: "Receita Operacional Bruta aumentou 15% de R$ X para R$ Y"
- Priorize informações acionáveis e relevantes para tomada de decisão
- Use linguagem profissional mas acessível
${contextoEmpresa?.setor ? `- Considere benchmarks e padrões típicos do setor ${contextoEmpresa.setor}` : ''}
${contextoEmpresa?.porte ? `- Adapte recomendações ao porte ${contextoEmpresa.porte} da empresa` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **NÃO avalie margem de lucro em vendas** (é zero por design do modelo)` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **Foque em mensalidades e bonificações** como indicadores de saúde` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **Identifique pontos críticos**: cobertura de custos, tendência de mensalidades, margem de segurança` : ''}
${contextoEmpresa?.modeloNegocio === 'ASSOCIACAO' ? `- **Alerte sobre riscos**: se mensalidades não cobrem custos, se bonificações são >50% da receita, se custos crescem mais que receita` : ''}
${contextoEmpresa?.tipo === 'MATRIZ' && contextoEmpresa?.custosCentralizados ? `- **Custos altos na matriz são NORMAIS quando centralizados** - não é um problema, é a estrutura organizacional. Foque em avaliar se receitas cobrem esses custos.` : ''}
${contextoEmpresa?.tipo === 'MATRIZ' && contextoEmpresa?.receitasCentralizadas ? `- **Receitas altas (ex: bonificações) na matriz são NORMAIS quando centralizadas** - não é um problema, é a estrutura organizacional.` : ''}
${contextoEmpresa?.tipo === 'FILIAL' ? `- **Analise a operação individual da filial** - custos/receitas podem estar baixos se centralizados na matriz.` : ''}
- **Forneça recomendações PRÁTICAS e QUANTIFICADAS**: ex: "Aumentar contribuição mensal em 15%" ou "Reduzir custos de X em 10%"
- **Foque na SUSTENTABILIDADE REAL**: taxa de adesão e contribuição mensal são o que sustenta a empresa`,
```

---

## Fase 4: Atualizar Frontend

### 4.1. Atualizar Formulário de Empresa

**Arquivo:** `frontend/src/app/(app)/empresas/[id]/page.tsx` ou `frontend/src/app/(app)/empresas/novo/page.tsx`

Adicionar campos básicos:
- Setor (select/dropdown)
- Porte (select: Micro, Pequena, Média, Grande)
- Data de Fundação (date picker)
- Descrição (textarea) - De dicas do que colocar neste campo.
- Website (text input) - URL do site oficial da empresa (opcional - apenas para referência contextual, a IA não acessa este site)
- Modelo de Negócio (select)

**NOTA:** Os campos `contasReceita`, `contasCustos`, `custosCentralizados` e `modeloNegocioDetalhes` NÃO devem ser adicionados ao formulário de empresa. Eles são gerenciados através da **Configuração Global por Modelo de Negócio** (ver Fase 4.2).

### 4.2. Criar Página de Configuração de Modelos de Negócio

**Arquivo:** `frontend/src/app/(app)/configuracoes/modelos-negocio/page.tsx`

Criar página para gerenciar configurações globais por modelo de negócio:

**Funcionalidades:**
- Listar todas as configurações de modelos de negócio
- Criar/editar configuração para cada modelo (ASSOCIACAO, COMERCIO, etc.)
- Campos do formulário:
  - **Modelo de Negócio** (select, readonly após criação)
  - **Descrição** (textarea)
  - **Modelo de Negócio Detalhes** (JSON editor ou campos específicos)
  - **Contas Receita** (campos dinâmicos para mapear contas DRE):
    - Mensalidades: [input texto para conta DRE]
    - Bonificações: [input texto para conta DRE]
    - Adicionar mais contas...
  - **Contas Custos** (campos dinâmicos para mapear contas DRE):
    - Funcionários: [input texto para conta DRE]
    - Sistema: [input texto para conta DRE]
    - Contabilidade: [input texto para conta DRE]
    - Adicionar mais contas...
  - **Custos Centralizados** (checkbox)
  - **Ativo** (checkbox - para ativar/desativar configuração)

**Exemplo de uso:**
- Configurar uma vez para "ASSOCIACAO" com:
  - Mensalidades: "3.1.01.01"
  - Bonificações: "3.1.02.01"
  - Custos: funcionários, sistema, contabilidade
  - Custos Centralizados: true
- Todas as empresas com `modeloNegocio = 'ASSOCIACAO'` usarão automaticamente essa configuração
- Empresas podem ter override individual se necessário (campos opcionais na tabela Empresa)

### 4.2. Atualizar Tipos TypeScript

**Arquivo:** `frontend/src/types/api.ts`

```typescript
export interface Empresa {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  tipo: 'MATRIZ' | 'FILIAL';
  uf?: string;
  setor?: string;
  porte?: 'MICRO' | 'PEQUENA' | 'MEDIA' | 'GRANDE';
  dataFundacao?: string;
  descricao?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Fase 5: Melhorias Futuras (Opcional)

### 5.1. Integração com APIs Externas
- Consultar ReceitaWS ou similar para preencher automaticamente dados da empresa
- Obter CNAE (atividade econômica) automaticamente

### 5.2. Análise de Tendências Históricas
- Calcular médias móveis
- Identificar sazonalidade
- Detectar tendências de crescimento/declínio

### 5.3. Benchmarking Setorial
- Comparar métricas da empresa com médias do setor
- Identificar pontos fortes/fracos relativos ao mercado

### 5.4. Alertas Contextuais
- Alertar sobre variações que fogem do padrão histórico da empresa
- Sugerir ações baseadas em padrões setoriais

---

## Checklist de Implementação

### Fase 1: Modelo de Dados
- [ ] Adicionar campos ao schema Prisma
- [ ] Criar migration
- [ ] Executar migration
- [ ] Atualizar DTOs (create/update)
- [ ] Testar criação/edição de empresa com novos campos

### Fase 2: Serviço de Contexto
- [ ] Criar `EmpresaContextoService`
- [ ] Implementar `coletarContextoEmpresa` com fallback para configuração global
- [ ] Implementar cálculo de estatísticas históricas
- [ ] Criar interface TypeScript
- [ ] Testar coleta de contexto (com e sem configuração global)
- [ ] Criar `ConfiguracaoModeloNegocioService` (CRUD)
- [ ] Criar `ConfiguracaoModeloNegocioController` (endpoints API)

### Fase 3: Integração IA
- [ ] Injetar `EmpresaContextoService` no `AiService`
- [ ] Atualizar `analisar` para coletar contexto
- [ ] Atualizar `criarPrompt` para incluir contexto
- [ ] Atualizar prompt do sistema com contexto
- [ ] Testar análise com contexto vs. sem contexto

### Fase 4: Frontend
- [ ] Atualizar tipos TypeScript (Empresa e ConfiguracaoModeloNegocio)
- [ ] Adicionar campos básicos ao formulário de empresa (setor, porte, dataFundacao, descricao, website, modeloNegocio)
- [ ] Atualizar serviço de empresas
- [ ] Criar página de configuração de modelos de negócio (`/configuracoes/modelos-negocio`)
- [ ] Criar formulário para gerenciar configurações globais
- [ ] Criar serviço frontend para ConfiguracaoModeloNegocio
- [ ] Testar criação/edição de empresa com novos campos
- [ ] Testar criação/edição de configuração global
- [ ] Verificar que empresas usam configuração global quando não têm override

### Fase 5: Testes e Validação
- [ ] Testar análise com empresa completa vs. empresa sem contexto
- [ ] Validar que análises são mais específicas e relevantes
- [ ] Verificar que recomendações consideram setor/porte
- [ ] Coletar feedback dos usuários

---

## Exemplo de Uso

### Antes (sem contexto):
```
"A análise dos dados fornecidos indica que a empresa está experimentando 
um crescimento da receita operacional bruta e líquida..."
```

### Depois (com contexto):
```
"A análise dos dados da [Nome da Empresa], empresa do setor [Setor] de 
porte [Porte] localizada em [UF], indica que a receita operacional bruta 
aumentou 15% de R$ 2.5M para R$ 2.875M no período analisado, superando 
a média histórica da empresa de R$ 2.3M. Considerando o setor [Setor], 
este crescimento está alinhado com tendências do mercado..."
```

---

## Notas Técnicas

1. **Campos Opcionais**: Todos os novos campos são opcionais para não quebrar empresas existentes
2. **Performance**: Estatísticas históricas podem ser calculadas em background ou cacheadas
3. **Privacidade**: Considerar se descrição/website devem ser visíveis para todos os usuários
4. **Validação**: Validar formato de data, URL de website, etc.
5. **Website**: Campo opcional para URL do site oficial da empresa. **IMPORTANTE**: A IA NÃO acessa este site automaticamente - é apenas informação contextual que pode ser mencionada nas análises. Se não for necessário para o contexto, pode ser removido do plano ou usado apenas para referência visual no frontend.
6. **Modelo de Negócio Específico**: O campo `modeloNegocioDetalhes` permite armazenar informações customizadas por tipo de modelo
6. **Contas DRE**: Os campos `contasReceita` e `contasCustos` permitem mapear contas específicas do DRE para análise automatizada
7. **Métricas Personalizadas**: Para cada modelo de negócio, podem ser calculadas métricas específicas (ex: cobertura de custos para associações)

---

## Próximos Passos

1. Revisar e aprovar o plano
2. Iniciar Fase 1 (Modelo de Dados)
3. Testar incrementalmente cada fase
4. Coletar feedback e ajustar conforme necessário

