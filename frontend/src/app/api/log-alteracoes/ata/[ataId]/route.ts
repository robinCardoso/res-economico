import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ataId: string }> },
) {
  try {
    const { ataId } = await params;

    const authHeader = request.headers.get('authorization');

    const response = await fetchWithFallback(
      `/log-alteracoes/ata/${ataId}`,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Erro ao buscar logs da ata', message: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Erro ao buscar logs da ata:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao buscar logs da ata',
      },
      { status: 500 },
    );
  }
}

