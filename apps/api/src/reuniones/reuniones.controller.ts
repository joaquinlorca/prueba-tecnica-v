import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Listado, ListadoSchema } from '@vambe/shared';
import { ApiListado } from '../common/swagger';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ReunionesService } from './reuniones.service';

@ApiTags('reuniones')
@Controller()
export class ReunionesController {
  constructor(private readonly reuniones: ReunionesService) {}

  @Get('reuniones')
  @ApiOperation({ summary: 'Listado paginado con búsqueda y filtros' })
  @ApiListado()
  listar(@Query(new ZodValidationPipe(ListadoSchema)) listado: Listado) {
    return this.reuniones.listar(listado);
  }

  @Get('reuniones/:id')
  @ApiOperation({ summary: 'Detalle con transcripción completa y análisis' })
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.reuniones.detalle(id);
  }

  @Get('catalogos')
  @ApiOperation({ summary: 'Vendedores para los filtros' })
  catalogos() {
    return this.reuniones.catalogos();
  }
}
