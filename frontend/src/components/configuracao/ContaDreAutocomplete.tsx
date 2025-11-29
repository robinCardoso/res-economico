'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contasService } from '@/services/contas.service';
import type { ContaCatalogo } from '@/types/api';

interface ContaDreAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  tipoConta?: 'receita' | 'custo';
}

export const ContaDreAutocomplete = ({
  value,
  onChange,
  placeholder = 'Digite o código (ex: 3.1.01.01) ou nome da conta',
  className = '',
}: ContaDreAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sincronizar inputValue quando value externo mudar (importante para quando o campo é resetado ou preenchido externamente)
  // Mas apenas quando não está editando, para não interferir com a digitação do usuário
  useEffect(() => {
    if (!isEditing) {
      const newValue = value || '';
      setInputValue(newValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isEditing]); // isEditing é necessário para saber quando não sincronizar

  // Buscar todas as contas DRE (sem filtro de busca no backend para permitir busca flexível no frontend)
  const { data: contas, isLoading } = useQuery({
    queryKey: ['contas-dre-autocomplete-all'],
    queryFn: () => contasService.list({ tipoConta: '3-DRE' }),
    staleTime: 300000, // Cache por 5 minutos (contas não mudam frequentemente)
  });

  // Filtrar sugestões baseado no input com busca mais flexível (partes de palavras)
  const suggestions = useMemo(() => {
    if (!contas || inputValue.trim().length < 2) {
      return [];
    }

    const searchTerm = inputValue.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/).filter((word) => word.length > 0);

    return contas
      .map((conta) => {
        const classificacaoLower = conta.classificacao.toLowerCase();
        const contaLower = conta.conta.toLowerCase();
        const nomeLower = conta.nomeConta.toLowerCase();
        // Criar identificador completo para busca
        const identificadorCompleto = conta.subConta && conta.subConta.trim() !== ''
          ? `${classificacaoLower}.${contaLower}.${conta.subConta.toLowerCase()}`
          : `${classificacaoLower}.${contaLower}`;

        // Calcular score de relevância
        let score = 0;
        let hasMatch = false;

        // Busca exata no identificador completo (maior prioridade)
        if (identificadorCompleto === searchTerm) {
          score += 110;
          hasMatch = true;
        }
        // Busca exata no nome
        else if (nomeLower === searchTerm) {
          score += 100;
          hasMatch = true;
        }
        // Busca exata na classificação
        else if (classificacaoLower === searchTerm) {
          score += 90;
          hasMatch = true;
        }
        // Identificador completo começa com o termo
        else if (identificadorCompleto.startsWith(searchTerm)) {
          score += 85;
          hasMatch = true;
        }
        // Nome começa com o termo
        else if (nomeLower.startsWith(searchTerm)) {
          score += 80;
          hasMatch = true;
        }
        // Classificação começa com o termo
        else if (classificacaoLower.startsWith(searchTerm)) {
          score += 70;
          hasMatch = true;
        }
        // Identificador completo contém o termo
        else if (identificadorCompleto.includes(searchTerm)) {
          score += 55;
          hasMatch = true;
        }
        // Nome contém o termo completo (substring)
        else if (nomeLower.includes(searchTerm)) {
          score += 50;
          hasMatch = true;
        }
        // Classificação contém o termo completo (substring)
        else if (classificacaoLower.includes(searchTerm)) {
          score += 40;
          hasMatch = true;
        }

        // Busca por partes de palavras individuais
        // Ex: "associado" deve encontrar "Associados", "contribui" deve encontrar "Contribuição"
        searchWords.forEach((word) => {
          // Verificar se alguma palavra no nome contém esta parte
          const palavrasNoNome = nomeLower.split(/\s+/);
          const palavrasNaClassificacao = classificacaoLower.split(/[.\s]+/);

          // Buscar em cada palavra individualmente (não apenas substring no texto completo)
          palavrasNoNome.forEach((palavra) => {
            if (palavra.includes(word)) {
              score += 15;
              hasMatch = true;
            }
            // Se a palavra começa com o termo, dar mais pontos
            if (palavra.startsWith(word)) {
              score += 10;
            }
          });

          palavrasNaClassificacao.forEach((palavra) => {
            if (palavra.includes(word)) {
              score += 8;
              hasMatch = true;
            }
            if (palavra.startsWith(word)) {
              score += 5;
            }
          });
        });

        // Busca por palavras múltiplas (todas as palavras devem estar presentes em qualquer lugar)
        if (searchWords.length > 1) {
          const allWordsInNome = searchWords.every((word) => {
            const palavrasNoNome = nomeLower.split(/\s+/);
            return palavrasNoNome.some((palavra) => palavra.includes(word)) || nomeLower.includes(word);
          });
          const allWordsInClassificacao = searchWords.every((word) => {
            const palavrasNaClassificacao = classificacaoLower.split(/[.\s]+/);
            return palavrasNaClassificacao.some((palavra) => palavra.includes(word)) || classificacaoLower.includes(word);
          });

          if (allWordsInNome) {
            score += 30;
            hasMatch = true;
          }
          if (allWordsInClassificacao) {
            score += 20;
            hasMatch = true;
          }
        }

        return { conta, score, hasMatch };
      })
      .filter((item) => item.hasMatch) // Apenas contas com match
      .sort((a, b) => b.score - a.score) // Ordenar por relevância
      .slice(0, 10) // Limitar a 10 sugestões
      .map((item) => item.conta);
  }, [contas, inputValue]);

  // Função auxiliar para criar identificador único da conta
  const criarIdentificadorConta = useCallback((conta: ContaCatalogo): string => {
    // Formato: classificacao.conta ou classificacao.conta.subConta (se houver subConta)
    if (conta.subConta && conta.subConta.trim() !== '') {
      return `${conta.classificacao}.${conta.conta}.${conta.subConta}`;
    }
    return `${conta.classificacao}.${conta.conta}`;
  }, []);

  // Função auxiliar para encontrar conta pelo identificador
  const encontrarContaPorIdentificador = useCallback((identificador: string): ContaCatalogo | null => {
    if (!contas || !identificador) return null;
    return contas.find((conta) => criarIdentificadorConta(conta) === identificador) || null;
  }, [contas, criarIdentificadorConta]);

  // Encontrar a conta selecionada baseada no valor (identificador completo)
  const contaSelecionada = useMemo(() => {
    if (!contas || !value) return null;
    return encontrarContaPorIdentificador(value);
  }, [contas, value, encontrarContaPorIdentificador]);

  // Calcular valor de exibição baseado no value externo quando não está editando
  const displayValueFromProps = useMemo(() => {
    if (!value) return '';
    const conta = encontrarContaPorIdentificador(value);
    if (conta) {
      // Exibir no formato: classificacao.conta ou classificacao.conta.subConta
      return conta.subConta && conta.subConta.trim() !== ''
        ? `${conta.classificacao}.${conta.conta}.${conta.subConta}`
        : `${conta.classificacao}.${conta.conta}`;
    }
    // Se não encontrar, exibir o valor como está (pode ser formato antigo ou manual)
    return value;
  }, [value, encontrarContaPorIdentificador]);

  // Usar valor calculado quando não estiver editando, senão usar inputValue
  // Quando está editando, sempre usar inputValue (o que o usuário está digitando)
  // Quando não está editando e value está vazio, usar inputValue (que deve ser vazio também)
  // Quando não está editando e value tem valor, usar displayValueFromProps (formato legível)
  const currentInputValue = isEditing 
    ? inputValue 
    : (!value || value === '') 
      ? inputValue 
      : displayValueFromProps;

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIsEditing(true);
    setInputValue(newValue);
    onChange(newValue);
    // Mostrar sugestões quando tiver pelo menos 2 caracteres
    if (newValue.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (conta: ContaCatalogo) => {
    const identificador = criarIdentificadorConta(conta);
    // Exibir no input: classificacao.conta (formato mais legível)
    const displayValue = conta.subConta && conta.subConta.trim() !== ''
      ? `${conta.classificacao}.${conta.conta}.${conta.subConta}`
      : `${conta.classificacao}.${conta.conta}`;
    setIsEditing(false);
    setInputValue(displayValue);
    onChange(identificador); // Salvar identificador completo
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={currentInputValue}
            onChange={handleInputChange}
            onBlur={() => {
              setIsEditing(false);
              // Sincronizar inputValue com displayValueFromProps ao sair do foco
              setInputValue(displayValueFromProps);
            }}
            onFocus={() => {
              setIsEditing(true);
              // Garantir que inputValue está sincronizado ao focar
              const currentVal = value || '';
              // Só atualizar se for diferente (evita resetar o que o usuário já digitou)
              const valToUse = currentVal !== inputValue ? currentVal : inputValue;
              if (currentVal !== inputValue) {
                setInputValue(currentVal);
              }
              // Mostrar sugestões se já tiver pelo menos 2 caracteres
              const checkValue = valToUse || inputValue || currentVal;
              if (checkValue.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
          />
        </div>
        {contaSelecionada && (
          <div className="flex-shrink-0 min-w-0 max-w-xs">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {contaSelecionada.nomeConta}
            </span>
          </div>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {isLoading && (
            <div className="px-3 py-2 text-xs text-slate-500">Buscando...</div>
          )}
          {!isLoading &&
            suggestions.map((conta, index) => (
              <button
                key={conta.id}
                type="button"
                onClick={() => handleSelectSuggestion(conta)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  index === selectedIndex
                    ? 'bg-sky-50 dark:bg-sky-900/20'
                    : 'bg-white dark:bg-slate-800'
                }`}
              >
                <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
                  {conta.subConta && conta.subConta.trim() !== ''
                    ? `${conta.classificacao}.${conta.conta}.${conta.subConta}`
                    : `${conta.classificacao}.${conta.conta}`}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {conta.nomeConta}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};


