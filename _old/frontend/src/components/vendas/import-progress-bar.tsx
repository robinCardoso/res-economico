'use client';

import { useImportLogProgress } from '@/hooks/use-vendas';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportProgressBarProps {
  logId: string | null;
  onComplete?: () => void;
}

export function ImportProgressBar({ logId, onComplete }: ImportProgressBarProps) {
  const { data: progress, error } = useImportLogProgress(
    logId || '',
    !!logId
  );

  // Se não há logId, não mostrar nada
  if (!logId) {
    return null;
  }

  // Se concluído, chamar callback e mostrar mensagem de sucesso
  if (progress?.concluido) {
    if (onComplete) {
      onComplete();
    }
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Importação concluída!</p>
              <p className="text-sm text-green-700">
                {progress.sucessoCount} vendas importadas com sucesso
                {progress.erroCount > 0 && `, ${progress.erroCount} erros`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se houver erro
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Erro ao buscar progresso</p>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostrar barra de progresso
  const progresso = progress?.progresso || 0;
  const linhasProcessadas = progress?.linhasProcessadas || 0;
  const totalLinhas = progress?.totalLinhas || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processando Importação
        </CardTitle>
        <CardDescription>
          Aguarde enquanto as vendas são importadas...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Linhas Processadas</p>
            <p className="font-semibold">
              {linhasProcessadas.toLocaleString('pt-BR')} / {totalLinhas.toLocaleString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Sucessos</p>
            <p className="font-semibold text-green-600">
              {progress?.sucessoCount?.toLocaleString('pt-BR') || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Erros</p>
            <p className="font-semibold text-red-600">
              {progress?.erroCount?.toLocaleString('pt-BR') || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
