import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();
    
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    const authHeader = request.headers.get('authorization');

    const response = await fetchWithFallback(
      `/log-alteracoes?${params.toString()}`,
      {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Erro ao buscar logs', message: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Erro ao buscar logs:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao buscar logs',
      },
      { status: 500 },
    );
  }
}

