'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  requestNotificationPermission,
  registerServiceWorker,
  getPushSubscription,
  createPushSubscription,
  subscriptionToJSON,
  isPushNotificationSupported,
} from '@/lib/push-notifications';
import { pushNotificationsService } from '@/services/push-notifications.service';

export function PushNotificationManager() {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    checkSupportAndSubscription();
  }, []);

  const checkSupportAndSubscription = async () => {
    setIsLoading(true);
    try {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Primeiro, tentar registrar o service worker se não estiver registrado
      let registration: ServiceWorkerRegistration | null = null;
      
      try {
        // Verificar se já existe um service worker registrado
        registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          // Se não existe, registrar
          console.log('Registrando service worker...');
          registration = await registerServiceWorker();
        }
        
        // Aguardar o service worker estar pronto
        await registration.ready;
        
        // Verificar subscription
        const subscription = await getPushSubscription(registration);
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Erro ao verificar/registrar service worker:', error);
        // Tentar registrar novamente
        try {
          registration = await registerServiceWorker();
          await registration.ready;
          const subscription = await getPushSubscription(registration);
          setIsSubscribed(!!subscription);
        } catch (regError) {
          console.error('Erro ao registrar service worker:', regError);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      // 1. Registrar service worker primeiro (necessário para push)
      // A função registerServiceWorker já aguarda estar ativo
      const registration = await registerServiceWorker();

      // 2. Solicitar permissão de notificação
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações para usar esta funcionalidade.',
          variant: 'destructive',
        });
        setIsEnabling(false);
        return;
      }

      // 3. Obter chave pública
      const publicKey = await pushNotificationsService.getPublicKey();

      if (!publicKey) {
        throw new Error('Chave pública VAPID não configurada no servidor');
      }

      // 4. Criar subscription
      const subscription = await createPushSubscription(registration, publicKey);

      // 5. Converter para JSON
      const subscriptionData = subscriptionToJSON(subscription);

      // 6. Enviar para o backend
      await pushNotificationsService.subscribe({
        endpoint: subscriptionData.endpoint,
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      toast({
        title: 'Sucesso',
        description: 'Notificações push ativadas com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao ativar push notifications:', error);
      
      let errorMessage = 'Erro ao ativar notificações push';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Se o erro for relacionado a service worker não ativo, sugerir recarregar
        if (
          error.message.includes('Service Worker não está ativo') ||
          error.message.includes('no active Service Worker')
        ) {
          errorMessage += ' Por favor, recarregue a página e tente novamente.';
        }
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable = async () => {
    setIsEnabling(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await getPushSubscription(registration);

      if (subscription) {
        // Remover do backend
        await pushNotificationsService.unsubscribe(subscription.endpoint);

        // Remover subscription local
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast({
        title: 'Sucesso',
        description: 'Notificações push desativadas com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao desativar push notifications:', error);
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Erro ao desativar notificações push',
        variant: 'destructive',
      });
    } finally {
      setIsEnabling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    const isSecure = typeof window !== 'undefined' && 
      (window.location.protocol === 'https:' || 
       window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1');
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificações Push</CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Requisitos para notificações push:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Navegador moderno (Chrome, Firefox, Edge, Safari)</li>
              <li>
                HTTPS (ou localhost em desenvolvimento)
                {!isSecure && (
                  <span className="text-destructive font-semibold">
                    {' '}⚠️ Você está usando: {typeof window !== 'undefined' ? window.location.href : 'desconhecido'}
                  </span>
                )}
              </li>
              <li>Service Worker habilitado</li>
            </ul>
            {!isSecure && typeof window !== 'undefined' && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  ⚠️ Contexto não seguro detectado
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Para usar notificações push em desenvolvimento, acesse via{' '}
                  <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">
                    http://localhost:3001
                  </code>{' '}
                  ou{' '}
                  <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">
                    http://127.0.0.1:3001
                  </code>
                  . IPs da rede local (ex: 192.168.x.x) não funcionam.
                </p>
              </div>
            )}
            <p className="mt-2">
              <strong>Nota:</strong> Não é necessário instalar como PWA. As
              notificações funcionam diretamente no navegador.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notificações Push</CardTitle>
        <CardDescription>
          Receba notificações mesmo quando o navegador estiver fechado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {isSubscribed ? 'Ativado' : 'Desativado'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? 'Você receberá notificações push'
                : 'Ative para receber notificações push'}
            </p>
          </div>
          {isSubscribed ? (
            <Button
              variant="outline"
              onClick={handleDisable}
              disabled={isEnabling}
            >
              {isEnabling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desativando...
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Desativar
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleEnable} disabled={isEnabling}>
              {isEnabling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Ativar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

