'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { MultiSelect } from './MultiSelect';
import { usePedidosMarcas, usePedidosGrupos, usePedidosSubgrupos, usePedidosNomesFantasia, useAnalyticsAnos, useAnalyticsMeses } from '@/hooks/use-pedidos';
import { useEmpresas } from '@/hooks/use-empresas';
import type { AnalyticsFilters as AnalyticsFiltersType } from '@/services/pedidos.service';

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
  const { data: marcas = [] } = usePedidosMarcas();
  const { data: grupos = [] } = usePedidosGrupos();
  const { data: subgrupos = [] } = usePedidosSubgrupos();
  const { data: nomesFantasia = [] } = usePedidosNomesFantasia();
  const { data: empresas = [] } = useEmpresas();
  
  // Valores reais de PedidoAnalytics
  const { data: anos = [] } = useAnalyticsAnos();
  const { data: meses = [] } = useAnalyticsMeses();

  // Preparar opções de meses com nomes
  const mesesOptions = useMemo(() => {
    return meses
      .sort((a, b) => a - b)
      .map((mes) => `${mes} - ${MESES_NOMES[mes] || `Mês ${mes}`}`);
  }, [meses]);

  // Preparar opções de anos como strings para o MultiSelect
  const anosOptions = useMemo(() => {
    return anos
      .sort((a, b) => b - a)
      .map((ano) => ano.toString());
  }, [anos]);

  // Preparar opções de empresas (id: razaoSocial)
  const empresasOptions = useMemo(() => {
    return empresas
      .sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial))
      .map((empresa) => empresa.id);
  }, [empresas]);

  // Mapear empresaId para exibição (mesmo formato da página de gerenciar)
  const empresasMap = useMemo(() => {
    const map = new Map<string, string>();
    empresas.forEach((empresa) => {
      const displayText = empresa.razaoSocial && empresa.filial
        ? `${empresa.razaoSocial} - ${empresa.filial}`
        : empresa.razaoSocial || empresa.filial || 'Empresa sem nome';
      map.set(empresa.id, displayText);
    });
    return map;
  }, [empresas]);

  const handleFilterChange = (key: keyof AnalyticsFiltersType, value: string[] | number[]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  // Converter arrays de números para strings para o MultiSelect
  const handleAnoChange = (value: string[]) => {
    handleFilterChange('ano', value.map(v => parseInt(v)));
  };

  const handleMesChange = (value: string[]) => {
    handleFilterChange('mes', value.map(v => parseInt(v.split(' - ')[0])));
  };

  // Converter arrays de números para strings para exibição
  const anoValues = useMemo(() => {
    return filters.ano?.map(a => a.toString()) || [];
  }, [filters.ano]);

  const mesValues = useMemo(() => {
    return filters.mes?.map(m => `${m} - ${MESES_NOMES[m] || `Mês ${m}`}`) || [];
  }, [filters.mes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Empresa</Label>
        <MultiSelect
          options={empresasOptions}
          value={filters.empresaId}
          onChange={(value) => handleFilterChange('empresaId', value)}
          placeholder="Todas as empresas"
          getDisplayValue={(id) => empresasMap.get(id) || id}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Ano</Label>
        <MultiSelect
          options={anosOptions}
          value={anoValues}
          onChange={handleAnoChange}
          placeholder="Selecione anos..."
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Mês</Label>
        <MultiSelect
          options={mesesOptions}
          value={mesValues}
          onChange={handleMesChange}
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
        <Label className="text-xs">Nome Fantasia (Cliente)</Label>
        <MultiSelect
          options={nomesFantasia}
          value={filters.nomeFantasia}
          onChange={(value) => handleFilterChange('nomeFantasia', value)}
          placeholder="Selecione clientes..."
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

