import { PrismaClient, TipoEmpresa } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    // Create actual companies from backup
    const empresas: Array<{
      cnpj: string;
      razaoSocial: string;
      tipo: TipoEmpresa;
      filial?: string;
      uf: string;
    }> = [
      {
        cnpj: '11139968000209',
        razaoSocial: 'REDE UNIAO - RS',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 02',
        uf: 'RS',
      },
      {
        cnpj: '11139968000110',
        razaoSocial: 'REDE UNIAO - SC',
        tipo: 'MATRIZ' as TipoEmpresa,
        filial: 'Matriz',
        uf: 'SC',
      },
      {
        cnpj: '11139968000381',
        razaoSocial: 'REDE UNIAO - PR',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 03',
        uf: 'PR',
      },
      {
        cnpj: '11139968000624',
        razaoSocial: 'REDE UNIAO - SP',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 06',
        uf: 'SP',
      },
      {
        cnpj: '11139968000462',
        razaoSocial: 'REDE UNIAO - MT',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 04',
        uf: 'MT',
      },
      {
        cnpj: '11139968000543',
        razaoSocial: 'REDE UNIAO - MG',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 05',
        uf: 'MG',
      },
      {
        cnpj: '11139968000705',
        razaoSocial: 'REDE UNIAO - GO',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 07',
        uf: 'GO',
      },
      {
        cnpj: '11139968000896',
        razaoSocial: 'REDE UNIAO - PE',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 08',
        uf: 'PE',
      },
      {
        cnpj: '11139968000977',
        razaoSocial: 'REDE UNIAO - RN',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 09',
        uf: 'RN',
      },
      {
        cnpj: '11139968001191',
        razaoSocial: 'REDE UNIAO - ES',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 11',
        uf: 'ES',
      },
      {
        cnpj: '11139968001272',
        razaoSocial: 'REDE UNIAO - BA',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 12',
        uf: 'BA',
      },
      {
        cnpj: '11139968001353',
        razaoSocial: 'REDE UNIAO - MA',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 13',
        uf: 'MA',
      },
      {
        cnpj: '11139968001434',
        razaoSocial: 'REDE UNIAO - RJ',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 14',
        uf: 'RJ',
      },
      {
        cnpj: '11139968001515',
        razaoSocial: 'REDE UNIAO - RO',
        tipo: 'FILIAL' as TipoEmpresa,
        filial: 'Filial 15',
        uf: 'RO',
      },
    ];

    // Use the main SC company as the primary
    const empresa = empresas.find(emp => emp.cnpj === '11139968000110')!;
    const empresaId = (await prisma.empresa.upsert({
      where: { cnpj: empresa.cnpj },
      update: {},
      create: empresa,
    })).id;

    console.log(`✓ Main company restored: ${empresa.razaoSocial}`);

    // Create additional companies
    for (const empresaData of empresas.filter(e => e.cnpj !== '11139968000110')) {
      const emp = await prisma.empresa.upsert({
        where: { cnpj: empresaData.cnpj },
        update: {},
        create: empresaData,
      });
      console.log(`✓ Company created: ${emp.razaoSocial}`);
    }

    // Create main admin user
    const senhaHash = await bcrypt.hash('Admin@123456', 10);
    const adminUser = await prisma.usuario.upsert({
      where: { email: 'admin@painel.com.br' },
      update: { ativo: true },
      create: {
        email: 'admin@painel.com.br',
        senha: senhaHash,
        nome: 'Administrador do Sistema',
        roles: ['admin', 'user'],
        empresaId: empresaId,
        ativo: true,
      },
    });

    console.log(`✓ Admin user created: ${adminUser.email} (password: Admin@123456)`);

    // Create additional system users
    const usuarios = [
      {
        email: 'analista@painel.com.br',
        nome: 'Analista Financeiro',
        roles: ['analista', 'user'],
        senha: 'Analista@123456',
      },
      {
        email: 'gerente@painel.com.br',
        nome: 'Gerente de Projetos',
        roles: ['gerente', 'user'],
        senha: 'Gerente@123456',
      },
      {
        email: 'diretor@painel.com.br',
        nome: 'Diretor Executivo',
        roles: ['diretor', 'admin', 'user'],
        senha: 'Diretor@123456',
      },
    ];

    for (const userData of usuarios) {
      const senhaHash = await bcrypt.hash(userData.senha, 10);
      const user = await prisma.usuario.upsert({
        where: { email: userData.email },
        update: { ativo: true },
        create: {
          email: userData.email,
          senha: senhaHash,
          nome: userData.nome,
          roles: userData.roles,
          empresaId: empresaId,
          ativo: true,
        },
      });

      console.log(`✓ User created: ${user.email} (password: ${userData.senha})`);
    }

    console.log('\n✓ Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
