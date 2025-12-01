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
        decisoes: body.decisoes, // Agora é um campo JSON, não precisa stringify
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar decisões');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao atualizar decisões:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar decisões' },
      { status: 500 }
    );
  }
}

