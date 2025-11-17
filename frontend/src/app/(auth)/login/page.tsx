'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authService, type LoginDto } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

const LoginPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>();

  const onSubmit = async (data: LoginDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(data);
      setAuth(response.user, response.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      const error = err as { 
        response?: { data?: { message?: string; error?: string } }; 
        request?: unknown;
        message?: string;
      };
      
      if (error.response) {
        // Erro com resposta do servidor
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.request) {
        // Requisição foi feita mas não houve resposta
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3000';
      } else {
        // Erro ao configurar a requisição
        errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-white px-6 py-6">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <Image
              src="/minha-logo.png"
              alt="Logo da empresa"
              width={80}
              height={80}
              className="h-16 w-16 rounded-lg object-contain"
              priority
            />
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-sky-600">ResEco</div>
          <h1 className="text-xl font-semibold text-slate-900">Acesse sua conta</h1>
          <p className="text-xs text-slate-600">
            Sistema de resultado econômico integrado à contabilidade.
          </p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-lg"
        >
          {error && (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-2 py-1.5 text-xs text-rose-700">
              {error}
            </div>
          )}
          <div className="space-y-0.5">
            <label htmlFor="email" className="text-xs font-medium text-slate-700">
              E-mail profissional
            </label>
            <input
              id="email"
              type="email"
              {...register('email', {
                required: 'E-mail é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'E-mail inválido',
                },
              })}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="contabilidade@empresa.com.br"
            />
            {errors.email && (
              <p className="text-[10px] text-rose-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-0.5">
            <label htmlFor="password" className="text-xs font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter no mínimo 6 caracteres',
                },
              })}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-[10px] text-rose-600">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-center text-[10px] text-slate-500">
          Precisa de acesso?{' '}
          <Link href="mailto:contato@redeuniaonacional.com.br" className="text-sky-600 hover:text-sky-500">
            Fale com o TI
          </Link>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;

