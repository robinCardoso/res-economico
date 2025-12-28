import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; comentarioId: string }> }
) {
  try {
    const { id, comentarioId } = await params;
    const body = await request.json();
    
    const authHeader = request.headers.get('authorization');
    
    const response = await fetchWithFallback(`/atas/${id}/comentarios/${comentarioId}`, {
      method: 'PUT',
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comentario: body.comentario,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao atualizar comentário');
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
    console.error('Erro ao atualizar comentário:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar comentário' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; comentarioId: string }> }
) {
  try {
    const { id, comentarioId } = await params;
    
    const authHeader = request.headers.get('authorization');
    
    const response = await fetchWithFallback(`/atas/${id}/comentarios/${comentarioId}`, {
      method: 'DELETE',
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao deletar comentário');
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Erro ao deletar comentário:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao deletar comentário' },
      { status: 500 }
    );
  }
}

