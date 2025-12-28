import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da ata é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar token do header
    const authHeader = request.headers.get('authorization');
    
    const response = await fetchWithFallback(`/atas/${id}/export/html`, {
      method: 'GET',
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
        'Accept': 'text/html,application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Erro desconhecido';
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } else {
          errorMessage = await response.text();
        }
      } catch {
        errorMessage = `Status ${response.status}: ${response.statusText}`;
      }
      
      console.error('❌ Erro na resposta do backend:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        error: errorMessage,
      });
      
      throw new Error(`Erro ao gerar HTML: ${errorMessage}`);
    }

    const html = await response.text();
    
    // Buscar nome do arquivo do header Content-Disposition ou gerar um padrão
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `ata-${id}.html`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Retornar HTML como resposta
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao exportar ATA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

