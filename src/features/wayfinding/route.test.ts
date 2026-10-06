import { getSite } from '@taksu/content';
import { describe, expect, it } from 'vitest';
import { describeRoute, findRoute, pointAlong } from './route';

const office = getSite('kantor-layanan')!.map;

describe('findRoute', () => {
  it('finds the shortest corridor path', () => {
    expect(findRoute(office, 'lobby', 'door-kepala')).toEqual([
      'lobby',
      'hub',
      'c2',
      'c1',
      'door-kepala',
    ]);
  });

  it('returns null for unknown nodes', () => {
    expect(findRoute(office, 'lobby', 'nowhere')).toBeNull();
  });

  it('routes every room of every sample from the robot start', () => {
    for (const room of office.rooms) {
      expect(findRoute(office, office.startNodeId, room.doorNodeId)).not.toBeNull();
    }
  });
});

describe('describeRoute', () => {
  it('merges straight corridors and detects left and right turns', () => {
    const path = findRoute(office, 'lobby', 'door-kepala')!;
    expect(describeRoute(office, path)).toEqual({
      steps: [
        { kind: 'start', meters: 9 },
        { kind: 'turn', direction: 'left', meters: 16 },
        { kind: 'turn', direction: 'right', meters: 3 },
        { kind: 'arrive' },
      ],
      meters: 28,
    });
  });
});

describe('pointAlong', () => {
  it('interpolates along the polyline', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(pointAlong(points, 0.5)).toEqual({ x: 10, y: 0 });
    expect(pointAlong(points, 0.75)).toEqual({ x: 10, y: 5 });
    expect(pointAlong(points, 1)).toEqual({ x: 10, y: 10 });
  });
});
