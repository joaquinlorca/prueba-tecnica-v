import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { MAX_FILAS_CARGA } from '@vambe/shared';
import { CargasService } from './cargas.service';

const MAX_BYTES = 2 * 1024 * 1024;

@ApiTags('cargas')
@Controller('cargas')
export class CargasController {
  constructor(private readonly cargas: CargasService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  // Margen para reintentos con archivos mal formados; la concurrencia la limita el 409.
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: MAX_BYTES } }),
  )
  @ApiOperation({
    summary: `Sube un CSV (máx. ${MAX_FILAS_CARGA} filas) y lo analiza en segundo plano`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo'],
      properties: { archivo: { type: 'string', format: 'binary' } },
    },
  })
  crear(@UploadedFile() archivo?: { buffer: Buffer }) {
    if (!archivo) {
      throw new BadRequestException('Falta el archivo CSV (campo "archivo").');
    }
    return this.cargas.crear(archivo.buffer.toString('utf8'));
  }

  @Get('actual')
  @ApiOperation({ summary: 'Progreso de la última carga' })
  estado() {
    return this.cargas.estado();
  }
}
