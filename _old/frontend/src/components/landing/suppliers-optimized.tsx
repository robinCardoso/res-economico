"use client"
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

type Supplier = {
  id: string;
  name: string;
  logoUrl: string | null;
};

// Função para buscar fornecedores (fora do componente)
async function fetchSuppliers(): Promise<Supplier[]> {
  const response = await fetch('/api/public/suppliers');
  
  if (!response.ok) {
    return [];
  }
  
  const result = await response.json();

  if (!result.success || !result.suppliers?.length) {
    return [];
  }

  // Filtrar apenas fornecedores com logo
  return result.suppliers.filter((s: Supplier) => s.logoUrl);
}

export function Suppliers() {
  // Query com cache
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
    staleTime: 30 * 60 * 1000, // Cache por 30 minutos (fornecedores mudam raramente)
    gcTime: 60 * 60 * 1000, // Manter em cache por 1 hora
  });

  // Não renderizar se não houver fornecedores
  if (!isLoading && suppliers.length === 0) {
    return null; 
  }
  
  // Duplicar fornecedores para animação infinita
  const displaySuppliers = [...suppliers, ...suppliers, ...suppliers, ...suppliers];

  return (
    <section id="fornecedores" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-4xl mx-auto">
          <div className="inline-block rounded-lg bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
            Nossos Parceiros
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-primary">
            Fornecedores Homologados
          </h2>
          <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Trabalhamos com as melhores marcas para garantir a qualidade e a variedade que seus clientes merecem.
          </p>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="animate-pulse flex space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div 
            className="mt-12 w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]"
          >
            <ul 
              className="flex items-center animate-infinite-scroll"
            >
              {displaySuppliers.map((supplier, index) => (
                <li key={`${supplier.id}-${index}`} className="mx-8 flex-shrink-0">
                  <Image
                    src={supplier.logoUrl!}
                    alt={supplier.name}
                    width={150}
                    height={75}
                    className="object-contain aspect-[2/1] max-w-none"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

