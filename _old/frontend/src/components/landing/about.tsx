"use client";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export function About() {
  return (
    <section id="sobre" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 max-w-4xl mx-auto">
            <div className="inline-block rounded-lg bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
              Sobre Nós
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-primary">
              Uma rede construída sobre confiança e colaboração.
            </h2>
        </div>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex justify-center order-last lg:order-first">
                <Card className="w-full max-w-md overflow-hidden shadow-2xl rounded-xl bg-background text-foreground">
                  <CardContent className="p-0">
                    <Image
                      alt="Membros da Rede União em uma reunião de negócios"
                      className="mx-auto aspect-square object-cover"
                      height="600"
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop&crop=center"
                      width="600"
                      data-ai-hint="business meeting"
                      loading="lazy"
                      quality={75}
                    />
                  </CardContent>
                </Card>
            </div>
            <div className="space-y-4 text-left">
                <p className="max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  A REDE UNIÃO nasceu da visão de fortalecer pequenos e médios empresários através do associativismo. Acreditamos que, juntos, somos mais fortes, capazes de negociar melhores condições com fornecedores, criar estratégias de marketing de impacto e oferecer uma experiência de compra superior aos nossos clientes.
                </p>
                <p className="max-w-[600px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nossos valores são a transparência, o compromisso com o sucesso do associado e a inovação constante.
                </p>
            </div>
        </div>
      </div>
    </section>
  );
}

