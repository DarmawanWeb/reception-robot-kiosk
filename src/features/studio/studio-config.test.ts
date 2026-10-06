import { describe, expect, it } from 'vitest';
import { buildCustomSite, parseStudioConfig } from './studio-config';

describe('studio config', () => {
  it('accepts a valid config and keeps only known menu views', () => {
    const config = parseStudioConfig(
      JSON.stringify({
        robot: 'kiosk',
        base: 'kantor-layanan',
        name: ' Kantor Desa ',
        tagline: '',
        views: ['queue', 'hack'],
      }),
    );
    expect(config).toMatchObject({ robot: 'kiosk', name: 'Kantor Desa', views: ['queue'] });
  });

  it('rejects unknown robots, venues, or broken JSON', () => {
    expect(parseStudioConfig('{bad')).toBeNull();
    expect(
      parseStudioConfig(JSON.stringify({ robot: 'amy', base: 'resort', name: 'x' })),
    ).toBeNull();
    expect(
      parseStudioConfig(JSON.stringify({ robot: 'snow', base: 'mars', name: 'x' })),
    ).toBeNull();
  });

  it('re-labels the base venue', () => {
    const site = buildCustomSite({
      robot: 'snow',
      base: 'resort',
      name: 'Vila Sari',
      tagline: 'Selamat datang',
      views: [],
    });
    expect(site).toMatchObject({
      slug: 'resort',
      name: 'Vila Sari',
      tagline: { id: 'Selamat datang' },
    });
  });
});
