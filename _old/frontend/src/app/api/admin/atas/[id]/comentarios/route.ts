import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    
    const response = await fetchWithFallback(`/atas/${id}/comentarios`, {
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar comentários');
    }

    const data = await response.json();
    
    // Transformar dados para o formato esperado pelo frontend
    const comentariosTransformados = data.map((comentario: {
      id: string;
      ataId: string;
      comentario: string;
      tipo: string;
      autorId: string;
      createdAt: string;
      comentarioPaiId?: string | null;
      autor?: { nome: string; email: string } | null;
      respostas?: Array<{
        id: string;
        ataId: string;
        comentario: string;
        tipo: string;
        autorId: string;
        createdAt: string;
        comentarioPaiId?: string | null;
        autor?: { nome: string; email: string } | null;
      }>;
    }) => ({
      id: comentario.id,
      ata_id: comentario.ataId,
      comentario: comentario.comentario,
      tipo: comentario.tipo.toLowerCase(),
      autor_id: comentario.autorId,
      criado_em: comentario.createdAt,
      comentario_pai_id: comentario.comentarioPaiId,
      autor: comentario.autor ? {
        name: comentario.autor.nome,
        email: comentario.autor.email,
      } : undefined,
      respostas: comentario.respostas?.map((resposta: {
        id: string;
        ataId: string;
        comentario: string;
        tipo: string;
        autorId: string;
        createdAt: string;
        comentarioPaiId?: string | null;
        autor?: { nome: string; email: string } | null;
      }) => ({
        id: resposta.id,
        ata_id: resposta.ataId,
        comentario: resposta.comentario,
        tipo: resposta.tipo.toLowerCase(),
        autor_id: resposta.autorId,
        criado_em: resposta.createdAt,
        comentario_pai_id: resposta.comentarioPaiId,
        autor: resposta.autor ? {
          name: resposta.autor.nome,
          email: resposta.autor.email,
        } : undefined,
      })) || [],
    }));

    return NextResponse.json(comentariosTransformados);
  } catch (error: unknown) {
    console.error('Erro ao buscar comentários:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar comentários' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const authHeader = request.headers.get('authorization');
    
    // Transformar tipo de comentário para o formato do backend
    const tipoMap: Record<string, string> = {
      'comentario': 'COMENTARIO',
      'sugestao': 'SUGESTAO',
      'aprovacao': 'APROVACAO',
      'reprovacao': 'REPROVACAO',
    };
    
      const response = await fetchWithFallback(`/atas/${id}/comentarios`, {
        method: 'POST',
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comentario: body.comentario,
          tipo: tipoMap[body.tipo] || 'COMENTARIO',
          comentarioPaiId: body.comentario_pai_id || undefined,
        }),
      });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao criar comentário');
    }

    const data = await response.json();
    
    // Transformar resposta para o formato esperado pelo frontend
    const comentarioTransformado = {
      id: data.id,
      ata_id: data.ataId,
      comentario: data.comentario,
      tipo: data.tipo.toLowerCase(),
      autor_id: data.autorId,
      criado_em: data.createdAt,
      comentario_pai_id: data.comentarioPaiId,
      autor: data.autor ? {
        name: data.autor.nome,
        email: data.autor.email,
      } : undefined,
    };

    return NextResponse.json(comentarioTransformado);
  } catch (error: unknown) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar comentário' },
      { status: 500 }
    );
  }
}

