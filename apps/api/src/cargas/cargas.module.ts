import { Module } from '@nestjs/common';
import { IngestaModule } from '../ingesta/ingesta.module';
import { CargasController } from './cargas.controller';
import { CargasService } from './cargas.service';

@Module({
  imports: [IngestaModule],
  controllers: [CargasController],
  providers: [CargasService],
})
export class CargasModule {}
