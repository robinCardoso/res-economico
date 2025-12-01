import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

// Flag para mostrar aviso apenas uma vez
let hasShownLocalStorageWarning = false;

// Função para obter a baseURL dinamicamente
const getBaseURL = (): string | undefined => {
  if (typeof window === 'undefined') {
    // Server-side: usar variável de ambiente ou undefined
    return process.env.NEXT_PUBLIC_API_URL?.trim() || undefined;
  }

  // Client-side: priorizar variável de ambiente (mais confiável)
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envApiUrl) {
    // Se há variável de ambiente, usar ela (mas avisar se localStorage está diferente - apenas uma vez)
    const storedApiUrl = localStorage.getItem('api-url');
    if (storedApiUrl && storedApiUrl.trim() !== envApiUrl && !hasShownLocalStorageWarning) {
      console.warn(
        `[HTTP] ⚠️ Variável de ambiente NEXT_PUBLIC_API_URL (${envApiUrl}) está sendo usada. ` +
        `localStorage tem valor diferente (${storedApiUrl}). ` +
        `Para limpar: localStorage.removeItem('api-url')`
      );
      hasShownLocalStorageWarning = true;
    }
    return envApiUrl;
  }

  // Se não há variável de ambiente, verificar localStorage (permite configuração dinâmica)
  const storedApiUrl = localStorage.getItem('api-url');
  if (storedApiUrl) {
    return storedApiUrl.trim();
  }

  // Fallback: usar localhost (funciona quando frontend e backend estão na mesma máquina)
  return 'http://localhost:3000';
};

// Criar instância do axios sem baseURL fixa
export const api = axios.create({
  timeout: 60_000, // 60 segundos para uploads grandes
  headers: {
    "Content-Type": "application/json",
  },
});

// Log para debug (apenas em desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const initialBaseURL = getBaseURL();
  console.log('[HTTP] baseURL inicial:', initialBaseURL || 'NÃO CONFIGURADO');
  console.log('[HTTP] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('[HTTP] localStorage api-url:', localStorage.getItem('api-url'));
  if (!initialBaseURL) {
    console.warn('[HTTP] AVISO: baseURL não configurado, usando fallback http://localhost:3000');
  }
}

// Interceptor para adicionar token e baseURL dinâmica nas requisições
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      // Definir baseURL dinamicamente a cada requisição
      const dynamicBaseURL = getBaseURL();
      if (dynamicBaseURL && !config.baseURL) {
        config.baseURL = dynamicBaseURL;
      }

      // Adicionar token de autenticação
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const auth = JSON.parse(authStorage);
          const token = auth?.state?.token;
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // Ignora erros de parsing
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (error.response) {
      const status = error.response.status;
      const isAuthError = status === 401 || status === 403;
      const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      
      // Se receber 401, limpar autenticação
      if (status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        // Não redirecionar se já estiver na página de login
        if (!isOnLoginPage) {
          window.location.href = '/login';
        }
      }
      
      // Tentar extrair mensagem de erro mais detalhada
      const errorData = error.response.data as unknown;
      let errorMessage = error.message;
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object' && errorData !== null) {
          const errorObj = errorData as { message?: string | string[] };
          if (errorObj.message) {
            if (Array.isArray(errorObj.message)) {
              errorMessage = errorObj.message.join(', ');
            } else {
              errorMessage = errorObj.message;
            }
          }
        }
      }
      
      // Logar erros apenas em desenvolvimento ou se não for erro de autenticação esperado
      // Erros de autenticação na página de login são esperados (usuário digitou senha errada)
      const shouldLogError = isDevelopment || (!isAuthError || !isOnLoginPage);
      
      if (shouldLogError) {
        const errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
          data: error.response.data,
          message: error.message,
        };
        console.error("API error:", errorDetails);
        
        if (errorData) {
          if (typeof errorData === 'string') {
            console.error("Error message:", errorData);
          } else if (typeof errorData === 'object' && errorData !== null) {
            const errorObj = errorData as { message?: string | string[] };
            if (errorObj.message) {
              if (Array.isArray(errorObj.message)) {
                console.error("Validation errors:", errorObj.message);
              } else {
                console.error("Error message:", errorObj.message);
              }
            } else {
              console.error("Error response data:", JSON.stringify(errorData, null, 2));
            }
          } else {
            console.error("Error response data:", JSON.stringify(errorData, null, 2));
          }
        }
      }
      
      // Criar um novo erro com a mensagem extraída para melhor propagação
      const enhancedError = new Error(errorMessage);
      (enhancedError as { response?: unknown }).response = error.response;
      (enhancedError as { config?: unknown }).config = error.config;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta (erro de rede)
      // Logar informações úteis para debug
      const baseURL = error.config?.baseURL || getBaseURL() || 'NÃO CONFIGURADO';
      const url = error.config?.url || 'NÃO DEFINIDO';
      const fullURL = baseURL && url ? `${baseURL}${url}` : 'NÃO DISPONÍVEL';
      
      const errorInfo: Record<string, unknown> = {
        message: error.message || 'Erro de conexão desconhecido',
        code: error.code || 'NETWORK_ERROR',
        baseURL,
        url,
        fullURL,
      };

      // Adicionar informações adicionais se disponíveis
      if (error.request) {
        errorInfo.requestStatus = error.request.status;
        errorInfo.requestReadyState = error.request.readyState;
      }

      console.error('[HTTP] Erro de conexão:', errorInfo);
      console.error('[HTTP] ⚠️ Não foi possível conectar ao backend.');
      console.error(`[HTTP] URL tentada: ${fullURL}`);
      console.error('');
      console.error('[HTTP] 📋 SOLUÇÕES:');
      console.error('[HTTP] 1. Crie o arquivo frontend/.env.local com:');
      console.error('[HTTP]    NEXT_PUBLIC_API_URL=http://10.1.1.37:3000');
      console.error('[HTTP]    (Substitua 10.1.1.37 pelo IP do seu backend)');
      console.error('');
      console.error('[HTTP] 2. OU configure via console do navegador (temporário):');
      console.error('[HTTP]    localStorage.setItem("api-url", "http://10.1.1.37:3000")');
      console.error('[HTTP]    (Depois recarregue a página)');
      console.error('');
      console.error(`[HTTP] URL atual configurada: ${baseURL}`);
      
      // Criar erro mais descritivo
      const networkError = new Error(
        `Erro de conexão: Não foi possível conectar ao servidor em ${fullURL}. ` +
        `Verifique se o backend está rodando e acessível na rede. ` +
        `Backend deve estar escutando em 0.0.0.0:3000 (não apenas localhost). ` +
        `URL configurada: ${baseURL}`
      );
      (networkError as { code?: string }).code = error.code || 'NETWORK_ERROR';
      (networkError as { config?: unknown }).config = error.config;
      return Promise.reject(networkError);
    } else {
      // Erro ao configurar a requisição
      const setupError = error.message || 'Erro desconhecido ao configurar requisição';
      console.error("[HTTP] Request setup error:", setupError);
      return Promise.reject(new Error(setupError));
    }
  },
);

export default api;

