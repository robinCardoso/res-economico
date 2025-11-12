import Image from 'next/image';
import Link from 'next/link';

const LoginPage = () => {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/minha-logo.png"
              alt="Logo da empresa"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg object-contain shadow-md"
              priority
            />
          </div>
          <div className="text-sm uppercase tracking-[0.4em] text-sky-400">ResEco</div>
          <h1 className="mt-4 text-2xl font-semibold">Acesse sua conta</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sistema de resultado econômico integrado à contabilidade.
          </p>
        </div>
        <form className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              E-mail profissional
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="contabilidade@empresa.com.br"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            Entrar
          </button>
        </form>
        <div className="text-center text-xs text-slate-500">
          Precisa de acesso?{' '}
          <Link href="mailto:ti@empresa.com.br" className="text-sky-400 hover:text-sky-300">
            Fale com o TI
          </Link>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;

