import { describe, expect, it } from 'vitest';
import { clientKey, createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('allows up to the limit per window, then asks the visitor to wait', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('a', 1_000).allowed).toBe(true);
    expect(limiter.check('a', 2_000)).toEqual({ allowed: false, retryAfterSeconds: 58 });
    expect(limiter.check('b', 2_000).allowed).toBe(true);
    expect(limiter.check('a', 61_000).allowed).toBe(true);
  });

  it('evicts the stalest key when full', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 2 });
    limiter.check('a', 0);
    limiter.check('b', 0);
    limiter.check('c', 0);
    expect(limiter.check('a', 1).allowed).toBe(true);
  });
});

describe('clientKey', () => {
  it('prefers the Cloudflare visitor IP', () => {
    expect(
      clientKey(new Headers({ 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' })),
    ).toBe('1.2.3.4');
    expect(clientKey(new Headers({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' }))).toBe('5.6.7.8');
    expect(clientKey(new Headers())).toBe('local');
  });
});
