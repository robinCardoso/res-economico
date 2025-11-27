import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import type {
  RelatorioResultado,
  ContaRelatorio,
} from './dto/relatorio-resultado.dto';
import type {
  RelatorioComparativo,
  ContaComparativa,
} from './dto/relatorio-comparativo.dto';
import { TipoRelatorio } from './dto/gerar-relatorio.dto';
import type { Empresa } from '@prisma/client';

@Injectable()
export class RelatoriosService {
  private readonly logger = new Logger(RelatoriosService.name);
  private readonly CACHE_TTL_ANOS = 300; // 5 minutos
  private readonly CACHE_TTL_MESES = 180; // 3 minutos

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Busca anos disponíveis de forma otimizada
   * - Usa query raw SQL (mais eficiente que ORM)
   * - Cache com TTL de 5 minutos
   * - Índices no banco aceleram a query
   */
  async getAnosDisponiveis(): Promise<number[]> {
    const cacheKey = 'relatorios:anos-disponiveis';

    // Tentar buscar do cache primeiro
    const cached = await this.cache.get<number[]>(cacheKey);
    if (cached) {
      this.logger.debug('Anos disponíveis retornados do cache');
      return cached;
    }

    // Query otimizada usando índices
    const result = await this.prisma.$queryRaw<Array<{ ano: number }>>`
      SELECT DISTINCT ano
      FROM "Upload"
      WHERE status IN ('CONCLUIDO', 'COM_ALERTAS')
      ORDER BY ano DESC
    `;

    const anos = result.map((row) => row.ano);

    // Armazenar no cache
    await this.cache.set(cacheKey, anos, this.CACHE_TTL_ANOS);

    return anos;
  }

  /**
   * Busca meses disponíveis de forma otimizada
   * - Usa query raw SQL (mais eficiente que ORM)
   * - Cache com TTL de 3 minutos
   * - Índices no banco aceleram a query
   */
  async getMesesDisponiveis(
    ano: number,
    empresaId?: string,
  ): Promise<number[]> {
    const cacheKey = empresaId
      ? `relatorios:meses-disponiveis:${ano}:${empresaId}`
      : `relatorios:meses-disponiveis:${ano}`;

    // Tentar buscar do cache primeiro
    const cached = await this.cache.get<number[]>(cacheKey);
    if (cached) {
      this.logger.debug(
        `Meses disponíveis para ano ${ano} retornados do cache`,
      );
      return cached;
    }

    // Query otimizada usando índices
    let result: Array<{ mes: number }>;
    if (empresaId) {
      result = await this.prisma.$queryRaw<Array<{ mes: number }>>`
        SELECT DISTINCT mes
        FROM "Upload"
        WHERE ano = ${ano}
          AND status IN ('CONCLUIDO', 'COM_ALERTAS')
          AND "empresaId" = ${empresaId}
        ORDER BY mes ASC
      `;
    } else {
      result = await this.prisma.$queryRaw<Array<{ mes: number }>>`
        SELECT DISTINCT mes
        FROM "Upload"
        WHERE ano = ${ano}
          AND status IN ('CONCLUIDO', 'COM_ALERTAS')
        ORDER BY mes ASC
      `;
    }

    const meses = result.map((row) => row.mes);

    // Armazenar no cache
    await this.cache.set(cacheKey, meses, this.CACHE_TTL_MESES);

    return meses;
  }

  async getDescricoesDisponiveis(busca?: string): Promise<string[]> {
    const descricoesSet = new Set<string>();

    // 1. Buscar do catálogo
    const whereCatalogo: Record<string, unknown> = {
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
    const whereLinhas: Record<string, unknown> = {
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
    let empresas: Empresa[];
    let empresaNome = 'CONSOLIDADO';
    let ufRelatorio: string | undefined;

    if (tipo === TipoRelatorio.FILIAL) {
      if (!empresaId) {
        throw new NotFoundException(
          'empresaId é obrigatório para relatório FILIAL',
        );
      }
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });
      if (!empresa) {
        throw new NotFoundException(
          `Empresa com ID ${empresaId} não encontrada`,
        );
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
          throw new NotFoundException(
            'Nenhuma empresa encontrada com os IDs fornecidos',
          );
        }
        // Usar nome da primeira empresa ou criar nome consolidado
        empresaNome =
          empresas.length === 1 ? empresas[0].razaoSocial : 'CONSOLIDADO';
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
    const normalizarClassificacaoParaChave = (
      classificacao: string,
    ): string => {
      if (!classificacao) return '';
      return classificacao.trim().replace(/\.$/, '');
    };

    // Função para criar chave composta
    const criarChaveComposta = (
      classificacao: string,
      conta: string | null,
      subConta: string | null,
    ): string => {
      const classificacaoNorm = normalizarClassificacaoParaChave(
        classificacao || '',
      );
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
        const classificacao = normalizarClassificacaoParaChave(
          linha.classificacao || '',
        );

        // Ignorar se classificação estiver vazia
        if (!classificacao) {
          continue;
        }

        // Criar chave composta: classificacao + conta + subConta
        const chaveComposta = criarChaveComposta(
          linha.classificacao || '',
          linha.conta,
          linha.subConta,
        );
        const mes = upload.mes;

        // Para consolidado, somar valores de todas as empresas
        // Para filial, já está filtrado por empresaId
        if (!dadosPorMesEChaveComposta.has(chaveComposta)) {
          dadosPorMesEChaveComposta.set(
            chaveComposta,
            new Map<number, number>(),
          );
        }

        const valoresPorMes = dadosPorMesEChaveComposta.get(chaveComposta)!;
        const valorAtual = valoresPorMes.get(mes) || 0;
        
        // Aplicar filtro de descrição se fornecido
        if (descricao && descricao.trim().length > 0) {
          const nomeConta = (linha.nomeConta || '').toLowerCase();
          const busca = descricao.trim().toLowerCase();
          if (!nomeConta.includes(busca)) {
            continue; // Pular linha se não corresponder ao filtro
          }
        }
        
        // Calcular valor do período (movimentação do mês)
        // Para DRE: valor do período = crédito + débito
        // IMPORTANTE: No Excel, o débito já vem com sinal (negativo para redução, positivo para aumento)
        // Então devemos SOMAR (não subtrair) para obter o valor correto do período
        // Exemplo: Crédito: 2.540,67, Débito: -320,78 → Resultado: 2.540,67 + (-320,78) = 2.219,89
        const debito = Number(linha.debito) || 0;
        const credito = Number(linha.credito) || 0;
        let valorLinha = credito + debito;
        
        // Verificar se a conta é uma despesa/custo/dedução pelo nome
        // Contas com prefixo "(-)" ou palavras-chave devem ser negativas
        const nomeConta = (linha.nomeConta || '').toUpperCase();
        const isDespesaCusto = 
          nomeConta.includes('(-)') ||
          nomeConta.includes('DEDUÇÃO') ||
          nomeConta.includes('DEDUÇÕES') ||
          nomeConta.includes('CUSTO') ||
          nomeConta.includes('DESPESA') ||
          nomeConta.startsWith('(-');
        
        // Usar o saldoAtual como referência para determinar o sinal correto
        // Se o saldoAtual tem sinal diferente do valor calculado, usar o sinal do saldoAtual
        const saldoAtual = Number(linha.saldoAtual) || 0;
        if (saldoAtual !== 0 && valorLinha !== 0) {
          const saldoAtualNegativo = saldoAtual < 0;
          const valorCalculadoNegativo = valorLinha < 0;
          
          // Se os sinais são diferentes, usar o sinal do saldoAtual como referência
          // Isso preserva a lógica contábil correta do Excel
          if (saldoAtualNegativo !== valorCalculadoNegativo) {
            valorLinha = saldoAtualNegativo ? -Math.abs(valorLinha) : Math.abs(valorLinha);
          }
        } else if (isDespesaCusto && valorLinha > 0) {
          // Se não temos saldoAtual como referência, mas a conta é claramente uma despesa,
          // inverter o sinal para garantir que apareça como negativa
          valorLinha = -valorLinha;
        }
        
        valoresPorMes.set(mes, valorAtual + valorLinha);
      }
    }

    // 4. Buscar todas as contas DRE do catálogo para construir hierarquia
    // IMPORTANTE: DRE usa apenas contas com tipoConta = "3-DRE"
    // Mas também incluímos contas que têm dados nos uploads, mesmo que não estejam no catálogo
    const whereCatalogo: Record<string, unknown> = {
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
    // Nota: chavesCompostasComDados não é mais necessário, mas mantido para referência

    // Buscar TODAS as classificações DRE dos uploads (não apenas as que têm dados)
    // Isso inclui contas que podem ter valores zerados mas existem nos uploads
    // IMPORTANTE: Incluir conta e subConta para garantir que todas as contas sejam consideradas
    const todasClassificacoesUploads = await this.prisma.linhaUpload.findMany({
      where: {
        uploadId: { in: uploads.map((u) => u.id) },
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
    const classificacoesUnicas = new Map<
      string,
      { conta: string; tipoConta: string; nivel: number }
    >();
    const chavesProcessadas = new Set<string>(); // Para evitar duplicatas

    for (const linha of todasClassificacoesUploads) {
      // Normalizar classificação para garantir consistência
      const classificacaoNormalizada = normalizarClassificacaoParaChave(
        linha.classificacao || '',
      );

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
          if (
            linha.nomeConta &&
            (!existente.conta ||
              linha.nomeConta.length > existente.conta.length)
          ) {
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
    const classificacoesMap = new Map<
      string,
      { conta: string; tipoConta: string; nivel: number }
    >();
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
      contasCatalogo.map((c) => [
        normalizarClassificacaoParaChave(c.classificacao),
        c,
      ]),
    );
    for (const [classificacao, info] of classificacoesMap.entries()) {
      const classificacaoNormalizadaParaBusca =
        normalizarClassificacaoParaChave(classificacao);
      if (!contasCatalogoMap.has(classificacaoNormalizadaParaBusca)) {
        // Adicionar conta que está nos uploads mas não está no catálogo
        // Usar type assertion pois é um objeto temporário para processamento interno
        (contasCatalogo as Array<Record<string, unknown>>).push({
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
        });
      } else {
        // Se está no catálogo mas o nome da conta está vazio ou diferente, atualizar com o dos uploads
        const contaCatalogo = contasCatalogoMap.get(
          classificacaoNormalizadaParaBusca,
        )!;
        if (
          info.conta &&
          (!contaCatalogo.nomeConta || contaCatalogo.nomeConta !== info.conta)
        ) {
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
    for (const [
      chaveComposta,
      valoresPorMes,
    ] of dadosPorMesEChaveComposta.entries()) {
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
      const linhaEncontrada = todasClassificacoesUploads.find((linha) => {
        const linhaChave = criarChaveComposta(
          linha.classificacao || '',
          linha.conta,
          linha.subConta,
        );
        return linhaChave === chaveComposta;
      });

      if (linhaEncontrada) {
        nomeConta = linhaEncontrada.nomeConta || classificacao;
        nivel = linhaEncontrada.nivel || nivel;
      } else {
        // Tentar encontrar no catálogo
        const contaCatalogo = contasCatalogo.find((c) => {
          const catChave = criarChaveComposta(
            c.classificacao,
            c.conta,
            c.subConta,
          );
          return catChave === chaveComposta;
        });

        if (contaCatalogo) {
          nomeConta = contaCatalogo.nomeConta || classificacao;
          nivel = contaCatalogo.nivel || nivel;
        }
      }

      // Aplicar filtro de descrição se fornecido (ao construir hierarquia)
      if (descricao && descricao.trim().length > 0) {
        const nomeContaLower = (nomeConta || '').toLowerCase();
        const busca = descricao.trim().toLowerCase();
        if (!nomeContaLower.includes(busca)) {
          continue; // Pular conta se não corresponder ao filtro
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
      // Usar type assertion pois ContaRelatorio não inclui conta/subConta no tipo base
      // mas precisamos armazená-los para referência interna
      contasMap.set(chaveMapa, {
        classificacao, // Manter original para exibição
        nomeConta,
        nivel,
        valores,
        filhos: [],
        // Armazenar conta e subConta para referência (campos extras não no tipo base)
        conta: conta || undefined,
        subConta: subConta || undefined,
      } as ContaRelatorio & { conta?: string; subConta?: string });
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
        const partesClassificacao = normalizada
          .split('.')
          .filter((p) => p.length > 0);

        // Criar todos os pais necessários (apenas pela classificação, sem conta/subConta)
        for (let i = partesClassificacao.length - 1; i > 0; i--) {
          const partesPai = partesClassificacao.slice(0, i);
          const classificacaoPai = partesPai.join('.');
          const classificacaoPaiNormalizada =
            normalizarClassificacao(classificacaoPai);

          // Verificar se já existe algum pai com essa classificação (pode ter conta/subConta diferentes)
          const existePai = Array.from(contasMap.keys()).some((chave) =>
            chave.startsWith(classificacaoPaiNormalizada + '|'),
          );

          // Se o pai não existe, adicionar à lista para criar
          if (!existePai) {
            contasParaCriar.add(classificacaoPai);
          }
        }
      }

      // Criar contas pai que não existem
      for (const classificacaoPai of contasParaCriar) {
        const classificacaoPaiNormalizada =
          normalizarClassificacao(classificacaoPai);

        // Buscar informações do catálogo ou dos uploads
        let nomeConta = classificacaoPai;
        let nivel = (classificacaoPai.match(/\./g) || []).length + 1;

        // Tentar encontrar no catálogo (usar normalização para comparação)
        const contaCatalogo = contasCatalogo.find((c) => {
          const classificacaoCatalogoNormalizada =
            normalizarClassificacaoParaChave(c.classificacao);
          return (
            classificacaoCatalogoNormalizada === classificacaoPaiNormalizada
          );
        });

        if (contaCatalogo) {
          nomeConta = contaCatalogo.nomeConta || classificacaoPai;
          nivel = contaCatalogo.nivel || nivel;
        } else {
          // Tentar encontrar nos uploads (usar normalização para comparação)
          const linhaEncontrada = todasClassificacoesUploads.find((linha) => {
            const classificacaoLinhaNormalizada =
              normalizarClassificacaoParaChave(linha.classificacao || '');
            return (
              classificacaoLinhaNormalizada === classificacaoPaiNormalizada
            );
          });

          if (linhaEncontrada) {
            nomeConta = linhaEncontrada.nomeConta || classificacaoPai;
            nivel = linhaEncontrada.nivel || nivel;
          }
        }

        // Aplicar filtro de descrição se fornecido (ao criar contas pai)
        // Se o filtro está ativo, só criar contas pai se:
        // 1. A conta pai corresponde ao filtro, OU
        // 2. Algum filho (que já está no contasMap) corresponde ao filtro
        if (descricao && descricao.trim().length > 0) {
          const nomeContaLower = (nomeConta || '').toLowerCase();
          const busca = descricao.trim().toLowerCase();
          const contaPaiCorresponde = nomeContaLower.includes(busca);
          
          // Verificar se algum filho que já está no contasMap corresponde ao filtro
          const temFilhoComFiltro = Array.from(contasMap.keys()).some((chave) => {
            // Verificar se a chave começa com a classificação do pai
            if (!chave.startsWith(classificacaoPaiNormalizada + '|')) {
              return false;
            }
            
            // Buscar a conta no mapa para obter o nome
            const contaFilho = contasMap.get(chave);
            if (contaFilho) {
              const nomeFilho = (contaFilho.nomeConta || '').toLowerCase();
              return nomeFilho.includes(busca);
            }
            return false;
          });
          
          // Se a conta pai não corresponde e nenhum filho corresponde, pular
          if (!contaPaiCorresponde && !temFilhoComFiltro) {
            continue;
          }
        }

        // Criar conta pai com valores zerados (será preenchida pelos filhos)
        const valoresPai: { [mes: number]: number; total: number } = {
          total: 0,
        };
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
      const nivelA = (
        normalizarClassificacao(a.classificacao).match(/\./g) || []
      ).length;
      const nivelB = (
        normalizarClassificacao(b.classificacao).match(/\./g) || []
      ).length;
      if (nivelA !== nivelB) {
        return nivelA - nivelB;
      }

      // Se mesmo nível, verificar se têm a mesma classificação e conta
      const classificacaoA = normalizarClassificacao(a.classificacao);
      const classificacaoB = normalizarClassificacao(b.classificacao);
      const contaA =
        ('conta' in a ? (a as { conta?: string }).conta : undefined) || '';
      const contaB =
        ('conta' in b ? (b as { conta?: string }).conta : undefined) || '';
      const subContaA =
        ('subConta' in a ? (a as { subConta?: string }).subConta : undefined) ||
        '';
      const subContaB =
        ('subConta' in b ? (b as { subConta?: string }).subConta : undefined) ||
        '';

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
      const classificacaoNormalizada = normalizarClassificacao(
        contaRelatorio.classificacao,
      );

      // Criar chave única para verificar se já foi processada
      const conta =
        ('conta' in contaRelatorio
          ? (contaRelatorio as { conta?: string }).conta
          : undefined) || '';
      const subConta =
        ('subConta' in contaRelatorio
          ? (contaRelatorio as { subConta?: string }).subConta
          : undefined) || '';
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
          const classificacaoPaiNormalizada =
            normalizarClassificacao(classificacaoPai);
          // Buscar pai com chave que começa com a classificação do pai
          const chavePai = `${classificacaoPaiNormalizada}||`;
          pai = contasMap.get(chavePai);

          // Se não encontrou com chave vazia, buscar qualquer um que comece com a classificação
          if (!pai) {
            const chavesPai = Array.from(contasMap.keys()).filter((chave) =>
              chave.startsWith(classificacaoPaiNormalizada + '|'),
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
          conta.filhos.sort((a, b) =>
            a.classificacao.localeCompare(b.classificacao),
          );
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

  /**
   * Busca dados de um período específico (mês/ano) para empresas selecionadas
   * Retorna um Map com chave composta (classificacao|conta|subConta) e valor
   */
  private async buscarDadosPeriodo(
    mes: number,
    ano: number,
    empresaIds: string[],
    descricao?: string,
    tipoValor: 'ACUMULADO' | 'PERIODO' = 'ACUMULADO',
  ): Promise<Map<string, number>> {
    // Buscar uploads do período específico
    const uploads = await this.prisma.upload.findMany({
      where: {
        mes,
        ano,
        empresaId: { in: empresaIds },
        status: { in: ['CONCLUIDO', 'COM_ALERTAS'] },
      },
      include: {
        linhas: true,
      },
    });

    const dadosPorChaveComposta = new Map<string, number>();

    // Função auxiliar para normalizar classificação
    const normalizarClassificacaoParaChave = (
      classificacao: string,
    ): string => {
      if (!classificacao) return '';
      return classificacao.trim().replace(/\.$/, '');
    };

    // Função para criar chave composta
    const criarChaveComposta = (
      classificacao: string,
      conta: string | null,
      subConta: string | null,
    ): string => {
      const classificacaoNorm = normalizarClassificacaoParaChave(
        classificacao || '',
      );
      const contaStr = conta || '';
      const subContaStr = subConta || '';
      return `${classificacaoNorm}|${contaStr}|${subContaStr}`;
    };

    // Aplicar filtro por descrição se fornecido
    const descricaoLower = descricao?.trim().toLowerCase() || '';

    for (const upload of uploads) {
      for (const linha of upload.linhas) {
        // Filtrar apenas linhas DRE
        if (linha.tipoConta !== '3-DRE') {
          continue;
        }

        // Aplicar filtro por descrição
        if (descricaoLower && linha.nomeConta) {
          if (!linha.nomeConta.toLowerCase().includes(descricaoLower)) {
            continue;
          }
        }

        const classificacao = normalizarClassificacaoParaChave(
          linha.classificacao || '',
        );
        if (!classificacao) {
          continue;
        }

        const chaveComposta = criarChaveComposta(
          linha.classificacao || '',
          linha.conta,
          linha.subConta,
        );

        let valorLinha: number;
        if (tipoValor === 'PERIODO') {
          // Valor do período: movimentação do mês
          // Para DRE: crédito - débito
          // (crédito já vem com sinal do Excel, débito também)
          const debito = Number(linha.debito) || 0;
          const credito = Number(linha.credito) || 0;
          valorLinha = credito - debito;
        } else {
          // Valor acumulado (padrão)
          valorLinha = Number(linha.saldoAtual) || 0;
        }

        // Somar valores se já existe a chave
        const valorAtual = dadosPorChaveComposta.get(chaveComposta) || 0;
        dadosPorChaveComposta.set(chaveComposta, valorAtual + valorLinha);
      }
    }

    return dadosPorChaveComposta;
  }

  /**
   * Gera relatório comparativo entre dois períodos
   */
  async gerarRelatorioComparativo(
    tipoComparacao: string,
    mes1: number,
    ano1: number,
    mes2: number,
    ano2: number,
    tipo: TipoRelatorio,
    empresaId?: string,
    empresaIds?: string[],
    descricao?: string,
    tipoValor: 'ACUMULADO' | 'PERIODO' = 'ACUMULADO',
  ): Promise<RelatorioComparativo> {
    // 1. Buscar empresas conforme tipo (mesma lógica do gerarRelatorioResultado)
    let empresas: Empresa[];
    let empresaNome = 'CONSOLIDADO';
    let ufRelatorio: string | undefined;

    if (tipo === TipoRelatorio.FILIAL) {
      if (!empresaId) {
        throw new NotFoundException(
          'empresaId é obrigatório para relatório FILIAL',
        );
      }
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
      });
      if (!empresa) {
        throw new NotFoundException(
          `Empresa com ID ${empresaId} não encontrada`,
        );
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
          throw new NotFoundException(
            'Nenhuma empresa encontrada com os IDs fornecidos',
          );
        }
        empresaNome =
          empresas.length === 1 ? empresas[0].razaoSocial : 'CONSOLIDADO';
        ufRelatorio = empresas[0]?.uf || undefined;
      } else {
        empresas = await this.prisma.empresa.findMany();
        empresaNome = 'CONSOLIDADO';
        ufRelatorio = empresas[0]?.uf || undefined;
      }
    }

    const empresaIdsList = empresas.map((e) => e.id);

    // 2. Buscar dados dos dois períodos
    const dadosPeriodo1 = await this.buscarDadosPeriodo(
      mes1,
      ano1,
      empresaIdsList,
      descricao,
      tipoValor,
    );
    const dadosPeriodo2 = await this.buscarDadosPeriodo(
      mes2,
      ano2,
      empresaIdsList,
      descricao,
      tipoValor,
    );

    // 3. Criar conjunto de todas as chaves (período 1 + período 2)
    const todasChaves = new Set<string>();
    dadosPeriodo1.forEach((valor, chave) => {
      todasChaves.add(chave);
    });
    dadosPeriodo2.forEach((valor, chave) => {
      todasChaves.add(chave);
    });

    // 4. Buscar informações das contas no catálogo
    const contasCatalogo = await this.prisma.contaCatalogo.findMany({
      where: {
        tipoConta: '3-DRE',
        ...(descricao && descricao.trim().length > 0
          ? {
              nomeConta: {
                contains: descricao.trim(),
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: [{ classificacao: 'asc' }],
    });

    // 5. Criar mapa de contas comparativas
    const contasMap = new Map<string, ContaComparativa>();

    // Função auxiliar para normalizar classificação
    const normalizarClassificacaoParaChave = (
      classificacao: string,
    ): string => {
      if (!classificacao) return '';
      return classificacao.trim().replace(/\.$/, '');
    };

    // Processar cada chave composta
    for (const chaveComposta of todasChaves) {
      const [classificacao, conta, subConta] = chaveComposta.split('|');
      const classificacaoNorm = normalizarClassificacaoParaChave(classificacao);

      const valorPeriodo1 = dadosPeriodo1.get(chaveComposta) || 0;
      const valorPeriodo2 = dadosPeriodo2.get(chaveComposta) || 0;
      const diferenca = valorPeriodo2 - valorPeriodo1;
      const percentual =
        valorPeriodo1 !== 0
          ? (diferenca / Math.abs(valorPeriodo1)) * 100
          : valorPeriodo2 !== 0
            ? 100
            : 0;

      // Buscar informações da conta no catálogo ou nos uploads
      let nomeConta = classificacao;
      let nivel = 0;

      // Tentar encontrar no catálogo
      const contaCatalogo = contasCatalogo.find(
        (c) =>
          normalizarClassificacaoParaChave(c.classificacao) ===
            classificacaoNorm &&
          c.conta === conta &&
          c.subConta === subConta,
      );

      if (contaCatalogo) {
        nomeConta = contaCatalogo.nomeConta || classificacao;
        nivel = contaCatalogo.nivel || 0;
      } else {
        // Buscar nos uploads
        // Nota: conta é obrigatória no schema, então sempre deve ter valor
        // Se conta estiver vazia, buscar apenas por classificação
        const whereLinhaUpload: Record<string, unknown> = {
          tipoConta: '3-DRE',
          classificacao: { contains: classificacao },
        };

        if (conta && conta.trim() !== '') {
          whereLinhaUpload.conta = conta;
        }

        if (subConta && subConta.trim() !== '') {
          whereLinhaUpload.subConta = subConta;
        } else {
          whereLinhaUpload.subConta = null;
        }

        const linhaUpload = await this.prisma.linhaUpload.findFirst({
          where: whereLinhaUpload,
          orderBy: { createdAt: 'desc' },
        });

        if (linhaUpload) {
          nomeConta = linhaUpload.nomeConta || classificacao;
          nivel = linhaUpload.nivel || 0;
        }
      }

      contasMap.set(chaveComposta, {
        classificacao: classificacaoNorm,
        conta: conta || undefined, // Incluir número da conta
        nomeConta,
        nivel,
        valorPeriodo1,
        valorPeriodo2,
        diferenca,
        percentual,
        filhos: [],
      });
    }

    // 6. Construir hierarquia (similar ao relatório de resultado)
    // Função para encontrar classificação pai
    const encontrarPai = (classificacao: string): string | null => {
      const partes = classificacao.split('.').filter((p) => p.length > 0);
      if (partes.length <= 1) return null;
      return partes.slice(0, -1).join('.');
    };

    const raiz: ContaComparativa[] = [];
    const contasProcessadas = new Set<string>();

    // Ordenar contas por classificação
    const contasOrdenadas = Array.from(contasMap.values()).sort((a, b) => {
      // Primeiro, ordenar por classificação
      const comparacao = a.classificacao.localeCompare(b.classificacao);
      if (comparacao !== 0) return comparacao;
      // Se classificação igual, ordenar por nível
      return a.nivel - b.nivel;
    });

    // Criar um mapa auxiliar para buscar contas por classificação (sem conta/subConta)
    const contasPorClassificacao = new Map<string, ContaComparativa[]>();
    for (const [, conta] of contasMap.entries()) {
      const classificacao = conta.classificacao;
      if (!contasPorClassificacao.has(classificacao)) {
        contasPorClassificacao.set(classificacao, []);
      }
      contasPorClassificacao.get(classificacao)!.push(conta);
    }

    for (const contaComparativa of contasOrdenadas) {
      const classificacao = contaComparativa.classificacao;
      const chaveUnica = Array.from(contasMap.entries()).find(
        ([, conta]) => conta === contaComparativa,
      )?.[0];

      if (!chaveUnica || contasProcessadas.has(chaveUnica)) {
        continue;
      }

      let pai: ContaComparativa | undefined = undefined;

      // Buscar pelo pai da classificação
      const classificacaoPai = encontrarPai(classificacao);
      if (classificacaoPai) {
        // Buscar qualquer conta com a classificação pai
        const contasPai = contasPorClassificacao.get(classificacaoPai);
        if (contasPai && contasPai.length > 0) {
          // Pegar a primeira conta pai (ou podemos escolher a mais adequada)
          pai = contasPai[0];
        }
      }

      if (pai) {
        pai.filhos = pai.filhos || [];
        pai.filhos.push(contaComparativa);
      } else {
        raiz.push(contaComparativa);
      }

      contasProcessadas.add(chaveUnica);
    }

    // 7. Calcular totais hierárquicos
    this.calcularTotaisComparativos(raiz);

    // 8. Calcular totais gerais
    let totalPeriodo1 = 0;
    let totalPeriodo2 = 0;

    const calcularTotais = (contas: ContaComparativa[]) => {
      for (const conta of contas) {
        if (!conta.filhos || conta.filhos.length === 0) {
          // Conta folha: somar ao total
          totalPeriodo1 += conta.valorPeriodo1;
          totalPeriodo2 += conta.valorPeriodo2;
        } else {
          // Conta pai: calcular totais dos filhos
          calcularTotais(conta.filhos);
        }
      }
    };

    calcularTotais(raiz);

    const diferencaTotal = totalPeriodo2 - totalPeriodo1;
    const percentualTotal =
      totalPeriodo1 !== 0
        ? (diferencaTotal / Math.abs(totalPeriodo1)) * 100
        : totalPeriodo2 !== 0
          ? 100
          : 0;

    // 9. Criar labels dos períodos
    const mes1Nome =
      this.meses.find((m) => m.mes === mes1)?.nome || `Mês ${mes1}`;
    const mes2Nome =
      this.meses.find((m) => m.mes === mes2)?.nome || `Mês ${mes2}`;

    return {
      periodo1: {
        ano: ano1,
        mes: mes1,
        label: `${mes1Nome}/${ano1}`,
      },
      periodo2: {
        ano: ano2,
        mes: mes2,
        label: `${mes2Nome}/${ano2}`,
      },
      tipo: tipo as 'FILIAL' | 'CONSOLIDADO',
      empresaId: tipo === TipoRelatorio.FILIAL ? empresaId : undefined,
      empresaNome,
      uf: ufRelatorio,
      contas: raiz,
      totais: {
        periodo1: totalPeriodo1,
        periodo2: totalPeriodo2,
        diferenca: diferencaTotal,
        percentual: percentualTotal,
      },
    };
  }

  /**
   * Calcula totais hierárquicos para contas comparativas
   * Contas pai = soma de todas as contas filhas
   */
  private calcularTotaisComparativos(contas: ContaComparativa[]): void {
    for (const conta of contas) {
      if (conta.filhos && conta.filhos.length > 0) {
        // Primeiro, calcular totais dos filhos
        this.calcularTotaisComparativos(conta.filhos);

        // Depois, somar valores dos filhos para o pai
        let valorPeriodo1Pai = 0;
        let valorPeriodo2Pai = 0;

        for (const filho of conta.filhos) {
          valorPeriodo1Pai += filho.valorPeriodo1;
          valorPeriodo2Pai += filho.valorPeriodo2;
        }

        // Atualizar valores do pai
        conta.valorPeriodo1 = valorPeriodo1Pai;
        conta.valorPeriodo2 = valorPeriodo2Pai;
        conta.diferenca = valorPeriodo2Pai - valorPeriodo1Pai;
        conta.percentual =
          valorPeriodo1Pai !== 0
            ? (conta.diferenca / Math.abs(valorPeriodo1Pai)) * 100
            : valorPeriodo2Pai !== 0
              ? 100
              : 0;
      }
    }
  }
}
