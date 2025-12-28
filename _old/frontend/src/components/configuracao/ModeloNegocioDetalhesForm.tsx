'use client';

import { useState, useEffect, useRef } from 'react';
import type { ModeloNegocio } from '@/types/api';

interface ModeloNegocioDetalhesFormProps {
  modeloNegocio: ModeloNegocio | undefined;
  value: string; // JSON string
  onChange: (jsonString: string) => void;
  errors?: string;
}

interface AssociacaoDetalhes {
  tipo?: string;
  caracteristicas?: string[];
  numeroAssociados?: number;
  descricao?: string;
}

const TEMPLATES: Record<ModeloNegocio, AssociacaoDetalhes> = {
  ASSOCIACAO: {
    tipo: 'Associação para Retificas',
    caracteristicas: [],
    descricao: '',
  },
  COMERCIO: {
    tipo: 'Comércio Varejista',
    caracteristicas: [],
    descricao: '',
  },
  INDUSTRIA: {
    tipo: 'Indústria de Transformação',
    caracteristicas: [],
    descricao: '',
  },
  SERVICOS: {
    tipo: 'Prestação de Serviços',
    caracteristicas: [],
    descricao: '',
  },
  AGROPECUARIA: {
    tipo: 'Agronegócio',
    caracteristicas: [],
    descricao: '',
  },
  OUTRO: {
    tipo: '',
    caracteristicas: [],
    descricao: '',
  },
};

export const ModeloNegocioDetalhesForm = ({
  modeloNegocio,
  value,
  onChange,
  errors,
}: ModeloNegocioDetalhesFormProps) => {
  const [useVisualForm, setUseVisualForm] = useState(true);
  const [formData, setFormData] = useState<AssociacaoDetalhes>({
    tipo: '',
    caracteristicas: [],
    descricao: '',
  });
  const [novaCaracteristica, setNovaCaracteristica] = useState('');
  const isInitialMount = useRef(true);
  const lastValueRef = useRef<string>(value);

  // Parse JSON inicial (apenas quando value mudar externamente)
  useEffect(() => {
    // Ignorar se o value mudou por causa do nosso próprio onChange
    if (value === lastValueRef.current && !isInitialMount.current) {
      return;
    }
    
    lastValueRef.current = value;
    isInitialMount.current = false;

    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        setFormData({
          tipo: parsed.tipo || '',
          caracteristicas: Array.isArray(parsed.caracteristicas) ? parsed.caracteristicas : [],
          numeroAssociados: parsed.numeroAssociados,
          descricao: parsed.descricao || '',
        });
      } catch {
        // Se não for JSON válido, usar template
        if (modeloNegocio && modeloNegocio === 'ASSOCIACAO') {
          setFormData(TEMPLATES[modeloNegocio]);
        }
      }
    } else if (modeloNegocio && modeloNegocio === 'ASSOCIACAO') {
      // Se não houver valor, usar template
      setFormData(TEMPLATES[modeloNegocio]);
    }
  }, [value, modeloNegocio]);

  // Atualizar JSON quando formData mudar (mas não quando value mudar externamente)
  useEffect(() => {
    if (!useVisualForm || modeloNegocio !== 'ASSOCIACAO') {
      return;
    }

    const jsonData: AssociacaoDetalhes = {
      ...formData,
      // Remover campos vazios opcionais
      ...(formData.numeroAssociados && { numeroAssociados: formData.numeroAssociados }),
    };
    const newJsonString = JSON.stringify(jsonData, null, 2);
    
    // Só chama onChange se o JSON for diferente do value atual para evitar loop
    if (newJsonString !== lastValueRef.current) {
      lastValueRef.current = newJsonString;
      onChange(newJsonString);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, useVisualForm]);

  const updateFormData = (field: keyof AssociacaoDetalhes, newValue: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: newValue }));
  };

  const addCaracteristica = () => {
    if (novaCaracteristica.trim()) {
      updateFormData('caracteristicas', [...(formData.caracteristicas || []), novaCaracteristica.trim()]);
      setNovaCaracteristica('');
    }
  };

  const removeCaracteristica = (index: number) => {
    updateFormData(
      'caracteristicas',
      formData.caracteristicas?.filter((_, i) => i !== index) || [],
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCaracteristica();
    }
  };

  // Se não for ASSOCIACAO, mostrar apenas JSON editor
  if (modeloNegocio !== 'ASSOCIACAO') {
    return (
      <div className="space-y-1">
        <label htmlFor="modeloNegocioDetalhesJson" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Modelo de Negócio Detalhes (JSON)
        </label>
        <textarea
          id="modeloNegocioDetalhesJson"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder='{"tipo": "...", "caracteristicas": ["..."]}'
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        {errors && <p className="text-xs text-rose-600">{errors}</p>}
        <p className="text-xs text-slate-500">
          JSON com detalhes específicos do modelo de negócio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Modelo de Negócio Detalhes
        </label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={useVisualForm}
              onChange={(e) => setUseVisualForm(e.target.checked)}
              className="h-3 w-3 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
            />
            <span>Usar formulário visual</span>
          </label>
        </div>
      </div>

      {useVisualForm ? (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Tipo de Associação *
            </label>
            <input
              type="text"
              value={formData.tipo || ''}
              onChange={(e) => updateFormData('tipo', e.target.value)}
              placeholder="Ex: Associação para Retificas"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Características
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.caracteristicas?.map((caracteristica, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
                >
                  {caracteristica}
                  <button
                    type="button"
                    onClick={() => removeCaracteristica(index)}
                    className="rounded-full hover:bg-sky-200 dark:hover:bg-sky-900/50"
                  >
                    <span className="sr-only">Remover</span>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaCaracteristica}
                onChange={(e) => setNovaCaracteristica(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma característica e pressione Enter"
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={addCaracteristica}
                className="rounded-md bg-sky-500 px-3 py-2 text-xs font-medium text-white hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Número de Associados (opcional)
            </label>
            <input
              type="number"
              value={formData.numeroAssociados || ''}
              onChange={(e) =>
                updateFormData('numeroAssociados', e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              placeholder="Ex: 150"
              min="0"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Descrição Adicional
            </label>
            <textarea
              value={formData.descricao || ''}
              onChange={(e) => updateFormData('descricao', e.target.value)}
              rows={3}
              placeholder="Informações adicionais sobre a associação..."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Preview JSON:</p>
            <pre className="overflow-x-auto text-xs text-slate-600 dark:text-slate-300">
              {JSON.stringify(
                {
                  ...formData,
                  ...(formData.numeroAssociados && { numeroAssociados: formData.numeroAssociados }),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <textarea
            id="modeloNegocioDetalhesJson"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            placeholder='{"tipo": "Associação para Retificas", "caracteristicas": ["..."]}'
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {errors && <p className="text-xs text-rose-600">{errors}</p>}
          <p className="text-xs text-slate-500">
            JSON com detalhes específicos do modelo de negócio
          </p>
        </div>
      )}
    </div>
  );
};

