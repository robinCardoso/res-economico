import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@empresa.com.br';
  const password = process.argv[3] || 'admin123';
  const nome = process.argv[4] || 'Administrador';
  const departamentoStr = process.argv[5]?.toUpperCase() || 'FINANCEIRO';

  // Validar departamento
  const departamentosValidos = ['FINANCEIRO', 'COMPRAS', 'GESTOR', 'FATURAMENTO'];
  if (!departamentosValidos.includes(departamentoStr)) {
    console.error(`❌ Departamento inválido: ${departamentoStr}`);
    console.error(`Departamentos válidos: ${departamentosValidos.join(', ')}`);
    process.exit(1);
  }

  const departamento = departamentoStr as 'FINANCEIRO' | 'COMPRAS' | 'GESTOR' | 'FATURAMENTO';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.usuario.upsert({
    where: { email },
    update: {
      senha: hashedPassword,
      nome,
      departamento,
      roles: ['admin', 'user'],
    },
    create: {
      email,
      senha: hashedPassword,
      nome,
      departamento,
      roles: ['admin', 'user'],
    },
  });

  console.log('Usuário criado/atualizado:', {
    id: user.id,
    email: user.email,
    nome: user.nome,
    departamento: user.departamento,
    roles: user.roles,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

