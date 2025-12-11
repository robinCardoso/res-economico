# Plano Detalhado: Deleção de Importação de Vendas

## 📋 Objetivo
Implementar funcionalidade para deletar uma importação de vendas, removendo todos os dados relacionados de forma segura e mantendo a integridade dos dados.

---

## 🔍 Análise da Estrutura Atual

### Tabelas Envolvidas

1. **`VendaImportacaoLog`** - Log da importação
   - `id` (PK)
   - `nomeArquivo`
   - `mappingName`
   - `totalLinhas`
   - `sucessoCount`, `erroCount`, `duplicatasCount`, `novosCount`
   - `usuarioId`, `usuarioEmail`
   - `createdAt`

2. **`Venda`** - Registros de vendas
   - **PROBLEMA IDENTIFICADO**: Não há campo `importacaoLogId` que ligue diretamente à importação
   - Chave única: `@@unique([nfe, idDoc, referencia])`
   - Sistema atual: UPSERT (atualiza se existe, cria se não existe)

3. **`VendaAnalytics`** - Agregações de vendas
   - Agregado por: `ano`, `mes`, `nomeFantasia`, `marca`, `grupo`, `subgrupo`, `tipoOperacao`, `uf`
   - Precisa ser recalculado após deleção

---

## ⚠️ Problema Crítico Identificado

**Não existe relação direta entre `Venda` e `VendaImportacaoLog`**

### Opções de Solução

#### **Opção 1: Adicionar campo `importacaoLogId` na tabela `Venda`** ⭐ RECOMENDADA
- **Vantagens:**
  - Rastreabilidade completa
  - Deleção precisa e segura
  - Permite histórico de origem
  - Facilita auditoria
  
- **Desvantagens:**
  - Requer migration
  - Vendas antigas terão `importacaoLogId = null`
  - Precisa atualizar código de importação

---

## ✅ Solução Escolhida: Opção 1

### Justificativa
- **Segurança**: Garante que apenas vendas da importação específica sejam deletadas
- **Rastreabilidade**: Permite saber origem de cada venda
- **Auditoria**: Facilita logs e relatórios
- **Performance**: Índice direto no campo

---

## 📝 Plano de Implementação Detalhado

### FASE 1: Migration - Adicionar Campo `importacaoLogId`

#### 1.1 Atualizar Schema Prisma
```prisma
model Venda {
  // ... campos existentes ...
  
  // NOVO CAMPO
  importacaoLogId  String?  // ID da importação que criou esta venda
  
  // Relacionamento
  importacaoLog    VendaImportacaoLog? @relation(fields: [importacaoLogId], references: [id], onDelete: SetNull)
  
  // ... índices existentes ...
  @@index([importacaoLogId]) // Novo índice para performance
}
```

#### 1.2 Criar Migration SQL
```sql
-- Adicionar coluna (nullable para vendas antigas)
ALTER TABLE "Venda" 
ADD COLUMN IF NOT EXISTS "importacaoLogId" TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS "Venda_importacaoLogId_idx" 
ON "Venda"("importacaoLogId");

-- Adicionar foreign key (opcional, pode ser adicionada depois)
-- ALTER TABLE "Venda"
-- ADD CONSTRAINT "Venda_importacaoLogId_fkey"
-- FOREIGN KEY ("importacaoLogId") REFERENCES "VendaImportacaoLog"("id")
-- ON DELETE SET NULL;
```

#### 1.3 Atualizar Relação no Schema
```prisma
model VendaImportacaoLog {
  // ... campos existentes ...
  
  // NOVO RELACIONAMENTO
  vendas  Venda[]  // Vendas criadas por esta importação
}
```

---

### FASE 2: Atualizar Código de Importação

#### 2.1 Modificar `vendas-import.service.ts`

**Arquivo**: `backend/src/vendas/import/vendas-import.service.ts`

**Mudanças necessárias:**

1. **Criar log ANTES de processar vendas:**
```typescript
// Criar log de importação ANTES de processar
const log = await this.prisma.vendaImportacaoLog.create({
  data: {
    nomeArquivo: file.originalname,
    mappingName: importDto.mappingName,
    totalLinhas,
    sucessoCount: 0, // Será atualizado depois
    erroCount: 0,
    produtosNaoEncontrados: 0,
    duplicatasCount: 0,
    novosCount: 0,
    usuarioEmail: userEmail,
    usuarioId: userId,
  },
});

const importacaoLogId = log.id;
```

2. **Atualizar método `prepararVendaParaUpsert`:**
```typescript
private prepararVendaParaUpsert(
  venda: VendaProcessada,
  empresaId: string,
  importacaoLogId: string, // NOVO PARÂMETRO
): {
  // ... campos existentes ...
  importacaoLogId: string; // NOVO CAMPO
} {
  return {
    // ... campos existentes ...
    importacaoLogId, // NOVO
  };
}
```

3. **Atualizar método `processarLote`:**
```typescript
private async processarLote(
  vendas: VendaProcessada[],
  empresaId: string,
  importacaoLogId: string, // NOVO PARÂMETRO
): Promise<{ sucesso: number; erros: number }> {
  // ... código existente ...
  
  // No UPSERT, incluir importacaoLogId
  const vendaData = this.prepararVendaParaUpsert(venda, empresaId, importacaoLogId);
  
  // ... resto do código ...
}
```

4. **Atualizar chamada principal:**
```typescript
// No método importFromExcel, passar importacaoLogId
for (let i = 0; i < vendasProcessadas.length; i += BATCH_SIZE) {
  const chunk = vendasProcessadas.slice(i, i + BATCH_SIZE);
  const { sucesso, erros } = await this.processarLote(
    chunk, 
    importDto.empresaId, 
    importacaoLogId // NOVO
  );
  sucessoCount += sucesso;
  erroCount += erros;
}

// Atualizar log com estatísticas finais
await this.prisma.vendaImportacaoLog.update({
  where: { id: importacaoLogId },
  data: {
    sucessoCount,
    erroCount,
    produtosNaoEncontrados,
    duplicatasCount,
    novosCount,
  },
});
```

---

### FASE 3: Implementar Endpoint de Deleção

#### 3.1 Criar DTO (se necessário)
```typescript
// backend/src/vendas/dto/delete-import.dto.ts
export class DeleteImportDto {
  // Opcional: confirmação de segurança
  confirmar?: boolean;
}
```

#### 3.2 Criar Método no Service

**Arquivo**: novo arquivo `vendas-import-delete.service.ts`

```typescript
async deletarImportacao(
  importacaoLogId: string,
  userId: string,
): Promise<{
  success: boolean;
  message: string;
  estatisticas: {
    vendasDeletadas: number;
    analyticsRecalculados: boolean;
  };
}> {
  // 1. Verificar se importação existe
  const importacao = await this.prisma.vendaImportacaoLog.findUnique({
    where: { id: importacaoLogId },
    select: {
      id: true,
      nomeArquivo: true,
      sucessoCount: true,
      createdAt: true,
      usuarioId: true,
    },
  });

  if (!importacao) {
    throw new NotFoundException('Importação não encontrada');
  }

  // 2. Verificar permissão (opcional: apenas criador pode deletar)
  if (importacao.usuarioId !== userId) {
    throw new ForbiddenException('Você não tem permissão para deletar esta importação');
  }

  // 3. Buscar todas as vendas desta importação
  const vendas = await this.prisma.venda.findMany({
    where: { importacaoLogId },
    select: {
      id: true,
      dataVenda: true,
      nomeFantasia: true,
      marca: true,
      grupo: true,
      subgrupo: true,
      tipoOperacao: true,
      ufDestino: true,
      valorTotal: true,
      quantidade: true,
    },
  });

  const totalVendas = vendas.length;

  if (totalVendas === 0) {
    // Se não há vendas, apenas deletar o log
    await this.prisma.vendaImportacaoLog.delete({
      where: { id: importacaoLogId },
    });

    return {
      success: true,
      message: 'Importação deletada (não havia vendas associadas)',
      estatisticas: {
        vendasDeletadas: 0,
        analyticsRecalculados: false,
      },
    };
  }

  // 4. Coletar períodos afetados para recalcular analytics
  const periodosAfetados = new Set<string>();
  vendas.forEach((v) => {
    const ano = new Date(v.dataVenda).getFullYear();
    const mes = new Date(v.dataVenda).getMonth() + 1;
    periodosAfetados.add(`${ano}-${mes}`);
  });

  // 5. DELETAR VENDAS (transação)
  await this.prisma.$transaction(async (tx) => {
    // Deletar vendas
    await tx.venda.deleteMany({
      where: { importacaoLogId },
    });

    // Deletar log de importação
    await tx.vendaImportacaoLog.delete({
      where: { id: importacaoLogId },
    });
  });

  // 6. RECALCULAR ANALYTICS para os períodos afetados
  // IMPORTANTE: Recalcular apenas os períodos que foram afetados
  for (const periodo of periodosAfetados) {
    const [ano, mes] = periodo.split('-').map(Number);
    
    // Buscar todas as vendas restantes deste período
    const vendasRestantes = await this.prisma.venda.findMany({
      where: {
        dataVenda: {
          gte: new Date(ano, mes - 1, 1),
          lt: new Date(ano, mes, 1),
        },
      },
      select: {
        dataVenda: true,
        nomeFantasia: true,
        marca: true,
        grupo: true,
        subgrupo: true,
        tipoOperacao: true,
        ufDestino: true,
        valorTotal: true,
        quantidade: true,
      },
    });

    // Limpar analytics do período
    await this.prisma.vendaAnalytics.deleteMany({
      where: {
        ano,
        mes,
      },
    });

    // Recalcular analytics com vendas restantes
    if (vendasRestantes.length > 0) {
      const vendasParaAnalytics = vendasRestantes.map((v) => ({
        dataVenda: v.dataVenda,
        nomeFantasia: v.nomeFantasia || undefined,
        marca: v.marca || 'DESCONHECIDA',
        grupo: v.grupo || 'DESCONHECIDO',
        subgrupo: v.subgrupo || 'DESCONHECIDO',
        tipoOperacao: v.tipoOperacao || undefined,
        ufDestino: v.ufDestino || undefined,
        valorTotal: v.valorTotal,
        quantidade: v.quantidade,
      }));

      await this.analyticsService.atualizarAnalytics(vendasParaAnalytics);
    }
  }

  // 7. Log de auditoria (opcional)
  // await this.auditoriaService.registrar({
  //   recurso: 'VendaImportacaoLog',
  //   acao: 'DELETE',
  //   usuarioId: userId,
  //   dados: { importacaoLogId, totalVendas },
  // });

  return {
    success: true,
    message: `Importação deletada com sucesso. ${totalVendas} vendas removidas.`,
    estatisticas: {
      vendasDeletadas: totalVendas,
      analyticsRecalculados: true,
    },
  };
}
```

#### 3.3 Adicionar Endpoint no Controller

**Arquivo**: `backend/src/vendas/vendas.controller.ts`

```typescript
@Delete('import-logs/:id')
async deletarImportacao(
  @Param('id') id: string,
  @Request() req: any,
) {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedException('Usuário não autenticado');
  }

  return this.vendasService.deletarImportacao(id, userId);
}
```

---

### FASE 4: Frontend - Interface de Deleção

#### 4.1 Atualizar Componente `ImportHistoryTable`

**Arquivo**: `frontend/src/components/imports/import-history-table.tsx`

**Mudanças:**

1. **Adicionar botão de deletar:**
```typescript
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
```

2. **Adicionar estado e função de deleção:**
```typescript
const [deletingId, setDeletingId] = useState<string | null>(null);
const queryClient = useQueryClient();

const handleDelete = async (logId: string) => {
  setDeletingId(logId);
  try {
    await vendasService.deleteImportLog(logId);
    // Invalidar queries para atualizar lista
    queryClient.invalidateQueries({ queryKey: ['vendas', 'import-logs'] });
    queryClient.invalidateQueries({ queryKey: ['vendas'] });
    queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['vendas', 'analytics'] });
    
    toast.success('Importação deletada com sucesso');
  } catch (error) {
    toast.error('Erro ao deletar importação');
    console.error(error);
  } finally {
    setDeletingId(null);
  }
};
```

3. **Adicionar coluna de ações na tabela:**
```typescript
<TableHeader>
  {/* ... colunas existentes ... */}
  <TableHead className="w-[100px]">Ações</TableHead>
</TableHeader>

<TableBody>
  {logs.map((log) => (
    <TableRow key={log.id}>
      {/* ... células existentes ... */}
      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={deletingId === log.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta importação?
                <br />
                <br />
                <strong>Arquivo:</strong> {log.nomeArquivo}
                <br />
                <strong>Data:</strong> {new Date(log.createdAt).toLocaleString('pt-BR')}
                <br />
                <strong>Total de vendas:</strong> {log.sucessoCount}
                <br />
                <br />
                <span className="text-red-600 font-semibold">
                  ⚠️ Esta ação irá deletar {log.sucessoCount} vendas e não pode ser desfeita!
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(log.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deletingId === log.id ? 'Deletando...' : 'Deletar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
```

#### 4.2 Adicionar Método no Service

**Arquivo**: `frontend/src/services/vendas.service.ts`

```typescript
async deleteImportLog(logId: string): Promise<void> {
  await api.delete(`/vendas/import-logs/${logId}`);
}
```

#### 4.3 Adicionar Hook (opcional)

**Arquivo**: `frontend/src/hooks/use-vendas.ts`

```typescript
export function useDeleteImportLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => vendasService.deleteImportLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', 'import-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['vendas', 'analytics'] });
    },
  });
}
```

---

## 📊 Dados que Serão Deletados

### Quando uma importação é deletada:

1. ✅ **`VendaImportacaoLog`** - Registro do log de importação
2. ✅ **`Venda`** - Todas as vendas que têm `importacaoLogId = importacaoLogId`
3. ✅ **`VendaAnalytics`** - Agregações dos períodos afetados (serão recalculadas)

### Dados que NÃO serão deletados:

- ❌ **`Produto`** - Produtos não são afetados
- ❌ **`Empresa`** - Empresas não são afetadas
- ❌ **Outras importações** - Apenas a importação específica é deletada
- ❌ **Vendas de outras importações** - Apenas vendas da importação deletada

---

## 🔒 Segurança e Validações

### Validações Implementadas:

1. ✅ **Verificar existência** - Importação deve existir
2. ✅ **Verificar permissão** - Apenas criador pode deletar (opcional)
3. ✅ **Transação** - Deleção atômica (tudo ou nada)
4. ✅ **Confirmação** - Dialog de confirmação no frontend
5. ✅ **Feedback** - Mensagens claras de sucesso/erro

### Proteções Adicionais (Opcional):

- Log de auditoria
- Soft delete (marcar como deletado ao invés de remover)
- Backup antes de deletar
- Limite de tempo (não permitir deletar importações muito antigas)

---

## 🧪 Testes Necessários

### Testes Backend:

1. ✅ Deletar importação com vendas
2. ✅ Deletar importação sem vendas
3. ✅ Verificar analytics recalculados
4. ✅ Verificar permissões
5. ✅ Verificar transação (rollback em caso de erro)

### Testes Frontend:

1. ✅ Exibir botão de deletar
2. ✅ Dialog de confirmação
3. ✅ Loading state
4. ✅ Atualização da lista após deleção
5. ✅ Mensagens de erro

---

## 📋 Checklist de Implementação

### Backend:
- [ ] Criar migration para adicionar `importacaoLogId` em `Venda`
- [ ] Atualizar schema Prisma
- [ ] Atualizar código de importação para salvar `importacaoLogId`
- [ ] Criar método `deletarImportacao` no service
- [ ] Criar endpoint `DELETE /vendas/import-logs/:id`
- [ ] Implementar recálculo de analytics
- [ ] Adicionar validações de segurança
- [ ] Testes unitários

### Frontend:
- [ ] Adicionar método `deleteImportLog` no service
- [ ] Criar hook `useDeleteImportLog` (opcional)
- [ ] Adicionar botão de deletar na tabela
- [ ] Implementar dialog de confirmação
- [ ] Adicionar loading state
- [ ] Invalidar queries após deleção
- [ ] Mensagens de sucesso/erro
- [ ] Testes de interface

---

## ⚠️ Considerações Importantes

### 1. Vendas Antigas
- Vendas importadas antes desta implementação terão `importacaoLogId = null`
- Não poderão ser deletadas por importação
- Considerar script de migração para associar vendas antigas (opcional)

### 2. Performance
- Deleção em lote pode ser lenta para importações grandes
- Considerar processamento assíncrono para importações > 10.000 vendas
- Índice em `importacaoLogId` é essencial

### 3. Analytics
- Recalcular apenas períodos afetados (não tudo)
- Pode ser demorado se houver muitos períodos
- Considerar processamento em background

### 4. Backup
- Recomendado fazer backup antes de deletar importações grandes
- Considerar soft delete para permitir recuperação

---

## 🚀 Ordem de Implementação Recomendada

1. **FASE 1** - Migration e Schema (Backend)
2. **FASE 2** - Atualizar Importação (Backend)
3. **FASE 3** - Endpoint de Deleção (Backend)
4. **FASE 4** - Interface Frontend
5. **Testes** - Testar fluxo completo
6. **Documentação** - Atualizar docs

---

## 📝 Notas Finais

- Implementação deve ser feita com cuidado para não perder dados
- Sempre testar em ambiente de desenvolvimento primeiro
- Considerar fazer backup do banco antes de aplicar migration
- Documentar mudanças para outros desenvolvedores

---

## ✅ Status da Implementação

**Data de Conclusão:** 2025-12-10  
**Versão:** 2.2.0  
**Status:** ✅ Implementado e Funcionando

### Funcionalidades Implementadas:
- ✅ Migration para adicionar `importacaoLogId` em `Venda`
- ✅ Atualização do código de importação para salvar `importacaoLogId`
- ✅ Método `deletarImportacao` no service
- ✅ Endpoint `DELETE /vendas/import-logs/:id`
- ✅ Recalculo de analytics apenas para períodos afetados
- ✅ Validações de segurança (permissões)
- ✅ Interface frontend com botão de deletar
- ✅ Dialog de confirmação
- ✅ Loading states e feedback ao usuário

### Arquivos Criados/Modificados:
- `backend/src/vendas/import/vendas-import-delete.service.ts` (NOVO)
- `backend/src/vendas/vendas.controller.ts` (endpoint DELETE)
- `backend/src/vendas/vendas.module.ts` (adicionado service)
- `backend/prisma/migrations/20251210000000_add_importacao_log_id_to_venda/` (NOVO)
- `frontend/src/services/vendas.service.ts` (método deleteImportLog)
- `frontend/src/hooks/use-vendas.ts` (hook useDeleteImportLog)
- `frontend/src/components/imports/import-history-table.tsx` (botão de deletar)
