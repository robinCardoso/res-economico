'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import numeral from 'numeral';

// ============================================================
// CORES DO TEMA
// ============================================================

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted))',
};

const CHART_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#a4de6c',
];

// ============================================================
// 1. GRÁFICO DE LINHA - RECEITA MENSAL
// ============================================================

interface ReceitaMensalData {
  mes: string;
  ano: number;
  receita: number;
}

interface ReceitaMensalChartProps {
  data: ReceitaMensalData[];
  isLoading?: boolean;
}

export function ReceitaMensalChart({ data, isLoading }: ReceitaMensalChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Receita Mensal</CardTitle>
          <CardDescription>Evolução da receita ao longo dos meses</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Receita Mensal</CardTitle>
          <CardDescription>Evolução da receita ao longo dos meses</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Receita Mensal</CardTitle>
        <CardDescription>Evolução da receita ao longo dos meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.substring(0, 3)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => numeral(value).format('$0a')}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              formatter={(value: number) => numeral(value).format('$0,0.00')}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="receita"
              name="Receita"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS[0], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 2. GRÁFICO DE BARRAS - TOP 10 MARCAS
// ============================================================

interface MarcaData {
  marca: string;
  quantidade: number;
  valor: number;
}

interface TopMarcasChartProps {
  data: MarcaData[];
  isLoading?: boolean;
}

export function TopMarcasChart({ data, isLoading }: TopMarcasChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Marcas Compradas</CardTitle>
          <CardDescription>Marcas mais populares por valor de compra</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Marcas Compradas</CardTitle>
          <CardDescription>Marcas mais populares por valor de compra</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Marcas Compradas</CardTitle>
        <CardDescription>Marcas mais populares por valor de compra</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="marca"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => numeral(value).format('$0a')} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              formatter={(value: number) => numeral(value).format('$0,0.00')}
              labelFormatter={(label) => `Marca: ${label}`}
            />
            <Legend />
            <Bar dataKey="valor" name="Valor Total" fill={CHART_COLORS[1]} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 3. GRÁFICO DE PIZZA - DISTRIBUIÇÃO DE SEGMENTOS
// ============================================================

interface SegmentoData {
  segmento: string;
  quantidade: number;
  receita: number;
}

interface SegmentosChartProps {
  data: SegmentoData[];
  isLoading?: boolean;
}

export function SegmentosChart({ data, isLoading }: SegmentosChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Segmento</CardTitle>
          <CardDescription>Clientes agrupados por categoria RFM</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Segmento</CardTitle>
          <CardDescription>Clientes agrupados por categoria RFM</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Segmento</CardTitle>
        <CardDescription>Clientes agrupados por categoria RFM</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="quantidade"
              nameKey="segmento"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              formatter={(value: number, name: string, props: any) => [
                `${value} clientes (${numeral(props.payload.receita).format('$0,0.00')})`,
                props.payload.segmento,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={50}
              formatter={(value, entry: any) => {
                const item = data.find((d) => d.segmento === entry.value);
                return `${value} (${item?.quantidade || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 4. GRÁFICO DE ÁREA - EVOLUÇÃO DO LTV
// ============================================================

interface LTVData {
  periodo: string;
  ltvAtual: number;
  ltvProjetado: number;
}

interface LTVChartProps {
  data: LTVData[];
  isLoading?: boolean;
}

export function LTVChart({ data, isLoading }: LTVChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do LTV</CardTitle>
          <CardDescription>Customer Lifetime Value atual vs projetado</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução do LTV</CardTitle>
          <CardDescription>Customer Lifetime Value atual vs projetado</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do LTV</CardTitle>
        <CardDescription>Customer Lifetime Value atual vs projetado</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorLtvAtual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[4]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS[4]} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLtvProjetado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[5]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS[5]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => numeral(value).format('$0a')} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              formatter={(value: number) => numeral(value).format('$0,0.00')}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="ltvAtual"
              name="LTV Atual"
              stroke={CHART_COLORS[4]}
              fillOpacity={1}
              fill="url(#colorLtvAtual)"
            />
            <Area
              type="monotone"
              dataKey="ltvProjetado"
              name="LTV Projetado (12 meses)"
              stroke={CHART_COLORS[5]}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorLtvProjetado)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 5. HEATMAP - SAZONALIDADE DE COMPRAS
// ============================================================

interface SazonalidadeData {
  mes: string;
  valor: number;
}

interface SazonalidadeChartProps {
  data: SazonalidadeData[];
  isLoading?: boolean;
}

export function SazonalidadeChart({ data, isLoading }: SazonalidadeChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sazonalidade de Compras</CardTitle>
          <CardDescription>Padrão de compras ao longo do ano</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando gráfico...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sazonalidade de Compras</CardTitle>
          <CardDescription>Padrão de compras ao longo do ano</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  // Normalizar valores para escala de cor
  const maxValor = Math.max(...data.map((d) => d.valor));
  const getColor = (valor: number) => {
    const intensity = Math.min(valor / maxValor, 1);
    // Gradiente de verde claro para verde escuro
    const r = Math.floor(255 - intensity * 155);
    const g = Math.floor(200 + intensity * 55);
    const b = Math.floor(100 - intensity * 50);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sazonalidade de Compras (Heatmap)</CardTitle>
        <CardDescription>Intensidade de compras por mês do ano</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-2 p-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="relative group cursor-pointer rounded-lg p-4 transition-all hover:scale-105"
              style={{
                backgroundColor: getColor(item.valor),
                minHeight: '80px',
              }}
            >
              <div className="text-white font-bold text-sm">{item.mes.substring(0, 3)}</div>
              <div className="text-white text-xs mt-1">
                {numeral(item.valor).format('$0,0')}
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  <div className="font-bold">{item.mes}</div>
                  <div>Receita: {numeral(item.valor).format('$0,0.00')}</div>
                  <div className="text-gray-300 text-[10px]">
                    {((item.valor / maxValor) * 100).toFixed(1)}% do máximo
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Menor</span>
          <div className="flex gap-1">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity) => (
              <div
                key={intensity}
                className="w-8 h-4 rounded"
                style={{
                  backgroundColor: `rgb(${Math.floor(255 - intensity * 155)}, ${Math.floor(200 + intensity * 55)}, ${Math.floor(100 - intensity * 50)})`,
                }}
              />
            ))}
          </div>
          <span>Maior</span>
        </div>
      </CardContent>
    </Card>
  );
}
