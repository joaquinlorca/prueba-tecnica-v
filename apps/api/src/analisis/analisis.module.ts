import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { AnalisisController } from './analisis.controller';
import { AnalizadorService } from './analizador.service';

@Module({
  imports: [LlmModule],
  controllers: [AnalisisController],
  providers: [AnalizadorService],
  exports: [AnalizadorService],
})
export class AnalisisModule {}
