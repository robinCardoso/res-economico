import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Script para restaurar dados de encoding do backup anterior à renomeação
 * 
 * Este script:
 * 1. Lê o backup SQL (formato COPY FROM stdin)
 * 2. Extrai os dados de nomeConta e classificacao das tabelas LinhaUpload e ContaCatalogo
 * 3. Atualiza apenas os registros que estão corrompidos no banco atual
 */
async function restaurarDadosEncoding() {
  console.log('\n🔧 Iniciando restauração de dados de encoding...\n');

  // Usar o backup mais recente (UTF-8) em vez do anterior (UTF-16)
  const backupPath = path.join(__dirname, '../../backup_antes_recriar_20251128_175807.sql');
  
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup não encontrado: ${backupPath}`);
    process.exit(1);
  }

  console.log(`📂 Lendo backup: ${backupPath}`);
  
  // Verificar encoding do arquivo pelos primeiros bytes
  const buffer = fs.readFileSync(backupPath);
  const bom = buffer.slice(0, 3);
  
  let backupContent: string;
  if (bom[0] === 0xFF && bom[1] === 0xFE) {
    // UTF-16 LE
    console.log('   📝 Arquivo detectado como UTF-16 LE');
    backupContent = buffer.toString('utf16le');
    // Remover BOM
    if (backupContent.charCodeAt(0) === 0xFEFF) {
      backupContent = backupContent.slice(1);
    }
  } else if (bom[0] === 0xEF && bom[1] === 0xBB && bom[2] === 0xBF) {
    // UTF-8 com BOM
    console.log('   📝 Arquivo detectado como UTF-8 com BOM');
    backupContent = buffer.toString('utf-8');
    backupContent = backupContent.slice(1); // Remover BOM
  } else {
    // UTF-8 sem BOM (padrão)
    console.log('   📝 Arquivo detectado como UTF-8 (sem BOM)');
    backupContent = buffer.toString('utf-8');
  }
  
  console.log(`   Tamanho do backup: ${backupContent.length} caracteres`);
  
  const temLinhaUpload = backupContent.includes('LinhaUpload');
  console.log(`   Contém 'LinhaUpload': ${temLinhaUpload}`);
  
  if (!temLinhaUpload) {
    console.error('❌ Não foi possível encontrar "LinhaUpload" no backup');
    process.exit(1);
  }

  // Extrair dados de LinhaUpload do backup (formato COPY FROM stdin)
  console.log('\n📊 Extraindo dados de LinhaUpload do backup...');
  
  // Encontrar a seção COPY para LinhaUpload
  let linhaUploadCopyStart = backupContent.indexOf('COPY public."LinhaUpload"');
  if (linhaUploadCopyStart === -1) {
    // Tentar busca alternativa sem aspas
    linhaUploadCopyStart = backupContent.indexOf('COPY public.LinhaUpload');
    if (linhaUploadCopyStart === -1) {
      // Buscar por qualquer ocorrência de LinhaUpload
      const linhas = backupContent.split('\n');
      for (let i = 0; i < Math.min(2000, linhas.length); i++) {
        if (linhas[i].includes('LinhaUpload') && linhas[i].includes('COPY')) {
          console.log(`   ⚠️ Linha encontrada na posição ${i}: ${linhas[i].substring(0, 100)}`);
          linhaUploadCopyStart = backupContent.indexOf(linhas[i]);
          break;
        }
      }
      if (linhaUploadCopyStart === -1) {
        console.error('❌ Não foi possível encontrar dados de LinhaUpload no backup');
        process.exit(1);
      }
    }
  }

  // Encontrar o final da seção COPY (termina com \.)
  let linhaUploadCopyEnd = backupContent.indexOf('\\.\n', linhaUploadCopyStart);
  if (linhaUploadCopyEnd === -1) {
    linhaUploadCopyEnd = backupContent.indexOf('\\.', linhaUploadCopyStart);
  }
  if (linhaUploadCopyEnd === -1) {
    console.error('❌ Não foi possível encontrar o final dos dados de LinhaUpload');
    process.exit(1);
  }

  // Extrair a linha de cabeçalho COPY para saber a ordem das colunas
  const headerSection = backupContent.substring(linhaUploadCopyStart, linhaUploadCopyStart + 500);
  let copyHeaderMatch = headerSection.match(/COPY\s+public\."LinhaUpload"\s+\(([^)]+)\)\s+FROM\s+stdin;/);
  if (!copyHeaderMatch) {
    // Tentar sem espaços extras
    copyHeaderMatch = headerSection.match(/COPY.*LinhaUpload.*\(([^)]+)\).*FROM.*stdin/);
    if (copyHeaderMatch) {
      console.log(`   ⚠️ Cabeçalho alternativo encontrado: ${copyHeaderMatch[0].substring(0, 150)}`);
    } else {
      console.error('❌ Não foi possível extrair cabeçalho COPY');
      console.error(`   Seção do cabeçalho: ${headerSection.substring(0, 300)}`);
      process.exit(1);
    }
  }

  const colunas = copyHeaderMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
  const idIndex = colunas.indexOf('id');
  const nomeContaIndex = colunas.indexOf('nomeConta');
  const classificacaoIndex = colunas.indexOf('classificacao');

  if (idIndex === -1 || nomeContaIndex === -1 || classificacaoIndex === -1) {
    console.error('❌ Colunas necessárias não encontradas no cabeçalho');
    console.error(`   Colunas encontradas: ${colunas.join(', ')}`);
    process.exit(1);
  }

  // Extrair as linhas de dados (entre o cabeçalho COPY e o \.)
  const dadosSection = backupContent.substring(
    backupContent.indexOf('\n', linhaUploadCopyStart) + 1,
    linhaUploadCopyEnd
  );

  // Parsear linhas (separadas por \n, campos separados por \t)
  const linhas = dadosSection.split('\n').filter(l => l.trim() && !l.startsWith('\\'));
  
  console.log(`   Encontradas ${linhas.length} linhas de dados`);

  // Criar um mapa de ID -> { nomeConta, classificacao } do backup
  const dadosBackup = new Map<string, { nomeConta: string; classificacao: string }>();

  for (const linha of linhas) {
    const campos = linha.split('\t');
    
    if (campos.length < Math.max(idIndex, nomeContaIndex, classificacaoIndex) + 1) {
      continue; // Linha incompleta
    }

    const id = campos[idIndex]?.trim();
    const nomeConta = campos[nomeContaIndex]?.trim() || '';
    const classificacao = campos[classificacaoIndex]?.trim() || '';

    // Tratar valores NULL (\N)
    const nomeContaFinal = nomeConta === '\\N' ? '' : nomeConta;
    const classificacaoFinal = classificacao === '\\N' ? '' : classificacao;

    if (id && (nomeContaFinal || classificacaoFinal)) {
      dadosBackup.set(id, { 
        nomeConta: nomeContaFinal, 
        classificacao: classificacaoFinal 
      });
    }
  }

  console.log(`   ✅ Extraídos ${dadosBackup.size} registros do backup`);

  if (dadosBackup.size === 0) {
    console.error('❌ Não foi possível extrair dados do backup');
    process.exit(1);
  }

  // Buscar linhas corrompidas no banco atual
  console.log('\n🔍 Buscando linhas corrompidas no banco atual...');
  const linhasCorrompidas = await prisma.linhaUpload.findMany({
    where: {
      OR: [
        { nomeConta: { contains: '??' } },
        { nomeConta: { contains: 'Ã' } },
        { classificacao: { contains: '??' } },
      ],
    },
    select: {
      id: true,
      nomeConta: true,
      classificacao: true,
    },
  });

  console.log(`   Encontradas ${linhasCorrompidas.length} linhas corrompidas`);

  if (linhasCorrompidas.length === 0) {
    console.log('✅ Nenhuma linha corrompida encontrada!');
    
    // Verificar ContaCatalogo também
    console.log('\n🔍 Verificando ContaCatalogo...');
    const contasCorrompidas = await prisma.contaCatalogo.findMany({
      where: {
        OR: [
          { nomeConta: { contains: '??' } },
          { nomeConta: { contains: 'Ã' } },
        ],
      },
      select: {
        id: true,
        nomeConta: true,
        classificacao: true,
      },
    });

    if (contasCorrompidas.length > 0) {
      console.log(`   Encontradas ${contasCorrompidas.length} contas corrompidas`);
      await restaurarContaCatalogo(backupContent, contasCorrompidas);
    } else {
      console.log('✅ Nenhuma conta corrompida encontrada!');
    }
    
    return;
  }

  // Restaurar dados do backup
  console.log('\n🔄 Restaurando dados do backup...');
  let restauradas = 0;
  let naoEncontradas = 0;
  let semAlteracao = 0;

  const batchSize = 100;
  for (let i = 0; i < linhasCorrompidas.length; i += batchSize) {
    const batch = linhasCorrompidas.slice(i, i + batchSize);

    for (const linha of batch) {
      const dadosBackupLinha = dadosBackup.get(linha.id);

      if (dadosBackupLinha) {
        try {
          const updateData: { nomeConta?: string; classificacao?: string } = {};
          
          // Função para contar caracteres corrompidos
          const contarCorrupcao = (str: string): number => {
            return (str.match(/\?\?/g) || []).length + (str.match(/Ã/g) || []).length;
          };
          
          // Atualizar nomeConta se o backup for melhor (menos corrupção) ou se o atual tiver '??'
          if (dadosBackupLinha.nomeConta && dadosBackupLinha.nomeConta !== linha.nomeConta) {
            const corrupcaoAtual = contarCorrupcao(linha.nomeConta || '');
            const corrupcaoBackup = contarCorrupcao(dadosBackupLinha.nomeConta);
            
            // Atualizar se: backup não tem '??' OU backup tem menos corrupção que o atual
            if (corrupcaoBackup === 0 || corrupcaoBackup < corrupcaoAtual) {
              updateData.nomeConta = dadosBackupLinha.nomeConta;
            }
          }

          // Mesma lógica para classificacao
          if (dadosBackupLinha.classificacao && dadosBackupLinha.classificacao !== linha.classificacao) {
            const corrupcaoAtual = contarCorrupcao(linha.classificacao || '');
            const corrupcaoBackup = contarCorrupcao(dadosBackupLinha.classificacao);
            
            if (corrupcaoBackup === 0 || corrupcaoBackup < corrupcaoAtual) {
              updateData.classificacao = dadosBackupLinha.classificacao;
            }
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.linhaUpload.update({
              where: { id: linha.id },
              data: updateData,
            });
            restauradas++;

            if (restauradas <= 5) {
              console.log(`   ✅ Restaurado (ID: ${linha.id.substring(0, 8)}...):`);
              if (updateData.nomeConta) {
                console.log(`      Nome: "${linha.nomeConta?.substring(0, 40)}" → "${updateData.nomeConta.substring(0, 40)}"`);
              }
            }
          } else {
            semAlteracao++;
          }
        } catch (error) {
          console.error(`   ❌ Erro ao restaurar linha ${linha.id}:`, error);
        }
      } else {
        naoEncontradas++;
      }
    }

    const processadas = Math.min(i + batchSize, linhasCorrompidas.length);
    if (processadas % 500 === 0 || processadas === linhasCorrompidas.length) {
      console.log(`   📊 Processadas: ${processadas}/${linhasCorrompidas.length} (${Math.round((processadas / linhasCorrompidas.length) * 100)}%)`);
    }
  }

  console.log(`\n✅ Restauração de LinhaUpload concluída!`);
  console.log(`   ✅ Linhas restauradas: ${restauradas}`);
  console.log(`   ⚠️ Linhas não encontradas no backup: ${naoEncontradas}`);
  console.log(`   ⚠️ Linhas sem alteração necessária: ${semAlteracao}`);

  // Restaurar ContaCatalogo também
  console.log('\n🔍 Verificando ContaCatalogo...');
  const contasCorrompidas = await prisma.contaCatalogo.findMany({
    where: {
      OR: [
        { nomeConta: { contains: '??' } },
        { nomeConta: { contains: 'Ã' } },
      ],
    },
    select: {
      id: true,
      nomeConta: true,
      classificacao: true,
    },
  });

  if (contasCorrompidas.length > 0) {
    console.log(`   Encontradas ${contasCorrompidas.length} contas corrompidas`);
    await restaurarContaCatalogo(backupContent, contasCorrompidas);
  } else {
    console.log('✅ Nenhuma conta corrompida encontrada!');
  }
}

async function restaurarContaCatalogo(
  backupContent: string,
  contasCorrompidas: Array<{ id: string; nomeConta: string | null; classificacao: string }>
) {
  console.log('\n📊 Extraindo dados de ContaCatalogo do backup...');
  
  // Encontrar a seção COPY para ContaCatalogo
  const contaCatalogoCopyMatch = backupContent.match(/COPY\s+public\."ContaCatalogo"/);
  if (!contaCatalogoCopyMatch || !contaCatalogoCopyMatch.index) {
    console.error('❌ Não foi possível encontrar dados de ContaCatalogo no backup');
    return;
  }
  
  const contaCatalogoCopyStart = contaCatalogoCopyMatch.index;

  // Encontrar o final da seção COPY
  let contaCatalogoCopyEnd = backupContent.indexOf('\\.\n', contaCatalogoCopyStart);
  if (contaCatalogoCopyEnd === -1) {
    contaCatalogoCopyEnd = backupContent.indexOf('\\.', contaCatalogoCopyStart);
  }
  if (contaCatalogoCopyEnd === -1) {
    console.error('❌ Não foi possível encontrar o final dos dados de ContaCatalogo');
    return;
  }

  // Extrair cabeçalho
  const copyHeaderMatch = backupContent.substring(contaCatalogoCopyStart, contaCatalogoCopyStart + 200).match(/COPY public\."ContaCatalogo" \(([^)]+)\) FROM stdin;/);
  if (!copyHeaderMatch) {
    console.error('❌ Não foi possível extrair cabeçalho COPY de ContaCatalogo');
    return;
  }

  const colunas = copyHeaderMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
  const idIndex = colunas.indexOf('id');
  const nomeContaIndex = colunas.indexOf('nomeConta');
  const classificacaoIndex = colunas.indexOf('classificacao');

  if (idIndex === -1 || nomeContaIndex === -1 || classificacaoIndex === -1) {
    console.error('❌ Colunas necessárias não encontradas no cabeçalho de ContaCatalogo');
    return;
  }

  // Extrair linhas de dados
  const dadosSection = backupContent.substring(
    backupContent.indexOf('\n', contaCatalogoCopyStart) + 1,
    contaCatalogoCopyEnd
  );

  const linhas = dadosSection.split('\n').filter(l => l.trim() && !l.startsWith('\\'));
  console.log(`   Encontradas ${linhas.length} linhas de dados`);

  // Criar mapa de ID -> { nomeConta, classificacao }
  const dadosBackup = new Map<string, { nomeConta: string; classificacao: string }>();

  for (const linha of linhas) {
    const campos = linha.split('\t');
    
    if (campos.length < Math.max(idIndex, nomeContaIndex, classificacaoIndex) + 1) {
      continue;
    }

    const id = campos[idIndex]?.trim();
    const nomeConta = campos[nomeContaIndex]?.trim() || '';
    const classificacao = campos[classificacaoIndex]?.trim() || '';

    const nomeContaFinal = nomeConta === '\\N' ? '' : nomeConta;
    const classificacaoFinal = classificacao === '\\N' ? '' : classificacao;

    if (id && (nomeContaFinal || classificacaoFinal)) {
      dadosBackup.set(id, { 
        nomeConta: nomeContaFinal, 
        classificacao: classificacaoFinal 
      });
    }
  }

  console.log(`   ✅ Extraídos ${dadosBackup.size} registros do backup`);

  // Restaurar dados
  console.log('\n🔄 Restaurando ContaCatalogo do backup...');
  let restauradas = 0;
  let naoEncontradas = 0;
  let semAlteracao = 0;

  for (const conta of contasCorrompidas) {
    const dadosBackupConta = dadosBackup.get(conta.id);

    if (dadosBackupConta) {
      try {
        const updateData: { nomeConta?: string; classificacao?: string } = {};
        
        // Função para contar caracteres corrompidos
        const contarCorrupcao = (str: string): number => {
          return (str.match(/\?\?/g) || []).length + (str.match(/Ã/g) || []).length;
        };
        
        // Atualizar nomeConta se o backup for melhor
        if (dadosBackupConta.nomeConta && dadosBackupConta.nomeConta !== conta.nomeConta) {
          const corrupcaoAtual = contarCorrupcao(conta.nomeConta || '');
          const corrupcaoBackup = contarCorrupcao(dadosBackupConta.nomeConta);
          
          if (corrupcaoBackup === 0 || corrupcaoBackup < corrupcaoAtual) {
            updateData.nomeConta = dadosBackupConta.nomeConta;
          }
        }

        // Mesma lógica para classificacao
        if (dadosBackupConta.classificacao && dadosBackupConta.classificacao !== conta.classificacao) {
          const corrupcaoAtual = contarCorrupcao(conta.classificacao || '');
          const corrupcaoBackup = contarCorrupcao(dadosBackupConta.classificacao);
          
          if (corrupcaoBackup === 0 || corrupcaoBackup < corrupcaoAtual) {
            updateData.classificacao = dadosBackupConta.classificacao;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.contaCatalogo.update({
            where: { id: conta.id },
            data: updateData,
          });
          restauradas++;

          if (restauradas <= 5) {
            console.log(`   ✅ Restaurado (ID: ${conta.id.substring(0, 8)}...):`);
            if (updateData.nomeConta) {
              console.log(`      Nome: "${conta.nomeConta?.substring(0, 40)}" → "${updateData.nomeConta.substring(0, 40)}"`);
            }
          }
        } else {
          semAlteracao++;
        }
      } catch (error) {
        console.error(`   ❌ Erro ao restaurar conta ${conta.id}:`, error);
      }
    } else {
      naoEncontradas++;
    }
  }

  console.log(`\n✅ Restauração de ContaCatalogo concluída!`);
  console.log(`   ✅ Contas restauradas: ${restauradas}`);
  console.log(`   ⚠️ Contas não encontradas no backup: ${naoEncontradas}`);
  console.log(`   ⚠️ Contas sem alteração necessária: ${semAlteracao}`);
}

restaurarDadosEncoding()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
