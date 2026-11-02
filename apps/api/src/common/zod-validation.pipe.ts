import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

// Valida query o body con un schema de @vambe/shared: el mismo contrato que usa el front.
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(valor: unknown): z.output<T> {
    const resultado = this.schema.safeParse(valor);
    if (!resultado.success) {
      throw new BadRequestException({
        message: 'Parámetros inválidos',
        errores: resultado.error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
        })),
      });
    }
    return resultado.data;
  }
}
