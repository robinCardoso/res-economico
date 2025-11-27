"use client";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Megaphone, BadgePercent, Users, ShieldCheck } from "lucide-react";

const advantages = [
  {
    icon: <Megaphone className="h-10 w-10 text-primary" />,
    title: "Marketing e Visibilidade",
    description: "Ações de marketing conjuntas, campanhas sazonais e materiais de ponto de venda que aumentam o fluxo de clientes e fortalecem sua marca.",
  },
  {
    icon: <BadgePercent className="h-10 w-10 text-primary" />,
    title: "Negociações Exclusivas",
    description: "Acesso a descontos e condições especiais com os maiores fornecedores do mercado, otimizando suas margens e competitividade.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Networking e Troca",
    description: "Participe de uma comunidade de empresários, troque experiências, compartilhe boas práticas e encontre soluções inovadoras em conjunto.",
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Credibilidade e Confiança",
    description: "Faça parte de uma marca reconhecida no mercado, que transmite confiança e segurança para os consumidores, atraindo mais clientes.",
  },
];

export function Advantages() {
  return (
    <section id="vantagens" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="inline-block rounded-lg bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
            Vantagens
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
            Por que se juntar à Rede União?
          </h2>
          <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Oferecemos um ecossistema completo de benefícios pensados para acelerar o crescimento e a lucratividade do seu negócio.
          </p>
        </div>
        <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-4 mt-12">
          {advantages.map((advantage, index) => (
            <Card key={index} className="text-left hover:shadow-lg transition-shadow bg-background border-border">
              <CardHeader className="flex flex-col items-start gap-4">
                {advantage.icon}
                <div className="space-y-1">
                    <CardTitle className="text-primary">{advantage.title}</CardTitle>
                    <CardDescription className="text-foreground/80">{advantage.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

