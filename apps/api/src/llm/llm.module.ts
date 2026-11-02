import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { GeminiProvider } from './gemini.provider';
import { LLM_PROVIDER } from './llm-provider';
import { LLM_RATE_LIMITER, RateLimiter } from './rate-limiter';

@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new GeminiProvider(
          config.get('GEMINI_API_KEY'),
          config.get('GEMINI_MODEL'),
        ),
    },
    {
      provide: LLM_RATE_LIMITER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new RateLimiter(config.get('LLM_RPM')),
    },
  ],
  exports: [LLM_PROVIDER, LLM_RATE_LIMITER],
})
export class LlmModule {}
