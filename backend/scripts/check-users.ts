import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.usuario.findMany({
    select: {
      id: true,
      email: true,
      nome: true,
      roles: true,
      empresaId: true,
      createdAt: true,
    },
  });

  console.log(`\nTotal de usuários encontrados: ${users.length}\n`);

  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado no banco de dados.');
    console.log('\nPara criar um usuário, execute:');
    console.log('  npm run create-user <email> <senha> <nome>\n');
    console.log('Exemplo:');
    console.log('  npm run create-user admin@empresa.com.br admin123 "Administrador"\n');
  } else {
    console.log('Usuários cadastrados:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.nome} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Roles: ${user.roles.join(', ')}`);
      console.log(`   Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
    });
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

