import { Module } from '@nestjs/common';
import { ReunionesController } from './reuniones.controller';
import { ReunionesService } from './reuniones.service';

@Module({
  controllers: [ReunionesController],
  providers: [ReunionesService],
})
export class ReunionesModule {}
