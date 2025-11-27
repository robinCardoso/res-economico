'use client';

import { useState, useEffect } from 'react';

export interface ResponsiveChartConfig {
  height: number;
  barHeight: number;
  fontSize: number;
  legendFontSize: number;
  showLegend: boolean;
  labelFontSize: number;
  isMobile: boolean;
}

export function useResponsiveChart(): ResponsiveChartConfig {
  const [config, setConfig] = useState<ResponsiveChartConfig>({
    height: 400,
    barHeight: 400,
    fontSize: 12,
    legendFontSize: 12,
    showLegend: true,
    labelFontSize: 11,
    isMobile: false,
  });

  useEffect(() => {
    const updateConfig = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      
      if (isMobile) {
        setConfig({
          height: 200,
          barHeight: 200,
          fontSize: 10,
          legendFontSize: 10,
          showLegend: false, // Ocultar legenda em mobile para economizar espaço
          labelFontSize: 9,
          isMobile: true,
        });
      } else {
        setConfig({
          height: 400,
          barHeight: 450,
          fontSize: 13,
          legendFontSize: 13,
          showLegend: true,
          labelFontSize: 12,
          isMobile: false,
        });
      }
    };

    // Atualizar na montagem
    updateConfig();

    // Atualizar ao redimensionar
    window.addEventListener('resize', updateConfig);
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
}

