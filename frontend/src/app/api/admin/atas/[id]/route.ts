import { NextRequest, NextResponse } from 'next/server';
import { mapStatusToFrontend, mapTipoReuniaoToFrontend } from '@/lib/utils/atas-mapping';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar token do header
    const authHeader = request.headers.get('authorization');
    
    const response = await fetchWithFallback(`/atas/${id}`, {
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Ata não encontrada');
    }

    const data = await response.json();
    
    // Função auxiliar para parsear campos JSON
    const parseJsonField = (field: unknown): unknown[] => {
      if (!field) return [];
      try {
        if (Array.isArray(field)) {
          return field;
        }
        if (typeof field === 'string') {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [];
        }
        return [];
      } catch {
        return [];
      }
    };

    // Transformar dados para o formato esperado pelo frontend (igual ao painel-completo)
    const ataTransformada = {
      id: data.id,
      titulo: data.titulo,
      data_reuniao: data.dataReuniao,
      tipo_reuniao: mapTipoReuniaoToFrontend(data.tipo),
      descricao: data.descricao || null,
      conteudo: data.conteudo || '',
      resumo: data.resumo || null,
      status: mapStatusToFrontend(data.status),
      participantes: Array.isArray(data.participantes) 
        ? data.participantes.map((p: { usuario?: { nome?: string }; nomeExterno?: string; cargo?: string; presente?: boolean }) => ({
            nome: p.usuario?.nome || p.nomeExterno || 'Participante',
            cargo: p.cargo || undefined,
            presente: p.presente ?? true,
          }))
        : [],
      pautas: (() => {
        const parsed = parseJsonField(data.pautas);
        if (parsed.length > 0) return parsed;
        if (data.pauta) {
          return [{
            titulo: 'Pauta da Reunião',
            descricao: data.pauta,
          }];
        }
        return [];
      })(),
      decisoes: parseJsonField(data.decisoes),
      acoes: parseJsonField(data.acoes),
      gerado_por_ia: data.geradoPorIa ?? false,
      ia_usada: data.iaUsada || null,
      modelo_ia: data.modeloIa || null,
      custo_ia: data.custoIa || null,
      tempo_processamento_ia: data.tempoProcessamentoIa || null,
      criado_em: data.createdAt,
      arquivo_original_url: data.arquivoOriginalUrl || (data.anexos && data.anexos.length > 0 ? data.anexos[0].urlArquivo : null),
      arquivo_original_nome: data.arquivoOriginalNome || (data.anexos && data.anexos.length > 0 ? data.anexos[0].nomeArquivo : null),
      arquivo_original_tipo: data.arquivoOriginalTipo || (data.anexos && data.anexos.length > 0 ? data.anexos[0].tipoArquivo : null),
    };

    return NextResponse.json(ataTransformada);
  } catch (error: unknown) {
    console.error('Erro ao buscar ata:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao buscar ata',
        details: 'Verifique se o backend está rodando e se a URL da API está correta.',
      },
      { status: 500 }
    );
  }
}

