"use client";
import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";

const Logo = () => (
    <Link href="/" className="flex items-center gap-2" aria-label="Página Inicial">
      <span className="font-bold text-lg text-primary font-headline">Rede União Nacional</span>
    </Link>
);


export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-border/40 bg-background">
            <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start gap-4">
                    <Logo />
                    <p className="text-sm text-foreground/70 text-center md:text-left max-w-sm">
                        A união que fortalece o seu negócio.
                    </p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-4">
                    <div className="flex space-x-4">
                        <Link href="#" aria-label="Facebook" className="text-foreground/70 hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
                        <Link href="#" aria-label="Instagram" className="text-foreground/70 hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></Link>
                        <Link href="#" aria-label="LinkedIn" className="text-foreground/70 hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                    </div>
                    <p className="text-sm text-foreground/70">
                        &copy; {currentYear} Rede União. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}

