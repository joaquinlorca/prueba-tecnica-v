import {
  Body,
  Controller,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  type Analisis,
  type AnalizarTranscripcion,
  AnalizarTranscripcionSchema,
} from '@vambe/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AnalizadorService } from './analizador.service';

@ApiTags('analisis')
@Controller('analisis')
@UseGuards(ThrottlerGuard)
export class AnalisisController {
  constructor(private readonly analizador: AnalizadorService) {}

  @Post()
  @HttpCode(200)
  // Usa la cuota gratuita de Gemini: 5 análisis por minuto por IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Analiza una transcripción nueva en vivo (no se guarda)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['transcripcion'],
      properties: {
        transcripcion: { type: 'string', minLength: 50, maxLength: 3000 },
      },
    },
  })
  async analizar(
    @Body(new ZodValidationPipe(AnalizarTranscripcionSchema))
    { transcripcion }: AnalizarTranscripcion,
  ): Promise<Analisis> {
    const { resultados } = await this.analizador.analizarLote([
      { id: 1, transcripcion },
    ]);
    const resultado = resultados.get(1);
    if (!resultado) {
      throw new ServiceUnavailableException(
        'El modelo no pudo analizar la transcripción. Intenta de nuevo en unos segundos.',
      );
    }
    return resultado.analisis;
  }
}
