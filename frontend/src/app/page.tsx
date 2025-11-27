"use client";

export const dynamic = 'force-dynamic';

import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { Advantages } from "@/components/landing/advantages";
import { Suppliers } from "@/components/landing/suppliers-optimized";
import { Contact } from "@/components/landing/contact";
import { Footer } from "@/components/landing/footer";

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
