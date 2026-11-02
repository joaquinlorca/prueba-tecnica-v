import { esperar, type Esperar } from '../common/esperar';

export const LLM_RATE_LIMITER = Symbol('LLM_RATE_LIMITER');

// Reparte los requests de forma pareja
// aunque varios lotes pidan turno al mismo tiempo.
export class RateLimiter {
  private proximoTurno = 0;

  constructor(
    private readonly rpm: number,
    private readonly dormir: Esperar = esperar,
  ) {}

  async esperarTurno(): Promise<void> {
    const ahora = Date.now();
    const turno = Math.max(ahora, this.proximoTurno);
    this.proximoTurno = turno + 60_000 / this.rpm;
    await this.dormir(turno - ahora);
  }
}
