'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const monthName = format(currentDate, 'MMMM', { locale: ptBR });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Dados mockados - serão substituídos depois
  const faturamentoAtual = 0; // Será calculado depois
  const faturamentoAnterior = 0;
  const faturamentoAnual = 0;
  const mediaMensal = 0;
  const variacaoFaturamento = faturamentoAtual - faturamentoAnterior;
  const percentualVariacao = faturamentoAnterior > 0 
    ? ((variacaoFaturamento / faturamentoAnterior) * 100).toFixed(1)
    : '0.0';

  // Dados do DR-E (mockados por enquanto)
  const receitaBruta = 0;
  const custos = 0;
  const despesas = 0;
  const resultadoLiquido = receitaBruta - custos - despesas;

  // Função helper para formatar valores monetários
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do faturamento e resultado econômico
        </p>
      </div>

      {/* Período Atual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {monthNameCapitalized} de {currentYear}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Faturamento */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Faturamento Atual</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">
              {formatCurrency(faturamentoAtual)}
            </div>
            {variacaoFaturamento !== 0 && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${
                variacaoFaturamento > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {variacaoFaturamento > 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(Number(percentualVariacao))}% em relação ao mês anterior
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Faturamento Anual</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">
              {formatCurrency(faturamentoAnual)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acumulado {currentYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
            <CardTitle className="text-xs font-medium">Média Mensal</CardTitle>
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold">
              {formatCurrency(mediaMensal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média dos últimos meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dados do DR-E */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Demonstração de Resultado do Exercício (DR-E)</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
              <CardTitle className="text-xs font-medium">Receita Bruta</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(receitaBruta)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
              <CardTitle className="text-xs font-medium">Custos</CardTitle>
              <BarChart3 className="h-3.5 w-3.5 text-orange-600" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(custos)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
              <CardTitle className="text-xs font-medium">Despesas</CardTitle>
              <BarChart3 className="h-3.5 w-3.5 text-red-600" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(despesas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-4">
              <CardTitle className="text-xs font-medium">Resultado Líquido</CardTitle>
              <DollarSign className={`h-3.5 w-3.5 ${resultadoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-xl font-bold ${resultadoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(resultadoLiquido)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mensagem informativa */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardContent className="px-4 py-3">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>Nota:</strong> Esta página está em desenvolvimento. Os dados serão integrados em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

