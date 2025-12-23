/**
 * Hooks de otimização para performance do sistema de analytics
 * Inclui: debouncing, memoização, lazy loading
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Hook para debouncing de valor (ex: filtro de busca)
 * 
 * OTIMIZAÇÃO: Evita múltiplas requisições enquanto usuário digita
 * 
 * Exemplo:
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebouncedValue(searchQuery, 500);
 * // Requisição só é feita 500ms após parar de digitar
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debouncing de callback (ex: handleFilter)
 * 
 * OTIMIZAÇÃO: Reduz número de vezes que função é executada
 * 
 * Exemplo:
 * const handleFilter = useDebouncedCallback((filters) => {
 *   refetch(filters);
 * }, 500);
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
): T {
  // Usar a biblioteca 'use-debounce' se instalada, senão implementar manualmente
  return useDebouncedCallback(callback, delay) as T;
}

/**
 * Hook para cache de valores computados
 * 
 * OTIMIZAÇÃO: Evita recalcular valores pesados a cada render
 * 
 * Exemplo:
 * const dadosFiltrados = useComputedCache(
 *   () => metricasArray.filter(m => m.receita > 1000),
 *   [metricasArray],
 * );
 */
export function useComputedCache<T>(
  computeFn: () => T,
  deps: React.DependencyList,
): T {
  return useMemo(() => computeFn(), deps);
}

/**
 * Hook para throttle (similar a debounce, mas executa periodicamente)
 * 
 * OTIMIZAÇÃO: Limita frequência de execução (ex: scroll events)
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
): T {
  const lastRun = useRef<number>(Date.now());
  const timeoutId = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        clearTimeout(timeoutId.current);
        timeoutId.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay],
  ) as T;
}

/**
 * Hook para lazy loading de imagens
 * 
 * OTIMIZAÇÃO: Carrega imagens apenas quando visíveis
 */
export function useLazyImage(src: string, placeholder: string = ''): {
  src: string;
  isLoaded: boolean;
} {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return { src: imageSrc, isLoaded };
}

/**
 * Hook para Intersection Observer (lazy load components)
 * 
 * OTIMIZAÇÃO: Carrega componentes apenas quando visíveis na viewport
 * 
 * Exemplo:
 * const { ref, isVisible } = useIntersectionObserver();
 * <div ref={ref}>
 *   {isVisible && <HeavyComponent />}
 * </div>
 */
export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

/**
 * Hook para medir performance de componente
 * 
 * OTIMIZAÇÃO: Medir e logar tempo de render para identificar gargalos
 * 
 * Exemplo:
 * const measureId = 'Dashboard';
 * usePerfMeasure(measureId);
 * // Loga automaticamente no console
 */
export function usePerfMeasure(componentName: string) {
  useEffect(() => {
    // Iniciar medição
    performance.mark(`${componentName}-start`);

    return () => {
      // Finalizar medição
      performance.mark(`${componentName}-end`);
      performance.measure(
        componentName,
        `${componentName}-start`,
        `${componentName}-end`,
      );

      const measure = performance.getEntriesByName(componentName)[0];
      if (measure) {
        console.log(
          `⏱️  ${componentName} render: ${measure.duration.toFixed(2)}ms`,
        );
      }
    };
  }, [componentName]);
}

/**
 * Hook para gerenciar cache de requisições
 * 
 * OTIMIZAÇÃO: Cache local de requisições já feitas
 */
export function useRequestCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000, // 5 minutos por padrão
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const fetch = async () => {
      // Verificar cache
      const cached = cache.current.get(key);
      if (cached && Date.now() - cached.timestamp < ttl) {
        setState({ data: cached.data, loading: false, error: null });
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const data = await fetcher();
        cache.current.set(key, { data, timestamp: Date.now() });
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    fetch();
  }, [key, fetcher, ttl]);

  return state;
}

/**
 * Hook para prevenir memory leaks
 * 
 * OTIMIZAÇÃO: Automaticamente limpar timeouts/listeners ao desmontar
 */
export function useCleanup() {
  const callbacks = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      callbacks.current.forEach((cb) => cb());
    };
  }, []);

  return {
    onCleanup: (callback: () => void) => {
      callbacks.current.push(callback);
    },
  };
}
