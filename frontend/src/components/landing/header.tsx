"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const Logo = () => (
    <Link href="/" className="flex items-center gap-2" aria-label="Página Inicial">
      <div className="relative h-14 w-14 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-700/50">
        <Image
          src="/minha-logo.png"
          alt="Logo"
          width={56}
          height={56}
          className="h-full w-full object-contain"
        />
      </div>
      <span className="font-bold text-xl text-primary font-headline">Rede União</span>
    </Link>
);

export function Header() {
  const navLinks = [
    { href: "#sobre", label: "Sobre Nós" },
    { href: "#vantagens", label: "Vantagens" },
    { href: "#fornecedores", label: "Fornecedores" },
    { href: "#contato", label: "Contato" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-foreground transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle - visível em todas as telas */}
          <ThemeToggle />
          {/* Botão Login - visível em todas as telas */}
          <Button variant="outline" size="sm" asChild className="md:size-default">
            <Link href="/login">Login</Link>
          </Button>
          {/* Outros botões - apenas desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Button asChild>
              <Link href="#contato">Fale Conosco</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

