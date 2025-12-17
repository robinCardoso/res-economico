'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { MultiSelect } from './MultiSelect';
import { useTiposOperacao, useMarcas, useGrupos, useSubgrupos, useNomesFantasia, useAnalyticsUfs, useAnalyticsAnos, useAnalyticsMeses } from '@/hooks/use-vendas';
import type { AnalyticsFilters as AnalyticsFiltersType } from '@/services/vendas.service';

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersType;
  onChange: (filters: AnalyticsFiltersType) => void;
}

// Nomes dos meses
const MESES_NOMES: { [key: number]: string } = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

export function AnalyticsFilters({ filters, onChange }: AnalyticsFiltersProps) {
  const { data: tiposOperacao = [] } = useTiposOperacao();
  const { data: marcas = [] } = useMarcas();
  const { data: grupos = [] } = useGrupos();
  const { data: subgrupos = [] } = useSubgrupos();
  const { data: nomesFantasia = [] } = useNomesFantasia();
  
  // Valores reais de VendaAnalytics
  const { data: ufs = [] } = useAnalyticsUfs();
  const { data: anos = [] } = useAnalyticsAnos();
  const { data: meses = [] } = useAnalyticsMeses();

  // Preparar opções de meses com nomes
  const mesesOptions = useMemo(() => {
    return meses
      .sort((a, b) => a - b)
      .map((mes) => `${mes} - ${MESES_NOMES[mes] || `Mês ${mes}`}`);
  }, [meses]);

  const handleFilterChange = (key: keyof AnalyticsFiltersType, value: string[] | number[]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Tipo de Operação</Label>
        <MultiSelect
          options={tiposOperacao}
          value={filters.tipoOperacao}
          onChange={(value) => handleFilterChange('tipoOperacao', value)}
          placeholder="Selecione tipos de operação..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Filial (UF)</Label>
        <MultiSelect
          options={ufs}
          value={filters.filial}
          onChange={(value) => handleFilterChange('filial', value)}
          placeholder="Selecione filiais..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Ano</Label>
        <MultiSelect
          options={anos.map(String)}
          value={filters.ano?.map(String)}
          onChange={(value) => handleFilterChange('ano', value.map(Number))}
          placeholder="Selecione anos..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Mês</Label>
        <MultiSelect
          options={mesesOptions}
          value={filters.mes?.map(m => {
            const mesNome = MESES_NOMES[m];
            return mesNome ? `${m} - ${mesNome}` : String(m);
          }) || []}
          onChange={(value) => {
            const mesesSelecionados = value.map(v => {
              const num = parseInt(v.split(' - ')[0]);
              return isNaN(num) ? 0 : num;
            }).filter(n => n > 0);
            handleFilterChange('mes', mesesSelecionados);
          }}
          placeholder="Selecione meses..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Marca</Label>
        <MultiSelect
          options={marcas}
          value={filters.marca}
          onChange={(value) => handleFilterChange('marca', value)}
          placeholder="Selecione marcas..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Nome Fantasia (Associado)</Label>
        <MultiSelect
          options={nomesFantasia}
          value={filters.nomeFantasia}
          onChange={(value) => handleFilterChange('nomeFantasia', value)}
          placeholder="Selecione associados..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Grupo</Label>
        <MultiSelect
          options={grupos}
          value={filters.grupo}
          onChange={(value) => handleFilterChange('grupo', value)}
          placeholder="Selecione grupos..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Subgrupo</Label>
        <MultiSelect
          options={subgrupos}
          value={filters.subgrupo}
          onChange={(value) => handleFilterChange('subgrupo', value)}
          placeholder="Selecione subgrupos..."
        />
      </div>
    </div>
  );
}
