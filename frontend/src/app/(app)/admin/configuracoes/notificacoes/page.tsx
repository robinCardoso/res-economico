'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  preferenciasNotificacaoService,
  type UpdatePreferenciaNotificacaoDto,
} from '@/services/preferencias-notificacao.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, Clock, Calendar } from 'lucide-react';
import { PushNotificationManager } from '@/components/push-notifications/push-notification-manager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DIAS_SEMANA = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

export default function PreferenciasNotificacaoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferencias, isLoading, error } = useQuery({
    queryKey: ['preferencias-notificacao'],
    queryFn: () => preferenciasNotificacaoService.buscar(),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdatePreferenciaNotificacaoDto) =>
      preferenciasNotificacaoService.atualizar(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferencias-notificacao'] });
      toast({
        title: 'Sucesso',
        description: 'Preferências atualizadas com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar preferências',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dto: UpdatePreferenciaNotificacaoDto = {
      emailAtivo: formData.get('emailAtivo') === 'true',
      sistemaAtivo: formData.get('sistemaAtivo') === 'true',
      pushAtivo: formData.get('pushAtivo') === 'true',
      lembrete3Dias: formData.get('lembrete3Dias') === 'true',
      lembrete1Dia: formData.get('lembrete1Dia') === 'true',
      lembreteHoje: formData.get('lembreteHoje') === 'true',
      lembreteVencido: formData.get('lembreteVencido') === 'true',
      horarioInicio: formData.get('horarioInicio') as string,
      horarioFim: formData.get('horarioFim') as string,
      diasSemana: formData.getAll('diasSemana') as string[],
      notificarPrazos: formData.get('notificarPrazos') === 'true',
      notificarHistorico: formData.get('notificarHistorico') === 'true',
      notificarComentarios: formData.get('notificarComentarios') === 'true',
      notificarStatus: formData.get('notificarStatus') === 'true',
      resumoDiario: formData.get('resumoDiario') === 'true',
      resumoSemanal: formData.get('resumoSemanal') === 'true',
      diaResumoSemanal: formData.get('diaResumoSemanal') as string,
      horarioResumoSemanal: formData.get('horarioResumoSemanal') as string,
    };

    updateMutation.mutate(dto);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-destructive font-medium">
                Erro ao carregar preferências
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['preferencias-notificacao'] })}
                variant="outline"
                size="sm"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!preferencias) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma preferência encontrada
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gerenciador de Push Notifications */}
      <PushNotificationManager />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Preferências de Notificação</CardTitle>
          </div>
          <CardDescription>
            Configure como e quando você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Canais de Notificação */}
            <Card className="border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Canais de Notificação
                </CardTitle>
                <CardDescription className="text-xs">
                  Escolha por onde você deseja receber as notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailAtivo">Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações via e-mail
                    </p>
                  </div>
                  <input
                    type="hidden"
                    name="emailAtivo"
                    value={preferencias.emailAtivo ? 'true' : 'false'}
                  />
                  <Switch
                    id="emailAtivo"
                    defaultChecked={preferencias.emailAtivo}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="emailAtivo"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sistemaAtivo">Notificações no Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações dentro do sistema
                    </p>
                  </div>
                  <input
                    type="hidden"
                    name="sistemaAtivo"
                    value={preferencias.sistemaAtivo ? 'true' : 'false'}
                  />
                  <Switch
                    id="sistemaAtivo"
                    defaultChecked={preferencias.sistemaAtivo}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="sistemaAtivo"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushAtivo">Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações push no navegador
                    </p>
                  </div>
                  <input
                    type="hidden"
                    name="pushAtivo"
                    value={preferencias.pushAtivo ? 'true' : 'false'}
                  />
                  <Switch
                    id="pushAtivo"
                    defaultChecked={preferencias.pushAtivo}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="pushAtivo"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Frequência de Lembretes */}
            <Card className="border-2 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Frequência de Lembretes
                </CardTitle>
                <CardDescription className="text-xs">
                  Quando você deseja ser lembrado sobre prazos de ações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lembrete3Dias">3 dias antes do vencimento</Label>
                  <input
                    type="hidden"
                    name="lembrete3Dias"
                    value={preferencias.lembrete3Dias ? 'true' : 'false'}
                  />
                  <Switch
                    id="lembrete3Dias"
                    defaultChecked={preferencias.lembrete3Dias}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="lembrete3Dias"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lembrete1Dia">1 dia antes do vencimento</Label>
                  <input
                    type="hidden"
                    name="lembrete1Dia"
                    value={preferencias.lembrete1Dia ? 'true' : 'false'}
                  />
                  <Switch
                    id="lembrete1Dia"
                    defaultChecked={preferencias.lembrete1Dia}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="lembrete1Dia"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lembreteHoje">No dia do vencimento</Label>
                  <input
                    type="hidden"
                    name="lembreteHoje"
                    value={preferencias.lembreteHoje ? 'true' : 'false'}
                  />
                  <Switch
                    id="lembreteHoje"
                    defaultChecked={preferencias.lembreteHoje}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="lembreteHoje"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lembreteVencido">Após o vencimento</Label>
                  <input
                    type="hidden"
                    name="lembreteVencido"
                    value={preferencias.lembreteVencido ? 'true' : 'false'}
                  />
                  <Switch
                    id="lembreteVencido"
                    defaultChecked={preferencias.lembreteVencido}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="lembreteVencido"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Horários de Notificação */}
            <Card className="border-2 border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Horários de Notificação
                </CardTitle>
                <CardDescription className="text-xs">
                  Período do dia em que você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horarioInicio">Horário Início</Label>
                    <Input
                      id="horarioInicio"
                      name="horarioInicio"
                      type="time"
                      defaultValue={preferencias.horarioInicio}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horarioFim">Horário Fim</Label>
                    <Input
                      id="horarioFim"
                      name="horarioFim"
                      type="time"
                      defaultValue={preferencias.horarioFim}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dias da Semana */}
            <Card className="border-2 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Dias da Semana
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione os dias em que você deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`dia-${dia.value}`}
                        name="diasSemana"
                        value={dia.value}
                        defaultChecked={preferencias.diasSemana.includes(dia.value)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`dia-${dia.value}`} className="cursor-pointer">
                        {dia.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Eventos */}
            <Card className="border-2 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Tipos de Eventos
                </CardTitle>
                <CardDescription className="text-xs">
                  Escolha quais tipos de eventos devem gerar notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificarPrazos">Notificar sobre Prazos</Label>
                  <input
                    type="hidden"
                    name="notificarPrazos"
                    value={preferencias.notificarPrazos ? 'true' : 'false'}
                  />
                  <Switch
                    id="notificarPrazos"
                    defaultChecked={preferencias.notificarPrazos}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="notificarPrazos"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notificarHistorico">Notificar sobre Histórico</Label>
                  <input
                    type="hidden"
                    name="notificarHistorico"
                    value={preferencias.notificarHistorico ? 'true' : 'false'}
                  />
                  <Switch
                    id="notificarHistorico"
                    defaultChecked={preferencias.notificarHistorico}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="notificarHistorico"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notificarComentarios">Notificar sobre Comentários</Label>
                  <input
                    type="hidden"
                    name="notificarComentarios"
                    value={preferencias.notificarComentarios ? 'true' : 'false'}
                  />
                  <Switch
                    id="notificarComentarios"
                    defaultChecked={preferencias.notificarComentarios}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="notificarComentarios"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notificarStatus">Notificar sobre Mudanças de Status</Label>
                  <input
                    type="hidden"
                    name="notificarStatus"
                    value={preferencias.notificarStatus ? 'true' : 'false'}
                  />
                  <Switch
                    id="notificarStatus"
                    defaultChecked={preferencias.notificarStatus}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="notificarStatus"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumos */}
            <Card className="border-2 border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Resumos
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure resumos periódicos de atividades e notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                  <Label htmlFor="resumoDiario">Resumo Diário</Label>
                  <input
                    type="hidden"
                    name="resumoDiario"
                    value={preferencias.resumoDiario ? 'true' : 'false'}
                  />
                  <Switch
                    id="resumoDiario"
                    defaultChecked={preferencias.resumoDiario}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="resumoDiario"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="resumoSemanal">Resumo Semanal</Label>
                  <input
                    type="hidden"
                    name="resumoSemanal"
                    value={preferencias.resumoSemanal ? 'true' : 'false'}
                  />
                  <Switch
                    id="resumoSemanal"
                    defaultChecked={preferencias.resumoSemanal}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector(
                        'input[name="resumoSemanal"]',
                      ) as HTMLInputElement;
                      if (input) input.value = checked ? 'true' : 'false';
                    }}
                  />
                </div>

                {preferencias.resumoSemanal && (
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <div className="space-y-2">
                      <Label htmlFor="diaResumoSemanal">Dia da Semana</Label>
                      <input
                        type="hidden"
                        name="diaResumoSemanal"
                        id="diaResumoSemanal-hidden"
                        defaultValue={preferencias.diaResumoSemanal}
                      />
                      <Select
                        defaultValue={preferencias.diaResumoSemanal}
                        onValueChange={(value) => {
                          const input = document.getElementById(
                            'diaResumoSemanal-hidden',
                          ) as HTMLInputElement;
                          if (input) input.value = value;
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAS_SEMANA.map((dia) => (
                            <SelectItem key={dia.value} value={dia.value}>
                              {dia.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horarioResumoSemanal">Horário</Label>
                      <Input
                        id="horarioResumoSemanal"
                        name="horarioResumoSemanal"
                        type="time"
                        defaultValue={preferencias.horarioResumoSemanal}
                      />
                    </div>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Preferências'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

