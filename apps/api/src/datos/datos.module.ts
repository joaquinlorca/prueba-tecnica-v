import { Module } from '@nestjs/common';
import { CargasModule } from '../cargas/cargas.module';
import { DatosController } from './datos.controller';
import { DatosService } from './datos.service';

@Module({
  imports: [CargasModule],
  controllers: [DatosController],
  providers: [DatosService],
})
export class DatosModule {}
