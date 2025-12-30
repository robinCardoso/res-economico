"use client";

export const dynamic = 'force-dynamic';

// Componentes de landing
const Header = () => (
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
    <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="relative h-12 w-16 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200/50 dark:bg-white dark:ring-1 dark:ring-border">
          <img
            src="/minha-logo.png"
            alt="Logo"
            width={64}
            height={48}
            className="h-full w-full object-contain"
          />
        </div>
        <span className="font-bold text-xl text-primary font-headline">Rede União</span>
      </div>
      <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
        <a href="#sobre" className="text-foreground transition-colors hover:text-primary">
          Sobre Nós
        </a>
        <a href="#vantagens" className="text-foreground transition-colors hover:text-primary">
          Vantagens
        </a>
        <a href="#fornecedores" className="text-foreground transition-colors hover:text-primary">
          Fornecedores
        </a>
        <a href="#contato" className="text-foreground transition-colors hover:text-primary">
          Contato
        </a>
      </nav>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
          <a href="/login">Login</a>
        </button>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-center overflow-hidden">
    <div className="relative z-10 container max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
      <h1 className="pb-4 font-headline text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
        A união que <span className="text-accent">fortalece</span> o seu negócio.
      </h1>
      <p className="mt-8 max-w-2xl mx-auto text-lg leading-relaxed text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
        Junte-se à REDE UNIÃO e tenha acesso a vantagens exclusivas, marketing inovador e uma rede de fornecedores de ponta para impulsionar suas vendas e expandir seu negócio.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <a href="#sobre">
            Saiba Mais <span className="ml-2">→</span>
          </a>
        </button>
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          <a href="#fornecedores">Nossos Parceiros</a>
        </button>
      </div>
    </div>
  </section>
);

const About = () => (
  <section id="sobre" className="w-full py-20">
    <div className="container max-w-4xl px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Sobre a Rede União Nacional</h2>
        <p className="text-lg text-muted-foreground">
          Uma rede de negócios que une forças para fortalecer e desenvolver o comércio varejista.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h3 className="text-xl font-semibold mb-4">Nossa História</h3>
          <p className="mb-4 text-muted-foreground">
            Fundada com o propósito de unir comerciantes independentes, a Rede União Nacional nasceu da necessidade de 
            enfrentar os desafios do varejo moderno com força coletiva.
          </p>
          <p className="text-muted-foreground">
            Hoje, somos uma referência no setor, oferecendo soluções completas de gestão, compras coletivas e 
            suporte especializado para impulsionar o crescimento dos nossos associados.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Nossa Missão</h3>
          <p className="mb-4 text-muted-foreground">
            Promover a união entre comerciantes independentes para fortalecer a competitividade no mercado varejista.
          </p>
          <p className="text-muted-foreground">
            Através de parcerias estratégicas, soluções tecnológicas e suporte especializado, ajudamos nossos associados 
            a crescerem de forma sustentável.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Advantages = () => (
  <section id="vantagens" className="w-full py-20 bg-muted">
    <div className="container max-w-6xl px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Vantagens da Nossa Rede</h2>
        <p className="text-lg text-muted-foreground">
          Benefícios exclusivos para associados que fazem a diferença no seu negócio
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-background rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-primary font-bold">1</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Compras Coletivas</h3>
          <p className="text-muted-foreground">
            Negociação de melhores condições de compra com fornecedores, garantindo economia e qualidade.
          </p>
        </div>
        <div className="bg-background rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-primary font-bold">2</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Marketing Compartilhado</h3>
          <p className="text-muted-foreground">
            Campanhas publicitárias em conjunto para aumentar a visibilidade e atrair mais clientes.
          </p>
        </div>
        <div className="bg-background rounded-lg p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-primary font-bold">3</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Suporte Técnico</h3>
          <p className="text-muted-foreground">
            Assistência especializada para otimizar a gestão e impulsionar os resultados do seu negócio.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Suppliers = () => (
  <section id="fornecedores" className="w-full py-20">
    <div className="container max-w-6xl px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Nossos Fornecedores Parceiros</h2>
        <p className="text-lg text-muted-foreground">
          Empresas de renome que oferecem os melhores produtos e serviços para o seu negócio
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {['Fornecedor A', 'Fornecedor B', 'Fornecedor C', 'Fornecedor D', 'Fornecedor E', 'Fornecedor F', 'Fornecedor G', 'Fornecedor H'].map((supplier, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-primary font-bold">{supplier.split(' ')[1]}</span>
            </div>
            <h3 className="font-medium">{supplier}</h3>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Contact = () => (
  <section id="contato" className="w-full py-20 bg-muted">
    <div className="container max-w-4xl px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Entre em Contato</h2>
        <p className="text-lg text-muted-foreground">
          Estamos prontos para ajudar você a fazer parte da nossa rede
        </p>
      </div>
      <div className="bg-background rounded-lg p-8 shadow-sm">
        <form className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Nome</label>
              <input
                type="text"
                id="name"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                id="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2">Assunto</label>
            <input
              type="text"
              id="subject"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Assunto da mensagem"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">Mensagem</label>
            <textarea
              id="message"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Sua mensagem"
            ></textarea>
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Enviar Mensagem
          </button>
        </form>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="w-full border-t bg-background">
    <div className="container max-w-6xl px-4 py-12">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Rede União Nacional</h3>
          <p className="text-sm text-muted-foreground">
            Fortalecendo o comércio varejista através da união e colaboração entre comerciantes independentes.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-4">Links Rápidos</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#sobre" className="hover:text-primary">Sobre Nós</a></li>
            <li><a href="#vantagens" className="hover:text-primary">Vantagens</a></li>
            <li><a href="#fornecedores" className="hover:text-primary">Fornecedores</a></li>
            <li><a href="#contato" className="hover:text-primary">Contato</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-4">Contato</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>contato@redeuniaonacional.com.br</li>
            <li>(11) 1234-5678</li>
            <li>São Paulo, SP</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-4">Redes Sociais</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Facebook</li>
            <li>Instagram</li>
            <li>LinkedIn</li>
          </ul>
        </div>
      </div>
      <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Rede União Nacional. Todos os direitos reservados.</p>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-secondary">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <Advantages />
        <Suppliers />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}