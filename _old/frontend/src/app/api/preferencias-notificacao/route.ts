import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    const response = await fetchWithFallback('/preferencias-notificacao', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Erro ao buscar preferências', message: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Erro ao buscar preferências:', error);
    
    // Verificar se é erro de conexão
    const err = error as { code?: string; message?: string; cause?: { code?: string } };
    const isConnectionError = 
      err.code === 'ECONNREFUSED' ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('ECONNREFUSED') ||
      err.cause?.code === 'ECONNREFUSED';
    
    if (isConnectionError) {
      return NextResponse.json(
        {
          error: 'Erro de conexão',
          message: 'Não foi possível conectar ao backend. Verifique se o servidor está rodando na porta 3000.',
        },
        { status: 503 }, // Service Unavailable
      );
    }
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar preferências',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const response = await fetchWithFallback('/preferencias-notificacao', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Erro ao criar preferências', message: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Erro ao criar preferências:', error);
    
    // Verificar se é erro de conexão
    const err = error as { code?: string; message?: string; cause?: { code?: string } };
    const isConnectionError = 
      err.code === 'ECONNREFUSED' ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('ECONNREFUSED') ||
      err.cause?.code === 'ECONNREFUSED';
    
    if (isConnectionError) {
      return NextResponse.json(
        {
          error: 'Erro de conexão',
          message: 'Não foi possível conectar ao backend. Verifique se o servidor está rodando na porta 3000.',
        },
        { status: 503 }, // Service Unavailable
      );
    }
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao criar preferências',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const response = await fetchWithFallback('/preferencias-notificacao', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Erro ao atualizar preferências', message: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Erro ao atualizar preferências:', error);
    
    // Verificar se é erro de conexão
    const err = error as { code?: string; message?: string; cause?: { code?: string } };
    const isConnectionError = 
      err.code === 'ECONNREFUSED' ||
      err.message?.includes('fetch failed') ||
      err.message?.includes('ECONNREFUSED') ||
      err.cause?.code === 'ECONNREFUSED';
    
    if (isConnectionError) {
      return NextResponse.json(
        {
          error: 'Erro de conexão',
          message: 'Não foi possível conectar ao backend. Verifique se o servidor está rodando na porta 3000.',
        },
        { status: 503 }, // Service Unavailable
      );
    }
    
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar preferências',
      },
      { status: 500 },
    );
  }
}

