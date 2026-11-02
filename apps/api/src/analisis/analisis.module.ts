import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { AnalizadorService } from './analizador.service';

@Module({
  imports: [LlmModule],
  providers: [AnalizadorService],
  exports: [AnalizadorService],
})
export class AnalisisModule {}
