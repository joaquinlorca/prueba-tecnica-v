import { Controller, Delete } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatosService } from './datos.service';

@ApiTags('datos')
@Controller('datos')
export class DatosController {
  constructor(private readonly datos: DatosService) {}

  @Delete()
  @ApiOperation({
    summary:
      'Borra todas las reuniones, clientes, análisis y vendedores (la taxonomía se mantiene)',
  })
  vaciar() {
    return this.datos.vaciar();
  }
}
