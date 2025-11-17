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

    // 3. Agrupar dados por mês e classificação
    const dadosPorMesEClassificacao = new Map<string, Map<number, number>>();
    // Map<classificacao, Map<mes, valor>>

    for (const upload of uploads) {
      for (const linha of upload.linhas) {
        const classificacao = linha.classificacao;
        const mes = upload.mes;

        // Para consolidado, somar valores de todas as empresas
        // Para filial, já está filtrado por empresaId
        if (!dadosPorMesEClassificacao.has(classificacao)) {
          dadosPorMesEClassificacao.set(classificacao, new Map<number, number>());
        }

        const valoresPorMes = dadosPorMesEClassificacao.get(classificacao)!;
        const valorAtual = valoresPorMes.get(mes) || 0;
        // Usar saldoAtual como valor principal
        const valorLinha = Number(linha.saldoAtual) || 0;
        valoresPorMes.set(mes, valorAtual + valorLinha);
      }
    }

    // 4. Buscar todas as contas DRE do catálogo para construir hierarquia
    // IMPORTANTE: DRE usa apenas contas com tipoConta = "3-DRE"
    const contasCatalogo = await this.prisma.contaCatalogo.findMany({
      where: {
        tipoConta: '3-DRE', // Filtrar apenas contas DRE
      },
      orderBy: [{ classificacao: 'asc' }],
    });

    // 5. Construir hierarquia de contas
    const contasMap = new Map<string, ContaRelatorio>();

    // Função para normalizar classificação (remove ponto final se existir)
    const normalizarClassificacao = (classificacao: string): string => {
      return classificacao.trim().replace(/\.$/, '');
    };

    // Primeiro, criar todas as contas com valores
    // Usar classificação normalizada como chave para facilitar busca de pais
    for (const conta of contasCatalogo) {
      const classificacaoNormalizada = normalizarClassificacao(conta.classificacao);
      const valoresPorMes = dadosPorMesEClassificacao.get(conta.classificacao) || new Map();
      
      const valores: { [mes: number]: number; total: number } = {
        total: 0,
      };

      // Preencher valores mensais
      for (let mes = 1; mes <= 12; mes++) {
        valores[mes] = valoresPorMes.get(mes) || 0;
        valores.total += valores[mes];
      }

      // Armazenar com classificação original, mas também criar entrada normalizada
      contasMap.set(classificacaoNormalizada, {
        classificacao: conta.classificacao, // Manter original para exibição
        nomeConta: conta.nomeConta,
        nivel: conta.nivel,
        valores,
        filhos: [],
      });
    }

    // 6. Construir árvore hierárquica
    const raiz: ContaRelatorio[] = [];
    const contasProcessadas = new Set<string>();

    // Ordenar contas por nível (do menor para o maior) para garantir que pais sejam processados antes dos filhos
    // Também ordenar por classificação para garantir ordem consistente
    const contasOrdenadas = [...contasCatalogo].sort((a, b) => {
      const nivelA = (normalizarClassificacao(a.classificacao).match(/\./g) || []).length;
      const nivelB = (normalizarClassificacao(b.classificacao).match(/\./g) || []).length;
      if (nivelA !== nivelB) {
        return nivelA - nivelB;
      }
      // Se mesmo nível, ordenar por classificação
      return normalizarClassificacao(a.classificacao).localeCompare(normalizarClassificacao(b.classificacao));
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

    for (const conta of contasOrdenadas) {
      const classificacaoNormalizada = normalizarClassificacao(conta.classificacao);
      const contaRelatorio = contasMap.get(classificacaoNormalizada);
      
      if (!contaRelatorio || contasProcessadas.has(classificacaoNormalizada)) {
        continue;
      }

      const classificacaoPai = encontrarPai(conta.classificacao);
      
      if (classificacaoPai) {
        // Buscar pai no mapa (já está normalizado)
        const pai = contasMap.get(classificacaoPai);
        
        if (pai) {
          pai.filhos = pai.filhos || [];
          pai.filhos.push(contaRelatorio);
        } else {
          // Não tem pai encontrado, é raiz
          raiz.push(contaRelatorio);
        }
      } else {
        // É raiz (ex: "3" ou "3.")
        raiz.push(contaRelatorio);
      }
      
      contasProcessadas.add(classificacaoNormalizada);
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

