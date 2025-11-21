import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

// Função para obter a baseURL dinamicamente
const getBaseURL = (): string | undefined => {
  if (typeof window === 'undefined') {
    // Server-side: usar variável de ambiente ou undefined
    return process.env.NEXT_PUBLIC_API_URL?.trim() || undefined;
  }

  // Client-side: verificar localStorage primeiro (permite configuração dinâmica)
  const storedApiUrl = localStorage.getItem('api-url');
  if (storedApiUrl) {
    return storedApiUrl.trim();
  }

  // Depois verificar variável de ambiente
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback: usar localhost (funciona quando frontend e backend estão na mesma máquina)
  return 'http://localhost:3000';
};

// Criar instância do axios sem baseURL fixa
export const api = axios.create({
  timeout: 15_000,
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
    if (error.response) {
      // Se receber 401, limpar autenticação
      if (error.response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        // Não redirecionar se já estiver na página de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      const errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
        data: error.response.data,
        message: error.message,
        headers: error.response.headers,
      };
      console.error("API error:", errorDetails);
      
      // Tentar extrair mensagem de erro mais detalhada
      const errorData = error.response.data as unknown;
      let errorMessage = error.message;
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
          console.error("Error message:", errorData);
        } else if (typeof errorData === 'object' && errorData !== null) {
          const errorObj = errorData as { message?: string | string[] };
          if (errorObj.message) {
            if (Array.isArray(errorObj.message)) {
              errorMessage = errorObj.message.join(', ');
              console.error("Validation errors:", errorObj.message);
            } else {
              errorMessage = errorObj.message;
              console.error("Error message:", errorObj.message);
            }
          } else {
            console.error("Error response data:", JSON.stringify(errorData, null, 2));
          }
        } else {
          console.error("Error response data:", JSON.stringify(errorData, null, 2));
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
      console.error('[HTTP] Sugestão: Verifique se o backend está rodando e se o IP/URL está correto.');
      console.error('[HTTP] Para configurar a URL da API, execute no console do navegador:');
      console.error(`[HTTP]   localStorage.setItem("api-url", "http://SEU_IP:3000")`);
      console.error(`[HTTP] URL atual configurada: ${baseURL}`);
      
      // Criar erro mais descritivo
      const networkError = new Error(
        `Erro de conexão: Não foi possível conectar ao servidor em ${fullURL}. ` +
        `Verifique se o backend está rodando na URL: ${baseURL}`
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

