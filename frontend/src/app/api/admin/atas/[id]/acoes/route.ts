import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const authHeader = request.headers.get('authorization');
    
    const response = await fetchWithFallback(`/atas/${id}`, {
      method: 'PUT',
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acoes: body.acoes, // Agora é um campo JSON direto, não precisa stringify
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar ações');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao atualizar ações:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar ações' },
      { status: 500 }
    );
  }
}

