import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cnpj = process.argv[2];
  const razaoSocial = process.argv[3];
  const nomeFantasia = process.argv[4];

  if (!cnpj || !razaoSocial) {
    console.log('\n❌ Uso: npm run create-empresa <cnpj> <razaoSocial> [nomeFantasia]');
    console.log('\nExemplo:');
    console.log('  npm run create-empresa "12.345.678/0001-90" "Empresa Exemplo LTDA" "Nome Fantasia"\n');
    process.exit(1);
  }

  try {
    // Verificar se já existe empresa com este CNPJ
    const empresaExistente = await prisma.empresa.findUnique({
      where: { cnpj },
    });

    if (empresaExistente) {
      console.log(`\n⚠️  Empresa com CNPJ ${cnpj} já existe:\n`);
      console.log(`   ID: ${empresaExistente.id}`);
      console.log(`   Razão Social: ${empresaExistente.razaoSocial}`);
      console.log(`   CNPJ: ${empresaExistente.cnpj}\n`);
      return;
    }

    const empresa = await prisma.empresa.create({
      data: {
        cnpj: cnpj.replace(/\D/g, ''), // Remove formatação
        razaoSocial,
        nomeFantasia: nomeFantasia || null,
      },
    });

    console.log('\n✅ Empresa criada com sucesso!\n');
    console.log(`   ID: ${empresa.id}`);
    console.log(`   Razão Social: ${empresa.razaoSocial}`);
    console.log(`   Nome Fantasia: ${empresa.nomeFantasia || 'Não informado'}`);
    console.log(`   CNPJ: ${empresa.cnpj}\n`);
  } catch (error: any) {
    console.error('\n❌ Erro ao criar empresa:', error.message);
    process.exit(1);
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

