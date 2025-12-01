import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Ler o arquivo PDF
    const filePath = join(process.cwd(), '..', 'arquivos-exemplos', 'ESTATUTO 01 ORIGINAL.pdf');
    const fileBuffer = readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ESTATUTO 01 ORIGINAL.pdf"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Arquivo não encontrado' },
      { status: 404 }
    );
  }
}

