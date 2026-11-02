import { Injectable } from '@nestjs/common';
import { PLACEHOLDER } from '@vambe/shared';

@Injectable()
export class AppService {
  getHello(): string {
    return PLACEHOLDER;
  }
}
