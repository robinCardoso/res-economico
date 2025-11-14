import type { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

// Carregar baseURL da variável de ambiente ou usar fallback
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const baseURL = rawBaseUrl || (typeof window !== 'undefined' ? 'http://localhost:3000' : undefined);

// Log para debug (apenas em desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[HTTP] baseURL configurado:', baseURL || 'NÃO CONFIGURADO');
  console.log('[HTTP] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  if (!baseURL) {
    console.warn('[HTTP] AVISO: baseURL não configurado, usando fallback http://localhost:3000');
  }
}

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
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
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error("Network error - sem resposta do servidor:", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
      });
    } else {
      // Erro ao configurar a requisição
      console.error("Request setup error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;

