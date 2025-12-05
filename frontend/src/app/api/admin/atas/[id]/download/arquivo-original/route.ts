import { NextRequest, NextResponse } from 'next/server';
import { fetchWithFallback } from '@/lib/utils/api-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar token do header
    const authHeader = request.headers.get('authorization');
    
    const response = await fetchWithFallback(`/atas/${id}/download/arquivo-original`, {
      headers: {
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: 'Erro ao fazer download do arquivo',
          message: errorText || 'Arquivo não encontrado',
        },
        { status: response.status }
      );
    }

    // Obter o blob do arquivo
    const blob = await response.blob();
    
    // Obter o nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'arquivo-original';
    let filenameEncoded = '';
    
    if (contentDisposition) {
      // Tentar obter o filename* (RFC 5987) primeiro, que tem o encoding correto
      const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      if (filenameStarMatch) {
        try {
          filename = decodeURIComponent(filenameStarMatch[1]);
          filenameEncoded = filenameStarMatch[1];
        } catch {
          // Se falhar, tentar o filename normal
          const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
      } else {
        // Fallback para filename normal
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
    }

    // Criar versão ASCII-safe do nome para compatibilidade
    const fileNameAscii = filename
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    // Se não tiver o encoded, criar agora
    if (!filenameEncoded) {
      filenameEncoded = encodeURIComponent(filename)
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');
    }

    // Obter o tipo MIME do header Content-Type
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

    // Retornar o arquivo com os headers corretos usando RFC 5987
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileNameAscii}"; filename*=UTF-8''${filenameEncoded}`,
      },
    });
  } catch (error: unknown) {
    console.error('Erro ao fazer download do arquivo:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao fazer download do arquivo',
        details: 'Verifique se o backend está rodando e se a URL da API está correta.',
      },
      { status: 500 }
    );
  }
}

