/**
 * Utilitários para Push Notifications
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Permissão de notificação foi negada');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Aguarda o Service Worker estar ativo
 */
async function waitForServiceWorkerActive(
  registration: ServiceWorkerRegistration,
  timeout = 20000, // Aumentado para 20 segundos
): Promise<void> {
  if (registration.active) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    let resolved = false;

    const resolveOnce = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    const checkActive = () => {
      if (resolved) {
        return;
      }

      if (registration.active) {
        resolveOnce();
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        if (!resolved) {
          resolved = true;
          
          // Coletar informações de debug
          const state = {
            active: registration.active?.state || 'null',
            installing: registration.installing?.state || 'null',
            waiting: registration.waiting?.state || 'null',
            scope: registration.scope,
            updateViaCache: registration.updateViaCache,
          };
          
          console.error('Service Worker não ativou após', elapsed, 'ms. Estado:', state);
          
          reject(
            new Error(
              `Service Worker não está ativo após ${Math.round(elapsed / 1000)} segundos. ` +
              `Estado: active=${state.active}, installing=${state.installing}, waiting=${state.waiting}. ` +
              `Tente recarregar a página ou verifique se o arquivo /sw.js está acessível.`,
            ),
          );
        }
        return;
      }

      setTimeout(checkActive, 200); // Verificar a cada 200ms
    };

    // Se está instalando, aguardar mudança de estado
    if (registration.installing) {
      console.log('Service Worker está instalando...');
      registration.installing.addEventListener('statechange', function () {
        console.log('Service Worker state changed:', this.state);
        if (this.state === 'activated') {
          resolveOnce();
        } else if (this.state === 'redundant') {
          console.warn('Service Worker marcado como redundant');
          if (!resolved) {
            checkActive();
          }
        } else if (this.state === 'installed') {
          // Quando instalado, pode precisar aguardar ativação
          console.log('Service Worker instalado, aguardando ativação...');
          checkActive();
        }
      });
    }

    // Se está esperando, tentar ativar
    if (registration.waiting) {
      console.log('Service Worker está esperando, tentando ativar...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.waiting.addEventListener('statechange', function () {
        console.log('Waiting Service Worker state changed:', this.state);
        if (this.state === 'activated') {
          resolveOnce();
        }
      });
    }

    // Aguardar estar pronto (usar try-catch para segurança)
    try {
      if (registration.ready && typeof registration.ready.then === 'function') {
        console.log('Aguardando registration.ready...');
        registration.ready
          .then(() => {
            console.log('registration.ready resolvido, active:', registration.active?.state);
            if (registration.active && !resolved) {
              resolveOnce();
            } else if (!resolved) {
              checkActive();
            }
          })
          .catch((err) => {
            console.error('Erro em registration.ready:', err);
            if (!resolved) {
              checkActive();
            }
          });
      } else {
        // Se ready não existe ou não é uma Promise, apenas iniciar verificação periódica
        console.log('registration.ready não disponível, usando verificação periódica');
        checkActive();
      }
    } catch (err) {
      // Se houver erro ao acessar ready, apenas iniciar verificação periódica
      console.error('Erro ao acessar registration.ready:', err);
      checkActive();
    }

    // Iniciar verificação periódica imediatamente
    checkActive();
  });
}

/**
 * Registra o Service Worker e aguarda estar ativo
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador não suporta Service Workers');
  }

  // Verificar se está em contexto seguro
  if (!isSecureContext()) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    if (protocol === 'http:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      throw new Error(
        `Service Workers requerem HTTPS ou localhost. Você está usando ${protocol}//${hostname}. ` +
        'Em desenvolvimento, use localhost ou configure HTTPS.',
      );
    }
  }

  try {
    // Verificar se já existe um service worker registrado
    let registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.log('Registrando novo Service Worker...');
      // Registrar novo service worker
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('Service Worker registrado com sucesso. Scope:', registration.scope);
      } catch (registerError) {
        console.error('Erro ao registrar Service Worker:', registerError);
        // Se falhar ao registrar, verificar se é problema de contexto
        if (registerError instanceof Error) {
          if (registerError.message.includes('Failed to register')) {
            throw new Error(
              'Falha ao registrar Service Worker. Verifique se o arquivo /sw.js está acessível e se você está usando HTTPS ou localhost.',
            );
          }
        }
        throw registerError;
      }
    } else {
      console.log('Service Worker já registrado. Estado atual:', {
        active: registration.active?.state || 'null',
        installing: registration.installing?.state || 'null',
        waiting: registration.waiting?.state || 'null',
      });
    }

    // Se já está ativo, retornar imediatamente
    if (registration.active) {
      console.log('Service Worker já está ativo');
      return registration;
    }

    // Aguardar o service worker estar ativo
    console.log('Aguardando Service Worker estar ativo...');
    await waitForServiceWorkerActive(registration);

    // Verificar novamente se está ativo
    if (!registration.active) {
      throw new Error(
        'Service Worker não está ativo após registro. Por favor, recarregue a página e tente novamente.',
      );
    }

    console.log('Service Worker está ativo e pronto');
    return registration;
  } catch (error) {
    console.error('Erro ao registrar Service Worker:', error);
    if (error instanceof Error) {
      throw error; // Re-throw se já for um Error com mensagem personalizada
    }
    throw new Error(
      `Erro ao registrar Service Worker: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}

/**
 * Obtém subscription de push
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const subscription = await registration.pushManager.getSubscription();
  return subscription;
}

/**
 * Cria subscription de push
 */
export async function createPushSubscription(
  registration: ServiceWorkerRegistration,
  publicKey: string,
): Promise<PushSubscription> {
  // Garantir que o service worker está ativo
  if (!registration.active) {
    // Aguardar até estar ativo
    await waitForServiceWorkerActive(registration);
    
    // Verificar novamente
    if (!registration.active) {
      throw new Error(
        'Service Worker não está ativo. Por favor, recarregue a página e tente novamente.',
      );
    }
  }

  // Verificar se pushManager está disponível
  if (!registration.pushManager) {
    throw new Error('PushManager não está disponível no Service Worker');
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    return subscription;
  } catch (error) {
    if (error instanceof Error && error.message.includes('no active Service Worker')) {
      throw new Error(
        'Service Worker não está ativo. Por favor, recarregue a página e tente novamente.',
      );
    }
    throw error;
  }
}

/**
 * Converte chave VAPID de base64 URL para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Converte PushSubscription para objeto serializável
 */
export function subscriptionToJSON(
  subscription: PushSubscription,
): PushSubscriptionData {
  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
    },
  };
}

/**
 * Verifica se está em ambiente seguro (HTTPS ou localhost)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // HTTPS sempre é seguro
  if (window.location.protocol === 'https:') {
    return true;
  }

  // HTTP só é seguro se for localhost ou 127.0.0.1
  // Em desenvolvimento, também aceitamos IPs locais (192.168.x.x, 10.x.x.x, etc.)
  if (window.location.protocol === 'http:') {
    const hostname = window.location.hostname;
    
    // localhost e variações
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    ) {
      return true;
    }

    // IPs locais em desenvolvimento (para permitir acesso via rede)
    // Nota: Service Workers podem não funcionar com IPs não-localhost em alguns navegadores
    // Mas vamos permitir a tentativa
    if (process.env.NODE_ENV === 'development') {
      const ipPattern = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
      if (ipPattern.test(hostname)) {
        console.warn(
          'Aviso: Service Workers podem não funcionar com IPs locais. Use localhost ou HTTPS.',
        );
        return true; // Permitir tentativa, mas avisar
      }
    }

    return false;
  }

  return false;
}

/**
 * Verifica se o navegador suporta push notifications
 */
export function isPushNotificationSupported(): boolean {
  const hasSupport =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  if (!hasSupport) {
    return false;
  }

  // Verificar se está em contexto seguro
  if (!isSecureContext()) {
    console.warn(
      'Push notifications requerem HTTPS ou localhost. Atual:',
      window.location.href,
    );
    return false;
  }

  return true;
}

