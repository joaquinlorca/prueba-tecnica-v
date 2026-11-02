// test
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let ahora: number;
  let esperas: number[];
  let limiter: RateLimiter;

  beforeEach(() => {
    ahora = 1_000_000;
    esperas = [];
    jest.spyOn(Date, 'now').mockImplementation(() => ahora);
    limiter = new RateLimiter(60, (ms) => {
      esperas.push(ms);
      return Promise.resolve();
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('con 60 rpm reparte los turnos cada 1 segundo, aunque se pidan a la vez', async () => {
    await Promise.all([
      limiter.esperarTurno(),
      limiter.esperarTurno(),
      limiter.esperarTurno(),
    ]);
    expect(esperas).toEqual([0, 1000, 2000]);
  });

  it('no espera si ya pasó el intervalo', async () => {
    await limiter.esperarTurno();
    ahora += 5000;
    await limiter.esperarTurno();
    expect(esperas).toEqual([0, 0]);
  });
});
