import { Module } from '@nestjs/common';
import { AnalisisModule } from '../analisis/analisis.module';
import { IngestaService } from './ingesta.service';

@Module({
  imports: [AnalisisModule],
  providers: [IngestaService],
  exports: [IngestaService],
})
export class IngestaModule {}
