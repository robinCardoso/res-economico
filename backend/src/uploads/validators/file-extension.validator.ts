import { FileValidator } from '@nestjs/common';
import { extname } from 'path';

export class FileExtensionValidator extends FileValidator<
  { allowedExtensions: string[] },
  Express.Multer.File
> {
  buildErrorMessage(file: Express.Multer.File): string {
    const ext = extname(file.originalname).toLowerCase();
    return `Tipo de arquivo inválido. Extensões permitidas: ${this.validationOptions.allowedExtensions.join(', ')}. Arquivo recebido: ${ext || 'sem extensão'}`;
  }

  isValid(file: Express.Multer.File): boolean {
    if (!file || !file.originalname) {
      return false;
    }

    const ext = extname(file.originalname).toLowerCase();
    // Normalizar extensões (garantir que comecem com ponto)
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    const normalizedAllowed = this.validationOptions.allowedExtensions.map(
      (e) => (e.startsWith('.') ? e : `.${e}`),
    );

    return normalizedAllowed.includes(normalizedExt);
  }
}
