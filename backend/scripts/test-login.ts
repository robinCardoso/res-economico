import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'administrativo@redeuniaonacional.com.br';
  const password = 'Pcs775595';

  console.log(`\n🔍 Testando login para: ${email}\n`);

  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ Usuário não encontrado no banco de dados');
    process.exit(1);
  }

  console.log('✅ Usuário encontrado:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.nome}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Departamento: ${user.departamento || 'N/A'}`);
  console.log(`   Roles: ${user.roles.join(', ')}`);
  console.log(`   Hash da senha: ${user.senha.substring(0, 20)}...`);

  console.log('\n🔐 Verificando senha...');
  const isPasswordValid = await bcrypt.compare(password, user.senha);

  if (isPasswordValid) {
    console.log('✅ Senha está CORRETA!');
    console.log('\n💡 O problema pode ser:');
    console.log('   1. Backend não está rodando');
    console.log('   2. CORS não está configurado corretamente');
    console.log('   3. URL da API está incorreta no frontend');
    console.log('   4. Problema de rede/conexão');
  } else {
    console.log('❌ Senha está INCORRETA!');
    console.log('\n💡 A senha no banco pode ter sido criada com hash diferente.');
    console.log('   Vamos recriar o usuário com a senha correta...\n');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { id: user.id },
      data: { senha: hashedPassword },
    });
    
    console.log('✅ Senha atualizada! Tente fazer login novamente.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

