"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center text-center overflow-hidden">
      <div className="relative z-10 container max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
        <h1 className="pb-4 font-headline text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          A união que <span className="text-accent">fortalece</span> o seu negócio.
        </h1>
        <p className="mt-8 max-w-2xl mx-auto text-lg leading-relaxed text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
          Junte-se à REDE UNIÃO e tenha acesso a vantagens exclusivas, marketing inovador e uma rede de fornecedores de ponta para impulsionar suas vendas e expandir seu negócio.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <Button size="lg" asChild>
            <Link href="#sobre">
              Saiba Mais <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#fornecedores">Nossos Parceiros</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

