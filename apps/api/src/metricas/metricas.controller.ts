import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  type CampoDemanda,
  CampoDemandaSchema,
  type DimensionCierre,
  DimensionCierreSchema,
  type Filtros,
  FiltrosSchema,
} from '@vambe/shared';
import { ApiFiltros } from '../common/swagger';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MetricasService } from './metricas.service';

const filtrosPipe = new ZodValidationPipe(FiltrosSchema);

@ApiTags('metricas')
@ApiFiltros()
@Controller('metricas')
export class MetricasController {
  constructor(private readonly metricas: MetricasService) {}

  @Get('resumen')
  @ApiOperation({
    summary: 'KPIs: total, tasa de cierre, volumen y cobertura del análisis',
  })
  resumen(@Query(filtrosPipe) filtros: Filtros) {
    return this.metricas.resumen(filtros);
  }

  @Get('cierre')
  @ApiOperation({ summary: '¿Qué leads cierran? Tasa de cierre por dimensión' })
  @ApiQuery({ name: 'dimension', enum: DimensionCierreSchema.options })
  cierre(
    @Query('dimension', new ZodValidationPipe(DimensionCierreSchema))
    dimension: DimensionCierre,
    @Query(filtrosPipe) filtros: Filtros,
  ) {
    return this.metricas.cierre(dimension, filtros);
  }

  @Get('volumen')
  @ApiOperation({ summary: 'Tasa de cierre por tramo de volumen mensual' })
  volumen(@Query(filtrosPipe) filtros: Filtros) {
    return this.metricas.volumen(filtros);
  }

  @Get('vendedores')
  @ApiOperation({
    summary: 'Ranking de vendedores y matriz vendedor × industria',
  })
  vendedores(@Query(filtrosPipe) filtros: Filtros) {
    return this.metricas.vendedores(filtros);
  }

  @Get('demanda')
  @ApiOperation({
    summary: '¿Qué pide el mercado? Frecuencia y cierre por necesidad',
  })
  @ApiQuery({ name: 'campo', enum: CampoDemandaSchema.options })
  demanda(
    @Query('campo', new ZodValidationPipe(CampoDemandaSchema))
    campo: CampoDemanda,
    @Query(filtrosPipe) filtros: Filtros,
  ) {
    return this.metricas.demanda(campo, filtros);
  }

  @Get('tendencia')
  @ApiOperation({ summary: 'Reuniones y tasa de cierre por mes' })
  tendencia(@Query(filtrosPipe) filtros: Filtros) {
    return this.metricas.tendencia(filtros);
  }
}
