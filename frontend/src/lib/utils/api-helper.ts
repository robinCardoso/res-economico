/**
 * Função para obter a URL da API com fallback inteligente
 */
export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Se não houver variável de ambiente, usar localhost
  if (!envUrl) {
    return 'http://localhost:3000';
  }
  
  // Se a URL não começar com http:// ou https://, adicionar http://
  if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
    return `http://${envUrl}`;
  }
  
  return envUrl;
}

/**
 * Faz uma requisição fetch com fallback automático para localhost
 */
export async function fetchWithFallback(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = getApiUrl();
  const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;
  
  // Se já estiver usando localhost, não precisa de fallback
  if (apiUrl === 'http://localhost:3000') {
    return fetch(fullUrl, {
      ...options,
      signal: AbortSignal.timeout(5000),
    });
  }
  
  // Tentar primeiro com a URL configurada
  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: AbortSignal.timeout(5000),
    });
    return response;
  } catch (error: any) {
    // Se for erro de conexão/timeout, tentar fallback para localhost
    const isConnectionError = 
      error.code === 'UND_ERR_CONNECT_TIMEOUT' || 
      error.message?.includes('fetch failed') ||
      error.name === 'TimeoutError' ||
      error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
    
    if (isConnectionError) {
      console.log(`⚠️ Erro de conexão com ${apiUrl}, tentando fallback para localhost:3000...`);
      const fallbackUrl = url.startsWith('http') 
        ? url.replace(apiUrl, 'http://localhost:3000')
        : `http://localhost:3000${url}`;
      
      try {
        return await fetch(fallbackUrl, {
          ...options,
          signal: AbortSignal.timeout(5000),
        });
      } catch (fallbackError) {
        console.error('❌ Erro também no fallback para localhost:', fallbackError);
        throw error; // Lançar o erro original
      }
    }
    throw error;
  }
}

