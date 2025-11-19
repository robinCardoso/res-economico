import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import type { RelatorioResultado, ContaRelatorio } from './dto/relatorio-resultado.dto';
import { TipoRelatorio } from './dto/gerar-relatorio.dto';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnosDisponiveis(): Promise<number[]> {
    const uploads = await this.prisma.upload.findMany({
      where: {
        status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
      },
      select: {
        ano: true,
      },
      distinct: ['ano'],
      orderBy: {
        ano: 'desc',
      },
    });

    return uploads.map((upload) => upload.ano);
  }

  async getDescricoesDisponiveis(busca?: string): Promise<string[]> {
    const descricoesSet = new Set<string>();

    // 1. Buscar do catálogo
    const whereCatalogo: any = {
      tipoConta: '3-DRE', // Apenas contas DRE
    };

    if (busca && busca.trim().length > 0) {
      whereCatalogo.nomeConta = {
        contains: busca.trim(),
        mode: 'insensitive',
      };
    }

    const contasCatalogo = await this.prisma.contaCatalogo.findMany({
      where: whereCatalogo,
      select: {
        nomeConta: true,
      },
      distinct: ['nomeConta'],
      orderBy: {
        nomeConta: 'asc',
      },
    });

    for (const conta of contasCatalogo) {
      if (conta.nomeConta) {
        descricoesSet.add(conta.nomeConta);
      }
    }

    // 2. Buscar também das linhas de upload (para incluir contas que não estão no catálogo)
    const whereLinhas: any = {
      tipoConta: '3-DRE',
    };

    if (busca && busca.trim().length > 0) {
      whereLinhas.nomeConta = {
        contains: busca.trim(),
        mode: 'insensitive',
      };
    }

    const linhasUpload = await this.prisma.linhaUpload.findMany({
      where: whereLinhas,
      select: {
        nomeConta: true,
      },
      distinct: ['nomeConta'],
      orderBy: {
        nomeConta: 'asc',
      },
      take: 20, // Limitar a 20 resultados para performance
    });

    for (const linha of linhasUpload) {
      if (linha.nomeConta) {
        descricoesSet.add(linha.nomeConta);
      }
    }

    // Converter para array e ordenar
    const descricoes = Array.from(descricoesSet).sort();
    
    // Limitar a 20 resultados finais
    return descricoes.slice(0, 20);
  }

  private readonly meses = [
    { mes: 1, nome: 'Janeiro' },
    { mes: 2, nome: 'Fevereiro' },
    { mes: 3, nome: 'Março' },
    { mes: 4, nome: 'Abril' },
    { mes: 5, nome: 'Maio' },
    { mes: 6, nome: 'Junho' },
    { mes: 7, nome: 'Julho' },
    { mes: 8, nome: 'Agosto' },
    { mes: 9, nome: 'Setembro' },
    { mes: 10, nome: 'Outubro' },
    { mes: 11, nome: 'Novembro' },
    { mes: 12, nome: 'Dezembro' },
  ];

  async gerarRelatorioResultado(
    ano: number,
    empresaId?: string,
    empresaIds?: string[],
    tipo: TipoRelatorio = TipoRelatorio.CONSOLIDADO,
    descricao?: string,
  ): Promise<RelatorioResultado> {
    // 1. Buscar empresas conforme tipo
    let empresas;
    let empresaNome = 'CONSOLIDADO';
    let ufRelatorio: string | undefined;

    if (tipo === TipoRelatorio.FILIAL) {
      if (!empresaId) {
        throw new NotFoundException('empresaId é obrigatório para relatório FILIAL');
      }
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });
      if (!empresa) {
        throw new NotFoundException(`Empresa com ID ${empresaId} não encontrada`);
      }
      empresas = [empresa];
      empresaNome = empresa.razaoSocial;
      ufRelatorio = empresa.uf || undefined;
    } else {
      // CONSOLIDADO
      if (empresaIds && empresaIds.length > 0) {
        empresas = await this.prisma.empresa.findMany({
          where: { id: { in: empresaIds } },
        });
        if (empresas.length === 0) {
          throw new NotFoundException('Nenhuma empresa encontrada com os IDs fornecidos');
        }
        // Usar nome da primeira empresa ou criar nome consolidado
        empresaNome = empresas.length === 1 ? empresas[0].razaoSocial : 'CONSOLIDADO';
        ufRelatorio = empresas[0]?.uf || undefined;
      } else {
        // Todas as empresas
        empresas = await this.prisma.empresa.findMany();
        empresaNome = 'CONSOLIDADO';
        // Pegar UF mais comum ou da primeira empresa
        ufRelatorio = empresas[0]?.uf || undefined;
      }
    }

    const empresaIdsList = empresas.map((e) => e.id);

    // 2. Buscar todos os uploads do ano para as empresas selecionadas
    const uploads = await this.prisma.upload.findMany({
      where: {
        ano,
        empresaId: { in: empresaIdsList },
        status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
      },
      include: {
        linhas: true,
      },
    });

    if (uploads.length === 0) {
      // Retornar relatório vazio
      return {
        empresaId: tipo === TipoRelatorio.FILIAL ? empresaId : undefined,
        empresaNome,
        uf: ufRelatorio,
        ano,
        tipo: tipo as 'FILIAL' | 'CONSOLIDADO',
        periodo: this.meses,
        contas: [],
      };
    }

    // 3. Agrupar dados por mês e chave composta: classificacao + conta + subConta (APENAS DRE)
    const dadosPorMesEChaveComposta = new Map<string, Map<number, number>>();
    // Map<chaveComposta, Map<mes, valor>>
    // chaveComposta = classificacao|conta|subConta

    // Função auxiliar para normalizar classificação (remove espaços e ponto final)
    // Usada tanto no agrupamento quanto na busca de valores
    const normalizarClassificacaoParaChave = (classificacao: string): string => {
      if (!classificacao) return '';
      return classificacao.trim().replace(/\.$/, '');
    };

    // Função para criar chave composta
    const criarChaveComposta = (classificacao: string, conta: string | null, subConta: string | null): string => {
      const classificacaoNorm = normalizarClassificacaoParaChave(classificacao || '');
      const contaStr = conta || '';
      const subContaStr = subConta || '';
      return `${classificacaoNorm}|${contaStr}|${subContaStr}`;
    };

    for (const upload of uploads) {
      for (const linha of upload.linhas) {
        // IMPORTANTE: Filtrar apenas linhas DRE
        if (linha.tipoConta !== '3-DRE') {
          continue;
        }

        // Normalizar classificação
        const classificacao = normalizarClassificacaoParaChave(linha.classificacao || '');
        
        // Ignorar se classificação estiver vazia
        if (!classificacao) {
          continue;
        }

        // Criar chave composta: classificacao + conta + subConta
        const chaveComposta = criarChaveComposta(linha.classificacao || '', linha.conta, linha.subConta);
        const mes = upload.mes;

        // Para consolidado, somar valores de todas as empresas
        // Para filial, já está filtrado por empresaId
        if (!dadosPorMesEChaveComposta.has(chaveComposta)) {
          dadosPorMesEChaveComposta.set(chaveComposta, new Map<number, number>());
        }

        const valoresPorMes = dadosPorMesEChaveComposta.get(chaveComposta)!;
        const valorAtual = valoresPorMes.get(mes) || 0;
        // Usar saldoAtual como valor principal
        const valorLinha = Number(linha.saldoAtual) || 0;
        valoresPorMes.set(mes, valorAtual + valorLinha);
      }
    }

    // 4. Buscar todas as contas DRE do catálogo para construir hierarquia
    // IMPORTANTE: DRE usa apenas contas com tipoConta = "3-DRE"
    // Mas também incluímos contas que têm dados nos uploads, mesmo que não estejam no catálogo
    const whereCatalogo: any = {
      tipoConta: '3-DRE', // Filtrar apenas contas DRE
    };

    // Aplicar filtro por descrição se fornecido
    if (descricao && descricao.trim().length > 0) {
      whereCatalogo.nomeConta = {
        contains: descricao.trim(),
        mode: 'insensitive',
      };
    }

    const contasCatalogo = await this.prisma.contaCatalogo.findMany({
      where: whereCatalogo,
      orderBy: [{ classificacao: 'asc' }],
    });

    // 4.1. Buscar TODAS as chaves compostas DRE que têm dados nos uploads (mesmo que zerados)
    // Isso garante que todas as contas com dados apareçam no relatório
    const chavesCompostasComDados = Array.from(dadosPorMesEChaveComposta.keys());
    
    // Buscar TODAS as classificações DRE dos uploads (não apenas as que têm dados)
    // Isso inclui contas que podem ter valores zerados mas existem nos uploads
    // IMPORTANTE: Incluir conta e subConta para garantir que todas as contas sejam consideradas
    const todasClassificacoesUploads = await this.prisma.linhaUpload.findMany({
      where: {
        uploadId: { in: uploads.map(u => u.id) },
        tipoConta: '3-DRE',
      },
      select: {
        classificacao: true,
        conta: true,
        subConta: true,
        nomeConta: true,
        tipoConta: true,
        nivel: true,
      },
    });

    // Criar um mapa de classificações com suas informações
    // IMPORTANTE: Usar chave composta (classificacao + conta + subConta) para garantir que todas as contas sejam consideradas
    // Mas para o relatório DRE, agrupamos por classificação (soma de todas as contas com mesma classificação)
    const classificacoesUnicas = new Map<string, { conta: string; tipoConta: string; nivel: number }>();
    const chavesProcessadas = new Set<string>(); // Para evitar duplicatas
    
    for (const linha of todasClassificacoesUploads) {
      // Normalizar classificação para garantir consistência
      const classificacaoNormalizada = normalizarClassificacaoParaChave(linha.classificacao || '');
      
      // Criar chave composta para identificar unicamente cada conta
      const subContaStr = linha.subConta || '';
      const chaveComposta = `${classificacaoNormalizada}|${linha.conta || ''}|${subContaStr}`;
      
      // Usar classificação normalizada como chave do mapa (para agrupamento no relatório)
      const key = classificacaoNormalizada;
      
      // Se ainda não processamos esta combinação específica
      if (!chavesProcessadas.has(chaveComposta)) {
        chavesProcessadas.add(chaveComposta);
        
        // Se a classificação ainda não está no mapa, adicionar
        if (!classificacoesUnicas.has(key)) {
          classificacoesUnicas.set(key, {
            conta: linha.nomeConta || '',
            tipoConta: linha.tipoConta || '',
            nivel: linha.nivel || 0,
          });
        } else {
          // Se já existe, priorizar o nome da conta mais completo
          const existente = classificacoesUnicas.get(key)!;
          if (linha.nomeConta && (!existente.conta || linha.nomeConta.length > existente.conta.length)) {
            classificacoesUnicas.set(key, {
              conta: linha.nomeConta,
              tipoConta: linha.tipoConta || '3-DRE',
              nivel: linha.nivel || existente.nivel,
            });
          }
        }
      }
    }

    // Criar um mapa de classificações com suas informações (apenas DRE)
    const classificacoesMap = new Map<string, { conta: string; tipoConta: string; nivel: number }>();
    for (const [classificacao, info] of classificacoesUnicas.entries()) {
      // Aplicar filtro de descrição também aqui
      if (descricao && descricao.trim().length > 0) {
        const nomeConta = (info.conta || '').toLowerCase();
        const busca = descricao.trim().toLowerCase();
        if (!nomeConta.includes(busca)) {
          continue; // Pular se não corresponder ao filtro
        }
      }
      classificacoesMap.set(classificacao, info);
    }

    // Adicionar contas que estão nos uploads mas não estão no catálogo
    // Usar normalização para garantir que encontre mesmo com pequenas diferenças
    const contasCatalogoMap = new Map(
      contasCatalogo.map(c => [normalizarClassificacaoParaChave(c.classificacao), c])
    );
    for (const [classificacao, info] of classificacoesMap.entries()) {
      const classificacaoNormalizadaParaBusca = normalizarClassificacaoParaChave(classificacao);
      if (!contasCatalogoMap.has(classificacaoNormalizadaParaBusca)) {
        // Adicionar conta que está nos uploads mas não está no catálogo
        contasCatalogo.push({
          id: `temp-${classificacao}`, // ID temporário
          classificacao,
          conta: '', // Será preenchido depois
          subConta: '',
          nomeConta: info.conta,
          tipoConta: info.tipoConta,
          nivel: info.nivel,
          status: 'ATIVA',
          primeiraImportacao: new Date(),
          ultimaImportacao: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      } else {
        // Se está no catálogo mas o nome da conta está vazio ou diferente, atualizar com o dos uploads
        const contaCatalogo = contasCatalogoMap.get(classificacaoNormalizadaParaBusca)!;
        if (info.conta && (!contaCatalogo.nomeConta || contaCatalogo.nomeConta !== info.conta)) {
          // Atualizar o nome da conta do catálogo com o dos uploads (mais recente)
          contaCatalogo.nomeConta = info.conta;
        }
      }
    }

    // 5. Construir hierarquia de contas
    const contasMap = new Map<string, ContaRelatorio>();

    // Função para normalizar classificação (remove ponto final se existir)
    const normalizarClassificacao = (classificacao: string): string => {
      return classificacao.trim().replace(/\.$/, '');
    };

    // Primeiro, processar todas as chaves compostas que têm dados
    // Cada chave composta (classificacao|conta|subConta) será uma linha separada no relatório
    for (const [chaveComposta, valoresPorMes] of dadosPorMesEChaveComposta.entries()) {
      // Separar chave composta: classificacao|conta|subConta
      const partes = chaveComposta.split('|');
      const classificacao = partes[0] || '';
      const conta = partes[1] || '';
      const subConta = partes[2] || '';
      
      const classificacaoNormalizada = normalizarClassificacao(classificacao);
      
      // Criar chave única para o mapa (incluir conta e subConta para diferenciar)
      const chaveMapa = `${classificacaoNormalizada}|${conta}|${subConta}`;
      
      // Se já está no mapa, pular (não deve acontecer, mas por segurança)
      if (contasMap.has(chaveMapa)) {
        continue;
      }

      // Buscar informações da linha nos uploads
      let nomeConta = classificacao;
      let nivel = (classificacao.match(/\./g) || []).length + 1;
      
      // Buscar linha correspondente nos uploads
      const linhaEncontrada = todasClassificacoesUploads.find(
        (linha) => {
          const linhaChave = criarChaveComposta(linha.classificacao || '', linha.conta, linha.subConta);
          return linhaChave === chaveComposta;
        }
      );
      
      if (linhaEncontrada) {
        nomeConta = linhaEncontrada.nomeConta || classificacao;
        nivel = linhaEncontrada.nivel || nivel;
      } else {
        // Tentar encontrar no catálogo
        const contaCatalogo = contasCatalogo.find(
          (c) => {
            const catChave = criarChaveComposta(c.classificacao, c.conta, c.subConta);
            return catChave === chaveComposta;
          }
        );
        
        if (contaCatalogo) {
          nomeConta = contaCatalogo.nomeConta || classificacao;
          nivel = contaCatalogo.nivel || nivel;
        }
      }
      
      // Calcular valores
      const valores: { [mes: number]: number; total: number } = {
        total: 0,
      };

      for (let mes = 1; mes <= 12; mes++) {
        valores[mes] = valoresPorMes.get(mes) || 0;
        valores.total += valores[mes];
      }

      // Adicionar ao mapa com chave única (classificacao|conta|subConta)
      contasMap.set(chaveMapa, {
        classificacao, // Manter original para exibição
        nomeConta,
        nivel,
        valores,
        filhos: [],
        // Armazenar conta e subConta para referência
        conta: conta || undefined,
        subConta: subConta || undefined,
      } as any);
    }

    // 6. Criar contas pai automaticamente (mesmo sem dados diretos)
    // Isso garante que a hierarquia seja construída corretamente
    const criarContasPai = () => {
      const contasParaCriar = new Set<string>();
      
      // Coletar todas as classificações que precisam de pais
      // As chaves do mapa são no formato: classificacao|conta|subConta
      for (const chaveMapa of contasMap.keys()) {
        // Extrair apenas a classificação da chave composta
        const partes = chaveMapa.split('|');
        const classificacao = partes[0] || '';
        const normalizada = normalizarClassificacao(classificacao);
        const partesClassificacao = normalizada.split('.').filter((p) => p.length > 0);
        
        // Criar todos os pais necessários (apenas pela classificação, sem conta/subConta)
        for (let i = partesClassificacao.length - 1; i > 0; i--) {
          const partesPai = partesClassificacao.slice(0, i);
          const classificacaoPai = partesPai.join('.');
          const classificacaoPaiNormalizada = normalizarClassificacao(classificacaoPai);
          
          // Verificar se já existe algum pai com essa classificação (pode ter conta/subConta diferentes)
          const existePai = Array.from(contasMap.keys()).some(
            (chave) => chave.startsWith(classificacaoPaiNormalizada + '|')
          );
          
          // Se o pai não existe, adicionar à lista para criar
          if (!existePai) {
            contasParaCriar.add(classificacaoPai);
          }
        }
      }
      
      // Criar contas pai que não existem
      for (const classificacaoPai of contasParaCriar) {
        const classificacaoPaiNormalizada = normalizarClassificacao(classificacaoPai);
        
        // Buscar informações do catálogo ou dos uploads
        let nomeConta = classificacaoPai;
        let nivel = (classificacaoPai.match(/\./g) || []).length + 1;
        
        // Tentar encontrar no catálogo (usar normalização para comparação)
        const contaCatalogo = contasCatalogo.find(
          (c) => {
            const classificacaoCatalogoNormalizada = normalizarClassificacaoParaChave(c.classificacao);
            return classificacaoCatalogoNormalizada === classificacaoPaiNormalizada;
          }
        );
        
        if (contaCatalogo) {
          nomeConta = contaCatalogo.nomeConta || classificacaoPai;
          nivel = contaCatalogo.nivel || nivel;
        } else {
          // Tentar encontrar nos uploads (usar normalização para comparação)
          const linhaEncontrada = todasClassificacoesUploads.find(
            (linha) => {
              const classificacaoLinhaNormalizada = normalizarClassificacaoParaChave(linha.classificacao || '');
              return classificacaoLinhaNormalizada === classificacaoPaiNormalizada;
            }
          );
          
          if (linhaEncontrada) {
            nomeConta = linhaEncontrada.nomeConta || classificacaoPai;
            nivel = linhaEncontrada.nivel || nivel;
          }
        }
        
        // Criar conta pai com valores zerados (será preenchida pelos filhos)
        const valoresPai: { [mes: number]: number; total: number } = { total: 0 };
        for (let mes = 1; mes <= 12; mes++) {
          valoresPai[mes] = 0;
        }
        
        // Criar chave para o pai (sem conta/subConta específicos, usar vazio)
        const chavePai = `${classificacaoPaiNormalizada}||`;
        contasMap.set(chavePai, {
          classificacao: classificacaoPai,
          nomeConta,
          nivel,
          valores: valoresPai,
          filhos: [],
        });
      }
    };
    
    // Criar todas as contas pai necessárias
    criarContasPai();

    // 7. Construir árvore hierárquica
    const raiz: ContaRelatorio[] = [];
    const contasProcessadas = new Set<string>();

    // Ordenar contas por nível (do menor para o maior) para garantir que pais sejam processados antes dos filhos
    // Também ordenar por classificação para garantir ordem consistente
    // IMPORTANTE: Contas sem subConta devem ser processadas antes das contas com subConta (mesma classificação e conta)
    const todasContas = Array.from(contasMap.values());
    const contasOrdenadas = todasContas.sort((a, b) => {
      const nivelA = (normalizarClassificacao(a.classificacao).match(/\./g) || []).length;
      const nivelB = (normalizarClassificacao(b.classificacao).match(/\./g) || []).length;
      if (nivelA !== nivelB) {
        return nivelA - nivelB;
      }
      
      // Se mesmo nível, verificar se têm a mesma classificação e conta
      const classificacaoA = normalizarClassificacao(a.classificacao);
      const classificacaoB = normalizarClassificacao(b.classificacao);
      const contaA = (a as any).conta || '';
      const contaB = (b as any).conta || '';
      const subContaA = (a as any).subConta || '';
      const subContaB = (b as any).subConta || '';
      
      // Se têm a mesma classificação e conta, ordenar: sem subConta primeiro, depois com subConta
      if (classificacaoA === classificacaoB && contaA === contaB) {
        if (subContaA === '' && subContaB !== '') {
          return -1; // A (sem subConta) vem antes de B (com subConta)
        }
        if (subContaA !== '' && subContaB === '') {
          return 1; // B (sem subConta) vem antes de A (com subConta)
        }
        // Se ambas têm ou não têm subConta, ordenar por subConta
        return subContaA.localeCompare(subContaB);
      }
      
      // Se mesmo nível mas classificação/conta diferentes, ordenar por classificação
      return classificacaoA.localeCompare(classificacaoB);
    });

    // Função auxiliar para encontrar o pai de uma classificação
    // Exemplo: "3.01.03" -> pai é "3.01"
    const encontrarPai = (classificacao: string): string | null => {
      const normalizada = normalizarClassificacao(classificacao);
      const partes = normalizada.split('.').filter((p) => p.length > 0);
      
      if (partes.length <= 1) {
        return null; // É raiz (ex: "3")
      }
      
      // Remove última parte para encontrar pai
      partes.pop();
      const classificacaoPai = partes.join('.');
      
      return classificacaoPai;
    };

    for (const contaRelatorio of contasOrdenadas) {
      const classificacaoNormalizada = normalizarClassificacao(contaRelatorio.classificacao);
      
      // Criar chave única para verificar se já foi processada
      const conta = (contaRelatorio as any).conta || '';
      const subConta = (contaRelatorio as any).subConta || '';
      const chaveUnica = `${classificacaoNormalizada}|${conta}|${subConta}`;
      
      if (contasProcessadas.has(chaveUnica)) {
        continue;
      }

      let pai: ContaRelatorio | undefined = undefined;

      // IMPORTANTE: Se a conta tem subConta, ela deve ser filha da conta principal (mesma classificação e conta, mas sem subConta)
      if (subConta && subConta.trim() !== '') {
        // Buscar conta pai: mesma classificação e conta, mas sem subConta
        const chavePaiSubConta = `${classificacaoNormalizada}|${conta}|`;
        pai = contasMap.get(chavePaiSubConta);
      }

      // Se não encontrou pai por subConta, buscar pelo pai da classificação (hierarquia normal)
      if (!pai) {
        const classificacaoPai = encontrarPai(contaRelatorio.classificacao);
        
        if (classificacaoPai) {
          // Buscar pai no mapa (pode ter conta/subConta diferentes, buscar qualquer um com essa classificação)
          const classificacaoPaiNormalizada = normalizarClassificacao(classificacaoPai);
          // Buscar pai com chave que começa com a classificação do pai
          const chavePai = `${classificacaoPaiNormalizada}||`;
          pai = contasMap.get(chavePai);
          
          // Se não encontrou com chave vazia, buscar qualquer um que comece com a classificação
          if (!pai) {
            const chavesPai = Array.from(contasMap.keys()).filter(
              (chave) => chave.startsWith(classificacaoPaiNormalizada + '|')
            );
            if (chavesPai.length > 0) {
              pai = contasMap.get(chavesPai[0]);
            }
          }
        }
      }
      
      if (pai) {
        pai.filhos = pai.filhos || [];
        pai.filhos.push(contaRelatorio);
      } else {
        // Não tem pai encontrado, é raiz
        raiz.push(contaRelatorio);
      }
      
      contasProcessadas.add(chaveUnica);
    }

    // Ordenar filhos de cada conta por classificação
    const ordenarFilhos = (contas: ContaRelatorio[]) => {
      for (const conta of contas) {
        if (conta.filhos && conta.filhos.length > 0) {
          conta.filhos.sort((a, b) => a.classificacao.localeCompare(b.classificacao));
          ordenarFilhos(conta.filhos);
        }
      }
    };
    ordenarFilhos(raiz);

    // 7. Calcular totais hierárquicos (contas pai = soma dos filhos)
    this.calcularTotaisHierarquicos(raiz);

    return {
      empresaId: tipo === TipoRelatorio.FILIAL ? empresaId : undefined,
      empresaNome,
      uf: ufRelatorio,
      ano,
      tipo: tipo as 'FILIAL' | 'CONSOLIDADO',
      periodo: this.meses,
      contas: raiz,
    };
  }

  /**
   * Calcula totais hierárquicos recursivamente
   * Contas pai = soma de todas as contas filhas
   */
  private calcularTotaisHierarquicos(contas: ContaRelatorio[]): void {
    for (const conta of contas) {
      if (conta.filhos && conta.filhos.length > 0) {
        // Primeiro, calcular totais dos filhos
        this.calcularTotaisHierarquicos(conta.filhos);

        // Depois, somar valores dos filhos para o pai
        const valoresPai: { [mes: number]: number; total: number } = {
          total: 0,
        };

        for (let mes = 1; mes <= 12; mes++) {
          valoresPai[mes] = 0;
          for (const filho of conta.filhos) {
            valoresPai[mes] += filho.valores[mes] || 0;
          }
          valoresPai.total += valoresPai[mes];
        }

        // Atualizar valores do pai
        conta.valores = valoresPai;
      }
    }
  }
}

